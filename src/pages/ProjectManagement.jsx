import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import CreateTaskModal from "../components/CreateTaskModal";
import "../App.css";

const API_URL = "https://fsp-1-assignment-backend-plum.vercel.app";

function ProjectManagement() {
  const { projectId } = useParams();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [tags, setTags] = useState([]);

  const [ownerFilter, setOwnerFilter] = useState("All Owners");
  const [tagFilter, setTagFilter] = useState("All Tags");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [sortBy, setSortBy] = useState("default");

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProjectData = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Please log in to view this project.");
      setLoading(false);
      return;
    }

    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    try {
      setError("");
      setLoading(true);

      const [projectResponse, taskResponse, tagResponse] = await Promise.all([
        axios.get(`${API_URL}/projects/${projectId}`, config),
        axios.get(`${API_URL}/tasks?project=${projectId}`, config),
        axios.get(`${API_URL}/tags`, config),
      ]);

      // Get the selected project directly by ID
      const selectedProject = projectResponse.data.project;

      if (!selectedProject) {
        setProject(null);
        setTasks([]);
        setError("Project not found.");
        return;
      }

      setProject(selectedProject);

      // Handle the tasks response
      const fetchedTasks = Array.isArray(taskResponse.data)
        ? taskResponse.data
        : taskResponse.data.tasks || [];

      setTasks(fetchedTasks);

      // Tasks already include populated owner details
      setUsers([]);

      // Store tags
      setTags(tagResponse.data.tags || []);
    } catch (err) {
      console.error(
        "Project data error:",
        err.response?.status,
        err.response?.data || err.message,
      );

      setError(
        err.response?.data?.message ||
          "Unable to load project data. Check your backend APIs.",
      );
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  const getOwnerName = (owner) => {
    if (typeof owner === "object" && owner !== null) {
      return owner.name || owner.email || owner._id;
    }

    const user = users.find((item) => item._id === owner);

    return user?.name || user?.email || owner;
  };

  const getTagName = (tag) => {
    if (typeof tag === "object" && tag !== null) {
      return tag.name || tag._id;
    }

    const foundTag = tags.find((item) => item._id === tag);

    return foundTag?.name || tag;
  };

  const ownerOptions = [
    ...new Set(tasks.flatMap((task) => (task.owners || []).map(getOwnerName))),
  ];

  const tagOptions = [
    ...new Set(tasks.flatMap((task) => (task.tags || []).map(getTagName))),
  ];

  let filteredTasks = tasks.filter((task) => {
    const taskOwners = (task.owners || []).map(getOwnerName);
    const taskTags = (task.tags || []).map(getTagName);

    const matchesOwner =
      ownerFilter === "All Owners" || taskOwners.includes(ownerFilter);

    const matchesTag = tagFilter === "All Tags" || taskTags.includes(tagFilter);

    const matchesStatus =
      statusFilter === "All Statuses" || task.status === statusFilter;

    return matchesOwner && matchesTag && matchesStatus;
  });

  if (sortBy === "time-asc") {
    filteredTasks = [...filteredTasks].sort(
      (a, b) => a.timeToComplete - b.timeToComplete,
    );
  } else if (sortBy === "time-desc") {
    filteredTasks = [...filteredTasks].sort(
      (a, b) => b.timeToComplete - a.timeToComplete,
    );
  }

  const completedCount = tasks.filter(
    (task) => task.status === "Completed",
  ).length;

  const inProgressCount = tasks.filter(
    (task) => task.status === "In Progress",
  ).length;

  if (loading) {
    return (
      <div className="project-main">
        <p>Loading project...</p>
      </div>
    );
  }

  return (
    <div className="project-page">
      <aside className="project-sidebar">
        <h3 className="sidebar-brand">
          Workasana<span>.</span>
        </h3>

        <p className="sidebar-label">WORKSPACE</p>

        <nav className="sidebar-nav">
          <Link to="/dashboard" className="sidebar-link">
            <span>▦</span> Dashboard
          </Link>

          <Link to="/projects" className="sidebar-link active">
            <span>▤</span> Projects
          </Link>

          <Link to="/teams" className="sidebar-link">
            <span>♧</span> Teams
          </Link>

          <Link to="/reports" className="sidebar-link">
            <span>▥</span> Reports
          </Link>
        </nav>
      </aside>

      <main className="project-main">
        <Link to="/dashboard" className="project-back-link">
          ← Back to Dashboard
        </Link>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
            <button
              className="btn btn-sm btn-outline-danger ms-3"
              onClick={fetchProjectData}
            >
              Retry
            </button>
          </div>
        )}

        {project && (
          <>
            <header className="project-header">
              <div>
                <p className="dashboard-subtitle">PROJECT MANAGEMENT</p>

                <h1>{project.name}</h1>

                <p className="dashboard-description">
                  {project.description || "Manage your project tasks."}
                </p>
              </div>

              <button
                className="btn btn-primary add-task-button"
                onClick={() => setShowTaskModal(true)}
              >
                + Add New Task
              </button>
            </header>

            <section className="project-summary">
              <div className="summary-item">
                <span>Total Tasks</span>
                <h2>{tasks.length}</h2>
              </div>

              <div className="summary-item">
                <span>In Progress</span>
                <h2>{inProgressCount}</h2>
              </div>

              <div className="summary-item">
                <span>Completed</span>
                <h2>{completedCount}</h2>
              </div>
            </section>

            <section className="project-tasks-section">
              <div className="section-heading">
                <div>
                  <h2>Project Tasks</h2>
                  <p>Manage and track your project tasks.</p>
                </div>

                <span className="task-count">{filteredTasks.length} tasks</span>
              </div>

              <div className="project-filters">
                <div className="filter-field">
                  <label htmlFor="ownerFilter">Filter by Owner</label>

                  <select
                    id="ownerFilter"
                    className="form-select"
                    value={ownerFilter}
                    onChange={(event) => setOwnerFilter(event.target.value)}
                  >
                    <option>All Owners</option>

                    {ownerOptions.map((owner) => (
                      <option key={owner} value={owner}>
                        {owner}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="filter-field">
                  <label htmlFor="tagFilter">Filter by Tag</label>

                  <select
                    id="tagFilter"
                    className="form-select"
                    value={tagFilter}
                    onChange={(event) => setTagFilter(event.target.value)}
                  >
                    <option>All Tags</option>

                    {tagOptions.map((tag) => (
                      <option key={tag} value={tag}>
                        {tag}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="filter-field">
                  <label htmlFor="statusFilter">Filter by Status</label>

                  <select
                    id="statusFilter"
                    className="form-select"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                  >
                    <option>All Statuses</option>
                    <option>To Do</option>
                    <option>In Progress</option>
                    <option>Completed</option>
                    <option>Blocked</option>
                  </select>
                </div>

                <div className="filter-field">
                  <label htmlFor="sortBy">Sort by Estimated Time</label>

                  <select
                    id="sortBy"
                    className="form-select"
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value)}
                  >
                    <option value="default">Default</option>
                    <option value="time-asc">Shortest First</option>
                    <option value="time-desc">Longest First</option>
                  </select>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table project-tasks-table align-middle">
                  <thead>
                    <tr>
                      <th>Task Name</th>
                      <th>Status</th>
                      <th>Owner</th>
                      <th>Tags</th>
                      <th>Estimated Time</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredTasks.length > 0 ? (
                      filteredTasks.map((task) => (
                        <tr key={task._id}>
                          <td className="project-task-name">{task.name}</td>

                          <td>
                            <span
                              className={`task-status ${
                                task.status === "Completed"
                                  ? "task-status-completed"
                                  : task.status === "In Progress"
                                    ? "task-status-progress"
                                    : "task-status-todo"
                              }`}
                            >
                              {task.status}
                            </span>
                          </td>

                          <td>
                            {(task.owners || []).map(getOwnerName).join(", ") ||
                              "Unassigned"}
                          </td>

                          <td>
                            <div className="project-tag-list">
                              {(task.tags || []).map((tag, index) => {
                                const tagName = getTagName(tag);

                                return (
                                  <span
                                    className="project-tag"
                                    key={`${tagName}-${index}`}
                                  >
                                    {tagName}
                                  </span>
                                );
                              })}
                            </div>
                          </td>

                          <td>{task.timeToComplete} days</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center py-5">
                          No tasks match your selected filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>

      {showTaskModal && project && (
        <CreateTaskModal
          projectId={project._id}
          projectName={project.name}
          onClose={() => setShowTaskModal(false)}
          onTaskCreated={async () => {
            setShowTaskModal(false);
            await fetchProjectData();
          }}
        />
      )}
    </div>
  );
}

export default ProjectManagement;
