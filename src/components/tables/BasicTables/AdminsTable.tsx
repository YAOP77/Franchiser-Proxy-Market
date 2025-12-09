/**
 * Composant AdminsTable - Tableau des administrateurs
 * 
 * Affiche la liste des administrateurs avec :
 * - Utilisateur (photo + nom)
 * - Status (rôle)
 * - Compte (actif/inactif)
 * - Actions (bouton de suppression)
 */

import { useState, useEffect } from "react";
import { useLocation } from "react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";

import Badge from "../../ui/badge/Badge";
import { TrashBinIcon, PencilIcon } from "../../../icons";
import adminService, { Admin } from "../../../services/api/adminService";
import EditAdminModal from "../../modals/EditAdminModal";

export default function AdminsTable() {
  const location = useLocation();
  
  // État local pour gérer les données
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // État pour gérer le modal d'édition
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);

  /**
   * Charge la liste des administrateurs depuis l'API
   */
  const loadAdmins = async () => {
    try {
      setIsLoading(true);
      setError("");
      const adminsList = await adminService.getAdmins();
      setAdmins(adminsList);
    } catch (error: unknown) {
      // Afficher un message d'erreur plus spécifique
      const errorMessage = error instanceof Error ? error.message : "Erreur lors du chargement des administrateurs";
      setError(errorMessage);
      setAdmins([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Charger la liste des administrateurs au montage du composant
  // et à chaque changement de location (pour rafraîchir après redirection)
  useEffect(() => {
    loadAdmins();
  }, [location.pathname]);

  /**
   * Gère l'ouverture du modal d'édition
   */
  const handleEdit = (admin: Admin) => {
    setSelectedAdmin(admin);
    setIsEditModalOpen(true);
  };

  /**
   * Gère la fermeture du modal d'édition
   */
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedAdmin(null);
  };

  /**
   * Gère le succès de la modification (rafraîchit la liste)
   */
  const handleEditSuccess = () => {
    loadAdmins();
  };

  /**
   * Gère la suppression d'un administrateur
   * L'ID est maintenant une string (UUID)
   */
  const handleDelete = async (adminId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet administrateur ?")) {
      try {
        // Convertir l'ID en number si nécessaire, ou garder comme string
        // L'API peut accepter l'UUID directement
        await adminService.deleteAdmin(adminId);
        // Mettre à jour la liste après suppression
        setAdmins((prevAdmins) => prevAdmins.filter((admin) => admin.id !== adminId));
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Erreur lors de la suppression de l'administrateur";
        alert(errorMessage);
      }
    }
  };

  /**
   * Obtenir le nom complet de l'administrateur
   */
  const getFullName = (admin: Admin): string => {
    return `${admin.prenoms} ${admin.nom}`.trim();
  };

  /**
   * Obtenir l'image de l'administrateur ou une image par défaut
   */
  const getAdminImage = (admin: Admin): string => {
    if (admin.image) {
      return admin.image;
    }
    // Image par défaut basée sur l'ID (UUID) pour la diversité
    // Convertir l'UUID en nombre pour le modulo
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
    // Utiliser un hash simple de l'ID pour déterminer l'image
    const idHash = admin.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return defaultImages[idHash % defaultImages.length];
  };

  /**
   * Obtenir le label du rôle
   */
  const getRoleLabel = (role: string): string => {
    const roleLabels: Record<string, string> = {
      admin: "Administrateur",
      caissier: "Caissier",
      commercial: "Commercial",
      super_admin: "Super Administrateur",
    };
    return roleLabels[role] || role;
  };

  /**
   * Obtenir la couleur du badge pour le statut du compte
   * L'API retourne status: 1 (actif) ou 0 (inactif)
   */
  const getStatusColor = (status: number | string | null | undefined): "success" | "error" => {
    // Gérer les différents types de status
    if (status === null || status === undefined) {
      return "error";
    }
    
    // Si c'est un number, 1 = actif, 0 = inactif
    if (typeof status === 'number') {
      return status === 1 ? "success" : "error";
    }
    
    // Si c'est une string, vérifier la valeur
    if (typeof status === 'string') {
      const normalizedStatus = status.toLowerCase().trim();
      // Gérer "1", "0", "actif", "inactif"
      if (normalizedStatus === "1" || normalizedStatus === "actif") {
        return "success";
      }
      return "error";
    }
    
    return "error";
  };

  /**
   * Obtenir le label du statut du compte
   * L'API peut retourner status_text ou on doit le déduire de status
   */
  const getStatusLabel = (admin: Admin): string => {
    // Si status_text existe, l'utiliser
    if (admin.status_text) {
      return admin.status_text;
    }
    
    // Sinon, déduire de status
    if (admin.status === null || admin.status === undefined) {
      return "Inactif";
    }
    
    // Si c'est un number, 1 = Actif, 0 = Inactif
    if (typeof admin.status === 'number') {
      return admin.status === 1 ? "Actif" : "Inactif";
    }
    
    // Si c'est une string (cas théorique, car l'API retourne un number)
    if (typeof admin.status === 'string') {
      const statusValue: string = admin.status;
      const normalizedStatus = statusValue.toLowerCase().trim();
      if (normalizedStatus === "1" || normalizedStatus === "actif") {
        return "Actif";
      }
      return "Inactif";
    }
    
    return "Inactif";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-[#04b05d] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Chargement des administrateurs...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
        {error}
      </div>
    );
  }

  if (admins.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        Aucun administrateur trouvé.
      </div>
    );
  }

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
                Status
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Compte
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
            {admins.map((admin) => (
              <TableRow key={admin.id}>
                <TableCell className="px-5 py-4 sm:px-6 text-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 overflow-hidden rounded-full">
                      <img
                        width={40}
                        height={40}
                        src={getAdminImage(admin)}
                        alt={getFullName(admin)}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {getFullName(admin)}
                      </span>
                      {admin.email && (
                        <span className="block text-xs text-gray-500 dark:text-gray-400">
                          {admin.email}
                        </span>
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
                <TableCell className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleEdit(admin)}
                      className="inline-flex items-center justify-center rounded-lg bg-blue-50 p-2 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
                      title="Modifier l'administrateur"
                    >
                      <PencilIcon className="size-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(admin.id)}
                      className="inline-flex items-center justify-center rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                      title="Supprimer l'administrateur"
                    >
                      <TrashBinIcon className="size-5" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Modal d'édition */}
      <EditAdminModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        admin={selectedAdmin}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}

