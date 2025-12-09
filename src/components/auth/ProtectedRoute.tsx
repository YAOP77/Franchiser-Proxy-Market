/**
 * Composant ProtectedRoute - Protection des routes nécessitant une authentification
 * 
 * Ce composant implémente une protection robuste des routes en :
 * - Vérifiant l'authentification de l'utilisateur via le contexte AuthContext
 * - Affichant un loader pendant la vérification initiale (prévient le flash de contenu)
 * - Redirigeant vers /signin si l'utilisateur n'est pas authentifié
 * - Sauvegardant la route d'origine pour redirection après connexion
 * - Permettant l'accès uniquement aux utilisateurs authentifiés avec un token valide
 * 
 * SECURITE:
 * - La vérification du token est effectuée dans AuthContext
 * - Le token expiré est automatiquement détecté et supprimé
 * - Aucune donnée sensible n'est exposée dans l'URL ou les états
 */

import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "../../context/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Afficher un loader pendant la vérification de l'authentification
  // Cela évite le flash de contenu et améliore l'expérience utilisateur
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-[#04b05d] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Verification de l'authentification...
          </p>
        </div>
      </div>
    );
  }

  // Rediriger vers /signin si non authentifié
  // La location actuelle est sauvegardée dans state pour rediriger après connexion
  // replace={true} empêche l'ajout à l'historique pour éviter les boucles de redirection
  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // Accès autorisé : l'utilisateur est authentifié avec un token valide
  return <>{children}</>;
}

