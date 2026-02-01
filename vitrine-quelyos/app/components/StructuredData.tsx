export interface StructuredDataProps {
  type: "Organization" | "WebSite" | "BreadcrumbList" | "Product" | "FAQPage";
  data: Record<string, unknown>;
}

export function StructuredData({ type, data }: StructuredDataProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": type,
    ...data,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

// Organization Schema pour toutes les pages
export function OrganizationSchema() {
  return (
    <StructuredData
      type="Organization"
      data={{
        name: "Quelyos",
        url: "https://quelyos.com",
        logo: "https://quelyos.com/logo.png",
        description: "Suite ERP complète pour entreprises : solutions métier intégrées avec IA native",
        foundingDate: "2024",
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer service",
          email: "contact@quelyos.com",
          availableLanguage: "French",
        },
        sameAs: [
          "https://twitter.com/quelyos",
          "https://www.linkedin.com/company/quelyos",
        ],
      }}
    />
  );
}

// WebSite Schema pour homepage
export function WebSiteSchema() {
  return (
    <StructuredData
      type="WebSite"
      data={{
        name: "Quelyos",
        url: "https://quelyos.com",
        description: "Suite ERP complète pour entreprises",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: "https://quelyos.com/search?q={search_term_string}",
          },
          "query-input": "required name=search_term_string",
        },
      }}
    />
  );
}

// FAQ Page Schema
export function FAQPageSchema({ faqs }: { faqs: Array<{ question: string; answer: string }> }) {
  return (
    <StructuredData
      type="FAQPage"
      data={{
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      }}
    />
  );
}

// BreadcrumbList Schema
export function BreadcrumbListSchema({ items }: {
  items: Array<{ name: string; url: string }>
}) {
  return (
    <StructuredData
      type="BreadcrumbList"
      data={{
        itemListElement: items.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: item.url,
        })),
      }}
    />
  );
}
