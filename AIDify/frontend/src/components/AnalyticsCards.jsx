import { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

function AnalyticsCards({ analytics }) {
  const weeklyData = useMemo(
    () => ({
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [
        {
          label: "Weekly activity",
          data: [4, 6, 2, 7, 5, 3, 4],
          backgroundColor: "#7c5cff",
          borderRadius: 12,
          maxBarThickness: 26,
        },
      ],
    }),
    []
  );

  const weeklyOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: "#6a6f8c" },
        },
        y: {
          grid: { color: "rgba(116, 84, 244, 0.12)" },
          ticks: { color: "#6a6f8c", precision: 0 },
        },
      },
    }),
    []
  );

  if (!analytics) return null;

  return (
    <>
      <div className="analytics-grid">
        <div className="card">
          <h3>💬 Chats</h3>
          <h1>{analytics.totalChats}</h1>
        </div>

        <div className="card">
          <h3>🔥 Streak</h3>
          <h1>{analytics.streak}</h1>
        </div>

        <div className="card">
          <h3>🎯 Mastery</h3>
          <h1>{analytics.masteryScore}%</h1>
        </div>

        <div className="card">
          <h3>📚 Strongest</h3>
          <h1>{analytics.strongestSubject}</h1>
        </div>
      </div>

      <div className="analytics-chart-panel card">
        <div className="analytics-chart-header">
          <h3>Weekly Learning Activity</h3>
        </div>
        <div className="analytics-chart-wrapper">
          <Bar data={weeklyData} options={weeklyOptions} />
        </div>
      </div>
    </>
  );
}

export default AnalyticsCards;