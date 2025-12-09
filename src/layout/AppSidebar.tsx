/**
 * Composant AppSidebar - Sidebar de navigation de l'application
 * 
 * Ce composant affiche la sidebar avec :
 * - Logo Proxy Market (adaptatif selon l'état)
 * - Menu de navigation principal
 * - Menu de navigation secondaire
 * - Widget de sidebar (si étendu)
 * 
 * La sidebar s'adapte automatiquement :
 * - Desktop : peut être étendue/réduite ou affichée au survol
 * - Mobile : s'affiche en overlay avec backdrop
 * 
 * Les sous-menus s'ouvrent/ferment avec animation et détectent automatiquement
 * la page active pour afficher le menu ouvert correspondant.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { ChevronDownIcon, HorizontaLDots } from "../icons";
import { useSidebar } from "../context/SidebarContext";
import { mainNavItems, secondaryNavItems } from "../config/navigation";
import { APP_CONFIG } from "../config/constants";
import type { NavItem } from "../types";
import SidebarWidget from "./SidebarWidget";

const AppSidebar: React.FC = () => {
  // Accès au contexte sidebar pour l'état de la sidebar
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();

  // État du sous-menu ouvert (type et index)
  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);

  // Hauteur des sous-menus pour l'animation
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  
  // Références aux éléments DOM des sous-menus
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  /**
   * Vérifie si une route est active
   * Utilise useCallback pour optimiser les re-renders
   */
  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  /**
   * Détection automatique du sous-menu à ouvrir selon la route active
   * S'exécute à chaque changement de location
   */
  useEffect(() => {
    let submenuMatched = false;
    const menuTypes: ("main" | "others")[] = ["main", "others"];

    menuTypes.forEach((menuType) => {
      const items = menuType === "main" ? mainNavItems : secondaryNavItems;
      
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType,
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    // Fermeture du sous-menu si aucune route ne correspond
    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [location, isActive]);

  /**
   * Calcul de la hauteur des sous-menus pour l'animation
   * S'exécute quand un sous-menu est ouvert
   */
  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  /**
   * Bascule l'ouverture/fermeture d'un sous-menu
   * @param index - Index de l'item dans le menu
   * @param menuType - Type de menu ("main" ou "others")
   */
  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      // Fermeture si le même sous-menu est déjà ouvert
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      // Ouverture du nouveau sous-menu
      return { type: menuType, index };
    });
  };

  /**
   * Rendu récursif des items de menu
   * @param items - Liste des items à afficher
   * @param menuType - Type de menu ("main" ou "others")
   */
  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {/* Item avec sous-menu */}
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}
            >
              <span
                className={`menu-item-icon-size ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>
              
              {/* Texte du menu (affiché uniquement si étendu/survolé/mobile) */}
              {(isExpanded || isHovered || isMobileOpen) && (
                <>
                <span className="menu-item-text">{nav.name}</span>
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                        ? "rotate-180 text-[#04b05d]"
                      : ""
                  }`}
                />
                </>
              )}
            </button>
          ) : (
            /* Item sans sous-menu (lien direct) */
            nav.path && (
              <Link
                to={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`menu-item-icon-size ${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}

          {/* Sous-menu (affiché uniquement si étendu/survolé/mobile) */}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      to={subItem.path}
                      className={`menu-dropdown-item ${
                        isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {subItem.name}
                      {/* Badge si présent */}
                      {subItem.badge && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge`}
                          >
                          {subItem.badge}
                          </span>
                        )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo Proxy Market */}
      <div
        className={`py-8 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link to="/" aria-label={`${APP_CONFIG.name} - Accueil`}>
          {isExpanded || isHovered || isMobileOpen ? (
            /* Logo Proxy Market (sidebar étendue) */
            <img
              src="/Logo-Proxy-Market.png"
              alt={`${APP_CONFIG.name} Logo`}
              className="h-16 sm:h-20 lg:h-14 w-auto"
            />
          ) : (
            /* Logo Proxy Market (sidebar réduite) */
            <img
              src="/Logo-Proxy.png"
              alt={`${APP_CONFIG.name} Icon`}
              className="h-8 w-8 object-contain"
            />
          )}
        </Link>
      </div>

      {/* Menu de navigation */}
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            {/* Section Menu Principal */}
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HorizontaLDots className="size-6" />
                )}
              </h2>
              {renderMenuItems(mainNavItems, "main")}
            </div>

            {/* Section Autres - Masquée car secondaryNavItems est vide */}
            {/* <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Autres"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(secondaryNavItems, "others")}
            </div> */}
          </div>
        </nav>

        {/* Widget de sidebar (affiché uniquement si étendu/survolé/mobile) */}
        {isExpanded || isHovered || isMobileOpen ? <SidebarWidget /> : null}
      </div>
    </aside>
  );
};

export default AppSidebar;
