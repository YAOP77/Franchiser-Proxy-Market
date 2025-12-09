/**
 * Page AddBoutiqueUser - Ajouter un franchisé (utilisateur de boutique)
 * 
 * Cette page permet de créer un nouvel utilisateur de boutique (franchisé) sur Proxy Market.
 * Formulaire avec tous les champs requis :
 * - nom, prenoms, email, password
 * - contact_1
 * - commune_id (liste des communes)
 * - role (fixé à "boutique_admin")
 * - status (1 pour actif, 0 pour inactif)
 */

import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import Button from "../../components/ui/button/Button";
import Alert from "../../components/ui/alert/Alert";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import boutiqueUserService, { CreateBoutiqueUserData } from "../../services/api/boutiqueUserService";
import { adminService, Commune } from "../../services/api/adminService";
import franchiseService, { Boutique } from "../../services/api/franchiseService";
import { cleanPhoneNumber, validatePhoneNumber } from "../../utils/phoneUtils";
import { validateEmail, validatePositiveInteger } from "../../utils/validationUtils";

export default function AddBoutiqueUser() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // État du formulaire
  const [nom, setNom] = useState("");
  const [prenoms, setPrenoms] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [contact1, setContact1] = useState("");
  const [communeId, setCommuneId] = useState("");
  const [boutiqueId, setBoutiqueId] = useState("");
  const [status, setStatus] = useState("");

  // État pour l'affichage du mot de passe
  const [showPassword, setShowPassword] = useState(false);

  // État pour les alertes
  const [showWarningAlert, setShowWarningAlert] = useState(false);
  const [isWarningAlertVisible, setIsWarningAlertVisible] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [isSuccessAlertVisible, setIsSuccessAlertVisible] = useState(false);
  const [error, setError] = useState("");

  // État pour le chargement
  const [isLoading, setIsLoading] = useState(false);

  // État pour les communes
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [isLoadingCommunes, setIsLoadingCommunes] = useState(true);
  const [communesError, setCommunesError] = useState<string>("");

  // État pour la boutique sélectionnée
  const [selectedBoutique, setSelectedBoutique] = useState<Boutique | null>(null);
  const [isLoadingBoutique, setIsLoadingBoutique] = useState<boolean>(false);

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
   * Récupérer l'ID de la boutique depuis les query params et charger ses informations
   */
  useEffect(() => {
    const boutiqueIdFromUrl = searchParams.get("boutique_id");
    if (boutiqueIdFromUrl) {
      setBoutiqueId(boutiqueIdFromUrl);
      
      // Charger les informations de la boutique
      const loadBoutique = async () => {
        try {
          setIsLoadingBoutique(true);
          const boutiqueData = await franchiseService.getBoutiqueById(boutiqueIdFromUrl);
          setSelectedBoutique(boutiqueData);
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : "Erreur lors du chargement des informations de la boutique";
          setError(errorMessage);
          if (import.meta.env.DEV) {
            console.error("Erreur lors du chargement de la boutique:", err);
          }
        } finally {
          setIsLoadingBoutique(false);
        }
      };
      
      loadBoutique();
    } else {
      // Si aucun ID de boutique n'est fourni, afficher une erreur
      setError("Aucune boutique sélectionnée. Veuillez retourner à la liste des boutiques et cliquer sur 'Placer un franchisé'.");
    }
  }, [searchParams]);

  // Gère l'affichage et la disparition de l'alerte d'avertissement avec transition
  useEffect(() => {
    if (showWarningAlert) {
      setIsWarningAlertVisible(true);
      const fadeOutTimer = setTimeout(() => {
        setIsWarningAlertVisible(false);
      }, 2500);
      const hideTimer = setTimeout(() => {
        setShowWarningAlert(false);
      }, 3000);
      return () => {
        clearTimeout(fadeOutTimer);
        clearTimeout(hideTimer);
      };
    } else {
      setIsWarningAlertVisible(false);
    }
  }, [showWarningAlert]);

  // Gère l'affichage et la disparition de l'alerte de succès avec transition
  useEffect(() => {
    if (showSuccessAlert) {
      setIsSuccessAlertVisible(true);
      const fadeOutTimer = setTimeout(() => {
        setIsSuccessAlertVisible(false);
      }, 2500);
      const hideTimer = setTimeout(() => {
        setShowSuccessAlert(false);
      }, 3000);
      return () => {
        clearTimeout(fadeOutTimer);
        clearTimeout(hideTimer);
      };
    } else {
      setIsSuccessAlertVisible(false);
    }
  }, [showSuccessAlert]);

  /**
   * Gère la soumission du formulaire
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setShowWarningAlert(false);
    setShowSuccessAlert(false);

    // Validation des champs requis
    if (
      !nom.trim() ||
      !prenoms.trim() ||
      !email.trim() ||
      !password.trim() ||
      !contact1.trim() ||
      !communeId ||
      !boutiqueId?.trim() ||
      !status.trim()
    ) {
      setShowWarningAlert(true);
      if (!boutiqueId?.trim()) {
        setError("Aucune boutique sélectionnée. Veuillez retourner à la liste des boutiques et sélectionner une boutique.");
      }
      return;
    }

    // Validation de l'email
    if (!validateEmail(email)) {
      setError("Veuillez entrer une adresse email valide");
      return;
    }

    // Validation du commune_id
    if (!validatePositiveInteger(communeId)) {
      setError("Veuillez sélectionner une commune valide");
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

      // Convertir le status de "actif"/"inactif" vers 1/0 comme l'API l'attend
      const statusValue = status.trim().toLowerCase();
      const apiStatus = statusValue === "actif" ? 1 : statusValue === "inactif" ? 0 : parseInt(statusValue, 10);

      // Vérifier que le statut est valide (0 ou 1)
      if (isNaN(apiStatus) || (apiStatus !== 0 && apiStatus !== 1)) {
        setError("Le statut doit être 'Actif' ou 'Inactif'");
        setIsLoading(false);
        return;
      }

      // Préparer les données exactement comme l'API les attend
      // Le role est fixé à "boutique_admin"
      // commune_id doit être envoyé comme string selon l'exemple fourni
      // boutique_id est requis pour l'endpoint POST /boutique-user/store/{boutique_id}
      const userData: CreateBoutiqueUserData = {
        nom: nom.trim(),
        prenoms: prenoms.trim(),
        email: email.trim().toLowerCase(),
        commune_id: communeId, // Envoyer comme string
        role: "boutique_admin", // Fixé à "boutique_admin"
        password: password, // Ne pas trim le mot de passe (peut contenir des espaces voulus)
        contact_1: cleanedContact1, // 10 chiffres exactement
        status: apiStatus, // 1 pour actif, 0 pour inactif
        boutique_id: boutiqueId.trim(), // UUID de la boutique (requis pour l'endpoint)
      };

      const result = await boutiqueUserService.createBoutiqueUser(userData);

      // Vérifier que la création a vraiment réussi
      if (!result.success) {
        throw new Error(result.error || "La création de l'utilisateur de boutique a échoué");
      }

      // Réinitialiser le formulaire après succès confirmé
      resetForm();
      setShowSuccessAlert(true);

      // Rediriger vers la liste des franchisés avec le boutique_id après un court délai
      // pour permettre à l'utilisateur de voir le message de succès
      redirectTimerRef.current = setTimeout(() => {
        navigate(`/boutique-users-table?boutique_id=${boutiqueId}`, { replace: true });
      }, 2000);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue lors de la création de l'utilisateur de boutique";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Réinitialise tous les champs du formulaire
   * Fonction réutilisable pour éviter la duplication de code
   */
  const resetForm = () => {
    setNom("");
    setPrenoms("");
    setEmail("");
    setPassword("");
    setContact1("");
    setCommuneId("");
    setBoutiqueId("");
    setStatus("");
    setError("");
    setShowWarningAlert(false);
    setShowSuccessAlert(false);
  };

  /**
   * Réinitialise tous les champs du formulaire (action utilisateur)
   */
  const handleCancel = () => {
    resetForm();
  };

  // Options pour le statut
  const statusOptions = [
    { value: "actif", label: "Actif" },
    { value: "inactif", label: "Inactif" },
  ];

  // Options pour les communes (transformées depuis la liste)
  const communeOptions = communes.map((commune) => ({
    value: commune.id.toString(),
    label: commune.libelle,
  }));

  return (
    <>
      <PageMeta
        title="Ajouter un franchisé | Proxy Market"
        description="Formulaire de création d'un nouvel utilisateur de boutique (franchisé) sur Proxy Market"
      />

      <PageBreadcrumb
        pageTitle="Ajouter un franchisé"
        items={[
          { label: "Gestion des rôles", href: "/basic-tables" },
          { label: "Liste des boutiques", href: "/basic-tables" },
        ]}
        titleClassName="text-[#04b05d] dark:text-[#04b05d]"
      />

      <div className="grid grid-cols-1 gap-6 max-w-4xl">
        <ComponentCard title="Ajouter un franchisé">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Grille responsive : 1 colonne sur mobile, 2 colonnes sur desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 md:col-span-2">
                  <div className="font-medium mb-1">Erreur de validation</div>
                  <div className="whitespace-pre-line">{error}</div>
                </div>
              )}
              {/* Nom */}
              <div>
                <Label htmlFor="nom">
                  Nom <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="text"
                  id="nom"
                  placeholder="Ex: TOURE"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              {/* Prénoms */}
              <div>
                <Label htmlFor="prenoms">
                  Prénoms <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="text"
                  id="prenoms"
                  placeholder="Ex: Abou"
                  value={prenoms}
                  onChange={(e) => setPrenoms(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              {/* Email - pleine largeur */}
              <div className="md:col-span-2">
                <Label htmlFor="email">
                  Email <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="email"
                  id="email"
                  placeholder="Ex: toure@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              {/* Mot de passe - pleine largeur */}
              <div className="md:col-span-2">
                <Label htmlFor="password">
                  Mot de passe <span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    placeholder="Entrez le mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <span
                    onClick={() => !isLoading && setShowPassword(!showPassword)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                  >
                    {showPassword ? (
                      <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    )}
                  </span>
                </div>
              </div>

              {/* Contact 1 */}
              <div>
                <Label htmlFor="contact1">
                  Contact 1 <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="tel"
                  id="contact1"
                  placeholder="Ex: +225 07 77 19 56 25 (10 chiffres requis)"
                  value={contact1}
                  onChange={(e) => setContact1(e.target.value)}
                  disabled={isLoading}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Le numéro sera automatiquement formaté en 10 chiffres
                </p>
              </div>

              {/* Boutique - Affichée en lecture seule (récupérée depuis l'URL) */}
              <div>
                <Label htmlFor="boutique-display">
                  Boutique <span className="text-error-500">*</span>
                </Label>
                {isLoadingBoutique ? (
                  <div className="h-11 w-full rounded-lg border border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900 flex items-center justify-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Chargement des informations de la boutique...
                    </span>
                  </div>
                ) : (
                  <Input
                    type="text"
                    id="boutique-display"
                    value={selectedBoutique ? selectedBoutique.name : boutiqueId ? `Boutique ID: ${boutiqueId}` : "Aucune boutique sélectionnée"}
                    disabled
                    className="bg-gray-50 dark:bg-gray-900 cursor-not-allowed"
                  />
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  La boutique est automatiquement sélectionnée depuis la liste des boutiques.
                </p>
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
                      className="dark:bg-dark-900"
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
                    className="dark:bg-dark-900"
                    disabled={isLoadingCommunes || isLoading}
                  />
                )}
              </div>

              {/* Rôle - Affiché en lecture seule (fixé à "boutique_admin") */}
              <div>
                <Label htmlFor="role">
                  Rôle <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="text"
                  id="role"
                  value="Administrateur de boutique"
                  disabled
                  className="bg-gray-50 dark:bg-gray-900 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Le rôle est automatiquement défini sur "Administrateur de boutique"
                </p>
              </div>

              {/* Statut */}
              <div>
                <Label>
                  Statut <span className="text-error-500">*</span>
                </Label>
                <Select
                  options={statusOptions}
                  placeholder="Sélectionnez un statut"
                  value={status}
                  onChange={(value) => setStatus(value)}
                  className="dark:bg-dark-900"
                  disabled={isLoading}
                />
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
                {isLoading ? "Création en cours..." : "Ajouter le franchisé"}
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
                message="Tous les champs sont requis"
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
                title="Franchisé créé avec succès"
                message="Le franchisé a été créé avec succès."
                showLink={false}
              />
            </div>
          )}
        </ComponentCard>
      </div>
    </>
  );
}

