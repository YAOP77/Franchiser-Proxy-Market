/**
 * Page Home - Dashboard principal de Proxy Market
 * 
 * Cette page affiche le tableau de bord principal avec :
 * - Métriques clés du marketplace
 * - Graphiques de statistiques
 * - Liste des commandes récentes
 * - Carte démographique
 * 
 * Les composants sont organisés en grille responsive avec Tailwind CSS.
 */

// TODO: Renommer ces composants lors de l'adaptation complète au domaine Proxy Market
import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";
import MonthlySalesChart from "../../components/ecommerce/MonthlySalesChart";
import StatisticsChart from "../../components/ecommerce/StatisticsChart";
import MonthlyTarget from "../../components/ecommerce/MonthlyTarget";
// RecentOrders and DemographicCard imports removed - components are commented out
// import RecentOrders from "../../components/ecommerce/RecentOrders";
// import DemographicCard from "../../components/ecommerce/DemographicCard";
import WelcomeCard from "../../components/dashboard/WelcomeCard";
import PageMeta from "../../components/common/PageMeta";
import { PAGE_META } from "../../config/constants";

export default function Home() {
  return (
    <>
      <PageMeta
        title={PAGE_META.HOME.title}
        description={PAGE_META.HOME.description}
      />
      
      {/* Grille principale avec 12 colonnes responsive */}
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        {/* Card de bienvenue - permet le débordement de l'image */}
        <div className="col-span-12 overflow-visible">
          <WelcomeCard />
        </div>

        {/* 3 Cartes métriques en pleine largeur */}
        <div className="col-span-12">
          <EcommerceMetrics />
        </div>

        {/* Colonne gauche : Graphique des ventes mensuelles */}
        <div className="col-span-12 space-y-6 xl:col-span-7">
          <MonthlySalesChart />
        </div>

        {/* Colonne droite : Objectifs mensuels */}
        <div className="col-span-12 xl:col-span-5">
          <MonthlyTarget />
        </div>

        {/* Graphique de statistiques (pleine largeur) */}
        <div className="col-span-12">
          <StatisticsChart />
        </div>

        {/* TODO: Réactiver quand nécessaire */}
        {/* Colonne gauche : Carte démographique */}
        {/* <div className="col-span-12 xl:col-span-5">
          <DemographicCard />
        </div> */}

        {/* TODO: Réactiver quand nécessaire */}
        {/* Colonne droite : Commandes récentes */}
        {/* <div className="col-span-12 xl:col-span-7">
          <RecentOrders />
        </div> */}
      </div>
    </>
  );
}
