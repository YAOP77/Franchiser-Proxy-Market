import { useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import ComponentCard from "../components/common/ComponentCard";
import Badge from "../components/ui/badge/Badge";
import { useAuth } from "../context/AuthContext";
import adminService, { Admin } from "../services/api/adminService";
import apiClient from "../services/api/axiosConfig";

interface BoutiqueData {
  id: string;
  name: string;
  email: string;
  adresse: string;
  details: string | null;
  contact_1: string;
  contact_2: string | null;
  commune: string | null;
  commune_id: number | null;
  status: number;
  status_text: string;
  created_at: string;
  updated_at: string;
}

export default function UserProfiles() {
  const { user } = useAuth();
  const [adminDetails, setAdminDetails] = useState<Admin | null>(null);
  const [boutiqueData, setBoutiqueData] = useState<BoutiqueData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingBoutique, setIsLoadingBoutique] = useState<boolean>(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        
        // Utiliser directement getCurrentProfile avec l'ID de l'utilisateur
        if (!user?.id) {
          return;
        }
        const adminProfile = await adminService.getCurrentProfile(user.id);
        setAdminDetails(adminProfile);
      } catch (err: unknown) {
        // Masquer l'erreur comme demandé
        setAdminDetails(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user?.id]);

  // Récupérer les informations de la boutique
  useEffect(() => {
    const fetchBoutique = async () => {
      try {
        setIsLoadingBoutique(true);
        
        // Essayer de trouver l'ID de la boutique dans adminDetails
        // L'ID peut être dans différentes propriétés selon la réponse de l'API
        let boutiqueId: string | null = null;
        
        if (adminDetails) {
          const adminAny = adminDetails as any;
          // Chercher l'ID de la boutique dans différentes propriétés possibles
          boutiqueId = adminAny.boutique_id 
            || adminAny.boutiqueId 
            || adminAny.boutique?.id
            || adminAny.boutique_id
            || adminAny.boutique_id
            || null;
        }
        
        // Si on a l'ID de la boutique, récupérer les données via /boutiques/{id}
        if (boutiqueId) {
          try {
            const response = await apiClient.get<{ data: BoutiqueData }>(`/boutiques/${boutiqueId}`);
            const responseData = response.data as { data?: BoutiqueData };
            
            if (responseData?.data) {
              setBoutiqueData(responseData.data);
            } else {
              // Si la réponse est directement l'objet boutique
              const directData = response.data as unknown as BoutiqueData;
              if (directData?.id) {
                setBoutiqueData(directData);
              }
            }
          } catch (boutiqueError) {
            // Erreur silencieuse
            setBoutiqueData(null);
          }
        }
      } catch (err: unknown) {
        // Masquer l'erreur silencieusement
        setBoutiqueData(null);
      } finally {
        setIsLoadingBoutique(false);
      }
    };

    if (adminDetails) {
      fetchBoutique();
    }
  }, [adminDetails]);


  const fullName = useMemo(() => {
    if (adminDetails) {
      const prenoms = adminDetails.prenoms?.trim() ?? "";
      const nom = adminDetails.nom?.trim() ?? "";
      const combined = `${prenoms} ${nom}`.trim();
      if (combined.length > 0) {
        return combined;
      }
    }
    return user?.name ?? "Utilisateur";
  }, [adminDetails, user]);

  const roleLabel = useMemo(() => {
    const role = adminDetails?.role ?? user?.role;
    if (!role) {
      return "";
    }
    const map: Record<string, string> = {
      admin: "Administrateur",
      super_admin: "Super Administrateur",
      caissier: "Caissier",
      commercial: "Commercial",
    };
    return map[role] ?? role;
  }, [adminDetails, user]);

  const accountStatus = useMemo(() => {
    if (adminDetails?.status_text) {
      return adminDetails.status_text;
    }
    if (typeof adminDetails?.status === "number") {
      return adminDetails.status === 1 ? "Actif" : "Inactif";
    }
    return "Non défini";
  }, [adminDetails]);

  const statusColor = useMemo(() => {
    if (adminDetails?.status_text) {
      return adminDetails.status_text.toLowerCase().includes("actif") ? "success" : "error";
    }
    if (typeof adminDetails?.status === "number") {
      return adminDetails.status === 1 ? "success" : "error";
    }
    return "warning";
  }, [adminDetails]);

  const profileImage = useMemo(() => {
    // Si une image est fournie par l'API, l'utiliser
    if (adminDetails?.image) {
      return adminDetails.image;
    }
    // Sinon, utiliser l'image par défaut
    return "/images/user/User.jpg";
  }, [adminDetails]);

  const renderField = (label: string, value?: string | number | null) => (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-neutral-900 dark:text-white">
        {label}
      </label>
      <p className="text-base font-medium text-neutral-700 dark:text-neutral-300">
        {value && String(value).trim().length > 0 ? value : "—"}
      </p>
    </div>
  );

  return (
    <>
      <PageMeta
        title="Profil administrateur | Proxy Market"
        description="Consultez les informations de votre compte administrateur"
      />
      <PageBreadcrumb
        pageTitle="Profil"
        items={[
          { label: "Home", href: "/" },
        ]}
        titleClassName="text-[#04b05d] dark:text-[#04b05d]"
      />

      <div className="space-y-6">
        {/* Carte principale avec photo et informations */}
        <div className="rounded-2xl border border-neutral-300 bg-white dark:border-neutral-700 dark:bg-gray-800">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#04b05d] border-t-transparent" />
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Chargement des informations du profil…
              </p>
            </div>
          ) : (
            <div className="p-6 sm:p-8">
              <div className="flex flex-col items-center gap-6 text-center lg:flex-row lg:items-start lg:text-left">
                {/* Photo de profil */}
                <div className="relative flex-shrink-0">
                  <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-neutral-200 dark:border-neutral-700">
                    <img
                      src={profileImage}
                      alt={fullName}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/images/user/User.jpg";
                      }}
                    />
                  </div>
                  {accountStatus && accountStatus !== "Non défini" && (
                    <div className="absolute -bottom-1 -right-1">
                      <Badge color={statusColor} size="sm">
                        {accountStatus}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Informations principales */}
                <div className="flex-1 space-y-3">
                  <div>
                    <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                      {fullName}
                    </h2>
                  </div>
                  {user?.email && (
                    <div>
                      <p className="text-base text-neutral-600 dark:text-neutral-300">
                        {user.email}
                      </p>
                    </div>
                  )}
                  {roleLabel && (
                    <div>
                      <span className="inline-flex items-center rounded-full bg-[#04b05d]/10 px-3 py-1 text-sm font-semibold text-[#04b05d] dark:bg-[#04b05d]/20 dark:text-[#04b05d]">
                        {roleLabel}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Card Informations personnelles */}
        <ComponentCard title="Informations personnelles" className="border border-neutral-300">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {renderField("Adresse e-mail", user?.email ?? adminDetails?.email)}
            {roleLabel && renderField("Rôle", roleLabel)}
          </div>
        </ComponentCard>

        {/* Card Informations de la boutique */}
        {!isLoadingBoutique && boutiqueData && (
          <ComponentCard title="Informations de la boutique" className="border border-neutral-300">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {boutiqueData.name && renderField("Nom de la boutique", boutiqueData.name)}
              {boutiqueData.email && renderField("Email", boutiqueData.email)}
              {boutiqueData.adresse && renderField("Adresse", boutiqueData.adresse)}
              {boutiqueData.contact_1 && renderField("Contact principal", boutiqueData.contact_1)}
              {boutiqueData.contact_2 && renderField("Contact secondaire", boutiqueData.contact_2)}
              {boutiqueData.commune && renderField("Commune", boutiqueData.commune)}
              {boutiqueData.commune_id !== null && boutiqueData.commune_id !== undefined && renderField("ID Commune", boutiqueData.commune_id)}
              {boutiqueData.status_text && (
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-neutral-900 dark:text-white">
                    Statut
                  </label>
                  <div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      boutiqueData.status === 1
                        ? "bg-green-100 border border-green-400 text-green-700 dark:bg-green-900/30 dark:border-green-600 dark:text-green-300"
                        : "bg-gray-100 border border-gray-400 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                    }`}>
                      {boutiqueData.status_text}
                    </span>
                  </div>
                </div>
              )}
              {boutiqueData.created_at && renderField("Créé le", boutiqueData.created_at)}
              {boutiqueData.updated_at && renderField("Mis à jour le", boutiqueData.updated_at)}
            </div>
          </ComponentCard>
        )}
        
        {/* Affichage du chargement de la boutique */}
        {isLoadingBoutique && (
          <ComponentCard title="Informations de la boutique" className="border border-neutral-300">
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#04b05d] border-t-transparent"></div>
              <span className="ml-3 text-sm text-neutral-600 dark:text-neutral-400">
                Chargement des informations de la boutique...
              </span>
            </div>
          </ComponentCard>
        )}
      </div>

    </>
  );
}
