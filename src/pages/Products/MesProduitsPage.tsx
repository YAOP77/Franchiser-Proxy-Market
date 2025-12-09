/**
 * Page Mes Produits - Affichage de tous les produits vivriers de la boutique
 * 
 * Cette page permet au gérant de:
 * - Voir tous les produits vivriers de sa boutique
 * - Naviguer entre les pages (pagination)
 * - Voir les détails de chaque produit
 * 
 * IMPORTANT:
 * - Utilise POST /produits au lieu de GET
 * - Gestion de la pagination
 * - Gestion des erreurs d'authentification
 */

import { useState, useEffect } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadCrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import productService, { Product } from "../../services/api/productService";
import AddToStoreModal from "../../components/modals/AddToStoreModal";

export default function MesProduitsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalProducts, setTotalProducts] = useState<number>(0);
  const [from, setFrom] = useState<number | null>(null);
  const [to, setTo] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  /**
   * Récupérer les produits depuis l'API et utiliser les données de stock si disponibles
   */
  const fetchProducts = async (page: number = 1) => {
    setLoading(true);
    setError("");

    try {
      // Récupérer les produits
      const response = await productService.getProducts(page);
      let productsList = response.data;

      // Vérifier si les produits contiennent déjà les informations de stock
      // L'API peut retourner directement un champ "stock" ou "store_stock" pour chaque produit
      productsList = productsList.map((product) => {
        // Vérifier si le produit a déjà des informations de stock dans la réponse
        // Il faut vérifier que la valeur est valide (non undefined, non null, non vide, non zéro)
        const stockValue = product.stock || product.store_stock;
        const hasValidStock = stockValue !== undefined && 
                              stockValue !== null && 
                              stockValue !== "" && 
                              stockValue !== 0 &&
                              stockValue !== "0";
        
        if (hasValidStock) {
          // Le produit a déjà des informations de stock valides, les utiliser directement
          return {
            ...product,
            in_store: true,
            store_stock: stockValue,
            stock: stockValue,
          };
        }
        
        // Si pas de stock valide dans la réponse, le produit n'est pas dans le store
        return {
          ...product,
          in_store: false,
          store_stock: undefined,
          stock: undefined,
        };
      });

      // Si aucun produit n'a de stock, essayer de récupérer les produits du store
      // pour fusionner les données (fallback si l'API ne retourne pas les stocks directement)
      const hasAnyStock = productsList.some(p => p.in_store);
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
            productsList = productsList.map((product) => {
              const storeProduct = storeProductsMap.get(product.id);
              if (storeProduct) {
                // Vérifier que le stock est valide avant de marquer le produit comme étant dans le store
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

      setProducts(productsList);
      setTotalPages(response.meta.last_page);
      setTotalProducts(response.meta.total);
      setCurrentPage(response.meta.current_page);
      setFrom(response.meta.from);
      setTo(response.meta.to);
    } catch (err: any) {
      const errorMessage = err.message || "Une erreur est survenue lors de la recuperation des produits";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Charger les produits au montage du composant
   */
  useEffect(() => {
    fetchProducts(currentPage);
  }, []);

  /**
   * Gérer le changement de page
   */
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchProducts(newPage);
    }
  };

  /**
   * Ouvrir le modal pour ajouter un produit au store
   */
  const handleAddToStore = (productId: string | number) => {
    // Trouver le produit dans la liste
    const product = products.find(p => p.id === productId);
    if (product) {
      setSelectedProduct(product);
      setIsModalOpen(true);
      setSuccessMessage("");
      setErrorMessage("");
    }
  };

  /**
   * Confirmer l'ajout au store avec la quantité
   */
  const handleConfirmAddToStore = async (quantity: number) => {
    if (!selectedProduct) return;

    try {
      const response = await productService.addProductToStore(selectedProduct.id, quantity);
      
      if (response.success) {
        // Afficher le message de succès
        setSuccessMessage("Produit ajouté à votre stock");
        setErrorMessage("");
        
        // Mettre à jour le produit dans la liste avec les données de stock retournées par l'API
        // La réponse contient response.data qui est l'objet produit avec le champ stock
        if (response.data) {
          const stockData = response.data;
          // Extraire le stock de l'objet produit retourné par l'API
          const stockValue = stockData.stock || stockData.store_stock || quantity;
          
          setProducts((prevProducts) =>
            prevProducts.map((product) =>
              product.id === selectedProduct.id
                ? {
                    ...product,
                    in_store: true,
                    store_stock: stockValue,
                    stock: stockValue,
                  }
                : product
            )
          );
        }
        
        // Fermer le modal
        setIsModalOpen(false);
        setSelectedProduct(null);
        
        // Faire disparaître le message après 5 secondes
        setTimeout(() => {
          setSuccessMessage("");
        }, 5000);
      } else {
        // Afficher le message d'erreur
        setErrorMessage(response.message);
        setSuccessMessage("");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Une erreur est survenue lors de l'ajout au store");
      setSuccessMessage("");
    }
  };

  /**
   * Fermer le modal
   */
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  /**
   * Obtenir l'URL de l'image du produit
   * 
   * Note: L'API retourne photo_prymary (avec faute de frappe) qui contient /public/ dans l'URL
   * Certains serveurs n'exposent pas le dossier /public/ directement dans l'URL
   * Il faut donc essayer les deux formats d'URL
   */
  const getProductImage = (product: Product): string => {
    // L'API retourne photo_prymary (avec faute de frappe) comme URL principale
    if (product.photo_prymary) {
      const originalUrl = product.photo_prymary;
      
      // Vérifier si l'URL contient /public/ et essayer de le retirer
      // Certains serveurs Laravel exposent les fichiers sans /public/ dans l'URL
      if (originalUrl.includes('/public/')) {
        return originalUrl.replace('/public/', '/');
      }
      
      return originalUrl;
    }
    
    // Essayer de récupérer depuis all_photos si disponible
    if (product.all_photos && product.all_photos.length > 0) {
      const primaryPhoto = product.all_photos.find(p => p.is_primary === 1 || p.is_primary === "1");
      const photoUrl = primaryPhoto?.url || product.all_photos[0]?.url;
      
      if (photoUrl) {
        // Appliquer la même transformation
        if (photoUrl.includes('/public/')) {
          return photoUrl.replace('/public/', '/');
        }
        return photoUrl;
      }
    }
    
    // Essayer depuis photos si disponible
    if (product.photos && product.photos.length > 0) {
      const photoUrl = product.photos[0]?.url || product.photos[0]?.path;
      
      if (photoUrl) {
        // Appliquer la même transformation
        if (photoUrl.includes('/public/')) {
          return photoUrl.replace('/public/', '/');
        }
        return photoUrl;
      }
    }
    
    return "/images/product/product-placeholder.png";
  };

  /**
   * Formater le prix
   */
  const formatPrice = (price: number | string): string => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(numPrice);
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
      {successMessage && (
        <div className="fixed top-20 left-1/2 z-50 -translate-x-1/2 px-4 py-3 text-sm font-medium text-white bg-[#04b05d] rounded-lg shadow-lg">
          {successMessage}
        </div>
      )}

      <PageMeta
        title="Produits Vivriers | Boutique Proxy Market"
        description="Parcourez tous les produits vivriers disponibles"
      />
      <PageBreadCrumb
        pageTitle="Produits Vivriers"
        titleClassName="text-[#04b05d] dark:text-[#04b05d]"
        items={[
          { label: "Accueil", href: "/" }
        ]}
      />

      <ComponentCard>
        {/* Message d'erreur global */}
        {errorMessage && (
          <div className="mb-4 p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
            {errorMessage}
          </div>
        )}

        {/* Affichage du loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block w-8 h-8 border-4 border-[#04b05d] border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Chargement des produits...
              </p>
            </div>
          </div>
        )}

        {/* Affichage de l'erreur */}
        {!loading && error && (
          <div className="p-4 mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
            {error}
          </div>
        )}

        {/* Affichage des produits */}
        {!loading && !error && (
          <>
            {/* Compteur de produits */}
            <div className="mb-6">
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-yellow-100 border border-yellow-400 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-500 dark:text-yellow-200">
              {totalProducts > 0
                ? `${totalProducts} produit${totalProducts > 1 ? 's' : ''} trouve${totalProducts > 1 ? 's' : ''}`
                : "Aucun produit trouve"}
              </span>
            </div>

            {/* Liste des produits */}
            {products.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  Aucun produit disponible pour le moment.
                </p>
                <Link
                  to="/add-product"
                  className="mt-4 inline-block px-4 py-2 text-sm font-medium text-white bg-[#04b05d] rounded-lg hover:bg-[#039850]"
                >
                  Ajouter un produit
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => {
                  // Vérifier strictement si le produit est dans le store
                  // Le produit est dans le store seulement si in_store est true ET qu'il a un stock valide
                  const stockValue = product.store_stock || product.stock;
                  const hasValidStock = stockValue !== undefined && 
                                        stockValue !== null && 
                                        stockValue !== "" && 
                                        stockValue !== 0 &&
                                        stockValue !== "0";
                  const isInStore = product.in_store === true && hasValidStock;
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
                          const currentSrc = target.src;
                          
                          // Si l'URL actuelle contient /public/, essayer sans
                          if (currentSrc && product.photo_prymary && !currentSrc.includes('placeholder')) {
                            // Première tentative : essayer avec l'URL originale si on avait retiré /public/
                            if (!currentSrc.includes('/public/') && product.photo_prymary.includes('/public/')) {
                              target.src = product.photo_prymary;
                              return;
                            }
                          }
                          
                          // Dernière tentative : placeholder
                          target.src = "/images/product/product-placeholder.png";
                        }}
                      />
                      {/* Badge statut */}
                        <div className="absolute top-3 right-3 flex flex-col gap-1">
                          {isAvailable ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 border border-green-400 text-green-700 dark:bg-green-900/30 dark:border-green-500 dark:text-green-300">
                            Disponible
                          </span>
                        ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 border border-red-400 text-red-700 dark:bg-red-900/30 dark:border-red-500 dark:text-red-300">
                            Indisponible
                          </span>
                        )}
                        {/* Badge stock - Afficher uniquement si le produit est dans le store */}
                          {isInStore && stockValue && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 border border-blue-400 text-blue-700 dark:bg-blue-900/30 dark:border-blue-500 dark:text-blue-300">
                              Stock: {stockValue}
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

                      {/* Prix */}
                        <div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">Prix</span>
                          <p className="text-xl font-bold text-gray-900 dark:text-white/90 mt-0.5">
                            {formatPrice(product.prix_vente_normale)}
                          </p>
                      </div>

                      {/* Boutons d'action */}
                        <div className="space-y-2 pt-2">
                        <button
                          onClick={() => handleAddToStore(product.id)}
                          disabled={isInStore || !isAvailable}
                          className={`block w-full px-4 py-2 text-sm font-medium text-center rounded-lg transition-colors ${
                            isInStore || !isAvailable
                              ? "text-gray-400 bg-gray-100 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600"
                              : "text-white bg-[#04b05d] hover:bg-[#039850]"
                          }`}
                        >
                          {isInStore
                            ? "Deja dans mon store"
                            : !isAvailable
                              ? "Indisponible"
                              : "Ajouter a mon store"}
                        </button>
                        <Link
                          to="#"
                          className="block w-full px-4 py-2 text-sm font-medium text-center text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors cursor-not-allowed"
                          onClick={(e) => e.preventDefault()}
                        >
                          Voir les details
                        </Link>
                      </div>
                    </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {products.length > 0 && totalPages > 1 && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                {/* Informations sur les résultats */}
                <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                  Affichage de {from || 0} à {to || 0} sur {totalProducts} produit{totalProducts > 1 ? 's' : ''}
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
                    Precedent
                  </button>

                  {/* Numéros de page */}
                  <div className="flex items-center gap-1 sm:gap-2">
                    {(() => {
                      // Calculer les pages à afficher
                      const pagesToShow: (number | string)[] = [];
                      const maxPagesToShow = 7; // Nombre maximum de pages à afficher
                      
                      if (totalPages <= maxPagesToShow) {
                        // Si on a peu de pages, toutes les afficher
                        for (let i = 1; i <= totalPages; i++) {
                          pagesToShow.push(i);
                        }
                      } else {
                        // Toujours afficher la première page
                        pagesToShow.push(1);
                        
                        // Calculer le début et la fin de la plage autour de la page courante
                        let start = Math.max(2, currentPage - 1);
                        let end = Math.min(totalPages - 1, currentPage + 1);
                        
                        // Ajuster si on est trop proche du début
                        if (currentPage <= 3) {
                          end = Math.min(5, totalPages - 1);
                        }
                        
                        // Ajuster si on est trop proche de la fin
                        if (currentPage >= totalPages - 2) {
                          start = Math.max(2, totalPages - 4);
                        }
                        
                        // Ajouter les points de suspension si nécessaire
                        if (start > 2) {
                          pagesToShow.push('...');
                        }
                        
                        // Ajouter les pages autour de la page courante
                        for (let i = start; i <= end; i++) {
                          pagesToShow.push(i);
                        }
                        
                        // Ajouter les points de suspension si nécessaire
                        if (end < totalPages - 1) {
                          pagesToShow.push('...');
                        }
                        
                        // Toujours afficher la dernière page
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

      {/* Modal pour ajouter au store */}
      <AddToStoreModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        product={selectedProduct}
        onConfirm={handleConfirmAddToStore}
      />
    </>
  );
}

