/**
 * Page BoutiqueDetails - Détails d'une boutique
 *
 * Affiche les informations complètes d'une boutique avec
 * ses coordonnées, contacts, adresse, etc.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import Alert from "../../components/ui/alert/Alert";
import { Modal } from "../../components/ui/modal";
import EditBoutiqueModal from "../../components/modals/EditBoutiqueModal";
import franchiseService, { Boutique } from "../../services/api/franchiseService";
import { adminService, Commune } from "../../services/api/adminService";
import { formatPhoneNumber } from "../../utils/phoneUtils";
import { PencilIcon } from "../../icons";

/**
 * Retourne le label du statut
 */
const getStatusLabel = (status: number): string => {
  return status === 1 ? "Actif" : "Inactif";
};

/**
 * Retourne la couleur du badge selon le statut
 */
const getStatusColor = (status: number): "success" | "error" => {
  return status === 1 ? "success" : "error";
};

/**
 * Formate une date en format lisible
 */
const formatDate = (dateValue?: string | null): string => {
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

export default function BoutiqueDetails() {
  const { boutiqueId } = useParams<{ boutiqueId: string }>();
  const navigate = useNavigate();

  const [boutique, setBoutique] = useState<Boutique | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const loadBoutique = useCallback(async () => {
    if (!boutiqueId) {
      setError("Identifiant boutique manquant.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      const boutiqueData = await franchiseService.getBoutiqueById(boutiqueId);
      setBoutique(boutiqueData);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur lors du chargement de la boutique";
      setError(message);
      setBoutique(null);
    } finally {
      setIsLoading(false);
    }
  }, [boutiqueId]);

  useEffect(() => {
    loadBoutique();
  }, [loadBoutique]);

  // Charger la liste des communes pour afficher le nom de la commune
  useEffect(() => {
    const loadCommunes = async () => {
      try {
        const communesList = await adminService.getCommunes();
        setCommunes(communesList);
      } catch (error) {
        // Ignorer l'erreur silencieusement, on affichera juste l'ID de la commune
        setCommunes([]);
      }
    };

    loadCommunes();
  }, []);

  const statusLabel = useMemo(() => {
    if (!boutique) return "Non défini";
    return getStatusLabel(boutique.status);
  }, [boutique]);

  const statusColor = useMemo(() => {
    if (!boutique) return "warning";
    return getStatusColor(boutique.status);
  }, [boutique]);

  const communeLabel = useMemo(() => {
    if (!boutique?.commune_id) {
      return "—";
    }

    // Chercher le nom de la commune dans la liste chargée
    const commune = communes.find((c) => c.id === boutique.commune_id);
    if (commune) {
      return commune.libelle;
    }

    // Si la commune n'est pas trouvée, afficher l'ID
    return String(boutique.commune_id);
  }, [boutique, communes]);

  const handleOpenEditModal = () => {
    setSuccessMessage("");
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
  };

  const handleEditSuccess = async () => {
    await loadBoutique();
    setSuccessMessage("Boutique modifiée avec succès.");
    setIsEditModalOpen(false);
  };

  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!boutique || !boutique.id) {
      return;
    }

    try {
      setIsDeleting(true);
      await franchiseService.deleteBoutique(boutique.id);
      navigate("/basic-tables", { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur lors de la suppression de la boutique";
      setError(message);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const renderField = (label: string, value?: string | number | null) => (
    <div>
      <p className="mb-1.5 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-800 dark:text-white/90">
        {value && String(value).trim().length > 0 ? value : "—"}
      </p>
    </div>
  );

  return (
    <>
      <PageMeta
        title={boutique ? `${boutique.name} | Boutique` : "Boutique"}
        description="Consultez les informations d'une boutique"
      />
      <PageBreadcrumb
        pageTitle="Détails de la boutique"
        items={[
          { label: "Gestion des rôles", href: "/basic-tables" },
          { label: "Liste des boutiques", href: "/basic-tables" },
        ]}
        titleClassName="text-[#04b05d] dark:text-[#04b05d]"
      />

      <div className="space-y-6">
        {error && !isLoading && <Alert variant="error" title="Erreur" message={error} />}

        {successMessage && <Alert variant="success" title="Succès" message={successMessage} />}

        <ComponentCard
          title={
            <div className="flex items-center gap-3">
              <span>{boutique ? boutique.name : "Boutique"}</span>
              {boutique && (
                <Badge color={statusColor} size="sm">
                  {statusLabel}
                </Badge>
              )}
            </div>
          }
          action={
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                size="sm"
                startIcon={<PencilIcon className="size-4" />}
                onClick={handleOpenEditModal}
                className="bg-[#04b05d] hover:bg-[#039a52] text-white"
                disabled={!boutique}
              >
                Modifier
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDelete}
                className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                disabled={!boutique}
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
          ) : boutique ? (
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                  <p className="text-base font-medium text-gray-800 dark:text-white/90">
                    {boutique.email ?? "—"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {renderField("Nom de la boutique", boutique.name)}
                {renderField("Email", boutique.email)}
                {renderField(
                  "Contact principal",
                  boutique.contact_1 ? formatPhoneNumber(boutique.contact_1) : "—"
                )}
                {renderField(
                  "Contact secondaire",
                  boutique.contact_2 ? formatPhoneNumber(boutique.contact_2) : "—"
                )}
                {renderField("Adresse", boutique.adresse)}
                {renderField("Commune", communeLabel)}
                {renderField("Détails", boutique.details)}
                {renderField("Créé le", formatDate(boutique.created_at))}
                {renderField("Mis à jour le", formatDate(boutique.updated_at))}
              </div>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              Aucune information disponible.
            </p>
          )}
        </ComponentCard>
      </div>

      <EditBoutiqueModal
        isOpen={isEditModalOpen && !!boutique}
        onClose={handleCloseEditModal}
        boutique={boutique}
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
            Êtes-vous sûr de vouloir supprimer la boutique "{boutique?.name}" ? Cette action est irréversible.
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

