/**
 * Composant NotificationDropdown - Menu déroulant des notifications
 * 
 * Affiche les notifications de commandes réelles avec :
 * - Clignotant pour nouvelles commandes
 * - Clignotant pour changements de statut
 * - Liste des vraies notifications depuis l'API
 */

import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { Link } from "react-router";
import { useNotifications, NotificationType } from "../../context/NotificationContext";

/**
 * Composant d'icône SVG pour nouvelle commande
 */
const NewOrderIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M3.33333 3.33333L5.83333 1.66667H14.1667L16.6667 3.33333V16.6667C16.6667 17.5871 15.9205 18.3333 15 18.3333H5C4.07953 18.3333 3.33333 17.5871 3.33333 16.6667V3.33333Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3.33333 6.66667H16.6667"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8.33333 10H11.6667"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Composant d'icône SVG pour commande livrée
 */
const DeliveredIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M16.6667 5L7.5 14.1667L3.33333 10"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Composant d'icône SVG pour changement de statut
 */
const StatusChangeIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10 3.33333V10L13.3333 13.3333"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10 16.6667C13.6819 16.6667 16.6667 13.6819 16.6667 10C16.6667 6.3181 13.6819 3.33333 10 3.33333C6.3181 3.33333 3.33333 6.3181 3.33333 10C3.33333 13.6819 6.3181 16.6667 10 16.6667Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Formate la date en heure:minute
 */
const formatTime = (date: Date): string => {
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Retourne l'icône et la couleur selon le type de notification
 */
const getNotificationTypeStyle = (type: NotificationType): { 
  icon: ReactNode; 
  color: string; 
  bgColor: string 
} => {
  switch (type) {
    case "new_order":
      return {
        icon: <NewOrderIcon className="w-5 h-5" />,
        color: "text-green-600 dark:text-green-400",
        bgColor: "bg-green-50 dark:bg-green-900/20",
      };
    case "delivered":
      return {
        icon: <DeliveredIcon className="w-5 h-5" />,
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
      };
    case "status_change":
    default:
      return {
        icon: <StatusChangeIcon className="w-5 h-5" />,
        color: "text-yellow-600 dark:text-yellow-400",
        bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
      };
  }
};

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const {
    notifications,
    hasNewNotifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
  } = useNotifications();

  /**
   * Rafraîchit les notifications quand le dropdown s'ouvre
   */
  useEffect(() => {
    if (isOpen) {
      refreshNotifications();
    }
  }, [isOpen, refreshNotifications]);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  /**
   * Gère le clic sur le bouton de notification
   */
  const handleClick = () => {
    toggleDropdown();
    // Ne pas marquer comme lu automatiquement, seulement quand on clique sur une notification
  };

  /**
   * Gère le clic sur une notification
   */
  const handleNotificationClick = (notificationId: string) => {
    markAsRead(notificationId);
    closeDropdown();
  };

  /**
   * Liste des vraies notifications triées par date
   * Les plus récentes en premier
   */
  const allNotifications = [...notifications].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );

  return (
    <div className="relative">
      <button
        className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full dropdown-toggle hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={handleClick}
      >
        {/* Clignotant - visible seulement s'il y a de nouvelles notifications */}
        <span
          className={`absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full bg-orange-400 ${
            !hasNewNotifications ? "hidden" : "flex"
          }`}
        >
          <span className="absolute inline-flex w-full h-full bg-orange-400 rounded-full opacity-75 animate-ping"></span>
        </span>
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>
      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[240px] mt-[17px] flex w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Notifications
            </h5>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium text-white bg-orange-500 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {allNotifications.some((n) => !n.isRead) && (
              <button
                onClick={() => {
                  markAllAsRead();
                }}
                className="text-xs text-gray-500 transition dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                title="Tout marquer comme lu"
              >
                Tout marquer comme lu
              </button>
            )}
            <button
              onClick={toggleDropdown}
              className="text-gray-500 transition dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <svg
                className="fill-current"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
        </div>
        <ul className={`flex flex-col gap-1 ${allNotifications.length > 5 ? 'max-h-[400px] overflow-y-auto' : 'h-auto'} custom-scrollbar`}>
          {allNotifications.length === 0 ? (
            <li className="py-8 text-center">
              <div className="flex flex-col items-center gap-2">
                <svg 
                  className="w-12 h-12 text-gray-300 dark:text-gray-600"
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={1.5} 
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
                  />
                </svg>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Aucune notification pour le moment
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Les nouvelles commandes apparaîtront ici
                </p>
              </div>
            </li>
          ) : (
            allNotifications.map((notification) => {
              const typeStyle = getNotificationTypeStyle(notification.type);
              
              return (
                <li key={notification.id}>
                  <DropdownItem
                    tag="a"
                    to={`/order/${notification.orderId}`}
                    onItemClick={() => handleNotificationClick(notification.id)}
                    className={`flex gap-3 rounded-lg p-3 transition-colors ${
                      !notification.isRead 
                        ? "bg-gray-50 dark:bg-gray-800/50 border-l-2 border-orange-500" 
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/30"
                    }`}
                  >
                    {/* Icône du type de notification */}
                    <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${typeStyle.bgColor} ${typeStyle.color} flex-shrink-0`}>
                      {typeStyle.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Message de notification */}
                      <p className="text-sm text-gray-900 dark:text-white mb-0.5">
                        <span className="font-medium">{notification.customerName}</span>
                        {" "}
                        <span className="text-gray-600 dark:text-gray-400">{notification.message}</span>
                      </p>
                      
                      {/* Numéro de commande et date */}
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>Commande {notification.orderNumber}</span>
                        <span>•</span>
                        <span>{formatTime(notification.timestamp)}</span>
                      </div>
                    </div>

                    {/* Badge pour nouvelles notifications */}
                    {notification.isNew && !notification.isRead && (
                      <span className="h-2 w-2 rounded-full bg-orange-500 flex-shrink-0 mt-1"></span>
                    )}
                  </DropdownItem>
                </li>
              );
            })
          )}
        </ul>
        {allNotifications.length > 0 && (
          <Link
            to="/commandes"
            className="block px-4 py-2 mt-2 text-sm font-medium text-center text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            onClick={closeDropdown}
          >
            Voir toutes les notifications
          </Link>
        )}
      </Dropdown>
    </div>
  );
}
