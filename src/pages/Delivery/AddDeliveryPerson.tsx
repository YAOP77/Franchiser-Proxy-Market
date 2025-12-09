/**
 * Page AddDeliveryPerson - Créer un livreur
 * 
 * Cette page permet de créer un nouveau livreur sur Proxy Market.
 * Formulaire avec tous les champs requis :
 * - nom, prenoms, email, password
 * - contact1
 * - status
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
import deliveryService, {
  CreateDeliveryPersonData,
} from "../../services/api/deliveryService";
import { cleanPhoneNumber, validatePhoneNumber } from "../../utils/phoneUtils";
import { validateEmail } from "../../utils/validationUtils";

export default function AddDeliveryPerson() {
  const navigate = useNavigate();
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // État du formulaire
  const [nom, setNom] = useState("");
  const [prenoms, setPrenoms] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [contact1, setContact1] = useState("");
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

  // Nettoyer le timer de redirection lors du démontage du composant
  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
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

    // Validation des champs requis avec vérification détaillée
    const trimmedNom = nom.trim();
    const trimmedPrenoms = prenoms.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const trimmedContact1 = contact1.trim();
    const trimmedStatus = status.trim();

    if (
      !trimmedNom ||
      !trimmedPrenoms ||
      !trimmedEmail ||
      !trimmedPassword ||
      !trimmedContact1 ||
      !trimmedStatus
    ) {
      setShowWarningAlert(true);
      return;
    }

    // Validation de l'email
    if (!validateEmail(trimmedEmail)) {
      setError("Veuillez entrer une adresse email valide");
      return;
    }

    setIsLoading(true);

    try {
      // Nettoyer et valider le numéro de téléphone principal
      if (!validatePhoneNumber(trimmedContact1)) {
        setError(
          "Le numéro de téléphone doit contenir exactement 10 chiffres"
        );
        setIsLoading(false);
        return;
      }

      const cleanedContact1 = cleanPhoneNumber(trimmedContact1);

      // Convertir le status de "actif"/"inactif" vers "1"/"0" comme l'API l'attend
      const statusValue = trimmedStatus.toLowerCase();
      const apiStatus =
        statusValue === "actif"
          ? "1"
          : statusValue === "inactif"
          ? "0"
          : trimmedStatus;

      // Préparer les données exactement comme l'API les attend
      const deliveryPersonData: CreateDeliveryPersonData = {
        nom: trimmedNom,
        prenoms: trimmedPrenoms,
        email: trimmedEmail.toLowerCase(),
        password: password, // Ne pas trim le mot de passe (peut contenir des espaces voulus)
        contact1: cleanedContact1, // 10 chiffres exactement
        status: apiStatus, // "1" pour actif, "0" pour inactif
      };

      // Appeler l'API pour créer le livreur
      const result = await deliveryService.createDeliveryPerson(
        deliveryPersonData
      );

      // Vérifier que la création a vraiment réussi
      if (!result.success) {
        throw new Error(
          result.error ||
            result.message ||
            "La création du livreur a échoué"
        );
      }

      // Réinitialiser le formulaire après succès confirmé
      resetForm();
      setShowSuccessAlert(true);

      // Rediriger vers la liste des livreurs après un court délai
      // pour permettre à l'utilisateur de voir le message de succès
      redirectTimerRef.current = setTimeout(() => {
        navigate("/livreurs", { replace: true });
      }, 2000);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Une erreur est survenue lors de la création du livreur";
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

  return (
    <>
      <PageMeta
        title="Créer un livreur | Proxy Market"
        description="Formulaire de création d'un nouveau livreur sur Proxy Market"
      />

      <PageBreadcrumb
        pageTitle="Créer un livreur"
        titleClassName="text-[#04b05d] dark:text-[#04b05d]"
        items={[{ label: "Gestion de ma boutique", href: "/mon-store" }]}
      />

      <div className="grid grid-cols-1 gap-6 max-w-4xl">
        <ComponentCard title="Créer un nouveau livreur">
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
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    aria-label={
                      showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"
                    }
                  >
                    {showPassword ? (
                      <EyeCloseIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Contact 1 */}
              <div>
                <Label htmlFor="contact1">
                  Contact <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="tel"
                  placeholder="Ex: 0123456789"
                  value={contact1}
                  onChange={(e) => setContact1(e.target.value)}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  10 chiffres requis
                </p>
              </div>

              {/* Statut */}
              <div>
                <Label htmlFor="status">
                  Statut <span className="text-error-500">*</span>
                </Label>
                <Select
                  value={status}
                  onChange={(value: string) => setStatus(value)}
                  options={statusOptions}
                  placeholder="Sélectionner un statut"
                />
              </div>
            </div>

            {/* Alertes */}
            {showWarningAlert && isWarningAlertVisible && (
              <Alert
                variant="warning"
                title="Attention"
                message="Veuillez remplir tous les champs obligatoires"
              />
            )}

            {showSuccessAlert && isSuccessAlertVisible && (
              <Alert
                variant="success"
                title="Succès"
                message="Livreur créé avec succès !"
              />
            )}

            {/* Boutons d'action */}
            <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button type="submit" variant="primary" disabled={isLoading}>
                {isLoading ? "Création en cours..." : "Créer le livreur"}
              </Button>
            </div>
          </form>
        </ComponentCard>
      </div>
    </>
  );
}
