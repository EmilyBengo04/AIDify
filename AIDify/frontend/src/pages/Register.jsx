import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { FaApple, FaGoogle } from "react-icons/fa";
import {
  FiEyeOff,
  FiLock,
  FiMail,
  FiUser,
  FiZap,
} from "react-icons/fi";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const registerUser = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/register",
        form
      );

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      navigate("/dashboard");
    } catch (err) {
      alert(err.response?.data?.message);
    }
  };

  return (
    <div className="auth-page">
      <nav className="auth-nav">
        <Link to="/" className="auth-brand">
          <span className="auth-brand-mark">
            <FiZap />
          </span>
          <span>AIDY</span>
        </Link>

        <div className="auth-nav-links">
          <a href="#">Features</a>
          <a href="#">Subjects</a>
          <a href="#">Pricing</a>
        </div>

        <Link to="/dashboard" className="auth-dashboard-link">
          Open Dashboard
        </Link>
      </nav>

      <main className="auth-main">
        <section className="auth-hero">
          <div className="auth-badge">
            <FiZap />
            <span>Powered by next-gen AI</span>
          </div>

          <h1>
            Learn <br />
            anything, <br />
            <span>your way.</span>
          </h1>

          <p>
            Meet AIDY — the AI tutor that adapts to your pace, explains like a
            friend, and turns every "huh?" into "aha!"
          </p>

          <div className="auth-floating-cards">
            <div className="auth-mini-card tutor-card">
              <small>AIDY Tutor</small>
              <strong>Just now</strong>
              <p>
                Think of photosynthesis like a kitchen — sunlight is the chef,
                water and CO₂ are the ingredients ✨
              </p>
            </div>

            <div className="auth-mini-card streak-card-auth">
              <span>🏆</span>
              <strong>12 day</strong>
              <p>learning streak 🔥</p>
            </div>

            <div className="auth-mini-card lesson-card-auth">
              <small><span></span> Live lesson</small>
              <strong>Calculus: Limits & Continuity</strong>
              <div className="auth-progress">
                <span></span>
              </div>
              <p>Lesson 8 of 12</p>
            </div>
          </div>
        </section>

        <section className="auth-card">
          <h2>Create your account</h2>
          <p>Start your learning journey with AIDY</p>

          <form onSubmit={registerUser} className="auth-form">
            <label>
              <span>Full name</span>
              <div className="auth-field">
                <FiUser />
                <input
                  type="text"
                  placeholder="Enter your full name"
                  name="name"
                  onChange={handleChange}
                />
              </div>
            </label>

            <label>
              <span>Email address</span>
              <div className="auth-field">
                <FiMail />
                <input
                  type="email"
                  placeholder="Enter your email"
                  name="email"
                  onChange={handleChange}
                />
              </div>
            </label>

            <label>
              <span>Password</span>
              <div className="auth-field">
                <FiLock />
                <input
                  type="password"
                  placeholder="Create a password"
                  name="password"
                  onChange={handleChange}
                />
                <FiEyeOff />
              </div>
            </label>

            <button type="submit" className="auth-submit">
              Create account
            </button>
          </form>

          <div className="auth-divider">
            <span></span>
            <p>or continue with</p>
            <span></span>
          </div>

          <button type="button" className="auth-social">
            <FaGoogle />
            Continue with Google
          </button>

          <button type="button" className="auth-social">
            <FaApple />
            Continue with Apple
          </button>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </section>
      </main>
    </div>
  );
}
