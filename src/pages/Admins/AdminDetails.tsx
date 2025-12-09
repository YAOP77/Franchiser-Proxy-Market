/**
 * Page AdminDetails - Détails d'un administrateur
 *
 * Affiche les informations complètes d'un administrateur avec
 * un accès aux actions de modification et suppression.
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import Alert from "../../components/ui/alert/Alert";
import EditAdminModal from "../../components/modals/EditAdminModal";
import adminService, { Admin } from "../../services/api/adminService";
import { formatPhoneNumber } from "../../utils/phoneUtils";
import { PencilIcon } from "../../icons";
import { Modal } from "../../components/ui/modal";

export default function AdminDetails() {
  const { adminId } = useParams<{ adminId: string }>();
  const navigate = useNavigate();

  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const loadAdmin = async () => {
    if (!adminId) {
      setError("Identifiant administrateur manquant.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      const adminData = await adminService.getAdminById(adminId);
      setAdmin(adminData);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur lors du chargement de l'administrateur";
      setError(message);
      setAdmin(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdmin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminId]);

  const handleOpenEditModal = () => {
    setSuccessMessage("");
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
  };

  const handleEditSuccess = async () => {
    await loadAdmin();
    setSuccessMessage("Administrateur modifié avec succès.");
    setIsEditModalOpen(false);
  };

  const handleDelete = async () => {
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!admin || !admin.id) {
      return;
    }

    try {
      setIsDeleting(true);
      await adminService.deleteAdmin(admin.id);
      navigate("/admins-table", { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur lors de la suppression de l'administrateur";
      setError(message);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const statusLabel = useMemo(() => {
    if (admin?.status_text) {
      return admin.status_text;
    }
    if (typeof admin?.status === "number") {
      return admin.status === 1 ? "Actif" : "Inactif";
    }
    return "Non défini";
  }, [admin]);

  const statusColor = useMemo(() => {
    if (admin?.status_text) {
      return admin.status_text.toLowerCase().includes("actif") ? "success" : "error";
    }
    if (typeof admin?.status === "number") {
      return admin.status === 1 ? "success" : "error";
    }
    return "warning";
  }, [admin]);

  const formatDate = (dateValue?: string) => {
    if (!dateValue) {
      return "—";
    }
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) {
      return dateValue;
    }
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
      <p className="mb-1.5 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-800 dark:text-white/90">{value && String(value).trim().length > 0 ? value : "—"}</p>
    </div>
  );

  const communeLabel = useMemo(() => {
    if (!admin?.commune_id) {
      return "—";
    }

    if (typeof admin.commune_id === "string" && admin.commune_id.trim().length > 0) {
      return admin.commune_id;
    }

    return String(admin.commune_id);
  }, [admin]);

  return (
    <>
      <PageMeta
        title={admin ? `${admin.prenoms ?? ""} ${admin.nom ?? ""} | Administrateur` : "Administrateur"}
        description="Consultez et gérez les informations d'un administrateur"
      />
      <PageBreadcrumb
        pageTitle="Détails de l'administrateur"
        items={[
          { label: "Administration", href: "/admins-table" },
          { label: "Liste des administrateurs", href: "/admins-table" },
        ]}
        titleClassName="text-[#04b05d] dark:text-[#04b05d]"
      />

      <div className="space-y-6">
        {error && !isLoading && (
          <Alert variant="error" title="Erreur" message={error} />
        )}

        {successMessage && (
          <Alert variant="success" title="Succès" message={successMessage} />
        )}

        <ComponentCard
          title={admin ? `${admin.prenoms ?? ""} ${admin.nom ?? ""}`.trim() || "Administrateur" : "Administrateur"}
          action={
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                size="sm"
                startIcon={<PencilIcon className="size-4" />}
                onClick={handleOpenEditModal}
                className="bg-[#04b05d] hover:bg-[#039a52] text-white"
                disabled={!admin}
              >
                Modifier
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDelete}
                className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                disabled={!admin}
              >
                Supprimer
              </Button>
            </div>
          }
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#04b05d] border-t-transparent" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Chargement des informations...</p>
            </div>
          ) : admin ? (
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                  <p className="text-base font-medium text-gray-800 dark:text-white/90">{admin.email ?? "—"}</p>
                </div>
                <Badge color={statusColor} size="sm">
                  {statusLabel}
                </Badge>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {renderField("Prénoms", admin.prenoms)}
                {renderField("Nom", admin.nom)}
                {renderField("Rôle", admin.role)}
                {renderField("Contact principal", admin.contact_1 ? formatPhoneNumber(admin.contact_1) : "—")}
                {renderField("Contact secondaire", admin.contact_2 ? formatPhoneNumber(admin.contact_2) : "—")}
                {renderField("Commune", communeLabel)}
                {renderField("Adresse", admin.adresse)}
                {renderField("Créé le", formatDate(admin.created_at))}
                {renderField("Mis à jour le", formatDate(admin.updated_at))}
              </div>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">Aucune information disponible.</p>
          )}
        </ComponentCard>
      </div>

      <EditAdminModal
        isOpen={isEditModalOpen && !!admin}
        onClose={handleCloseEditModal}
        admin={admin}
        onSuccess={handleEditSuccess}
      />

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          if (!isDeleting) {
            setIsDeleteModalOpen(false);
          }
        }}
        className="max-w-md"
      >
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Confirmer la suppression</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Êtes-vous sûr de vouloir supprimer cet administrateur ? Cette action est irréversible.
          </p>

          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Annuler
            </Button>
            <Button
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Suppression..." : "Supprimer"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
