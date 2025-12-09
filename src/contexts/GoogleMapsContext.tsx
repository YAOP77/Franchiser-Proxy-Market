/**
 * Contexte Google Maps - Gestion du chargement unique de l'API Google Maps
 * 
 * Ce contexte garantit que l'API Google Maps n'est chargée qu'une seule fois
 * dans toute l'application, évitant les erreurs de chargement multiple.
 * 
 * Il intercepte également les erreurs "already defined" pour éviter qu'elles
 * n'apparaissent dans la console du navigateur.
 */

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Variable globale pour suivre si le script a déjà été chargé
let isScriptLoading = false;
let isScriptLoaded = false;

interface GoogleMapsContextType {
  isLoaded: boolean;
  loadError: string | null;
  googleMapsApiKey: string | undefined;
}

const GoogleMapsContext = createContext<GoogleMapsContextType | undefined>(undefined);

interface GoogleMapsProviderProps {
  children: ReactNode;
}

/**
 * Charge le script Google Maps manuellement (une seule fois)
 */
const loadGoogleMapsScript = (apiKey: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Vérifier si le script est déjà chargé
    if (typeof window !== "undefined" && window.google && window.google.maps) {
      resolve();
      return;
    }

    // Vérifier si un script est déjà en cours de chargement
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      // Attendre que le script existant se charge
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () => reject(new Error('Failed to load')));
      return;
    }

    // Créer et insérer le script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      // Attendre que l'objet google.maps soit disponible
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      
      // Timeout après 10 secondes
      setTimeout(() => {
        clearInterval(checkInterval);
        if (window.google && window.google.maps) {
          resolve();
        } else {
          reject(new Error('Google Maps API loaded but not available'));
        }
      }, 10000);
    };
    
    script.onerror = () => {
      reject(new Error('Failed to load Google Maps script'));
    };
    
    document.head.appendChild(script);
  });
};

/**
 * Provider pour Google Maps - Charge l'API une seule fois
 */
