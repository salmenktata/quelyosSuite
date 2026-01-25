/**
 * Geolocation Utilities pour le module RH
 * Calculs de distance GPS et validation de geofencing
 */

/**
 * Coordonnées GPS
 */
export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Rayon terrestre en mètres
 */
const EARTH_RADIUS_METERS = 6371000;

/**
 * Calculer la distance entre deux points GPS (formule de Haversine)
 * @param point1 Premier point (latitude, longitude)
 * @param point2 Second point (latitude, longitude)
 * @returns Distance en mètres
 */
export function calculateDistance(point1: Coordinates, point2: Coordinates): number {
  const lat1Rad = toRadians(point1.latitude);
  const lat2Rad = toRadians(point2.latitude);
  const deltaLatRad = toRadians(point2.latitude - point1.latitude);
  const deltaLonRad = toRadians(point2.longitude - point1.longitude);

  const a =
    Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLonRad / 2) *
      Math.sin(deltaLonRad / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

/**
 * Convertir des degrés en radians
 */
function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Vérifier si un point est dans un rayon donné
 * @param point Point à vérifier
 * @param center Centre du cercle
 * @param radiusMeters Rayon en mètres
 * @returns true si le point est dans le rayon
 */
export function isWithinRadius(
  point: Coordinates,
  center: Coordinates,
  radiusMeters: number
): boolean {
  const distance = calculateDistance(point, center);
  return distance <= radiusMeters;
}

/**
 * Formater une distance pour affichage
 * @param meters Distance en mètres
 * @returns Distance formatée (ex: "150 m" ou "1.5 km")
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Valider des coordonnées GPS
 */
export function isValidCoordinates(coords: Partial<Coordinates>): coords is Coordinates {
  return (
    coords.latitude !== undefined &&
    coords.longitude !== undefined &&
    coords.latitude >= -90 &&
    coords.latitude <= 90 &&
    coords.longitude >= -180 &&
    coords.longitude <= 180
  );
}

/**
 * Obtenir le rayon de geofencing par défaut en mètres
 */
export const DEFAULT_GEOFENCING_RADIUS = 100; // 100 mètres

/**
 * Calculer le centre géographique de plusieurs points
 */
export function calculateCenter(points: Coordinates[]): Coordinates {
  if (points.length === 0) {
    throw new Error('Au moins un point est requis');
  }

  if (points.length === 1) {
    return points[0];
  }

  let x = 0;
  let y = 0;
  let z = 0;

  for (const point of points) {
    const latRad = toRadians(point.latitude);
    const lonRad = toRadians(point.longitude);

    x += Math.cos(latRad) * Math.cos(lonRad);
    y += Math.cos(latRad) * Math.sin(lonRad);
    z += Math.sin(latRad);
  }

  const total = points.length;
  x /= total;
  y /= total;
  z /= total;

  const lonRad = Math.atan2(y, x);
  const hyp = Math.sqrt(x * x + y * y);
  const latRad = Math.atan2(z, hyp);

  return {
    latitude: (latRad * 180) / Math.PI,
    longitude: (lonRad * 180) / Math.PI,
  };
}

/**
 * Résultat de validation de geofencing
 */
export interface GeofencingValidation {
  isValid: boolean;
  distance: number;
  distanceFormatted: string;
  message: string;
}

/**
 * Valider un pointage avec geofencing
 */
export function validateGeofencing(
  userLocation: Coordinates,
  storeLocation: Coordinates,
  radiusMeters: number = DEFAULT_GEOFENCING_RADIUS
): GeofencingValidation {
  const distance = calculateDistance(userLocation, storeLocation);
  const isValid = distance <= radiusMeters;

  return {
    isValid,
    distance,
    distanceFormatted: formatDistance(distance),
    message: isValid
      ? `Position valide (${formatDistance(distance)} du magasin)`
      : `Trop loin du magasin (${formatDistance(distance)}, max ${formatDistance(radiusMeters)})`,
  };
}
