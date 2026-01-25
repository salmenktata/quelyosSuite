"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Sparkles, FileText, GitCompare } from "lucide-react";
import PaymentScheduleCalendar from "./PaymentScheduleCalendar";
import OptimizationPanel from "./OptimizationPanel";
import ScenariosPanel from "./ScenariosPanel";
import ScenarioComparison from "./ScenarioComparison";

export default function PaymentPlanningPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Planification des paiements</h1>
        <p className="text-muted-foreground mt-1">
          Optimisez vos paiements fournisseurs et gérez votre trésorerie
        </p>
      </div>

      <Tabs defaultValue="calendar" className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendrier
          </TabsTrigger>
          <TabsTrigger value="optimize" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Optimisation
          </TabsTrigger>
          <TabsTrigger value="scenarios" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Scénarios
          </TabsTrigger>
          <TabsTrigger value="compare" className="flex items-center gap-2">
            <GitCompare className="h-4 w-4" />
            Comparaison
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <PaymentScheduleCalendar />
        </TabsContent>

        <TabsContent value="optimize" className="space-y-4">
          <OptimizationPanel />
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-4">
          <ScenariosPanel />
        </TabsContent>

        <TabsContent value="compare" className="space-y-4">
          <ScenarioComparison />
        </TabsContent>
      </Tabs>
    </div>
  );
}
