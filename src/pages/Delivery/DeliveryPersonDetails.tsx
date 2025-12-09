/**
 * Page DeliveryPersonDetails - Détails d'un livreur
 * 
 * Affiche les détails complets d'un livreur avec :
 * - Informations personnelles (nom, prénom, email, contacts)
 * - Statut du livreur
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import PageBreadCrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import { ChevronLeftIcon, PencilIcon, TrashBinIcon } from "../../icons";
import EditDeliveryPersonModal from "../../components/modals/EditDeliveryPersonModal";
import deliveryService, { DeliveryPerson } from "../../services/api/deliveryService";

export default function DeliveryPersonDetails() {
  const { deliveryPersonId } = useParams<{ deliveryPersonId: string }>();
  const navigate = useNavigate();
  const [deliveryPerson, setDeliveryPerson] = useState<DeliveryPerson | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  /**
   * Charger les détails du livreur depuis l'API
   */
  useEffect(() => {
    const fetchDeliveryPerson = async () => {
      if (!deliveryPersonId) {
        setError("Identifiant livreur manquant");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const data = await deliveryService.getDeliveryPersonById(deliveryPersonId);
        setDeliveryPerson(data);
      } catch (err) {
        const errorMessage = err instanceof Error 
          ? err.message 
          : "Une erreur est survenue lors du chargement des détails du livreur";
        setError(errorMessage);
        setDeliveryPerson(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDeliveryPerson();
  }, [deliveryPersonId]);

  /**
   * Obtenir le style du statut
   */
  const getStatusInfo = (status: number | string) => {
    const statusValue = typeof status === "string" ? parseInt(status, 10) : status;
    const isActive = statusValue === 1;

    return {
      text: isActive ? "Actif" : "Inactif",
      color: isActive
        ? "bg-green-100 border border-green-400 text-green-700 dark:bg-green-900/30 dark:border-green-600 dark:text-green-300"
        : "bg-gray-100 border border-gray-400 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300",
    };
  };

  /**
   * Gère l'ouverture du modal de modification
   */
  const handleOpenEditModal = () => {
    setShowEditModal(true);
  };

  /**
   * Gère la fermeture du modal de modification
   */
  const handleCloseEditModal = () => {
    setShowEditModal(false);
  };

  /**
   * Gère le succès de la modification
   */
  const handleEditSuccess = async () => {
    // Recharger les données du livreur
    if (deliveryPersonId) {
      try {
        setLoading(true);
        const data = await deliveryService.getDeliveryPersonById(deliveryPersonId);
        setDeliveryPerson(data);
      } catch (err) {
        const errorMessage = err instanceof Error 
          ? err.message 
          : "Une erreur est survenue lors du rechargement des détails";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }
  };

  /**
   * Gère la suppression du livreur
   */
  const handleDelete = async () => {
    if (!deliveryPerson) return;

    const confirmMessage = `Êtes-vous sûr de vouloir supprimer le livreur ${deliveryPerson.prenoms} ${deliveryPerson.nom} ?`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setIsDeleting(true);
      await deliveryService.deleteDeliveryPerson(deliveryPerson.id);
      // Rediriger vers la liste après suppression
      navigate("/livreurs", { replace: true });
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : "Une erreur est survenue lors de la suppression";
      alert(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  // État de chargement
  if (loading) {
    return (
      <>
        <PageMeta
          title="Détails du livreur | Proxy Market"
          description="Détails du livreur"
        />
        <PageBreadCrumb
          pageTitle="Détails du livreur"
          titleClassName="text-[#04b05d] dark:text-[#04b05d]"
          items={[
            { label: "Accueil", href: "/" },
            { label: "Liste des livreurs", href: "/livreurs" }
          ]}
        />
        <ComponentCard title="Chargement...">
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#04b05d] border-t-transparent"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">
              Chargement des détails du livreur...
            </span>
          </div>
        </ComponentCard>
      </>
    );
  }

  // État d'erreur
  if (error) {
    return (
      <>
        <PageMeta
          title="Erreur | Proxy Market"
          description="Erreur lors du chargement des détails du livreur"
        />
        <PageBreadCrumb
          pageTitle="Erreur"
          titleClassName="text-[#04b05d] dark:text-[#04b05d]"
          items={[
            { label: "Accueil", href: "/" },
            { label: "Liste des livreurs", href: "/livreurs" }
          ]}
        />
        <div className="mb-6 rounded-2xl border border-neutral-300 bg-white dark:bg-gray-800">
          <div className="p-4 sm:p-6">
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              <div className="font-medium">Erreur</div>
              <div className="mt-1">{error}</div>
            </div>
            <div className="mt-4">
              <Button
                variant="primary"
                onClick={() => navigate("/livreurs")}
              >
                <ChevronLeftIcon className="mr-2 h-4 w-4" />
                Retour à la liste
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Aucune donnée
  if (!deliveryPerson) {
    return (
      <>
        <PageMeta
          title="Livreur non trouvé | Proxy Market"
          description="Le livreur demandé n'existe pas"
        />
        <PageBreadCrumb
          pageTitle="Livreur non trouvé"
          titleClassName="text-[#04b05d] dark:text-[#04b05d]"
          items={[
            { label: "Accueil", href: "/" },
            { label: "Liste des livreurs", href: "/livreurs" }
          ]}
        />
        <div className="mb-6 rounded-2xl border border-neutral-300 bg-white dark:bg-gray-800">
          <div className="p-4 sm:p-6">
            <p className="text-gray-500 dark:text-gray-400">
              Le livreur demandé n'existe pas ou a été supprimé.
            </p>
            <div className="mt-4">
              <Button
                variant="primary"
                onClick={() => navigate("/livreurs")}
              >
                <ChevronLeftIcon className="mr-2 h-4 w-4" />
                Retour à la liste
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const statusInfo = getStatusInfo(deliveryPerson.status);
  const fullName = `${deliveryPerson.prenoms || ""} ${deliveryPerson.nom || ""}`.trim() || "Nom non renseigné";

  return (
    <>
      <PageMeta
        title={`${fullName} | Proxy Market`}
        description={`Détails du livreur ${fullName}`}
      />

      <PageBreadCrumb
        pageTitle={fullName}
        titleClassName="text-[#04b05d] dark:text-[#04b05d]"
        items={[
          { label: "Accueil", href: "/" },
          { label: "Liste des livreurs", href: "/livreurs" }
        ]}
      />

      {/* Boutons d'action */}
      <div className="mb-6 flex items-center justify-end">
        <div className="flex gap-3">
        <Button
          variant="primary"
            onClick={handleOpenEditModal}
          >
            <PencilIcon className="mr-2 h-4 w-4" />
            Modifier
          </Button>
          
          <Button
            variant="outline"
            onClick={handleDelete}
            disabled={true}
        >
            <TrashBinIcon className="mr-2 h-4 w-4" />
            Supprimer
        </Button>
        </div>
      </div>

      {/* Informations du livreur */}
      <div className="mb-6 rounded-2xl border border-neutral-300 bg-white dark:bg-gray-800">
        <div className="px-6 py-5 border-b border-neutral-300 dark:border-gray-700">
          <h3 className="text-1xl font-bold text-neutral-900 dark:text-white">
            Informations du livreur
          </h3>
        </div>
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Nom complet */}
            <div>
              <label className="text-sm font-medium text-neutral-900 dark:text-white mb-1">
                Nom complet
              </label>
              <p className="text-xs font-medium text-neutral-600 dark:text-white">
                {fullName}
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-medium text-neutral-900 dark:text-white mb-1">
                Email
              </label>
              <p className="text-xs font-medium text-neutral-600 dark:text-white">
                {deliveryPerson.email || "Non renseigné"}
              </p>
            </div>

            {/* Contact principal */}
            <div>
              <label className="text-sm font-medium text-neutral-900 dark:text-white mb-1">
                Contact principal
              </label>
              <p className="text-xs font-medium text-neutral-600 dark:text-white">
                {deliveryPerson.contact1 || "Non renseigné"}
              </p>
            </div>

            {/* Contact secondaire */}
            <div>
              <label className="text-sm font-medium text-neutral-900 dark:text-white mb-1">
                Contact secondaire
              </label>
              <p className="text-xs font-medium text-neutral-600 dark:text-white">
                {deliveryPerson.contact2 || "Non renseigné"}
              </p>
            </div>

            {/* Statut */}
            <div>
              <label className="text-sm font-medium text-neutral-900 dark:text-white mb-1">
                Statut
              </label>
              <div className="mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                  {statusInfo.text}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de modification */}
      <EditDeliveryPersonModal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        deliveryPerson={deliveryPerson}
        onSuccess={handleEditSuccess}
      />
    </>
  );
}
