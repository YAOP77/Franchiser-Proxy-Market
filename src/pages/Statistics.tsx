/**
 * Page Statistique - Fonctionnalité à venir
 * 
 * Cette page informe les utilisateurs que les statistiques
 * seront disponibles prochainement
 */

import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";

export default function Statistics() {
  return (
    <>
      <PageMeta
        title="Statistique | Proxy Market"
        description="Statistiques et analyses de l'application"
      />
      <PageBreadcrumb
        pageTitle="Statistique"
        items={[
          { label: "Dashboard", href: "/" },
        ]}
      />

      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-6 px-4">
          {/* Icône statistique */}
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-full bg-[#04b05d]/10 flex items-center justify-center">
              <svg
                className="w-12 h-12 text-[#04b05d]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
          </div>

          {/* Titre */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white/90 mb-2">
              Statistique
            </h2>
            <p className="text-base text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Cette fonctionnalité sera disponible prochainement.
            </p>
          </div>

          {/* Message additionnel */}
          <div className="pt-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800">
              <svg
                className="w-5 h-5 text-[#04b05d]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Nous travaillons pour vous apporter cette fonctionnalité
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

