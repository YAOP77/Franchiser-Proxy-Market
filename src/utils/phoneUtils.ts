/**
 * Utilitaires pour le formatage des numéros de téléphone
 * 
 * Ces fonctions peuvent être réutilisées dans toute l'application
 * pour garantir une cohérence dans le formatage des numéros.
 */

/**
 * Nettoie un numéro de téléphone pour extraire uniquement les 10 chiffres
 * Enlève les espaces, le préfixe +225 ou 225, et retourne les 10 chiffres
 * 
 * @param phone - Numéro de téléphone à nettoyer (ex: "+225 07 12 34 56 78")
 * @returns Numéro nettoyé avec 10 chiffres (ex: "0712345678")
 * 
 * @example
 * cleanPhoneNumber("+225 07 12 34 56 78") // "0712345678"
 * cleanPhoneNumber("225 07 12 34 56 78")  // "0712345678"
 * cleanPhoneNumber("07 12 34 56 78")      // "0712345678"
 */
export const cleanPhoneNumber = (phone: string): string => {
  // Enlever tous les caractères non numériques
  let cleaned = phone.replace(/\D/g, '');
  
  // Si le numéro commence par 225 (code pays), enlever ces 3 premiers chiffres
  if (cleaned.startsWith('225')) {
    cleaned = cleaned.substring(3);
  }
  
  // Retourner les 10 premiers chiffres
  return cleaned.substring(0, 10);
};

/**
 * Valide qu'un numéro de téléphone contient exactement 10 chiffres
 * 
 * @param phone - Numéro de téléphone à valider
 * @returns true si le numéro est valide (10 chiffres)
 * 
 * @example
 * validatePhoneNumber("0712345678") // true
 * validatePhoneNumber("+225 07 12 34 56 78") // true (après nettoyage)
 * validatePhoneNumber("123") // false
 */
export const validatePhoneNumber = (phone: string): boolean => {
  const cleaned = cleanPhoneNumber(phone);
  return cleaned.length === 10;
};

/**
 * Formate un numéro de téléphone pour l'affichage
 * Formate en "XX XX XX XX XX" (groupes de 2 chiffres)
 * 
 * @param phone - Numéro de téléphone à formater (10 chiffres)
 * @returns Numéro formaté pour l'affichage
 * 
 * @example
 * formatPhoneNumber("0712345678") // "07 12 34 56 78"
 */
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = cleanPhoneNumber(phone);
  if (cleaned.length !== 10) {
    return phone; // Retourner tel quel si le format n'est pas valide
  }
  
  // Formater en groupes de 2 chiffres
  return cleaned.match(/.{1,2}/g)?.join(' ') || cleaned;
};

