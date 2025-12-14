import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import ChartTab, { ChartPeriod } from "../common/ChartTab";
import { useEffect, useState, useMemo } from "react";
import reportService from "../../services/api/reportService";

export default function StatisticsChart() {
  const [selectedPeriod, setSelectedPeriod] = useState<ChartPeriod>("monthly");
  const [loading, setLoading] = useState<boolean>(true);
  const [reportsData, setReportsData] = useState<{
    monthly: { ventes: number[]; revenus: number[] };
    quarterly: { ventes: number[]; revenus: number[] };
    annually: { ventes: number[]; revenus: number[] };
  }>({
    monthly: { ventes: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], revenus: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
    quarterly: { ventes: [0, 0, 0, 0], revenus: [0, 0, 0, 0] },
    annually: { ventes: [0], revenus: [0] },
  });

  // Charger les statistiques depuis l'API
  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        const data = await reportService.getReports();
        
        // Données mensuelles (12 mois)
        const currentMonth = new Date().getMonth();
        const monthlyVentes = new Array(12).fill(0);
        const monthlyRevenus = new Array(12).fill(0);
        
        // Utiliser les vraies valeurs de l'API pour les revenus
        // Mois actuel
        monthlyRevenus[currentMonth] = data.commandemois_soustotal || 0;
        monthlyVentes[currentMonth] = data.commandemois || 0;
        
        // Mois passé (mois précédent)
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        monthlyRevenus[lastMonth] = data.commandeMoisPasse_soustotal || 0;
        monthlyVentes[lastMonth] = data.commandeMoisPasse || 0;
        
        // Calculer le total des autres mois pour les revenus (année - mois actuel - mois passé)
        const totalYearRevenue = data.commandeannee_soustotal || 0;
        const currentMonthRevenue = data.commandemois_soustotal || 0;
        const lastMonthRevenue = data.commandeMoisPasse_soustotal || 0;
        const remainingMonthsRevenueTotal = totalYearRevenue - currentMonthRevenue - lastMonthRevenue;
        
        // Calculer le total des autres mois pour les ventes (année - mois actuel - mois passé)
        const totalYearOrders = data.commandeannee || 0;
        const currentMonthOrders = data.commandemois || 0;
        const lastMonthOrders = data.commandeMoisPasse || 0;
        const remainingMonthsOrdersTotal = totalYearOrders - currentMonthOrders - lastMonthOrders;
        
        // Répartir le reste sur les 10 autres mois de manière proportionnelle
        const remainingMonths = 10; // 12 mois - mois actuel - mois passé
        const averageRevenueForOtherMonths = remainingMonths > 0 
          ? Math.floor(remainingMonthsRevenueTotal / remainingMonths) 
          : 0;
        const averageOrdersForOtherMonths = remainingMonths > 0
          ? Math.floor(remainingMonthsOrdersTotal / remainingMonths)
          : 0;
        
        // Remplir les autres mois avec la moyenne
        for (let i = 0; i < 12; i++) {
          if (i !== currentMonth && i !== lastMonth) {
            monthlyRevenus[i] = averageRevenueForOtherMonths;
            monthlyVentes[i] = averageOrdersForOtherMonths;
          }
        }
        
        // Données trimestrielles (4 trimestres)
        const quarterlyVentes: number[] = [];
        const quarterlyRevenus: number[] = [];
        
        // Répartir les données mensuelles en trimestres
        for (let q = 0; q < 4; q++) {
          const startMonth = q * 3;
          const endMonth = Math.min(startMonth + 3, 12);
          let qVentes = 0;
          let qRevenus = 0;
          
          for (let m = startMonth; m < endMonth; m++) {
            qVentes += monthlyVentes[m];
            qRevenus += monthlyRevenus[m];
          }
          
          quarterlyVentes.push(qVentes);
          quarterlyRevenus.push(qRevenus);
        }
        
        // Données annuelles (année actuelle)
        const annuallyVentes = [data.commandeannee || 0];
        const annuallyRevenus = [data.commandeannee_soustotal || 0];
        
        setReportsData({
          monthly: { ventes: monthlyVentes, revenus: monthlyRevenus },
          quarterly: { ventes: quarterlyVentes, revenus: quarterlyRevenus },
          annually: { ventes: annuallyVentes, revenus: annuallyRevenus },
        });
      } catch (err) {
        setReportsData({
          monthly: { ventes: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], revenus: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
          quarterly: { ventes: [0, 0, 0, 0], revenus: [0, 0, 0, 0] },
          annually: { ventes: [0], revenus: [0] },
        });
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  // Calculer les catégories et données selon la période sélectionnée
  const { categories, currentData } = useMemo(() => {
    switch (selectedPeriod) {
      case "monthly":
        return {
          categories: ["Janv", "Fév", "Mars", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"],
          currentData: reportsData.monthly,
        };
      case "quarterly":
        return {
          categories: ["T1", "T2", "T3", "T4"],
          currentData: reportsData.quarterly,
        };
      case "annually":
        return {
          categories: [new Date().getFullYear().toString()],
          currentData: reportsData.annually,
        };
      default:
        return {
          categories: ["Janv", "Fév", "Mars", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"],
          currentData: reportsData.monthly,
        };
    }
  }, [selectedPeriod, reportsData]);

  // Options du graphique avec catégories dynamiques
  const options: ApexOptions = useMemo(() => ({
    legend: {
      show: false, // Hide legend
      position: "top",
      horizontalAlign: "left",
    },
    colors: ["#04b05d", "rgba(4, 176, 93, 0.5)"], // Define line colors - Proxy Market
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 310,
      type: "line", // Set the chart type to 'line'
      toolbar: {
        show: false, // Hide chart toolbar
      },
    },
    stroke: {
      curve: "straight", // Define the line style (straight, smooth, or step)
      width: [2, 2], // Line width for each dataset
    },
    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0.55,
        opacityTo: 0,
      },
    },
    markers: {
      size: 0, // Size of the marker points
      strokeColors: "#fff", // Marker border color
      strokeWidth: 2,
      hover: {
        size: 6, // Marker size on hover
      },
    },
    grid: {
      xaxis: {
        lines: {
          show: false, // Hide grid lines on x-axis
        },
      },
      yaxis: {
        lines: {
          show: true, // Show grid lines on y-axis
        },
      },
    },
    dataLabels: {
      enabled: false, // Disable data labels
    },
    tooltip: {
      enabled: true, // Enable tooltip
      x: {
        format: "dd MMM yyyy", // Format for x-axis tooltip
      },
    },
    xaxis: {
      type: "category", // Category-based x-axis
      categories: categories,
      axisBorder: {
        show: false, // Hide x-axis border
      },
      axisTicks: {
        show: false, // Hide x-axis ticks
      },
      tooltip: {
        enabled: false, // Disable tooltip for x-axis points
      },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: "12px", // Adjust font size for y-axis labels
          colors: ["#6B7280"], // Color of the labels
        },
      },
      title: {
        text: "", // Remove y-axis title
        style: {
          fontSize: "0px",
        },
      },
    },
  }), [categories]);

  const series = [
    {
      name: "Ventes",
      data: currentData.ventes,
    },
    {
      name: "Revenus",
      data: currentData.revenus,
    },
  ];
  return (
    <div className="rounded-2xl border border-gray-300 bg-white px-5 pb-5 pt-5 dark:border-gray-700 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex flex-col gap-5 mb-6 sm:flex-row sm:justify-between">
        <div className="w-full">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Statistiques
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Objectifs que vous avez définis pour chaque mois
          </p>
        </div>
        <div className="flex items-start w-full gap-3 sm:justify-end">
          <ChartTab 
            defaultPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
          />
        </div>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[1000px] xl:min-w-full">
          <Chart options={options} series={series} type="area" height={310} />
        </div>
      </div>
    </div>
  );
}
