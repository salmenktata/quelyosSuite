'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { cmsService } from '@/lib/backend/cms';
import { useAuthStore } from '@/store/authStore';
import type { Menu, MenuItem } from '@/types/cms';
import { logger } from '@/lib/logger';
import { sanitizeSvg } from '@/lib/utils/sanitize';

interface DynamicMenuProps {
  code: string;
  className?: string;
  itemClassName?: string;
  orientation?: 'horizontal' | 'vertical';
  showIcons?: boolean;
  maxDepth?: number;
}

/**
 * Composant de menu dynamique chargé depuis le CMS
 */
export const DynamicMenu: React.FC<DynamicMenuProps> = ({
  code,
  className = '',
  itemClassName = '',
  orientation = 'horizontal',
  showIcons = true,
  maxDepth = 2,
}) => {
  const [menu, setMenu] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        const menuData = await cmsService.getMenu(code);
        setMenu(menuData);
        setError(null);
      } catch (err: any) {
        logger.error(`Failed to load menu ${code}:`, err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [code]);

  // Filtrer les items selon la visibilité
  const filterByVisibility = (items: MenuItem[]): MenuItem[] => {
    return items
      .filter((item) => {
        // Par défaut, visible pour tous si visibility non défini
        if (!item.visibility || item.visibility === 'all') return true;
        if (item.visibility === 'authenticated' && isAuthenticated) return true;
        if (item.visibility === 'guest' && !isAuthenticated) return true;
        return false;
      })
      .map((item) => ({
        ...item,
        children: filterByVisibility(item.children || []),
      }));
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </div>
    );
  }

  if (error || !menu) {
    return null;
  }

  const filteredItems = filterByVisibility(menu.items);

  return (
    <nav className={className} aria-label={menu.name}>
      <MenuItemList
        items={filteredItems}
        orientation={orientation}
        itemClassName={itemClassName}
        showIcons={showIcons}
        depth={0}
        maxDepth={maxDepth}
      />
    </nav>
  );
};

interface MenuItemListProps {
  items: MenuItem[];
  orientation: 'horizontal' | 'vertical';
  itemClassName: string;
  showIcons: boolean;
  depth: number;
  maxDepth: number;
}

const MenuItemList: React.FC<MenuItemListProps> = ({
  items,
  orientation,
  itemClassName,
  showIcons,
  depth,
  maxDepth,
}) => {
  const isRoot = depth === 0;
  const listClass = isRoot
    ? orientation === 'horizontal'
      ? 'flex items-center gap-6'
      : 'flex flex-col gap-2'
    : 'flex flex-col gap-1 pl-4';

  return (
    <ul className={listClass}>
      {items.map((item) => (
        <MenuItemComponent
          key={item.id}
          item={item}
          itemClassName={itemClassName}
          showIcons={showIcons}
          depth={depth}
          maxDepth={maxDepth}
          orientation={orientation}
        />
      ))}
    </ul>
  );
};

interface MenuItemComponentProps {
  item: MenuItem;
  itemClassName: string;
  showIcons: boolean;
  depth: number;
  maxDepth: number;
  orientation: 'horizontal' | 'vertical';
}

const MenuItemComponent: React.FC<MenuItemComponentProps> = ({
  item,
  itemClassName,
  showIcons,
  depth,
  maxDepth,
  orientation,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0 && depth < maxDepth;

  const baseClass = `
    text-gray-700 hover:text-primary transition-colors
    ${item.highlight ? 'font-bold text-primary' : 'font-medium'}
    ${item.css_class || ''}
    ${itemClassName}
  `.trim();

  const linkProps: React.AnchorHTMLAttributes<HTMLAnchorElement> = {};
  // Support both open_in_new_tab and open_new_tab (API)
  if (item.open_in_new_tab || item.open_new_tab) {
    linkProps.target = '_blank';
    linkProps.rel = 'noopener noreferrer';
  }

  // Utiliser label (API) ou name (fallback)
  const displayName = item.label || item.name || '';
  // Icon peut être false depuis l'API (Odoo retourne false pour les champs vides)
  const hasIcon = showIcons && typeof item.icon === 'string' && item.icon.length > 0;

  const content = (
    <>
      {hasIcon && (
        <span className="mr-2" dangerouslySetInnerHTML={{ __html: sanitizeSvg(item.icon as string) }} />
      )}
      {displayName}
      {hasChildren && (
        <svg
          className={`w-4 h-4 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      )}
    </>
  );

  // Déterminer si c'est un lien interne ou externe
  const isInternal = item.link_type === 'internal' || item.link_type === 'page' ||
                     item.link_type === 'category' || item.link_type === 'product';

  return (
    <li
      className="relative"
      onMouseEnter={() => orientation === 'horizontal' && setIsOpen(true)}
      onMouseLeave={() => orientation === 'horizontal' && setIsOpen(false)}
    >
      <div className="flex items-center">
        {isInternal ? (
          <Link href={item.url} className={baseClass} {...linkProps}>
            {content}
          </Link>
        ) : (
          <a href={item.url} className={baseClass} {...linkProps}>
            {content}
          </a>
        )}

        {/* Toggle pour menu vertical */}
        {hasChildren && orientation === 'vertical' && (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 ml-auto hover:bg-gray-100 rounded"
            aria-expanded={isOpen}
          >
            <svg
              className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* Sous-menu */}
      {hasChildren && (
        <div
          className={`
            ${orientation === 'horizontal' ? 'absolute top-full left-0 pt-2' : ''}
            ${isOpen ? 'block' : 'hidden'}
          `}
        >
          <div
            className={
              orientation === 'horizontal'
                ? 'bg-white shadow-lg rounded-lg border py-2 px-4 min-w-[200px]'
                : ''
            }
          >
            <MenuItemList
              items={item.children}
              orientation="vertical"
              itemClassName={itemClassName}
              showIcons={showIcons}
              depth={depth + 1}
              maxDepth={maxDepth}
            />
          </div>
        </div>
      )}
    </li>
  );
};

export default DynamicMenu;
