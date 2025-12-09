/**
 * Composant AssignDeliveryModal - Modal d'attribution à un livreur
 * 
 * Affiche la liste des livreurs disponibles depuis l'API
 * et permet d'attribuer la livraison à un livreur
 */

import { useState } from "react";
import Button from "../ui/button/Button";
import { AvailableDeliveryPerson } from "../../services/api/orderService";

interface AssignDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (deliveryPersonId: string) => Promise<void>;
  orderId: string;
  orderNumber?: string;
  deliveryPersons: AvailableDeliveryPerson[];
  isAssigning?: boolean;
}

export default function AssignDeliveryModal({
  isOpen,
  onClose,
  onAssign,
  orderId,
  orderNumber,
  deliveryPersons,
  isAssigning = false,
}: AssignDeliveryModalProps) {
  const [selectedDeliveryPersonId, setSelectedDeliveryPersonId] = useState<string | null>(null);

  if (!isOpen) return null;

  /**
   * Obtient le nom complet du livreur
   */
  const getDeliveryPersonName = (person: AvailableDeliveryPerson): string => {
    const parts = [person.nom, person.prenoms].filter(Boolean);
    if (parts.length > 0) {
      return parts.join(" ");
    }
    return "Livreur sans nom";
  };

  /**
   * Obtient le contact principal du livreur
   */
  const getDeliveryPersonContact = (person: AvailableDeliveryPerson): string | null => {
    return person.contact1 || person.contact2 || null;
  };

  /**
   * Gère la sélection et l'attribution d'un livreur
   */
  const handleSelectDeliveryPerson = async (personId: string) => {
    setSelectedDeliveryPersonId(personId);
    await onAssign(personId);
  };

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
              Attribuer la livraison
            </h3>
            <p className="text-sm text-neutral-400 dark:text-gray-400 mt-1">
              Commande {orderNumber || orderId}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isAssigning}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <p className="px-1 text-center border border-yellow-600 bg-yellow-100 text-sm text-yellow-700 dark:text-yellow-700 rounded-full mb-4">
            Sélectionnez un livreur pour attribuer cette commande.
          </p>

          {deliveryPersons.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-yellow-600 dark:text-yellow-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                Aucun livreur disponible
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Veuillez ajouter des livreurs à votre boutique
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {deliveryPersons.map((person) => {
                const name = getDeliveryPersonName(person);
                const contact = getDeliveryPersonContact(person);
                const isSelected = selectedDeliveryPersonId === person.id;
                const hasName = person.nom || person.prenoms;

                return (
                  <button
                    key={person.id}
                    onClick={() => handleSelectDeliveryPerson(person.id)}
                    disabled={isAssigning}
                    className={`w-full flex items-center gap-4 p-4 border rounded-xl transition-all text-left ${
                      isSelected && isAssigning
                        ? "border-[#04b05d] bg-green-50 dark:bg-green-900/20"
                        : "border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-white/5 hover:border-gray-300 dark:hover:border-gray-700"
                    } ${isAssigning ? "cursor-not-allowed opacity-70" : ""}`}
                  >
                    {/* Avatar */}
                    <div className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center ${
                      hasName 
                        ? "bg-[#04b05d]/10 dark:bg-[#04b05d]/20" 
                        : "bg-gray-200 dark:bg-gray-700"
                    }`}>
                      {hasName ? (
                        <span className="text-lg font-semibold text-[#04b05d]">
                          {(person.nom?.[0] || person.prenoms?.[0] || "?").toUpperCase()}
                        </span>
                      ) : (
                        <svg 
                          className="w-6 h-6 text-gray-400 dark:text-gray-500" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                          />
                        </svg>
                      )}
                    </div>

                    {/* Informations */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className={`text-sm font-semibold truncate ${
                          hasName 
                            ? "text-gray-800 dark:text-white/90" 
                            : "text-gray-500 dark:text-gray-400 italic"
                        }`}>
                          {name}
                        </h4>
                        {isSelected && isAssigning && (
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <div className="w-4 h-4 border-2 border-[#04b05d] border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-xs text-[#04b05d] font-medium">
                              Attribution...
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Contact */}
                      {contact && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <svg
                            className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                          </svg>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {contact}
                          </span>
                        </div>
                      )}

                      {/* Contact secondaire si disponible */}
                      {person.contact2 && person.contact1 && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <svg
                            className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                          </svg>
                          <span className="text-sm text-gray-500 dark:text-gray-500">
                            {person.contact2}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Chevron */}
                    <svg
                      className="w-5 h-5 text-gray-400 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-200 dark:border-gray-800">
          <p className="text-sm text-red-500 dark:text-gray-400">
            {deliveryPersons.length} livreur{deliveryPersons.length > 1 ? "s" : ""} disponible{deliveryPersons.length > 1 ? "s" : ""}
          </p>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isAssigning}
          >
            Annuler
          </Button>
        </div>
      </div>
    </div>
  );
}
