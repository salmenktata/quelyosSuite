/**
 * Pagination - Composant de pagination moderne et responsive
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  showFirstLast?: boolean;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  showFirstLast = true,
  className = '',
}) => {
  const generatePageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    pages.push(1);
    
    const leftSibling = Math.max(currentPage - siblingCount, 2);
    const rightSibling = Math.min(currentPage + siblingCount, totalPages - 1);

    if (leftSibling > 2) pages.push('ellipsis');
    for (let i = leftSibling; i <= rightSibling; i++) pages.push(i);
    if (rightSibling < totalPages - 1) pages.push('ellipsis');
    if (totalPages > 1) pages.push(totalPages);

    return pages;
  };

  const pages = generatePageNumbers();

  const handlePageClick = (page: number) => {
    if (page !== currentPage && page >= 1 && page <= totalPages) {
      onPageChange(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (totalPages <= 1) return null;

  return (
    <nav className={"flex items-center justify-center gap-2 " + className} aria-label="Pagination">
      {showFirstLast && currentPage > 1 && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handlePageClick(1)}
          className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-primary transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
          <span className="hidden md:inline">Première</span>
        </motion.button>
      )}

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => handlePageClick(currentPage - 1)}
        disabled={currentPage === 1}
        className={"flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors " + (currentPage === 1 ? 'text-gray-400 bg-gray-100 cursor-not-allowed' : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-primary')}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="hidden sm:inline">Précédent</span>
      </motion.button>

      <div className="flex items-center gap-1">
        {pages.map((page, index) => {
          if (page === 'ellipsis') {
            return <span key={"ellipsis-" + index} className="px-2 py-2 text-gray-400">...</span>;
          }
          const isActive = page === currentPage;
          return (
            <motion.button
              key={page}
              whileHover={{ scale: isActive ? 1 : 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handlePageClick(page)}
              className={"min-w-[40px] h-10 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 " + (isActive ? 'bg-primary text-white shadow-lg scale-110' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-primary')}
            >
              {page}
            </motion.button>
          );
        })}
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => handlePageClick(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={"flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors " + (currentPage === totalPages ? 'text-gray-400 bg-gray-100 cursor-not-allowed' : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-primary')}
      >
        <span className="hidden sm:inline">Suivant</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </motion.button>

      {showFirstLast && currentPage < totalPages && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handlePageClick(totalPages)}
          className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-primary transition-colors"
        >
          <span className="hidden md:inline">Dernière</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </motion.button>
      )}
    </nav>
  );
};

export interface PaginationInfoProps {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  className?: string;
}

export const PaginationInfo: React.FC<PaginationInfoProps> = ({
  currentPage,
  itemsPerPage,
  totalItems,
  className = '',
}) => {
  const start = (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className={"text-sm text-gray-600 " + className}>
      Affichage <span className="font-semibold text-primary">{start}-{end}</span> sur <span className="font-semibold text-primary">{totalItems}</span> article{totalItems > 1 ? 's' : ''}
    </div>
  );
};

export default Pagination;
