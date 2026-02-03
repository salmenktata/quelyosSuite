"use client";

import { Plus, X, Upload } from "lucide-react";
import { useState } from "react";
import type { EventAnnotation } from "@/lib/finance/reporting";

type EventMarkersProps = {
  events: EventAnnotation[];
  onAdd: (event: { date: string; label: string; description?: string }) => void;
  onDelete: (id: number) => void;
  onImport: (events: Array<{ date: string; label: string }>) => void;
};

export function EventMarkers({
  events,
  onAdd,
  onDelete,
  onImport,
}: EventMarkersProps) {
  const [showForm, setShowForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    date: "",
    label: "",
    description: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(newEvent);
    setNewEvent({ date: "", label: "", description: "" });
    setShowForm(false);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;

      if (file.name.endsWith(".csv")) {
        // Parse CSV: date,label
        const lines = content.split("\n").slice(1); // Skip header
        const parsedEvents = lines
          .map((line) => {
            const [date, label] = line.split(",");
            return { date: date?.trim(), label: label?.trim() };
          })
          .filter((e): e is { date: string; label: string } => !!e.date && !!e.label);

        onImport(parsedEvents);
      } else if (file.name.endsWith(".ics")) {
        // Basic ICS parsing (VEVENT entries)
        const parsedEvents: Array<{ date: string; label: string }> = [];
        const eventMatches = content.matchAll(
          /BEGIN:VEVENT([\s\S]*?)END:VEVENT/g
        );

        for (const match of eventMatches) {
          const eventContent = match[1]!;
          const dateMatch = eventContent.match(/DTSTART[;:](\d{8})/);
          const summaryMatch = eventContent.match(/SUMMARY:(.*)/);

          if (dateMatch && summaryMatch) {
            const dateStr = dateMatch[1]!;
            const date = `${dateStr.slice(0, 4)}-${dateStr.slice(
              4,
              6
            )}-${dateStr.slice(6, 8)}`;
            parsedEvents.push({
              date,
              label: summaryMatch[1]!.trim(),
            });
          }
        }

        onImport(parsedEvents);
      }
    };

    reader.readAsText(file);
    e.target.value = ""; // Reset input
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
          Événements annotés
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({events.length})
          </span>
        </h3>

        <div className="flex gap-2">
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium flex items-center gap-1.5 hover:bg-indigo-700 transition-colors"
          >
            <Plus size={16} />
            Ajouter
          </button>

          <label className="px-3 py-1.5 bg-gray-600 text-white rounded-lg text-sm font-medium flex items-center gap-1.5 hover:bg-gray-700 transition-colors cursor-pointer">
            <Upload size={16} />
            Importer
            <input
              type="file"
              accept=".ics,.csv"
              onChange={handleFileImport}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Add Event Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-gray-50 rounded-lg p-4 border border-gray-200 dark:border-gray-700 space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                Date
              </label>
              <input
                type="date"
                value={newEvent.date}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, date: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                Libellé
              </label>
              <input
                type="text"
                value={newEvent.label}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, label: e.target.value })
                }
                placeholder="Ex: Levée de fonds prévue"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
              Description (optionnel)
            </label>
            <textarea
              value={newEvent.description}
              onChange={(e) =>
                setNewEvent({ ...newEvent, description: e.target.value })
              }
              placeholder="Détails supplémentaires..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-gray-900 dark:text-white bg-white dark:bg-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Créer l&apos;événement
            </button>
          </div>
        </form>
      )}

      {/* Events List */}
      <div className="space-y-2">
        {events.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            Aucun événement annoté. Ajoutez-en un ou importez depuis un
            calendrier.
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id || event.date + event.label}
              className="flex items-start justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {event.label}
                  </span>

                  {/* Type Badge */}
                  {event.type === "auto" && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      Auto {event.confidence ? `(${Math.round(event.confidence * 100)}%)` : ""}
                    </span>
                  )}
                  {event.type === "imported" && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                      Importé
                    </span>
                  )}
                  {event.type === "manual" && (
                    <span className="text-xs bg-gray-200 text-gray-900 dark:text-white px-2 py-0.5 rounded-full">
                      Manuel
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm text-gray-600">
                    {new Date(event.date).toLocaleDateString("fr-FR", {
                      weekday: "short",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>

                {event.description && (
                  <p className="text-sm text-gray-500 mt-1">
                    {event.description}
                  </p>
                )}
              </div>

              {/* Delete button (only for manual/imported events) */}
              {event.type !== "auto" && event.id && (
                <button
                  onClick={() => onDelete(event.id!)}
                  className="ml-3 text-red-600 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                  title="Supprimer"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
