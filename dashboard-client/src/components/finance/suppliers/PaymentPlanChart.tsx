"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import { Card } from "@/components/ui/card";
import { format, eachDayOfInterval, startOfDay, endOfDay } from "date-fns";
import { fr } from "date-fns/locale";

interface PaymentPlanItem {
  invoiceId: string;
  supplierName: string;
  amount: number;
  scheduledDate: string | null;
  penalty?: number;
  discount?: number;
  totalCost?: number;
  status: string;
}

interface PaymentPlanChartProps {
  plan: PaymentPlanItem[];
  availableCash: number;
  targetCashReserve: number;
}

export default function PaymentPlanChart({
  plan,
  availableCash,
  targetCashReserve,
}: PaymentPlanChartProps) {
  const chartData = useMemo(() => {
    // Filtrer les paiements planifiés
    const scheduledPayments = plan.filter(
      (p) => p.status === "SCHEDULED" && p.scheduledDate
    );

    if (scheduledPayments.length === 0) {
      return [];
    }

    // Trouver la plage de dates
    const dates = scheduledPayments.map((p) => new Date(p.scheduledDate!));
    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

    // Générer tous les jours dans la plage
    const allDays = eachDayOfInterval({
      start: startOfDay(minDate),
      end: endOfDay(maxDate),
    });

    // Grouper les paiements par jour
    const paymentsByDay: Record<
      string,
      { payments: number; penalties: number; discounts: number }
    > = {};

    scheduledPayments.forEach((payment) => {
      const dateKey = format(new Date(payment.scheduledDate!), "yyyy-MM-dd");

      if (!paymentsByDay[dateKey]) {
        paymentsByDay[dateKey] = { payments: 0, penalties: 0, discounts: 0 };
      }

      paymentsByDay[dateKey].payments += payment.amount;
      paymentsByDay[dateKey].penalties += payment.penalty || 0;
      paymentsByDay[dateKey].discounts += payment.discount || 0;
    });

    // Créer les données pour le graphique
    let runningBalance = availableCash;
    const data = allDays.map((day) => {
      const dateKey = format(day, "yyyy-MM-dd");
      const dayData = paymentsByDay[dateKey] || {
        payments: 0,
        penalties: 0,
        discounts: 0,
      };

      // Calculer le solde après les paiements du jour
      const totalOut = dayData.payments + dayData.penalties - dayData.discounts;
      runningBalance -= totalOut;

      return {
        date: format(day, "d MMM", { locale: fr }),
        fullDate: dateKey,
        payments: Math.round(dayData.payments * 100) / 100,
        penalties: Math.round(dayData.penalties * 100) / 100,
        discounts: Math.round(dayData.discounts * 100) / 100,
        balance: Math.round(runningBalance * 100) / 100,
        targetReserve: targetCashReserve,
      };
    });

    return data;
  }, [plan, availableCash, targetCashReserve]);

  if (chartData.length === 0) {
    return null;
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-semibold mb-2 text-gray-900 dark:text-white">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value.toFixed(2)} €
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Graphique combiné: Paiements (barres) + Solde (ligne) */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">
          Évolution du solde et paiements planifiés
        </h3>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis
              yAxisId="left"
              label={{ value: "Paiements (€)", angle: -90, position: "insideLeft" }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              label={{ value: "Solde (€)", angle: 90, position: "insideRight" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />

            {/* Barres pour les paiements */}
            <Bar
              yAxisId="left"
              dataKey="payments"
              name="Paiements"
              fill="#3b82f6"
              stackId="a"
            />
            <Bar
              yAxisId="left"
              dataKey="penalties"
              name="Pénalités"
              fill="#ef4444"
              stackId="a"
            />

            {/* Ligne pour le solde */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="balance"
              name="Solde"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 4 }}
            />

            {/* Ligne pour la réserve cible */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="targetReserve"
              name="Réserve cible"
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>

        <div className="mt-4 text-xs text-muted-foreground">
          <p>
            💡 Le graphique montre les paiements quotidiens et l'évolution du solde bancaire. La
            ligne en pointillés orange représente votre réserve de trésorerie cible.
          </p>
        </div>
      </Card>

      {/* Graphique des pénalités vs remises */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Pénalités et remises par jour</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData.filter((d) => d.penalties > 0 || d.discounts > 0)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis label={{ value: "Montant (€)", angle: -90, position: "insideLeft" }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />

            <Bar dataKey="penalties" name="Pénalités" fill="#ef4444" />
            <Bar dataKey="discounts" name="Remises" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-4 text-xs text-muted-foreground">
          <p>
            📊 Ce graphique permet de comparer les pénalités de retard (rouge) aux remises obtenues
            (vert) pour optimiser la stratégie de paiement.
          </p>
        </div>
      </Card>
    </div>
  );
}
