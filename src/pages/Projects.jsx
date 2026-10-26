import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

function Projects() {
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
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

      await axios.post(
        `${API_URL}/projects`,
        {
          name: name.trim(),
          description: description.trim(),
        },
        { headers: getHeaders() },
      );

      setName("");
      setDescription("");
      setMessage("Project created successfully!");

      await fetchProjects();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create project.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Projects</h1>
          <p className="text-muted">
            Create and manage your Workasana projects.
          </p>
        </div>

        <Link to="/dashboard" className="btn btn-outline-secondary">
          Back to Dashboard
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h5 className="card-title mb-3">Create New Project</h5>

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

            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Creating..." : "Create Project"}
            </button>
          </form>
        </div>
      </div>

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
            <div className="col-md-6 col-lg-4" key={project._id}>
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">{project.name}</h5>
                  <p className="card-text text-muted">
                    {project.description || "No description provided."}
                  </p>

                  <Link
                    to={`/projects/${project._id}`}
                    className="btn btn-outline-primary btn-sm"
                  >
                    View Project
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Projects;
