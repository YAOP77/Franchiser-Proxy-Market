/**
 * Page OrderDetails - Détails d'une commande
 * 
 * Affiche les détails complets d'une commande avec :
 * - Informations de la commande (numéro, date, statut)
 * - Liste des produits commandés
 * - Détails financiers (sous-total, frais de livraison, total)
 * - Boutons d'action (Préparer / Annuler)
 */

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import PageBreadCrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import Alert from "../../components/ui/alert/Alert";
import AssignDeliveryModal from "../../components/modals/AssignDeliveryModal";
import orderService, { OrderDetail } from "../../services/api/orderService";

export default function OrderDetails() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState<boolean>(false);
  const [assignmentSuccess, setAssignmentSuccess] = useState<string>("");
  const [assignmentError, setAssignmentError] = useState<string>("");

  /**
   * Charger les détails de la commande depuis l'API
   */
  useEffect(() => {
    const fetchOrderDetail = async () => {
      if (!orderId) {
        setError("Identifiant commande manquant");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const data = await orderService.getOrderDetailById(orderId);
        setOrderDetail(data);
      } catch (err) {
        const errorMessage = err instanceof Error 
          ? err.message 
          : "Une erreur est survenue lors du chargement de la commande";
        setError(errorMessage);
        setOrderDetail(null);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetail();
  }, [orderId]);

  /**
   * Normalise le texte du statut (remplace "Commande En cours de préparation" par "En cours de préparation")
   */
  const normalizeStatusText = (statusText: string | undefined): string => {
    if (!statusText) return "En attente";
    return statusText.replace(/Commande\s+En\s+cours\s+de\s+préparation/gi, 'En cours de préparation');
  };

  /**
   * Obtient le style du statut avec bordure jaune (comme dans OrdersList)
   */
  const getStatusStyle = (statusText: string | undefined): { color: string; hasBorder: boolean } => {
    const status = (statusText || "").toLowerCase();
    
    // Vérifier si c'est "Commande en attente de paiement"
    const isPendingPayment = status.includes('attente de paiement') || 
                             status.includes('pending payment') ||
                             statusText === 'Commande en attente de paiement';
    
    if (status.includes('livré') || status.includes('delivered')) {
      return { color: 'bg-green-100 border border-green-500 text-green-800 dark:bg-green-900/30 dark:border-green-500 dark:text-green-200', hasBorder: true };
    }
    if (status.includes('livraison') || status.includes('delivering')) {
      return { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:border-blue-500 dark:text-blue-200', hasBorder: false };
    }
    if (status.includes('préparation') || status.includes('preparing')) {
      return { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 border border-yellow-600 dark:border-yellow-500 dark:text-yellow-200', hasBorder: false };
    }
    if (status.includes('attente') || status.includes('pending')) {
      if (isPendingPayment) {
        return { 
          color: 'bg-yellow-100 border border-yellow-400 text-yellow-700 dark:bg-yellow-900/30 dark:border-yellow-500 dark:text-yellow-200',
          hasBorder: true
        };
      }
      return { 
        color: 'bg-yellow-200 text-gray-500 dark:bg-gray-700 dark:text-gray-300',
        hasBorder: false
      };
    }
    if (status.includes('annulé') || status.includes('cancelled')) {
      return { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:border-red-500 dark:text-red-200', hasBorder: false };
    }
    
    return { color: 'bg-yellow-200 text-gray-500 dark:bg-gray-700 dark:text-gray-300', hasBorder: false };
  };

  /**
   * Ouvre le modal d'attribution à un livreur
   */
  const handlePrepare = () => {
    setAssignmentError("");
    setAssignmentSuccess("");
    setShowAssignModal(true);
  };

  /**
   * Gère la fermeture du modal
   */
  const handleCloseModal = () => {
    if (!isAssigning) {
    setShowAssignModal(false);
    }
  };

  /**
   * Recharger les données de la commande
   */
  const reloadOrderData = useCallback(async () => {
    if (orderId) {
      try {
        const data = await orderService.getOrderDetailById(orderId);
        setOrderDetail(data);
      } catch (err) {
        console.error("Erreur lors du rechargement:", err);
      }
    }
  }, [orderId]);

  /**
   * Gère l'attribution de la livraison à un livreur
   */
  const handleAssignDelivery = async (deliveryPersonId: string) => {
    if (!orderDetail?.id) return;

    setIsAssigning(true);
    setAssignmentError("");
    setAssignmentSuccess("");

    try {
      const result = await orderService.assignOrderToDeliveryPerson(
        String(orderDetail.id),
        deliveryPersonId
      );

      if (result.success) {
        setAssignmentSuccess(result.message || "Commande attribuée avec succès !");
    setShowAssignModal(false);
        // Recharger les données de la commande pour voir le nouveau statut
        await reloadOrderData();
      } else {
        setAssignmentError(result.error || "Erreur lors de l'attribution");
      }
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : "Une erreur est survenue lors de l'attribution";
      setAssignmentError(errorMessage);
    } finally {
      setIsAssigning(false);
    }
  };

  // Affichage du chargement
  if (loading) {
    return (
      <>
        <PageMeta
          title="Détails de la commande | Proxy Market"
          description="Chargement des détails de la commande"
        />
        <PageBreadCrumb
          pageTitle="Détails de la commande"
          items={[{ label: "Accueil", href: "/" }, { label: "Commandes", href: "/commandes" }]}
        />
        <ComponentCard title="Chargement...">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block w-8 h-8 border-4 border-[#04b05d] border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Chargement des détails de la commande...
              </p>
            </div>
          </div>
        </ComponentCard>
      </>
    );
  }

  // Affichage de l'erreur
  if (error || !orderDetail) {
    return (
      <>
        <PageMeta
          title="Erreur | Proxy Market"
          description="Erreur lors du chargement de la commande"
        />
        <PageBreadCrumb
          pageTitle="Erreur"
          items={[{ label: "Accueil", href: "/" }, { label: "Commandes", href: "/commandes" }]}
        />
        <ComponentCard title="Erreur">
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
                {error || "Commande introuvable"}
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => navigate("/commandes")}
                >
                  Retour aux commandes
                </Button>
                <Button
                  variant="primary"
                  onClick={() => window.location.reload()}
                >
                  Réessayer
                </Button>
              </div>
            </div>
          </div>
        </ComponentCard>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title={`Détails de la commande ${orderDetail.numero || orderDetail.id} | Proxy Market`}
        description={`Détails de la commande ${orderDetail.numero || orderDetail.id}`}
      />
      
      <PageBreadCrumb
        pageTitle={`Commande ${orderDetail.numero || orderDetail.id}`}
        titleClassName="text-[#04b05d] dark:text-[#04b05d]"
        items={[
          { label: "Accueil", href: "/" },
          { label: "Commandes", href: "/commandes" }
        ]}
      />

      {/* Informations de la commande */}
      <div className="mb-6 rounded-2xl border border-neutral-300 bg-white dark:bg-gray-800">
        <div className="px-6 py-5 border-b border-neutral-300 dark:border-gray-700">
            <h3 className="text-1xl font-bold text-neutral-900 dark:text-white">
              Informations de la commande
            </h3>
        </div>
        <div className="p-4 sm:p-6">
          {/* Première ligne - Informations principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
              <label className="text-sm font-medium text-neutral-900 dark:text-white mb-1">
              Numéro de commande
            </label>
              <p className="text-xs font-semibold text-neutral-600 dark:text-white">
              {orderDetail.numero || orderDetail.id}
            </p>
          </div>

          <div>
              <label className="text-sm font-medium text-neutral-900 dark:text-white mb-1">
              Date de commande
            </label>
              <p className="text-xs font-medium text-neutral-600 dark:text-white">
              {orderDetail.datecommande || "Date non disponible"}
            </p>
          </div>

          <div>
              <label className="text-sm font-medium text-neutral-900 dark:text-white mb-1">
              Statut
            </label>
            <div className="mt-1">
                {(() => {
                  const statusStyle = getStatusStyle(orderDetail.status_text);
                  const normalizedStatus = normalizeStatusText(orderDetail.status_text);
                  return (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle.color}`}>
                {normalizedStatus}
                    </span>
                  );
                })()}
          </div>
        </div>

            <div>
              <label className="text-sm font-medium text-neutral-900 dark:text-white mb-1">
                Quantité totale
              </label>
              <p className="text-xs font-medium text-neutral-600 dark:text-white">
                {orderDetail.quantite || orderDetail.commande_details?.length || 0} {orderDetail.quantite === 1 ? 'produit' : 'produits'}
              </p>
            </div>
          </div>

          {/* Deuxième ligne - Informations financières et paiement */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-neutral-200 dark:border-gray-700">
            {orderDetail.soustotal && (
              <div>
                <label className="text-sm font-medium text-neutral-900 dark:text-white mb-1">
                  Sous-total
                </label>
                <p className="text-xs font-semibold text-neutral-600 dark:text-white">
                  {orderDetail.soustotal}
                </p>
              </div>
            )}

            {orderDetail.frais_livraison && (
              <div>
                <label className="text-sm font-medium text-neutral-900 dark:text-white mb-1">
                  Frais de livraison
            </label>
                <p className="text-xs font-semibold text-neutral-600 dark:text-white">
                  {orderDetail.frais_livraison}
            </p>
          </div>
        )}

            <div>
              <label className="text-sm font-medium text-neutral-900 dark:text-white mb-1">
                Total
              </label>
              <p className="text-xs font-bold text-neutral-600 dark:text-white">
                {orderDetail.total || "0 FCFA"}
              </p>
            </div>
          </div>

          {/* Mode de paiement si disponible */}
        {orderDetail.modepaiement && (
            <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-gray-700">
              <label className="text-sm font-medium text-neutral-900 dark:text-white mb-1">
              Mode de paiement
            </label>
              <p className="text-sm font-medium text-neutral-600 dark:text-white">
              {orderDetail.modepaiement}
            </p>
          </div>
        )}
        </div>
      </div>

      {/* Informations du client */}
      {orderDetail.client && (
        <div className="mb-6 rounded-2xl border border-neutral-300 bg-white dark:bg-gray-800">
          <div className="px-6 py-5 border-b border-neutral-300 dark:border-gray-700">
            <h3 className="text-1xl font-bold text-neutral-900 dark:text-white">
              Informations du client
            </h3>
          </div>
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Nom complet */}
              {(orderDetail.client.nom || orderDetail.client.prenoms) && (
                <div>
                  <label className="text-sm font-medium text-neutral-900 dark:text-white mb-1">
                    Nom complet
                  </label>
                  <p className="mt-1 text-xs font-medium text-neutral-600 dark:text-white">
                    {[orderDetail.client.nom, orderDetail.client.prenoms]
                      .filter(Boolean)
                      .join(" ") || "Non renseigné"}
                  </p>
                </div>
              )}

              {/* Email */}
              {orderDetail.client.email && (
                <div>
                  <label className="text-sm font-medium text-neutral-900 dark:text-white mb-1">
                    Email
                  </label>
                  <p className="mt-1 text-xs font-medium text-neutral-600 dark:text-white">
                    {orderDetail.client.email}
                  </p>
                </div>
              )}

              {/* Contact principal */}
              {orderDetail.client.contact1 && (
                <div>
                  <label className="text-sm font-medium text-neutral-900 dark:text-white mb-1">
                    Contact principal
                  </label>
                  <p className="mt-1 text-xs font-medium text-neutral-600 dark:text-white">
                    {orderDetail.client.contact1}
                  </p>
                </div>
              )}

              {/* Contact secondaire */}
              {orderDetail.client.contact2 && (
                <div>
                  <label className="text-sm font-medium text-neutral-900 dark:text-white mb-1">
                    Contact secondaire
                  </label>
                  <p className="mt-1 text-xs font-medium text-neutral-600 dark:text-white">
                    {orderDetail.client.contact2}
                  </p>
                </div>
              )}

              {/* Statut du client */}
              {orderDetail.client.status !== undefined && (
                <div>
                  <label className="text-sm font-medium text-neutral-900 dark:text-white mb-1">
                    Statut
                  </label>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      orderDetail.client.status === 1
                        ? "bg-green-100 border border-green-400 text-green-700 dark:bg-green-900/30 dark:border-green-600 dark:text-green-300"
                        : "bg-gray-100 border border-gray-400 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                    }`}>
                      {orderDetail.client.status === 1 ? "Actif" : "Inactif"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Informations du livreur assigné */}
      {orderDetail.livreur && (
        <div className="mb-6 rounded-2xl border border-neutral-300 bg-white dark:bg-gray-800">
          <div className="px-6 py-5 border-b border-neutral-300 dark:border-gray-700">
            <h3 className="text-1xl font-bold text-neutral-900 dark:text-white">
              Informations du livreur
            </h3>
          </div>
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Nom complet */}
              {(orderDetail.livreur.nom || orderDetail.livreur.prenoms) && (
                <div>
                  <label className="text-sm font-medium text-neutral-900 dark:text-white mb-1">
                    Nom complet
                  </label>
                  <p className="mt-1 text-xs font-medium text-neutral-600 dark:text-white">
                    {[orderDetail.livreur.nom, orderDetail.livreur.prenoms]
                      .filter(Boolean)
                      .join(" ") || "Non renseigné"}
                  </p>
                </div>
              )}

              {/* Email */}
              {orderDetail.livreur.email && (
                <div>
                  <label className="text-sm font-medium text-neutral-900 dark:text-white mb-1">
                    Email
                  </label>
                  <p className="mt-1 text-xs font-medium text-neutral-600 dark:text-white">
                    {orderDetail.livreur.email}
                  </p>
                </div>
              )}

              {/* Contact principal */}
              {orderDetail.livreur.contact1 && (
                <div>
                  <label className="text-sm font-medium text-neutral-900 dark:text-white mb-1">
                    Contact principal
                  </label>
                  <p className="mt-1 text-xs font-medium text-neutral-600 dark:text-white">
                    {orderDetail.livreur.contact1}
                  </p>
                </div>
              )}

              {/* Contact secondaire */}
              {orderDetail.livreur.contact2 && (
                <div>
                  <label className="text-sm font-medium text-neutral-900 dark:text-white mb-1">
                    Contact secondaire
                  </label>
                  <p className="mt-1 text-xs font-medium text-neutral-600 dark:text-white">
                    {orderDetail.livreur.contact2}
                  </p>
                </div>
              )}

              {/* Statut du livreur */}
              {orderDetail.livreur.status !== undefined && (
                <div>
                  <label className="text-sm font-medium text-neutral-900 dark:text-white mb-1">
                    Statut
                  </label>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      orderDetail.livreur.status === 1
                        ? "bg-green-100 border border-green-400 text-green-700 dark:bg-green-900/30 dark:border-green-600 dark:text-green-300"
                        : "bg-red-100 border border-red-400 text-red-700 dark:bg-red-900/30 dark:border-red-600 dark:text-red-300"
                    }`}>
                      {orderDetail.livreur.status === 1 ? "Actif" : "Inactif"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Adresse de livraison */}
      {orderDetail.adresse_livraison && (
        <div className="mb-6 rounded-2xl border border-neutral-300 bg-white dark:bg-gray-800">
          <div className="px-6 py-5 border-b border-neutral-300 dark:border-gray-700">
            <h3 className="text-1xl font-bold text-neutral-900 dark:text-white">
              Adresse de livraison
            </h3>
          </div>
          <div className="p-4 sm:p-6">
            {typeof orderDetail.adresse_livraison === 'string' ? (
              <p className="text-sm font-medium text-neutral-900 dark:text-white">
                {orderDetail.adresse_livraison}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Adresse principale */}
                {orderDetail.adresse_livraison.adresse && (
                  <div>
                    <label className="text-sm font-medium text-neutral-900 dark:text-white mb-1">
                      Adresse
                    </label>
                    <p className="mt-1 text-xs font-medium text-neutral-600 dark:text-white">
                      {orderDetail.adresse_livraison.adresse}
                    </p>
                  </div>
                )}

                {/* Nom de la localisation */}
                {orderDetail.adresse_livraison.location_name && (
                  <div>
                    <label className="text-sm font-medium text-neutral-900 dark:text-white mb-1">
                      Localisation
                    </label>
                    <p className="mt-1  bg-yellow-200 w-24 px-2 border border-yellow-500 rounded-full text-xs font-medium text-neutral-600 dark:text-neutral-800">
                      {orderDetail.adresse_livraison.location_name}
                    </p>
                  </div>
                )}

                {/* Détails de l'adresse */}
                {orderDetail.adresse_livraison.adresse_detail && (
                  <div>
                    <label className="text-sm font-medium text-neutral-900 dark:text-white mb-1">
                      Détails de l'adresse
                    </label>
                    <p className="mt-1 text-sm font-medium text-neutral-900 dark:text-white">
                      {orderDetail.adresse_livraison.adresse_detail}
                    </p>
                  </div>
                )}

                {/* Commune */}
                {orderDetail.adresse_livraison.commune && (
                  <div>
                    <label className="text-sm font-medium text-neutral-900 dark:text-white mb-1">
                      Commune
                    </label>
                    <p className="mt-1 text-sm font-medium text-neutral-900 dark:text-white">
                      {orderDetail.adresse_livraison.commune}
                    </p>
                  </div>
                )}

                {/* Coordonnées GPS */}
                {(orderDetail.adresse_livraison.latitude || orderDetail.adresse_livraison.longitude) && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-neutral-900 dark:text-white mb-1">
                      Coordonnées GPS
                    </label>
                    <p className="mt-1 text-xs font-medium text-neutral-900 dark:text-white">
                      {orderDetail.adresse_livraison.latitude && orderDetail.adresse_livraison.longitude
                        ? `${orderDetail.adresse_livraison.latitude}, ${orderDetail.adresse_livraison.longitude}`
                        : orderDetail.adresse_livraison.latitude || orderDetail.adresse_livraison.longitude || "Non disponible"}
                    </p>
                  </div>
                )}

                {/* Contacts pour la livraison */}
                {(orderDetail.adresse_livraison.contact1 || orderDetail.adresse_livraison.contact2) && (
                  <div className="md:col-span-2 pt-4 border-t border-neutral-200 dark:border-gray-700">
                    <label className="text-sm font-medium text-neutral-900 dark:text-white mb-2 block">
                      Contacts pour la livraison
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {orderDetail.adresse_livraison.contact1 && (
                        <div>
                          <label className="text-xs text-neutral-900 dark:text-white">
                            Contact principal
                          </label>
                          <p className="mt-1 text-sm font-medium text-neutral-900 dark:text-white">
                            {orderDetail.adresse_livraison.contact1}
                          </p>
                        </div>
                      )}
                      {orderDetail.adresse_livraison.contact2 && (
                        <div>
                          <label className="text-xs text-neutral-900 dark:text-white">
                            Contact secondaire
                          </label>
                          <p className="mt-1 text-sm font-medium text-neutral-900 dark:text-white">
                            {orderDetail.adresse_livraison.contact2}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Liste des produits */}
      <div className="mb-6 rounded-2xl border border-neutral-300 bg-white dark:bg-gray-800">
        <div className="px-6 py-5 border-b border-neutral-300 dark:border-gray-700">
          <h3 className="text-1xl font-bold text-neutral-900 dark:text-white">
            Produits commandés ({orderDetail.commande_details?.length || 0})
          </h3>
        </div>
        <div className="p-4 sm:p-6">
        {orderDetail.commande_details && orderDetail.commande_details.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orderDetail.commande_details.map((product, index) => {
              // Récupération de la quantité
              const quantity = product.quantite || product.quantity || 1;
              
              // Récupération du prix unitaire (formaté)
              const unitPrice = product.prix || product.price || "0 FCFA";
              
              // Calcul du sous-total : priorité à total_prix, sinon calcul avec prix_or, sinon parse prix
              let subtotalFormatted = "0 FCFA";
              if (product.total_prix && product.total_prix !== "0 FCFA") {
                // Utiliser total_prix de l'API si disponible et valide
                subtotalFormatted = product.total_prix;
              } else if (product.prix_or) {
                // Utiliser prix_or (numérique) pour calculer
                const subtotal = (product.prix_or as number) * quantity;
                subtotalFormatted = `${subtotal.toLocaleString('fr-FR')} FCFA`;
              } else if (unitPrice) {
                // Parser le prix formaté en cas de fallback
                const unitPriceNum = typeof unitPrice === 'string' 
                  ? parseFloat(unitPrice.replace(/[^\d.]/g, '')) || 0 
                  : unitPrice;
                const subtotal = unitPriceNum * quantity;
                subtotalFormatted = `${subtotal.toLocaleString('fr-FR')} FCFA`;
              }

              return (
              <div
                key={product.id || index}
                  className="border border-neutral-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800/50 overflow-hidden"
              >
                  <div className="p-5">
                    {/* Catégorie en haut */}
                    {product.categorie && (
                      <div className="mb-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-yellow-400 text-yellow-700 dark:border-yellow-500">
                          {product.categorie}
                        </span>
                      </div>
                    )}
                    <div className="flex flex-col gap-5">
                  {/* Image du produit */}
                      <div className="flex justify-center">
                        {product.photo ? (
                      <img
                        src={product.photo}
                        alt={product.libelle || product.name || "Produit"}
                            className="w-36 h-36 sm:w-58 sm:h-58 object-cover rounded-xl"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                        }}
                      />
                        ) : (
                          <div className="w-46 h-46 sm:w-68 sm:h-68 rounded-xl bg-neutral-100 dark:bg-gray-900 flex items-center justify-center">
                            <svg className="w-12 h-12 text-neutral-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                    </div>
                  )}
                      </div>

                  {/* Informations du produit */}
                  <div className="flex-1 min-w-0">
                        {/* Nom du produit */}
                        <h3 className="text-lg font-semibold text-neutral-800 dark:text-white/90 mb-2">
                      {product.libelle || product.name || "Produit inconnu"}
                    </h3>
                    
                        {/* Description */}
                    {product.description && (
                          <p className="text-sm text-neutral-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {product.description}
                      </p>
                    )}

                        {/* Badges pour poids et catégorie */}
                        <div className="flex flex-wrap gap-2 mb-4">
                      {product.valeur_poids && product.unite_poids && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-neutral-100 border border-neutral-300 text-neutral-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300">
                              <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                              </svg>
                              {product.valeur_poids} {product.unite_poids}
                        </span>
                      )}
                      {product.categorie && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 border border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300">
                              <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                              {product.categorie}
                        </span>
                      )}
                    </div>

                        {/* Informations de prix et quantité */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-neutral-200 dark:border-gray-700">
                          {/* Quantité */}
                          <div className="flex flex-col">
                            <label className="text-sm font-medium text-neutral-900 dark:text-white mb-1">
                              Quantité
                            </label>
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-green-100 border border-green-400 text-green-700 dark:bg-green-900/30 dark:border-green-600 dark:text-green-300 text-sm font-semibold">
                                {quantity}
                        </span>
                            </div>
                          </div>

                          {/* Prix unitaire */}
                          <div className="flex flex-col">
                            <label className="text-sm font-medium text-neutral-900 dark:text-white mb-1">
                              Prix unitaire
                            </label>
                            <p className="text-xs font-semibold text-yellow-500 dark:text-white">
                              {typeof unitPrice === 'string' ? unitPrice : `${unitPrice.toLocaleString('fr-FR')} FCFA`}
                            </p>
                          </div>

                          {/* Sous-total */}
                          <div className="flex flex-col">
                            <label className="text-sm font-medium text-neutral-900 dark:text-white mb-1">
                              Sous-total
                            </label>
                            <p className="text-xs font-bold text-yellow-500 dark:text-white">
                              {subtotalFormatted}
                            </p>
                          </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-neutral-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="mt-4 text-sm font-medium text-neutral-800 dark:text-gray-300">
            Aucun produit trouvé dans cette commande.
          </p>
          </div>
        )}
        </div>
      </div>

      {/* Récapitulatif financier */}
      <div className="mb-6 rounded-2xl border border-neutral-300 bg-white dark:bg-gray-800">
        <div className="px-6 py-5 border-b border-neutral-300 dark:border-gray-700">
          <h3 className="text-1xl font-bold text-neutral-900 dark:text-white">
            Récapitulatif
          </h3>
        </div>
        <div className="p-4 sm:p-6">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-neutral-800 dark:text-gray-400">
              Sous-total
            </label>
              <p className="text-xs font-medium text-neutral-900 dark:text-white">
              {orderDetail.soustotal || "0 FCFA"}
            </p>
          </div>

          {orderDetail.frais_livraison && (
            <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-neutral-900 dark:text-white">
                Frais de livraison
              </label>
                <p className="text-xs font-medium text-neutral-900 dark:text-white">
                {orderDetail.frais_livraison}
              </p>
            </div>
          )}

            <div className="flex justify-between items-center pt-3 border-t-2 border-neutral-300 dark:border-gray-700">
              <label className="text-sm font-bold text-neutral-900 dark:text-white">
              Total
            </label>
            <p className="text-xl font-bold text-green-500 dark:text-white">
              {orderDetail.total || "0 FCFA"}
            </p>
          </div>
        </div>
        </div>
      </div>

      {/* Messages de succès/erreur */}
      {assignmentSuccess && (
        <div className="mb-6">
          <Alert
            variant="success"
            title="Succès"
            message={assignmentSuccess}
          />
        </div>
      )}

      {assignmentError && (
        <div className="mb-6">
          <Alert
            variant="error"
            title="Erreur"
            message={assignmentError}
          />
        </div>
      )}

      {/* Bouton d'action - Afficher uniquement si la commande n'est pas encore attribuée */}
      {!orderDetail.livreur && (
      <div className="flex flex-col sm:flex-row gap-3 justify-end">
        <Button
          variant="primary"
          onClick={handlePrepare}
          className="w-full sm:w-auto"
        >
          Préparer la commande
        </Button>
      </div>
      )}

      {/* Modal d'attribution à un livreur */}
      <AssignDeliveryModal
        isOpen={showAssignModal}
        onClose={handleCloseModal}
        onAssign={handleAssignDelivery}
        orderId={String(orderDetail.id)}
        orderNumber={orderDetail.numero}
        deliveryPersons={orderDetail.livreurs_disponible || []}
        isAssigning={isAssigning}
      />
    </>
  );
}
