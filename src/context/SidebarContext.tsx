/**
 * Context SidebarContext - Gestion de l'état de la sidebar
 * 
 * Ce contexte gère l'état de la sidebar (ouverte/fermée, mobile/desktop, hover, etc.)
 * et fournit des méthodes pour interagir avec celle-ci.
 */

import { createContext, useContext, useState, useEffect } from "react";
import type { SidebarState } from "../types";

/**
 * Type pour le contexte de la sidebar
 */
type SidebarContextType = SidebarState & {
  activeItem: string | null;
  openSubmenu: string | null;
  toggleSidebar: () => void;
  toggleMobileSidebar: () => void;
  setIsHovered: (isHovered: boolean) => void;
  setActiveItem: (item: string | null) => void;
  toggleSubmenu: (item: string) => void;
};

/**
 * Création du contexte avec une valeur par défaut undefined
 * pour détecter l'utilisation en dehors du Provider
 */
const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

/**
 * Hook personnalisé pour accéder au contexte Sidebar
 * @throws {Error} Si utilisé en dehors du SidebarProvider
 * @returns {SidebarContextType} Le contexte de la sidebar
 */
export const useSidebar = (): SidebarContextType => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

/**
 * Provider du contexte Sidebar
 * Gère l'état de la sidebar et s'adapte aux changements de taille d'écran
 * 
 * @param children - Composants enfants à envelopper
 */
export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // État de la sidebar
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  /**
   * Gestion du responsive : détection mobile/desktop
   * Ferme automatiquement la sidebar mobile lors du passage en desktop
   */
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768; // Breakpoint Tailwind md
      setIsMobile(mobile);
      
      // Fermeture automatique de la sidebar mobile en desktop
      if (!mobile) {
        setIsMobileOpen(false);
      }
    };

    // Vérification initiale
    handleResize();
    
    // Écoute des changements de taille de fenêtre
    window.addEventListener("resize", handleResize);

    // Nettoyage de l'écouteur lors du démontage
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  /**
   * Bascule l'état étendu/réduit de la sidebar (desktop)
   */
  const toggleSidebar = () => {
    setIsExpanded((prev) => !prev);
  };

  /**
   * Bascule l'état ouvert/fermé de la sidebar mobile
   */
  const toggleMobileSidebar = () => {
    setIsMobileOpen((prev) => !prev);
  };

  /**
   * Bascule l'état ouvert/fermé d'un sous-menu
   * @param item - Identifiant du sous-menu à basculer
   */
  const toggleSubmenu = (item: string) => {
    setOpenSubmenu((prev) => (prev === item ? null : item));
  };

  return (
    <SidebarContext.Provider
      value={{
        // Sur mobile, la sidebar n'est jamais étendue
        isExpanded: isMobile ? false : isExpanded,
        isMobileOpen,
        isHovered,
        activeItem,
        openSubmenu,
        toggleSidebar,
        toggleMobileSidebar,
        setIsHovered,
        setActiveItem,
        toggleSubmenu,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};
