import { NavLink } from "react-router-dom";

const SidebarContent = ({ onNavigate }) => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <>
      <div className="sidebar-brand">
        Workasana<span>.</span>
      </div>

      <p className="sidebar-label">MENU</p>

      <nav className="sidebar-navigation">
        <NavLink to="/dashboard" className="sidebar-link" onClick={onNavigate}>
          <i className="bi bi-grid"></i> Dashboard
        </NavLink>

        <NavLink to="/projects" className="sidebar-link" onClick={onNavigate}>
          <i className="bi bi-folder"></i> Projects
        </NavLink>

        <NavLink to="/teams" className="sidebar-link" onClick={onNavigate}>
          <i className="bi bi-people"></i> Teams
        </NavLink>

        <NavLink to="/reports" className="sidebar-link" onClick={onNavigate}>
          <i className="bi bi-bar-chart"></i> Reports
        </NavLink>

        <NavLink to="/settings" className="sidebar-link" onClick={onNavigate}>
          <i className="bi bi-gear"></i> Settings
        </NavLink>
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-profile">
          <div className="profile-icon">
            <i className="bi bi-person"></i>
          </div>

          <div className="profile-details">
            <p className="profile-name">{user.name || "User"}</p>
            <p className="profile-team">{user.team || "Team Member"}</p>
          </div>
        </div>

        <button className="sidebar-logout" onClick={handleLogout}>
          <i className="bi bi-box-arrow-right"></i>
          Logout
        </button>
      </div>
    </>
  );
};

const Sidebar = () => {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="dashboard-sidebar desktop-sidebar">
        <SidebarContent />
      </aside>

      {/* Mobile Toggle Button */}
      <button
        className="mobile-menu-toggle"
        type="button"
        data-bs-toggle="offcanvas"
        data-bs-target="#mobileSidebar"
        aria-controls="mobileSidebar"
        aria-label="Open navigation menu"
      >
        <i className="bi bi-list"></i>
      </button>

      {/* Mobile Offcanvas Sidebar */}
      <div
        className="offcanvas offcanvas-start mobile-sidebar"
        tabIndex="-1"
        id="mobileSidebar"
        aria-labelledby="mobileSidebarLabel"
      >
        <div className="offcanvas-header">
          <h5 className="offcanvas-title" id="mobileSidebarLabel">
            Workasana
          </h5>

          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          ></button>
        </div>

        <div className="offcanvas-body">
          <SidebarContent
            onNavigate={() => {
              const element = document.getElementById("mobileSidebar");
              const instance = window.bootstrap?.Offcanvas.getInstance(element);
              instance?.hide();
            }}
          />
        </div>
      </div>
    </>
  );
};

export default Sidebar;
