import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { downloadCSV, dateKey } from "@/lib/utils/export";
import { logger } from '@quelyos/logger';

interface ExportButtonProps {
  onExport: () => (string | number | boolean | null | undefined)[][] | Promise<(string | number | boolean | null | undefined)[][]>;
  filename: string;
  label?: string;
  className?: string;
}

export function ExportButton({
  onExport,
  filename,
  label = "Exporter CSV",
  className = ""
}: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    try {
      setLoading(true);
      const data = await onExport();
      const filenameWithDate = `${filename}-${dateKey(new Date())}.csv`;
      downloadCSV(data, filenameWithDate);
    } catch (_error) {
      logger.error('Export failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className={`inline-flex items-center gap-2 rounded-lg bg-indigo-500/20 px-4 py-2 text-sm font-medium text-indigo-300 transition-colors hover:bg-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {label}
    </button>
  );
}
