/**
 * Page UsersTable - Liste des utilisateurs
 * 
 * Affiche la liste des utilisateurs avec leurs informations et statistiques
 */

import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import UsersTable from "../../components/tables/BasicTables/UsersTable";

export default function UsersTablePage() {
  return (
    <>
      <PageMeta
        title="Liste des utilisateurs | Proxy Market"
        description="Consultez la liste des utilisateurs Proxy Market"
      />
      <PageBreadcrumb
        pageTitle="Liste des utilisateurs"
        items={[
          { label: "Gestion des rôles", href: "/basic-tables" },
        ]}
      />
      <div className="space-y-6">
        <ComponentCard title="Liste des utilisateurs">
          <UsersTable />
        </ComponentCard>
      </div>
    </>
  );
}

