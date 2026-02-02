'use client';

import React from 'react';

interface EcoScoreProps {
  score?: 'A' | 'B' | 'C' | 'D' | 'E';
  details?: {
    origin?: string;
    packaging?: string;
    carbon?: number;
    recyclable?: boolean;
  };
  compact?: boolean;
}

const SCORE_COLORS = {
  A: { bg: 'bg-green-500', text: 'text-green-600', label: 'Excellent' },
  B: { bg: 'bg-lime-500', text: 'text-lime-600', label: 'Bon' },
  C: { bg: 'bg-yellow-500', text: 'text-yellow-600', label: 'Moyen' },
  D: { bg: 'bg-orange-500', text: 'text-orange-600', label: 'A ameliorer' },
  E: { bg: 'bg-red-500', text: 'text-red-600', label: 'Impact eleve' },
};

export function EcoScore({ score, details, compact = false }: EcoScoreProps) {
  // Score par defaut base sur les details
  const calculatedScore = score || calculateScore(details);
  const scoreConfig = SCORE_COLORS[calculatedScore];

  if (compact) {
    return (
      <div className="inline-flex items-center gap-1.5" title={`Eco-score: ${calculatedScore} - ${scoreConfig.label}`}>
        <div className={`w-6 h-6 ${scoreConfig.bg} rounded-full flex items-center justify-center`}>
          <span className="text-xs font-bold text-white">{calculatedScore}</span>
        </div>
        <span className={`text-xs font-medium ${scoreConfig.text}`}>Eco-score</span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 my-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd" />
          </svg>
          <h4 className="font-semibold text-green-800 dark:text-green-200">Eco-score</h4>
        </div>
        <div className="flex items-center gap-2">
          {['A', 'B', 'C', 'D', 'E'].map((s) => (
            <div
              key={s}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                s === calculatedScore
                  ? `${SCORE_COLORS[s as keyof typeof SCORE_COLORS].bg} text-white scale-125 ring-2 ring-offset-2 ring-${SCORE_COLORS[s as keyof typeof SCORE_COLORS].bg.replace('bg-', '')}`
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}
            >
              {s}
            </div>
          ))}
        </div>
      </div>

      <div className={`text-sm ${scoreConfig.text} font-medium mb-3`}>
        {scoreConfig.label}
      </div>

      {details && (
        <div className="space-y-2 text-sm">
          {details.origin && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-300">Origine</span>
              <span className="font-medium text-gray-900 dark:text-white">{details.origin}</span>
            </div>
          )}
          {details.packaging && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-300">Emballage</span>
              <span className="font-medium text-gray-900 dark:text-white">{details.packaging}</span>
            </div>
          )}
          {details.carbon !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-300">Empreinte carbone</span>
              <span className="font-medium text-gray-900 dark:text-white">{details.carbon} kg CO2</span>
            </div>
          )}
          {details.recyclable !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-300">Recyclable</span>
              <span className={`font-medium ${details.recyclable ? 'text-green-600' : 'text-orange-600'}`}>
                {details.recyclable ? 'Oui' : 'Partiellement'}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          L&apos;eco-score est calcule en fonction de l&apos;origine, l&apos;emballage et l&apos;impact carbone du produit.
        </p>
      </div>
    </div>
  );
}

function calculateScore(details?: EcoScoreProps['details']): 'A' | 'B' | 'C' | 'D' | 'E' {
  if (!details) return 'C'; // Score par defaut

  let points = 50; // Base

  // Origine locale = bonus
  if (details.origin?.toLowerCase().includes('tunisie') || details.origin?.toLowerCase().includes('local')) {
    points += 20;
  } else if (details.origin?.toLowerCase().includes('europe') || details.origin?.toLowerCase().includes('france')) {
    points += 10;
  }

  // Emballage ecologique = bonus
  if (details.packaging?.toLowerCase().includes('recyclé') || details.packaging?.toLowerCase().includes('carton')) {
    points += 15;
  } else if (details.packaging?.toLowerCase().includes('papier')) {
    points += 10;
  }

  // Recyclable
  if (details.recyclable) points += 10;

  // Carbon footprint (moins = mieux)
  if (details.carbon !== undefined) {
    if (details.carbon < 1) points += 15;
    else if (details.carbon < 5) points += 5;
    else if (details.carbon > 10) points -= 15;
  }

  // Convertir en lettre
  if (points >= 80) return 'A';
  if (points >= 60) return 'B';
  if (points >= 40) return 'C';
  if (points >= 20) return 'D';
  return 'E';
}
