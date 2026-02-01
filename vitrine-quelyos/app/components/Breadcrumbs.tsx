import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { BreadcrumbListSchema } from "./StructuredData";

export interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  includeSchema?: boolean;
}

export function Breadcrumbs({ items, includeSchema = true }: BreadcrumbsProps) {
  // Toujours inclure "Accueil" au début
  const allItems: BreadcrumbItem[] = [
    { name: "Accueil", url: "https://quelyos.com" },
    ...items,
  ];

  return (
    <>
      {includeSchema && <BreadcrumbListSchema items={allItems} />}
      <nav aria-label="Fil d'Ariane" className="mb-8">
        <ol className="flex items-center gap-2 text-sm">
          {allItems.map((item, index) => {
            const isLast = index === allItems.length - 1;
            return (
              <li key={item.url} className="flex items-center gap-2">
                {index > 0 && (
                  <ChevronRight className="h-4 w-4 text-slate-500" />
                )}
                {isLast ? (
                  <span className="text-slate-400" aria-current="page">
                    {item.name}
                  </span>
                ) : (
                  <Link
                    href={item.url.replace("https://quelyos.com", "")}
                    className="text-slate-400 transition-colors hover:text-indigo-400"
                  >
                    {item.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
