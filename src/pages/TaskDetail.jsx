import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "../App.css";

const API_URL = "https://fsp-1-assignment-backend-plum.vercel.app";

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

  // Handle a date-only value without shifting the calendar date
  // because of timezone conversion.
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
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchTaskDetails = useCallback(async () => {
    setLoading(true);
    setError("");
    setSuccess("");

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

      if (!selectedTask) {
        setTask(null);
        setError("Task not found.");
        return;
      }

      setTask(selectedTask);
      setProjects(allProjects);
      setTeams(allTeams);
      setUsers(allUsers);
      setTags(allTags);
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

  const markAsComplete = async () => {
    if (!task || task.status === "Completed" || saving) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

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

      // Use the returned task so the displayed data stays in sync.
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

  // Read the saved due date from the task returned by the backend.
  const dueDate = formatDate(task.dueDate);

  // Compare calendar days to avoid incorrect results caused by
  // the current time of day.
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
            className="btn btn-outline-secondary w-100"
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

          {task.status !== "Completed" && (
            <button
              type="button"
              className="btn btn-success w-100"
              onClick={markAsComplete}
              disabled={saving}
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

            {/* Due date */}
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

            {/* Status */}
            <div className="task-detail-field">
              <span>Status</span>

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
        </main>
      </div>
    </div>
  );
}
