import { Link, useLocation, useNavigate } from "react-router-dom";

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const links = [
    { name: "Dashboard", path: "/dashboard", icon: "▦" },
    { name: "Projects", path: "/projects", icon: "▤" },
    { name: "Teams", path: "/teams", icon: "♧" },
    { name: "Reports", path: "/reports", icon: "▥" },
    { name: "Settings", path: "/settings", icon: "⚙" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <>
      {/* Mobile toggle button */}
      <button
        className="btn btn-primary mobile-menu-toggle"
        type="button"
        data-bs-toggle="offcanvas"
        data-bs-target="#mobileSidebar"
        aria-controls="mobileSidebar"
      >
        ☰ Menu
      </button>

      {/* Mobile sidebar */}
      <div
        className="offcanvas offcanvas-start"
        tabIndex="-1"
        id="mobileSidebar"
        aria-labelledby="mobileSidebarLabel"
      >
        <div className="offcanvas-header">
          <h5 className="offcanvas-title" id="mobileSidebarLabel">
            Workasana.
          </h5>

          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          />
        </div>

        <div className="offcanvas-body">
          <nav className="nav flex-column gap-2">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`nav-link ${
                  location.pathname.startsWith(link.path) ? "active" : ""
                }`}
                data-bs-dismiss="offcanvas"
              >
                {link.icon} {link.name}
              </Link>
            ))}
          </nav>

          <button
            className="btn btn-outline-danger mt-4 w-100"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="dashboard-sidebar desktop-sidebar">
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
                <span>{link.icon}</span>
                {link.name}
              </Link>
            );
          })}
        </nav>

        <button
          className="btn btn-outline-danger mt-auto"
          onClick={handleLogout}
        >
          Logout
        </button>
      </aside>
    </>
  );
}

export default Sidebar;
