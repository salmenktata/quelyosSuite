

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Edit, Copy, Trash, MoreVertical } from "lucide-react";

type Budget = {
  id: number;
  name: string;
  amount: number;
};

interface BudgetActionMenuProps {
  budget: Budget;
  onEdit?: (budget: Budget) => void;
  onDuplicate?: (budget: Budget) => void;
  onDelete?: (budget: Budget) => void;
}

export function BudgetActionMenu({ budget, onEdit, onDuplicate, onDelete }: BudgetActionMenuProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleView = () => {
    navigate(`/dashboard/budgets/${budget.id}`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    if (onEdit) {
      onEdit(budget);
    } else {
      // Fallback: navigate to detail page
      navigate(`/dashboard/budgets/${budget.id}`);
    }
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    if (onDuplicate) {
      onDuplicate(budget);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    if (onDelete) {
      onDelete(budget);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1 hover:bg-white/10 rounded transition-colors"
        aria-label="Actions"
      >
        <MoreVertical className="w-4 h-4 text-indigo-300" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close menu */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown menu */}
          <div className="absolute right-0 mt-1 w-48 z-20 rounded-xl border border-white/15 bg-indigo-950/95 backdrop-blur-xl shadow-xl overflow-hidden">
            <button
              onClick={handleView}
              className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-white/10 transition-colors flex items-center gap-3"
            >
              <Eye className="w-4 h-4 text-indigo-300" />
              Voir le détail
            </button>

            {onEdit && (
              <button
                onClick={handleEdit}
                className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-white/10 transition-colors flex items-center gap-3"
              >
                <Edit className="w-4 h-4 text-indigo-300" />
                Modifier
              </button>
            )}

            {onDuplicate && (
              <button
                onClick={handleDuplicate}
                className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-white/10 transition-colors flex items-center gap-3"
              >
                <Copy className="w-4 h-4 text-indigo-300" />
                Dupliquer
              </button>
            )}

            {onDelete && (
              <>
                <div className="border-t border-white/10" />
                <button
                  onClick={handleDelete}
                  className="w-full px-4 py-2.5 text-left text-sm text-rose-300 hover:bg-rose-500/10 transition-colors flex items-center gap-3"
                >
                  <Trash className="w-4 h-4" />
                  Supprimer
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
