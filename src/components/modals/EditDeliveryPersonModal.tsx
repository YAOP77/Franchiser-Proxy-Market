/**
 * Composant EditDeliveryPersonModal - Modal de modification de livreur
 * 
 * Affiche un formulaire pour modifier les informations d'un livreur
 */

import { useState, useEffect } from "react";
import { Modal } from "../ui/modal";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Select from "../form/Select";
import Button from "../ui/button/Button";
import Alert from "../ui/alert/Alert";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import deliveryService, { DeliveryPerson, UpdateDeliveryPersonData } from "../../services/api/deliveryService";
import { cleanPhoneNumber, validatePhoneNumber } from "../../utils/phoneUtils";
import { validateEmail } from "../../utils/validationUtils";

interface EditDeliveryPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  deliveryPerson: DeliveryPerson | null;
  onSuccess: () => void;
}

export default function EditDeliveryPersonModal({
  isOpen,
  onClose,
  deliveryPerson,
  onSuccess,
}: EditDeliveryPersonModalProps) {
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

  // Charger les données du livreur quand le modal s'ouvre
  useEffect(() => {
    if (isOpen && deliveryPerson) {
      setNom(deliveryPerson.nom || "");
      setPrenoms(deliveryPerson.prenoms || "");
      setEmail(deliveryPerson.email || "");
      setPassword(""); // Ne pas pré-remplir le mot de passe
      setContact1(deliveryPerson.contact1 || "");
      // Convertir le status de number (1/0) vers "1"/"0" pour le formulaire
      if (deliveryPerson.status !== null && deliveryPerson.status !== undefined) {
        setStatus(String(deliveryPerson.status));
      } else {
        setStatus("");
      }
      
      setError("");
      setShowWarningAlert(false);
      setShowSuccessAlert(false);
      setShowPassword(false);
    }
  }, [isOpen, deliveryPerson]);

  // Gère l'affichage et la disparition de l'alerte d'avertissement
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

  // Gère l'affichage et la disparition de l'alerte de succès
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
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    // Validation des champs
    const trimmedNom = nom.trim();
    const trimmedPrenoms = prenoms.trim();
    const trimmedEmail = email.trim();
    const trimmedContact1 = contact1.trim();
    const trimmedPassword = password.trim();

    if (!trimmedNom || !trimmedPrenoms || !trimmedEmail || !trimmedContact1 || !status) {
      setShowWarningAlert(true);
      setError("Attention Veuillez remplir tous les champs obligatoires");
      return;
    }

    // Validation de l'email
    if (!validateEmail(trimmedEmail)) {
      setShowWarningAlert(true);
      setError("L'adresse email n'est pas valide");
      return;
    }

    // Validation du contact (10 chiffres)
    const cleanedContact = cleanPhoneNumber(trimmedContact1);
    if (!validatePhoneNumber(cleanedContact)) {
      setShowWarningAlert(true);
      setError("Le numéro de contact doit contenir 10 chiffres");
      return;
    }

    // Si un mot de passe est fourni, il doit avoir au moins 6 caractères
    if (trimmedPassword && trimmedPassword.length < 6) {
      setShowWarningAlert(true);
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const updateData: UpdateDeliveryPersonData = {
        nom: trimmedNom,
        prenoms: trimmedPrenoms,
        email: trimmedEmail,
        contact1: cleanedContact,
        status: status,
      };

      // Ajouter le mot de passe seulement s'il est fourni
      if (trimmedPassword) {
        updateData.password = trimmedPassword;
      }

      const response = await deliveryService.updateDeliveryPerson(
        deliveryPerson?.id || "",
        updateData
      );

      if (response.success) {
        setShowSuccessAlert(true);
        // Fermer le modal et rafraîchir les données après un court délai
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setError(response.error || "Une erreur est survenue lors de la modification");
        setShowWarningAlert(true);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Une erreur est survenue lors de la modification du livreur";
      setError(errorMessage);
      setShowWarningAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Options pour le statut
  const statusOptions = [
    { value: "1", label: "Actif" },
    { value: "0", label: "Inactif" },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl">
        {/* En-tête du modal */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Modifier le livreur
          </h3>
        </div>

        {/* Corps du modal */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Alertes */}
            {showWarningAlert && (
              <div
                className={`transition-opacity duration-300 ${
                  isWarningAlertVisible ? "opacity-100" : "opacity-0"
                }`}
              >
                <Alert
                  title="Attention"
                  message={error || "Veuillez remplir tous les champs obligatoires"}
                  variant="warning"
                />
              </div>
            )}

            {showSuccessAlert && (
              <div
                className={`transition-opacity duration-300 ${
                  isSuccessAlertVisible ? "opacity-100" : "opacity-0"
                }`}
              >
                <Alert
                  title="Succès"
                  message="Livreur modifié avec succès"
                  variant="success"
                />
              </div>
            )}

            {/* Grille responsive */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nom */}
              <div>
                <Label htmlFor="edit-nom">
                  Nom <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="text"
                  id="edit-nom"
                  placeholder="Ex: KOUASSI"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                />
              </div>

              {/* Prénoms */}
              <div>
                <Label htmlFor="edit-prenoms">
                  Prénoms <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="text"
                  id="edit-prenoms"
                  placeholder="Ex: Jean"
                  value={prenoms}
                  onChange={(e) => setPrenoms(e.target.value)}
                />
              </div>

              {/* Email - pleine largeur */}
              <div className="md:col-span-2">
                <Label htmlFor="edit-email">
                  Email <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="email"
                  id="edit-email"
                  placeholder="Ex: jean.kouassi@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Mot de passe - pleine largeur (optionnel) */}
              <div className="md:col-span-2">
                <Label htmlFor="edit-password">
                  Nouveau mot de passe <span className="text-gray-500 text-xs">(optionnel)</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    id="edit-password"
                    placeholder="Laisser vide pour ne pas modifier"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? (
                      <EyeCloseIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Contact principal */}
              <div className="md:col-span-2">
                <Label htmlFor="edit-contact1">
                  Contact principal <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="tel"
                  id="edit-contact1"
                  placeholder="Ex: 0123456789"
                  value={contact1}
                  onChange={(e) => {
                    const cleaned = cleanPhoneNumber(e.target.value);
                    setContact1(cleaned);
                  }}
                />
              </div>

              {/* Statut */}
              <div className="md:col-span-2">
                <Label htmlFor="edit-status">
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
          </div>

          {/* Boutons d'action */}
          <div className="mt-6 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
            >
              {isLoading ? "Modification..." : "Modifier"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
