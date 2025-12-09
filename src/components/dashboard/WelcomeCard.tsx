/**
 * Composant WelcomeCard - Card de bienvenue pour le dashboard de la boutique
 * 
 * Affiche une card de bienvenue avec :
 * - Une image à gauche qui déborde légèrement (The Munchies - Dish.png)
 * - Un message de bienvenue personnalisé avec le nom du gérant
 * - Une description adaptée à la gestion d'une boutique (produits, stock, commandes)
 */

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import adminService, { Admin } from "../../services/api/adminService";

export default function WelcomeCard() {
  const { user } = useAuth();
  const [adminDetails, setAdminDetails] = useState<Admin | null>(null);

  // Récupérer les détails de l'admin pour obtenir le nom complet
  useEffect(() => {
    const fetchAdminDetails = async () => {
      if (!user?.email) {
        return;
      }

      try {
        const adminsResponse = await adminService.getAdmins();
        const matchedAdmin = adminsResponse.data.find(
          (admin: Admin) => admin.email?.toLowerCase() === user.email.toLowerCase()
        );
        setAdminDetails(matchedAdmin ?? null);
      } catch (error) {
        // En cas d'erreur, on utilise le nom du contexte
        setAdminDetails(null);
      }
    };

    fetchAdminDetails();
  }, [user?.email]);

  // Construire le nom complet de l'utilisateur
  const userName = useMemo(() => {
    // Priorité 1: Nom complet depuis les détails de l'admin (prenoms + nom)
    if (adminDetails) {
      const prenoms = adminDetails.prenoms?.trim() ?? "";
      const nom = adminDetails.nom?.trim() ?? "";
      const fullName = `${prenoms} ${nom}`.trim();
      if (fullName.length > 0) {
        return fullName;
      }
    }

    // Priorité 2: Nom depuis le contexte d'authentification
    if (user?.name?.trim()) {
      return user.name.trim();
    }

    // Priorité 3: Partie avant @ de l'email
    if (user?.email) {
      return user.email.split("@")[0];
    }

    return "";
  }, [adminDetails, user]);

  return (
    <div className="relative mb-6">
      {/* Image sur mobile - déborde sur la gauche et vers le bas */}
      <div className="sm:hidden absolute left-0 bottom-0 translate-y-8 -translate-x-3 w-64 h-auto z-10">
        <img
          src="/images/task/The Munchies - Dish.png"
          alt="Bienvenue dans votre boutique"
          className="w-full h-auto object-contain"
        />
      </div>

      {/* Image à gauche - déborde sur la gauche et vers le bas (desktop) */}
      <div className="hidden sm:block absolute left-0 bottom-0 translate-y-4 md:translate-y-6 lg:translate-y-8 -translate-x-3 md:-translate-x-5 lg:-translate-x-6 w-48 sm:w-56 md:w-64 lg:w-72 xl:w-80 h-auto z-10">
        <img
          src="/images/task/The Munchies - Dish.png"
          alt="Bienvenue dans votre boutique"
          className="w-full h-auto object-contain"
        />
      </div>

      {/* Card avec le contenu texte */}
      <div className="rounded-2xl border border-neutral-950 overflow-hidden relative">
        {/* Image de fond */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/images/task/denrées-agricoles-alimentaires-960x540.jpg')"
          }}
        >
          {/* Overlay pour améliorer la lisibilité du texte */}
          <div className="absolute inset-0 bg-black/40 dark:bg-black/60"></div>
        </div>
        
        <div className="relative flex flex-col md:flex-row items-center min-h-[160px] sm:min-h-[140px] md:min-h-[160px] lg:min-h-[180px] xl:min-h-[200px] pl-64 sm:pl-56 md:pl-64 lg:pl-72 xl:pl-80 pr-4 sm:pr-6 md:pr-8 lg:pr-10 pt-4 pb-16 sm:py-4 md:py-5 lg:py-6 z-10">
          {/* Contenu texte */}
          <div className="flex-1 flex flex-col justify-center w-full text-center sm:text-left">
            <h2 className="text-4xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-5xl font-bold text-white dark:text-white/90 mb-1 sm:mb-1.5 leading-tight">
              {userName ? (
                <>
                  Bienvenue{" "}
                  <span className="text-green-400">{userName}</span>
                </>
              ) : (
                "Bienvenue"
              )}
            </h2>
            <p className="text-sm sm:text-base md:text-sm lg:text-sm text-white dark:text-yellow-200">
              Gerez votre boutique en toute simplicite : ajoutez des produits a votre store,
              suivez vos commandes, controleez votre stock et optimisez vos ventes pour faire croitre votre activite.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

