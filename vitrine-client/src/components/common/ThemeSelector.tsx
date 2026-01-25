'use client';

import { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/lib/theme';

interface ThemeSelectorProps {
  variant?: 'dropdown' | 'buttons';
  showLabel?: boolean;
}

export function ThemeSelector({ variant = 'dropdown', showLabel = true }: ThemeSelectorProps) {
  const { theme, setTheme, availableThemes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fermer le dropdown quand on clique ailleurs
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (variant === 'buttons') {
    return (
      <div className="flex flex-wrap gap-2">
        {showLabel && (
          <span className="text-sm font-medium text-foreground mr-2 self-center">Theme:</span>
        )}
        {availableThemes.map((t) => (
          <button
            key={t.name}
            onClick={() => setTheme(t.name)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              theme.name === t.name
                ? 'bg-primary text-white shadow-md'
                : 'bg-muted text-foreground hover:bg-muted/80'
            }`}
          >
            <span className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full border border-white/20"
                style={{ backgroundColor: t.colors.primary }}
              />
              {t.label}
            </span>
          </button>
        ))}
      </div>
    );
  }

  // Variant dropdown (default)
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-sm font-medium transition-all"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span
          className="w-4 h-4 rounded-full border border-border"
          style={{ backgroundColor: theme.colors.primary }}
        />
        {showLabel && <span>{theme.label}</span>}
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-fadeIn">
          <ul role="listbox" className="py-1">
            {availableThemes.map((t) => (
              <li key={t.name}>
                <button
                  onClick={() => {
                    setTheme(t.name);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors ${
                    theme.name === t.name
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-foreground hover:bg-muted'
                  }`}
                  role="option"
                  aria-selected={theme.name === t.name}
                >
                  <span
                    className="w-4 h-4 rounded-full border border-border"
                    style={{ backgroundColor: t.colors.primary }}
                  />
                  {t.label}
                  {theme.name === t.name && (
                    <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default ThemeSelector;
