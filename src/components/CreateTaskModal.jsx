import { useEffect, useState } from "react";
import axios from "axios";
import "../App.css";

const API_URL = "https://fsp-1-assignment-backend-plum.vercel.app";

function CreateTaskModal({ projectId, projectName, onClose, onTaskCreated }) {
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [tags, setTags] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    team: "",
    owners: [],
    tags: [],
    dueDate: "",
    timeToComplete: "",
  });

  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Load teams, users, and tags
  useEffect(() => {
    const fetchOptions = async () => {
      const token = localStorage.getItem("token");

      try {
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };

        const [teamResponse, tagResponse] = await Promise.all([
          axios.get(`${API_URL}/teams`, config),
          axios.get(`${API_URL}/tags`, config),
        ]);

        setTeams(teamResponse.data.teams || []);
        setTags(tagResponse.data.tags || []);

        // This requires a GET /users endpoint in your backend.
        // If you don't have that endpoint, add it before enabling
        // the owners dropdown.
        const userResponse = await axios.get(`${API_URL}/users`, config);

        setUsers(userResponse.data.users || []);
      } catch (err) {
        console.error("Failed to load task options:", err);

        setError(
          "Could not load teams, users, or tags. Check your backend APIs and login token.",
        );
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchOptions();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleMultiSelect = (event) => {
    const { name, selectedOptions } = event.target;

    const values = Array.from(selectedOptions, (option) => option.value);

    setFormData((previous) => ({
      ...previous,
      [name]: values,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!projectId) {
      setError("Please select a project before creating a task.");
      return;
    }

    if (!formData.team || formData.owners.length === 0) {
      setError("Please select a team and at least one owner.");
      return;
    }

    const timeToComplete = Number(formData.timeToComplete);

    if (!Number.isFinite(timeToComplete) || timeToComplete <= 0) {
      setError("Estimated time must be greater than zero.");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setError("Please log in before creating a task.");
      return;
    }

    try {
      setSubmitting(true);

      const taskData = {
        name: formData.name.trim(),
        project: projectId,
        team: formData.team,
        owners: formData.owners,
        tags: formData.tags,
        timeToComplete,
        status: "To Do",
      };

      // Include dueDate only after the backend schema and API support it.
      // taskData.dueDate = formData.dueDate;

      const response = await axios.post(`${API_URL}/tasks`, taskData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      onTaskCreated?.(response.data);
      onClose();
    } catch (err) {
      console.error("Create task error:", err);

      setError(
        err.response?.data?.message ||
          "Could not create the task. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="task-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="task-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-task-title"
      >
        <div className="task-modal-header">
          <div>
            <p className="dashboard-subtitle">TASK MANAGEMENT</p>

            <h2 id="create-task-title">Create New Task</h2>

            <p className="task-modal-project">
              For project: <strong>{projectName || "Selected Project"}</strong>
            </p>
          </div>

          <button
            type="button"
            className="task-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        {error && (
          <div className="alert alert-danger py-2" role="alert">
            {error}
          </div>
        )}

        {loadingOptions ? (
          <p className="text-center py-4">Loading form options...</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="task-name" className="form-label">
                Task Name
              </label>

              <input
                id="task-name"
                name="name"
                type="text"
                className="form-control"
                placeholder="Enter task name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="task-team" className="form-label">
                Team
              </label>

              <select
                id="task-team"
                name="team"
                className="form-select"
                value={formData.team}
                onChange={handleChange}
                required
              >
                <option value="">Select a team</option>

                {teams.map((team) => (
                  <option key={team._id} value={team._id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label htmlFor="task-owners" className="form-label">
                Owners
              </label>

              <select
                id="task-owners"
                name="owners"
                className="form-select task-multi-select"
                multiple
                value={formData.owners}
                onChange={handleMultiSelect}
                required
              >
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>

              <small className="text-muted">
                Hold Ctrl (Windows) or Command (Mac) to select multiple owners.
              </small>
            </div>

            <div className="mb-3">
              <label htmlFor="task-tags" className="form-label">
                Tags
              </label>

              <select
                id="task-tags"
                name="tags"
                className="form-select task-multi-select"
                multiple
                value={formData.tags}
                onChange={handleMultiSelect}
              >
                {tags.map((tag) => (
                  <option key={tag._id} value={tag._id}>
                    {tag.name}
                  </option>
                ))}
              </select>

              <small className="text-muted">Select one or more tags.</small>
            </div>

            <div className="row">
              <div className="col-12 col-md-6 mb-3">
                <label htmlFor="task-due-date" className="form-label">
                  Due Date
                </label>

                <input
                  id="task-due-date"
                  name="dueDate"
                  type="date"
                  className="form-control"
                  value={formData.dueDate}
                  onChange={handleChange}
                />
              </div>

              <div className="col-12 col-md-6 mb-3">
                <label htmlFor="task-time" className="form-label">
                  Time (Days)
                </label>

                <input
                  id="task-time"
                  name="timeToComplete"
                  type="number"
                  className="form-control"
                  placeholder="e.g. 3"
                  min="1"
                  step="1"
                  value={formData.timeToComplete}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="task-modal-actions">
              <button
                type="button"
                className="btn btn-light"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn btn-primary add-task-button"
                disabled={submitting || loadingOptions}
              >
                {submitting ? "Creating..." : "Create Task"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default CreateTaskModal;
