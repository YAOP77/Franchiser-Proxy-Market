/**
 * Page BoutiqueUserDetails - Détails d'un franchisé (gérant de boutique)
 *
 * Affiche les informations complètes d'un franchisé avec
 * ses coordonnées, son rôle, sa boutique associée, etc.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import Alert from "../../components/ui/alert/Alert";
import { Modal } from "../../components/ui/modal";
import EditBoutiqueUserModal from "../../components/modals/EditBoutiqueUserModal";
import boutiqueUserService, { BoutiqueUser } from "../../services/api/boutiqueUserService";
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
 * Retourne le label du rôle
 */
const getRoleLabel = (role: string): string => {
  const roleLabels: Record<string, string> = {
    boutique_admin: "Administrateur Boutique",
    franchisee: "Franchisé",
    manager: "Gérant",
  };
  return roleLabels[role] || role;
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

/**
 * Page de détails d'un franchisé
 */
const BoutiqueUserDetails = () => {
  const navigate = useNavigate();
  const { id: gerantId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const boutiqueId = searchParams.get("boutique_id");

  // États
  const [isLoading, setIsLoading] = useState(true);
  const [boutiqueUser, setBoutiqueUser] = useState<BoutiqueUser | null>(null);
  const [boutique, setBoutique] = useState<Boutique | null>(null);
  const [commune, setCommune] = useState<Commune | null>(null);
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [isLoadingBoutique, setIsLoadingBoutique] = useState(false);
  const [isLoadingCommune, setIsLoadingCommune] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBoutiqueModalOpen, setIsBoutiqueModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  /**
   * Charger les données du franchisé
   */
  const fetchBoutiqueUserDetails = useCallback(async () => {
    if (!gerantId || !boutiqueId) {
      setError("Paramètres manquants : ID du gérant ou ID de la boutique");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await boutiqueUserService.getBoutiqueUserDetails(gerantId, boutiqueId);

      if (!result.success || !result.data) {
        throw new Error(result.error || "Impossible de charger les détails du franchisé");
      }

      setBoutiqueUser(result.data);

      // Charger les informations de la boutique
      // Utiliser le boutique_id de l'URL car l'API ne le retourne pas toujours dans les données du franchisé
      if (boutiqueId) {
        setIsLoadingBoutique(true);
        try {
          const boutiqueData = await franchiseService.getBoutiqueById(boutiqueId);
          if (boutiqueData) {
            setBoutique(boutiqueData);
          }
        } catch (boutiqueError) {
          console.error("Erreur lors du chargement de la boutique:", boutiqueError);
          // Ne pas bloquer l'affichage si la boutique ne peut pas être chargée
        } finally {
          setIsLoadingBoutique(false);
        }
      }

      // Charger les informations de la commune
      const userCommuneId = result.data.commune_id;
      if (userCommuneId) {
        setIsLoadingCommune(true);
        try {
          const communesData = await adminService.getCommunes();
          if (communesData && communesData.length > 0) {
            const foundCommune = communesData.find(
              (c) => String(c.id) === String(userCommuneId)
            );
            if (foundCommune) {
              setCommune(foundCommune);
            }
          }
        } catch (communeError) {
          console.error("Erreur lors du chargement de la commune:", communeError);
          // Ne pas bloquer l'affichage si la commune ne peut pas être chargée
        } finally {
          setIsLoadingCommune(false);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur lors du chargement";
      setError(errorMessage);
      setIsLoadingBoutique(false);
      setIsLoadingCommune(false);
    } finally {
      setIsLoading(false);
    }
  }, [gerantId, boutiqueId]);

  // Charger les données au montage
  useEffect(() => {
    fetchBoutiqueUserDetails();
  }, [fetchBoutiqueUserDetails]);

  /**
   * Auto-dismiss du message de succès après 3 secondes
   */
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  /**
   * Ouvrir le modal de confirmation de suppression
   */
  const handleDelete = useCallback(() => {
    setIsDeleteModalOpen(true);
  }, []);

  /**
   * Fermer le modal de suppression
   */
  const handleCloseDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(false);
  }, []);

  /**
   * Confirmer la suppression du franchisé
   */
  const handleConfirmDelete = useCallback(async () => {
    if (!gerantId || !boutiqueId) {
      return;
    }

    setIsDeleting(true);
    setError("");

    try {
      const result = await boutiqueUserService.deleteBoutiqueUser(gerantId, boutiqueId);
      
      if (result.success) {
        // Redirection vers la liste des franchisés après suppression réussie
        navigate(`/boutique-users-table?boutique_id=${boutiqueId}`, { replace: true });
      } else {
        setError(result.error || "Erreur lors de la suppression du franchisé");
        setIsDeleteModalOpen(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur lors de la suppression";
      setError(errorMessage);
      setIsDeleteModalOpen(false);
    } finally {
      setIsDeleting(false);
    }
  }, [gerantId, boutiqueId, navigate]);

  /**
   * Ouvrir le modal d'édition
   */
  const handleEdit = useCallback(() => {
    setIsEditModalOpen(true);
    setError("");
    setSuccessMessage("");
  }, []);

  /**
   * Fermer le modal d'édition
   */
  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false);
  }, []);

  /**
   * Gérer le succès de l'édition
   */
  const handleEditSuccess = useCallback(async () => {
    setSuccessMessage("Franchisé modifié avec succès");
    setError("");
    // Recharger les données du franchisé
    await fetchBoutiqueUserDetails();
  }, [fetchBoutiqueUserDetails]);

  /**
   * Ouvrir le modal des détails de la boutique
   */
  const handleOpenBoutiqueModal = useCallback(() => {
    setIsBoutiqueModalOpen(true);
  }, []);

  /**
   * Fermer le modal des détails de la boutique
   */
  const handleCloseBoutiqueModal = useCallback(() => {
    setIsBoutiqueModalOpen(false);
  }, []);

  /**
   * Nom complet du franchisé
   */
  const fullName = useMemo(() => {
    if (!boutiqueUser) return "";
    return `${boutiqueUser.prenoms || ""} ${boutiqueUser.nom || ""}`.trim();
  }, [boutiqueUser]);

  /**
   * Fonction helper pour afficher un champ de manière uniforme
   */
  const renderField = (label: string, value?: string | number | null) => (
    <div>
      <p className="mb-1.5 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-800 dark:text-white/90">{value && String(value).trim().length > 0 ? value : "—"}</p>
    </div>
  );

  // Note: Le chargement est géré dans le ComponentCard principal

  // Affichage en cas d'erreur (ne pas afficher si isLoading)
  if (!isLoading && (error || !boutiqueUser)) {
    return (
      <>
        <PageMeta title="Détails du franchisé" description="Détails du franchisé" />
        <PageBreadcrumb
          pageTitle="Détails du franchisé"
          items={[
            { label: "Gestion des rôles", href: "/basic-tables" },
            { label: "Liste des franchisés", href: boutiqueId ? `/boutique-users-table?boutique_id=${boutiqueId}` : "/boutique-users-table" },
          ]}
        />

        <div className="mt-6">
          <Alert variant="error" title="Erreur" message={error || "Franchisé introuvable"} />
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title={boutiqueUser ? `${fullName} | Franchisé` : "Franchisé"}
        description="Consultez et gérez les informations d'un franchisé"
      />
      <PageBreadcrumb
        pageTitle="Détails du franchisé"
        items={[
          { label: "Gestion des rôles", href: "/basic-tables" },
          { label: "Liste des franchisés", href: boutiqueId ? `/boutique-users-table?boutique_id=${boutiqueId}` : "/boutique-users-table" },
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
          title={boutiqueUser ? fullName || "Franchisé" : "Franchisé"}
          action={
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                size="sm"
                startIcon={<PencilIcon className="size-4" />}
                onClick={handleEdit}
                className="bg-[#04b05d] hover:bg-[#039a52] text-white"
                disabled={!boutiqueUser}
              >
                Modifier
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDelete}
                className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                disabled={!boutiqueUser}
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
          ) : boutiqueUser ? (
            <div className="space-y-6">
              {/* Email et Statut en haut */}
              <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                  <p className="text-base font-medium text-gray-800 dark:text-white/90">{boutiqueUser.email ?? "—"}</p>
                </div>
                <Badge color={getStatusColor(boutiqueUser.status)} size="sm">
                  {getStatusLabel(boutiqueUser.status)}
                </Badge>
              </div>

              {/* Informations principales en grid 2 colonnes */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {renderField("Prénoms", boutiqueUser.prenoms)}
                {renderField("Nom", boutiqueUser.nom)}
                {renderField("Rôle", getRoleLabel(boutiqueUser.role))}
                {renderField("Contact principal", boutiqueUser.contact_1 ? formatPhoneNumber(boutiqueUser.contact_1) : "—")}
                {renderField("Contact secondaire", boutiqueUser.contact_2 ? formatPhoneNumber(boutiqueUser.contact_2) : "—")}
                {renderField(
                  "Commune",
                  isLoadingCommune ? "Chargement..." : commune ? commune.libelle : "—"
                )}
                {renderField("Créé le", formatDate(boutiqueUser.created_at))}
                {renderField("Mis à jour le", formatDate(boutiqueUser.updated_at))}
              </div>

              {/* Section Boutique associée */}
              <div className="border-t pt-6 dark:border-gray-700">
                <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Boutique associée
                </h4>
                {isLoadingBoutique ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#04b05d] border-t-transparent" />
                    <p className="ml-2 text-sm text-gray-500 dark:text-gray-400">Chargement...</p>
                  </div>
                ) : boutique ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      {renderField("Nom de la boutique", boutique.name)}
                      {renderField("Adresse", boutique.adresse)}
                      {renderField("Contact principal", boutique.contact_1 ? formatPhoneNumber(boutique.contact_1) : "—")}
                      {renderField("Contact secondaire", boutique.contact_2 ? formatPhoneNumber(boutique.contact_2) : "—")}
                      {renderField("Email", boutique.email)}
                    </div>
                    <div className="pt-4">
                      <Button
                        size="sm"
                        onClick={handleOpenBoutiqueModal}
                        className="bg-[#04b05d] hover:bg-[#039a52] text-white"
                      >
                        Voir les détails de la boutique associée
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Les informations de la boutique ne sont pas disponibles</p>
                )}
              </div>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">Aucune information disponible.</p>
          )}
        </ComponentCard>
      </div>

      {/* Modal des détails de la boutique associée */}
      <Modal
        isOpen={isBoutiqueModalOpen}
        onClose={handleCloseBoutiqueModal}
        className="max-w-4xl"
      >
        {boutique ? (
          <div className="space-y-6 p-2">
            {/* En-tête avec nom et statut */}
            <div className="pb-6 border-b-2 border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#04b05d] to-[#039a52] flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {boutique.name || "—"}
                </h3>
              </div>
              <div className="ml-15">
                <Badge color={boutique.status === 1 ? "success" : "error"} size="sm">
                  {boutique.status === 1 ? "Actif" : "Inactif"}
                </Badge>
              </div>
            </div>

            {/* Informations organisées en cartes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Carte Contact */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-[#04b05d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Contact</h4>
                </div>
                
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Email
                  </label>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1 break-all">
                    {boutique.email || "—"}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Contact principal
                  </label>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {boutique.contact_1 ? formatPhoneNumber(boutique.contact_1) : "—"}
                  </p>
                </div>

                {boutique.contact_2 && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Contact secondaire
                    </label>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                      {formatPhoneNumber(boutique.contact_2)}
                    </p>
                  </div>
                )}
              </div>

              {/* Carte Localisation */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-[#04b05d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <h4 className="font-semibold text-gray-900 dark:text-white">Localisation</h4>
                </div>
                
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Adresse
                  </label>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {boutique.adresse || "—"}
                  </p>
                </div>

                {boutique.details && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Détails
                    </label>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                      {boutique.details}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t-2 border-gray-100 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={handleCloseBoutiqueModal}
                className="order-2 sm:order-1"
              >
                Fermer
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  handleCloseBoutiqueModal();
                  navigate(`/boutiques/${boutique.id}`);
                }}
                className="bg-[#04b05d] hover:bg-[#039a52] text-white shadow-md hover:shadow-lg transition-all duration-200 order-1 sm:order-2"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Voir la page complète
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              Les informations de la boutique ne sont pas disponibles.
            </p>
          </div>
        )}
      </Modal>

      {/* Modal d'édition du franchisé */}
      <EditBoutiqueUserModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSuccess={handleEditSuccess}
        boutiqueUser={boutiqueUser}
        boutiqueId={boutiqueId || ""}
      />

      {/* Modal de confirmation de suppression */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          if (!isDeleting) {
            handleCloseDeleteModal();
          }
        }}
        className="max-w-md"
      >
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Confirmer la suppression</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Êtes-vous sûr de vouloir supprimer le franchisé <strong>{fullName}</strong> ? Cette action est irréversible.
          </p>

          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCloseDeleteModal}
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
};

export default BoutiqueUserDetails;

