import { useEffect, useState } from "react";
import axios from "axios";

function AnalyticsCards() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/analytics`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setStats(res.data);
    };

    fetchAnalytics();
  }, []);

  if (!stats) return null;

  return (
    <div className="analytics-grid">
      <div className="card">
        <h3>💬 Chats</h3>
        <h1>{stats.totalChats}</h1>
      </div>

      <div className="card">
        <h3>🔥 Streak</h3>
        <h1>{stats.streak}</h1>
      </div>

      <div className="card">
        <h3>🎯 Mastery</h3>
        <h1>{stats.masteryScore}%</h1>
      </div>

      <div className="card">
        <h3>📚 Strongest</h3>
        <h1>{stats.strongestSubject}</h1>
      </div>
    </div>
  );
}

export default AnalyticsCards;