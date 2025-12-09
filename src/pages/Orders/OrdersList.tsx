/**
 * Page OrdersList - Liste des commandes
 * 
 * Affiche toutes les commandes avec leurs statuts
 * Chaque commande est cliquable pour voir les détails
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import PageBreadCrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import orderService, { Order } from "../../services/api/orderService";

export default function OrdersList() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalOrders, setTotalOrders] = useState<number>(0);
  const [from, setFrom] = useState<number | null>(null);
  const [to, setTo] = useState<number | null>(null);

  /**
   * Récupérer les commandes depuis l'API
   */
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await orderService.getOrders(currentPage);
        
        setOrders(response.data);
        setTotalPages(response.meta.last_page);
        setTotalOrders(response.meta.total);
        setFrom(response.meta.from);
        setTo(response.meta.to);
      } catch (err) {
        const errorMessage = err instanceof Error 
          ? err.message 
          : "Une erreur est survenue lors du chargement des commandes";
        setError(errorMessage);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [currentPage]);

  /**
   * Gère le changement de page
   */
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Scroll vers le haut de la page
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };


  /**
   * Formate le montant en FCFA
   */
  const formatPrice = (amount: number | string): string => {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      minimumFractionDigits: 0,
    }).format(numericAmount);
  };


  /**
   * Récupère le nom du produit (gère les cas avec un ou plusieurs produits)
   */
  const getProductName = (order: Order): string => {
    // Priorité 1: primary_produit de l'API
    if (order.primary_produit?.libelle) {
      return order.primary_produit.libelle;
    }
    
    // Priorité 2: products array
    if (order.products && order.products.length > 0) {
      if (order.products.length === 1) {
        return order.products[0].name || order.products[0].libelle || "Produit inconnu";
      }
      return `${order.products.length} produits`;
    }
    
    // Priorité 3: product (peut être un objet ou un array)
    if (order.product) {
      if (Array.isArray(order.product)) {
        return order.product.length === 1 
          ? (order.product[0].name || order.product[0].libelle || "Produit inconnu")
          : `${order.product.length} produits`;
      }
      return order.product.name || order.product.libelle || "Produit inconnu";
    }
    
    return "Produit inconnu";
  };

  /**
   * Récupère la catégorie du produit (améliorée pour récupérer toutes les valeurs possibles)
   */
  const getProductCategory = (order: Order): string => {
    // Priorité 1: primary_produit
    if (order.primary_produit) {
      if (order.primary_produit.categorie_name) {
      return order.primary_produit.categorie_name;
    }
      if (order.primary_produit.categorie) {
        if (typeof order.primary_produit.categorie === 'string') {
          return order.primary_produit.categorie;
        }
        if (typeof order.primary_produit.categorie === 'object') {
          return order.primary_produit.categorie.libelle || 
                 order.primary_produit.categorie.name || 
                 "Non catégorisé";
        }
      }
    }
    
    // Priorité 2: products array
    if (order.products && order.products.length > 0) {
      const product = order.products[0];
      if (product.categorie) {
        return product.categorie;
      }
      if (product.categorie_name) {
        return product.categorie_name;
      }
    }
    
    // Priorité 3: product (peut être un objet ou un array)
    if (order.product) {
      const product = Array.isArray(order.product) ? order.product[0] : order.product;
      if (product.categorie) {
        return product.categorie;
      }
      if (product.categorie_name) {
        return product.categorie_name;
    }
      if (product.category) {
        return product.category;
      }
    }
    
    // Priorité 4: Vérifier dans les données brutes de la commande
    if ((order as any).categorie) {
      return (order as any).categorie;
      }
    if ((order as any).categorie_name) {
      return (order as any).categorie_name;
      }
    
    return "Non catégorisé";
  };

  /**
   * Récupère la quantité totale (gère les cas avec un ou plusieurs produits)
   */
  const getTotalQuantity = (order: Order): number => {
    // Priorité 1: quantite de l'API
    if (order.quantite !== undefined && order.quantite !== null) {
      return order.quantite;
    }
    
    // Priorité 2: products array
    if (order.products && order.products.length > 0) {
      return order.products.reduce((sum, p) => sum + (p.quantity || 1), 0);
    }
    
    // Priorité 3: product
    if (order.product) {
      if (Array.isArray(order.product)) {
        return order.product.reduce((sum, p) => sum + (p.quantity || 1), 0);
      }
      return order.product.quantity || 1;
    }
    
    return 1;
  };

  /**
   * Normalise le texte du statut (remplace "Commande En cours de préparation" par "En cours de préparation")
   */
  const normalizeStatusText = (statusText: string | undefined): string => {
    if (!statusText) return "En attente";
    return statusText.replace(/Commande\s+En\s+cours\s+de\s+préparation/gi, 'En cours de préparation');
  };

  /**
   * Récupère le statut formaté de la commande
   */
  const getOrderStatus = (order: Order): { text: string; color: string; isPendingPayment?: boolean } => {
    const status = order.status_text || order.status;
    
    if (typeof status === 'string') {
      const statusLower = status.toLowerCase();
      
      // Vérifier si c'est "Commande en attente de paiement"
      const isPendingPayment = statusLower.includes('attente de paiement') || 
                               statusLower.includes('pending payment') ||
                               status === 'Commande en attente de paiement';
      
      const normalizedStatus = normalizeStatusText(status);
      
      if (statusLower.includes('livré') || statusLower.includes('delivered')) {
        return { text: normalizedStatus, color: 'bg-green-100 border border-green-600  text-green-800 dark:bg-green-900/30 dark:border-green-500 dark:text-green-200' };
      }
      if (statusLower.includes('livraison') || statusLower.includes('delivering')) {
        return { text: normalizedStatus, color: 'bg-blue-100 border border-bleu-600  text-blue-800 dark:bg-blue-900/30 dark:border-blue-500 dark:text-blue-200' };
      }
      if (statusLower.includes('préparation') || statusLower.includes('preparing')) {
        return { text: normalizedStatus, color: 'bg-yellow-100 border border-yellow-600  text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-500 dark:text-yellow-200' };
      }
      if (statusLower.includes('attente') || statusLower.includes('pending')) {
        if (isPendingPayment) {
          return { 
            text: normalizedStatus, 
            color: 'bg-yellow-100 border border-yellow-400 text-yellow-700 dark:bg-yellow-900/30 dark:border-yellow-500 dark:text-yellow-200',
            isPendingPayment: true
          };
        }
        return { 
          text: normalizedStatus, 
          color: 'bg-yellow-200 text-gray-500 dark:bg-gray-700 dark:text-gray-300',
          isPendingPayment: false
        };
      }
      if (statusLower.includes('annulé') || statusLower.includes('cancelled')) {
        return { text: normalizedStatus, color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:border-red-500 dark:text-red-200' };
      }
    }
    
    const normalizedStatus = normalizeStatusText(status?.toString());
    return { text: normalizedStatus || 'Inconnu', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' };
  };

  /**
   * Formate la date de commande
   */
  const formatOrderDate = (order: Order): string => {
    const dateStr = order.order_date || order.orderDate || order.created_at;
    if (!dateStr) return 'Non spécifiée';
    
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  /**
   * Récupère le nom complet du client (nom + prenoms)
   */
  const getCustomerName = (order: Order): string => {
    // Priorité 1: client avec nom et prenoms (depuis l'API)
    if ((order as any).client) {
      const client = (order as any).client;
      const parts = [client.nom, client.prenoms].filter(Boolean);
      if (parts.length > 0) {
        return parts.join(" ");
      }
    }
    
    // Priorité 2: user avec nom et prenoms
    if ((order.user as any)?.nom || (order.user as any)?.prenoms) {
      const user = order.user as any;
      const parts = [user.nom, user.prenoms].filter(Boolean);
      if (parts.length > 0) {
        return parts.join(" ");
      }
    }
    
    // Priorité 3: user.name (fallback)
    if (order.user?.name) {
      return order.user.name;
    }
    
    return 'Client inconnu';
  };

  /**
   * Récupère le contact du client
   */
  const getCustomerContact = (order: Order): string | null => {
    // Priorité 1: client.contact1 (depuis l'API)
    if ((order as any).client?.contact1) {
      return (order as any).client.contact1;
    }
    
    // Priorité 2: user.phone (fallback)
    if (order.user?.phone) {
      return order.user.phone;
    }
    
    return null;
  };

  /**
   * Récupère le montant total de la commande (améliorée pour récupérer toutes les valeurs possibles)
   */
  const getOrderTotal = (order: Order): number => {
    // Priorité 1: total (peut être string ou number)
    if (order.total !== undefined && order.total !== null) {
      if (typeof order.total === 'number') {
        return order.total;
      }
      if (typeof order.total === 'string') {
        // Essayer de parser si c'est formaté (ex: "5 300 FCFA")
        const parsed = parseFloat(order.total.replace(/[^\d.,]/g, '').replace(',', '.'));
        if (!isNaN(parsed)) {
          return parsed;
        }
      }
    }
    
    // Priorité 2: total_or (version numérique)
    if (order.total_or !== undefined && order.total_or !== null) {
      return typeof order.total_or === 'number' ? order.total_or : parseFloat(String(order.total_or)) || 0;
    }
    
    // Priorité 3: Calculer depuis subtotal + delivery_fee
    const subtotal = order.subtotal || order.soustotal_or || 0;
    const deliveryFee = order.delivery_fee || order.frais_livraison_or || 0;
    const subtotalNum = typeof subtotal === 'number' ? subtotal : parseFloat(String(subtotal)) || 0;
    const deliveryFeeNum = typeof deliveryFee === 'number' ? deliveryFee : parseFloat(String(deliveryFee)) || 0;
    
    if (subtotalNum > 0 || deliveryFeeNum > 0) {
      return subtotalNum + deliveryFeeNum;
    }
    
    // Priorité 4: Calculer depuis les produits
    if (order.products && order.products.length > 0) {
      const total = order.products.reduce((sum, p) => {
        const price = p.price || p.prix || p.prix_or || 0;
        const quantity = p.quantity || p.quantite || 1;
        const priceNum = typeof price === 'number' ? price : parseFloat(String(price)) || 0;
        return sum + (priceNum * quantity);
      }, 0);
      if (total > 0) {
        return total;
      }
    }
    
    // Priorité 5: Vérifier dans les données brutes
    if ((order as any).total_amount) {
      const totalAmount = (order as any).total_amount;
      return typeof totalAmount === 'number' ? totalAmount : parseFloat(String(totalAmount)) || 0;
    }
    
    return 0;
  };

  /**
   * Gère le clic sur une ligne de commande
   */
  const handleOrderClick = (orderId: string | number) => {
    navigate(`/order/${orderId}`);
  };

  /**
   * Vérifie si une commande est livrée
   */
  const isOrderDelivered = (order: Order): boolean => {
    const status = order.status_text || order.status;
    if (typeof status === 'string') {
      const statusLower = status.toLowerCase();
      return statusLower.includes('livré') || statusLower.includes('delivered');
    }
    return false;
  };

  /**
   * Séparer les commandes en livrées et non livrées
   */
  const pendingOrders = orders.filter(order => !isOrderDelivered(order));
  const deliveredOrders = orders.filter(order => isOrderDelivered(order));

  return (
    <>
      <PageMeta
        title="Liste des commandes | Proxy Market"
        description="Liste de toutes les commandes sur Proxy Market"
      />
      
      <PageBreadCrumb
        pageTitle="Liste des commandes"
        titleClassName="text-[#04b05d] dark:text-[#04b05d]"
        items={[{ label: "Accueil", href: "/" }]}
      />
      
      <ComponentCard>
        {loading ? (
          // Affichage du loading
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block w-8 h-8 border-4 border-[#04b05d] border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Chargement des commandes...
              </p>
            </div>
          </div>
        ) : error ? (
          // Affichage de l'erreur
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="text-center max-w-md">
              <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Erreur de chargement
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {error}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[#04b05d] rounded-lg hover:bg-[#039850] transition-colors"
              >
                Réessayer
              </button>
            </div>
          </div>
        ) : orders.length === 0 ? (
          // Aucune commande
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="text-center max-w-md">
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Aucune commande
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Vous n'avez aucune commande pour le moment. Les commandes apparaîtront ici lorsqu'elles seront passées.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Section Commandes en attente */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Commandes en attente
              </h2>
              {pendingOrders.length === 0 ? (
                <div className="py-8 text-center bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Aucune commande en attente pour le moment.
                  </p>
                </div>
              ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Commande
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Client
                  </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Produit
                  </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Quantité
                  </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Montant
                  </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Date
                  </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Statut
                  </th>
                </tr>
              </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {pendingOrders.map((order) => {
                        const statusInfo = getOrderStatus(order);
                        const orderTotal = getOrderTotal(order);
                        return (
                  <tr
                    key={order.id}
                            onClick={() => handleOrderClick(order.id)}
                            className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                  >
                            {/* Numéro de commande */}
                            <td className="px-4 py-4">
                              <div className="text-sm font-bold text-neutral-950 dark:text-white">
                                {order.numero || order.order_number || `CMD-${String(order.id).padStart(6, '0')}`}
                              </div>
                            </td>
                            
                            {/* Client */}
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-900 dark:text-white">
                                {getCustomerName(order)}
                              </div>
                              {getCustomerContact(order) && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {getCustomerContact(order)}
                                </div>
                              )}
                            </td>
                            
                            {/* Produit */}
                            <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {getProductName(order)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {getProductCategory(order)}
                      </div>
                    </td>
                            
                            {/* Quantité */}
                            <td className="px-4 py-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 border border-blue-400 text-blue-700 dark:bg-blue-700 dark:text-gray-300">
                                {getTotalQuantity(order)}
                      </span>
                    </td>
                            
                            {/* Montant total */}
                            <td className="px-4 py-4">
                              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                {formatPrice(orderTotal)}
                              </div>
                              {(order.delivery_fee || order.frais_livraison_or) && 
                               (parseFloat(String(order.delivery_fee || order.frais_livraison_or || 0)) > 0) && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  + {formatPrice(order.delivery_fee || order.frais_livraison_or || 0)} livraison
                                </div>
                              )}
                            </td>
                            
                            {/* Date */}
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-700 dark:text-gray-300">
                                {formatOrderDate(order)}
                              </div>
                            </td>
                            
                            {/* Statut */}
                            <td className="px-4 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                {statusInfo.text}
                      </span>
                    </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Séparateur */}
            {pendingOrders.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700"></div>
            )}

            {/* Section Commandes livrées */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Commandes livrées
              </h2>
              {deliveredOrders.length === 0 ? (
                <div className="py-8 text-center bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Aucune commande livrée pour le moment.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Commande
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Client
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Produit
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Quantité
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Montant
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Statut
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {deliveredOrders.map((order) => {
                        const statusInfo = getOrderStatus(order);
                        const orderTotal = getOrderTotal(order);
                        return (
                          <tr
                            key={order.id}
                            onClick={() => handleOrderClick(order.id)}
                            className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                          >
                            {/* Numéro de commande */}
                            <td className="px-4 py-4">
                              <div className="text-sm font-semibold text-neutral-900 dark:text-white">
                                {order.numero || order.order_number || `CMD-${String(order.id).padStart(6, '0')}`}
                              </div>
                            </td>
                            
                            {/* Client */}
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-900 dark:text-white">
                                {getCustomerName(order)}
                              </div>
                              {getCustomerContact(order) && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {getCustomerContact(order)}
                                </div>
                              )}
                            </td>
                            
                            {/* Produit */}
                            <td className="px-4 py-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {getProductName(order)}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {getProductCategory(order)}
                              </div>
                            </td>
                            
                            {/* Quantité */}
                            <td className="px-4 py-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 border border-blue-400 text-blue-700 dark:bg-blue-700 dark:text-gray-300">
                                {getTotalQuantity(order)}
                      </span>
                    </td>
                            
                            {/* Montant total */}
                            <td className="px-4 py-4">
                              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                {formatPrice(orderTotal)}
                              </div>
                              {(order.delivery_fee || order.frais_livraison_or) && 
                               (parseFloat(String(order.delivery_fee || order.frais_livraison_or || 0)) > 0) && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  + {formatPrice(order.delivery_fee || order.frais_livraison_or || 0)} livraison
                                </div>
                              )}
                            </td>
                            
                            {/* Date */}
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-700 dark:text-gray-300">
                                {formatOrderDate(order)}
                              </div>
                            </td>
                            
                            {/* Statut */}
                            <td className="px-4 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                {statusInfo.text}
                      </span>
                    </td>
                  </tr>
                        );
                      })}
              </tbody>
            </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pagination */}
        {orders.length > 0 && totalPages > 1 && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            {/* Informations sur les résultats */}
            <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Affichage de {from || 0} à {to || 0} sur {totalOrders} commande{totalOrders > 1 ? 's' : ''}
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
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                        currentPage === pageNum
                          ? "text-white bg-[#04b05d]"
                          : "text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
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
      </ComponentCard>
    </>
  );
}

