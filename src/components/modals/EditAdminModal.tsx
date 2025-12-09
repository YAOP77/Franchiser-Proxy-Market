/**
 * Composant EditAdminModal - Modal de modification d'administrateur
 * 
 * Affiche un formulaire pour modifier les informations d'un administrateur
 */

import { useState, useEffect } from "react";
import { Modal } from "../ui/modal";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Select from "../form/Select";
import Button from "../ui/button/Button";
import Alert from "../ui/alert/Alert";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import adminService, { Admin, UpdateAdminData, Commune } from "../../services/api/adminService";
import { cleanPhoneNumber, validatePhoneNumber } from "../../utils/phoneUtils";
import { validateEmail } from "../../utils/validationUtils";

interface PasswordFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function PasswordField({ value, onChange, placeholder }: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        type={isVisible ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="pr-11"
      />
      <button
        type="button"
        onClick={() => setIsVisible((prev) => !prev)}
        className="absolute inset-y-0 right-3 flex items-center text-gray-800 hover:text-gray-900 dark:text-white/70 dark:hover:text-white"
        aria-label={isVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
      >
        {isVisible ? <EyeIcon className="size-5" /> : <EyeCloseIcon className="size-5" />}
      </button>
    </div>
  );
}

interface EditAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  admin: Admin | null;
  onSuccess: () => void;
}

