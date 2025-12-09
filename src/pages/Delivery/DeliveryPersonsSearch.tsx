/**
 * Page DeliveryPersonsSearch - Résultats de recherche de livreurs
 * 
 * Cette page affiche les résultats de recherche de livreurs avec pagination
 * et permet de naviguer vers les détails d'un livreur.
 */

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import PageBreadCrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Pagination from "../../components/ui/pagination/Pagination";
import deliveryService, {
  DeliveryPerson,
} from "../../services/api/deliveryService";

export default function DeliveryPersonsSearch() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") || "";
  
  const [deliveryPersons, setDeliveryPersons] = useState<DeliveryPerson[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [showingFrom, setShowingFrom] = useState<number | null>(null);
  const [showingTo, setShowingTo] = useState<number | null>(null);

  /**
   * Récupérer les livreurs depuis l'API avec recherche
   */
  useEffect(() => {
    const fetchDeliveryPersons = async () => {
      if (!searchQuery.trim()) {
        setError("Veuillez entrer un terme de recherche");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await deliveryService.getDeliveryPersons(currentPage, searchQuery);

        // Vérifier que les données sont bien récupérées avec contact1 et created_at
        const personsWithData = response.data.map((person) => ({
          ...person,
          contact1: person.contact1 || null,
          created_at: person.created_at || person.createdAt || null,
        }));

        setDeliveryPersons(personsWithData);
        setTotalPages(response.meta.last_page);
        setTotalItems(response.meta.total);
        setShowingFrom(response.meta.from);
        setShowingTo(response.meta.to);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Une erreur est survenue lors du chargement des livreurs";
        setError(errorMessage);
        setDeliveryPersons([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDeliveryPersons();
  }, [currentPage, searchQuery]);

  /**
   * Gère le changement de page
   */
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /**
   * Obtenir le texte du statut avec couleur
   */
  const getStatusInfo = (status: number | string) => {
    const statusValue =
      typeof status === "string" ? parseInt(status, 10) : status;
    const isActive = statusValue === 1;

    return {
      text: isActive ? "Actif" : "Inactif",
      color: isActive
        ? "bg-green-100 border border-green-400 text-green-700 dark:bg-green-900/30 dark:border-green-600 dark:text-green-300"
        : "bg-red-100 border border-red-400 text-red-700 dark:bg-red-900/30 dark:border-red-600 dark:text-red-300",
    };
  };

  /**
   * Formater la date
   */
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    
    const monthNames = [
      "janvier", "février", "mars", "avril", "mai", "juin",
      "juillet", "août", "septembre", "octobre", "novembre", "décembre"
    ];
    const isAlreadyFormatted = monthNames.some(month => 
      dateString.toLowerCase().includes(month)
    );
    
    if (isAlreadyFormatted) {
      return dateString;
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }
      return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <>
      <PageMeta
        title={`Recherche: ${searchQuery} | Proxy Market`}
        description={`Résultats de recherche pour "${searchQuery}"`}
      />

      <PageBreadCrumb
        pageTitle={`Résultats de recherche: "${searchQuery}"`}
        titleClassName="text-[#04b05d] dark:text-[#04b05d]"
        items={[
          { label: "Accueil", href: "/" },
          { label: "Liste des livreurs", href: "/livreurs" }
        ]}
      />

      <div className="grid grid-cols-1 gap-6">
        <ComponentCard>
          {/* Message d'erreur */}
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              <div className="font-medium">Erreur</div>
              <div className="mt-1">{error}</div>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#04b05d] border-t-transparent"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">
                Recherche en cours...
              </span>
            </div>
          )}

          {/* Liste vide */}
          {!loading && !error && deliveryPersons.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                Aucun livreur trouvé pour "{searchQuery}".
              </p>
            </div>
          )}

          {/* Table des livreurs */}
          {!loading && !error && deliveryPersons.length > 0 && (
            <>
              <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                {totalItems} résultat{totalItems > 1 ? "s" : ""} trouvé{totalItems > 1 ? "s" : ""} pour "{searchQuery}"
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                      >
                        Nom complet
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                      >
                        Email
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                      >
                        Contact
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                      >
                        Statut
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                      >
                        Date de création
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                    {deliveryPersons.map((person) => {
                      const statusInfo = getStatusInfo(person.status);
                      return (
                        <tr
                          key={person.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                          onClick={() => navigate(`/livreur/${person.id}`)}
                        >
                          <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                            {person.prenoms} {person.nom}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {person.email}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {person.contact1 || "N/A"}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}
                            >
                              {statusInfo.text}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-200 border border-yellow-400 text-yellow-700 dark:bg-gray-700 dark:border-yellow-500 dark:text-gray-300">
                              {formatDate(person.created_at)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 border-t border-gray-200 dark:border-gray-700">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    totalItems={totalItems}
                    showingFrom={showingFrom || undefined}
                    showingTo={showingTo || undefined}
                  />
                </div>
              )}
            </>
          )}
        </ComponentCard>
      </div>
    </>
  );
}
