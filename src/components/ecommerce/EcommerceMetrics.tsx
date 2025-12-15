import { useEffect, useState, useRef } from "react";
import {
  BoxIconLine,
  DollarLineIcon,
  GroupIcon,
  BoxIcon,
} from "../../icons";
import reportService from "../../services/api/reportService";

/**
 * Hook personnalisé pour animer un compteur de 0 à une valeur cible
 */
function useCountUp(end: number, duration: number = 2000, startDelay: number = 0): number {
  const [count, setCount] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const delayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Démarrer l'animation après le délai initial
    delayTimeoutRef.current = setTimeout(() => {
      const startTime = Date.now();
      startTimeRef.current = startTime;

      const animate = () => {
        if (!startTimeRef.current) return;

        const now = Date.now();
        const elapsed = now - startTimeRef.current;
        const progress = Math.min(elapsed / duration, 1);

        // Fonction d'easing pour une animation plus fluide (ease-out)
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentCount = Math.floor(easeOutQuart * end);

        setCount(currentCount);

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          setCount(end); // S'assurer d'atteindre la valeur exacte
        }
      };

      animate();
    }, startDelay);

    return () => {
      if (delayTimeoutRef.current) {
        clearTimeout(delayTimeoutRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [end, duration, startDelay]);

  return count;
}

/**
 * Formate un nombre avec des séparateurs de milliers
 */
function formatNumber(num: number): string {
  return new Intl.NumberFormat('fr-FR').format(num);
}

/**
 * Formate un montant en FCFA
 */
function formatCurrency(num: number): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num) + ' FCFA';
}

/**
 * Composant EcommerceMetrics - Métriques principales du tableau de bord
 * 
 * Affiche les métriques clés sous forme de cartes :
 * - Stock : nombre de produits avec stock
 * - Livreurs : nombre total de livreurs
 * - Commandes : nombre de commandes de l'année
 * - Ventes : montant total des ventes de l'année
 */
export default function EcommerceMetrics() {
  const [loading, setLoading] = useState<boolean>(true);
  const [reports, setReports] = useState<{
    stock: number;
    livreurs: number;
    commandes: number;
    ventes: number;
  }>({
    stock: 0,
    livreurs: 0,
    commandes: 0,
    ventes: 0,
  });

  // Charger les statistiques depuis l'API
  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        const data = await reportService.getReports();
        
        setReports({
          stock: data.produit_with_stock || 0,
          livreurs: data.all_livreur || 0,
          commandes: data.commandeannee || 0,
          ventes: data.commandeannee_soustotal || 0,
        });
      } catch (err) {
        // En cas d'erreur, garder les valeurs à 0
        setReports({
          stock: 0,
          livreurs: 0,
          commandes: 0,
          ventes: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  // Animations avec des délais différents pour un effet en cascade
  const stockCount = useCountUp(reports.stock, 2000, 0);
  const livreursCount = useCountUp(reports.livreurs, 2000, 200);
  const commandesCount = useCountUp(reports.commandes, 2000, 400);
  const ventesCount = useCountUp(reports.ventes, 2000, 600);
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
      {/* <!-- Metric Item Start - Stock --> */}
      <div className="rounded-2xl border border-yellow-400 bg-yellow-100 p-5 dark:border-yellow-500 dark:bg-yellow-900/30 md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-yellow-200 rounded-xl dark:bg-yellow-800/50">
          <BoxIcon className="text-yellow-800 size-6 dark:text-yellow-200" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div className="flex-1 min-w-0">
            <span className="text-sm text-yellow-800 dark:text-yellow-200">
              Stock
            </span>
            <h4 className="mt-2 font-bold text-yellow-900 text-title-sm dark:text-yellow-100 truncate">
              {loading ? "..." : formatNumber(stockCount)}
            </h4>
          </div>
        </div>
      </div>
      {/* <!-- Metric Item End --> */}

      {/* <!-- Metric Item Start - Livreurs --> */}
      <div className="rounded-2xl border border-neutral-400 bg-white p-5 dark:border-neutral-400 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div className="flex-1 min-w-0">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Livreurs
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90 truncate">
              {loading ? "..." : formatNumber(livreursCount)}
            </h4>
          </div>
        </div>
      </div>
      {/* <!-- Metric Item End --> */}

      {/* <!-- Metric Item Start --> */}
      <div className="rounded-2xl border border-neutral-400 bg-white p-5 dark:border-neutral-400 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div className="flex-1 min-w-0">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Commandes
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90 truncate">
              {loading ? "..." : formatNumber(commandesCount)}
            </h4>
          </div>
        </div>
      </div>
      {/* <!-- Metric Item End --> */}

      {/* <!-- Metric Item Start - Ventes --> */}
      <div className="rounded-2xl border border-neutral-400 bg-white p-5 dark:border-neutral-400 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <DollarLineIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div className="flex-1 min-w-0">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Ventes
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90 truncate">
              {loading ? "..." : formatCurrency(ventesCount)}
            </h4>
          </div>
        </div>
      </div>
      {/* <!-- Metric Item End --> */}
    </div>
  );
}
