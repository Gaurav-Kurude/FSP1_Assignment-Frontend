import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../App.css";

const API_URL = "https://fsp-1-assignment-backend-plum.vercel.app";

export default function Settings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const userData = response.data.user || response.data;
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load user details.");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (loading) {
    return <main className="settings-page">Loading user details...</main>;
  }

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <h3 className="sidebar-brand">
          Workasana<span>.</span>
        </h3>

        <p className="sidebar-label">WORKSPACE</p>

        <nav className="sidebar-nav">
          <Link to="/dashboard" className="sidebar-link">
            <span>▦</span> Dashboard
          </Link>
          <Link to="/projects" className="sidebar-link">
            <span>▤</span> Projects
          </Link>
          <Link to="/teams" className="sidebar-link">
            <span>♧</span> Team Management
          </Link>
          <Link to="/reports" className="sidebar-link">
            <span>▥</span> Reports
          </Link>
          <Link to="/settings" className="sidebar-link active">
            <span>⚙</span> Settings
          </Link>
        </nav>

        <div className="sidebar-bottom">
          <div className="user-avatar">
            {(user.name || "U").charAt(0).toUpperCase()}
          </div>
          <div>
            <strong>{user.name || "User"}</strong>
            <p>{user.email || "Email unavailable"}</p>
          </div>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </aside>

      <main className="settings-page">
        <header className="settings-header">
          <p>ACCOUNT SETTINGS</p>
          <h1>My Profile</h1>
          <p>View your account information below.</p>
        </header>

        <section className="settings-card">
          <div className="settings-avatar">
            {(user.name || "U").charAt(0).toUpperCase()}
          </div>

          <h2>{user.name || "Name unavailable"}</h2>
          <p>{user.email || "Email unavailable"}</p>

          <hr />

          <div className="settings-info">
            <div>
              <span>Full Name</span>
              <strong>{user.name || "Not available"}</strong>
            </div>

            <div>
              <span>Email Address</span>
              <strong>{user.email || "Not available"}</strong>
            </div>

            <div>
              <span>User ID</span>
              <strong>{user.id || user._id || "Not available"}</strong>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
