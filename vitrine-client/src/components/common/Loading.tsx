'use client';

import React from 'react';

export const LoadingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        {/* Logo animé */}
        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-full mb-6 animate-pulse">
          <span className="text-white font-bold text-3xl">Q</span>
        </div>

        {/* Spinner */}
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>

        {/* Text */}
        <p className="text-gray-600 font-medium">Chargement...</p>
      </div>
    </div>
  );
};

export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className={`relative ${sizeClasses[size]}`}>
      <div className="absolute inset-0 border-gray-200 rounded-full"></div>
      <div className="absolute inset-0 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
};

export default LoadingPage;
