"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SkeletonTable } from "@/components/common";
import { Calendar as CalendarIcon, AlertTriangle, Building2, FileText } from "lucide-react";
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { logger } from '@quelyos/logger';
import { fetchApi } from '@/lib/api-base';

interface Invoice {
  id: number;
  name: string;
  supplierName: string;
  dueDate: string;
  amountResidual: number;
  daysOverdue?: number;
  daysUntilDue?: number;
  urgency?: string;
  isOverdue?: boolean;
}

export default function PaymentScheduleCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [upcomingInvoices, setUpcomingInvoices] = useState<Invoice[]>([]);
  const [overdueInvoices, setOverdueInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const [upcomingData, overdueData] = await Promise.all([
        fetchApi<{ invoices: Invoice[] }>("/api/finance/supplier-invoices/upcoming?days=60"),
        fetchApi<{ invoices: Invoice[] }>("/api/finance/supplier-invoices/overdue"),
      ]);

      setUpcomingInvoices((upcomingData.invoices || []).map((inv: Invoice) => ({ ...inv, isOverdue: false })));
      setOverdueInvoices((overdueData.invoices || []).map((inv: Invoice) => ({ ...inv, isOverdue: true })));
    } catch (error) {
      logger.error("Erreur lors du chargement des factures:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const allInvoices = [...upcomingInvoices, ...overdueInvoices];

  // Grouper les factures par date
  const invoicesByDate = allInvoices.reduce((acc, invoice) => {
    const dateKey = format(new Date(invoice.dueDate), "yyyy-MM-dd");
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(invoice);
    return acc;
  }, {} as Record<string, Invoice[]>);

  // Factures du jour sélectionné
  const selectedDateKey = format(selectedDate, "yyyy-MM-dd");
  const selectedDateInvoices = invoicesByDate[selectedDateKey] || [];

  // Calculer les totaux
  const totalDue = selectedDateInvoices.reduce((sum, inv) => sum + inv.amountResidual, 0);

  // Générer les jours du mois
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getDateStatus = (date: Date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    const invoices = invoicesByDate[dateKey] || [];

    if (invoices.length === 0) return null;

    const hasOverdue = invoices.some((inv) => inv.isOverdue);
    const total = invoices.reduce((sum, inv) => sum + inv.amountResidual, 0);

    if (hasOverdue) return "overdue";
    if (total > 10000) return "high";
    if (total > 5000) return "medium";
    return "low";
  };

  if (isLoading) {
    return <SkeletonTable rows={8} columns={7} />;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Calendrier */}
      <Card className="p-6 lg:col-span-2">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {format(currentMonth, "MMMM yyyy", { locale: fr })}
          </h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth((prev) => addDays(startOfMonth(prev), -1))}
            >
              ←
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(new Date())}
            >
              Aujourd'hui
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth((prev) => addDays(endOfMonth(prev), 1))}
            >
              →
            </Button>
          </div>
        </div>

        {/* Légende */}
        <div className="flex gap-4 mb-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500 dark:bg-red-400"></div>
            <span className="text-gray-900 dark:text-white">En retard</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-orange-500 dark:bg-orange-400"></div>
            <span className="text-gray-900 dark:text-white">&gt;10k€</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500 dark:bg-blue-400"></div>
            <span className="text-gray-900 dark:text-white">&gt;5k€</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500 dark:bg-green-400"></div>
            <span className="text-gray-900 dark:text-white">&lt;5k€</span>
          </div>
        </div>

        {/* Grille calendrier */}
        <div className="grid grid-cols-7 gap-2">
          {/* En-têtes jours */}
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}

          {/* Jours du mois */}
          {days.map((day) => {
            const status = getDateStatus(day);
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentDay = isToday(day);

            return (
              <button
                key={day.toString()}
                onClick={() => setSelectedDate(day)}
                className={`
                  relative aspect-square p-2 text-sm rounded-lg transition
                  ${!isSameMonth(day, currentMonth) ? "text-muted-foreground opacity-50" : ""}
                  ${isSelected ? "ring-2 ring-primary" : ""}
                  ${isCurrentDay ? "font-bold" : ""}
                  ${status === "overdue" ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50" : ""}
                  ${status === "high" ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/50" : ""}
                  ${status === "medium" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50" : ""}
                  ${status === "low" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50" : ""}
                  ${!status ? "text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800" : ""}
                `}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <span>{format(day, "d")}</span>
                  {status && (
                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-current"></div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Détails du jour sélectionné */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {format(selectedDate, "d MMMM yyyy", { locale: fr })}
        </h3>

        {selectedDateInvoices.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>Aucun paiement prévu</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Liste des factures */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {selectedDateInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm text-gray-900 dark:text-white">{invoice.supplierName}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {invoice.name}
                      </p>
                    </div>
                    {invoice.isOverdue && (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900 dark:text-white">{invoice.amountResidual.toFixed(2)} €</span>
                    <Badge
                      variant={invoice.isOverdue ? "destructive" : "default"}
                      className="text-xs"
                    >
                      {invoice.isOverdue ? "En retard" : "À payer"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Nombre de factures</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedDateInvoices.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-900 dark:text-white">Total du jour</span>
                <span className="text-xl font-bold text-gray-900 dark:text-white">{totalDue.toFixed(2)} €</span>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
