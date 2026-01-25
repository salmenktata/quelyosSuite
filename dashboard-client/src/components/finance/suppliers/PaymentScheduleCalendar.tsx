"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, AlertTriangle, Building2, FileText } from "lucide-react";
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from "date-fns";
import { fr } from "date-fns/locale";

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  status: string;
  supplier: {
    name: string;
    importance: string;
  };
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
      const [upcomingRes, overdueRes] = await Promise.all([
        fetch("/api/v1/finance/supplier-invoices/upcoming?days=60"),
        fetch("/api/v1/finance/supplier-invoices/overdue"),
      ]);

      if (upcomingRes.ok) {
        const data = await upcomingRes.json();
        setUpcomingInvoices(data.invoices || []);
      }

      if (overdueRes.ok) {
        const data = await overdueRes.json();
        setOverdueInvoices(data.invoices || []);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des factures:", error);
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
  const totalDue = selectedDateInvoices.reduce((sum, inv) => sum + inv.amount, 0);

  // Générer les jours du mois
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getDateStatus = (date: Date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    const invoices = invoicesByDate[dateKey] || [];

    if (invoices.length === 0) return null;

    const hasOverdue = invoices.some((inv) => inv.status === "OVERDUE");
    const total = invoices.reduce((sum, inv) => sum + inv.amount, 0);

    if (hasOverdue) return "overdue";
    if (total > 10000) return "high";
    if (total > 5000) return "medium";
    return "low";
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Calendrier */}
      <Card className="p-6 lg:col-span-2">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
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
            <div className="w-3 h-3 rounded bg-red-500"></div>
            <span>En retard</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-orange-500"></div>
            <span>&gt;10k€</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500"></div>
            <span>&gt;5k€</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span>&lt;5k€</span>
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
                  ${status === "overdue" ? "bg-red-100 text-red-700 hover:bg-red-200" : ""}
                  ${status === "high" ? "bg-orange-100 text-orange-700 hover:bg-orange-200" : ""}
                  ${status === "medium" ? "bg-blue-100 text-blue-700 hover:bg-blue-200" : ""}
                  ${status === "low" ? "bg-green-100 text-green-700 hover:bg-green-200" : ""}
                  ${!status ? "hover:bg-gray-100" : ""}
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
        <h3 className="text-lg font-semibold mb-4">
          {format(selectedDate, "d MMMM yyyy", { locale: fr })}
        </h3>

        {isLoading ? (
          <div className="text-center text-muted-foreground py-8">Chargement...</div>
        ) : selectedDateInvoices.length === 0 ? (
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
                  className="p-3 border rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{invoice.supplier.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {invoice.invoiceNumber}
                      </p>
                    </div>
                    {invoice.status === "OVERDUE" && (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{invoice.amount.toFixed(2)} €</span>
                    <Badge
                      variant={invoice.status === "OVERDUE" ? "destructive" : "default"}
                      className="text-xs"
                    >
                      {invoice.status === "OVERDUE" ? "En retard" : "À payer"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Nombre de factures</span>
                <span className="font-semibold">{selectedDateInvoices.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total du jour</span>
                <span className="text-xl font-bold">{totalDue.toFixed(2)} €</span>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
