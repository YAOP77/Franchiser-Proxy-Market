/**
 * Composant EditProductModal - Modal de modification de produit vivrier
 * 
 * Affiche un formulaire pour modifier les informations d'un produit vivrier
 */

import { useState, useEffect, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import { Modal } from "../ui/modal";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Select from "../form/Select";
import TextArea from "../form/input/TextArea";
import Button from "../ui/button/Button";
import Alert from "../ui/alert/Alert";
import productService, { Product, UpdateProductData, Category } from "../../services/api/productService";

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSuccess: () => void;
}

export default function EditProductModal({
  isOpen,
  onClose,
  product,
  onSuccess,
}: EditProductModalProps) {
  // État du formulaire
  const [libelle, setLibelle] = useState("");
  const [unitePoids, setUnitePoids] = useState("");
  const [valeurPoids, setValeurPoids] = useState("");
  const [categorie, setCategorie] = useState("");
  const [prixAchat, setPrixAchat] = useState("");
  const [prixVenteNormale, setPrixVenteNormale] = useState("");
  const [prixVenteReduit, setPrixVenteReduit] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);

  // État pour les alertes
  const [showWarningAlert, setShowWarningAlert] = useState(false);
  const [isWarningAlertVisible, setIsWarningAlertVisible] = useState(false);
  const [error, setError] = useState("");

  // État pour le chargement
  const [isLoading, setIsLoading] = useState(false);

  // État pour les catégories
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  // Options pour les Select
  const unitePoidsOptions = [
    { value: "kg", label: "kg" },
    { value: "g", label: "g" },
    { value: "kgs", label: "kgs" },
  ];

  const statusOptions = [
    { value: "actif", label: "Actif" },
    { value: "inactif", label: "Inactif" },
  ];

  const categorieOptions = useMemo(() => {
    return categories.map((cat) => ({
      value: cat.id.toString(),
      label: cat.libelle,
    }));
  }, [categories]);

  // Configuration du dropzone pour les images
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles: File[]) => {
      // Ajouter les nouvelles images aux images existantes
      setPhotos((prevPhotos) => [...prevPhotos, ...acceptedFiles]);
    },
    accept: {
      "image/png": [],
      "image/jpeg": [],
      "image/jpg": [],
      "image/webp": [],
    },
    multiple: true,
  });

  // Charger les données du produit quand le modal s'ouvre
  useEffect(() => {
    if (isOpen && product) {
      setLibelle(product.libelle || "");
      setUnitePoids(product.unite_poids || "");
      setValeurPoids(product.valeur_poids ? product.valeur_poids.toString() : "");
      
      // Gérer la catégorie : vérifier categorie_id d'abord, puis categorie
      if (product.categorie_id) {
        setCategorie(product.categorie_id.toString());
      } else if (product.categorie) {
        if (typeof product.categorie === 'string') {
          // Si c'est une string, vérifier si c'est un UUID ou un nom
          const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (uuidPattern.test(product.categorie)) {
            setCategorie(product.categorie);
          } else {
            // Si ce n'est pas un UUID, c'est probablement un nom, on devra le chercher dans les catégories
            setCategorie("");
          }
        } else if (typeof product.categorie === 'object' && product.categorie.id) {
          setCategorie(product.categorie.id.toString());
        } else {
          setCategorie("");
        }
      } else {
        setCategorie("");
      }
      
      setPrixAchat(product.prix_achat ? product.prix_achat.toString() : "");
      setPrixVenteNormale(product.prix_vente_normale ? product.prix_vente_normale.toString() : "");
      setPrixVenteReduit(product.prix_vente_reduit ? product.prix_vente_reduit.toString() : "");
      setDescription(product.description || "");
      
      // Convertir le status de number (1/0) ou string vers "actif"/"inactif"
      if (product.status !== null && product.status !== undefined) {
        if (typeof product.status === 'number') {
          setStatus(product.status === 1 ? "actif" : "inactif");
        } else if (typeof product.status === 'string') {
          const statusStr = product.status.toLowerCase().trim();
          if (statusStr === "1" || statusStr === "actif") {
            setStatus("actif");
          } else {
            setStatus("inactif");
          }
        } else {
          setStatus("");
        }
      } else {
        setStatus("");
      }
      
      setPhotos([]);
      setError("");
      setShowWarningAlert(false);
    }
  }, [isOpen, product]);

  // Charger la liste des catégories
  useEffect(() => {
    if (isOpen) {
      const loadCategories = async () => {
        try {
          setIsLoadingCategories(true);
          const categoriesList = await productService.getCategories();
          setCategories(categoriesList);
        } catch (error) {
          setCategories([]);
        } finally {
          setIsLoadingCategories(false);
        }
      };

      loadCategories();
    }
  }, [isOpen]);

  // Gère l'affichage et la disparition de l'alerte d'avertissement avec transition
  useEffect(() => {
    if (showWarningAlert) {
      setIsWarningAlertVisible(true);
      const timer = setTimeout(() => {
        setIsWarningAlertVisible(false);
        setTimeout(() => setShowWarningAlert(false), 300);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showWarningAlert]);

  /**
   * Gère la soumission du formulaire
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setShowWarningAlert(false);

    // Validation des champs requis (les photos sont optionnelles pour la modification)
    if (
      !libelle.trim() ||
      !unitePoids.trim() ||
      !valeurPoids.trim() ||
      !categorie.trim() ||
      !prixAchat.trim() ||
      !prixVenteNormale.trim() ||
      !prixVenteReduit.trim() ||
      !description.trim() ||
      !status.trim()
    ) {
      setShowWarningAlert(true);
      return;
    }

    // Validation des valeurs numériques
    const valeurPoidsNum = parseFloat(valeurPoids);
    const prixAchatNum = parseFloat(prixAchat);
    const prixVenteNormaleNum = parseFloat(prixVenteNormale);
    const prixVenteReduitNum = parseFloat(prixVenteReduit);

    if (isNaN(valeurPoidsNum) || valeurPoidsNum <= 0) {
      setError("La valeur du poids doit être un nombre positif");
      return;
    }

    if (isNaN(prixAchatNum) || prixAchatNum <= 0) {
      setError("Le prix d'achat doit être un nombre positif");
      return;
    }

    if (isNaN(prixVenteNormaleNum) || prixVenteNormaleNum <= 0) {
      setError("Le prix de vente normale doit être un nombre positif");
      return;
    }

    if (isNaN(prixVenteReduitNum) || prixVenteReduitNum <= 0) {
      setError("Le prix de vente réduit doit être un nombre positif");
      return;
    }

    // Validation des images si des images sont fournies
    if (photos.length > 0) {
      const validImageTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
      const maxFileSize = 10 * 1024 * 1024; // 10 Mo
      
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        
        if (!(photo instanceof File)) {
          setError(`L'image ${i + 1} n'est pas un fichier valide`);
          return;
        }
        
        if (!validImageTypes.includes(photo.type)) {
          setError(`L'image ${i + 1} doit être au format PNG, JPEG, JPG ou WEBP. Type reçu: ${photo.type || "inconnu"}`);
          return;
        }
        
        if (photo.size > maxFileSize) {
          const sizeInMB = (photo.size / (1024 * 1024)).toFixed(2);
          setError(`L'image ${i + 1} est trop volumineuse (${sizeInMB} Mo). Maximum autorisé: 10 Mo`);
          return;
        }
        
        if (photo.size === 0) {
          setError(`L'image ${i + 1} est vide`);
          return;
        }
      }
    }

    setIsLoading(true);

    try {
      if (!product || !product.id) {
        throw new Error("Produit non trouvé");
      }

      // Convertir le status de "actif"/"inactif" vers "1"/"0"
      const statusValue = status.trim().toLowerCase();
      const apiStatus = statusValue === "actif" ? "1" : statusValue === "inactif" ? "0" : statusValue;

      // Préparer les données
      const productData: UpdateProductData = {
        libelle: libelle.trim(),
        unite_poids: unitePoids.trim(),
        valeur_poids: valeurPoidsNum,
        categorie: categorie.trim(),
        prix_achat: prixAchatNum,
        prix_vente_normale: prixVenteNormaleNum,
        prix_vente_reduit: prixVenteReduitNum,
        description: description.trim(),
        status: apiStatus,
        photos: photos.length > 0 ? photos : undefined,
      };

      const result = await productService.updateProduct(product.id, productData);

      // Vérifier que la modification a vraiment réussi
      if (!result.success) {
        throw new Error(result.error || "La modification du produit a échoué");
      }

      // Appeler le callback de succès
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue lors de la modification du produit";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Supprime une image de la liste
   */
  const removePhoto = (index: number) => {
    setPhotos((prevPhotos) => prevPhotos.filter((_, i) => i !== index));
  };

  if (!product) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
          Modifier le produit
        </h3>

        {error && (
          <div className="mb-4">
            <Alert variant="error" title="Erreur" message={error} />
          </div>
        )}

        {showWarningAlert && (
          <div
            className={`mb-4 transition-opacity duration-300 ${
              isWarningAlertVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            <Alert variant="warning" title="Attention" message="Tous les champs sont requis" />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Grille responsive pour les champs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Libellé */}
            <div className="sm:col-span-2">
              <Label htmlFor="libelle">
                Libellé <span className="text-red-500">*</span>
              </Label>
              <Input
                id="libelle"
                type="text"
                value={libelle}
                onChange={(e) => setLibelle(e.target.value)}
                placeholder="Ex: Sac de pommes de terre"
                disabled={isLoading}
              />
            </div>

            {/* Unité de poids */}
            <div>
              <Label htmlFor="unitePoids">
                Unité de poids <span className="text-red-500">*</span>
              </Label>
              <Select
                options={unitePoidsOptions}
                placeholder="Sélectionner une unité"
                value={unitePoids}
                onChange={(value) => setUnitePoids(value)}
                disabled={isLoading}
                className="cursor-pointer"
              />
            </div>

            {/* Valeur du poids */}
            <div>
              <Label htmlFor="valeurPoids">
                Valeur du poids <span className="text-red-500">*</span>
              </Label>
              <Input
                id="valeurPoids"
                type="number"
                value={valeurPoids}
                onChange={(e) => setValeurPoids(e.target.value)}
                placeholder="Ex: 10"
                min="0"
                step={0.01}
                disabled={isLoading}
              />
            </div>

            {/* Catégorie */}
            <div className="sm:col-span-2">
              <Label htmlFor="categorie">
                Catégorie <span className="text-red-500">*</span>
              </Label>
              {isLoadingCategories ? (
                <div className="h-11 w-full rounded-lg border border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900 flex items-center justify-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Chargement des catégories...
                  </span>
                </div>
              ) : (
                <Select
                  options={categorieOptions}
                  placeholder={
                    categorieOptions.length > 0
                      ? "Sélectionner une catégorie"
                      : "Aucune catégorie disponible"
                  }
                  value={categorie}
                  onChange={(value) => setCategorie(value)}
                  disabled={isLoading || isLoadingCategories}
                  className="cursor-pointer"
                />
              )}
            </div>

            {/* Prix d'achat */}
            <div>
              <Label htmlFor="prixAchat">
                Prix d'achat (FCFA) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="prixAchat"
                type="number"
                value={prixAchat}
                onChange={(e) => setPrixAchat(e.target.value)}
                placeholder="Ex: 3000"
                min="0"
                step={0.01}
                disabled={isLoading}
              />
            </div>

            {/* Prix de vente normale */}
            <div>
              <Label htmlFor="prixVenteNormale">
                Prix de vente normale (FCFA) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="prixVenteNormale"
                type="number"
                value={prixVenteNormale}
                onChange={(e) => setPrixVenteNormale(e.target.value)}
                placeholder="Ex: 3500"
                min="0"
                step={0.01}
                disabled={isLoading}
              />
            </div>

            {/* Prix de vente réduit */}
            <div>
              <Label htmlFor="prixVenteReduit">
                Prix de vente réduit (FCFA) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="prixVenteReduit"
                type="number"
                value={prixVenteReduit}
                onChange={(e) => setPrixVenteReduit(e.target.value)}
                placeholder="Ex: 3300"
                min="0"
                step={0.01}
                disabled={isLoading}
              />
            </div>

            {/* Status */}
            <div>
              <Label htmlFor="status">
                Status <span className="text-red-500">*</span>
              </Label>
              <Select
                options={statusOptions}
                placeholder="Sélectionner un status"
                value={status}
                onChange={(value) => setStatus(value)}
                disabled={isLoading}
                className="cursor-pointer"
              />
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <Label htmlFor="description">
                Description <span className="text-red-500">*</span>
              </Label>
              <TextArea
                value={description}
                onChange={(value) => setDescription(value)}
                placeholder="Description du produit"
                rows={4}
                disabled={isLoading}
              />
            </div>

            {/* Photos (optionnelles pour la modification) */}
            <div className="sm:col-span-2">
              <Label htmlFor="photos">Photos (optionnel)</Label>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? "border-[#04b05d] bg-[#04b05d]/10"
                    : "border-gray-300 dark:border-white/10 hover:border-[#04b05d]/50"
                }`}
              >
                <input {...getInputProps()} id="photos" disabled={isLoading} />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isDragActive
                    ? "Déposez les images ici..."
                    : "Glissez-déposez des images ici, ou cliquez pour sélectionner"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  PNG, JPEG, JPG, WEBP (max 10 Mo)
                </p>
              </div>

              {/* Aperçu des images sélectionnées */}
              {photos.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-gray-200 dark:border-white/10"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        disabled={isLoading}
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
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-white/10">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="bg-[#04b05d] hover:bg-[#039a52] text-white"
              disabled={isLoading}
            >
              {isLoading ? "Modification..." : "Modifier le produit"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

