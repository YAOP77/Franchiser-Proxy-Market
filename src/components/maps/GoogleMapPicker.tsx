/**
 * Composant GoogleMapPicker - Sélection de localisation sur Google Maps
 * 
 * Permet à l'utilisateur de cliquer sur une carte pour définir l'emplacement
 * et récupère automatiquement la longitude et la latitude.
 * 
 * Ce composant utilise le contexte GoogleMapsContext pour éviter le chargement
 * multiple de l'API Google Maps.
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { useGoogleMaps } from "../../contexts/GoogleMapsContext";

interface GoogleMapPickerProps {
  latitude: number | null;
  longitude: number | null;
  onLocationSelect: (lat: number, lng: number) => void;
  height?: string;
  className?: string;
}

const GoogleMapPicker: React.FC<GoogleMapPickerProps> = ({
  latitude,
  longitude,
  onLocationSelect,
  height = "400px",
  className = "",
}) => {
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const { isLoaded, loadError: contextLoadError, googleMapsApiKey } = useGoogleMaps();
  const [loadError, setLoadError] = useState<string | null>(null);

  // Utiliser l'erreur du contexte ou une erreur locale
  const currentLoadError = loadError || contextLoadError;

  // Vérifier si l'API est disponible
  const isApiAvailable = typeof window !== "undefined" && window.google && window.google.maps;

  // Vérification améliorée de la clé API
  if (!googleMapsApiKey || googleMapsApiKey.trim() === "" || googleMapsApiKey === "your_api_key_here") {
    return (
      <div className={`flex items-center justify-center border border-amber-300 rounded-lg bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20 p-6 ${className}`} style={{ height }}>
        <div className="text-center max-w-md">
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-300 mb-2">
            ⚙️ Configuration Google Maps requise
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mb-3">
            Créez un fichier <code className="px-1 py-0.5 bg-amber-100 dark:bg-amber-900 rounded">.env</code> à la racine du projet avec :
          </p>
          <pre className="text-xs bg-amber-100 dark:bg-amber-900/50 p-2 rounded text-left overflow-x-auto">
            VITE_GOOGLE_MAPS_API_KEY=votre_cle_api_ici
          </pre>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-3">
            Puis redémarrez le serveur de développement (npm run dev)
          </p>
        </div>
      </div>
    );
  }

  const getErrorContent = () => {
    if (currentLoadError === "BillingNotEnabled") {
      return {
        title: "💳 Facturation non activée",
        message: "Vous devez créer et activer un compte de facturation pour utiliser Google Maps API. C'est gratuit jusqu'à 200$ par mois.",
        instructions: [
          "1. Allez sur Google Cloud Console : https://console.cloud.google.com/billing",
          "2. Cliquez sur 'Créer un compte de facturation' ou 'Create billing account'",
          "3. Remplissez le formulaire avec vos informations (nom, adresse, pays, etc.)",
          "4. Ajoutez une carte de crédit ou de débit (requis mais vous ne serez PAS facturé dans la limite du quota gratuit)",
          "5. Liez le compte de facturation à votre projet Google Cloud",
          "6. Activez l'API 'Maps JavaScript API' dans 'APIs & Services' > 'Library'",
          "7. Rechargez cette page après avoir activé la facturation",
          "",
          "⚠️ Important : Vous avez un quota GRATUIT de 200$ par mois. Google ne vous facturera rien tant que vous restez dans cette limite."
        ]
      };
    } else if (currentLoadError === "ApiNotActivated") {
      return {
        title: "🔌 API non activée",
        message: "L'API Maps JavaScript API n'est pas activée dans Google Cloud Console.",
        instructions: [
          "1. Allez sur Google Cloud Console : https://console.cloud.google.com/",
          "2. Sélectionnez votre projet",
          "3. Allez dans 'APIs & Services' > 'Library'",
          "4. Recherchez 'Maps JavaScript API'",
          "5. Cliquez sur 'Enable' (Activer)",
          "6. Rechargez cette page après avoir activé l'API"
        ]
      };
    } else if (currentLoadError === "RefererNotAllowed") {
      return {
        title: "🔒 Restriction de référent",
        message: "Les restrictions de la clé API bloquent l'accès depuis cette origine.",
        instructions: [
          "1. Allez sur Google Cloud Console : https://console.cloud.google.com/",
          "2. Sélectionnez votre projet",
          "3. Allez dans 'APIs & Services' > 'Credentials'",
          "4. Cliquez sur votre clé API",
          "5. Dans 'Application restrictions', sélectionnez 'HTTP referrers (web sites)'",
          "6. Ajoutez ces référents :",
          "   - http://localhost:5173/*",
          "   - http://127.0.0.1:5173/*",
          "7. Cliquez sur 'Save'",
          "8. Rechargez cette page"
        ]
      };
    } else if (currentLoadError === "InvalidKey") {
      return {
        title: "🔑 Clé API invalide",
        message: "La clé API configurée n'est pas valide ou a été révoquée.",
        instructions: [
          "1. Vérifiez que la clé API dans le fichier .env est correcte",
          "2. Allez sur Google Cloud Console pour créer une nouvelle clé API si nécessaire",
          "3. Redémarrez le serveur de développement après avoir modifié le .env"
        ]
      };
    } else {
      return {
        title: "⚠️ Erreur de chargement de Google Maps",
        message: "Une erreur est survenue lors du chargement de Google Maps.",
        instructions: [
          "Vérifiez que votre clé API est valide et correctement configurée dans le fichier .env",
          "La facturation est activée sur votre compte Google Cloud (requis même pour les quotas gratuits)",
          "L'API 'Maps JavaScript API' est activée dans Google Cloud Console",
          "Les restrictions de clé API permettent l'accès depuis localhost (http://localhost:5173)",
          "Consultez la console du navigateur (F12) pour plus de détails sur l'erreur"
        ]
      };
    }
  };

  if (currentLoadError && currentLoadError !== "Clé API Google Maps non configurée") {
    const errorContent = getErrorContent();
    return (
      <div className={`flex items-center justify-center border border-red-300 rounded-lg bg-red-50 dark:border-red-700 dark:bg-red-900/20 p-6 ${className}`} style={{ height }}>
        <div className="text-left max-w-lg">
          <p className="text-sm font-semibold text-red-700 dark:text-red-300 mb-2">
            {errorContent.title}
          </p>
          <p className="text-xs text-red-600 dark:text-red-400 mb-3">
            {errorContent.message}
          </p>
          <div className="text-xs text-red-600 dark:text-red-400 space-y-1 max-h-96 overflow-y-auto">
            <p className="font-medium mb-2">Pour résoudre ce problème :</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              {errorContent.instructions.map((instruction, index) => (
                instruction.trim() ? (
                  <li key={index} className="mb-1 whitespace-pre-line">{instruction}</li>
                ) : (
                  <li key={index} className="mb-2"></li>
                )
              ))}
            </ol>
          </div>
          <div className="mt-4 pt-3 border-t border-red-200 dark:border-red-800 flex gap-3">
            <a
              href="https://console.cloud.google.com/billing"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-red-700 dark:text-red-300 hover:underline font-medium"
            >
              → Créer un compte de facturation
            </a>
            <span className="text-red-300 dark:text-red-700">|</span>
            <a
              href="https://console.cloud.google.com/apis/library/maps-javascript-backend.googleapis.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-red-700 dark:text-red-300 hover:underline font-medium"
            >
              → Activer Maps JavaScript API
            </a>
          </div>
        </div>
      </div>
    );
  }

  const defaultCenter = useMemo(() => {
    if (latitude && longitude && !isNaN(latitude) && !isNaN(longitude)) {
      return { lat: latitude, lng: longitude };
    }
    // Coordonnées par défaut : Abidjan, Côte d'Ivoire
    return { lat: 5.3600, lng: -4.0083 };
  }, [latitude, longitude]);

  const containerStyle = useMemo(
    () => ({
      width: "100%",
      height: height,
    }),
    [height]
  );

  const onMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        onLocationSelect(lat, lng);
      }
    },
    [onLocationSelect]
  );

  const onLoad = useCallback(() => {
    setIsMapLoaded(true);
    setLoadError(null);
  }, []);

  const onUnmount = useCallback(() => {
    setIsMapLoaded(false);
  }, []);

  // Détecter les erreurs Google Maps critiques (uniquement si l'API n'est pas disponible)
  useEffect(() => {
    // Ne pas écouter les erreurs si l'API est déjà chargée
    if (isApiAvailable) {
      return;
    }

    // Écouter uniquement les erreurs critiques Google Maps (pas les "already defined")
    const errorHandler = (event: ErrorEvent) => {
      const errorMessage = event.message || event.filename || '';
      const errorString = errorMessage.toString();
      
      // Ignorer les erreurs "already defined" (gérées par le contexte)
      if (errorString.includes('already defined') || errorString.includes('gmp-internal')) {
        return;
      }
      
      // Détecter les erreurs critiques
      if (errorString.includes('BillingNotEnabledMapError')) {
        setLoadError("BillingNotEnabled");
      } else if (errorString.includes('ApiNotActivatedMapError')) {
        setLoadError("ApiNotActivated");
      } else if (errorString.includes('RefererNotAllowedMapError')) {
        setLoadError("RefererNotAllowed");
      } else if (errorString.includes('InvalidKeyMapError')) {
        setLoadError("InvalidKey");
      }
    };

    const unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
      const errorMessage = event.reason?.message || String(event.reason) || '';
      
      // Ignorer les erreurs "already presented" (gérées par le contexte)
      if (errorMessage.includes('google api is already presented')) {
        return;
      }
      
      // Détecter les erreurs critiques
      if (errorMessage.includes('BillingNotEnabledMapError')) {
        setLoadError("BillingNotEnabled");
      } else if (errorMessage.includes('ApiNotActivatedMapError')) {
        setLoadError("ApiNotActivated");
      } else if (errorMessage.includes('RefererNotAllowedMapError')) {
        setLoadError("RefererNotAllowed");
      } else if (errorMessage.includes('InvalidKeyMapError')) {
        setLoadError("InvalidKey");
      }
    };

    // Écouter les erreurs (mais les erreurs "already defined" seront interceptées par le contexte)
    window.addEventListener('error', errorHandler);
    window.addEventListener('unhandledrejection', unhandledRejectionHandler);

    return () => {
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', unhandledRejectionHandler);
    };
  }, [isApiAvailable]);


  const isLoading = !isLoaded || !isMapLoaded;

  return (
    <div className={`relative rounded-lg border border-gray-300 overflow-hidden dark:border-gray-700 ${className}`}>
      {isLoading && !currentLoadError && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#04b05d] border-t-transparent mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Chargement de la carte...</p>
          </div>
        </div>
      )}
      {isLoaded && isApiAvailable ? (
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={defaultCenter}
          zoom={latitude && longitude ? 15 : 10}
          onClick={onMapClick}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={{
            disableDefaultUI: false,
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
            clickableIcons: false,
          }}
        >
          {latitude && longitude && (
            <Marker
              position={{ lat: latitude, lng: longitude }}
              animation={google.maps.Animation.DROP}
            />
          )}
        </GoogleMap>
      ) : (
        !currentLoadError && (
          <div className="flex items-center justify-center" style={{ height }}>
            <div className="text-center p-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#04b05d] border-t-transparent mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Initialisation de la carte...
              </p>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default GoogleMapPicker;



