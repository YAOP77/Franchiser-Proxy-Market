/**
 * Modal AddToStore - Popup pour ajouter un produit au store
 * 
 * Ce modal permet au gérant de:
 * - Saisir la quantité de stock disponible pour un produit
 * - Valider et envoyer la demande d'ajout au store
 * - Voir les messages de succès ou d'erreur
 * 
 * Bonnes pratiques:
 * - Validation de la quantité (nombre positif)
 * - Gestion des états (loading, error, success)
 * - Pas d'emoji dans l'interface
 */

import { useState, useEffect } from "react";
import { Product } from "../../services/api/productService";

interface AddToStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onConfirm: (quantity: number) => Promise<void>;
}

export default function AddToStoreModal({
  isOpen,
  onClose,
  product,
  onConfirm,
}: AddToStoreModalProps) {
  const [quantity, setQuantity] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  /**
   * Réinitialiser le formulaire quand le modal s'ouvre
   */
  useEffect(() => {
    if (isOpen) {
      setQuantity("");
      setError("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  /**
   * Gérer la soumission du formulaire
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation de la quantité
    const quantityNumber = parseInt(quantity, 10);
    
    if (!quantity.trim()) {
      setError("Veuillez entrer une quantite");
      return;
    }

    if (isNaN(quantityNumber) || quantityNumber <= 0) {
      setError("La quantite doit etre un nombre positif");
      return;
    }

    // Envoi de la requête
    setIsSubmitting(true);

    try {
      await onConfirm(quantityNumber);
      // Le modal sera fermé par le composant parent en cas de succès
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Fermer le modal
   */
  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  // Ne rien afficher si le modal n'est pas ouvert
  if (!isOpen || !product) {
    return null;
  }

  return (
    <>
      {/* Overlay (arrière-plan sombre) */}
      <div
        className="fixed inset-0 z-[999998] bg-black bg-opacity-20 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="relative w-full max-w-md bg-white rounded-lg shadow-xl dark:bg-gray-800 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* En-tête du modal */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Ajouter au store
            </h3>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
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

          {/* Corps du modal */}
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-4">
              {/* Nom du produit */}
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Produit</p>
                <p className="text-base font-medium text-gray-900 dark:text-white">
                  {product.libelle}
                </p>
              </div>

              {/* Champ de quantité */}
              <div>
                <label
                  htmlFor="quantity"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Quantite de stock <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="quantity"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-[#04b05d] focus:border-[#04b05d] dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50"
                  placeholder="Ex: 100"
                  autoFocus
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Entrez la quantite disponible dans votre stock
                </p>
              </div>

              {/* Message d'erreur */}
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
                  {error}
                </div>
              )}
            </div>

            {/* Pied du modal avec les boutons */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-[#04b05d] rounded-lg hover:bg-[#039850] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Ajout en cours..." : "Ajouter"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

