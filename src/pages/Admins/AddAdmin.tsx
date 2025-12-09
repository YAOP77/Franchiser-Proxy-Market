/**
 * Page AddAdmin - Créer un administrateur
 * 
 * Cette page permet de créer un nouvel administrateur sur Proxy Market.
 * Formulaire avec tous les champs requis :
 * - nom, prenoms, email, password
 * - contact_1, contact_2 (optionnel)
 * - role (admin, caissier, commercial)
 * - commune_id (liste des communes)
 * - adresse, status
 */

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import Button from "../../components/ui/button/Button";
import Alert from "../../components/ui/alert/Alert";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import adminService, { CreateAdminData, Commune } from "../../services/api/adminService";
import { cleanPhoneNumber, validatePhoneNumber } from "../../utils/phoneUtils";
import { validateEmail, validatePositiveInteger } from "../../utils/validationUtils";

export default function AddAdmin() {
  const navigate = useNavigate();
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // État du formulaire
  const [nom, setNom] = useState("");
  const [prenoms, setPrenoms] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [contact1, setContact1] = useState("");
  const [contact2, setContact2] = useState("");
  const [role, setRole] = useState<"admin" | "caissier" | "commercial" | "">("");
  const [communeId, setCommuneId] = useState("");
  const [adresse, setAdresse] = useState("");
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

  // Nettoyer le timer de redirection lors du démontage du composant
  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  // Charger la liste des communes au montage du composant
  useEffect(() => {
    const loadCommunes = async () => {
      try {
        setIsLoadingCommunes(true);
        const communesList = await adminService.getCommunes();
        setCommunes(communesList);
      } catch (error) {
        // En cas d'erreur, on continue sans communes (elles peuvent être ajoutées manuellement)
        setCommunes([]);
      } finally {
        setIsLoadingCommunes(false);
      }
    };

    loadCommunes();
  }, []);

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
      !role ||
      !communeId ||
      !adresse.trim() ||
      !status.trim()
    ) {
      setShowWarningAlert(true);
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
    
    const parsedCommuneId = parseInt(communeId, 10);

    setIsLoading(true);

    try {
      // Nettoyer et valider le numéro de téléphone principal
      if (!validatePhoneNumber(contact1)) {
        setError("Le numéro de téléphone (Contact 1) doit contenir exactement 10 chiffres");
        setIsLoading(false);
        return;
      }
      
      const cleanedContact1 = cleanPhoneNumber(contact1);

      // Convertir le status de "actif"/"inactif" vers "1"/"0" comme l'API l'attend
      const statusValue = status.trim().toLowerCase();
      const apiStatus = statusValue === "actif" ? "1" : statusValue === "inactif" ? "0" : statusValue;

      // Préparer les données exactement comme l'API les attend
      // Respecter strictement les noms de champs et les valeurs attendues
      const adminData: CreateAdminData = {
        nom: nom.trim(),
        prenoms: prenoms.trim(),
        email: email.trim().toLowerCase(),
        password: password, // Ne pas trim le mot de passe (peut contenir des espaces voulus)
        contact_1: cleanedContact1, // 10 chiffres exactement
        role: role as "admin" | "caissier" | "commercial",
        commune_id: parsedCommuneId,
        adresse: adresse.trim(),
        status: apiStatus, // "1" pour actif, "0" pour inactif
      };

      // Ajouter contact_2 seulement s'il n'est pas vide (optionnel)
      if (contact2 && contact2.trim()) {
        // Vérifier que contact_2 a aussi 10 chiffres s'il est fourni
        if (validatePhoneNumber(contact2)) {
          adminData.contact_2 = cleanPhoneNumber(contact2);
        } else {
          // Si contact_2 est fourni mais n'a pas 10 chiffres, afficher une erreur
          setError("Le numéro de téléphone (Contact 2) doit contenir exactement 10 chiffres");
          setIsLoading(false);
          return;
        }
      }

      const result = await adminService.createAdmin(adminData);

      // Vérifier que la création a vraiment réussi
      if (!result.success) {
        throw new Error(result.message || "La création de l'administrateur a échoué");
      }

      // Réinitialiser le formulaire après succès confirmé
      resetForm();
      setShowSuccessAlert(true);

      // Rediriger vers la liste des administrateurs après un court délai
      // pour permettre à l'utilisateur de voir le message de succès
      redirectTimerRef.current = setTimeout(() => {
        navigate("/admins-table", { replace: true });
      }, 2000);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue lors de la création de l'administrateur";
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
    setContact2("");
    setRole("");
    setCommuneId("");
    setAdresse("");
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

  // Options pour le rôle
  const roleOptions = [
    { value: "admin", label: "Administrateur" },
    { value: "caissier", label: "Caissier" },
    { value: "commercial", label: "Commercial" },
  ];

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
        title="Créer un administrateur | Proxy Market"
        description="Formulaire de création d'un nouvel administrateur sur Proxy Market"
      />

      <PageBreadcrumb pageTitle="Créer un administrateur" titleClassName="text-[#04b05d] dark:text-[#04b05d]" />

      <div className="grid grid-cols-1 gap-6 max-w-4xl">
        <ComponentCard title="Créer un nouvel administrateur">
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
                  placeholder="Ex: KOUASSI"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
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
                  placeholder="Ex: Jean"
                  value={prenoms}
                  onChange={(e) => setPrenoms(e.target.value)}
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
                  placeholder="Ex: jean.kouassi@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
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
                  placeholder="Ex: +225 07 12 34 56 78 (10 chiffres requis)"
                  value={contact1}
                  onChange={(e) => setContact1(e.target.value)}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Le numéro sera automatiquement formaté en 10 chiffres
                </p>
              </div>

              {/* Contact 2 (optionnel) */}
              <div>
                <Label htmlFor="contact2">Contact 2</Label>
                <Input
                  type="tel"
                  id="contact2"
                  placeholder="Ex: +225 05 12 34 56 78 (optionnel, 10 chiffres requis)"
                  value={contact2}
                  onChange={(e) => setContact2(e.target.value)}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Optionnel - 10 chiffres requis si fourni
                </p>
              </div>

              {/* Rôle */}
              <div>
                <Label>
                  Rôle <span className="text-error-500">*</span>
                </Label>
                <Select
                  options={roleOptions}
                  placeholder="Sélectionnez un rôle"
                  value={role}
                  onChange={(value) => setRole(value as "admin" | "caissier" | "commercial")}
                  className="dark:bg-dark-900"
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
                  />
                )}
              </div>

              {/* Adresse - pleine largeur */}
              <div className="md:col-span-2">
                <Label htmlFor="adresse">
                  Adresse <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="text"
                  id="adresse"
                  placeholder="Ex: Cocody, Angré 7ème Tranche"
                  value={adresse}
                  onChange={(e) => setAdresse(e.target.value)}
                />
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
                {isLoading ? "Création en cours..." : "Créer l'administrateur"}
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
                title="Administrateur créé avec succès"
                message="L'administrateur a été créé avec succès."
                showLink={false}
              />
            </div>
          )}
        </ComponentCard>
      </div>
    </>
  );
}

