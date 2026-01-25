import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combine classes Tailwind CSS intelligemment
 * Gère les conflits et fusionne les classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