export default function EditAdminModal({
  isOpen,
  onClose,
  admin,
  onSuccess,
}: EditAdminModalProps) {
  // État du formulaire
  const [nom, setNom] = useState("");
  const [prenoms, setPrenoms] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [contact1, setContact1] = useState("");
  const [contact2, setContact2] = useState("");
  const [role, setRole] = useState<"admin" | "caissier" | "commercial" | "super_admin" | "">("");
  const [communeId, setCommuneId] = useState<string>("");
  const [adresse, setAdresse] = useState("");
  const [status, setStatus] = useState("");

  // État pour l'affichage du mot de passe (géré par PasswordField)

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

  // Charger les données de l'administrateur quand le modal s'ouvre
  useEffect(() => {
    if (isOpen && admin) {
      setNom(admin.nom || "");
      setPrenoms(admin.prenoms || "");
      setEmail(admin.email || "");
      setPassword("");
      setContact1(admin.contact_1 || "");
      setContact2(admin.contact_2 || "");
      const adminRole = admin.role as "admin" | "caissier" | "commercial" | "super_admin" | "";
      setRole(adminRole || "");
      // S'assurer que commune_id est bien converti en string
      const adminCommuneId = admin.commune_id;
      if (adminCommuneId !== null && adminCommuneId !== undefined) {
        setCommuneId(adminCommuneId.toString());
      } else {
        setCommuneId("");
      }
      setAdresse(admin.adresse || "");
      // Convertir le status de number (1/0) vers "actif"/"inactif" pour le formulaire
      // admin.status est toujours un number selon l'interface Admin
      setStatus(admin.status === 1 ? "actif" : "inactif");
      setError("");
      setShowWarningAlert(false);
      setShowSuccessAlert(false);
    }
  }, [isOpen, admin]);

  // Charger la liste des communes
  useEffect(() => {
    if (isOpen) {
      const loadCommunes = async () => {
        try {
          setIsLoadingCommunes(true);
          const communesList = await adminService.getCommunes();
          setCommunes(communesList);
        } catch (error) {
          setCommunes([]);
        } finally {
          setIsLoadingCommunes(false);
        }
      };
      loadCommunes();
    }
  }, [isOpen]);

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
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setShowWarningAlert(false);
    setShowSuccessAlert(false);

    if (!admin) {
      setError("Aucun administrateur sélectionné");
      return;
    }

    // Validation des champs requis (mot de passe optionnel)
    // Vérifier que tous les champs requis sont remplis
    const trimmedNom = nom.trim();
    const trimmedPrenoms = prenoms.trim();
    const trimmedEmail = email.trim();
    const trimmedContact1 = contact1.trim();
    const trimmedAdresse = adresse.trim();
    // S'assurer que communeId est une string
    const communeIdString = typeof communeId === 'string' ? communeId : String(communeId || '');
    const trimmedCommuneId = communeIdString.trim();
    const statusValue = status && typeof status === 'string' ? status.trim() : '';
    
    // Validation des champs obligatoires
    if (
      !trimmedNom || 
      !trimmedPrenoms || 
      !trimmedEmail ||
      !trimmedContact1 || 
      !role || 
      !trimmedCommuneId || 
      !trimmedAdresse || 
      !statusValue
    ) {
      setShowWarningAlert(true);
      return;
    }

    // Validation de l'email
    if (!validateEmail(trimmedEmail)) {
      setError("Veuillez entrer une adresse email valide");
      return;
    }

    // Validation de la commune - vérifier d'abord si elle est vide
    if (!trimmedCommuneId || trimmedCommuneId.length === 0) {
      setError("Veuillez sélectionner une commune");
      return;
    }

    // Validation que la commune est un nombre valide
    const parsedCommuneId = parseInt(trimmedCommuneId, 10);
    
    // Vérification que le parsing a réussi et que c'est un nombre positif
    if (isNaN(parsedCommuneId) || parsedCommuneId <= 0) {
      setError("Veuillez sélectionner une commune valide");
      return;
    }

    // Vérifier que la commune sélectionnée existe dans la liste des communes disponibles
    // Seulement si les communes sont chargées (pour éviter les erreurs si l'API n'a pas encore répondu)
    if (communes.length > 0) {
      const communeExists = communes.some((commune) => commune.id === parsedCommuneId);
      if (!communeExists) {
        setError("La commune sélectionnée n'est pas disponible");
        return;
      }
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

      // Convertir le status de "actif"/"inactif" vers "1"/"0" comme l'API l'attend
      const statusValueNormalized = statusValue.toLowerCase();
      const apiStatus = statusValueNormalized === "actif" ? "1" : statusValueNormalized === "inactif" ? "0" : statusValue;

      // Préparer les données de modification
      const adminData: UpdateAdminData = {
        nom: trimmedNom,
        prenoms: trimmedPrenoms,
        email: trimmedEmail.toLowerCase(),
        contact_1: cleanedContact1,
        role: (role === "super_admin" ? "admin" : role) as "admin" | "caissier" | "commercial",
        commune_id: parsedCommuneId,
        adresse: trimmedAdresse,
        status: apiStatus, // "1" pour actif, "0" pour inactif
      };

      // Ajouter le mot de passe seulement s'il est fourni
      if (password && password.trim()) {
        adminData.password = password;
      }

      // Ajouter contact_2 seulement s'il n'est pas vide
      if (contact2 && contact2.trim()) {
        if (validatePhoneNumber(contact2)) {
          adminData.contact_2 = cleanPhoneNumber(contact2);
        } else {
          setError("Le numéro de téléphone (Contact 2) doit contenir exactement 10 chiffres");
          setIsLoading(false);
          return;
        }
      }

      const result = await adminService.updateAdmin(admin.id, adminData);

      // Vérifier que la modification a vraiment réussi
      if (!result.success) {
        throw new Error(result.message || "La modification de l'administrateur a échoué");
      }

      setError("");
      setShowSuccessAlert(true);

      // Fermer le modal et rafraîchir la liste après un court délai
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue lors de la modification de l'administrateur";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Réinitialise tous les champs du formulaire
   */
  const handleCancel = () => {
    if (admin) {
      setNom(admin.nom || "");
      setPrenoms(admin.prenoms || "");
      setEmail(admin.email || "");
      setPassword("");
      setContact1(admin.contact_1 || "");
      setContact2(admin.contact_2 || "");
      const adminRole = admin.role as "admin" | "caissier" | "commercial" | "super_admin" | "";
      setRole(adminRole || "");
      // S'assurer que commune_id est bien converti en string
      const adminCommuneId = admin.commune_id;
      if (adminCommuneId !== null && adminCommuneId !== undefined) {
        setCommuneId(adminCommuneId.toString());
      } else {
        setCommuneId("");
      }
      setAdresse(admin.adresse || "");
      // Convertir le status de number (1/0) vers "actif"/"inactif" pour le formulaire
      setStatus(admin.status === 1 ? "actif" : "inactif");
    }
    setError("");
    setShowWarningAlert(false);
    setShowSuccessAlert(false);
  };

  const roleOptions = [
    { value: "admin", label: "Administrateur" },
    { value: "caissier", label: "Caissier" },
    { value: "commercial", label: "Commercial" },
  ];

  const statusOptions = [
    { value: "actif", label: "Actif" },
    { value: "inactif", label: "Inactif" },
  ];

  const communeOptions = communes.map((commune) => ({
    value: commune.id.toString(),
    label: commune.libelle,
  }));

  if (!isOpen || !admin) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-6">
          Modifier l'administrateur
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
              <div className="font-medium mb-1">Erreur de validation</div>
              <div className="whitespace-pre-line">{error}</div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <Label htmlFor="edit-nom">
                Nom <span className="text-error-500">*</span>
              </Label>
              <Input
                type="text"
                id="edit-nom"
                placeholder="Entrez le nom"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="edit-prenoms">
                Prénoms <span className="text-error-500">*</span>
              </Label>
              <Input
                type="text"
                id="edit-prenoms"
                placeholder="Entrez les prénoms"
                value={prenoms}
                onChange={(e) => setPrenoms(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="edit-email">
                Email <span className="text-error-500">*</span>
              </Label>
              <Input
                type="email"
                id="edit-email"
                placeholder="exemple@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="edit-password">Mot de passe</Label>
              <PasswordField
                value={password}
                onChange={setPassword}
                placeholder="Entrez le mot de passe"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Laissez vide pour conserver le mot de passe actuel
              </p>
            </div>

            <div>
              <Label htmlFor="edit-contact1">
                Contact 1 <span className="text-error-500">*</span>
              </Label>
              <Input
                type="tel"
                id="edit-contact1"
                placeholder="Ex: +225 07 12 34 56 78 (10 chiffres requis)"
                value={contact1}
                onChange={(e) => setContact1(e.target.value)}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Le numéro sera automatiquement formaté en 10 chiffres
              </p>
            </div>

            <div>
              <Label htmlFor="edit-contact2">Contact 2</Label>
              <Input
                type="tel"
                id="edit-contact2"
                placeholder="Ex: +225 05 12 34 56 78 (optionnel, 10 chiffres requis)"
                value={contact2}
                onChange={(e) => setContact2(e.target.value)}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Optionnel - 10 chiffres requis si fourni
              </p>
            </div>

            <div>
              <Label htmlFor="edit-role">
                Rôle <span className="text-error-500">*</span>
              </Label>
              <Select
                value={role}
                onChange={(value: string) => setRole(value as "admin" | "caissier" | "commercial" | "super_admin" | "")}
                options={roleOptions}
                placeholder="Sélectionnez un rôle"
              />
            </div>

            <div>
              <Label htmlFor="edit-commune">
                Commune <span className="text-error-500">*</span>
              </Label>
              <Select
                value={communeId}
                onChange={(value: string) => setCommuneId(value)}
                options={communeOptions}
                placeholder={isLoadingCommunes ? "Chargement..." : "Sélectionnez une commune"}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="edit-adresse">
                Adresse <span className="text-error-500">*</span>
              </Label>
              <Input
                type="text"
                id="edit-adresse"
                placeholder="Entrez l'adresse complète"
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="edit-status">
                Status <span className="text-error-500">*</span>
              </Label>
              <Select
                value={status}
                onChange={(value: string) => setStatus(value)}
                options={statusOptions}
                placeholder="Sélectionnez un status"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? "Modification..." : "Modifier l'administrateur"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Annuler
            </Button>
          </div>
        </form>

        {/* Alerte d'avertissement */}
        {showWarningAlert && (
          <div
            className={`mt-4 transition-opacity duration-300 ${
              isWarningAlertVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            <Alert variant="warning" title="Attention" message="Tous les champs sont requis" />
          </div>
        )}

        {/* Alerte de succès */}
        {showSuccessAlert && (
          <div
            className={`mt-4 transition-opacity duration-300 ${
              isSuccessAlertVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            <Alert variant="success" title="Succès" message="Administrateur modifié avec succès" />
          </div>
        )}
      </div>
    </Modal>
  );
}

