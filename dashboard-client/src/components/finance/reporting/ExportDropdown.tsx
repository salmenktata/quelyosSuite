import { Download, Loader2, FileText, FileSpreadsheet, FileDown, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { exportData, type ExportFormat } from "@/lib/utils/export";
import { logger } from '@quelyos/logger';

interface ExportDropdownProps {
  onExport: () => any[][] | Promise<any[][]>;
  filename: string;
  reportTitle?: string;
  className?: string;
}

export function ExportDropdown({
  onExport,
  filename,
  reportTitle: _reportTitle,
  className = ""
}: ExportDropdownProps) {
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = async (format: ExportFormat) => {
    try {
      setLoading(true);
      setIsOpen(false);
      const data = await onExport();
      // Convert 2D array to array of objects for exportData
      if (data.length > 0) {
        const headers = data[0];
        const rows = data.slice(1).map(row => {
          const obj: Record<string, unknown> = {};
          headers.forEach((header, i) => {
            obj[String(header)] = row[i];
          });
          return obj;
        });
        await exportData(rows, format, filename);
      }
    } catch (error) {
      logger.error('Export failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportOptions = [
    {
      format: 'csv' as ExportFormat,
      label: 'CSV',
      icon: FileText,
      description: 'Fichier texte séparé par virgules'
    },
    {
      format: 'excel' as ExportFormat,
      label: 'Excel',
      icon: FileSpreadsheet,
      description: 'Classeur Microsoft Excel (.xlsx)'
    },
    {
      format: 'pdf' as ExportFormat,
      label: 'PDF',
      icon: FileDown,
      description: 'Document PDF formaté'
    }
  ];

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-500/20 px-4 py-2 text-sm font-medium text-indigo-300 transition-colors hover:bg-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        <span>Exporter</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && !loading && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-lg border border-white/10 bg-slate-900/95 backdrop-blur-xl shadow-xl z-50">
          <div className="p-2">
            {exportOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.format}
                  onClick={() => handleExport(option.format)}
                  className="w-full flex items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-white/5"
                >
                  <Icon className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white">{option.label}</div>
                    <div className="text-xs text-slate-400">{option.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
