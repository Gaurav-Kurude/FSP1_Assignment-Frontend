import { Link, useLocation, useNavigate } from "react-router-dom";

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const links = [
    { name: "Dashboard", path: "/dashboard", icon: "▦" },
    { name: "Projects", path: "/projects", icon: "▤" },
    { name: "Teams", path: "/teams", icon: "♧" },
    { name: "Reports", path: "/reports", icon: "▥" },
    { name: "Settings", path: "/settings", icon: "⚙" },
  ];

  const user = JSON.parse(localStorage.getItem("user") || "null");

  return (
    <aside className="dashboard-sidebar">
      <h3 className="sidebar-brand">
        Workasana<span>.</span>
      </h3>

      <p className="sidebar-label">WORKSPACE</p>

      <nav className="sidebar-nav">
        {links.map((link) => {
          const active =
            link.path === "/projects"
              ? location.pathname.startsWith("/projects")
              : location.pathname === link.path;

          return (
            <Link
              key={link.path}
              to={link.path}
              className={`sidebar-link ${active ? "active" : ""}`}
            >
              <span>{link.icon}</span> {link.name}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <div className="user-avatar">
          {user?.name?.charAt(0).toUpperCase() || "U"}
        </div>

        <div>
          <p className="user-name">{user?.name || "User"}</p>
          <p className="user-role">Team Member</p>
        </div>

        <button
          className="btn btn-outline-secondary btn-sm ms-auto"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
