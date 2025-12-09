/**
 * Page AddFranchise - Ajouter une boutique
 * 
 * Cette page permet d'ajouter une nouvelle boutique sur Proxy Market.
 * Formulaire avec tous les champs requis :
 * - Nom, Email, Contact 1, Contact 2 (optionnel)
 * - Adresse, Commune, Status
 * - Localisation (Google Maps)
 */

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import Button from "../../components/ui/button/Button";
import Alert from "../../components/ui/alert/Alert";
import GoogleMapPicker from "../../components/maps/GoogleMapPicker";
import franchiseService, { CreateFranchiseData } from "../../services/api/franchiseService";
import { adminService, Commune } from "../../services/api/adminService";
import { cleanPhoneNumber, validatePhoneNumber } from "../../utils/phoneUtils";

export default function AddFranchise() {
  const navigate = useNavigate();
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // État du formulaire
  const [franchiseName, setFranchiseName] = useState("");
  const [email, setEmail] = useState("");
  const [contact1, setContact1] = useState("");
  const [contact2, setContact2] = useState("");
  const [adresse, setAdresse] = useState("");
  const [communeId, setCommuneId] = useState("");
  const [status, setStatus] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [showWarningAlert, setShowWarningAlert] = useState(false);
  const [isWarningAlertVisible, setIsWarningAlertVisible] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [isSuccessAlertVisible, setIsSuccessAlertVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  // État pour les communes
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [isLoadingCommunes, setIsLoadingCommunes] = useState(true);
  const [communesError, setCommunesError] = useState<string>("");

  // Nettoyer le timer de redirection lors du démontage du composant
  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  /**
   * Charger la liste des communes depuis l'API
   * Endpoint: GET /get-communes
   */
  useEffect(() => {
    const loadCommunes = async () => {
      try {
        setIsLoadingCommunes(true);
        setCommunesError("");
        const communesList = await adminService.getCommunes();
        
        if (communesList.length === 0) {
          setCommunesError("Aucune commune disponible. Veuillez contacter l'administrateur.");
        } else {
          setCommunes(communesList);
          setCommunesError("");
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Erreur lors du chargement des communes";
        setCommunesError(errorMessage);
        setCommunes([]);
        
        // En mode développement, logger l'erreur pour faciliter le débogage
        if (import.meta.env.DEV) {
          console.error("Erreur lors du chargement des communes:", err);
        }
      } finally {
        setIsLoadingCommunes(false);
      }
    };

    loadCommunes();
  }, []);

  /**
   * Gère l'affichage et la disparition de l'alerte d'avertissement avec transition
   */
  useEffect(() => {
    if (showWarningAlert) {
      // Afficher l'alerte avec transition
      setIsWarningAlertVisible(true);
      
      // Commencer la transition de sortie après 2.5 secondes
      const fadeOutTimer = setTimeout(() => {
        setIsWarningAlertVisible(false);
      }, 2500);
      
      // Masquer complètement l'alerte après la transition (3 secondes total)
      const hideTimer = setTimeout(() => {
        setShowWarningAlert(false);
      }, 3000);
      
      return () => {
        clearTimeout(fadeOutTimer);
        clearTimeout(hideTimer);
      };
    } else {
      // Réinitialiser l'état de visibilité si l'alerte est masquée manuellement
      setIsWarningAlertVisible(false);
    }
  }, [showWarningAlert]);

  /**
   * Gère l'affichage et la disparition de l'alerte de succès avec transition
   */
  useEffect(() => {
    if (showSuccessAlert) {
      // Afficher l'alerte avec transition
      setIsSuccessAlertVisible(true);
      
      // Commencer la transition de sortie après 2.5 secondes
      const fadeOutTimer = setTimeout(() => {
        setIsSuccessAlertVisible(false);
      }, 2500);
      
      // Masquer complètement l'alerte après la transition (3 secondes total)
      const hideTimer = setTimeout(() => {
        setShowSuccessAlert(false);
      }, 3000);
      
      return () => {
        clearTimeout(fadeOutTimer);
        clearTimeout(hideTimer);
      };
    } else {
      // Réinitialiser l'état de visibilité si l'alerte est masquée manuellement
      setIsSuccessAlertVisible(false);
    }
  }, [showSuccessAlert]);

  /**
   * Gère la sélection de localisation sur la carte
   */
  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
  }, []);

  /**
   * Gère la soumission du formulaire
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setShowWarningAlert(false);
    setShowSuccessAlert(false);
    
    // Vérifier si les champs requis sont remplis
    // NOTE: Pas de champ password - le backend ne l'attend pas
    if (!franchiseName.trim() || !email.trim() || !contact1.trim() || !adresse.trim() || !communeId.trim() || !status.trim() || latitude === null || longitude === null) {
      setShowWarningAlert(true);
      return;
    }
    
    setIsLoading(true);

    try {
      // Nettoyer et valider le numéro de téléphone principal
      if (!validatePhoneNumber(contact1)) {
        setError("Le numéro de téléphone (Contact 1) doit contenir exactement 10 chiffres");
        setIsLoading(false);
        return;
      }
      
      const cleanedContact1 = cleanPhoneNumber(contact1);
      
      // Valider contact_2 s'il est fourni
      if (contact2 && contact2.trim()) {
        if (!validatePhoneNumber(contact2)) {
          setError("Le numéro de téléphone (Contact 2) doit contenir exactement 10 chiffres");
          setIsLoading(false);
          return;
        }
      }

      // Convertir le status de "actif"/"inactif" vers "1"/"0" comme l'API l'attend
      // D'après la réponse API, status est un nombre (0 ou 1)
      const statusValue = status.trim().toLowerCase();
      const apiStatus = statusValue === "actif" ? "1" : statusValue === "inactif" ? "0" : statusValue;

      // Parser commune_id en nombre
      const parsedCommuneId = parseInt(communeId, 10);
      if (isNaN(parsedCommuneId)) {
        setError("La commune sélectionnée n'est pas valide");
        setIsLoading(false);
        return;
      }

      // Valider que latitude et longitude sont bien définis (ne devrait jamais arriver grâce à la vérification précédente)
      if (latitude === null || longitude === null) {
        setError("La localisation sur la carte est requise. Veuillez cliquer sur la carte pour sélectionner un emplacement.");
        setIsLoading(false);
        return;
      }

      // S'assurer que latitude et longitude sont des nombres valides
      const latitudeNum = Number(latitude);
      const longitudeNum = Number(longitude);
      
      if (isNaN(latitudeNum) || isNaN(longitudeNum)) {
        setError("Les coordonnées de localisation ne sont pas valides. Veuillez sélectionner à nouveau un emplacement sur la carte.");
        setIsLoading(false);
        return;
      }

      // Préparer les données pour l'API
      // Seuls les champs requis par le backend sont envoyés (selon la réponse API)
      // NOTE: Pas de champ password - le backend ne l'attend pas pour la création de boutique
      const franchiseData: CreateFranchiseData = {
        name: franchiseName.trim(),
        email: email.trim().toLowerCase(),
        contact_1: cleanedContact1,
        contact_2: contact2 && contact2.trim() ? cleanPhoneNumber(contact2) : "",
        adresse: adresse.trim(),
        latitude: latitudeNum,
        longitude: longitudeNum,
        commune_id: parsedCommuneId,
        status: apiStatus,
      };

      const result = await franchiseService.createFranchise(franchiseData);

      // Vérifier que la création a vraiment réussi
      if (!result.success) {
        throw new Error(result.error || "La création de la boutique a échoué");
      }

      // Afficher l'alerte de succès
      setShowSuccessAlert(true);
      
      // Rediriger vers la liste des boutiques après un court délai
      // pour permettre à l'utilisateur de voir le message de succès
      redirectTimerRef.current = setTimeout(() => {
        navigate("/basic-tables", { replace: true });
      }, 1500);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Une erreur est survenue lors de la création de la boutique";
      setError(errorMessage);
      setShowWarningAlert(false);
      setShowSuccessAlert(false);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Vide tous les champs du formulaire
   */
  const handleCancel = useCallback(() => {
    setFranchiseName("");
    setEmail("");
    setContact1("");
    setContact2("");
    setAdresse("");
    setCommuneId("");
    setStatus("");
    setLatitude(null);
    setLongitude(null);
    setShowWarningAlert(false);
    setShowSuccessAlert(false);
    setError("");
  }, []);

  // Options pour les champs select - mémorisées pour éviter les recalculs
  const statusOptions = useMemo(
    () => [
      { value: "actif", label: "Actif" },
      { value: "inactif", label: "Inactif" },
    ],
    []
  );

  const communeOptions = useMemo(
    () =>
      communes.map((commune) => ({
        value: String(commune.id),
        label: commune.libelle || String(commune.id),
      })),
    [communes]
  );

  return (
    <>
      <PageMeta
        title="Ajouter une boutique | Proxy Market"
        description="Formulaire d'ajout d'une nouvelle boutique sur Proxy Market"
      />
      
      <PageBreadcrumb pageTitle="Ajouter une boutique" titleClassName="text-[#04b05d] dark:text-[#04b05d]" />
      
      {/* Formulaire */}
      <div className="w-full">
        <ComponentCard title="Ajouter une boutique">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Grille responsive : 1 colonne sur mobile, 2 colonnes sur desktop */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nom de la boutique */}
                <div>
                  <Label htmlFor="franchise-name">
                    Nom de la boutique <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="franchise-name"
                    placeholder="Ex: Malika Boutique"
                    value={franchiseName}
                    onChange={(e) => setFranchiseName(e.target.value)}
                  />
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="franchise-email">
                    Email <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    id="franchise-email"
                    placeholder="Ex: boutique@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {/* Contact 1 */}
                <div>
                  <Label htmlFor="franchise-contact1">
                    Contact 1 <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="franchise-contact1"
                    placeholder="+225 0100000000"
                    value={contact1}
                    onChange={(e) => setContact1(e.target.value)}
                  />
                </div>

                {/* Contact 2 (optionnel) */}
                <div>
                  <Label htmlFor="franchise-contact2">
                    Contact 2
                  </Label>
                  <Input
                    type="text"
                    id="franchise-contact2"
                    placeholder="+225 0100000000 (optionnel)"
                    value={contact2}
                    onChange={(e) => setContact2(e.target.value)}
                  />
                </div>

                {/* Commune */}
                <div>
                  <Label>
                    Commune <span className="text-error-500">*</span>
                  </Label>
                  {isLoadingCommunes ? (
                    <div className="h-11 w-full rounded-lg border border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900 flex items-center justify-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Chargement des communes...
                      </span>
                    </div>
                  ) : communesError ? (
                    <div className="space-y-2">
                      <Select
                        options={communeOptions}
                        placeholder="Aucune commune disponible"
                        value={communeId}
                        onChange={(value) => setCommuneId(value)}
                        className="dark:bg-dark-900 cursor-pointer"
                        disabled={true}
                      />
                      <p className="text-xs text-error-500 dark:text-error-400">
                        {communesError}
                      </p>
                    </div>
                  ) : (
                    <Select
                      options={communeOptions}
                      placeholder={
                        communeOptions.length > 0
                          ? "Sélectionnez une commune"
                          : "Aucune commune disponible"
                      }
                      value={communeId}
                      onChange={(value) => setCommuneId(value)}
                      className="dark:bg-dark-900 cursor-pointer"
                      disabled={communeOptions.length === 0}
                    />
                  )}
                </div>

                {/* Status */}
                <div>
                  <Label>
                    Status <span className="text-error-500">*</span>
                  </Label>
                  <Select
                    options={statusOptions}
                    placeholder="Sélectionnez un status"
                    value={status}
                    onChange={(value) => setStatus(value)}
                    className="dark:bg-dark-900 cursor-pointer"
                  />
                </div>

                {/* Adresse - pleine largeur */}
                <div className="md:col-span-2">
                  <Label htmlFor="franchise-adresse">
                    Adresse <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="franchise-adresse"
                    placeholder="Ex: CHU Angré, Cocody"
                    value={adresse}
                    onChange={(e) => setAdresse(e.target.value)}
                  />
                </div>
              </div>

              {/* Section Localisation */}
              <div className="space-y-4">
                <div>
                  <Label>
                    Localisation de la boutique <span className="text-error-500">*</span>
                  </Label>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Cliquez sur la carte pour définir l'emplacement de la boutique
                  </p>
                </div>
                
                {/* Carte Google Maps */}
                <GoogleMapPicker
                  latitude={latitude}
                  longitude={longitude}
                  onLocationSelect={handleLocationSelect}
                  height="400px"
                />

                {/* Affichage des coordonnées */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      type="text"
                      id="latitude"
                      placeholder="Sélectionnez un point sur la carte"
                      value={latitude !== null ? latitude.toFixed(6) : ""}
                      disabled
                    />
                  </div>
                  <div>
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      type="text"
                      id="longitude"
                      placeholder="Sélectionnez un point sur la carte"
                      value={longitude !== null ? longitude.toFixed(6) : ""}
                      disabled
                    />
                  </div>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  variant="none"
                  className="w-full sm:w-auto bg-[#04b05d] hover:bg-[#039a52] text-white shadow-theme-xs disabled:bg-[#04b05d]/70 focus:ring-3 focus:ring-[#04b05d]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  {isLoading ? "Ajout en cours..." : "Ajouter la boutique"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  Annuler
                </Button>
              </div>
            </form>
            
            {/* Alerte d'erreur */}
            {error && (
              <div className="mt-6">
                <Alert
                  variant="error"
                  title="Erreur"
                  message={error}
                  showLink={false}
                />
              </div>
            )}
            
            {/* Alerte d'avertissement pour les champs requis */}
            {showWarningAlert && (
              <div
                className={`mt-6 transition-all duration-500 ease-in-out ${
                  isWarningAlertVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 -translate-y-2 pointer-events-none"
                }`}
              >
                <Alert
                  variant="warning"
                  title="Champs requis"
                  message="Tous les champs sont requis, y compris la localisation sur la carte"
                  showLink={false}
                />
              </div>
            )}
            
            {/* Alerte de succès */}
            {showSuccessAlert && (
              <div
                className={`mt-6 transition-all duration-500 ease-in-out ${
                  isSuccessAlertVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 -translate-y-2 pointer-events-none"
                }`}
              >
                <Alert
                  variant="success"
                  title="Boutique créée avec succès"
                  message="La boutique a été créée avec succès."
                  showLink={false}
                />
              </div>
            )}
          </ComponentCard>
      </div>
    </>
  );
}

