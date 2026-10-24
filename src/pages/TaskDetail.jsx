import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "../App.css";

const API_URL = "https://fsp-1-assignment-backend-plum.vercel.app/";

function getItems(data, key) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
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
        (item) => getId(item) === taskId
      );

      if (!selectedTask) {
        setError("Task not found.");
        return;
      }

      setTask(selectedTask);
      setProjects(allProjects);
      setTeams(allTeams);
      setUsers(allUsers);
      setTags(allTags);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load task details. Please check your backend API."
      );
    } finally {
      setLoading(false);
    }
  }, [taskId, navigate]);

  useEffect(() => {
    fetchTaskDetails();
  }, [fetchTaskDetails]);

  const markAsComplete = async () => {
    if (!task || task.status === "Completed") return;

    setSaving(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      // Your current backend uses POST /tasks/:id for updating a task.
      const updatedTask = {
        ...task,
        project: getId(task.project),
        team: getId(task.team),
        owners: (task.owners || []).map(getId),
        tags: (task.tags || []).map(getId),
        status: "Completed",
      };

      const response = await axios.post(
        `${API_URL}/tasks/${taskId}`,
        updatedTask,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const returnedTask =
        response.data?.task || response.data?.data || response.data;

      setTask({
        ...task,
        ...(returnedTask &&
        typeof returnedTask === "object" &&
        returnedTask._id
          ? returnedTask
          : {}),
        status: "Completed",
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update the task status."
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
        <div className="alert alert-danger">
          {error || "Task not found."}
        </div>
        <button
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

  const ownerNames = (task.owners || []).map((owner) =>
    getName(owner, users)
  );

  const tagNames = (task.tags || []).map((tag) =>
    getName(tag, tags, typeof tag === "string" ? tag : "Tag")
  );

  const dueDate = task.dueDate
    ? new Date(task.dueDate)
    : null;

  const validDueDate =
    dueDate && !Number.isNaN(dueDate.getTime());

  const daysRemaining = validDueDate
    ? Math.ceil(
        (dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <div className="task-detail-page">
      <header className="task-detail-header">
        <div>
          <Link to="/dashboard" className="task-detail-breadcrumb">
            Dashboard
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

      <div className="task-detail-layout">
        <aside className="task-detail-sidebar">
          <Link
            to={
              projectId
                ? `/projects/${projectId}`
                : "/dashboard"
            }
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
            <strong>
              {task.timeToComplete ?? "—"} hours
            </strong>
          </div>

          {task.status !== "Completed" && (
            <button
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

            <div className="task-detail-field">
              <span>Due Date</span>
              <strong>
                {validDueDate
                  ? dueDate.toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "No due date set"}
              </strong>
            </div>

            <div className="task-detail-field">
              <span>Time Remaining</span>
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
                  ? new Date(task.createdAt).toLocaleDateString(
                      "en-IN"
                    )
                  : "Not available"}
              </strong>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}