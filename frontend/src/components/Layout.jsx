import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const mainSidebarRoutes = [
    '/dashboard',
    '/jobs',
    '/candidates',
    '/pipeline',
    '/assessments',
    '/interviews',
    '/offers',
    '/employees',
    '/reports',
    '/settings',
  ];
  const initialPathSegments = (typeof window !== 'undefined'
    ? window.location.pathname
    : location.pathname)
    .split('/')
    .filter(Boolean);
  const initialIsMainRoute =
    initialPathSegments.length === 1 &&
    mainSidebarRoutes.includes(`/${initialPathSegments[0]}`);

  const [sidebarOpen, setSidebarOpen] = useState(() => initialIsMainRoute);
  const [hasHistory, setHasHistory] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const pathSegments = location.pathname.split('/').filter(Boolean);
  const isMainSidebarRoute = pathSegments.length === 1 && mainSidebarRoutes.includes(`/${pathSegments[0]}`);
  const isChildDetailRoute = pathSegments.length > 1;
  const parentMainRoute = pathSegments.length ? `/${pathSegments[0]}` : '/dashboard';
  const showBackButton = isChildDetailRoute && !['/login', '/'].includes(location.pathname);
  const handleBack = () => {
    if (hasHistory) {
      navigate(-1);
    } else {
      navigate(mainSidebarRoutes.includes(parentMainRoute) ? parentMainRoute : '/dashboard');
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkHistory = () => {
      setHasHistory(Boolean(window.history.state?.idx > 0 || window.history.length > 1));
    };

    checkHistory();
    window.addEventListener('popstate', checkHistory);
    return () => window.removeEventListener('popstate', checkHistory);
  }, [location.pathname]);
  const navLinkClass = ({ isActive }) =>
    `nav-link text-white-50 ${isActive ? 'active bg-primary text-white' : ''}`;

  const toggleSidebar = () => setSidebarOpen((open) => !open);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('sidebarOpen', JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  useEffect(() => {
    if (isMainSidebarRoute) {
      setSidebarOpen(true);
    } else {
      setSidebarOpen(false);
    }
  }, [isMainSidebarRoute]);

  return (
    <div className="d-flex min-vh-100 app-smooth">
      <aside
        className={`sidebar-gradient text-white d-flex flex-column rounded-end-4 shadow-sm ${
          sidebarOpen ? 'sidebar-open' : 'sidebar-closed'
        }`}
        aria-expanded={sidebarOpen}
      >
        <div className="p-3 border-bottom border-secondary rounded-end-4 d-flex align-items-center justify-content-between">
          <div className="sidebar-title d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-sm btn-outline-light"
              onClick={toggleSidebar}
              aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              <i className={`bi ${sidebarOpen ? 'bi-list' : 'bi-list'}`}></i>
            </button>
            <i className="bi bi-people-fill"></i>
            <span className="sidebar-title-text">HR ATS</span>
          </div>
        </div>
        <nav className="nav flex-column p-3 gap-1 sidebar-nav">
          <NavLink to="/dashboard" className={navLinkClass} data-title="Dashboard" aria-label="Dashboard">
            <i className="bi bi-speedometer2"></i>
            <span className="sidebar-link-text">Dashboard</span>
            <span className="sidebar-tooltip">Dashboard</span>
          </NavLink>
          <NavLink to="/jobs" className={navLinkClass} data-title="Jobs" aria-label="Jobs">
            <i className="bi bi-briefcase-fill"></i>
            <span className="sidebar-link-text">Jobs</span>
            <span className="sidebar-tooltip">Jobs</span>
          </NavLink>
          <NavLink to="/candidates" className={navLinkClass} data-title="Candidates" aria-label="Candidates">
            <i className="bi bi-file-earmark-person-fill"></i>
            <span className="sidebar-link-text">Candidates</span>
            <span className="sidebar-tooltip">Candidates</span>
          </NavLink>
          <NavLink to="/pipeline" className={navLinkClass} data-title="Pipeline" aria-label="Pipeline">
            <i className="bi bi-kanban-fill"></i>
            <span className="sidebar-link-text">Pipeline</span>
            <span className="sidebar-tooltip">Pipeline</span>
          </NavLink>
          <NavLink to="/assessments" className={navLinkClass} data-title="Assessments" aria-label="Assessments">
            <i className="bi bi-card-checklist"></i>
            <span className="sidebar-link-text">Assessments</span>
            <span className="sidebar-tooltip">Assessments</span>
          </NavLink>
          <NavLink to="/interviews" className={navLinkClass} data-title="Interviews" aria-label="Interviews">
            <i className="bi bi-calendar-check-fill"></i>
            <span className="sidebar-link-text">Interviews</span>
            <span className="sidebar-tooltip">Interviews</span>
          </NavLink>
          <NavLink to="/offers" className={navLinkClass} data-title="Offers" aria-label="Offers">
            <i className="bi bi-cash-stack"></i>
            <span className="sidebar-link-text">Offers</span>
            <span className="sidebar-tooltip">Offers</span>
          </NavLink>
          <NavLink to="/employees" className={navLinkClass} data-title="Employees" aria-label="Employees">
            <i className="bi bi-people"></i>
            <span className="sidebar-link-text">Employees</span>
            <span className="sidebar-tooltip">Employees</span>
          </NavLink>
          <NavLink to="/reports" className={navLinkClass} data-title="Reports" aria-label="Reports">
            <i className="bi bi-bar-chart-line"></i>
            <span className="sidebar-link-text">Reports</span>
            <span className="sidebar-tooltip">Reports</span>
          </NavLink>
          <NavLink to="/settings" className={navLinkClass} data-title="Settings" aria-label="Settings">
            <i className="bi bi-gear"></i>
            <span className="sidebar-link-text">Settings</span>
            <span className="sidebar-tooltip">Settings</span>
          </NavLink>
        </nav>
        <div className="mt-auto p-3 border-top border-secondary sidebar-footer">
          <div className="small text-white-50 mb-2 sidebar-footer-info">
            {user?.firstName} {user?.lastName}
            <br />
            <span className="badge bg-secondary sidebar-link-text">{user?.role}</span>
          </div>
          <button
            className="btn btn-outline-light btn-sm w-100 sidebar-footer-logout"
            onClick={handleLogout}
            aria-label="Logout"
          >
            <i className="bi bi-box-arrow-right me-1"></i>
            <span className="sidebar-link-text">Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-grow-1 bg-light">
        <header className="header-gradient border-bottom px-4 py-3 d-flex align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-3">
            <div>
              {showBackButton && (
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm me-3 btn-rounded"
                  onClick={handleBack}
                  aria-label="Go back"
                >
                  <i className="bi bi-arrow-left me-1"></i>
                  Back
                </button>
              )}
              <span className="h5 mb-0">HR Recruitment Management System</span>
            </div>
          </div>
        </header>
        <div className="p-4 page-transition">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
