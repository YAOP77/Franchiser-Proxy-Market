/**
 * Utilitaires pour la gestion des erreurs API
 * 
 * Fonctions réutilisables pour extraire et formater les erreurs de l'API
 */

/**
 * Structure d'erreur de validation de l'API
 */
export interface ApiValidationError {
  error?: Record<string, string | string[]>;
  errors?: Record<string, string | string[]>;
  message?: string;
}

/**
 * Extrait les messages d'erreur de validation depuis la réponse de l'API
 * 
 * @param apiError - Objet d'erreur retourné par l'API
 * @returns Tableau de messages d'erreur formatés
 */
export const extractValidationErrors = (apiError: ApiValidationError | any): string[] => {
  const validationErrors: string[] = [];
  
  // L'API peut retourner les erreurs dans différentes structures
  // Essayer plusieurs formats possibles
  let errorsObject = apiError?.error || apiError?.errors;
  
  // Si apiError est directement un objet d'erreurs
  if (!errorsObject && apiError && typeof apiError === 'object') {
    // Vérifier si apiError contient des clés qui ressemblent à des champs de formulaire
    const hasFieldErrors = Object.keys(apiError).some(key => 
      Array.isArray(apiError[key]) || typeof apiError[key] === 'string'
    );
    if (hasFieldErrors) {
      errorsObject = apiError;
    }
  }
  
  // Si l'API retourne un objet errors avec des tableaux de messages
  if (errorsObject && typeof errorsObject === 'object') {
    Object.keys(errorsObject).forEach((field) => {
      const fieldErrors = errorsObject[field];
      if (Array.isArray(fieldErrors)) {
        fieldErrors.forEach((err: string) => {
          validationErrors.push(`${field}: ${err}`);
        });
      } else if (typeof fieldErrors === 'string') {
        validationErrors.push(`${field}: ${fieldErrors}`);
      }
    });
  }
  
  return validationErrors;
};

/**
 * Formate un message d'erreur à partir de la réponse de l'API
 * 
 * @param apiError - Objet d'erreur retourné par l'API (peut être ApiValidationError, string, ou any)
 * @param defaultMessage - Message par défaut si aucune erreur n'est trouvée
 * @returns Message d'erreur formaté
 */
export const formatApiErrorMessage = (
  apiError: ApiValidationError | string | any,
  defaultMessage: string = "Une erreur est survenue"
): string => {
  // Si c'est déjà une chaîne, la retourner telle quelle
  if (typeof apiError === 'string') {
    return apiError;
  }
  
  // Si apiError est null ou undefined
  if (!apiError) {
    return defaultMessage;
  }
  
  // Extraire les erreurs de validation
  // L'API Laravel peut retourner les erreurs dans différentes structures :
  // - apiError.error (objet avec les erreurs)
  // - apiError.errors (objet avec les erreurs)
  // - apiError directement (si c'est déjà l'objet d'erreurs)
  const validationErrors = extractValidationErrors(apiError as ApiValidationError);
  if (validationErrors.length > 0) {
    return validationErrors.join('\n');
  }
  
  // Utiliser le message général si disponible
  if (apiError?.message && typeof apiError.message === 'string') {
    return apiError.message;
  }
  
  // Si apiError est un objet, essayer de le convertir en string JSON pour le debug
  if (typeof apiError === 'object') {
    // Ne pas logger en production pour éviter d'exposer des données sensibles
    if (import.meta.env.DEV) {
      console.warn("Format d'erreur non reconnu:", apiError);
    }
  }
  
  return defaultMessage;
};

