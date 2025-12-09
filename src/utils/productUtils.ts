/**
 * Utilitaires pour la gestion des produits vivriers
 * 
 * Ce fichier contient les fonctions utilitaires réutilisables
 * pour la manipulation et l'affichage des produits.
 */

import { Product } from "../services/api/productService";

/**
 * Vérifie si une URL d'image est valide (n'est pas default.webp)
 * @param imageUrl - URL de l'image à vérifier
 * @returns true si l'URL est valide, false sinon
 */
const isValidImageUrl = (imageUrl: string | undefined): boolean => {
  if (!imageUrl || typeof imageUrl !== "string") {
    return false;
  }
  // Ne pas utiliser default.webp car c'est l'image par défaut du backend
  // qui indique que l'image n'a pas été correctement uploadée
  if (imageUrl.includes("default.webp") || imageUrl.includes("default.jpg")) {
    return false;
  }
  return true;
};

/**
 * Formate un prix en FCFA
 * @param price - Prix à formater (nombre ou string)
 * @returns Prix formaté en FCFA
 */
export const formatPrice = (price: number | string): string => {
  const numPrice = typeof price === "string" ? parseFloat(price) : price;
  if (isNaN(numPrice)) {
    return "0 FCFA";
  }
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numPrice).replace("XOF", "FCFA");
};

/**
 * Formate un poids avec son unité
 * @param value - Valeur du poids (nombre ou string)
 * @param unit - Unité du poids (ex: "kg", "g")
 * @returns Poids formaté
 */
export const formatWeight = (value: number | string, unit: string): string => {
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(numValue)) {
    return `0 ${unit}`;
  }
  return `${numValue} ${unit}`;
};

/**
 * Formate une date en français
 * @param dateValue - Date à formater (string)
 * @returns Date formatée en français
 */
export const formatDate = (dateValue?: string): string => {
  if (!dateValue) {
    return "—";
  }

  // L'API retourne déjà la date formatée en français (ex: "11 novembre 2025")
  // Si la date est déjà au format français, la retourner telle quelle
  const frenchDatePattern = /\d{1,2}\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+\d{4}/i;
  if (frenchDatePattern.test(dateValue)) {
    return dateValue;
  }

  // Sinon, essayer de parser et formater la date
  try {
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) {
      return dateValue; // Retourner la valeur originale si le parsing échoue
    }
    return parsed.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateValue; // Retourner la valeur originale en cas d'erreur
  }
};

/**
 * Récupère le nom de la catégorie d'un produit
 * @param product - Produit dont on veut récupérer la catégorie
 * @returns Nom de la catégorie ou "Non catégorisé"
 */
export const getCategoryName = (product: Product): string => {
  // L'API retourne categorie_name avec le nom de la catégorie
  if (product.categorie_name && typeof product.categorie_name === "string") {
    return product.categorie_name;
  }

  // Fallback : vérifier categorie
  if (product.categorie) {
    if (
      typeof product.categorie === "string" &&
      !product.categorie.match(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      )
    ) {
      // Si ce n'est pas un UUID, c'est probablement le nom
      return product.categorie;
    }
    if (
      typeof product.categorie === "object" &&
      product.categorie.libelle
    ) {
      return product.categorie.libelle;
    }
  }
  return "Non catégorisé";
};

/**
 * Récupère l'URL de l'image principale d'un produit
 * @param product - Produit dont on veut récupérer l'image
 * @returns URL de l'image principale ou image par défaut
 */
export const getProductImage = (product: Product): string => {
  // L'API retourne all_photos avec les URLs complètes
  if (
    product.all_photos &&
    Array.isArray(product.all_photos) &&
    product.all_photos.length > 0
  ) {
    // Trouver la photo principale (is_primary === 1)
    const primaryPhoto = product.all_photos.find(
      (photo) => photo.is_primary === 1 || photo.is_primary === "1"
    ) || product.all_photos[0];

    // Vérifier si l'URL de la photo est valide
    if (primaryPhoto.photo && isValidImageUrl(primaryPhoto.photo)) {
      return primaryPhoto.photo;
    }
    if (primaryPhoto.url && isValidImageUrl(primaryPhoto.url)) {
      return primaryPhoto.url;
    }

    // Si la photo principale pointe vers default.webp, essayer les autres photos
    for (const photo of product.all_photos) {
      if (photo.photo && isValidImageUrl(photo.photo)) {
        return photo.photo;
      }
      if (photo.url && isValidImageUrl(photo.url)) {
        return photo.url;
      }
    }
  }

  // Fallback : vérifier photo_prymary (ancienne structure)
  // Utilisé dans la liste des produits
  if (product.photo_prymary && typeof product.photo_prymary === "string") {
    if (isValidImageUrl(product.photo_prymary)) {
      return product.photo_prymary;
    }
  }

  // Fallback : vérifier si le produit a un tableau de photos (ancienne structure)
  if (product.photos && Array.isArray(product.photos) && product.photos.length > 0) {
    const primaryPhoto = product.photos.find(
      (photo) => photo.is_primary === 1 || photo.is_primary === "1"
    ) || product.photos[0];

    if (primaryPhoto.url && isValidImageUrl(primaryPhoto.url)) {
      return primaryPhoto.url;
    }
    if (primaryPhoto.photo && isValidImageUrl(primaryPhoto.photo)) {
      return primaryPhoto.photo;
    }

    // Essayer les autres photos
    for (const photo of product.photos) {
      if (photo.url && isValidImageUrl(photo.url)) {
        return photo.url;
      }
      if (photo.photo && isValidImageUrl(photo.photo)) {
        return photo.photo;
      }
    }
  }

  // Image par défaut si aucune image valide n'est trouvée
  return "/images/product/product-01.jpg";
};

