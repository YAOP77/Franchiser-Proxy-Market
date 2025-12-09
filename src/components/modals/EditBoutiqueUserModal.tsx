/**
 * Modal d'édition d'un franchisé (utilisateur de boutique)
 * 
 * Permet de modifier les informations d'un franchisé existant
 */

import { useState, useEffect, useCallback } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Alert from "../ui/alert/Alert";
import Input from "../form/input/InputField";
import Select from "../form/Select";
import boutiqueUserService, { BoutiqueUser, UpdateBoutiqueUserData } from "../../services/api/boutiqueUserService";
import { adminService, Commune } from "../../services/api/adminService";

interface EditBoutiqueUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  boutiqueUser: BoutiqueUser | null;
  boutiqueId: string;
}

const EditBoutiqueUserModal = ({
  isOpen,
  onClose,
  onSuccess,
  boutiqueUser,
  boutiqueId,
}: EditBoutiqueUserModalProps) => {
  // États du formulaire
  const [formData, setFormData] = useState<UpdateBoutiqueUserData>({
    nom: "",
    prenoms: "",
    email: "",
    contact_1: "",
    contact_2: "",
    commune_id: "",
    role: "boutique_admin",
    password: "",
    status: 1,
  });

  const [communes, setCommunes] = useState<Commune[]>([]);
  const [isLoadingCommunes, setIsLoadingCommunes] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Charger les communes au montage
  useEffect(() => {
    const loadCommunes = async () => {
      setIsLoadingCommunes(true);
      try {
        const communesList = await adminService.getCommunes();
        setCommunes(communesList);
      } catch (err) {
        console.error("Erreur lors du chargement des communes:", err);
      } finally {
        setIsLoadingCommunes(false);
      }
    };

    if (isOpen) {
      loadCommunes();
    }
  }, [isOpen]);

  // Pré-remplir le formulaire avec les données du franchisé
  useEffect(() => {
    if (boutiqueUser && isOpen) {
      setFormData({
        nom: boutiqueUser.nom || "",
        prenoms: boutiqueUser.prenoms || "",
        email: boutiqueUser.email || "",
        contact_1: boutiqueUser.contact_1 || "",
        contact_2: boutiqueUser.contact_2 || "",
        commune_id: boutiqueUser.commune_id ? String(boutiqueUser.commune_id) : "",
        role: (boutiqueUser.role as "boutique_admin") || "boutique_admin",
        password: "", // Vide par défaut (optionnel)
        status: boutiqueUser.status || 1,
      });
      setError("");
      setValidationErrors({});
    }
  }, [boutiqueUser, isOpen]);

  /**
   * Valider le formulaire
   */
  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.nom.trim()) {
      errors.nom = "Le nom est requis";
    }

    if (!formData.prenoms.trim()) {
      errors.prenoms = "Le(s) prénom(s) est/sont requis";
    }

    if (!formData.email.trim()) {
      errors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "L'email n'est pas valide";
    }

    if (!formData.contact_1.trim()) {
      errors.contact_1 = "Le contact principal est requis";
    } else if (!/^\d{10}$/.test(formData.contact_1.replace(/\s/g, ""))) {
      errors.contact_1 = "Le contact doit contenir 10 chiffres";
    }

    if (formData.contact_2 && formData.contact_2.trim() && !/^\d{10}$/.test(formData.contact_2.replace(/\s/g, ""))) {
      errors.contact_2 = "Le contact secondaire doit contenir 10 chiffres";
    }

    if (!formData.commune_id) {
      errors.commune_id = "La commune est requise";
    }

    // Le mot de passe est optionnel lors de la modification
    if (formData.password && formData.password.trim() && formData.password.length < 6) {
      errors.password = "Le mot de passe doit contenir au moins 6 caractères";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  /**
   * Gérer le changement de valeur des champs
   */
  const handleChange = useCallback((field: keyof UpdateBoutiqueUserData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Effacer l'erreur de validation pour ce champ
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [validationErrors]);

  /**
   * Soumettre le formulaire
   */
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!boutiqueUser) {
      setError("Aucun franchisé sélectionné");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const result = await boutiqueUserService.updateBoutiqueUser(
        boutiqueUser.id,
        boutiqueId,
        formData
      );

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.error || "Erreur lors de la modification du franchisé");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Une erreur est survenue";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, boutiqueUser, boutiqueId, onSuccess, onClose]);

  /**
   * Fermer le modal et réinitialiser
   */
  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      setError("");
      setValidationErrors({});
      onClose();
    }
  }, [isSubmitting, onClose]);

  // Options pour le statut
  const statusOptions = [
    { value: "1", label: "Actif" },
    { value: "0", label: "Inactif" },
  ];

  // Options pour les communes
  const communeOptions = communes.map((commune) => ({
    value: String(commune.id),
    label: commune.libelle,
  }));

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-5xl">
      <form onSubmit={handleSubmit} className="space-y-6 p-6">
        {/* En-tête */}
        <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Modifier le franchisé
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {boutiqueUser && `${boutiqueUser.prenoms} ${boutiqueUser.nom}`}
          </p>
        </div>

        {/* Message d'erreur global */}
        {error && (
          <Alert variant="error" title="Erreur" message={error} />
        )}

        {/* Formulaire */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Nom */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nom <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={formData.nom}
              onChange={(e) => handleChange("nom", e.target.value)}
              placeholder="Entrez le nom"
              disabled={isSubmitting}
            />
            {validationErrors.nom && (
              <p className="text-sm text-red-600 mt-1">{validationErrors.nom}</p>
            )}
          </div>

          {/* Prénoms */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Prénom(s) <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={formData.prenoms}
              onChange={(e) => handleChange("prenoms", e.target.value)}
              placeholder="Entrez le(s) prénom(s)"
              disabled={isSubmitting}
            />
            {validationErrors.prenoms && (
              <p className="text-sm text-red-600 mt-1">{validationErrors.prenoms}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="exemple@email.com"
              disabled={isSubmitting}
            />
            {validationErrors.email && (
              <p className="text-sm text-red-600 mt-1">{validationErrors.email}</p>
            )}
          </div>

          {/* Contact principal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Contact principal <span className="text-red-500">*</span>
            </label>
            <Input
              type="tel"
              value={formData.contact_1}
              onChange={(e) => handleChange("contact_1", e.target.value)}
              placeholder="0123456789"
              disabled={isSubmitting}
            />
            {validationErrors.contact_1 && (
              <p className="text-sm text-red-600 mt-1">{validationErrors.contact_1}</p>
            )}
          </div>

          {/* Contact secondaire */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Contact secondaire
            </label>
            <Input
              type="tel"
              value={formData.contact_2 || ""}
              onChange={(e) => handleChange("contact_2", e.target.value)}
              placeholder="0123456789"
              disabled={isSubmitting}
            />
            {validationErrors.contact_2 && (
              <p className="text-sm text-red-600 mt-1">{validationErrors.contact_2}</p>
            )}
          </div>

          {/* Commune */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Commune <span className="text-red-500">*</span>
            </label>
            <Select
              value={String(formData.commune_id)}
              onChange={(e) => handleChange("commune_id", e.target.value)}
              options={communeOptions}
              placeholder={isLoadingCommunes ? "Chargement..." : "Sélectionnez une commune"}
              disabled={isSubmitting || isLoadingCommunes}
            />
            {validationErrors.commune_id && (
              <p className="text-sm text-red-600 mt-1">{validationErrors.commune_id}</p>
            )}
          </div>

          {/* Mot de passe */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nouveau mot de passe <span className="text-gray-500 text-xs">(optionnel)</span>
            </label>
            <Input
              type="password"
              value={formData.password || ""}
              onChange={(e) => handleChange("password", e.target.value)}
              placeholder="Laissez vide pour ne pas changer"
              disabled={isSubmitting}
            />
            {validationErrors.password && (
              <p className="text-sm text-red-600 mt-1">{validationErrors.password}</p>
            )}
          </div>

          {/* Statut */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Statut <span className="text-red-500">*</span>
            </label>
            <Select
              value={String(formData.status)}
              onChange={(e) => handleChange("status", Number(e.target.value))}
              options={statusOptions}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="order-2 sm:order-1"
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#04b05d] hover:bg-[#039a52] text-white order-1 sm:order-2"
          >
            {isSubmitting ? "Modification..." : "Enregistrer les modifications"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditBoutiqueUserModal;

