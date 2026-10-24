import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
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

const API_URL = "http://localhost:3000";

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom",
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

function getArray(response) {
  const data = response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.report)) return data.report;
  if (Array.isArray(data?.tasks)) return data.tasks;

  return [];
}

function getNumber(data, possibleKeys) {
  for (const key of possibleKeys) {
    const value = data?.[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
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

export default function Reports() {
  const [lastWeekCount, setLastWeekCount] = useState(0);
  const [pendingHours, setPendingHours] = useState(0);
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
          "Unable to load reports. Check your backend and report routes.",
        );
      }

      if (lastWeekResult.status === "fulfilled") {
        const data = lastWeekResult.value.data;

        setLastWeekCount(
          getNumber(data, [
            "count",
            "total",
            "totalCompleted",
            "completedCount",
          ]) || getArray(lastWeekResult.value).length,
        );
      }

      if (pendingResult.status === "fulfilled") {
        const data = pendingResult.value.data;

        setPendingHours(
          getNumber(data, [
            "totalPendingTime",
            "totalPendingHours",
            "pendingHours",
            "totalTime",
            "total",
          ]),
        );
      }

      if (teamResult.status === "fulfilled") {
        setTeamRows(getArray(teamResult.value));
      }

      if (ownerResult.status === "fulfilled") {
        setOwnerRows(getArray(ownerResult.value));
      }

      if (failedReports.length > 0) {
        setError(
          "Some reports could not be loaded. Check the corresponding backend routes.",
        );
      }
    } catch (err) {
      setError(err.message || "Something went wrong while loading reports.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const pendingChartData = {
    labels: ["Estimated pending hours"],
    datasets: [
      {
        label: "Hours",
        data: [pendingHours],
        backgroundColor: ["#f5b544"],
        borderRadius: 8,
      },
    ],
  };

  const lastWeekChartData = {
    labels: ["Completed tasks"],
    datasets: [
      {
        label: "Tasks completed",
        data: [lastWeekCount],
        backgroundColor: ["#41b883"],
        borderRadius: 8,
      },
    ],
  };

  return (
    <div className="reports-page">
      <header className="reports-header">
        <div>
          <h1>Workasana Reports</h1>
          <p>Track completed tasks and monitor pending work.</p>
        </div>

        <button
          className="btn btn-outline-primary"
          onClick={fetchReports}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "↻ Refresh Reports"}
        </button>
      </header>

      <div className="reports-layout">
        <aside className="reports-sidebar">
          <Link to="/dashboard" className="btn btn-outline-secondary w-100">
            ← Back to Dashboard
          </Link>

          <nav className="reports-navigation">
            <a href="#last-week">Work Done Last Week</a>
            <a href="#pending-work">Pending Work</a>
            <a href="#team-report">Tasks by Team</a>
            <a href="#owner-report">Tasks by Owner</a>
          </nav>
        </aside>

        <main className="reports-main">
          {error && (
            <div className="alert alert-warning" role="alert">
              {error}
            </div>
          )}

          {loading ? (
            <p>Loading reports...</p>
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
                  <strong>{pendingHours}</strong>
                  <small>Estimated hours remaining</small>
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
                    description="Estimated hours for tasks not yet completed."
                  >
                    <Doughnut
                      data={pendingChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: "bottom",
                          },
                        },
                      }}
                    />
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
        </main>
      </div>
    </div>
  );
}
