/**
 * MonStorePage - Page pour afficher le store personnel du gérant
 * 
 * Cette page permet au gérant de :
 * - Voir tous les produits qu'il a ajoutés à son store
 * - Voir les quantités de stock disponibles
 * - Gérer les produits de son store
 * 
 * Cette page utilise l'API /produits pour récupérer tous les produits
 * et filtre uniquement ceux qui ont été ajoutés au store (avec stock valide)
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadCrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import productService, { Product } from "../../services/api/productService";
import { formatPrice, getProductImage } from "../../utils/productUtils";

export default function MonStorePage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalProducts, setTotalProducts] = useState<number>(0);

  /**
   * Récupérer les produits du store depuis l'API
   * Utilise l'API /produits et filtre uniquement les produits avec stock valide
   */
  const fetchStoreProducts = async (page: number = 1) => {
    setLoading(true);
    setError("");

    try {
      // Récupérer tous les produits depuis l'API
      const response = await productService.getProducts(page);
      let allProducts = response.data;

      // Vérifier si les produits contiennent déjà les informations de stock
      // et marquer ceux qui sont dans le store
      allProducts = allProducts.map((product) => {
        const stockValue = product.stock || product.store_stock;
        const hasValidStock = stockValue !== undefined && 
                              stockValue !== null && 
                              stockValue !== "" && 
                              stockValue !== 0 &&
                              stockValue !== "0";
        
        if (hasValidStock) {
          return {
            ...product,
            in_store: true,
            store_stock: stockValue,
            stock: stockValue,
          };
        }
        
        return {
          ...product,
          in_store: false,
          store_stock: undefined,
          stock: undefined,
        };
      });

      // Si aucun produit n'a de stock dans la réponse, essayer de récupérer les produits du store
      // pour fusionner les données (fallback si l'API ne retourne pas les stocks directement)
      const hasAnyStock = allProducts.some(p => p.in_store);
      if (!hasAnyStock) {
        try {
          const storeProducts = await productService.getStoreProducts();
          
          if (storeProducts.length > 0) {
            // Créer un Map pour faciliter la recherche
            const storeProductsMap = new Map<string | number, { stock: string | number; [key: string]: any }>();
            storeProducts.forEach((storeProduct) => {
              const productId = storeProduct.produit_id || storeProduct.product_id || storeProduct.id;
              if (productId) {
                storeProductsMap.set(productId, storeProduct);
              }
            });

            // Fusionner les données de stock avec les produits
            allProducts = allProducts.map((product) => {
              const storeProduct = storeProductsMap.get(product.id);
              if (storeProduct) {
                const stockValue = storeProduct.stock;
                const hasValidStock = stockValue !== undefined && 
                                      stockValue !== null && 
                                      stockValue !== "" && 
                                      stockValue !== 0 &&
                                      stockValue !== "0";
                
                if (hasValidStock) {
                  return {
                    ...product,
                    in_store: true,
                    store_stock: stockValue,
                    stock: stockValue,
                  };
                }
              }
              return product;
            });
          }
        } catch (storeError) {
          // Si la récupération des produits du store échoue, continuer sans les données de stock
          // Cela permet à l'application de fonctionner même si l'endpoint n'existe pas encore
        }
      }

      // Filtrer uniquement les produits qui sont dans le store (avec stock valide)
      const storeProductsList = allProducts.filter((product) => {
        const stockValue = product.store_stock || product.stock;
        const hasValidStock = stockValue !== undefined && 
                              stockValue !== null && 
                              stockValue !== "" && 
                              stockValue !== 0 &&
                              stockValue !== "0";
        return product.in_store === true && hasValidStock;
      });

      setProducts(storeProductsList);
      
      // Ajuster les métadonnées de pagination pour refléter les produits filtrés
      // Note: La pagination peut ne pas être exacte car on filtre après récupération
      // Mais on affiche quand même les informations de pagination pour référence
      setTotalPages(response.meta.last_page);
      setTotalProducts(storeProductsList.length); // Nombre de produits dans le store
      setCurrentPage(response.meta.current_page);
    } catch (err: any) {
      const errorMessage = err.message || "Une erreur est survenue lors de la récupération des produits du store";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Charger les produits au montage du composant
   */
  useEffect(() => {
    fetchStoreProducts(currentPage);
  }, []);

  /**
   * Gérer le changement de page
   */
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      fetchStoreProducts(newPage);
    }
  };

  /**
   * Rediriger vers la page des produits disponibles
   */
  const handleAddProduct = () => {
    navigate("/produits");
  };

  /**
   * Vérifie si le produit est disponible
   */
  const isProductAvailable = (product: Product): boolean => {
    const status = product.status;

    if (status === undefined || status === null) {
      return true;
    }

    if (typeof status === "number") {
      return status === 1;
    }

    const normalized = `${status}`.toLowerCase();
    return (
      normalized === "1" ||
      normalized === "actif" ||
      normalized === "active" ||
      normalized === "disponible" ||
      normalized === "available"
    );
  };

  return (
    <>
      <PageMeta 
        title="Mon Store" 
        description="Gérez les produits disponibles dans votre boutique"
      />

      <PageBreadCrumb
        pageTitle="Mon Store"
        titleClassName="text-[#04b05d] dark:text-[#04b05d]"
        items={[
          { label: "Accueil", href: "/" }
        ]}
      />

      <ComponentCard>
        {/* Message d'erreur global */}
        {error && (
          <div className="mb-4 p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
            {error}
          </div>
        )}

        {/* Affichage du loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block w-8 h-8 border-4 border-[#04b05d] border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Chargement de votre store...
              </p>
            </div>
          </div>
        )}

        {/* Affichage des produits */}
        {!loading && !error && (
          <>
            {/* Compteur de produits */}
            <div className="mb-6">
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-yellow-100 border border-yellow-400 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-500 dark:text-yellow-200">
                {totalProducts > 0
                  ? `${totalProducts} produit${totalProducts > 1 ? 's' : ''} dans votre store`
                  : "Aucun produit dans votre store"}
              </span>
            </div>

            {/* Liste des produits */}
            {products.length === 0 ? (
          // Store vide
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="text-center max-w-md">
              {/* Icône */}
              <div className="mx-auto w-24 h-24 mb-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-gray-400 dark:text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>

              {/* Message */}
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Votre store est vide
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-8">
                    Vous n'avez aucun produit ajouté à votre store. Commencez par
                ajouter des produits pour les rendre disponibles dans votre
                boutique.
              </p>

              {/* Bouton d'action */}
              <button
                onClick={handleAddProduct}
                className="inline-flex items-center px-6 py-3 text-base font-medium text-white bg-[#04b05d] rounded-lg hover:bg-[#039850] transition-colors"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Ajouter un produit
              </button>
            </div>
          </div>
        ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => {
                  const stockValue = product.store_stock || product.stock;
                  const isAvailable = isProductAvailable(product);

                  return (
                    <div
                      key={product.id}
                      className="group overflow-hidden bg-white border border-neutral-300 rounded-2xl transition-shadow hover:shadow-md dark:bg-white/[0.03] dark:border-neutral-700"
                    >
                      {/* Image du produit */}
                      <div className="relative h-48 bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        <img
                          src={getProductImage(product)}
                          alt={product.libelle}
                          className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/images/product/product-placeholder.png";
                          }}
                        />
                        {/* Badge statut */}
                        <div className="absolute top-3 right-3">
                          {isAvailable ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 border border-green-400 text-green-700 dark:bg-green-900/30 dark:border-green-500 dark:text-green-300">
                              Disponible
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 border border-red-400 text-red-700 dark:bg-red-900/30 dark:border-red-500 dark:text-red-300">
                              Indisponible
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Informations du produit */}
                      <div className="p-5 space-y-4">
                        {/* Titre et catégorie */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white/90 line-clamp-2 mb-1">
                            {product.libelle}
                          </h3>
                          {(product.categorie_name || product.categorie) && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {typeof product.categorie === 'string'
                                ? product.categorie
                                : product.categorie_name}
                            </p>
                          )}
                        </div>

                        {/* Poids */}
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Poids:</span>
                          <span>{product.valeur_poids} {product.unite_poids}</span>
                        </div>

                        {/* Séparateur */}
                        <div className="border-t border-gray-200 dark:border-gray-700"></div>

                        {/* Prix et Stock */}
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Prix</span>
                            <p className="text-xl font-bold text-gray-900 dark:text-white/90 mt-0.5">
                              {formatPrice(product.prix_vente_normale)}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-gray-500 dark:text-gray-400">Stock</span>
                            <p className="text-xl font-bold text-[#04b05d] dark:text-[#04b05d] mt-0.5">
                              {stockValue || 0}
            </p>
          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination - Afficher seulement s'il y a des produits ET qu'il y a plus d'une page */}
            {products.length > 0 && totalPages > 1 && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                {/* Informations sur les résultats */}
                <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} sur {totalPages}
                </div>

                {/* Contrôles de pagination */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Bouton Précédent */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      currentPage === 1
                        ? "text-gray-400 bg-gray-100 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600"
                        : "text-white bg-[#04b05d] hover:bg-[#039850]"
                    }`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                    Précédent
                  </button>

                  {/* Numéros de page */}
                  <div className="flex items-center gap-1 sm:gap-2">
                    {(() => {
                      // Calculer les pages à afficher
                      const pagesToShow: (number | string)[] = [];
                      const maxPagesToShow = 7;
                      
                      if (totalPages <= maxPagesToShow) {
                        for (let i = 1; i <= totalPages; i++) {
                          pagesToShow.push(i);
                        }
                      } else {
                        pagesToShow.push(1);
                        
                        let start = Math.max(2, currentPage - 1);
                        let end = Math.min(totalPages - 1, currentPage + 1);
                        
                        if (currentPage <= 3) {
                          end = Math.min(5, totalPages - 1);
                        }
                        
                        if (currentPage >= totalPages - 2) {
                          start = Math.max(2, totalPages - 4);
                        }
                        
                        if (start > 2) {
                          pagesToShow.push('...');
                        }
                        
                        for (let i = start; i <= end; i++) {
                          pagesToShow.push(i);
                        }
                        
                        if (end < totalPages - 1) {
                          pagesToShow.push('...');
                        }
                        
                        pagesToShow.push(totalPages);
                      }
                      
                      return pagesToShow.map((page, index) => {
                        if (page === '...') {
                          return (
                            <span
                              key={`ellipsis-${index}`}
                              className="px-2 text-gray-500 dark:text-gray-400"
                            >
                              ...
                            </span>
                          );
                        }
                        
                        const pageNum = page as number;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                              pageNum === currentPage
                                ? "text-white bg-[#04b05d] hover:bg-[#039850]"
                                : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      });
                    })()}
                  </div>

                  {/* Bouton Suivant */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      currentPage === totalPages
                        ? "text-gray-400 bg-gray-100 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600"
                        : "text-white bg-[#04b05d] hover:bg-[#039850]"
                    }`}
                  >
                    Suivant
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
          </div>
            )}
          </>
        )}
      </ComponentCard>
    </>
  );
}

