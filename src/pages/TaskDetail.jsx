import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "../App.css";

const API_URL = "https://fsp-1-assignment-backend-plum.vercel.app";

const TASK_STATUSES = ["To Do", "In Progress", "Completed", "Blocked"];

function getItems(data, key) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function getId(value) {
  if (!value) return "";

  if (typeof value === "object") {
    return String(value._id || value.id || "");
  }

  return String(value);
}

function getName(value, items, fallback = "Not available") {
  if (!value) return fallback;

  if (typeof value === "object") {
    return value.name || value.email || fallback;
  }

  const found = items.find((item) => getId(item) === String(value));
  return found?.name || found?.email || fallback;
}

function formatDate(value) {
  if (!value) return null;

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    return date;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

// Format a date for an HTML input[type="date"] without timezone shifting.
function toDateInputValue(value) {
  if (!value) return "";

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }

  const date = formatDate(value);
  if (!date) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function TaskDetail() {
  const { taskId } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [tags, setTags] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editForm, setEditForm] = useState({
    name: "",
    project: "",
    team: "",
    owners: [],
    tags: [],
    status: "To Do",
    timeToComplete: "",
    dueDate: "",
  });

  const fetchTaskDetails = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const [
        tasksResponse,
        projectsResponse,
        teamsResponse,
        usersResponse,
        tagsResponse,
      ] = await Promise.all([
        axios.get(`${API_URL}/tasks`, config),
        axios.get(`${API_URL}/projects`, config),
        axios.get(`${API_URL}/teams`, config),
        axios.get(`${API_URL}/users`, config),
        axios.get(`${API_URL}/tags`, config),
      ]);

      const allTasks = getItems(tasksResponse.data, "tasks");
      const allProjects = getItems(projectsResponse.data, "projects");
      const allTeams = getItems(teamsResponse.data, "teams");
      const allUsers = getItems(usersResponse.data, "users");
      const allTags = getItems(tagsResponse.data, "tags");

      const selectedTask = allTasks.find(
        (item) => getId(item) === String(taskId),
      );

      setProjects(allProjects);
      setTeams(allTeams);
      setUsers(allUsers);
      setTags(allTags);

      if (!selectedTask) {
        setTask(null);
        setError("Task not found.");
        return;
      }

      setTask(selectedTask);
    } catch (err) {
      console.error(
        "Fetch task details error:",
        err.response?.data || err.message,
      );

      setError(
        err.response?.data?.message ||
          "Unable to load task details. Please check your backend API.",
      );
    } finally {
      setLoading(false);
    }
  }, [taskId, navigate]);

  useEffect(() => {
    fetchTaskDetails();
  }, [fetchTaskDetails]);

  // Open the edit form with the task's current values.
  const handleEditClick = () => {
    if (!task) return;

    setEditForm({
      name: task.name || "",
      project: getId(task.project),
      team: getId(task.team),
      owners: (task.owners || []).map(getId).filter(Boolean),
      tags: (task.tags || []).map(getId).filter(Boolean),
      status: task.status || "To Do",
      timeToComplete: task.timeToComplete ?? "",
      dueDate: toDateInputValue(task.dueDate),
    });

    setIsEditing(true);
    setError("");
    setSuccess("");
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setEditForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleMultiSelectChange = (event) => {
    const { name, options } = event.target;

    const selectedValues = Array.from(options)
      .filter((option) => option.selected)
      .map((option) => option.value);

    setEditForm((current) => ({
      ...current,
      [name]: selectedValues,
    }));
  };

  // Save the edited task.
  const handleSaveChanges = async (event) => {
    event.preventDefault();

    if (!task || saving) return;

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    const timeRequired = Number(editForm.timeToComplete);

    if (!editForm.name.trim()) {
      setError("Task name is required.");
      return;
    }

    if (!editForm.project || !editForm.team) {
      setError("Please select a project and a team.");
      return;
    }

    if (!Number.isFinite(timeRequired) || timeRequired <= 0) {
      setError("Time required must be greater than zero.");
      return;
    }

    if (!TASK_STATUSES.includes(editForm.status)) {
      setError("Please select a valid task status.");
      return;
    }

    // Only send editable fields, not MongoDB metadata such as _id or timestamps.
    const updatedTask = {
      name: editForm.name.trim(),
      project: editForm.project,
      team: editForm.team,
      owners: editForm.owners,
      tags: editForm.tags,
      status: editForm.status,
      timeToComplete: timeRequired,
      dueDate: editForm.dueDate || null,
    };

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await axios.post(
        `${API_URL}/tasks/${taskId}`,
        updatedTask,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      // Reload from the backend so displayed names and relationships are fresh.
      await fetchTaskDetails();

      setIsEditing(false);
      setSuccess(
        response.data?.message || "Task details updated successfully.",
      );
    } catch (err) {
      console.error("Update task error:", err.response?.data || err.message);

      setError(
        err.response?.data?.message ||
          "Unable to update task details. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  // Preserve the existing Mark as Complete action.
  const markAsComplete = async () => {
    if (!task || task.status === "Completed" || saving) return;

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await axios.post(
        `${API_URL}/tasks/${taskId}`,
        { status: "Completed" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      setTask((currentTask) =>
        currentTask
          ? {
              ...currentTask,
              ...(response.data?.task || {}),
              status: "Completed",
            }
          : currentTask,
      );

      setSuccess(response.data?.message || "Task marked as completed.");
    } catch (err) {
      console.error(
        "Mark task complete error:",
        err.response?.data || err.message,
      );

      setError(
        err.response?.data?.message ||
          "Unable to update the task status. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="task-detail-page">
        <p>Loading task details...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="task-detail-page">
        <div className="alert alert-danger" role="alert">
          {error || "Task not found."}
        </div>

        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => navigate("/dashboard")}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const projectId = getId(task.project);
  const projectName = getName(task.project, projects);
  const teamName = getName(task.team, teams);

  const ownerNames = (task.owners || []).map((owner) => getName(owner, users));

  const tagNames = (task.tags || []).map((tag) =>
    getName(tag, tags, typeof tag === "string" ? tag : "Tag"),
  );

  const dueDate = formatDate(task.dueDate);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDateDay = dueDate ? new Date(dueDate) : null;
  dueDateDay?.setHours(0, 0, 0, 0);

  const daysRemaining =
    dueDateDay && !Number.isNaN(dueDateDay.getTime())
      ? Math.round(
          (dueDateDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        )
      : null;

  return (
    <div className="task-detail-page">
      <header className="task-detail-header">
        <div>
          <Link to="/dashboard" className="task-detail-brand">
            Workasana<span>.</span>
          </Link>

          <h1>Task: {task.name}</h1>
          <p>View and manage your task details.</p>
        </div>

        <span
          className={`task-status-badge ${
            task.status === "Completed" ? "completed" : "in-progress"
          }`}
        >
          {task.status}
        </span>
      </header>

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

      <div className="task-detail-layout">
        <aside className="task-detail-sidebar">
          <Link
            to={projectId ? `/projects/${projectId}` : "/dashboard"}
            className="btn btn-outline-secondary w-100 mb-3"
          >
            ← Back to Project
          </Link>

          <div className="task-sidebar-info">
            <span>Current Status</span>
            <strong>{task.status}</strong>
          </div>

          <div className="task-sidebar-info">
            <span>Time Required</span>
            <strong>{task.timeToComplete ?? "—"} days</strong>
          </div>

          <button
            type="button"
            className="btn btn-primary w-100 mb-2"
            onClick={handleEditClick}
            disabled={saving}
          >
            Edit Task
          </button>

          {task.status !== "Completed" && (
            <button
              type="button"
              className="btn btn-success w-100"
              onClick={markAsComplete}
              disabled={saving || isEditing}
            >
              {saving ? "Updating..." : "✓ Mark as Complete"}
            </button>
          )}

          {task.status === "Completed" && (
            <div className="task-completed-message">
              ✓ This task is completed.
            </div>
          )}
        </aside>

        <main className="task-detail-content">
          {isEditing ? (
            <form onSubmit={handleSaveChanges}>
              <h2>Edit Task Details</h2>

              <div className="mb-3">
                <label htmlFor="taskName" className="form-label">
                  Task Name
                </label>
                <input
                  id="taskName"
                  name="name"
                  type="text"
                  className="form-control"
                  value={editForm.name}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="mb-3">
                <label htmlFor="taskProject" className="form-label">
                  Project
                </label>
                <select
                  id="taskProject"
                  name="project"
                  className="form-select"
                  value={editForm.project}
                  onChange={handleFormChange}
                  required
                >
                  <option value="">Select project</option>
                  {projects.map((project) => (
                    <option key={getId(project)} value={getId(project)}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label htmlFor="taskTeam" className="form-label">
                  Team
                </label>
                <select
                  id="taskTeam"
                  name="team"
                  className="form-select"
                  value={editForm.team}
                  onChange={handleFormChange}
                  required
                >
                  <option value="">Select team</option>
                  {teams.map((team) => (
                    <option key={getId(team)} value={getId(team)}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label htmlFor="taskOwners" className="form-label">
                  Owners
                </label>
                <select
                  id="taskOwners"
                  name="owners"
                  className="form-select"
                  multiple
                  value={editForm.owners}
                  onChange={handleMultiSelectChange}
                >
                  {users.map((user) => (
                    <option key={getId(user)} value={getId(user)}>
                      {user.name || user.email}
                    </option>
                  ))}
                </select>
                <small className="text-muted">
                  Hold Ctrl (Windows) or Command (Mac) to select multiple
                  owners.
                </small>
              </div>

              <div className="mb-3">
                <label htmlFor="taskTags" className="form-label">
                  Tags
                </label>
                <select
                  id="taskTags"
                  name="tags"
                  className="form-select"
                  multiple
                  value={editForm.tags}
                  onChange={handleMultiSelectChange}
                >
                  {tags.map((tag) => (
                    <option key={getId(tag)} value={getId(tag)}>
                      {tag.name}
                    </option>
                  ))}
                </select>
                <small className="text-muted">Select one or more tags.</small>
              </div>

              <div className="mb-3">
                <label htmlFor="taskStatus" className="form-label">
                  Status
                </label>
                <select
                  id="taskStatus"
                  name="status"
                  className="form-select"
                  value={editForm.status}
                  onChange={handleFormChange}
                  required
                >
                  {TASK_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label htmlFor="taskTime" className="form-label">
                  Time Required (days)
                </label>
                <input
                  id="taskTime"
                  name="timeToComplete"
                  type="number"
                  min="1"
                  className="form-control"
                  value={editForm.timeToComplete}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="mb-3">
                <label htmlFor="taskDueDate" className="form-label">
                  Due Date
                </label>
                <input
                  id="taskDueDate"
                  name="dueDate"
                  type="date"
                  className="form-control"
                  value={editForm.dueDate}
                  onChange={handleFormChange}
                />
              </div>

              <button
                type="submit"
                className="btn btn-success me-2"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>

              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => {
                  setIsEditing(false);
                  setError("");
                }}
                disabled={saving}
              >
                Cancel
              </button>
            </form>
          ) : (
            <>
              <h2>Task Details</h2>

              <div className="task-detail-grid">
                <div className="task-detail-field">
                  <span>Task Name</span>
                  <strong>{task.name}</strong>
                </div>

                <div className="task-detail-field">
                  <span>Project</span>
                  <strong>{projectName}</strong>
                </div>

                <div className="task-detail-field">
                  <span>Team</span>
                  <strong>{teamName}</strong>
                </div>

                <div className="task-detail-field">
                  <span>Owners</span>
                  <strong>
                    {ownerNames.length
                      ? ownerNames.join(", ")
                      : "No owners assigned"}
                  </strong>
                </div>

                <div className="task-detail-field">
                  <span>Tags</span>
                  <div className="task-detail-tags">
                    {tagNames.length ? (
                      tagNames.map((tag, index) => (
                        <span key={`${tag}-${index}`} className="task-tag">
                          {tag}
                        </span>
                      ))
                    ) : (
                      <strong>No tags</strong>
                    )}
                  </div>
                </div>

                <div className="task-detail-field">
                  <span>Due Date</span>
                  <strong>
                    {dueDate
                      ? dueDate.toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "No due date set"}
                  </strong>
                </div>

                <div className="task-detail-field">
                  <span>Deadline</span>
                  <strong>
                    {task.status === "Completed"
                      ? "Completed"
                      : daysRemaining === null
                        ? "Not available"
                        : daysRemaining < 0
                          ? `${Math.abs(daysRemaining)} day(s) overdue`
                          : daysRemaining === 0
                            ? "Due today"
                            : `${daysRemaining} day(s) remaining`}
                  </strong>
                </div>

                <div className="task-detail-field">
                  <span>Created On</span>
                  <strong>
                    {task.createdAt
                      ? new Date(task.createdAt).toLocaleDateString("en-IN")
                      : "Not available"}
                  </strong>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
