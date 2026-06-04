import { Link } from "react-router-dom";
import "./App.css";

function App() {
  return (
    <div className="landing">

      {/* Navbar */}
      <nav className="navbar">
        <div className="logo">AIDify</div>

        <div className="nav-links">
          <a href="#">Features</a>
          <a href="#">Subjects</a>
          <a href="#">About</a>
        </div>

        <Link to="/dashboard" className="dashboard-btn">
          Open Dashboard
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="hero">

        <div className="hero-left">

          <div className="badge">
            ⚡ Powered by Claude AI
          </div>

          <h1>
            Learn <br />
            anything, <br />
            <span>your way.</span>
          </h1>

          <p>
            Meet AIDify — the AI tutor built for Kenyan university students.
            Learn in English, Kiswahili, or Sheng and understand difficult
            concepts faster.
          </p>

          <Link to="/register" className="start-btn">
            Start Learning Free
          </Link>

        </div>

        <div className="hero-right">

          <div className="card chat-card">
            <small>AIDify Tutor</small>
            <h4>Just now</h4>
            <p>
              Think of photosynthesis like a kitchen — sunlight is the chef,
              water and CO₂ are the ingredients ✨
            </p>
          </div>

          <div className="card streak-card">
            <h2>🔥 12 days</h2>
            <p>Learning streak</p>
          </div>

          <div className="card lesson-card">
            <small>🟢 Live lesson</small>
            <h3>Calculus: Limits & Continuity</h3>

            <div className="progress">
              <div className="progress-fill"></div>
            </div>

            <p>Lesson 8 of 12</p>
          </div>

        </div>

      </section>

    </div>
  );
}

export default App;
