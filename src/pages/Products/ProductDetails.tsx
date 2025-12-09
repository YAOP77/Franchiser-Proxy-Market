/**
 * Page ProductDetails - Détails d'un produit vivrier
 *
 * Affiche les informations complètes d'un produit avec
 * ses photos, prix, catégorie, description, etc.
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import Alert from "../../components/ui/alert/Alert";
import { Modal } from "../../components/ui/modal";
import EditProductModal from "../../components/modals/EditProductModal";
import productService, { Product } from "../../services/api/productService";
import {
  formatPrice,
  formatWeight,
  formatDate,
  getCategoryName,
  getProductImages,
  getPrimaryImage,
  getStatusLabel,
  getStatusColor,
} from "../../utils/productUtils";
import { PencilIcon } from "../../icons";

export default function ProductDetails() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const loadProduct = async () => {
    if (!productId) {
      setError("Identifiant produit manquant.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      const productData = await productService.getProductById(productId);
      setProduct(productData);
      setSelectedImageIndex(0);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur lors du chargement du produit";
      setError(message);
      setProduct(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const statusLabel = useMemo(() => {
    if (!product) return "Non défini";
    return getStatusLabel(product);
  }, [product]);

  const statusColor = useMemo(() => {
    if (!product) return "warning";
    return getStatusColor(product.status);
  }, [product]);

  const images = useMemo(() => {
    return product ? getProductImages(product) : [];
  }, [product]);

  const primaryImage = useMemo(() => {
    return product ? getPrimaryImage(product) : "/images/product/product-01.jpg";
  }, [product]);

  const displayedImage = useMemo(() => {
    return images.length > 0 && selectedImageIndex < images.length
      ? images[selectedImageIndex]
      : primaryImage;
  }, [images, selectedImageIndex, primaryImage]);

  const handleOpenEditModal = () => {
    setSuccessMessage("");
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
  };

  const handleEditSuccess = async () => {
    await loadProduct();
    setSuccessMessage("Produit modifié avec succès.");
    setIsEditModalOpen(false);
  };

  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!product || !product.id) {
      return;
    }

    try {
      setIsDeleting(true);
      await productService.deleteProduct(product.id);
      navigate("/products-table", { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur lors de la suppression du produit";
      setError(message);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <>
      <PageMeta
        title={product ? `${product.libelle} | Produit` : "Produit"}
        description="Consultez les informations détaillées d'un produit vivrier"
      />
      <PageBreadcrumb
        pageTitle="Détails du produit"
        items={[
          { label: "Gestion des produits", href: "/products-table" },
          { label: "Liste des produits", href: "/products-table" },
        ]}
        titleClassName="text-[#04b05d] dark:text-[#04b05d]"
      />

      <div className="space-y-6">
        {error && !isLoading && (
          <Alert variant="error" title="Erreur" message={error} />
        )}

        {successMessage && (
          <Alert variant="success" title="Succès" message={successMessage} />
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#04b05d] border-t-transparent" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Chargement des informations...</p>
          </div>
        ) : product ? (
          <div className="space-y-6">
            {/* En-tête avec boutons d'action */}
            <ComponentCard
              title={product.libelle}
              action={
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    size="sm"
                    startIcon={<PencilIcon className="size-4" />}
                    onClick={handleOpenEditModal}
                    className="bg-[#04b05d] hover:bg-[#039a52] text-white"
                  >
                    Modifier
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDelete}
                    className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    Supprimer
                  </Button>
                </div>
              }
            >
              <div className="space-y-6">
                {/* Section principale : Image et informations de base */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  {/* Galerie d'images */}
                  <ComponentCard title="Image" className="lg:col-span-1">
                    <div className="space-y-4">
                      {/* Image principale */}
                      <div className="relative aspect-square max-w-sm overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-gray-800/50">
                        <img
                          src={displayedImage}
                          alt={product.libelle}
                          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/images/product/product-01.jpg";
                          }}
                        />
                        {/* Badge de statut sur l'image */}
                        <div className="absolute top-2 right-2">
                          <Badge color={statusColor} size="sm">
                            {statusLabel}
                          </Badge>
                        </div>
                      </div>

                      {/* Miniatures des autres images */}
                      {images.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {images.map((image, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => setSelectedImageIndex(index)}
                              className={`flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                                selectedImageIndex === index
                                  ? "border-[#04b05d] ring-2 ring-[#04b05d]/30 shadow-md"
                                  : "border-gray-200 dark:border-white/10 hover:border-[#04b05d]/50"
                              }`}
                            >
                              <img
                                src={image}
                                alt={`${product.libelle} - Image ${index + 1}`}
                                className="h-16 w-16 object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "/images/product/product-01.jpg";
                                }}
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </ComponentCard>

                  {/* Informations principales */}
                  <div className="space-y-6 lg:col-span-2">
                    {/* Titre et catégorie */}
                    <ComponentCard title="Libellé">
                      <div className="space-y-4">
                        <div>
                          <h1 className="text-2xl font-bold text-gray-900 dark:text-white/90">
                            {product.libelle}
                          </h1>
                          <div className="mt-2">
                            <Badge color="warning" size="sm">
                              {getCategoryName(product)}
                            </Badge>
                          </div>
                        </div>

                        {/* Poids */}
                        <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                          <svg
                            className="h-5 w-5 text-gray-500 dark:text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                            />
                          </svg>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {formatWeight(product.valeur_poids, product.unite_poids)}
                          </span>
                        </div>
                      </div>
                    </ComponentCard>

                    {/* Section des prix */}
                    <ComponentCard title="Prix">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="flex flex-col rounded-lg bg-[#04b05d]/10 p-4 dark:bg-[#04b05d]/20">
                          <span className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                            Prix normal
                          </span>
                          <span className="text-lg font-bold text-[#04b05d] dark:text-[#04b05d]">
                            {formatPrice(product.prix_vente_normale)}
                          </span>
                        </div>

                        <div className="flex flex-col rounded-lg bg-orange-50 p-4 dark:bg-orange-900/20">
                          <span className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                            Prix réduit
                          </span>
                          <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                            {formatPrice(product.prix_vente_reduit)}
                          </span>
                        </div>

                        <div className="flex flex-col rounded-lg border border-gray-200 p-4 dark:border-white/10">
                          <span className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                            Prix d'achat
                          </span>
                          <span className="text-base font-semibold text-gray-700 dark:text-gray-300">
                            {formatPrice(product.prix_achat)}
                          </span>
                        </div>
                      </div>
                    </ComponentCard>
                  </div>
                </div>

                {/* Description */}
                {product.description && (
                  <ComponentCard title="Description">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                        {product.description}
                      </p>
                    </div>
                  </ComponentCard>
                )}

                {/* Informations supplémentaires */}
                <ComponentCard title="Informations supplémentaires">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border border-gray-200 p-4 dark:border-white/10">
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Date de création
                      </p>
                      <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                        {formatDate(product.created_at)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-4 dark:border-white/10">
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Dernière mise à jour
                      </p>
                      <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                        {formatDate(product.updated_at)}
                      </p>
                    </div>
                  </div>
                </ComponentCard>
              </div>
            </ComponentCard>
          </div>
        ) : (
          <ComponentCard title="Détails du produit">
            <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              Aucune information disponible.
            </p>
          </ComponentCard>
        )}
      </div>

      <EditProductModal
        isOpen={isEditModalOpen && !!product}
        onClose={handleCloseEditModal}
        product={product}
        onSuccess={handleEditSuccess}
      />

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          if (!isDeleting) {
            setIsDeleteModalOpen(false);
          }
        }}
        className="max-w-md"
      >
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Confirmer la suppression</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible.
          </p>

          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Annuler
            </Button>
            <Button
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Suppression..." : "Supprimer"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
