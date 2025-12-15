/**
 * Contexte de notifications - Gestion des notifications de commandes réelles
 * 
 * Ce contexte gère :
 * - Les notifications de nouvelles commandes (clignotant actif)
 * - Les notifications de changements de statut (clignotant actif)
 * - Le suivi des commandes vues/non vues via localStorage
 * - Le rafraîchissement automatique depuis l'API
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import orderService, { Order } from "../services/api/orderService";

/**
 * Types de notifications possibles
 */
export type NotificationType = "new_order" | "status_change" | "delivered";

/**
 * Interface pour une notification
 */
export interface Notification {
  id: string;
  orderId: string | number;
  type: NotificationType;
  message: string;
  customerName: string;
  orderNumber: string;
  location?: string;
  status?: string;
  previousStatus?: string; // Pour les changements de statut
  timestamp: Date;
  isRead: boolean;
  isNew: boolean; // Pour le clignotant - true si nouvelle commande ou changement de statut récent
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  hasNewNotifications: boolean; // true si clignotant doit être actif
  hasStatusChanges: boolean; // true si un statut a changé récemment
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  refreshNotifications: () => Promise<void>;
  isLoading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Clés pour le localStorage
const NOTIFICATIONS_STORAGE_KEY = "proxy_market_notifications";
const SEEN_ORDERS_STORAGE_KEY = "proxy_market_seen_orders";
const LAST_STATUSES_STORAGE_KEY = "proxy_market_last_statuses";

interface NotificationProviderProps {
  children: ReactNode;
}

/**
 * Formate la date relative (ex: "Il y a 2 h", "Il y a 5 min")
 */
export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours} h`;
  if (diffDays < 7) return `Il y a ${diffDays} j`;
  
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

/**
 * Récupère le nom du client depuis une commande
 */
const getCustomerName = (order: Order): string => {
  // Priorité 1: client avec nom et prenoms
  if ((order as any).client) {
    const client = (order as any).client;
    const parts = [client.prenoms, client.nom].filter(Boolean);
    if (parts.length > 0) {
      return parts.join(" ");
    }
  }
  
  // Priorité 2: user avec nom et prenoms
  if ((order.user as any)?.nom || (order.user as any)?.prenoms) {
    const user = order.user as any;
    const parts = [user.prenoms, user.nom].filter(Boolean);
    if (parts.length > 0) {
      return parts.join(" ");
    }
  }
  
  // Priorité 3: user.name
  if (order.user?.name) {
    return order.user.name;
  }
  
  return "Client";
};

/**
 * Récupère la localisation depuis une commande
 */
const getLocation = (order: Order): string => {
  if ((order as any).adresse_livraison?.location_name) {
    return (order as any).adresse_livraison.location_name;
  }
  if (order.delivery_location || order.deliveryLocation) {
    return order.delivery_location || order.deliveryLocation || "";
  }
  return "Non spécifiée";
};

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [seenOrderIds, setSeenOrderIds] = useState<Set<string>>(new Set());
  const [lastOrderStatuses, setLastOrderStatuses] = useState<Map<string, string>>(new Map());
  
  // Utiliser useRef pour avoir accès aux valeurs actuelles dans les callbacks
  const seenOrderIdsRef = useRef<Set<string>>(new Set());
  const lastOrderStatusesRef = useRef<Map<string, string>>(new Map());
  
  // Synchroniser les refs avec les states
  useEffect(() => {
    seenOrderIdsRef.current = seenOrderIds;
  }, [seenOrderIds]);
  
  useEffect(() => {
    lastOrderStatusesRef.current = lastOrderStatuses;
  }, [lastOrderStatuses]);

  /**
   * Charge les données depuis localStorage au démarrage
   */
  useEffect(() => {
    try {
      const storedNotifications = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      const storedSeenOrders = localStorage.getItem(SEEN_ORDERS_STORAGE_KEY);
      const storedLastStatuses = localStorage.getItem(LAST_STATUSES_STORAGE_KEY);

      if (storedNotifications) {
        const parsed = JSON.parse(storedNotifications);
        // Reconvertir les timestamps en objets Date
        setNotifications(parsed.map((n: Notification) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        })));
      }

      if (storedSeenOrders) {
        const parsed = JSON.parse(storedSeenOrders);
        setSeenOrderIds(new Set<string>(parsed));
      }

      if (storedLastStatuses) {
        const parsed = JSON.parse(storedLastStatuses);
        setLastOrderStatuses(new Map<string, string>(parsed));
      }
    } catch (error) {
      console.error("Erreur lors du chargement des notifications:", error);
    }
  }, []);

  /**
   * Sauvegarde les notifications dans localStorage
   */
  const saveNotifications = useCallback((newNotifications: Notification[]) => {
    try {
      localStorage.setItem(
        NOTIFICATIONS_STORAGE_KEY,
        JSON.stringify(newNotifications)
      );
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des notifications:", error);
    }
  }, []);

  /**
   * Sauvegarde les IDs de commandes vues
   */
  const saveSeenOrders = useCallback((seen: Set<string>) => {
    try {
      localStorage.setItem(SEEN_ORDERS_STORAGE_KEY, JSON.stringify(Array.from(seen)));
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des commandes vues:", error);
    }
  }, []);

  /**
   * Sauvegarde les derniers statuts des commandes
   */
  const saveLastStatuses = useCallback((statuses: Map<string, string>) => {
    try {
      localStorage.setItem(
        LAST_STATUSES_STORAGE_KEY,
        JSON.stringify(Array.from(statuses.entries()))
      );
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des statuts:", error);
    }
  }, []);

  /**
   * Génère le message de notification basé sur le statut
   */
  const generateStatusMessage = (currentStatus: string, previousStatus?: string): string => {
    const statusLower = currentStatus.toLowerCase();
    
    if (statusLower.includes("livré") || statusLower.includes("delivered")) {
      return "a été livrée avec succès";
    } else if (statusLower.includes("préparation") || statusLower.includes("preparing")) {
      return "est en cours de préparation";
    } else if (statusLower.includes("livraison") || statusLower.includes("delivering")) {
      return "est en cours de livraison";
    } else if (statusLower.includes("annulé") || statusLower.includes("cancelled")) {
      return "a été annulée";
    } else if (statusLower.includes("attente") && statusLower.includes("paiement")) {
      return "est en attente de paiement";
    }
    
    if (previousStatus) {
      return `est passée à "${currentStatus}"`;
    }
    
    return "a changé de statut";
  };

  /**
   * Détermine le type de notification
   */
  const getNotificationType = (currentStatus: string): NotificationType => {
    const statusLower = currentStatus.toLowerCase();
    if (statusLower.includes("livré") || statusLower.includes("delivered")) {
      return "delivered";
    }
    return "status_change";
  };

  /**
   * Rafraîchit les notifications depuis l'API
   * Détecte les nouvelles commandes et les changements de statut
   * Synchronise les notifications avec les commandes de la boutique connectée
   */
  const refreshNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      // Récupérer les commandes récentes (première page) - déjà filtrées par boutique par l'API
      const response = await orderService.getOrders(1);
      const orders = response.data;

      // Créer un Set des IDs de commandes actuelles pour filtrage rapide
      const currentOrderIds = new Set<string>(
        orders ? orders.map((o) => String(o.id)) : []
      );

      // Si aucune commande n'est retournée, vider toutes les notifications
      if (!orders || orders.length === 0) {
        setNotifications([]);
        saveNotifications([]);
        setIsLoading(false);
        return;
      }

      setNotifications((prev) => {
        const newNotifications: Notification[] = [];
        const updatedStatuses = new Map<string, string>();

        // Utiliser les refs pour avoir les valeurs actuelles
        const currentSeen = seenOrderIdsRef.current;
        const currentStatuses = lastOrderStatusesRef.current;

        orders.forEach((order) => {
          const orderId = String(order.id);
          const currentStatus = order.status_text || String(order.status);
          updatedStatuses.set(orderId, currentStatus);

          // Vérifier si c'est une nouvelle commande (jamais vue)
          const isNewOrder = !currentSeen.has(orderId);
          const previousStatus = currentStatuses.get(orderId);
          const hasStatusChanged = !isNewOrder && previousStatus && previousStatus !== currentStatus;

          // Vérifier si une notification existe déjà pour cette commande (non lue, même type)
          const hasExistingNewOrderNotif = prev.some(
            (n) => n.orderId === order.id && n.type === "new_order" && !n.isRead
          );

          // Déterminer le type et message basé sur le statut actuel
          const notificationType = getNotificationType(currentStatus);
          const statusLower = currentStatus.toLowerCase();
          const isDelivered = statusLower.includes("livré") || statusLower.includes("delivered");

          // Créer une notification pour nouvelle commande
          // Si la commande est déjà livrée, on crée directement une notification "delivered"
          if (isNewOrder && !hasExistingNewOrderNotif) {
            const customerName = getCustomerName(order);
            const orderNumber = order.numero || order.order_number || `CMD-${String(order.id).padStart(6, '0')}`;
            const location = getLocation(order);
            const notificationId = `new-${orderId}-${Date.now()}`;

            // Si la commande est déjà livrée, créer une notification "delivered" au lieu de "new_order"
            if (isDelivered) {
              newNotifications.push({
                id: notificationId,
                orderId: order.id,
                type: "delivered",
                message: "a été livrée avec succès",
                customerName,
                orderNumber,
                location,
                status: currentStatus,
                timestamp: new Date(order.updated_at || order.created_at || order.order_date || new Date()),
                isRead: false,
                isNew: true,
              });
            } else {
              newNotifications.push({
                id: notificationId,
                orderId: order.id,
                type: "new_order",
                message: "a passé une nouvelle commande",
                customerName,
                orderNumber,
                location,
                status: currentStatus,
                timestamp: new Date(order.created_at || order.order_date || new Date()),
                isRead: false,
                isNew: true,
              });
            }
          }

          // Mettre à jour les notifications existantes si le statut a changé
          // Par exemple, si une notification "new_order" existe mais la commande est maintenant livrée
          const existingNotif = prev.find(
            (n) => n.orderId === order.id && n.type === "new_order" && !n.isRead
          );
          
          if (existingNotif && isDelivered && existingNotif.status !== currentStatus) {
            // Mettre à jour la notification existante pour refléter le statut livré
            const updatedNotif: Notification = {
              ...existingNotif,
              type: "delivered",
              message: "a été livrée avec succès",
              status: currentStatus,
              timestamp: new Date(order.updated_at || existingNotif.timestamp),
            };
            newNotifications.push(updatedNotif);
          }

          // Créer une notification pour changement de statut
          if (hasStatusChanged && previousStatus) {
            const customerName = getCustomerName(order);
            const orderNumber = order.numero || order.order_number || `CMD-${String(order.id).padStart(6, '0')}`;
            const location = getLocation(order);
            const message = generateStatusMessage(currentStatus, previousStatus);

            // Vérifier qu'on n'a pas déjà une notification pour ce changement de statut
            const hasSameStatusNotif = prev.some(
              (n) => 
                n.orderId === order.id && 
                n.status === currentStatus &&
                !n.isRead
            );

            if (!hasSameStatusNotif) {
              const notificationId = `status-${orderId}-${currentStatus.replace(/\s/g, '_')}-${Date.now()}`;
              
              newNotifications.push({
                id: notificationId,
                orderId: order.id,
                type: notificationType,
                message,
                customerName,
                orderNumber,
                location,
                status: currentStatus,
                previousStatus,
                timestamp: new Date(order.updated_at || new Date()),
                isRead: false,
                isNew: true,
              });
            }
          }
        });

        // Mettre à jour les statuts enregistrés
        setLastOrderStatuses(updatedStatuses);
        saveLastStatuses(updatedStatuses);

        // Filtrer les notifications existantes pour ne garder que celles qui correspondent aux commandes actuelles
        // et mettre à jour leurs statuts si nécessaire
        const updatedPrev = prev
          .filter((notif) => {
            // Ne garder que les notifications pour les commandes qui existent encore dans la boutique
            return currentOrderIds.has(String(notif.orderId));
          })
          .map((notif) => {
            const order = orders.find((o) => String(o.id) === String(notif.orderId));
            // Cette vérification est redondante après le filter, mais on la garde pour la sécurité
            if (!order) return null;
            
            const currentStatus = order.status_text || String(order.status);
            const statusLower = currentStatus.toLowerCase();
            const isDelivered = statusLower.includes("livré") || statusLower.includes("delivered");
            
            // Si la notification est "new_order" mais la commande est maintenant livrée, mettre à jour
            if (notif.type === "new_order" && isDelivered && notif.status !== currentStatus) {
              return {
                ...notif,
                type: "delivered" as NotificationType,
                message: "a été livrée avec succès",
                status: currentStatus,
              };
            }
            
            return notif;
          })
          .filter((notif): notif is Notification => notif !== null);

        // Combiner les nouvelles notifications avec les notifications mises à jour
        const combined = [...newNotifications, ...updatedPrev];
        
        // Supprimer les doublons basés sur orderId + type (garder le plus récent)
        const uniqueNotifications: Notification[] = [];
        const seenKeys = new Set<string>();
        
        for (const notif of combined) {
          // Pour les nouvelles commandes et livraisons, utiliser orderId uniquement
          // Pour les changements de statut, utiliser orderId + status
          const key = (notif.type === "new_order" || notif.type === "delivered")
            ? `${notif.orderId}-${notif.type}`
            : `${notif.orderId}-${notif.type}-${notif.status || ''}`;
            
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            uniqueNotifications.push(notif);
          }
        }

        // Trier par timestamp (plus récent en premier) et garder seulement les 30 dernières
        const sorted = uniqueNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        const limited = sorted.slice(0, 30);
        saveNotifications(limited);

        return limited;
      });
    } catch (error) {
      console.error("Erreur lors du rafraîchissement des notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [saveNotifications, saveLastStatuses]);

  /**
   * Rafraîchit les notifications périodiquement
   * Synchronise automatiquement les notifications avec les commandes de la boutique connectée
   */
  useEffect(() => {
    // Rafraîchir immédiatement au chargement pour synchroniser avec les commandes actuelles
    // Cela filtre automatiquement les notifications pour ne garder que celles de la boutique
    refreshNotifications();

    // Rafraîchir toutes les 30 secondes pour maintenir la synchronisation
    const interval = setInterval(() => {
      refreshNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshNotifications]);

  /**
   * Marque une notification comme lue
   */
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) =>
        n.id === notificationId ? { ...n, isRead: true, isNew: false } : n
      );
      saveNotifications(updated);
      
      // Marquer la commande associée comme vue
      const notification = prev.find((n) => n.id === notificationId);
      if (notification) {
        const newSeen = new Set(seenOrderIds);
        newSeen.add(String(notification.orderId));
        setSeenOrderIds(newSeen);
        saveSeenOrders(newSeen);
      }
      
      return updated;
    });
  }, [seenOrderIds, saveNotifications, saveSeenOrders]);

  /**
   * Marque toutes les notifications comme lues
   */
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, isRead: true, isNew: false }));
      saveNotifications(updated);

      // Marquer toutes les commandes comme vues
      setSeenOrderIds((currentSeen) => {
        const allOrderIds = new Set(prev.map((n) => String(n.orderId)));
        const newSeen = new Set([...currentSeen, ...allOrderIds]);
        saveSeenOrders(newSeen);
        return newSeen;
      });

      return updated;
    });
  }, [saveNotifications, saveSeenOrders]);

  // Compter les notifications non lues
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  
  // Vérifier s'il y a des nouvelles notifications (clignotant actif)
  // Le clignotant s'active pour les nouvelles commandes OU les changements de statut non lus
  const hasNewNotifications = notifications.some((n) => n.isNew && !n.isRead);
  
  // Vérifier spécifiquement les changements de statut récents
  const hasStatusChanges = notifications.some(
    (n) => n.isNew && !n.isRead && (n.type === "status_change" || n.type === "delivered")
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        hasNewNotifications,
        hasStatusChanges,
        markAsRead,
        markAllAsRead,
        refreshNotifications,
        isLoading,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

/**
 * Hook pour utiliser le contexte de notifications
 */
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
