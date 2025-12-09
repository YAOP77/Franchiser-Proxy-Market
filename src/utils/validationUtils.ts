/**
 * Utilitaires de validation
 * 
 * Fonctions de validation réutilisables dans toute l'application
 */

/**
 * Valide une adresse email
 * 
 * @param email - Adresse email à valider
 * @returns true si l'email est valide
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valide qu'un nombre est un entier positif
 * 
 * @param value - Valeur à valider (string ou number)
 * @returns true si la valeur est un entier positif valide
 */
export const validatePositiveInteger = (value: string | number): boolean => {
  const num = typeof value === 'string' ? parseInt(value, 10) : value;
  return !isNaN(num) && num > 0;
};

