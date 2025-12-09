/**
 * Composant UsersTable - Tableau des utilisateurs
 * 
 * Affiche la liste des utilisateurs avec :
 * - User (photo + nom)
 * - Rôle
 * - Statut
 * - Nombre d'achats
 */

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";

import Badge from "../../ui/badge/Badge";
import { TrashBinIcon } from "../../../icons";

interface User {
  id: number;
  name: string;
  image: string;
  role: string;
  status: string;
  purchaseCount: number;
}

// Données d'exemple pour le tableau des utilisateurs
const usersData: User[] = [
  {
    id: 1,
    name: "Marc Frankin",
    image: "/images/user/user-01.jpg",
    role: "Client",
    status: "Actif",
    purchaseCount: 10,
  },
  {
    id: 2,
    name: "Anne Loren",
    image: "/images/user/user-02.jpg",
    role: "Client",
    status: "En attente",
    purchaseCount: 2,
  },
  {
    id: 3,
    name: "Thomas Muller",
    image: "/images/user/user-03.jpg",
    role: "Client",
    status: "Actif",
    purchaseCount: 15,
  },
  {
    id: 4,
    name: "Sarah Johnson",
    image: "/images/user/user-04.jpg",
    role: "Client",
    status: "Actif",
    purchaseCount: 7,
  },
  {
    id: 5,
    name: "David Brown",
    image: "/images/user/user-05.jpg",
    role: "Client",
    status: "Inactif",
    purchaseCount: 0,
  },
];

export default function UsersTable() {
  // État local pour gérer les données
  const [users, setUsers] = useState(usersData);

  /**
   * Gère la suppression d'un utilisateur
   */
  const handleDelete = (userId: number) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
      console.log("Utilisateur supprimé:", userId);
      // TODO: Appel API pour supprimer l'utilisateur
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <Table>
          {/* En-tête du tableau */}
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Utilisateur
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Rôle
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Statut
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Nombre d'achats
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400"
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHeader>

          {/* Corps du tableau */}
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="px-5 py-4 sm:px-6 text-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 overflow-hidden rounded-full">
                      <img
                        width={40}
                        height={40}
                        src={user.image}
                        alt={user.name}
                      />
                    </div>
                    <div>
                      <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {user.name}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  {user.role}
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  <Badge
                    size="sm"
                    color={
                      user.status === "Actif"
                        ? "success"
                        : user.status === "En attente"
                        ? "warning"
                        : "error"
                    }
                  >
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {user.purchaseCount}
                </TableCell>
                <TableCell className="px-4 py-3 text-center">
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="inline-flex items-center justify-center rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                    title="Supprimer l'utilisateur"
                  >
                    <TrashBinIcon className="size-5" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

