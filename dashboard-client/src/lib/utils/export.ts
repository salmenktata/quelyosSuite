export type ExportFormat = "csv" | "xlsx" | "excel" | "pdf";

/**
 * Format a date for export filenames or display
 */
export function formatDateForExport(date: Date | string = new Date()): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().split("T")[0]!;
}

/**
 * Generate a filename for exports
 */
export function generateExportFilename(prefix: string, extension: string = "csv"): string {
  return `${prefix}_${formatDateForExport()}.${extension}`;
}

/**
 * Export data to various formats
 */
export async function exportData<T extends Record<string, unknown>>(
  data: T[],
  format: ExportFormat,
  filename: string
): Promise<void> {
  const fullFilename = generateExportFilename(filename, format);

  if (format === "csv") {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]!);
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers.map((h) => JSON.stringify(row[h] ?? "")).join(",")
      ),
    ].join("\n");
    downloadBlob(new Blob([csvContent], { type: "text/csv" }), fullFilename);
  } else if (format === "xlsx" || format === "excel") {
    const ExcelJS = await import("exceljs");
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Data");
    if (data.length > 0) {
      ws.columns = Object.keys(data[0]!).map((key) => ({ header: key, key }));
      data.forEach((row) => ws.addRow(row));
    }
    const buffer = await wb.xlsx.writeBuffer();
    downloadBlob(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), fullFilename);
  }
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Format a date as a key for filenames (YYYYMMDD)
 */
export function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Download array data as CSV
 */
export function downloadCSV(data: (string | number | boolean | null | undefined)[][], filename: string): void {
  const csvContent = data.map(row => row.map(cell => {
    const value = cell == null ? '' : String(cell);
    return value.includes(',') || value.includes('"') || value.includes('\n')
      ? `"${value.replace(/"/g, '""')}"`
      : value;
  }).join(',')).join('\n');

  downloadBlob(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }), filename);
}
