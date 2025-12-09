/**
 * Page SalesTable - Liste des ventes
 * 
 * Cette page affichera la liste des ventes effectuées.
 * À implémenter selon les besoins de l'API.
 */

import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";

export default function SalesTable() {
  return (
    <>
      <PageMeta
        title="Liste des ventes | Proxy Market"
        description="Consultez la liste des ventes effectuées"
      />
      <PageBreadcrumb
        pageTitle="Liste des ventes"
        items={[{ label: "Home", href: "/" }, { label: "Gestion des produits", href: "/sales-table" }]}
        titleClassName="text-[#04b05d] dark:text-[#04b05d]"
      />

      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        <p className="text-lg font-medium mb-2">Liste des ventes</p>
        <p className="text-sm">Cette fonctionnalité sera disponible prochainement.</p>
      </div>
    </>
  );
}

