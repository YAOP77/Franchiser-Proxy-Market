/**
 * Composant AppLayout - Layout principal de l'application
 * 
 * Ce composant définit la structure générale de l'application :
 * - Sidebar de navigation (AppSidebar)
 * - En-tête (AppHeader)
 * - Zone de contenu principal (Outlet pour les routes)
 * - Backdrop pour fermer la sidebar mobile
 * 
 * Le layout s'adapte automatiquement aux changements d'état de la sidebar
 * (mobile/desktop, ouvert/fermé, étendu/réduit).
 */

import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { Outlet } from "react-router";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";
// SIDEBAR_CONFIG removed - not currently used

/**
 * Contenu du layout avec la logique de positionnement dynamique
 * Utilise le contexte Sidebar pour adapter l'espacement selon l'état de la sidebar
 */
const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  return (
    <div className="min-h-screen xl:flex">
      {/* Zone sidebar et backdrop */}
      <div>
        <AppSidebar />
        <Backdrop />
      </div>

      {/* Zone principale : header + contenu */}
      {/* La marge s'adapte automatiquement selon l'état de la sidebar */}
      {/* Desktop étendu/survolé: 290px, Desktop réduit: 90px, Mobile: 0px */}
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${
          isMobileOpen ? "ml-0" : ""
        } ${
          isExpanded || isHovered
            ? "lg:ml-[290px]"
            : "lg:ml-[90px]"
        }`}
      >
        <AppHeader />
        
        {/* Zone de contenu principal avec padding responsive */}
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6 min-h-[calc(100vh-64px)]">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

/**
 * Composant AppLayout principal
 * Enveloppe le LayoutContent dans le SidebarProvider pour partager l'état
 */
const AppLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default AppLayout;
