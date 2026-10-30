import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";

const Sidebar = () => {
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const userName = user.name || "User";
  const teamName = user.team?.name || user.teamName || "Team Member";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Close the mobile menu if it is open
    setIsMobileOpen(false);

    navigate("/login");
  };

  const closeMobileMenu = () => {
    setIsMobileOpen(false);
  };

  const navigationLinks = [
    { name: "Dashboard", path: "/dashboard", icon: "bi-speedometer2" },
    { name: "Projects", path: "/projects", icon: "bi-folder" },
    { name: "Teams", path: "/teams", icon: "bi-people" },
    { name: "Reports", path: "/reports", icon: "bi-bar-chart" },
    { name: "Settings", path: "/settings", icon: "bi-gear" },
  ];

  const renderNavigation = () => (
    <nav className="sidebar-navigation">
      {navigationLinks.map((link) => (
        <NavLink
          key={link.path}
          to={link.path}
          onClick={closeMobileMenu}
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <i className={`bi ${link.icon}`}></i>
          <span>{link.name}</span>
        </NavLink>
      ))}
    </nav>
  );

  const renderProfile = () => (
    <div className="sidebar-bottom">
      <div className="sidebar-profile">
        <div className="profile-icon">
          <i className="bi bi-person-fill"></i>
        </div>

        <div className="profile-details">
          <p className="profile-name">{userName}</p>
          <p className="profile-team">{teamName}</p>
        </div>
      </div>

      <button type="button" className="sidebar-logout" onClick={handleLogout}>
        <i className="bi bi-box-arrow-right"></i>
        <span>Logout</span>
      </button>
    </div>
  );

  const renderSidebarContent = () => (
    <>
      <div className="sidebar-brand">
        <span className="brand-icon">
          <i className="bi bi-kanban-fill"></i>
        </span>
        <span>Workasana</span>
      </div>

      <div className="sidebar-section-label">MENU</div>

      {renderNavigation()}

      {renderProfile()}
    </>
  );

  return (
    <>
      {/* Mobile menu toggle button */}
      <button
        type="button"
        className="mobile-menu-toggle"
        aria-label="Open navigation menu"
        aria-expanded={isMobileOpen}
        onClick={() => setIsMobileOpen(true)}
      >
        <i className="bi bi-list"></i>
      </button>

      {/* Desktop sidebar */}
      <aside className="dashboard-sidebar desktop-sidebar">
        {renderSidebarContent()}
      </aside>

      {/* Mobile sidebar overlay */}
      {isMobileOpen && (
        <div className="mobile-sidebar-overlay" onClick={closeMobileMenu}></div>
      )}

      {/* Mobile sidebar */}
      <aside
        className={`dashboard-sidebar mobile-sidebar ${
          isMobileOpen ? "mobile-sidebar-open" : ""
        }`}
        aria-hidden={!isMobileOpen}
      >
        <button
          type="button"
          className="mobile-sidebar-close"
          aria-label="Close navigation menu"
          onClick={closeMobileMenu}
        >
          <i className="bi bi-x-lg"></i>
        </button>

        {renderSidebarContent()}
      </aside>
    </>
  );
};

export default Sidebar;