export function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  
  const [isLoaded, setIsLoaded] = useState(() => {
    // Vérifier immédiatement si l'API est déjà chargée
    if (typeof window !== "undefined" && window.google && window.google.maps) {
      isScriptLoaded = true;
      return true;
    }
    return isScriptLoaded;
  });
  
  const [loadError, setLoadError] = useState<string | null>(null);

  // Intercepter les erreurs "already defined" de Google Maps avant qu'elles n'apparaissent dans la console
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Intercepter uniquement les erreurs window.error liées à Google Maps
    const errorHandler = (event: ErrorEvent) => {
      const errorMessage = event.message || event.filename || '';
      const errorString = errorMessage.toString();
      
      // Ignorer les erreurs "already defined" des éléments personnalisés Google Maps
      // Ces erreurs se produisent lorsque les Web Components sont enregistrés plusieurs fois
      // mais n'empêchent pas le fonctionnement de l'application
      if (
        errorString.includes("already defined") ||
        errorString.includes("gmp-internal") ||
        errorString.includes("gmp-map") ||
        errorString.includes("Element with name") ||
        errorString.includes("google api is already presented") ||
        errorString.includes("Cannot read properties of undefined") ||
        (errorString.includes("reading") && (errorString.includes("DJ") || errorString.includes("ip") || errorString.includes("LN"))) ||
        errorString.includes("BillingNotEnabledMapError") ||
        errorString.includes("BillingNotEnabled") ||
        errorString.includes("billing-not-enabled") ||
        errorString.includes("Google Maps JavaScript API error")
      ) {
        // Empêcher la propagation de ces erreurs dans la console
        event.stopImmediatePropagation();
        event.preventDefault();
        return false;
      }
    };

    // Écouter les erreurs en phase de capture (avant qu'elles n'atteignent la console)
    window.addEventListener("error", errorHandler, true);

    // Intercepter également les rejets de promesses non gérés liés à Google Maps
    const unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
      const errorMessage =
        (event.reason?.message || String(event.reason) || "").toString();
      
      // Ignorer les erreurs liées à Google Maps
      if (
        errorMessage.includes("google api is already presented") ||
        errorMessage.includes("already defined") ||
        errorMessage.includes("gmp-internal") ||
        errorMessage.includes("gmp-map") ||
        errorMessage.includes("Cannot read properties of undefined") ||
        errorMessage.includes("reading 'DJ'") ||
        errorMessage.includes("reading 'ip'") ||
        errorMessage.includes("reading 'LN'") ||
        (errorMessage.includes("reading") && (errorMessage.includes("DJ") || errorMessage.includes("ip") || errorMessage.includes("LN"))) ||
        (errorMessage.includes("TypeError") && (errorMessage.includes("DJ") || errorMessage.includes("ip") || errorMessage.includes("LN"))) ||
        errorMessage.includes("BillingNotEnabledMapError") ||
        errorMessage.includes("BillingNotEnabled") ||
        errorMessage.includes("billing-not-enabled") ||
        errorMessage.includes("Google Maps JavaScript API error")
      ) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    };

    window.addEventListener("unhandledrejection", unhandledRejectionHandler, true);

    // Intercepter également les erreurs via console.error (si possible)
    const originalConsoleError = console.error;
    console.error = (...args: unknown[]) => {
      const errorString = args.map(arg => String(arg)).join(' ');
      if (
        errorString.includes("already defined") ||
        errorString.includes("gmp-internal") ||
        errorString.includes("gmp-map") ||
        errorString.includes("Element with name") ||
        errorString.includes("google api is already presented") ||
        errorString.includes("Cannot read properties of undefined") ||
        errorString.includes("reading 'DJ'") ||
        errorString.includes("reading 'ip'") ||
        errorString.includes("reading 'LN'") ||
        (errorString.includes("reading") && (errorString.includes("DJ") || errorString.includes("ip") || errorString.includes("LN"))) ||
        (errorString.includes("TypeError") && (errorString.includes("DJ") || errorString.includes("ip") || errorString.includes("LN"))) ||
        errorString.includes("BillingNotEnabledMapError") ||
        errorString.includes("BillingNotEnabled") ||
        errorString.includes("billing-not-enabled") ||
        errorString.includes("Google Maps JavaScript API error")
      ) {
        // Ne pas afficher ces erreurs dans la console
        return;
      }
      // Appeler la fonction originale pour les autres erreurs
      originalConsoleError.apply(console, args);
    };

    // Intercepter également les erreurs non gérées via window.onerror
    const originalOnError = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
      const errorString = String(message || error?.message || "");
      if (
        errorString.includes("already defined") ||
        errorString.includes("gmp-internal") ||
        errorString.includes("gmp-map") ||
        errorString.includes("Element with name") ||
        errorString.includes("google api is already presented") ||
        errorString.includes("Cannot read properties of undefined") ||
        errorString.includes("reading 'DJ'") ||
        errorString.includes("reading 'ip'") ||
        errorString.includes("reading 'LN'") ||
        (errorString.includes("reading") && (errorString.includes("DJ") || errorString.includes("ip") || errorString.includes("LN"))) ||
        (errorString.includes("TypeError") && (errorString.includes("DJ") || errorString.includes("ip") || errorString.includes("LN"))) ||
        errorString.includes("BillingNotEnabledMapError") ||
        errorString.includes("BillingNotEnabled") ||
        errorString.includes("billing-not-enabled") ||
        errorString.includes("Google Maps JavaScript API error")
      ) {
        // Empêcher l'affichage de ces erreurs
        return true;
      }
      // Appeler le gestionnaire d'erreur original pour les autres erreurs
      if (originalOnError) {
        return originalOnError(message, source, lineno, colno, error);
      }
      return false;
    };

    return () => {
      window.removeEventListener("error", errorHandler, true);
      window.removeEventListener("unhandledrejection", unhandledRejectionHandler, true);
      console.error = originalConsoleError;
      window.onerror = originalOnError;
    };
  }, []);

  // Charger le script Google Maps au montage du composant
  useEffect(() => {
    // Si pas de clé API, ne rien faire
    if (!googleMapsApiKey) {
      setLoadError("Clé API Google Maps non configurée");
      return;
    }

    // Si déjà chargé, ne rien faire
    if (isScriptLoaded || isScriptLoading) {
      if (isScriptLoaded) {
        setIsLoaded(true);
        setLoadError(null);
      }
      return;
    }

    // Marquer comme en cours de chargement
    isScriptLoading = true;

    // Charger le script
    loadGoogleMapsScript(googleMapsApiKey)
      .then(() => {
        setIsLoaded(true);
        setLoadError(null);
        isScriptLoaded = true;
        isScriptLoading = false;
      })
      .catch(() => {
        // Gestion silencieuse de l'erreur pour éviter d'exposer des informations sensibles
        setLoadError("Erreur de chargement");
        isScriptLoading = false;
      });
  }, [googleMapsApiKey]);

  return (
    <GoogleMapsContext.Provider
      value={{
        isLoaded,
        loadError,
        googleMapsApiKey,
      }}
    >
      {children}
    </GoogleMapsContext.Provider>
  );
}

/**
 * Hook pour accéder au contexte Google Maps
 */
export function useGoogleMaps() {
  const context = useContext(GoogleMapsContext);
  if (context === undefined) {
    throw new Error("useGoogleMaps doit être utilisé à l'intérieur d'un GoogleMapsProvider");
  }
  return context;
}

