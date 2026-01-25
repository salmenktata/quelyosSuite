'use client';

/**
 * Breadcrumbs Component with SEO
 * Displays navigation breadcrumbs with Schema.org structured data
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { odooClient } from '@/lib/odoo/client';
import { StructuredData } from './StructuredData';
import { logger } from '@/lib/logger';

interface BreadcrumbItem {
  position: number;
  name: string;
  item: string;
}

interface BreadcrumbsProps {
  productId?: number;
  customItems?: BreadcrumbItem[];
}

/**
 * Breadcrumbs Component
 * Auto-fetches breadcrumb data for products, or accepts custom items
 */
export function Breadcrumbs({ productId, customItems }: BreadcrumbsProps) {
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>(customItems || []);
  const [structuredData, setStructuredData] = useState<any>(null);
  const [loading, setLoading] = useState(!!productId);

  useEffect(() => {
    if (productId) {
      loadBreadcrumbs();
    }
  }, [productId]);

  const loadBreadcrumbs = async () => {
    try {
      setLoading(true);

      const response = await odooClient.getBreadcrumbsData(productId!);

      if (response.success && response.data) {
        setBreadcrumbs(response.data.breadcrumbs || []);
        setStructuredData(response.data.structured_data);
      }
    } catch (error) {
      logger.error('Error loading breadcrumbs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <nav className="mb-4" aria-label="Breadcrumb">
        <div className="h-5 w-64 animate-pulse rounded bg-gray-200"></div>
      </nav>
    );
  }

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <>
      {/* Structured Data */}
      {structuredData && <StructuredData data={structuredData} />}

      {/* Visual Breadcrumbs */}
      <nav className="mb-4 flex items-center space-x-2 text-sm text-gray-600" aria-label="Breadcrumb">
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={index}>
            {index > 0 && (
              <svg
                className="h-4 w-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
            {index < breadcrumbs.length - 1 ? (
              <Link
                href={crumb.item.replace(process.env.NEXT_PUBLIC_BASE_URL || '', '')}
                className="hover:text-primary"
              >
                {crumb.name}
              </Link>
            ) : (
              <span className="font-semibold text-gray-900">{crumb.name}</span>
            )}
          </React.Fragment>
        ))}
      </nav>
    </>
  );
}
