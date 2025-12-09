/**
 * Configuration de la navigation - Menu de la sidebar
 * 
 * Ce fichier contient la configuration complète du menu de navigation
 * pour Proxy Market Dashboard. Facilite la maintenance et les modifications futures.
 */

import {
  BoxIcon,
  GridIcon,
  TableIcon,
  UserCircleIcon,
} from "../icons";
import type { NavItem } from "../types";

/**
 * Items de navigation principaux
 * TODO: Adapter ces items selon les besoins spécifiques de Proxy Market
 */
export const mainNavItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/",
  },
  {
    name: "Gestion des produits",
    icon: <TableIcon />,
    subItems: [
      { name: "Voir tous les produits vivriers", path: "/produits" },
    ],
  },
  {
    name: "Administration Boutique",
    icon: <UserCircleIcon />,
    subItems: [
      { name: "Créer mon livreur", path: "/creer-livreur" },
    ],
  },
  {
    name: "Gestion de ma boutique",
    icon: <BoxIcon />,
    subItems: [
      { name: "Voir mon store", path: "/mon-store" },
      { name: "Voir toutes les commandes", path: "/commandes" },
      { name: "Voir la liste des livreur", path: "/livreurs" },
    ],
  },
  // Masqué - Gardé pour référence (page 404 utilisée)
  // {
  //   name: "Pages",
  //   icon: <PageIcon />,
  //   subItems: [
  //     { name: "Page vierge", path: "/blank" },
  //     { name: "404 Erreur", path: "/error-404" },
  //   ],
  // },
];

/**
 * Items de navigation secondaires
 * TODO: Adapter ces items selon les besoins spécifiques de Proxy Market
 */
export const secondaryNavItems: NavItem[] = [
  // Masqué - Non utilisé dans la production
  // {
  //   icon: <PieChartIcon />,
  //   name: "Graphiques",
  //   subItems: [
  //     { name: "Graphique linéaire", path: "/line-chart" },
  //     { name: "Graphique en barres", path: "/bar-chart" },
  //   ],
  // },
  // {
  //   icon: <BoxCubeIcon />,
  //   name: "Éléments UI",
  //   subItems: [
  //     { name: "Alertes", path: "/alerts" },
  //     { name: "Avatar", path: "/avatars" },
  //     { name: "Badge", path: "/badge" },
  //     { name: "Boutons", path: "/buttons" },
  //     { name: "Images", path: "/images" },
  //     { name: "Vidéos", path: "/videos" },
  //   ],
  // },
  // {
  //   icon: <PlugInIcon />,
  //   name: "Authentification",
  //   subItems: [
  //     { name: "Connexion", path: "/signin" },
  //     { name: "Inscription", path: "/signup" },
  //   ],
  // },
];
