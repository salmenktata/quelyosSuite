/**
 * Structured Data Component (JSON-LD)
 * Injects Schema.org structured data into page <head>
 */

import React from 'react';

interface StructuredDataProps {
  data: string | object;
}

/**
 * StructuredData Component
 * Renders a JSON-LD script tag with structured data
 *
 * Usage:
 * ```tsx
 * <StructuredData data={productStructuredData} />
 * ```
 */
export function StructuredData({ data }: StructuredDataProps) {
  const jsonLd = typeof data === 'string' ? data : JSON.stringify(data);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLd }}
    />
  );
}

/**
 * Multiple Structured Data Component
 * Renders multiple JSON-LD script tags
 *
 * Usage:
 * ```tsx
 * <MultipleStructuredData data={[productData, breadcrumbData, reviewData]} />
 * ```
 */
export function MultipleStructuredData({ data }: { data: (string | object)[] }) {
  return (
    <>
      {data.map((item, index) => (
        <StructuredData key={index} data={item} />
      ))}
    </>
  );
}
