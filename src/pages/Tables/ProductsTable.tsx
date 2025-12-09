/**
 * Page ProductsTable - Liste des produits vivriers
 */

import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";

import Badge from "../../components/ui/badge/Badge";
import productService, { Product } from "../../services/api/productService";
import { PlusIcon } from "../../icons";
import Button from "../../components/ui/button/Button";
import Pagination from "../../components/ui/pagination/Pagination";
import {
  formatPrice,
  formatWeight,
  getCategoryName,
  getProductImage,
  getStatusLabel,
  getStatusColor,
} from "../../utils/productUtils";

export default function ProductsTable() {
  const location = useLocation();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [paginationMeta, setPaginationMeta] = useState<{
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
  } | null>(null);

  const loadProducts = async (page: number = 1) => {
    try {
      setIsLoading(true);
      setError("");
      const response = await productService.getProducts(page);
      setProducts(response.data);
      setPaginationMeta(response.meta);
      setCurrentPage(response.meta.current_page);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur lors du chargement des produits";
      setError(message);
      setProducts([]);
      setPaginationMeta(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadProducts(page);
    // Scroll vers le haut de la table
    window.scrollTo({ top: 0, behavior: "smooth" });
  };


  const tableContent = useMemo(() => {
    return products.map((product) => (
      <TableRow
        key={product.id}
        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5"
        onClick={() => navigate(`/products/${product.id}`)}
      >
        <TableCell className="px-5 py-4 sm:px-6 text-start">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 overflow-hidden rounded-lg border border-gray-200 dark:border-white/10">
              <img
                src={getProductImage(product)}
                alt={product.libelle}
                className="h-full w-full object-cover"
                onError={(e) => {
                  // En cas d'erreur de chargement de l'image, utiliser une image par défaut
                  (e.target as HTMLImageElement).src = "/images/product/product-01.jpg";
                }}
              />
            </div>
            <div>
              <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                {product.libelle}
              </span>
              <span className="block text-xs text-gray-500 dark:text-gray-400">
                {formatWeight(product.valeur_poids, product.unite_poids)}
              </span>
            </div>
          </div>
        </TableCell>
        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
          <Badge size="sm" color="warning">
            {getCategoryName(product)}
          </Badge>
        </TableCell>
        <TableCell className="px-4 py-3 text-gray-800 text-start text-theme-sm dark:text-white/90 font-medium">
          {formatPrice(product.prix_vente_normale)}
        </TableCell>
        <TableCell className="px-4 py-3 text-gray-800 text-start text-theme-sm dark:text-white/90 font-medium">
          {formatPrice(product.prix_vente_reduit)}
        </TableCell>
        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
          <Badge size="sm" color={getStatusColor(product.status)}>
            {getStatusLabel(product)}
          </Badge>
        </TableCell>
      </TableRow>
    ));
  }, [products, navigate]);

  if (isLoading) {
    return (
      <>
        <PageMeta
          title="Liste des produits | Proxy Market"
          description="Consultez la liste des produits vivriers enregistrés"
        />
        <PageBreadcrumb
          pageTitle="Liste des produits"
          items={[{ label: "Gestion des produits", href: "/products-table" }]}
          titleClassName="text-[#04b05d] dark:text-[#04b05d]"
        />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#04b05d] border-t-transparent" />
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Chargement des produits...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageMeta
          title="Liste des produits | Proxy Market"
          description="Consultez la liste des produits vivriers enregistrés"
        />
        <PageBreadcrumb
          pageTitle="Liste des produits"
          items={[{ label: "Gestion des produits", href: "/products-table" }]}
          titleClassName="text-[#04b05d] dark:text-[#04b05d]"
        />
        <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
          {error}
        </div>
      </>
    );
  }

  if (!isLoading && products.length === 0 && !error) {
    return (
      <>
        <PageMeta
          title="Liste des produits | Proxy Market"
          description="Consultez la liste des produits vivriers enregistrés"
        />
        <PageBreadcrumb
          pageTitle="Liste des produits"
          items={[{ label: "Gestion des produits", href: "/products-table" }]}
          titleClassName="text-[#04b05d] dark:text-[#04b05d]"
        />
        <div className="flex justify-end mb-6">
          <Button
            variant="none"
            className="bg-[#04b05d] hover:bg-[#039a52] text-white shadow-theme-xs disabled:bg-[#04b05d]/70 focus:ring-3 focus:ring-[#04b05d]/20 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => navigate("/add-product")}
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Ajouter un produit
          </Button>
        </div>
        <div className="flex flex-col items-center justify-center py-8">
          <img
            src="/images/oups/File searching-bro.png"
            alt="Aucun produit trouvé"
            className="w-80 h-80 object-contain"
          />
          <p className="mt-4 text-center text-gray-500 dark:text-gray-400">
            Aucun produit trouvé.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title="Liste des produits | Proxy Market"
        description="Consultez la liste des produits vivriers enregistrés"
      />
      <PageBreadcrumb
        pageTitle="Liste des produits"
        items={[{ label: "Gestion des produits", href: "/products-table" }]}
        titleClassName="text-[#04b05d] dark:text-[#04b05d]"
      />

      <div className="flex justify-end mb-6">
        <Button
          variant="none"
          className="bg-[#04b05d] hover:bg-[#039a52] text-white shadow-theme-xs disabled:bg-[#04b05d]/70 focus:ring-3 focus:ring-[#04b05d]/20 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => navigate("/add-product")}
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Ajouter un produit
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Produit
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Catégorie
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Prix normal
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Prix réduit
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Statut
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">{tableContent}</TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {paginationMeta && paginationMeta.last_page > 1 && paginationMeta.total > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={paginationMeta.last_page}
            onPageChange={handlePageChange}
            totalItems={paginationMeta.total}
            itemsPerPage={paginationMeta.per_page}
            showingFrom={paginationMeta.from}
            showingTo={paginationMeta.to}
          />
        )}
      </div>
    </>
  );
}

