import { ReactNode } from "react";
import { cn } from "../lib/utils";

interface ContainerProps {
  children: ReactNode;
  className?: string;
  /** Use narrow container for centered text content (max-w-4xl) */
  narrow?: boolean;
  /** Use very narrow container for very focused content (max-w-3xl) */
  veryNarrow?: boolean;
  /** Custom padding */
  noPadding?: boolean;
}

/**
 * Standardized container component that ensures consistent alignment
 * with Header and Footer across all pages.
 *
 * Default: max-w-7xl with responsive padding (matches Header/Footer)
 * Narrow: max-w-4xl (for centered text)
 * Very Narrow: max-w-3xl (for forms, very focused content)
 */
export default function Container({
  children,
  className,
  narrow = false,
  veryNarrow = false,
  noPadding = false,
}: ContainerProps) {
  const maxWidth = veryNarrow
    ? "max-w-3xl"
    : narrow
    ? "max-w-4xl"
    : "max-w-7xl";

  const padding = noPadding ? "" : "px-4 sm:px-6 lg:px-8";

  return (
    <div className={cn("mx-auto", maxWidth, padding, className)}>
      {children}
    </div>
  );
}
