import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../App.css";
import Sidebar from "../components/Sidebar";

const API_URL = "https://fsp-1-assignment-backend-plum.vercel.app";

export default function TeamManagement() {
  const navigate = useNavigate();

  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const getConfig = () => {
    const token = localStorage.getItem("token");

    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await axios.get(`${API_URL}/teams`, getConfig());

      const teamData = Array.isArray(response.data)
        ? response.data
        : response.data?.teams || response.data?.data || [];

      setTeams(teamData);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load teams. Please check your backend.",
      );
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.name.trim()) {
      setError("Please enter a team name.");
      return;
    }

    try {
      setSaving(true);

      const response = await axios.post(
        `${API_URL}/teams`,
        {
          name: formData.name.trim(),
          description: formData.description.trim(),
        },
        getConfig(),
      );

      const createdTeam = response.data?.team || response.data?.data;

      if (createdTeam?._id) {
        setTeams((previous) => [...previous, createdTeam]);
      } else {
        await fetchTeams();
      }

      setFormData({
        name: "",
        description: "",
      });

      setShowForm(false);
      setSuccess("Team created successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to create the team. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="team-management-page">
      <Sidebar />
      <header className="team-management-header">
        <div>
          <p className="team-eyebrow">WORKASANA / ORGANIZATION</p>
          <h1>Teams Management</h1>
          <p>Manage your teams and keep everyone organized.</p>
        </div>

        <button
          className="btn btn-primary team-add-button"
          onClick={() => {
            setError("");
            setSuccess("");
            setShowForm((previous) => !previous);
          }}
        >
          {showForm ? "Cancel" : "+ Add New Team"}
        </button>
      </header>

      <div className="team-management-layout">
        <aside className="team-management-sidebar">
          <Link to="/dashboard" className="btn btn-outline-secondary w-100">
            ← Back to Dashboard
          </Link>

          <div className="team-sidebar-summary">
            <span>Total Teams</span>
            <strong>{teams.length}</strong>
          </div>

          <div className="team-sidebar-summary">
            <span>Management</span>
            <strong>Teams</strong>
          </div>
        </aside>

        <main className="team-management-content">
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success" role="status">
              {success}
            </div>
          )}

          {showForm && (
            <section className="team-form-card">
              <h2>Add a New Team</h2>
              <p>Enter the details of the team you want to create.</p>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="teamName" className="form-label">
                    Team Name *
                  </label>

                  <input
                    id="teamName"
                    type="text"
                    name="name"
                    className="form-control"
                    placeholder="e.g. Development Team"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    maxLength={100}
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="teamDescription" className="form-label">
                    Description
                  </label>

                  <textarea
                    id="teamDescription"
                    name="description"
                    className="form-control"
                    placeholder="What does this team work on?"
                    rows="3"
                    value={formData.description}
                    onChange={handleChange}
                    maxLength={500}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? "Creating..." : "Create Team"}
                </button>

                <button
                  type="button"
                  className="btn btn-light ms-2"
                  onClick={() => {
                    setShowForm(false);
                    setError("");
                  }}
                  disabled={saving}
                >
                  Cancel
                </button>
              </form>
            </section>
          )}

          <div className="team-list-heading">
            <div>
              <h2>Teams List</h2>
              <p>All teams in your workspace.</p>
            </div>

            <button
              className="btn btn-outline-primary"
              onClick={fetchTeams}
              disabled={loading}
            >
              {loading ? "Loading..." : "↻ Refresh"}
            </button>
          </div>

          {loading ? (
            <div className="team-empty-state">Loading teams...</div>
          ) : teams.length === 0 ? (
            <div className="team-empty-state">
              <div className="team-empty-icon">👥</div>
              <h3>No teams yet</h3>
              <p>Create your first team to get started.</p>

              <button
                className="btn btn-primary"
                onClick={() => setShowForm(true)}
              >
                + Add New Team
              </button>
            </div>
          ) : (
            <div className="team-card-grid">
              {teams.map((team) => (
                <article className="team-card" key={team._id}>
                  <div className="team-card-top">
                    <div className="team-avatar">
                      {(team.name || "T").trim().charAt(0).toUpperCase()}
                    </div>

                    <span className="team-card-label">TEAM</span>
                  </div>

                  <h3>{team.name}</h3>

                  <p className="team-card-description">
                    {team.description || "No description provided."}
                  </p>

                  <div className="team-card-footer">
                    <span>
                      <span aria-hidden="true">👥</span> Workasana Team
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
