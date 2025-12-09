import { useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import ComponentCard from "../components/common/ComponentCard";
import Badge from "../components/ui/badge/Badge";
import Button from "../components/ui/button/Button";
import { Modal } from "../components/ui/modal";
import Input from "../components/form/input/InputField";
import Label from "../components/form/Label";
import Alert from "../components/ui/alert/Alert";
import Select from "../components/form/Select";
import { useAuth } from "../context/AuthContext";
import adminService, { Admin, ModifyProfileData, Commune } from "../services/api/adminService";
import { PencilIcon } from "../icons";
import { cleanPhoneNumber, formatPhoneNumber, validatePhoneNumber } from "../utils/phoneUtils";
import { validateEmail } from "../utils/validationUtils";

type ProfileFormState = {
  prenoms: string;
  nom: string;
  email: string;
  contact1: string;
  contact2: string;
  commune: string;
  adresse: string;
  status: string;
};

export default function UserProfiles() {
  const { user, updateUser } = useAuth();
  const [adminDetails, setAdminDetails] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [formValues, setFormValues] = useState<ProfileFormState>({
    prenoms: "",
    nom: "",
    email: "",
    contact1: "",
    contact2: "",
    commune: "",
    adresse: "",
    status: "",
  });
  const [formError, setFormError] = useState<string>("");
  const [formSuccess, setFormSuccess] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [isLoadingCommunes, setIsLoadingCommunes] = useState<boolean>(false);

  const communeOptions = useMemo(
    () =>
      communes.map((commune): { value: string; label: string } => ({
        value: commune.id.toString(),
        label: commune.libelle,
      })),
    [communes]
  );

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        setError("");
        
        // Essayer d'abord getMyProfile (sans ID, utilise le token)
        try {
          const adminProfile = await adminService.getMyProfile();
          setAdminDetails(adminProfile);
        } catch (myProfileError) {
          // Si getMyProfile échoue, fallback sur getCurrentProfile avec l'ID
          if (!user?.id) {
            throw new Error("Identifiant utilisateur manquant et endpoint /mon-profil non disponible");
          }
          const adminProfile = await adminService.getCurrentProfile(user.id);
          setAdminDetails(adminProfile);
        }
        
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Impossible de récupérer les informations du profil";
        setError(message);
        setAdminDetails(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user?.id]);

  useEffect(() => {
    if (isEditModalOpen) {
      return;
    }

    setFormValues({
      prenoms: adminDetails?.prenoms ?? "",
      nom: adminDetails?.nom ?? "",
      email: user?.email ?? adminDetails?.email ?? "",
      contact1: adminDetails?.contact_1 ?? "",
      contact2: adminDetails?.contact_2 ?? "",
      commune: adminDetails?.commune_id ? String(adminDetails.commune_id) : "",
      adresse: adminDetails?.adresse ?? "",
      status: (() => {
        if (typeof adminDetails?.status === "number") {
          return adminDetails.status === 1 ? "actif" : "inactif";
        }
        if (adminDetails?.status_text) {
          return adminDetails.status_text.toLowerCase().includes("act") ? "actif" : "inactif";
        }
        return "";
      })(),
    });
  }, [adminDetails, user?.email, isEditModalOpen]);

  useEffect(() => {
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
  }, []);

  const fullName = useMemo(() => {
    if (adminDetails) {
      const prenoms = adminDetails.prenoms?.trim() ?? "";
      const nom = adminDetails.nom?.trim() ?? "";
      const combined = `${prenoms} ${nom}`.trim();
      if (combined.length > 0) {
        return combined;
      }
    }
    return user?.name ?? "Utilisateur";
  }, [adminDetails, user]);

  const roleLabel = useMemo(() => {
    const role = adminDetails?.role ?? user?.role;
    if (!role) {
      return "Non défini";
    }
    const map: Record<string, string> = {
      admin: "Administrateur",
      super_admin: "Super Administrateur",
      caissier: "Caissier",
      commercial: "Commercial",
    };
    return map[role] ?? role;
  }, [adminDetails, user]);

  const accountStatus = useMemo(() => {
    if (adminDetails?.status_text) {
      return adminDetails.status_text;
    }
    if (typeof adminDetails?.status === "number") {
      return adminDetails.status === 1 ? "Actif" : "Inactif";
    }
    return "Non défini";
  }, [adminDetails]);

  const statusColor = useMemo(() => {
    if (adminDetails?.status_text) {
      return adminDetails.status_text.toLowerCase().includes("actif") ? "success" : "error";
    }
    if (typeof adminDetails?.status === "number") {
      return adminDetails.status === 1 ? "success" : "error";
    }
    return "warning";
  }, [adminDetails]);

  const defaultAvatars = [
    "/images/user/user-01.jpg",
    "/images/user/user-02.jpg",
    "/images/user/user-03.jpg",
    "/images/user/user-04.jpg",
    "/images/user/user-05.jpg",
    "/images/user/user-06.jpg",
    "/images/user/user-07.jpg",
    "/images/user/user-08.jpg",
  ];

  const profileImage = useMemo(() => {
    if (adminDetails?.image) {
      return adminDetails.image;
    }
    if (adminDetails?.id) {
      const idHash = adminDetails.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return defaultAvatars[idHash % defaultAvatars.length];
    }
    return defaultAvatars[0];
  }, [adminDetails]);

  const formatDate = (value?: string) => {
    if (!value) return "—";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderField = (label: string, value?: string | number | null) => (
    <div>
      <p className="mb-1.5 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className="text-sm font-medium text-gray-800 dark:text-white/90">
        {value && String(value).trim().length > 0 ? value : "—"}
      </p>
    </div>
  );

  const handleOpenEditModal = () => {
    setFormError("");
    setFormSuccess("");
    setFormValues({
      prenoms: adminDetails?.prenoms ?? "",
      nom: adminDetails?.nom ?? "",
      email: user?.email ?? adminDetails?.email ?? "",
      contact1: adminDetails?.contact_1 ?? "",
      contact2: adminDetails?.contact_2 ?? "",
      commune: adminDetails?.commune_id ? String(adminDetails.commune_id) : "",
      adresse: adminDetails?.adresse ?? "",
      status: (() => {
        if (typeof adminDetails?.status === "number") {
          return adminDetails.status === 1 ? "actif" : "inactif";
        }
        if (adminDetails?.status_text) {
          return adminDetails.status_text.toLowerCase().includes("act") ? "actif" : "inactif";
        }
        return "";
      })(),
    });
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setFormError("");
    setFormSuccess("");
  };

  const handleInputChange = (field: keyof ProfileFormState, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleProfileSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedPrenoms = formValues.prenoms.trim();
    const trimmedNom = formValues.nom.trim();
    const trimmedEmail = formValues.email.trim().toLowerCase();
    const trimmedContact1 = formValues.contact1.trim();
    const trimmedContact2 = formValues.contact2.trim();
    const trimmedCommune = formValues.commune.trim();
    const trimmedAdresse = formValues.adresse.trim();
    const trimmedStatus = formValues.status.trim().toLowerCase();

    if (!trimmedPrenoms || !trimmedNom || !trimmedEmail || !trimmedContact1 || !trimmedStatus) {
      setFormError("Les champs Prénoms, Nom, Email, Contact principal et Statut sont obligatoires.");
      setFormSuccess("");
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setFormError("Veuillez renseigner une adresse email valide.");
      setFormSuccess("");
      return;
    }

    if (!validatePhoneNumber(trimmedContact1)) {
      setFormError("Le contact principal doit contenir exactement 10 chiffres (indicatif 225 exclu).");
      setFormSuccess("");
      return;
    }

    if (trimmedContact2 && !validatePhoneNumber(trimmedContact2)) {
      setFormError("Le contact secondaire doit contenir 10 chiffres ou être laissé vide.");
      setFormSuccess("");
      return;
    }

    const cleanedContact1 = cleanPhoneNumber(trimmedContact1);
    const cleanedContact2 = trimmedContact2 ? cleanPhoneNumber(trimmedContact2) : undefined;

    const payload: ModifyProfileData = {
      nom: trimmedNom,
      prenoms: trimmedPrenoms,
      email: trimmedEmail,
      contact_1: cleanedContact1,
      status: trimmedStatus === "actif" || trimmedStatus === "1" ? "1" : "0",
    };

    if (cleanedContact2) {
      payload.contact_2 = cleanedContact2;
    }

    if (trimmedCommune.length > 0) {
      const communeMatch = communeOptions.find((option) => option.value === trimmedCommune);
      const parsedCommune = communeMatch ? parseInt(communeMatch.value, 10) : parseInt(trimmedCommune, 10);
      if (!Number.isNaN(parsedCommune)) {
        payload.commune_id = parsedCommune;
      }
    }

    if (trimmedAdresse.length > 0) {
      payload.adresse = trimmedAdresse;
    }

    if (adminDetails?.role) {
      payload.role = adminDetails.role;
    }

    setIsSubmitting(true);
    setFormError("");
    setFormSuccess("");

    try {
      const response = await adminService.modifyProfile(payload);

      const updatedAt = new Date().toISOString();

      setAdminDetails((prev) => {
        if (!prev) {
          return prev;
        }
        return {
          ...prev,
          prenoms: payload.prenoms,
          nom: payload.nom,
          email: payload.email,
          contact_1: payload.contact_1,
          contact_2: payload.contact_2 ?? null,
          commune_id: payload.commune_id ?? prev.commune_id,
          adresse: payload.adresse ?? prev.adresse,
          status: payload.status ? (payload.status === "1" ? 1 : 0) : prev.status,
          status_text: payload.status === "1" ? "Actif" : "Inactif",
          updated_at: updatedAt,
        };
      });

      const displayName = `${payload.prenoms} ${payload.nom}`.trim();
      updateUser({
        name: displayName.length > 0 ? displayName : user?.name,
        email: payload.email,
        role: user?.role,
      });

      setFormSuccess(response.message || "Profil mis à jour avec succès.");
      setFormError("");

      setFormValues({
        prenoms: payload.prenoms,
        nom: payload.nom,
        email: payload.email,
        contact1: trimmedContact1,
        contact2: trimmedContact2,
        commune: payload.commune_id ? String(payload.commune_id) : "",
        adresse: trimmedAdresse,
        status: payload.status === "1" ? "actif" : "inactif",
      });

      setTimeout(() => {
        setIsEditModalOpen(false);
        setFormSuccess("");
      }, 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur lors de la modification du profil";
      setFormError(message);
      setFormSuccess("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Profil administrateur | Proxy Market"
        description="Consultez les informations de votre compte administrateur"
      />
      <PageBreadcrumb
        pageTitle="Profil"
        items={[
          { label: "Home", href: "/" },
        ]}
        titleClassName="text-[#04b05d] dark:text-[#04b05d]"
      />

        <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-4 py-10">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#04b05d] border-t-transparent" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Chargement des informations du profil…</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col items-center gap-4 text-center lg:flex-row lg:text-left">
                <div className="h-24 w-24 overflow-hidden rounded-full border border-gray-200 dark:border-gray-700">
                  <img
                    src={profileImage}
                    alt={fullName}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex flex-col items-center gap-2 lg:flex-row lg:items-center lg:gap-3">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">{fullName}</h2>
                    <Badge color={statusColor} size="sm">
                      {accountStatus}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email ?? "—"}</p>
                  <p className="text-sm font-medium text-[#04b05d]">{roleLabel}</p>
                </div>
              </div>

              <div className="flex items-center justify-center lg:justify-end">
                <Button
                  onClick={handleOpenEditModal}
                  startIcon={<PencilIcon className="size-4" />}
                  className="bg-[#04b05d] hover:bg-[#039a52] text-white"
                >
                  Modifier mon profil
                </Button>
              </div>
            </div>
          )}
        </div>

        {!isLoading && error && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200">
            {error}
          </div>
        )}

        <ComponentCard title="Informations personnelles">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {renderField("Prénoms", adminDetails?.prenoms)}
            {renderField("Nom", adminDetails?.nom)}
            {renderField("Adresse e-mail", user?.email)}
            {renderField("Rôle", roleLabel)}
          </div>
        </ComponentCard>

        <ComponentCard title="Coordonnées & localisation">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {renderField("Contact principal", adminDetails?.contact_1 ? formatPhoneNumber(adminDetails.contact_1) : undefined)}
            {renderField("Contact secondaire", adminDetails?.contact_2 ? formatPhoneNumber(adminDetails.contact_2) : undefined)}
            {renderField("Commune", (() => {
              if (!adminDetails?.commune_id) {
                return "—";
              }
              const communeIdString = String(adminDetails.commune_id);
              const communeMatch = communeOptions.find((option) => option.value === communeIdString);
              return communeMatch?.label ?? communeIdString;
            })())}
            {renderField("Adresse", adminDetails?.adresse)}
          </div>
        </ComponentCard>

        <ComponentCard title="Suivi du compte">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {renderField("Statut", accountStatus)}
            {renderField("Créé le", formatDate(adminDetails?.created_at))}
            {renderField("Mis à jour le", formatDate(adminDetails?.updated_at))}
          </div>
        </ComponentCard>
      </div>

      <Modal isOpen={isEditModalOpen} onClose={handleCloseEditModal} className="max-w-3xl">
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">Modifier mon profil</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Mettez à jour vos informations personnelles et vos coordonnées.
            </p>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-6">
            {formError && (
              <Alert
                variant="error"
                title="Erreur"
                message={formError}
              />
            )}

            {formSuccess && (
              <Alert
                variant="success"
                title="Succès"
                message={formSuccess}
              />
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <Label htmlFor="profile-prenoms">
                  Prénoms <span className="text-error-500">*</span>
                </Label>
                <Input
                  id="profile-prenoms"
                  type="text"
                  value={formValues.prenoms}
                  onChange={(event) => handleInputChange("prenoms", event.target.value)}
                  placeholder="Ex: Jean"
                />
              </div>

              <div>
                <Label htmlFor="profile-nom">
                  Nom <span className="text-error-500">*</span>
                </Label>
                <Input
                  id="profile-nom"
                  type="text"
                  value={formValues.nom}
                  onChange={(event) => handleInputChange("nom", event.target.value)}
                  placeholder="Ex: KOUASSI"
                />
              </div>

              <div>
                <Label htmlFor="profile-email">
                  Email <span className="text-error-500">*</span>
                </Label>
                <Input
                  id="profile-email"
                  type="email"
                  value={formValues.email}
                  onChange={(event) => handleInputChange("email", event.target.value)}
                  placeholder="Ex: jean.kouassi@example.com"
                />
              </div>

              <div>
                <Label htmlFor="profile-contact1">
                  Contact principal <span className="text-error-500">*</span>
                </Label>
                <Input
                  id="profile-contact1"
                  type="tel"
                  value={formValues.contact1}
                  onChange={(event) => handleInputChange("contact1", event.target.value)}
                  placeholder="Ex: +225 07 12 34 56 78"
                />
              </div>

              <div>
                <Label htmlFor="profile-contact2">Contact secondaire</Label>
                <Input
                  id="profile-contact2"
                  type="tel"
                  value={formValues.contact2}
                  onChange={(event) => handleInputChange("contact2", event.target.value)}
                  placeholder="Ex: +225 05 12 34 56 78"
                />
              </div>

              <div>
                <Label>Commune</Label>
                <Select
                  value={formValues.commune}
                  onChange={(value) => handleInputChange("commune", value)}
                  options={communes.map((commune) => ({
                    value: commune.id.toString(),
                    label: commune.libelle,
                  }))}
                  placeholder={
                    isLoadingCommunes
                      ? "Chargement des communes..."
                      : communes.length > 0
                      ? "Sélectionnez une commune"
                      : "Aucune commune disponible"
                  }
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="profile-adresse">Adresse</Label>
                <Input
                  id="profile-adresse"
                  type="text"
                  value={formValues.adresse}
                  onChange={(event) => handleInputChange("adresse", event.target.value)}
                  placeholder="Ex: Cocody, Angré 7ème Tranche"
                />
              </div>

              <div>
                <Label>
                  Statut <span className="text-error-500">*</span>
                </Label>
                <Select
                  value={formValues.status}
                  onChange={(value) => handleInputChange("status", value)}
                  options={[
                    { value: "actif", label: "Actif" },
                    { value: "inactif", label: "Inactif" },
                  ]}
                  placeholder="Sélectionnez un statut"
                />
        </div>
      </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseEditModal}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="bg-[#04b05d] hover:bg-[#039a52] text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
