/**
 * Composant BoutiqueUsersTable - Tableau des utilisateurs de boutique (franchisés)
 * 
 * Affiche la liste des utilisateurs de boutique avec :
 * - Nom et prénoms (avec photo)
 * - Email
 * - Contact
 * - Rôle
 * - Statut
 */

import { useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";

import Badge from "../../ui/badge/Badge";
import { BoutiqueUser } from "../../../services/api/boutiqueUserService";
import { formatPhoneNumber } from "../../../utils/phoneUtils";

interface BoutiqueUsersTableProps {
  users: BoutiqueUser[];
  boutiqueId?: string; // ID de la boutique pour la navigation
}

/**
 * Retourne le label du statut
 */
const getStatusLabel = (status: number): string => {
  return status === 1 ? "Actif" : "Inactif";
};

/**
 * Retourne la couleur du badge selon le statut
 */
const getStatusColor = (status: number): "success" | "error" => {
  return status === 1 ? "success" : "error";
};

/**
 * Retourne le label du rôle
 */
const getRoleLabel = (role: string): string => {
  if (role === "boutique_admin") {
    return "Administrateur de boutique";
  }
  return role;
};

/**
 * Retourne l'image par défaut pour un utilisateur
 */
const getUserImage = (userId: string) => {
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
  const hash = userId.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  return defaultImages[hash % defaultImages.length];
};

/**
 * Retourne le nom complet de l'utilisateur
 */
const getFullName = (user: BoutiqueUser): string => {
  const prenoms = user.prenoms?.trim() ?? "";
  const nom = user.nom?.trim() ?? "";
  const full = `${prenoms} ${nom}`.trim();
  return full.length > 0 ? full : user.email;
};

export default function BoutiqueUsersTable({ users, boutiqueId }: BoutiqueUsersTableProps) {
  const navigate = useNavigate();

  const tableContent = useMemo(() => {
    return users.map((user) => (
      <TableRow
        key={user.id}
        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5"
        onClick={() => {
          const queryParams = boutiqueId ? `?boutique_id=${boutiqueId}` : "";
          navigate(`/boutique-user/${user.id}${queryParams}`);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            const queryParams = boutiqueId ? `?boutique_id=${boutiqueId}` : "";
            navigate(`/boutique-user/${user.id}${queryParams}`);
          }
        }}
      >
        <TableCell className="px-5 py-4 sm:px-6 text-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 overflow-hidden rounded-full">
              <img
                src={getUserImage(user.id)}
                alt={getFullName(user)}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                {getFullName(user)}
              </span>
              {user.email && (
                <span className="block text-xs text-gray-500 dark:text-gray-400">{user.email}</span>
              )}
            </div>
          </div>
        </TableCell>
        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
          {user.contact_1 ? formatPhoneNumber(user.contact_1) : "—"}
          {user.contact_2 && (
            <span className="block text-xs text-gray-400 dark:text-gray-500">
              {formatPhoneNumber(user.contact_2)}
            </span>
          )}
        </TableCell>
        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
          <Badge size="sm" color="warning">
            {getRoleLabel(user.role)}
          </Badge>
        </TableCell>
        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
          <Badge size="sm" color={getStatusColor(user.status)}>
            {getStatusLabel(user.status)}
          </Badge>
        </TableCell>
      </TableRow>
    ));
  }, [users, boutiqueId, navigate]);

  return (
    <div className="max-w-full overflow-x-auto">
      <Table>
        <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
          <TableRow>
            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
              Utilisateur
            </TableCell>
            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
              Contact
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
  );
}

