/**
 * Valide une adresse email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valide un mot de passe
 * Règles : au moins 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre
 */
export function isValidPassword(password: string): boolean {
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  return true;
}

/**
 * Valide un numéro de téléphone français
 */
export function isValidPhoneNumber(phone: string): boolean {
  // Format: 0X XX XX XX XX ou +33 X XX XX XX XX
  const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
  return phoneRegex.test(phone);
}

/**
 * Valide un SIRET français
 */
export function isValidSiret(siret: string): boolean {
  if (!/^\d{14}$/.test(siret)) return false;

  // Algorithme de Luhn
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    let digit = parseInt(siret[i]);
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

/**
 * Valide un IBAN
 */
export function isValidIBAN(iban: string): boolean {
  // Supprime les espaces
  const cleanIBAN = iban.replace(/\s/g, "");

  // Vérifie le format
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(cleanIBAN)) return false;

  // Vérifie la longueur selon le pays
  const lengths: Record<string, number> = {
    FR: 27,
    DE: 22,
    ES: 24,
    IT: 27,
    BE: 16,
    // Ajouter d'autres pays si nécessaire
  };

  const country = cleanIBAN.substring(0, 2);
  if (lengths[country] && cleanIBAN.length !== lengths[country]) {
    return false;
  }

  return true;
}

/**
 * Valide une URL
 */
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
