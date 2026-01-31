export interface NoticeSection {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  items: string[];
}

export interface PageNoticeConfig {
  pageId: string;
  title: string;
  purpose: string;
  sections: NoticeSection[];
  icon?: React.ComponentType<{ className?: string }>;
  moduleColor?: 'orange' | 'indigo' | 'emerald' | 'violet' | 'pink' | 'gray' | 'teal';
}

export const MODULE_COLOR_CONFIGS = {
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-200 dark:border-orange-800',
    iconBg: 'bg-orange-100 dark:bg-orange-900/30',
    iconText: 'text-orange-600 dark:text-orange-400',
    textPrimary: 'text-orange-900 dark:text-orange-100',
    textSecondary: 'text-orange-700 dark:text-orange-300',
    bullet: 'text-orange-600 dark:text-orange-400',
  },
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    border: 'border-indigo-200 dark:border-indigo-800',
    iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
    iconText: 'text-indigo-600 dark:text-indigo-400',
    textPrimary: 'text-indigo-900 dark:text-indigo-100',
    textSecondary: 'text-indigo-700 dark:text-indigo-300',
    bullet: 'text-indigo-600 dark:text-indigo-400',
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    iconText: 'text-emerald-600 dark:text-emerald-400',
    textPrimary: 'text-emerald-900 dark:text-emerald-100',
    textSecondary: 'text-emerald-700 dark:text-emerald-300',
    bullet: 'text-emerald-600 dark:text-emerald-400',
  },
  violet: {
    bg: 'bg-violet-50 dark:bg-violet-900/20',
    border: 'border-violet-200 dark:border-violet-800',
    iconBg: 'bg-violet-100 dark:bg-violet-900/30',
    iconText: 'text-violet-600 dark:text-violet-400',
    textPrimary: 'text-violet-900 dark:text-violet-100',
    textSecondary: 'text-violet-700 dark:text-violet-300',
    bullet: 'text-violet-600 dark:text-violet-400',
  },
  pink: {
    bg: 'bg-pink-50 dark:bg-pink-900/20',
    border: 'border-pink-200 dark:border-pink-800',
    iconBg: 'bg-pink-100 dark:bg-pink-900/30',
    iconText: 'text-pink-600 dark:text-pink-400',
    textPrimary: 'text-pink-900 dark:text-pink-100',
    textSecondary: 'text-pink-700 dark:text-pink-300',
    bullet: 'text-pink-600 dark:text-pink-400',
  },
  gray: {
    bg: 'bg-gray-50 dark:bg-gray-900/20',
    border: 'border-gray-200 dark:border-gray-800',
    iconBg: 'bg-gray-100 dark:bg-gray-900/30',
    iconText: 'text-gray-600 dark:text-gray-400',
    textPrimary: 'text-gray-900 dark:text-gray-100',
    textSecondary: 'text-gray-700 dark:text-gray-300',
    bullet: 'text-gray-600 dark:text-gray-400',
  },
  teal: {
    bg: 'bg-teal-50 dark:bg-teal-900/20',
    border: 'border-teal-200 dark:border-teal-800',
    iconBg: 'bg-teal-100 dark:bg-teal-900/30',
    iconText: 'text-teal-600 dark:text-teal-400',
    textPrimary: 'text-teal-900 dark:text-teal-100',
    textSecondary: 'text-teal-700 dark:text-teal-300',
    bullet: 'text-teal-600 dark:text-teal-400',
  },
} as const;
