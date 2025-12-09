/**
 * Page BasicTables - Liste des boutiques
 *
 * Affiche la liste des boutiques avec leurs informations et statistiques
 */

import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import FranchisesTable from "../../components/tables/BasicTables/FranchisesTable";
import Pagination from "../../components/ui/pagination/Pagination";
import Button from "../../components/ui/button/Button";
import Alert from "../../components/ui/alert/Alert";
import { PlusIcon } from "../../icons";
import franchiseService, { Boutique } from "../../services/api/franchiseService";

export default function BasicTables() {
  const location = useLocation();
  const navigate = useNavigate();
  const [boutiques, setBoutiques] = useState<Boutique[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [paginationMeta, setPaginationMeta] = useState<{
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
  } | null>(null);

  const loadBoutiques = async (page: number = 1) => {
    try {
      setIsLoading(true);
      setError("");
      const response = await franchiseService.getBoutiques(page);
      setBoutiques(response.data);
      setPaginationMeta(response.meta);
      setCurrentPage(response.meta.current_page);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur lors du chargement des boutiques";
      setError(message);
      setBoutiques([]);
      setPaginationMeta(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBoutiques(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Auto-dismiss success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadBoutiques(page);
    // Scroll vers le haut de la table
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /**
   * Gère le clic sur le bouton "Placer un franchisé"
   * @param boutique - La boutique pour laquelle créer un franchisé
   * @param e - L'événement de clic
   */
  const handleAddFranchise = (boutique: Boutique, e: React.MouseEvent) => {
    e.stopPropagation(); // Empêcher la navigation vers les détails
    // Rediriger vers le formulaire de création de franchisé avec l'ID de la boutique
    navigate(`/add-boutique-user?boutique_id=${boutique.id}`);
  };

  if (isLoading) {
    return (
      <>
        <PageMeta
          title="Liste des boutiques | Proxy Market"
          description="Consultez la liste des boutiques Proxy Market"
        />
        <PageBreadcrumb
          pageTitle="Liste des boutiques"
          items={[
            { label: "Gestion des rôles", href: "/basic-tables" },
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

  if (error) {
    return (
      <>
        <PageMeta
          title="Liste des boutiques | Proxy Market"
          description="Consultez la liste des boutiques Proxy Market"
        />
        <PageBreadcrumb
          pageTitle="Liste des boutiques"
          items={[
            { label: "Gestion des rôles", href: "/basic-tables" },
          ]}
          titleClassName="text-[#04b05d] dark:text-[#04b05d]"
        />
        <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
          {error}
        </div>
      </>
    );
  }

  if (!isLoading && boutiques.length === 0 && !error) {
    return (
      <>
        <PageMeta
          title="Liste des boutiques | Proxy Market"
          description="Consultez la liste des boutiques Proxy Market"
        />
        <PageBreadcrumb
          pageTitle="Liste des boutiques"
          items={[
            { label: "Gestion des rôles", href: "/basic-tables" },
          ]}
          titleClassName="text-[#04b05d] dark:text-[#04b05d]"
        />
        <div className="flex justify-end mb-6">
          <Button
            variant="none"
            size="sm"
            className="bg-[#04b05d] hover:bg-[#039a52] text-white shadow-theme-xs disabled:bg-[#04b05d]/70 focus:ring-3 focus:ring-[#04b05d]/20 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => navigate("/add-franchise")}
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Ajouter une boutique
          </Button>
        </div>
        <div className="flex flex-col items-center justify-start mt-1 pb-8">
          <img
            src="/images/oups/File searching-bro.png"
            alt="Aucune boutique trouvée"
            className="w-80 h-80 mt-1 object-contain"
          />
          <p className="text-center text-gray-500 dark:text-gray-400">
            Aucune boutique trouvée.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title="Liste des boutiques | Proxy Market"
        description="Consultez la liste des boutiques Proxy Market"
      />
      <PageBreadcrumb
        pageTitle="Liste des boutiques"
        items={[
          { label: "Gestion des rôles", href: "/basic-tables" },
        ]}
        titleClassName="text-[#04b05d] dark:text-[#04b05d]"
      />

      <div className="space-y-6">
        {error && <Alert variant="error" title="Erreur" message={error} />}
        {successMessage && <Alert variant="success" title="Succès" message={successMessage} />}

        <div className="flex justify-end mb-6">
          <Button
            variant="none"
            size="sm"
            className="bg-[#04b05d] hover:bg-[#039a52] text-white shadow-theme-xs disabled:bg-[#04b05d]/70 focus:ring-3 focus:ring-[#04b05d]/20 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => navigate("/add-franchise")}
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Ajouter une boutique
          </Button>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <FranchisesTable boutiques={boutiques} onAddFranchise={handleAddFranchise} />

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
      </div>
    </>
  );
}
