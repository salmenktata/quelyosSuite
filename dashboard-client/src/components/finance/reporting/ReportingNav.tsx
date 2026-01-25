"use client";

import Link from "next/link";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  PieChart,
  Wallet,
  Target,
  LayoutGrid,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";

const reports = [
  {
    id: "hub",
    title: "Hub",
    href: "/dashboard/reporting",
    icon: LayoutGrid,
  },
  {
    id: "overview",
    title: "Vue d'ensemble",
    href: "/dashboard/reporting/overview",
    icon: BarChart3,
  },
  {
    id: "cashflow",
    title: "Trésorerie",
    href: "/dashboard/reporting/cashflow",
    icon: DollarSign,
  },
  {
    id: "by-category",
    title: "Par catégorie",
    href: "/dashboard/reporting/by-category",
    icon: PieChart,
  },
  {
    id: "by-flow",
    title: "Par flux",
    href: "/dashboard/reporting/by-flow",
    icon: TrendingUp,
  },
  {
    id: "by-account",
    title: "Par compte",
    href: "/dashboard/reporting/by-account",
    icon: Wallet,
  },
  {
    id: "by-portfolio",
    title: "Par portefeuille",
    href: "/dashboard/reporting/by-portfolio",
    icon: Briefcase,
  },
  {
    id: "profitability",
    title: "Rentabilité",
    href: "/dashboard/reporting/profitability",
    icon: Target,
  },
];

export function ReportingNav() {
  const { pathname } = useLocation();

  return (
    <div className="mb-4">
      <div className="relative overflow-x-auto pb-2">
        <div className="flex gap-2 min-w-max">
          {reports.map((report) => {
            const Icon = report.icon;
            const isActive = pathname === report.href;

            return (
              <Link
                key={report.id}
                href={report.href}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200",
                  "border border-white/10 backdrop-blur-sm",
                  isActive
                    ? "bg-indigo-500/20 border-indigo-400/30 text-white shadow-lg shadow-indigo-500/20"
                    : "bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white hover:border-white/20"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeReport"
                    className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-lg"
                    transition={{ type: "spring", duration: 0.5 }}
                  />
                )}
                <Icon className={cn("h-4 w-4 relative z-10", isActive && "text-indigo-300")} />
                <span className="text-sm font-medium whitespace-nowrap relative z-10">
                  {report.title}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
