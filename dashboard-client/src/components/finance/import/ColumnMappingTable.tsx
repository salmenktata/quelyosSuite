"use client";

import { useState } from "react";
import { CheckCircle, AlertCircle, Info, ChevronDown, X } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass";
import { cn } from "@/lib/utils";
import type { ColumnMappingTableProps, ColumnMapping, FieldType } from "@/types/import";
import { TARGET_FIELDS } from "@/types/import";

export function ColumnMappingTable({
  detectedColumns,
  previewData,
  currentMappings,
  onMappingChange,
  requiredFields,
}: ColumnMappingTableProps) {
  const [showAllRows, setShowAllRows] = useState(false);

  // Get all unique headers from preview data
  const headers = Object.keys(previewData[0] || {});

  // Determine which rows to show
  const displayRows = showAllRows ? previewData : previewData.slice(0, 10);

  // Get confidence badge style
  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 90) {
      return {
        bg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        icon: <CheckCircle className="h-3 w-3" />,
        label: "Excellent",
      };
    }
    if (confidence >= 70) {
      return {
        bg: "bg-blue-500/20 text-blue-300 border-blue-500/30",
        icon: <CheckCircle className="h-3 w-3" />,
        label: "Bon",
      };
    }
    if (confidence >= 50) {
      return {
        bg: "bg-amber-500/20 text-amber-300 border-amber-500/30",
        icon: <AlertCircle className="h-3 w-3" />,
        label: "Moyen",
      };
    }
    return {
      bg: "bg-rose-500/20 text-rose-300 border-rose-500/30",
      icon: <AlertCircle className="h-3 w-3" />,
      label: "Faible",
    };
  };

  // Get current mapping for a field
  const getCurrentMapping = (field: FieldType): ColumnMapping | null => {
    return currentMappings[field] || null;
  };

  // Check if all required fields are mapped
  const requiredFieldsMapped = requiredFields.every(field =>
    currentMappings[field as FieldType] !== undefined
  );

  return (
    <div className="space-y-6">
      {/* Header with status */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Correspondance des colonnes
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Vérifiez et ajustez la correspondance entre vos colonnes et les champs Quelyos
          </p>
        </div>
        {requiredFieldsMapped ? (
          <div className="flex items-center gap-2 text-emerald-300">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Prêt à importer</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-amber-300">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Champs requis manquants</span>
          </div>
        )}
      </div>

      {/* Mapping Controls */}
      <GlassPanel gradient="indigo" className="p-6">
        <div className="space-y-4">
          {TARGET_FIELDS.map((targetField) => {
            const mapping = getCurrentMapping(targetField.value);
            const isRequired = requiredFields.includes(targetField.value);
            const badge = mapping ? getConfidenceBadge(mapping.confidence) : null;

            return (
              <div key={targetField.value} className="flex flex-col sm:flex-row gap-3">
                {/* Target Field Label */}
                <div className="sm:w-48 flex items-center gap-2">
                  <span className={cn(
                    "text-sm font-medium",
                    isRequired ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"
                  )}>
                    {targetField.label}
                  </span>
                  {isRequired && (
                    <span className="text-xs text-rose-400">*</span>
                  )}
                </div>

                {/* Mapping Dropdown */}
                <div className="flex-1 flex items-center gap-3">
                  <select
                    value={mapping?.headerName || ""}
                    onChange={(e) => {
                      const selectedHeader = e.target.value;
                      if (!selectedHeader) {
                        onMappingChange(targetField.value, null);
                      } else {
                        const columnIndex = headers.indexOf(selectedHeader);
                        const detectedMapping = Object.values(detectedColumns).find(
                          (m) => m.headerName === selectedHeader
                        );
                        onMappingChange(targetField.value, {
                          columnIndex,
                          headerName: selectedHeader,
                          confidence: detectedMapping?.confidence || 0,
                        });
                      }
                    }}
                    className={cn(
                      "flex-1 rounded-lg border bg-white dark:bg-gray-800 px-4 py-2 text-sm text-gray-900 dark:text-white transition",
                      "focus:outline-none focus:ring-2 focus:ring-indigo-500",
                      mapping ? "border-gray-300 dark:border-gray-700" : "border-gray-300 dark:border-gray-700",
                      !mapping && isRequired && "border-rose-500"
                    )}
                  >
                    <option value="">-- Non mappé --</option>
                    {headers.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>

                  {/* Confidence Badge */}
                  {mapping && badge && (
                    <div
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium",
                        badge.bg
                      )}
                    >
                      {badge.icon}
                      <span>{badge.label} ({mapping.confidence}%)</span>
                    </div>
                  )}

                  {/* Clear Button */}
                  {mapping && (
                    <button
                      onClick={() => onMappingChange(targetField.value, null)}
                      className="p-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition"
                      aria-label={`Supprimer le mapping pour ${targetField.label}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Required Fields Notice */}
        <div className="mt-6 flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <p>
            Les champs marqués d&apos;un <span className="text-rose-600 dark:text-rose-400">*</span> sont obligatoires.
            Les autres champs sont optionnels et amélioreront la catégorisation automatique.
          </p>
        </div>
      </GlassPanel>

      {/* Preview Table */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Aperçu des données ({displayRows.length} lignes)
        </h4>

        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  #
                </th>
                {headers.map((header) => {
                  // Find which target field this header is mapped to
                  const mappedField = Object.entries(currentMappings).find(
                    ([_, mapping]) => mapping?.headerName === header
                  );
                  const targetField = mappedField
                    ? TARGET_FIELDS.find((f) => f.value === mappedField[0])
                    : null;

                  return (
                    <th
                      key={header}
                      className={cn(
                        "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider",
                        mappedField ? "text-emerald-600 dark:text-emerald-400" : "text-gray-500 dark:text-gray-500"
                      )}
                    >
                      <div className="flex flex-col gap-1">
                        <span>{header}</span>
                        {targetField && (
                          <span className="text-xs font-normal normal-case text-emerald-700 dark:text-emerald-300">
                            → {targetField.label}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {displayRows.map((row, idx) => (
                <tr
                  key={idx}
                  className={cn(
                    "border-b border-gray-100 dark:border-gray-800 transition-colors",
                    idx % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-900",
                    "hover:bg-gray-100 dark:hover:bg-gray-700"
                  )}
                >
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-500 font-mono text-xs">
                    {idx + 1}
                  </td>
                  {headers.map((header) => (
                    <td
                      key={header}
                      className="px-4 py-3 text-gray-700 dark:text-gray-300 max-w-xs truncate"
                      title={String(row[header] || "")}
                    >
                      {String(row[header] || "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Show More/Less Toggle */}
        {previewData.length > 10 && (
          <button
            onClick={() => setShowAllRows(!showAllRows)}
            className="mt-4 flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition"
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                showAllRows && "rotate-180"
              )}
            />
            {showAllRows
              ? "Afficher moins de lignes"
              : `Afficher toutes les lignes (${previewData.length})`}
          </button>
        )}
      </div>
    </div>
  );
}
