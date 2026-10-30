import { useCallback, useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import CreateTaskModal from "../components/CreateTaskModal";
import "../App.css";
import Sidebar from "../components/Sidebar";

const API_URL = "https://fsp-1-assignment-backend-plum.vercel.app";

function ProjectManagement() {
  const { projectId } = useParams();

  // Read and update filters through URL query parameters
  const [searchParams, setSearchParams] = useSearchParams();

  const ownerFilter = searchParams.get("owner") || "All Owners";
  const tagFilter = searchParams.get("tag") || "All Tags";
  const statusFilter = searchParams.get("status") || "All Statuses";
  const sortBy = searchParams.get("sort") || "default";

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [tags, setTags] = useState([]);

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Update filters in the URL
  const handleFilterChange = (filterName, value, defaultValue) => {
    setSearchParams((currentParams) => {
      const newParams = new URLSearchParams(currentParams);

      if (!value || value === defaultValue) {
        newParams.delete(filterName);
      } else {
        newParams.set(filterName, value);
      }

      return newParams;
    });
  };

  // Fetch project data
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

  // Get owner name
  const getOwnerName = (owner) => {
    if (typeof owner === "object" && owner !== null) {
      return owner.name || owner.email || owner._id;
    }

    const user = users.find((item) => item._id === owner);

    return user?.name || user?.email || owner;
  };

  // Get tag name
  const getTagName = (tag) => {
    if (typeof tag === "object" && tag !== null) {
      return tag.name || tag._id;
    }

    const foundTag = tags.find((item) => item._id === tag);

    return foundTag?.name || tag;
  };

  // Generate owner options
  const ownerOptions = [
    ...new Set(tasks.flatMap((task) => (task.owners || []).map(getOwnerName))),
  ];

  // Generate tag options
  const tagOptions = [
    ...new Set(tasks.flatMap((task) => (task.tags || []).map(getTagName))),
  ];

  // Apply filters
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

  // Apply sorting
  if (sortBy === "time-asc") {
    filteredTasks = [...filteredTasks].sort(
      (a, b) => a.timeToComplete - b.timeToComplete,
    );
  } else if (sortBy === "time-desc") {
    filteredTasks = [...filteredTasks].sort(
      (a, b) => b.timeToComplete - a.timeToComplete,
    );
  }

  // Calculate task counts
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
      <Sidebar />

      <main className="project-main">
        <Link to="/projects" className="project-back-link">
          ← Back to Projects
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

            {/* Project Summary */}
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

            {/* Project Tasks */}
            <section className="project-tasks-section">
              <div className="section-heading">
                <div>
                  <h2>Project Tasks</h2>
                  <p>Manage and track your project tasks.</p>
                </div>

                <span className="task-count">{filteredTasks.length} tasks</span>
              </div>

              {/* Filters */}
              <div className="project-filters">
                {/* Owner Filter */}
                <div className="filter-field">
                  <label htmlFor="ownerFilter">Filter by Owner</label>

                  <select
                    id="ownerFilter"
                    className="form-select"
                    value={ownerFilter}
                    onChange={(event) =>
                      handleFilterChange(
                        "owner",
                        event.target.value,
                        "All Owners",
                      )
                    }
                  >
                    <option value="All Owners">All Owners</option>

                    {ownerOptions.map((owner) => (
                      <option key={owner} value={owner}>
                        {owner}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tag Filter */}
                <div className="filter-field">
                  <label htmlFor="tagFilter">Filter by Tag</label>

                  <select
                    id="tagFilter"
                    className="form-select"
                    value={tagFilter}
                    onChange={(event) =>
                      handleFilterChange("tag", event.target.value, "All Tags")
                    }
                  >
                    <option value="All Tags">All Tags</option>

                    {tagOptions.map((tag) => (
                      <option key={tag} value={tag}>
                        {tag}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div className="filter-field">
                  <label htmlFor="statusFilter">Filter by Status</label>

                  <select
                    id="statusFilter"
                    className="form-select"
                    value={statusFilter}
                    onChange={(event) =>
                      handleFilterChange(
                        "status",
                        event.target.value,
                        "All Statuses",
                      )
                    }
                  >
                    <option value="All Statuses">All Statuses</option>
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Blocked">Blocked</option>
                  </select>
                </div>

                {/* Sort Filter */}
                <div className="filter-field">
                  <label htmlFor="sortBy">Sort by Estimated Time</label>

                  <select
                    id="sortBy"
                    className="form-select"
                    value={sortBy}
                    onChange={(event) =>
                      handleFilterChange("sort", event.target.value, "default")
                    }
                  >
                    <option value="default">Default</option>
                    <option value="time-asc">Least Time Required</option>
                    <option value="time-desc">Most Time Required</option>
                  </select>
                </div>
              </div>

              {/* Task Table */}
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

      {/* Create Task Modal */}
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
