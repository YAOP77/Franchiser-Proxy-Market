import { useEffect, useState, useRef } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BoxIconLine,
  DollarLineIcon,
  GroupIcon,
  BoxIcon,
} from "../../icons";
import Badge from "../ui/badge/Badge";

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
 * Formate un montant en dollars
 */
function formatCurrency(num: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Composant EcommerceMetrics - Métriques principales du tableau de bord
 * 
 * Affiche les métriques clés sous forme de cartes :
 * - Clients : nombre total de clients
 * - Commandes : nombre total de commandes
 * - Ventes : montant total des ventes
 * - Stock : nombre total de produits en stock dans la boutique
 */
export default function EcommerceMetrics() {
  // Valeurs cibles
  const clientsTarget = 3782;
  const commandesTarget = 5359;
  const ventesTarget = 127845;
  const stockTarget = 1234;

  // Animations avec des délais différents pour un effet en cascade
  const clientsCount = useCountUp(clientsTarget, 2000, 0);
  const commandesCount = useCountUp(commandesTarget, 2000, 200);
  const ventesCount = useCountUp(ventesTarget, 2000, 400);
  const stockCount = useCountUp(stockTarget, 2000, 600);
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
              {formatNumber(stockCount)}
            </h4>
          </div>
          <div className="ml-2 flex-shrink-0 border border-green-200 rounded-full">
            <Badge color="success" startIcon={<ArrowUpIcon />}>
            8.2%
          </Badge>
          </div>
        </div>
      </div>
      {/* <!-- Metric Item End --> */}

      {/* <!-- Metric Item Start --> */}
      <div className="rounded-2xl border border-neutral-400 bg-white p-5 dark:border-neutral-400 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div className="flex-1 min-w-0">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Clients
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90 truncate">
              {formatNumber(clientsCount)}
            </h4>
          </div>
          <div className="ml-2 flex-shrink-0 border border-green-200 rounded-full">
            <Badge color="success" startIcon={<ArrowUpIcon />}>
            11.01%
          </Badge>
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
              {formatNumber(commandesCount)}
            </h4>
          </div>
          <div className="ml-2 flex-shrink-0 border border-red-200 rounded-full">
            <Badge color="error" startIcon={<ArrowDownIcon />}>
            9.05%
          </Badge>
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
              {formatCurrency(ventesCount)}
            </h4>
          </div>
          <div className="ml-2 flex-shrink-0 border border-green-200 rounded-full">
            <Badge color="success" startIcon={<ArrowUpIcon />}>
            15.3%
          </Badge>
          </div>
        </div>
      </div>
      {/* <!-- Metric Item End --> */}
    </div>
  );
}
