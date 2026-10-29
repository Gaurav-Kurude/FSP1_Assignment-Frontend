import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import axios from "axios";

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "https://fsp-1-assignment-backend-plum.vercel.app"
).replace(/\/+$/, "");

function Projects() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(`${API_URL}/projects`, {
        headers: getHeaders(),
      });

      setProjects(response.data.projects || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load projects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const resetForm = () => {
    setName("");
    setDescription("");
    setEditingId(null);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Please enter a project name.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (editingId) {
        await axios.put(
          `${API_URL}/projects/${editingId}`,
          {
            name: name.trim(),
            description: description.trim(),
          },
          { headers: getHeaders() },
        );

        setMessage("Project updated successfully.");
      } else {
        await axios.post(
          `${API_URL}/projects`,
          {
            name: name.trim(),
            description: description.trim(),
          },
          { headers: getHeaders() },
        );

        setMessage("Project created successfully.");
      }

      resetForm();
      await fetchProjects();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (editingId
            ? "Unable to update project."
            : "Unable to create project."),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (project) => {
    setEditingId(project._id);
    setName(project.name || "");
    setDescription(project.description || "");
    setError("");
    setMessage("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (project) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${project.name}"?`,
    );

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      await axios.delete(`${API_URL}/projects/${project._id}`, {
        headers: getHeaders(),
      });

      setProjects((current) =>
        current.filter((item) => item._id !== project._id),
      );

      if (editingId === project._id) {
        resetForm();
      }

      setMessage("Project deleted successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete project.");
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <div className="container-fluid py-4">
          {/* Centered page heading */}
          <div className="projects-page-header mb-4">
            <h1>Projects</h1>
            <p className="text-muted">
              Create and manage your Workasana projects.
            </p>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          {message && (
            <div className="alert alert-success" role="status">
              {message}
            </div>
          )}

          {/* Create or edit project form */}
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h5 className="card-title mb-3">
                {editingId ? "Edit Project" : "Create New Project"}
              </h5>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="projectName" className="form-label">
                    Project Name
                  </label>

                  <input
                    id="projectName"
                    type="text"
                    className="form-control"
                    placeholder="Enter project name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="projectDescription" className="form-label">
                    Description
                  </label>

                  <textarea
                    id="projectDescription"
                    className="form-control"
                    placeholder="Enter project description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows="3"
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary me-2"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Save Changes"
                      : "Create Project"}
                </button>

                {editingId && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={resetForm}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                )}
              </form>
            </div>
          </div>

          {/* All projects */}
          <h4 className="mb-3">All Projects ({projects.length})</h4>

          {loading ? (
            <p>Loading projects...</p>
          ) : projects.length === 0 ? (
            <div className="alert alert-info">
              No projects found. Create your first project above.
            </div>
          ) : (
            <div className="row g-3">
              {projects.map((project) => (
                <div className="col-12 col-md-6 col-xl-4" key={project._id}>
                  <div className="card h-100 shadow-sm">
                    <div className="card-body">
                      <h5 className="card-title">{project.name}</h5>

                      <p className="card-text text-muted">
                        {project.description || "No description provided."}
                      </p>

                      <div className="d-flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => navigate(`/projects/${project._id}`)}
                        >
                          View Project
                        </button>

                        <button
                          type="button"
                          className="btn btn-outline-warning btn-sm"
                          onClick={() => handleEdit(project)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleDelete(project)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Projects;
