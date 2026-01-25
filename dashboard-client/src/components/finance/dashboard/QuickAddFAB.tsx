

import { memo, useState } from "react";
import { Plus, X } from "lucide-react";

interface QuickAddFABProps {
  onOpenDialog: () => void;
}

/**
 * Floating Action Button for quick transaction entry
 * Features:
 * - Fixed position at bottom-right
 * - Glassmorphic design matching theme
 * - Keyboard shortcut: Cmd/Ctrl + N
 * - Smooth animations
 */
export const QuickAddFAB = memo(function QuickAddFAB({
  onOpenDialog,
}: QuickAddFABProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Keyboard shortcut handler
  useState(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        onOpenDialog();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <>
      {/* Main FAB - Optimized for mobile touch */}
      <button
        onClick={onOpenDialog}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-50 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full border border-white/20 bg-gradient-to-br from-violet-500/90 to-indigo-600/90 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:scale-110 hover:shadow-violet-500/50 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:ring-offset-slate-900 active:scale-95"
        aria-label="Ajouter une transaction rapide (Cmd/Ctrl + N)"
        title="Ajouter une transaction (Cmd/Ctrl + N)"
      >
        <Plus
          className={`h-6 w-6 text-white transition-transform duration-300 ${
            isHovered ? "rotate-90" : "rotate-0"
          }`}
        />

        {/* Ripple effect on click */}
        <span className="absolute inset-0 rounded-full bg-white opacity-0 transition-opacity group-active:opacity-20" />
      </button>

      {/* Tooltip on hover - Hidden on mobile */}
      {isHovered && (
        <div className="fixed bottom-20 right-4 sm:bottom-24 sm:right-8 z-50 hidden sm:block animate-fade-in rounded-lg border border-white/20 bg-slate-900/95 px-3 py-2 backdrop-blur-xl">
          <p className="whitespace-nowrap text-sm font-medium text-white">
            Ajouter une transaction
          </p>
          <p className="text-xs text-slate-400">Cmd/Ctrl + N</p>
        </div>
      )}

      {/* Pulsing ring animation */}
      <div className="pointer-events-none fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-40 h-14 w-14 sm:h-16 sm:w-16 animate-ping rounded-full bg-violet-500/20 opacity-75" />
    </>
  );
});
