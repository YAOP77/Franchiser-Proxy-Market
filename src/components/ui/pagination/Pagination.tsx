/**
 * Composant de pagination réutilisable
 * 
 * Affiche les contrôles de pagination avec boutons précédent/suivant
 * et numéros de page.
 */

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
  showingFrom?: number;
  showingTo?: number;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage: _itemsPerPage,
  showingFrom,
  showingTo,
}: PaginationProps) {
  // Générer les numéros de page à afficher
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Si moins de 5 pages, afficher toutes
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Toujours afficher la première page
      pages.push(1);

      // Calculer le début et la fin de la plage visible
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      // Ajuster si on est proche du début
      if (currentPage <= 3) {
        end = Math.min(4, totalPages - 1);
      }

      // Ajuster si on est proche de la fin
      if (currentPage >= totalPages - 2) {
        start = Math.max(totalPages - 3, 2);
      }

      // Ajouter "..." si nécessaire
      if (start > 2) {
        pages.push("...");
      }

      // Ajouter les pages de la plage
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Ajouter "..." si nécessaire
      if (end < totalPages - 1) {
        pages.push("...");
      }

      // Toujours afficher la dernière page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageClick = (page: number | string) => {
    if (typeof page === "number") {
      onPageChange(page);
    }
  };

  if (totalPages <= 1) {
    return null; // Ne pas afficher la pagination s'il n'y a qu'une page
  }

  return (
    <div className="flex flex-col items-center justify-between gap-4 px-4 py-3 sm:flex-row sm:px-6">
      {/* Informations sur les éléments affichés */}
      <div className="text-sm text-gray-700 dark:text-gray-300">
        {totalItems !== undefined && showingFrom !== undefined && showingTo !== undefined ? (
          <span>
            Affichage de <span className="font-medium">{showingFrom}</span> à{" "}
            <span className="font-medium">{showingTo}</span> sur{" "}
            <span className="font-medium">{totalItems}</span> résultats
          </span>
        ) : (
          <span>
            Page <span className="font-medium">{currentPage}</span> sur{" "}
            <span className="font-medium">{totalPages}</span>
          </span>
        )}
      </div>

      {/* Contrôles de pagination */}
      <div className="flex items-center gap-2">
        {/* Bouton Précédent */}
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:z-10 focus:border-[#04b05d] focus:outline-none focus:ring-1 focus:ring-[#04b05d] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 dark:focus:ring-[#04b05d]"
        >
          Précédent
        </button>

        {/* Numéros de page */}
        <div className="hidden sm:flex sm:gap-1">
          {pageNumbers.map((page, index) => {
            if (page === "...") {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="relative inline-flex items-center border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-300"
                >
                  ...
                </span>
              );
            }

            const isActive = page === currentPage;

            return (
              <button
                key={page}
                onClick={() => handlePageClick(page)}
                className={`relative inline-flex items-center border px-4 py-2 text-sm font-medium focus:z-10 focus:outline-none focus:ring-1 ${
                  isActive
                    ? "z-10 border-[#04b05d] bg-[#04b05d] text-white focus:border-[#04b05d] focus:ring-[#04b05d]"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:border-[#04b05d] focus:ring-[#04b05d] dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Pagination mobile (affichage simplifié) */}
        <div className="flex items-center gap-2 sm:hidden">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {currentPage} / {totalPages}
          </span>
        </div>

        {/* Bouton Suivant */}
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:z-10 focus:border-[#04b05d] focus:outline-none focus:ring-1 focus:ring-[#04b05d] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 dark:focus:ring-[#04b05d]"
        >
          Suivant
        </button>
      </div>
    </div>
  );
}

