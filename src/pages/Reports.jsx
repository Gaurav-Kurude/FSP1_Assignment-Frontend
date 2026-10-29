import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import "../App.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
);

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "https://fsp-1-assignment-backend-plum.vercel.app"
).replace(/\/+$/, "");

// Safely extract the response payload.
function getPayload(response) {
  let data = response?.data;

  // Handle APIs that return { success: true, data: ... }.
  if (
    data &&
    !Array.isArray(data) &&
    typeof data === "object" &&
    data.data !== undefined
  ) {
    data = data.data;
  }

  return data;
}

function getArray(response) {
  const data = getPayload(response);

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.tasks)) return data.tasks;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.report)) return data.report;

  return [];
}

function getNumber(data, possibleKeys) {
  for (const key of possibleKeys) {
    const value = data?.[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim() !== "") {
      const number = Number(value);

      if (Number.isFinite(number)) {
        return number;
      }
    }
  }

  return 0;
}

function getLabel(item, type) {
  const group = item?._id;

  if (typeof group === "string" || typeof group === "number") {
    return String(group);
  }

  if (group && typeof group === "object") {
    if (type === "team") {
      return group.teamName || group.name || "Unknown Team";
    }

    if (type === "owner") {
      return group.ownerName || group.name || group.email || "Unknown Owner";
    }
  }

  return (
    item?.teamName || item?.ownerName || item?.name || item?.label || "Unknown"
  );
}

function getClosedCount(item) {
  return getNumber(item, [
    "completedTasks",
    "count",
    "total",
    "totalClosed",
    "closedCount",
    "taskCount",
    "totalTasks",
  ]);
}

function makeChartData(rows, type) {
  return {
    labels: rows.map((item) => getLabel(item, type)),
    datasets: [
      {
        label: "Tasks Closed",
        data: rows.map(getClosedCount),
        backgroundColor: [
          "#6478ee",
          "#41b883",
          "#f5b544",
          "#e879a9",
          "#42a5c6",
          "#a78bfa",
        ],
        borderRadius: 6,
        borderWidth: 0,
      },
    ],
  };
}

function ReportCard({ title, description, children }) {
  return (
    <section className="report-card">
      <div className="report-card-heading">
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>

      <div className="report-chart">{children}</div>
    </section>
  );
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom",
    },
    title: {
      display: false,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        precision: 0,
      },
    },
  },
};

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom",
    },
    tooltip: {
      callbacks: {
        label(context) {
          return `${context.label}: ${context.raw} days`;
        },
      },
    },
  },
};

