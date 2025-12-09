/**
 * Page BoutiqueUsersTable - Liste des franchisés (utilisateurs de boutique)
 * 
 * Affiche la liste des utilisateurs de boutique (franchisés) avec leurs informations
 */

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import BoutiqueUsersTable from "../../components/tables/BasicTables/BoutiqueUsersTable";
import Pagination from "../../components/ui/pagination/Pagination";
import Alert from "../../components/ui/alert/Alert";
import Button from "../../components/ui/button/Button";
import Select from "../../components/form/Select";
import Label from "../../components/form/Label";
import { PlusIcon } from "../../icons";
import boutiqueUserService, { BoutiqueUser } from "../../services/api/boutiqueUserService";
import franchiseService, { Boutique } from "../../services/api/franchiseService";

export default function BoutiqueUsersTablePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [users, setUsers] = useState<BoutiqueUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [selectedBoutiqueId, setSelectedBoutiqueId] = useState<string>("");
  const [boutiques, setBoutiques] = useState<Boutique[]>([]);
  const [isLoadingBoutiques, setIsLoadingBoutiques] = useState<boolean>(true);
  const [boutiquesError, setBoutiquesError] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [paginationMeta, setPaginationMeta] = useState<{
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
  } | null>(null);

  /**
   * Charger la liste des boutiques
   */
  useEffect(() => {
    const loadBoutiques = async () => {
      try {
        setIsLoadingBoutiques(true);
        setBoutiquesError("");
        
        // Vérifier si un boutique_id est fourni dans les query params
        const boutiqueIdFromUrl = searchParams.get("boutique_id");
        
        const response = await franchiseService.getBoutiques(1);
        
        if (response.data.length === 0) {
          setBoutiquesError("Aucune boutique disponible. Veuillez d'abord créer une boutique.");
          setBoutiques([]);
        } else {
          setBoutiques(response.data);
          setBoutiquesError("");
          // Sélectionner automatiquement la boutique depuis l'URL ou la première boutique
          setSelectedBoutiqueId((prev) => {
            if (boutiqueIdFromUrl) {
              // Vérifier que la boutique existe dans la liste
              const boutiqueExists = response.data.some((b) => b.id === boutiqueIdFromUrl);
              if (boutiqueExists) {
                return boutiqueIdFromUrl;
              }
            }
            if (!prev && response.data.length > 0) {
              return response.data[0].id;
            }
            return prev;
          });
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Erreur lors du chargement des boutiques";
        setBoutiquesError(errorMessage);
        setBoutiques([]);
        
        if (import.meta.env.DEV) {
          console.error("Erreur lors du chargement des boutiques:", err);
        }
      } finally {
        setIsLoadingBoutiques(false);
      }
    };

    loadBoutiques();
  }, [searchParams]);

  /**
   * Charge la liste des utilisateurs de boutique (franchisés)
   * @param boutiqueId - ID de la boutique
   * @param page - Numéro de page à charger
   */
  const loadUsers = useCallback(async (boutiqueId: string, page: number = 1) => {
    if (!boutiqueId || !boutiqueId.trim()) {
      setUsers([]);
      setPaginationMeta(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      const response = await boutiqueUserService.getBoutiqueUsers(boutiqueId, page);
      setUsers(response.data);
      
      // Si la réponse contient des métadonnées de pagination, les utiliser
      if (response.meta) {
        setPaginationMeta(response.meta);
        setCurrentPage(response.meta.current_page);
      } else {
        // Si pas de pagination, créer des métadonnées par défaut
        setPaginationMeta({
          current_page: 1,
          from: 1,
          last_page: 1,
          per_page: response.data.length,
          to: response.data.length,
          total: response.data.length,
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur lors du chargement des franchisés";
      setError(message);
      setUsers([]);
      setPaginationMeta(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Charger les utilisateurs quand une boutique est sélectionnée
  useEffect(() => {
    if (selectedBoutiqueId) {
      loadUsers(selectedBoutiqueId, 1);
    } else {
      setUsers([]);
      setPaginationMeta(null);
      setIsLoading(false);
    }
  }, [selectedBoutiqueId, loadUsers]);

  /**
   * Gère le changement de page
   * @param page - Numéro de page sélectionné
   */
  const handlePageChange = useCallback((page: number) => {
    if (selectedBoutiqueId) {
      setCurrentPage(page);
      loadUsers(selectedBoutiqueId, page);
      // Scroll vers le haut de la table
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [loadUsers, selectedBoutiqueId]);

  /**
   * Gère le changement de boutique sélectionnée
   * @param boutiqueId - ID de la boutique sélectionnée
   */
  const handleBoutiqueChange = useCallback((boutiqueId: string) => {
    setSelectedBoutiqueId(boutiqueId);
    setCurrentPage(1);
    setError("");
    // Mettre à jour l'URL avec le nouveau boutique_id
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("boutique_id", boutiqueId);
    window.history.replaceState({}, "", `/boutique-users-table?${newSearchParams.toString()}`);
  }, [searchParams]);

  /**
   * Gère le clic sur le bouton "Placer un franchisé"
   * Redirige vers le formulaire de création avec l'ID de la boutique sélectionnée
   */
  const handleAddFranchise = useCallback(() => {
    if (selectedBoutiqueId) {
      navigate(`/add-boutique-user?boutique_id=${selectedBoutiqueId}`);
    }
  }, [navigate, selectedBoutiqueId]);

  // Options pour les boutiques
  const boutiqueOptions = useMemo(() => {
    return boutiques.map((boutique) => ({
      value: boutique.id,
      label: boutique.name,
    }));
  }, [boutiques]);

  if (isLoadingBoutiques) {
    return (
      <>
        <PageMeta
          title="Liste des franchisés | Proxy Market"
          description="Consultez la liste des franchisés Proxy Market"
        />
        <PageBreadcrumb
          pageTitle="Liste des franchisés"
          items={[
            { label: "Gestion des rôles", href: "/boutique-users-table" },
          ]}
          titleClassName="text-[#04b05d] dark:text-[#04b05d]"
        />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#04b05d] border-t-transparent" />
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Chargement des boutiques...</p>
          </div>
        </div>
      </>
    );
  }

  if (isLoading && selectedBoutiqueId) {
    return (
      <>
        <PageMeta
          title="Liste des franchisés | Proxy Market"
          description="Consultez la liste des franchisés Proxy Market"
        />
        <PageBreadcrumb
          pageTitle="Liste des franchisés"
          items={[
            { label: "Gestion des rôles", href: "/boutique-users-table" },
          ]}
          titleClassName="text-[#04b05d] dark:text-[#04b05d]"
        />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#04b05d] border-t-transparent" />
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Chargement des franchisés...</p>
          </div>
        </div>
      </>
    );
  }

  if (error && !isLoading && !isLoadingBoutiques) {
    return (
      <>
        <PageMeta
          title="Liste des franchisés | Proxy Market"
          description="Consultez la liste des franchisés Proxy Market"
        />
        <PageBreadcrumb
          pageTitle="Liste des franchisés"
          items={[
            { label: "Gestion des rôles", href: "/boutique-users-table" },
          ]}
          titleClassName="text-[#04b05d] dark:text-[#04b05d]"
        />
        <Alert variant="error" title="Erreur" message={error} />
      </>
    );
  }

  return (
    <>
      <PageMeta
        title="Liste des franchisés | Proxy Market"
        description="Consultez la liste des franchisés Proxy Market"
      />
      <PageBreadcrumb
        pageTitle="Liste des franchisés"
        items={[
          { label: "Gestion des rôles", href: "/boutique-users-table" },
        ]}
        titleClassName="text-[#04b05d] dark:text-[#04b05d]"
      />

      <div className="space-y-6">
        {error && <Alert variant="error" title="Erreur" message={error} />}

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div className="flex-1 max-w-xs">
            <Label>
              Sélectionner une boutique <span className="text-error-500">*</span>
            </Label>
            {boutiquesError ? (
              <div className="space-y-2 mt-1">
                <Select
                  options={boutiqueOptions}
                  placeholder="Aucune boutique disponible"
                  value={selectedBoutiqueId}
                  onChange={handleBoutiqueChange}
                  className="dark:bg-dark-900"
                  disabled={true}
                />
                <p className="text-xs text-error-500 dark:text-error-400">
                  {boutiquesError}
                </p>
              </div>
            ) : (
              <Select
                options={boutiqueOptions}
                placeholder={
                  boutiqueOptions.length > 0
                    ? "Sélectionnez une boutique"
                    : "Aucune boutique disponible"
                }
                value={selectedBoutiqueId}
                onChange={handleBoutiqueChange}
                className="dark:bg-dark-900 mt-1"
                disabled={boutiqueOptions.length === 0 || isLoadingBoutiques}
              />
            )}
          </div>
          <Button
            variant="none"
            size="sm"
            className="bg-[#04b05d] hover:bg-[#039a52] text-white shadow-theme-xs disabled:bg-[#04b05d]/70 focus:ring-3 focus:ring-[#04b05d]/20 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleAddFranchise}
            disabled={!selectedBoutiqueId || isLoadingBoutiques}
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Placer un franchisé
          </Button>
        </div>

        {boutiquesError && !isLoadingBoutiques ? (
          <div className="flex flex-col items-center justify-center py-8">
            <img
              src="/images/oups/File searching-bro.png"
              alt="Aucune boutique disponible"
              className="w-80 h-80 object-contain"
            />
            <p className="mt-4 text-center text-gray-500 dark:text-gray-400">
              Vous devez créer une boutique pour pouvoir placer un franchisé <br /> et enfin voir la liste des franchisés.
            </p>
          </div>
        ) : !selectedBoutiqueId && !isLoadingBoutiques && boutiqueOptions.length > 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-center text-gray-500 dark:text-gray-400">
              Veuillez sélectionner une boutique pour afficher ses franchisés.
            </p>
          </div>
        ) : selectedBoutiqueId && !isLoading ? (
          <>
            {users.length === 0 && !error ? (
              <div className="flex flex-col items-center justify-start mt-1 pb-8">
                <img
                  src="/images/oups/File searching-bro.png"
                  alt="Aucun franchisé trouvé"
                  className="w-80 h-80 mt-1 object-contain"
                />
                <p className="text-center text-gray-500 dark:text-gray-400">
                  Aucun franchisé trouvé pour cette boutique.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
                <BoutiqueUsersTable users={users} boutiqueId={selectedBoutiqueId} />

                {/* Pagination */}
                {paginationMeta && paginationMeta.last_page > 1 && paginationMeta.total > 0 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={paginationMeta.last_page}
                    onPageChange={handlePageChange}
                    totalItems={paginationMeta.total}
                    itemsPerPage={paginationMeta.per_page}
                    showingFrom={paginationMeta.from}
                    showingTo={paginationMeta.to}
                  />
                )}
              </div>
            )}
          </>
        ) : selectedBoutiqueId && isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#04b05d] border-t-transparent" />
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Chargement des franchisés...
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}

