/**
 * Page Statistics - Vue des statistiques complètes
 * 
 * Cette page affiche toutes les statistiques retournées par l'API /get-reports :
 * - Statistiques de commandes par période (Aujourd'hui, Hier, Cette semaine, etc.)
 * - Ressources de la plateforme (Produits, Livreurs)
 * - Évolutions et comparaisons avec badges de pourcentage
 */

import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadCrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import reportService, { ReportsResponse } from "../../services/api/reportService";
import deliveryService, { DeliveryPerson } from "../../services/api/deliveryService";
import productService, { Product } from "../../services/api/productService";
import { ArrowUpIcon, ArrowDownIcon, ChevronDownIcon, ChevronUpIcon } from "../../icons";

interface PeriodStat {
  label: string;
  color: string;
  orders: number;
  amount: number;
  evolution?: number;
  isReference?: boolean;
}

export default function Statistics() {
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<ReportsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // États pour les accordéons
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [deliveryPersons, setDeliveryPersons] = useState<DeliveryPerson[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsInStock, setProductsInStock] = useState<Product[]>([]);
  const [loadingAccordion, setLoadingAccordion] = useState<string | null>(null);

  useEffect(() => {
    const loadStatistics = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await reportService.getReports();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors du chargement des statistiques");
      } finally {
        setLoading(false);
      }
    };

    loadStatistics();
  }, []);

  // Calculer les statistiques par période avec évolution
  const periodStats: PeriodStat[] = stats ? [
    {
      label: "Aujourd'hui",
      color: "bg-green-500",
      orders: stats.commande_to_day,
      amount: stats.commande_to_day_soustotal,
      evolution: stats.commandehier > 0 
        ? ((stats.commande_to_day - stats.commandehier) / stats.commandehier) * 100 
        : undefined,
      isReference: stats.commandehier === 0,
    },
    {
      label: "Hier",
      color: "bg-blue-500",
      orders: stats.commandehier,
      amount: stats.commandehier_soustotal,
      isReference: true,
    },
    {
      label: "Cette semaine",
      color: "bg-purple-500",
      orders: stats.commandesemaine,
      amount: stats.commandesemaine_soustotal,
      evolution: stats.commandeSemainePasse > 0
        ? ((stats.commandesemaine - stats.commandeSemainePasse) / stats.commandeSemainePasse) * 100
        : undefined,
      isReference: stats.commandeSemainePasse === 0,
    },
    {
      label: "Semaine passée",
      color: "bg-orange-500",
      orders: stats.commandeSemainePasse,
      amount: stats.commandeSemainePasse_soustotal,
      isReference: true,
    },
    {
      label: "Ce mois",
      color: "bg-green-500",
      orders: stats.commandemois,
      amount: stats.commandemois_soustotal,
      evolution: stats.commandeMoisPasse > 0
        ? ((stats.commandemois - stats.commandeMoisPasse) / stats.commandeMoisPasse) * 100
        : undefined,
      isReference: stats.commandeMoisPasse === 0,
    },
    {
      label: "Mois passé",
      color: "bg-green-500",
      orders: stats.commandeMoisPasse,
      amount: stats.commandeMoisPasse_soustotal,
      isReference: true,
    },
    {
      label: "Cette année",
      color: "bg-pink-500",
      orders: stats.commandeannee,
      amount: stats.commandeannee_soustotal,
      evolution: stats.commandeAnneePasse > 0
        ? ((stats.commandeannee - stats.commandeAnneePasse) / stats.commandeAnneePasse) * 100
        : undefined,
      isReference: stats.commandeAnneePasse === 0,
    },
    {
      label: "Année passée",
      color: "bg-gray-500",
      orders: stats.commandeAnneePasse,
      amount: stats.commandeAnneePasse_soustotal,
      isReference: true,
    },
  ] : [];

  // Formater la devise
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .format(amount)
      .replace("XOF", "FCFA");
  };

  // Formater le nombre
  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat("fr-FR").format(num);
  };

  // Gérer l'ouverture/fermeture des accordéons
  const toggleAccordion = async (accordionId: string) => {
    if (openAccordion === accordionId) {
      setOpenAccordion(null);
      return;
    }

    setOpenAccordion(accordionId);
    setLoadingAccordion(accordionId);

    try {
      switch (accordionId) {
        case "livreurs":
          const deliveryResponse = await deliveryService.getDeliveryPersons(1);
          setDeliveryPersons(deliveryResponse.data || []);
          break;
        case "produits":
          const productsResponse = await productService.getProducts(1);
          setProducts(productsResponse.data || []);
          break;
        case "stock":
          const stockResponse = await productService.getProducts(1);
          // Filtrer uniquement les produits avec stock valide
          const stockProducts = (stockResponse.data || []).filter((product) => {
            const stockValue = product.stock || product.store_stock;
            return stockValue !== undefined && 
                   stockValue !== null && 
                   stockValue !== "" && 
                   stockValue !== 0 &&
                   stockValue !== "0";
          });
          setProductsInStock(stockProducts);
          break;
      }
    } catch (err) {
      console.error(`Erreur lors du chargement des ${accordionId}:`, err);
    } finally {
      setLoadingAccordion(null);
    }
  };

  return (
    <>
      <PageMeta
        title="Statistiques - Proxy Market"
        description="Vue d'ensemble complète des statistiques de la boutique"
      />

      <div className="space-y-6">
        {/* Breadcrumb */}
        <PageBreadCrumb
          items={[
            { label: "Home", path: "/" },
            { label: "Dashboard", path: "/" },
            { label: "Statistique", path: "/statistics" },
          ]}
        />

        {/* Titre de la page */}
        <div>
          <h1 className="text-2xl font-bold text-[#04b05d] dark:text-[#04b05d]">
            Statistique
          </h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500 dark:text-gray-400">Chargement des statistiques...</div>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        ) : stats ? (
          <>
            {/* Section: Vue d'ensemble des commandes */}
            <ComponentCard>
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                    Vue d'ensemble des commandes
                  </h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Comparaison des performances par période
                  </p>
                </div>

                {/* Tableau des statistiques */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                          PÉRIODE
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                          NOMBRE DE COMMANDES
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                          MONTANT TOTAL (FCFA)
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                          ÉVOLUTION
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {periodStats.map((period, index) => (
                        <tr
                          key={index}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className={`h-2 w-2 rounded-full ${period.color}`}></span>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {period.label}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-center">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {formatNumber(period.orders)}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-center">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {formatCurrency(period.amount)}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right">
                            {period.isReference ? (
                              <span className="text-sm text-gray-400 dark:text-gray-500">
                                Référence
                              </span>
                            ) : period.evolution !== undefined ? (
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                                  period.evolution >= 0
                                    ? "bg-[#04b05d]/10 text-[#04b05d] dark:bg-[#04b05d]/15 dark:text-[#04b05d]"
                                    : "bg-red-500/10 text-red-500 dark:bg-red-500/15 dark:text-red-500"
                                }`}
                              >
                                {period.evolution >= 0 ? (
                                  <ArrowUpIcon className="h-3 w-3" />
                                ) : (
                                  <ArrowDownIcon className="h-3 w-3" />
                                )}
                                {period.evolution >= 0 ? "+" : ""}
                                {period.evolution.toFixed(1)}%
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </ComponentCard>

            {/* Section: Ressources de la plateforme */}
            <ComponentCard>
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                    Ressources de la plateforme
                  </h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Cliquez sur une ressource pour voir la liste détaillée
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Accordéon Produits */}
                  <div className="rounded-lg border border-green-200 bg-white dark:border-green-800 dark:bg-gray-800">
                    <button
                      onClick={() => toggleAccordion("produits")}
                      className={`flex w-full items-center gap-4 p-4 text-left transition-colors ${
                        openAccordion === "produits"
                          ? "bg-green-100 dark:bg-green-900/30"
                          : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      }`}
                    >
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                          Produits
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatNumber(stats.all_produit)} éléments
                        </p>
                      </div>
                      {openAccordion === "produits" ? (
                        <ChevronUpIcon className="h-5 w-5 text-green-500 dark:text-green-400" />
                      ) : (
                        <ChevronDownIcon className="h-5 w-5 text-green-500 dark:text-green-400" />
                      )}
                    </button>
                    {openAccordion === "produits" && (
                      <div className="border-t border-gray-200 p-4 dark:border-gray-700">
                        {loadingAccordion === "produits" ? (
                          <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                            Chargement...
                          </div>
                        ) : products.length > 0 ? (
                          <div className="space-y-2">
                            {products.map((product) => (
                              <div
                                key={product.id}
                                className="rounded border border-gray-200 p-3 dark:border-gray-700"
                              >
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {product.libelle}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {product.categorie?.libelle || "Sans catégorie"}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                            Aucun produit trouvé
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Accordéon Produits en stock */}
                  <div className="rounded-lg border border-green-200 bg-white dark:border-green-800 dark:bg-gray-800">
                    <button
                      onClick={() => toggleAccordion("stock")}
                      className={`flex w-full items-center gap-4 p-4 text-left transition-colors ${
                        openAccordion === "stock"
                          ? "bg-green-100 dark:bg-green-900/30"
                          : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      }`}
                    >
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                          Produits en stock
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatNumber(stats.produit_with_stock)} éléments
                        </p>
                      </div>
                      {openAccordion === "stock" ? (
                        <ChevronUpIcon className="h-5 w-5 text-green-500 dark:text-green-400" />
                      ) : (
                        <ChevronDownIcon className="h-5 w-5 text-green-500 dark:text-green-400" />
                      )}
                    </button>
                    {openAccordion === "stock" && (
                      <div className="border-t border-gray-200 p-4 dark:border-gray-700">
                        {loadingAccordion === "stock" ? (
                          <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                            Chargement...
                          </div>
                        ) : productsInStock.length > 0 ? (
                          <div className="space-y-2">
                            {productsInStock.map((product) => {
                              const stockValue = product.stock || product.store_stock;
                              return (
                                <div
                                  key={product.id}
                                  className="rounded border border-gray-200 p-3 dark:border-gray-700"
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="font-medium text-gray-900 dark:text-white">
                                        {product.libelle}
                                      </div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {product.categorie?.libelle || "Sans catégorie"}
                                      </div>
                                    </div>
                                    <div className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
                                      Stock: {stockValue}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                            Aucun produit en stock
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Accordéon Livreurs */}
                  <div className="rounded-lg border border-green-200 bg-white dark:border-green-800 dark:bg-gray-800">
                    <button
                      onClick={() => toggleAccordion("livreurs")}
                      className={`flex w-full items-center gap-4 p-4 text-left transition-colors ${
                        openAccordion === "livreurs"
                          ? "bg-green-100 dark:bg-green-900/30"
                          : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      }`}
                    >
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                          Livreurs
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatNumber(stats.all_livreur)} éléments
                        </p>
                      </div>
                      {openAccordion === "livreurs" ? (
                        <ChevronUpIcon className="h-5 w-5 text-green-500 dark:text-green-400" />
                      ) : (
                        <ChevronDownIcon className="h-5 w-5 text-green-500 dark:text-green-400" />
                      )}
                    </button>
                    {openAccordion === "livreurs" && (
                      <div className="border-t border-gray-200 p-4 dark:border-gray-700">
                        {loadingAccordion === "livreurs" ? (
                          <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                            Chargement...
                          </div>
                        ) : deliveryPersons.length > 0 ? (
                          <div className="space-y-2">
                            {deliveryPersons.map((person) => (
                              <div
                                key={person.id}
                                className="rounded border border-gray-200 p-3 dark:border-gray-700"
                              >
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {person.prenoms} {person.nom}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {person.email} {person.contact1 ? `• ${person.contact1}` : ""}
                                </div>
                                <div className="mt-1">
                                  <span
                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                      person.status === 1 || person.status === "1"
                                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                                    }`}
                                  >
                                    {person.status === 1 || person.status === "1" ? "Actif" : "Inactif"}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                            Aucun livreur trouvé
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </ComponentCard>
          </>
        ) : null}
      </div>
    </>
  );
}