export default function Reports() {
  const [lastWeekCount, setLastWeekCount] = useState(0);
  const [pendingDays, setPendingDays] = useState(0);
  const [teamRows, setTeamRows] = useState([]);
  const [ownerRows, setOwnerRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please log in to view reports.");
        setLastWeekCount(0);
        setPendingDays(0);
        setTeamRows([]);
        setOwnerRows([]);
        return;
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const results = await Promise.allSettled([
        axios.get(`${API_URL}/report/last-week`, config),
        axios.get(`${API_URL}/report/pending`, config),
        axios.get(`${API_URL}/report/closed-tasks?by=team`, config),
        axios.get(`${API_URL}/report/closed-tasks?by=owner`, config),
      ]);

      const [lastWeekResult, pendingResult, teamResult, ownerResult] = results;

      const failedReports = results.filter(
        (result) => result.status === "rejected",
      );

      if (failedReports.length === results.length) {
        throw new Error(
          "Unable to load reports. Please check your login token and backend report routes.",
        );
      }

      if (lastWeekResult.status === "fulfilled") {
        const data = getPayload(lastWeekResult.value);

        setLastWeekCount(
          getNumber(data, [
            "count",
            "total",
            "totalCompleted",
            "completedCount",
            "completedTasks",
          ]) || getArray(lastWeekResult.value).length,
        );
      } else {
        setLastWeekCount(0);
      }

      if (pendingResult.status === "fulfilled") {
        const data = getPayload(pendingResult.value);

        setPendingDays(
          getNumber(data, [
            "totalPendingDays",
            "pendingDays",
            "total",
            "count",
          ]),
        );
      } else {
        setPendingDays(0);
      }

      if (teamResult.status === "fulfilled") {
        setTeamRows(getArray(teamResult.value));
      } else {
        setTeamRows([]);
      }

      if (ownerResult.status === "fulfilled") {
        setOwnerRows(getArray(ownerResult.value));
      } else {
        setOwnerRows([]);
      }

      if (failedReports.length > 0) {
        setError(
          "Some reports could not be loaded. Check the failed API routes in your backend.",
        );
      }
    } catch (err) {
      console.error("Error fetching reports:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Something went wrong while loading reports.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const lastWeekChartData = {
    labels: ["Completed tasks"],
    datasets: [
      {
        label: "Tasks completed",
        data: [lastWeekCount],
        backgroundColor: ["#41b883"],
        borderRadius: 6,
        borderWidth: 0,
      },
    ],
  };

  const pendingChartData = {
    labels: ["Estimated pending days"],
    datasets: [
      {
        label: "Estimated days",
        data: [pendingDays],
        backgroundColor: ["#f5b544"],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main reports-page">
        <div className="container-fluid py-4">
          <div className="reports-header">
            <div>
              <Link to="/dashboard" className="btn btn-outline-secondary mb-3">
                ← Back to Dashboard
              </Link>

              <h1>Workasana Reports</h1>
              <p>Track completed tasks and monitor pending work.</p>
            </div>

            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={fetchReports}
              disabled={loading}
            >
              {loading ? "Refreshing..." : "↻ Refresh Reports"}
            </button>
          </div>

          <nav className="reports-navigation">
            <a href="#last-week">Work Done Last Week</a>
            <a href="#pending-work">Pending Work</a>
            <a href="#team-report">Tasks by Team</a>
            <a href="#owner-report">Tasks by Owner</a>
          </nav>

          {error && (
            <div className="alert alert-warning mt-3" role="alert">
              {error}
            </div>
          )}

          {loading ? (
            <p className="mt-4">Loading reports...</p>
          ) : (
            <>
              <div className="report-summary-grid">
                <div className="report-summary-card">
                  <span>Tasks Completed Last Week</span>
                  <strong>{lastWeekCount}</strong>
                  <small>Completed tasks</small>
                </div>

                <div className="report-summary-card pending-summary">
                  <span>Pending Work</span>
                  <strong>{pendingDays}</strong>
                  <small>Estimated days remaining</small>
                </div>
              </div>

              <div className="reports-chart-grid">
                <div id="last-week">
                  <ReportCard
                    title="Total Work Done Last Week"
                    description="Tasks completed in the last seven days."
                  >
                    <Bar data={lastWeekChartData} options={chartOptions} />
                  </ReportCard>
                </div>

                <div id="pending-work">
                  <ReportCard
                    title="Total Work Pending"
                    description="Estimated days for tasks not yet completed."
                  >
                    {pendingDays > 0 ? (
                      <Doughnut
                        data={pendingChartData}
                        options={doughnutOptions}
                      />
                    ) : (
                      <p className="report-empty">
                        No estimated pending days available.
                      </p>
                    )}
                  </ReportCard>
                </div>

                <div id="team-report">
                  <ReportCard
                    title="Tasks Closed by Team"
                    description="Compare completed tasks across teams."
                  >
                    {teamRows.length > 0 ? (
                      <Bar
                        data={makeChartData(teamRows, "team")}
                        options={chartOptions}
                      />
                    ) : (
                      <p className="report-empty">
                        No completed-task data available for teams.
                      </p>
                    )}
                  </ReportCard>
                </div>

                <div id="owner-report">
                  <ReportCard
                    title="Tasks Closed by Owner"
                    description="Compare completed tasks across owners."
                  >
                    {ownerRows.length > 0 ? (
                      <Bar
                        data={makeChartData(ownerRows, "owner")}
                        options={chartOptions}
                      />
                    ) : (
                      <p className="report-empty">
                        No completed-task data available for owners.
                      </p>
                    )}
                  </ReportCard>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
