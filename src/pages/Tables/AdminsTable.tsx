/**
 * Page AdminsTable - Liste des administrateurs
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
import Button from "../../components/ui/button/Button";
import Pagination from "../../components/ui/pagination/Pagination";
import adminService, { Admin } from "../../services/api/adminService";
import { PlusIcon } from "../../icons";

export default function AdminsTable() {
  const location = useLocation();
  const navigate = useNavigate();

  const [admins, setAdmins] = useState<Admin[]>([]);
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

  const loadAdmins = async (page: number = 1) => {
    try {
      setIsLoading(true);
      setError("");
      const response = await adminService.getAdmins(page);
      setAdmins(response.data);
      setPaginationMeta(response.meta);
      setCurrentPage(response.meta.current_page);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur lors du chargement des administrateurs";
      setError(message);
      setAdmins([]);
      setPaginationMeta(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadAdmins(page);
    // Scroll vers le haut de la table
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getRoleLabel = (role: string) => {
    const map: Record<string, string> = {
      admin: "Administrateur",
      super_admin: "Super Administrateur",
      caissier: "Caissier",
      commercial: "Commercial",
    };
    return map[role] ?? role;
  };

  const getStatusColor = (status: number | string | null | undefined) => {
    if (status === null || status === undefined) {
      return "error";
    }
    if (typeof status === "number") {
      return status === 1 ? "success" : "error";
    }
    const normalized = status.toString().toLowerCase();
    if (normalized === "1" || normalized.includes("actif")) {
      return "success";
    }
    return "error";
  };

  const getStatusLabel = (admin: Admin) => {
    if (admin.status_text) {
      return admin.status_text;
    }
    if (typeof admin.status === "number") {
      return admin.status === 1 ? "Actif" : "Inactif";
    }
    return "Inactif";
  };

  const getAdminImage = (admin: Admin) => {
    if (admin.image) {
      return admin.image;
    }
    const defaultImages = [
      "/images/user/user-01.jpg",
      "/images/user/user-02.jpg",
      "/images/user/user-03.jpg",
      "/images/user/user-04.jpg",
      "/images/user/user-05.jpg",
      "/images/user/user-06.jpg",
      "/images/user/user-07.jpg",
      "/images/user/user-08.jpg",
    ];
    const hash = admin.id.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    return defaultImages[hash % defaultImages.length];
  };

  const getFullName = (admin: Admin) => {
    const prenoms = admin.prenoms?.trim() ?? "";
    const nom = admin.nom?.trim() ?? "";
    const full = `${prenoms} ${nom}`.trim();
    return full.length > 0 ? full : admin.email;
  };

  const tableContent = useMemo(() => {
    return admins.map((admin) => (
      <TableRow
        key={admin.id}
        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5"
        onClick={() => navigate(`/admins/${admin.id}`)}
      >
        <TableCell className="px-5 py-4 sm:px-6 text-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 overflow-hidden rounded-full">
              <img
                src={getAdminImage(admin)}
                alt={getFullName(admin)}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                {getFullName(admin)}
              </span>
              {admin.email && (
                <span className="block text-xs text-gray-500 dark:text-gray-400">{admin.email}</span>
              )}
            </div>
          </div>
        </TableCell>
        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
          <Badge size="sm" color="warning">
            {getRoleLabel(admin.role)}
          </Badge>
        </TableCell>
        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
          <Badge size="sm" color={getStatusColor(admin.status)}>
            {getStatusLabel(admin)}
          </Badge>
        </TableCell>
      </TableRow>
    ));
  }, [admins, navigate]);

  if (isLoading) {
    return (
      <>
        <PageMeta
          title="Liste des administrateurs | Proxy Market"
          description="Consultez la liste des administrateurs enregistrés"
        />
        <PageBreadcrumb
          pageTitle="Liste des administrateurs"
          items={[{ label: "Administration", href: "/admins-table" }]}
          titleClassName="text-[#04b05d] dark:text-[#04b05d]"
        />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#04b05d] border-t-transparent" />
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Chargement des administrateurs...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageMeta
          title="Liste des administrateurs | Proxy Market"
          description="Consultez la liste des administrateurs enregistrés"
        />
        <PageBreadcrumb
          pageTitle="Liste des administrateurs"
          items={[{ label: "Administration", href: "/admins-table" }]}
          titleClassName="text-[#04b05d] dark:text-[#04b05d]"
        />
        <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
          {error}
        </div>
      </>
    );
  }

  if (admins.length === 0) {
    return (
      <>
        <PageMeta
          title="Liste des administrateurs | Proxy Market"
          description="Consultez la liste des administrateurs enregistrés"
        />
        <PageBreadcrumb
          pageTitle="Liste des administrateurs"
          items={[{ label: "Administration", href: "/admins-table" }]}
          titleClassName="text-[#04b05d] dark:text-[#04b05d]"
        />
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">Aucun administrateur trouvé.</div>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title="Liste des administrateurs | Proxy Market"
        description="Consultez la liste des administrateurs enregistrés"
      />
      <PageBreadcrumb
        pageTitle="Liste des administrateurs"
        items={[{ label: "Administration", href: "/admins-table" }]}
        titleClassName="text-[#04b05d] dark:text-[#04b05d]"
      />

      {/* Bouton pour créer un administrateur */}
      <div className="mb-6 flex justify-end">
        <Button
          variant="none"
          className="bg-[#04b05d] hover:bg-[#039a52] text-white shadow-theme-xs disabled:bg-[#04b05d]/70 focus:ring-3 focus:ring-[#04b05d]/20 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => navigate("/add-admin")}
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Créer un administrateur
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Utilisateur
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Rôle
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

