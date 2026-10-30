import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../App.css";
import Sidebar from "../components/Sidebar";

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

  if (loading) {
    return (
      <main className="settings-page">
        <div className="settings-loading">
          <i className="bi bi-arrow-repeat"></i>
          Loading user details...
        </div>
      </main>
    );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="settings-page">
        <header className="settings-header">
          <p>
            <i className="bi bi-gear"></i> ACCOUNT SETTINGS
          </p>

          <h1>My Profile</h1>

          <p>View your account information below.</p>
        </header>

        {error && (
          <div className="settings-error">
            <i className="bi bi-exclamation-circle"></i>
            {error}
          </div>
        )}

        <section className="settings-card">
          <div className="settings-avatar">
            {(user.name || "U").charAt(0).toUpperCase()}
          </div>

          <h2>{user.name || "Name unavailable"}</h2>

          <p>
            <i className="bi bi-envelope"></i>{" "}
            {user.email || "Email unavailable"}
          </p>

          <hr />

          <div className="settings-info">
            <div>
              <span>
                <i className="bi bi-person"></i> Full Name
              </span>
              <strong>{user.name || "Not available"}</strong>
            </div>

            <div>
              <span>
                <i className="bi bi-envelope"></i> Email Address
              </span>
              <strong>{user.email || "Not available"}</strong>
            </div>

            <div>
              <span>
                <i className="bi bi-fingerprint"></i> User ID
              </span>
              <strong>{user.id || user._id || "Not available"}</strong>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
