import { memo } from "react";
import { Link } from "react-router-dom";
import { GlassPanel } from "@/components/ui/glass";
import { DSOCard } from "@/components/kpis/DSOCard";
import { EBITDACard } from "@/components/kpis/EBITDACard";
import { BFRCard } from "@/components/kpis/BFRCard";
import { BreakEvenCard } from "@/components/kpis/BreakEvenCard";
import {
  StaggerContainer,
  StaggerItem,
} from "@/lib/finance/compat/animated";

interface CriticalKPIGridProps {
  days?: number;
}

export const CriticalKPIGrid = memo(function CriticalKPIGrid({
  days = 30,
}: CriticalKPIGridProps) {
  return (
    <GlassPanel gradient="violet" className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">
            KPIs Critiques TPE/PME
          </h2>
          <p className="text-sm text-violet-200">
            Les 4 indicateurs essentiels de pilotage financier
          </p>
        </div>
        <Link
          to="/finance/reporting"
          className="text-sm font-medium text-violet-400 hover:text-violet-300"
        >
          Analyses détaillées →
        </Link>
      </div>

      <StaggerContainer
        speed="fast"
        delay={0.1}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        <StaggerItem>
          <DSOCard days={days} />
        </StaggerItem>

        <StaggerItem>
          <EBITDACard days={days} />
        </StaggerItem>

        <StaggerItem>
          <BFRCard days={days} />
        </StaggerItem>

        <StaggerItem>
          <BreakEvenCard days={days} />
        </StaggerItem>
      </StaggerContainer>
    </GlassPanel>
  );
});
