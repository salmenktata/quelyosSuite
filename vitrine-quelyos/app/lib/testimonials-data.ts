/**
 * Data layer pour les témoignages clients illustratifs
 * Centralise tous les témoignages des solutions sectorielles
 */

import { solutionsData, type Testimonial } from './solutions-data';

/**
 * Récupère tous les témoignages de tous les secteurs
 */
export const getAllTestimonials = (): (Testimonial & { sector: string })[] => {
  const testimonials: (Testimonial & { sector: string })[] = [];

  Object.entries(solutionsData).forEach(([sectorId, solution]) => {
    solution.testimonials.forEach(testimonial => {
      testimonials.push({
        ...testimonial,
        sector: sectorId
      });
    });
  });

  return testimonials;
};

/**
 * Récupère les témoignages pour un secteur spécifique
 */
export const getTestimonialsBySector = (sectorId: string): Testimonial[] => {
  const solution = solutionsData[sectorId];
  return solution ? solution.testimonials : [];
};

/**
 * Récupère un témoignage aléatoire par secteur (pour carousel homepage)
 */
export const getRandomTestimonialPerSector = (): (Testimonial & { sector: string; sectorName: string })[] => {
  return Object.entries(solutionsData).map(([sectorId, solution]) => {
    // Prendre le premier témoignage (ou aléatoire si souhaité)
    const testimonial = solution.testimonials[0];
    return {
      ...testimonial,
      sector: sectorId,
      sectorName: solution.sectorName
    };
  });
};

/**
 * Témoignages prêts pour carousel homepage (1 par secteur)
 */
export const homepageTestimonials = getRandomTestimonialPerSector();
