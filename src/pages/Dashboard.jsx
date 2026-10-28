import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import "../App.css";

const API_URL = "https://fsp-1-assignment-backend-plum.vercel.app";

function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Read filters from the URL
  const statusFilter = searchParams.get("status") || "All Tasks";
  const teamFilter = searchParams.get("team") || "";
  const ownerFilter = searchParams.get("owner") || "";

  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completingTaskId, setCompletingTaskId] = useState(null);
  const [taskActionMessage, setTaskActionMessage] = useState("");

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };

        const [projectsResponse, tasksResponse, userResponse] =
          await Promise.all([
            axios.get(`${API_URL}/projects`, config),
            axios.get(`${API_URL}/tasks`, config),
            axios.get(`${API_URL}/auth/me`, config),
          ]);

        setProjects(projectsResponse.data.projects || []);
        setTasks(tasksResponse.data.tasks || []);

        const currentUser = userResponse.data.user;

        setUser(currentUser);
        localStorage.setItem("user", JSON.stringify(currentUser));
      } catch (err) {
        console.error(
          "Dashboard loading error:",
          err.response?.data || err.message,
        );

        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
          return;
        }

        setError(
          err.response?.data?.message ||
            "Unable to load dashboard data. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  // Update URL when a status filter is selected
  const handleStatusChange = (selectedStatus) => {
    const newParams = new URLSearchParams(searchParams);

    if (selectedStatus === "All Tasks") {
      newParams.delete("status");
    } else {
      newParams.set("status", selectedStatus);
    }

    setSearchParams(newParams);
  };

  // Get tasks assigned to the logged-in user
  const userId = user?.id || user?._id;

  const myTasks = tasks.filter((task) =>
    (task.owners || []).some((owner) => {
      const ownerId = typeof owner === "string" ? owner : owner?._id;

      return ownerId && userId && ownerId.toString() === userId.toString();
    }),
  );

  // Apply status, team, and owner filters from the URL
  const filteredTasks = myTasks.filter((task) => {
    const matchesStatus =
      statusFilter === "All Tasks" || task.status === statusFilter;

    const taskTeamId =
      typeof task.team === "string" ? task.team : task.team?._id;

    const matchesTeam = !teamFilter || String(taskTeamId || "") === teamFilter;

    const matchesOwner =
      !ownerFilter ||
      (task.owners || []).some((owner) => {
        const id = typeof owner === "string" ? owner : owner?._id;

        return id && String(id) === ownerFilter;
      });

    return matchesStatus && matchesTeam && matchesOwner;
  });

  // Generate user initials
  const getInitials = (name) => {
    if (!name) return "U";

    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  // Mark a task as completed
  const handleMarkComplete = async (taskId) => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setCompletingTaskId(taskId);
      setTaskActionMessage("");

      await axios.post(
        `${API_URL}/tasks/${taskId}`,
        { status: "Completed" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task._id === taskId ? { ...task, status: "Completed" } : task,
        ),
      );

      setTaskActionMessage("Task marked as completed.");
    } catch (err) {
      console.error(
        "Mark task complete error:",
        err.response?.data || err.message,
      );

      setTaskActionMessage(
        err.response?.data?.message ||
          "Unable to mark this task as complete. Please try again.",
      );
    } finally {
      setCompletingTaskId(null);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <h3 className="sidebar-brand">
          Workasana<span>.</span>
        </h3>

        <p className="sidebar-label">WORKSPACE</p>

        <nav className="sidebar-nav">
          <Link to="/dashboard" className="sidebar-link active">
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

          <Link to="/settings" className="sidebar-link">
            <span>⚙</span> Settings
          </Link>
        </nav>

        <div className="sidebar-bottom">
          <div className="user-avatar">{getInitials(user?.name)}</div>

          <div>
            <p className="user-name">{user?.name || "User"}</p>
            <p className="user-role">Team Member</p>
          </div>

          <button
            type="button"
            className="btn btn-outline-secondary btn-sm ms-auto"
            onClick={handleLogout}
            title="Logout"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-subtitle">WORKSPACE OVERVIEW</p>

            <h1>Dashboard</h1>

            <p className="dashboard-description">
              Welcome back, {user?.name || "User"}! Manage your projects and
              keep track of your tasks.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary add-task-button"
            onClick={() => navigate("/projects")}
          >
            + Add New Project
          </button>
        </header>

        {taskActionMessage && (
          <div className="alert alert-info" role="status">
            {taskActionMessage}
          </div>
        )}

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}

            <button
              type="button"
              className="btn btn-sm btn-outline-danger ms-3"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>

            <p className="mt-3">Loading your dashboard...</p>
          </div>
        ) : (
          <>
            {/* Projects */}
            <section className="dashboard-section">
              <div className="section-heading">
                <div>
                  <h2>Projects</h2>
                  <p>Your projects from the database.</p>
                </div>

                <Link to="/projects" className="view-all-link">
                  View all →
                </Link>
              </div>

              <div className="row g-3">
                {projects.length > 0 ? (
                  projects.map((project, index) => (
                    <div className="col-12 col-md-6 col-xl-4" key={project._id}>
                      <article className="project-card">
                        <div className="project-card-top">
                          <div className="project-icon">▤</div>

                          <span
                            className={`project-status ${
                              project.status === "Completed"
                                ? "status-completed"
                                : "status-progress"
                            }`}
                          >
                            {project.status || "Project"}
                          </span>
                        </div>

                        <h3>{project.name}</h3>

                        <p>
                          {project.description || "No description available."}
                        </p>

                        <div className="project-card-footer">
                          <span>Project #{index + 1}</span>

                          <Link
                            to={`/projects/${project._id}`}
                            className="text-decoration-none"
                          >
                            View details →
                          </Link>
                        </div>
                      </article>
                    </div>
                  ))
                ) : (
                  <div className="col-12">
                    <div className="empty-tasks">
                      <h3>No projects found</h3>
                      <p>
                        Projects created in your workspace will appear here.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* My Tasks */}
            <section className="dashboard-section tasks-section">
              <div className="section-heading">
                <div>
                  <h2>My Tasks</h2>
                  <p>Tasks assigned to you.</p>
                </div>

                <span className="task-count">{filteredTasks.length} tasks</span>
              </div>

              {/* Task Filters */}
              <div className="task-filters">
                {[
                  "All Tasks",
                  "To Do",
                  "In Progress",
                  "Completed",
                  "Blocked",
                ].map((filter) => (
                  <button
                    type="button"
                    key={filter}
                    className={`filter-button ${
                      statusFilter === filter ? "filter-active" : ""
                    }`}
                    onClick={() => handleStatusChange(filter)}
                    aria-pressed={statusFilter === filter}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              {/* Task List */}
              <div className="task-list">
                {filteredTasks.length > 0 ? (
                  filteredTasks.map((task) => {
                    const owners = task.owners || [];

                    const ownerNames = owners
                      .map((owner) =>
                        typeof owner === "string" ? "" : owner?.name || "",
                      )
                      .filter(Boolean);

                    return (
                      <article className="task-row" key={task._id}>
                        <div className="task-information">
                          <div className="task-checkbox">
                            {task.status === "Completed" ? "✓" : ""}
                          </div>

                          <div>
                            <h3>{task.name}</h3>
                            <p>Estimated time: {task.timeToComplete} days</p>
                          </div>
                        </div>

                        <div className="task-owner">
                          <div className="owner-avatar">
                            {getInitials(ownerNames[0] || user?.name)}
                          </div>

                          <span>
                            {ownerNames.length > 0
                              ? ownerNames.join(", ")
                              : "Unassigned"}
                          </span>
                        </div>

                        <span
                          className={`task-status ${
                            task.status === "Completed"
                              ? "task-status-completed"
                              : "task-status-progress"
                          }`}
                        >
                          {task.status}
                        </span>

                        <div className="d-flex align-items-center gap-2">
                          <Link
                            to={`/tasks/${task._id}`}
                            className="text-decoration-none"
                          >
                            View →
                          </Link>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <div className="empty-tasks">
                    <h3>No tasks found</h3>

                    <p>
                      {statusFilter === "All Tasks"
                        ? "No tasks are assigned to you yet."
                        : `No tasks with status "${statusFilter}" are assigned to you.`}
                    </p>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
