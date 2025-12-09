/**
 * Composant PublicRoute - Route accessible uniquement aux utilisateurs non authentifiés
 * 
 * Ce composant implémente la protection inverse de ProtectedRoute :
 * - Affiche la route (ex: page de connexion) si l'utilisateur n'est pas authentifié
 * - Redirige automatiquement vers le dashboard si l'utilisateur est déjà connecté
 * - Empêche l'accès aux pages d'authentification pour les utilisateurs connectés
 * 
 * USAGE:
 * Entoure les pages comme /signin, /signup, /forgot-password
 * pour éviter qu'un utilisateur connecté y accède
 * 
 * SECURITE:
 * - Empêche les utilisateurs authentifiés d'accéder aux pages d'authentification
 * - Améliore l'expérience utilisateur en évitant les actions redondantes
 */

import { ReactNode } from "react";
import { Navigate } from "react-router";
import { useAuth } from "../../context/AuthContext";

interface PublicRouteProps {
  children: ReactNode;
}

export default function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  // Afficher le contenu pendant la vérification
  // Cela permet d'éviter un flash de redirection si l'utilisateur n'est pas connecté
  if (isLoading) {
    return <>{children}</>;
  }

  // Rediriger vers le dashboard si déjà authentifié
  // replace={true} empêche l'ajout à l'historique
  // Cela évite que l'utilisateur puisse revenir sur la page de connexion avec le bouton retour
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Accès autorisé : l'utilisateur n'est pas authentifié
  return <>{children}</>;
}

