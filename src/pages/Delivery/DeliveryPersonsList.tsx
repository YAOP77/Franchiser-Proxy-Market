/**
 * Page DeliveryPersonsList - Liste des livreurs
 * 
 * Cette page affiche la liste de tous les livreurs créés par le franchisé
 * avec pagination et possibilité de voir les détails de chaque livreur.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Pagination from "../../components/ui/pagination/Pagination";
import Button from "../../components/ui/button/Button";
import { PlusIcon } from "../../icons";
import deliveryService, {
  DeliveryPerson,
} from "../../services/api/deliveryService";

export default function DeliveryPersonsList() {
  const navigate = useNavigate();
  const [deliveryPersons, setDeliveryPersons] = useState<DeliveryPerson[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [showingFrom, setShowingFrom] = useState<number | null>(null);
  const [showingTo, setShowingTo] = useState<number | null>(null);

  /**
   * Récupérer les livreurs depuis l'API
   */
  useEffect(() => {
    const fetchDeliveryPersons = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await deliveryService.getDeliveryPersons(currentPage);

        // Vérifier que la réponse contient bien des données
        if (!response || !response.data) {
          setDeliveryPersons([]);
          setTotalPages(1);
          setTotalItems(0);
          setShowingFrom(null);
          setShowingTo(null);
          return;
        }

        // Vérifier que response.data est un tableau
        if (!Array.isArray(response.data)) {
          setError("Format de données invalide reçu de l'API");
          setDeliveryPersons([]);
          setTotalPages(1);
          setTotalItems(0);
          setShowingFrom(null);
          setShowingTo(null);
          return;
        }

        // Vérifier que les données sont bien récupérées avec contact1 et created_at
        const personsWithData = response.data.map((person) => ({
          ...person,
          // S'assurer que contact1 est bien présent (peut être null ou undefined)
          contact1: person.contact1 || null,
          // S'assurer que created_at est bien présent
          created_at: person.created_at || person.createdAt || null,
        }));

        setDeliveryPersons(personsWithData);
        setTotalPages(response.meta?.last_page || 1);
        setTotalItems(response.meta?.total || 0);
        setShowingFrom(response.meta?.from || null);
        setShowingTo(response.meta?.to || null);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Une erreur est survenue lors du chargement des livreurs";
        setError(errorMessage);
        setDeliveryPersons([]);
        setTotalPages(1);
        setTotalItems(0);
        setShowingFrom(null);
        setShowingTo(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDeliveryPersons();
  }, [currentPage]);

  /**
   * Gère le changement de page
   */
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll vers le haut de la page
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
   * Si l'API retourne déjà une date formatée (ex: "2 décembre 2025"), l'afficher telle quelle
   * Sinon, parser et formater la date
   */
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    
    // Vérifier si la date est déjà formatée (contient des lettres comme "décembre", "janvier", etc.)
    const monthNames = [
      "janvier", "février", "mars", "avril", "mai", "juin",
      "juillet", "août", "septembre", "octobre", "novembre", "décembre"
    ];
    const isAlreadyFormatted = monthNames.some(month => 
      dateString.toLowerCase().includes(month)
    );
    
    // Si la date est déjà formatée, la retourner telle quelle
    if (isAlreadyFormatted) {
      return dateString;
    }
    
    // Sinon, essayer de parser la date
    try {
      const date = new Date(dateString);
      // Vérifier si la date est valide
      if (isNaN(date.getTime())) {
        return dateString; // Retourner la chaîne originale si le parsing échoue
      }
      return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      // En cas d'erreur, retourner la chaîne originale
      return dateString;
    }
  };

  return (
    <>
      <PageMeta
        title="Liste des livreurs | Proxy Market"
        description="Gérez tous vos livreurs créés"
      />

      <PageBreadcrumb
        pageTitle="Liste des livreurs"
        titleClassName="text-[#04b05d] dark:text-[#04b05d]"
        items={[
          { label: "Gestion de ma boutique", href: "/mon-store" },
        ]}
      />

      {/* Bouton pour créer un nouveau livreur */}
      <div className="mb-6 flex justify-end">
        <Button
          variant="primary"
          onClick={() => navigate("/creer-livreur")}
        >
          <PlusIcon className="mr-2 h-6 w-6" />
          Créer un livreur
        </Button>
      </div>

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
                Chargement des livreurs...
              </span>
            </div>
          )}

          {/* Liste vide */}
          {!loading && !error && deliveryPersons.length === 0 && totalItems === 0 && (
            <div className="py-12 text-center">
              <div className="mb-4">
                <svg 
                  className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600"
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={1.5} 
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" 
                  />
                </svg>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Aucun livreur n'a été créé pour le moment.
              </p>
              <Button
                variant="primary"
                className="mt-4"
                onClick={() => navigate("/creer-livreur")}
              >
                <PlusIcon className="mr-2 h-4 w-4" />
                Créer votre premier livreur
              </Button>
            </div>
          )}

          {/* Message si la page est vide mais qu'il y a des livreurs ailleurs */}
          {!loading && !error && deliveryPersons.length === 0 && totalItems > 0 && (
            <div className="py-12 text-center">
              <div className="mb-4">
                <svg 
                  className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600"
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={1.5} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                  />
                </svg>
              </div>
              <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">
                Aucun livreur sur cette page
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                L'API indique qu'il y a {totalItems} livreur(s) au total, mais aucun n'est retourné pour la page {currentPage}.
              </p>
              {currentPage > 1 && (
                <Button
                  variant="primary"
                  onClick={() => handlePageChange(1)}
                >
                  Retourner à la première page
                </Button>
              )}
            </div>
          )}

          {/* Table des livreurs */}
          {!loading && !error && deliveryPersons.length > 0 && (
            <>
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
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 border border-yellow-600 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-500 dark:text-yellow-200">
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