/**
 * Récupère toutes les images d'un produit
 * @param product - Produit dont on veut récupérer les images
 * @returns Tableau d'URLs d'images
 */
export const getProductImages = (product: Product): string[] => {
  const images: string[] = [];

  // L'API retourne all_photos avec les URLs complètes
  if (
    product.all_photos &&
    Array.isArray(product.all_photos) &&
    product.all_photos.length > 0
  ) {
    // Filtrer les images valides (exclure default.webp)
    product.all_photos.forEach((photo) => {
      if (photo.photo && isValidImageUrl(photo.photo)) {
        images.push(photo.photo);
      } else if (photo.url && isValidImageUrl(photo.url)) {
        images.push(photo.url);
      }
    });
  }

  // Si aucune image valide n'a été trouvée, vérifier photo_prymary
  if (images.length === 0 && product.photo_prymary && typeof product.photo_prymary === "string") {
    if (isValidImageUrl(product.photo_prymary)) {
      images.push(product.photo_prymary);
    }
  }

  // Si aucune image valide n'a été trouvée, vérifier photos (ancienne structure)
  if (images.length === 0 && product.photos && Array.isArray(product.photos) && product.photos.length > 0) {
    product.photos.forEach((photo) => {
      if (photo.url && isValidImageUrl(photo.url)) {
        images.push(photo.url);
      } else if (photo.photo && isValidImageUrl(photo.photo)) {
        images.push(photo.photo);
      }
    });
  }

  // Si aucune image valide n'a été trouvée, retourner l'image par défaut
  if (images.length === 0) {
    return ["/images/product/product-01.jpg"];
  }

  return images;
};

/**
 * Récupère l'image principale d'un produit
 * @param product - Produit dont on veut récupérer l'image principale
 * @returns URL de l'image principale ou image par défaut
 */
export const getPrimaryImage = (product: Product): string => {
  // Utiliser la même logique que getProductImage
  return getProductImage(product);
};

/**
 * Récupère le libellé du statut d'un produit
 * @param product - Produit dont on veut récupérer le statut
 * @returns Libellé du statut ("Actif" ou "Inactif")
 */
export const getStatusLabel = (product: Product): string => {
  // L'API retourne le status comme nombre (0 = Inactif, 1 = Actif)
  if (typeof product.status === "number") {
    return product.status === 1 ? "Actif" : "Inactif";
  }

  // Fallback : vérifier si c'est une string
  if (product.status && typeof product.status === "string") {
    return product.status;
  }

  // Fallback : vérifier status_text
  if (product.status_text) {
    return product.status_text;
  }

  return "Inactif";
};

/**
 * Récupère la couleur du badge de statut d'un produit
 * @param status - Statut du produit (nombre ou string)
 * @returns Couleur du badge ("success" pour Actif/vert, "error" pour Inactif/rouge)
 */
export const getStatusColor = (
  status: number | string | null | undefined
): "success" | "error" => {
  if (status === null || status === undefined) {
    return "error"; // Inactif = rouge
  }
  if (typeof status === "number") {
    // 1 = Actif (vert), 0 = Inactif (rouge)
    return status === 1 ? "success" : "error";
  }
  const normalized = status.toString().toLowerCase().trim();
  
  // Vérifier d'abord "inactif" pour éviter que "inactif".includes("actif") retourne true
  if (
    normalized === "0" ||
    normalized === "inactif" ||
    normalized === "inactive"
  ) {
    return "error"; // Inactif = rouge
  }
  
  // Ensuite vérifier "actif"
  if (
    normalized === "1" ||
    normalized === "actif" ||
    normalized === "active"
  ) {
    return "success"; // Actif = vert
  }
  
  // Par défaut, retourner "error" (rouge) pour inactif
  return "error"; // Inactif = rouge
};

