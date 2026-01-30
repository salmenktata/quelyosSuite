import { useCallback, useState, useRef } from "react";
import { Upload, File, X, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { FileUploadZoneProps } from "@/types/import";

const MAX_FILE_SIZE_MB = 15;
const ACCEPTED_EXTENSIONS = ["csv", "xlsx", "xls"];

export function FileUploadZone({
  onFileSelect,
  onError,
  accept = ".csv,.xlsx,.xls",
  maxSizeMB = MAX_FILE_SIZE_MB,
  disabled = false,
  className,
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: _File): boolean => {
    // Vérifier extension
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !ACCEPTED_EXTENSIONS.includes(extension)) {
      onError?.("Format de fichier non supporté. Utilisez CSV ou Excel (.xlsx, .xls).");
      return false;
    }

    // Vérifier taille
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      onError?.(`Le fichier est trop volumineux (${sizeMB.toFixed(1)} MB > ${maxSizeMB} MB)`);
      return false;
    }

    return true;
  };

  const handleFile = useCallback(
    (file: _File) => {
      if (validateFile(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    },
    [onFileSelect, validateFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [disabled, handleFile]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      className={cn("relative", className)}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <Card>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        disabled={disabled}
        className="hidden"
        aria-label="Sélectionner un fichier"
      />

      {!selectedFile ? (
        <div
          className={cn(
            "flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-8 text-center transition-all",
            isDragging
              ? "border-indigo-400 bg-indigo-500/20"
              : "border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <Upload
            className={cn(
              "h-12 w-12 transition-colors",
              isDragging ? "text-indigo-400" : "text-gray-400 dark:text-gray-500"
            )}
          />
          <div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              Glissez-déposez votre fichier ici
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              ou cliquez pour parcourir
            </p>
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-indigo-400 hover:to-purple-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Parcourir les fichiers
          </button>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            CSV, XLS, XLSX · Max {maxSizeMB} MB
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-emerald-500/50 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 p-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <CheckCircle className="h-6 w-6 text-emerald-500 dark:text-emerald-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-gray-900 dark:text-white truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          </div>
          <button
            onClick={clearFile}
            className="rounded-lg border border-gray-300 dark:border-gray-700 p-2 text-gray-600 dark:text-gray-400 transition hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white shrink-0"
            aria-label="Supprimer le fichier"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      </Card>
    </div>
  );
}
