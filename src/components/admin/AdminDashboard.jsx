import { useContext } from 'react';
import { Navigate, NavLink, Outlet } from 'react-router-dom';
import AuthContext from '../../store/AuthContext';

export default function AdminDashboard() {
  const { isAdmin, isAuthenticated, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return (
      <div className="admin-loading">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="admin-dashboard">
      <nav className="admin-nav">
        <div className="admin-nav-header">
          <h2>Admin Panel</h2>
        </div>
        <ul className="admin-nav-links">
          <li>
            <NavLink
              to="/admin"
              end
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <span className="nav-icon">📊</span>
              Analytics
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/meals"
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <span className="nav-icon">🍽️</span>
              Meals
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/orders"
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <span className="nav-icon">📦</span>
              Orders
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/users"
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <span className="nav-icon">👥</span>
              Users
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/"
              className="back-link"
            >
              <span className="nav-icon">🏠</span>
              Back to Store
            </NavLink>
          </li>
        </ul>
      </nav>

      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}
