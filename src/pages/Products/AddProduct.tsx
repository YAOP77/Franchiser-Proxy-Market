/**
 * Page AddProduct - Créer un produit vivrier
 * 
 * Cette page permet de créer un nouveau produit vivrier sur Proxy Market.
 * Formulaire avec tous les champs requis :
 * - libelle, unite_poids, valeur_poids
 * - categorie, prix_achat, prix_vente_normale, prix_vente_reduit
 * - description, status
 * - photos (upload multiple d'images)
 */

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useDropzone } from "react-dropzone";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import TextArea from "../../components/form/input/TextArea";
import Button from "../../components/ui/button/Button";
import Alert from "../../components/ui/alert/Alert";
import productService, { CreateProductData, Category } from "../../services/api/productService";

export default function AddProduct() {
  const navigate = useNavigate();
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
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
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [isSuccessAlertVisible, setIsSuccessAlertVisible] = useState(false);
  const [error, setError] = useState("");

  // État pour le chargement
  const [isLoading, setIsLoading] = useState(false);

  // État pour les catégories
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

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

  // Nettoyer le timer de redirection lors du démontage du composant
  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  // Charger la liste des catégories au montage du composant
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const categoriesList = await productService.getCategories();
        setCategories(categoriesList);
      } catch (error) {
        // En cas d'erreur, on continue sans catégories (elles peuvent être ajoutées manuellement)
        setCategories([]);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  // Gère l'affichage et la disparition de l'alerte d'avertissement avec transition
  useEffect(() => {
    if (showWarningAlert) {
      setIsWarningAlertVisible(true);
      const fadeOutTimer = setTimeout(() => {
        setIsWarningAlertVisible(false);
      }, 2500);
      const hideTimer = setTimeout(() => {
        setShowWarningAlert(false);
      }, 3000);
      return () => {
        clearTimeout(fadeOutTimer);
        clearTimeout(hideTimer);
      };
    } else {
      setIsWarningAlertVisible(false);
    }
  }, [showWarningAlert]);

  // Gère l'affichage et la disparition de l'alerte de succès avec transition
  useEffect(() => {
    if (showSuccessAlert) {
      setIsSuccessAlertVisible(true);
      const fadeOutTimer = setTimeout(() => {
        setIsSuccessAlertVisible(false);
      }, 2500);
      const hideTimer = setTimeout(() => {
        setShowSuccessAlert(false);
      }, 3000);
      return () => {
        clearTimeout(fadeOutTimer);
        clearTimeout(hideTimer);
      };
    } else {
      setIsSuccessAlertVisible(false);
    }
  }, [showSuccessAlert]);

  /**
   * Supprime une image de la liste
   */
  const removePhoto = (index: number) => {
    setPhotos((prevPhotos) => prevPhotos.filter((_, i) => i !== index));
  };

  /**
   * Définit une image comme principale (la place en première position)
   */
  const setAsPrimary = (index: number) => {
    if (index === 0) return; // Déjà en première position
    setPhotos((prevPhotos) => {
      const newPhotos = [...prevPhotos];
      const photo = newPhotos[index];
      newPhotos.splice(index, 1); // Retirer l'image de sa position actuelle
      newPhotos.unshift(photo); // La placer en première position
      return newPhotos;
    });
  };

  /**
   * Gère la soumission du formulaire
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setShowWarningAlert(false);
    setShowSuccessAlert(false);

    // Validation des champs requis
    if (
      !libelle.trim() ||
      !unitePoids.trim() ||
      !valeurPoids.trim() ||
      !categorie.trim() ||
      !prixAchat.trim() ||
      !prixVenteNormale.trim() ||
      !prixVenteReduit.trim() ||
      !description.trim() ||
      !status.trim() ||
      photos.length === 0
    ) {
      setShowWarningAlert(true);
      return;
    }

    // Validation des images
    if (photos.length === 0) {
      setShowWarningAlert(true);
      return;
    }

    // Valider chaque image
    const validImageTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    const maxFileSize = 10 * 1024 * 1024; // 10 Mo
    
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      
      // Vérifier que c'est un File valide
      if (!(photo instanceof File)) {
        setError(`L'image ${i + 1} n'est pas un fichier valide`);
        return;
      }
      
      // Vérifier le type MIME
      if (!validImageTypes.includes(photo.type)) {
        setError(`L'image ${i + 1} doit être au format PNG, JPEG, JPG ou WEBP. Type reçu: ${photo.type || "inconnu"}`);
        return;
      }
      
      // Vérifier la taille du fichier
      if (photo.size > maxFileSize) {
        const sizeInMB = (photo.size / (1024 * 1024)).toFixed(2);
        setError(`L'image ${i + 1} est trop volumineuse (${sizeInMB} Mo). Maximum autorisé: 10 Mo`);
        return;
      }
      
      // Vérifier que le fichier n'est pas vide
      if (photo.size === 0) {
        setError(`L'image ${i + 1} est vide`);
        return;
      }
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

    setIsLoading(true);

    try {
      // Convertir le status de "actif"/"inactif" vers "1"/"0" comme l'API l'attend
      const statusValue = status.trim().toLowerCase();
      const apiStatus = statusValue === "actif" ? "1" : statusValue === "inactif" ? "0" : statusValue;

      // Valider que les photos sont bien présentes avant l'envoi
      if (!photos || photos.length === 0) {
        setError("Aucune image n'a été sélectionnée");
        setIsLoading(false);
        return;
      }

      // Vérifier que chaque photo est bien un File valide
      const validPhotos = photos.filter((photo) => photo instanceof File);
      if (validPhotos.length !== photos.length) {
        setError("Une ou plusieurs images ne sont pas valides");
        setIsLoading(false);
        return;
      }

      if (validPhotos.length === 0) {
        setError("Aucune image valide n'a été sélectionnée");
        setIsLoading(false);
        return;
      }

      // Préparer les données exactement comme l'API les attend
      const productData: CreateProductData = {
        libelle: libelle.trim(),
        unite_poids: unitePoids.trim(),
        valeur_poids: valeurPoidsNum,
        categorie: categorie.trim(),
        prix_achat: prixAchatNum,
        prix_vente_normale: prixVenteNormaleNum,
        prix_vente_reduit: prixVenteReduitNum,
        description: description.trim(),
        status: apiStatus,
        photos: validPhotos,
      };

      const result = await productService.createProduct(productData);

      // Vérifier que la création a vraiment réussi
      if (!result.success) {
        throw new Error(result.error || "La création du produit a échoué");
      }


      // Réinitialiser le formulaire après succès confirmé
      resetForm();
      setShowSuccessAlert(true);

      // Rediriger vers la liste des produits après un court délai
      // pour permettre à l'utilisateur de voir le message de succès
      redirectTimerRef.current = setTimeout(() => {
        navigate("/products-table", { replace: true });
      }, 2000);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue lors de la création du produit";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Réinitialise tous les champs du formulaire
   */
  const resetForm = () => {
    setLibelle("");
    setUnitePoids("");
    setValeurPoids("");
    setCategorie("");
    setPrixAchat("");
    setPrixVenteNormale("");
    setPrixVenteReduit("");
    setDescription("");
    setStatus("");
    setPhotos([]);
    setError("");
    setShowWarningAlert(false);
    setShowSuccessAlert(false);
  };

  /**
   * Réinitialise tous les champs du formulaire (action utilisateur)
   */
  const handleCancel = () => {
    resetForm();
  };

  // Options pour l'unité de poids
  const unitePoidsOptions = [
    { value: "kg", label: "Kilogramme (kg)" },
    { value: "g", label: "Gramme (g)" },
    { value: "tonne", label: "Tonne" },
  ];

  // Options pour la catégorie (transformées depuis la liste de l'API)
  const categorieOptions = categories.map((category) => ({
    value: category.id.toString(),
    label: category.libelle,
  }));

  // Options pour le statut
  const statusOptions = [
    { value: "actif", label: "Actif" },
    { value: "inactif", label: "Inactif" },
  ];

  return (
    <>
      <PageMeta
        title="Créer un produit vivrier | Proxy Market"
        description="Formulaire de création d'un nouveau produit vivrier sur Proxy Market"
      />

      <PageBreadcrumb pageTitle="Créer un produit vivrier" titleClassName="text-[#04b05d] dark:text-[#04b05d]" />

      <div className="grid grid-cols-1 gap-6 max-w-4xl">
        <ComponentCard title="Créer un nouveau produit vivrier">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Grille responsive : 1 colonne sur mobile, 2 colonnes sur desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 md:col-span-2">
                  <div className="font-medium mb-1">Erreur de validation</div>
                  <div className="whitespace-pre-line">{error}</div>
                </div>
              )}

              {/* Libellé */}
              <div className="md:col-span-2">
                <Label htmlFor="libelle">
                  Libellé <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="text"
                  id="libelle"
                  placeholder="Ex: Pommes de terre"
                  value={libelle}
                  onChange={(e) => setLibelle(e.target.value)}
                />
              </div>

              {/* Unité de poids */}
              <div>
                <Label>
                  Unité de poids <span className="text-error-500">*</span>
                </Label>
                <Select
                  options={unitePoidsOptions}
                  placeholder="Sélectionnez une unité"
                  value={unitePoids}
                  onChange={(value) => setUnitePoids(value)}
                  className="dark:bg-dark-900"
                />
              </div>

              {/* Valeur du poids */}
              <div>
                <Label htmlFor="valeur_poids">
                  Valeur du poids <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="number"
                  id="valeur_poids"
                  placeholder="Ex: 10"
                  value={valeurPoids}
                  onChange={(e) => setValeurPoids(e.target.value)}
                  min="0"
                  step={0.01}
                />
              </div>

              {/* Catégorie */}
              <div>
                <Label>
                  Catégorie <span className="text-error-500">*</span>
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
                        ? "Sélectionnez une catégorie"
                        : "Aucune catégorie disponible"
                    }
                    value={categorie}
                    onChange={(value) => setCategorie(value)}
                    className="dark:bg-dark-900"
                  />
                )}
              </div>

              {/* Statut */}
              <div>
                <Label>
                  Statut <span className="text-error-500">*</span>
                </Label>
                <Select
                  options={statusOptions}
                  placeholder="Sélectionnez un statut"
                  value={status}
                  onChange={(value) => setStatus(value)}
                  className="dark:bg-dark-900"
                />
              </div>

              {/* Prix d'achat */}
              <div>
                <Label htmlFor="prix_achat">
                  Prix d'achat (FCFA) <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="number"
                  id="prix_achat"
                  placeholder="Ex: 1000"
                  value={prixAchat}
                  onChange={(e) => setPrixAchat(e.target.value)}
                  min="0"
                  step={0.01}
                />
              </div>

              {/* Prix de vente normale */}
              <div>
                <Label htmlFor="prix_vente_normale">
                  Prix de vente normale (FCFA) <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="number"
                  id="prix_vente_normale"
                  placeholder="Ex: 1500"
                  value={prixVenteNormale}
                  onChange={(e) => setPrixVenteNormale(e.target.value)}
                  min="0"
                  step={0.01}
                />
              </div>

              {/* Prix de vente réduit */}
              <div>
                <Label htmlFor="prix_vente_reduit">
                  Prix de vente réduit (FCFA) <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="number"
                  id="prix_vente_reduit"
                  placeholder="Ex: 1200"
                  value={prixVenteReduit}
                  onChange={(e) => setPrixVenteReduit(e.target.value)}
                  min="0"
                  step={0.01}
                />
              </div>

              {/* Description - pleine largeur */}
              <div className="md:col-span-2">
                <Label htmlFor="description">
                  Description <span className="text-error-500">*</span>
                </Label>
                <TextArea
                  placeholder="Entrez la description du produit"
                  value={description}
                  onChange={(value) => setDescription(value)}
                  rows={4}
                />
              </div>

              {/* Upload d'images - pleine largeur */}
              <div className="md:col-span-2">
                <Label>
                  Photos <span className="text-error-500">*</span>
                </Label>
                <div
                  {...getRootProps()}
                  className={`transition border border-dashed rounded-xl p-7 lg:p-10 cursor-pointer ${
                    isDragActive
                      ? "border-[#04b05d] bg-gray-100 dark:bg-gray-800"
                      : "border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900 hover:border-[#04b05d]"
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center">
                    <div className="mb-[22px] flex justify-center">
                      <div className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                        <svg
                          className="fill-current"
                          width="29"
                          height="28"
                          viewBox="0 0 29 28"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M14.5019 3.91699C14.2852 3.91699 14.0899 4.00891 13.953 4.15589L8.57363 9.53186C8.28065 9.82466 8.2805 10.2995 8.5733 10.5925C8.8661 10.8855 9.34097 10.8857 9.63396 10.5929L13.7519 6.47752V18.667C13.7519 19.0812 14.0877 19.417 14.5019 19.417C14.9161 19.417 15.2519 19.0812 15.2519 18.667V6.48234L19.3653 10.5929C19.6583 10.8857 20.1332 10.8855 20.426 10.5925C20.7188 10.2995 20.7186 9.82463 20.4256 9.53184L15.0838 4.19378C14.9463 4.02488 14.7367 3.91699 14.5019 3.91699ZM5.91626 18.667C5.91626 18.2528 5.58047 17.917 5.16626 17.917C4.75205 17.917 4.41626 18.2528 4.41626 18.667V21.8337C4.41626 23.0763 5.42362 24.0837 6.66626 24.0837H22.3339C23.5766 24.0837 24.5839 23.0763 24.5839 21.8337V18.667C24.5839 18.2528 24.2482 17.917 23.8339 17.917C23.4197 17.917 23.0839 18.2528 23.0839 18.667V21.8337C23.0839 22.2479 22.7482 22.5837 22.3339 22.5837H6.66626C6.25205 22.5837 5.91626 22.2479 5.91626 21.8337V18.667Z"
                          />
                        </svg>
                      </div>
                    </div>
                    <h4 className="mb-3 font-semibold text-gray-800 text-theme-xl dark:text-white/90">
                      {isDragActive ? "Déposez les fichiers ici" : "Glissez-déposez vos images ici"}
                    </h4>
                    <span className="text-center mb-5 block w-full max-w-[290px] text-sm text-gray-700 dark:text-gray-400">
                      Glissez-déposez vos images PNG, JPG, WebP ici ou cliquez pour parcourir
                    </span>
                    <span className="font-medium underline text-theme-sm text-[#04b05d]">
                      Parcourir les fichiers
                    </span>
                  </div>
                </div>

                {/* Aperçu des images uploadées */}
                {photos.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {photos.length} image(s) sélectionnée(s) - La première image sera affichée en priorité
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {photos.map((photo, index) => (
                        <div key={index} className="relative group">
                          {/* Badge "Image principale" pour la première image */}
                          {index === 0 && (
                            <div className="absolute top-1 left-1 bg-[#04b05d] text-white text-xs font-semibold px-2 py-1 rounded z-10">
                              Principale
                            </div>
                          )}
                          
                          <img
                            src={URL.createObjectURL(photo)}
                            alt={`Aperçu ${index + 1}`}
                            className={`w-full h-24 object-cover rounded-lg border-2 ${
                              index === 0
                                ? "border-[#04b05d] dark:border-[#04b05d]"
                                : "border-gray-300 dark:border-gray-700"
                            }`}
                          />
                          
                          {/* Contrôles d'action au survol */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                            {/* Bouton Définir comme principale */}
                            {index !== 0 && (
                              <button
                                type="button"
                                onClick={() => setAsPrimary(index)}
                                className="bg-[#04b05d] hover:bg-[#039a52] text-white p-1.5 rounded transition-colors"
                                title="Définir comme image principale"
                                aria-label="Définir comme image principale"
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
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              </button>
                            )}
                            
                            {/* Bouton Supprimer */}
                            <button
                              type="button"
                              onClick={() => removePhoto(index)}
                              className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded transition-colors"
                              title="Supprimer l'image"
                              aria-label="Supprimer l'image"
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
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                variant="none"
                className="w-full sm:w-auto bg-[#04b05d] hover:bg-[#039a52] text-white shadow-theme-xs disabled:bg-[#04b05d]/70 focus:ring-3 focus:ring-[#04b05d]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? "Création en cours..." : "Créer le produit"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={handleCancel}
                disabled={isLoading}
              >
                Annuler
              </Button>
            </div>
          </form>

          {/* Alerte d'avertissement pour les champs requis */}
          {showWarningAlert && (
            <div
              className={`mt-6 transition-all duration-500 ease-in-out ${
                isWarningAlertVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 -translate-y-2 pointer-events-none"
              }`}
            >
              <Alert
                variant="warning"
                title="Champs requis"
                message="Tous les champs sont requis"
                showLink={false}
              />
            </div>
          )}

          {/* Alerte de succès */}
          {showSuccessAlert && (
            <div
              className={`mt-6 transition-all duration-500 ease-in-out ${
                isSuccessAlertVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 -translate-y-2 pointer-events-none"
              }`}
            >
              <Alert
                variant="success"
                title="Produit créé avec succès"
                message="Le produit vivrier a été créé avec succès."
                showLink={false}
              />
            </div>
          )}
        </ComponentCard>
      </div>
    </>
  );
}

