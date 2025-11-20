import { useEffect, useState, useContext } from 'react';
import AuthContext from '../../store/AuthContext';
import { currencyFormatter } from '../../util/formatting';

export default function Analytics() {
  const { token } = useContext(AuthContext);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const response = await fetch('http://localhost:3000/admin/analytics', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch analytics');
        }

        const data = await response.json();
        setAnalytics(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAnalytics();
  }, [token]);

  if (isLoading) {
    return <div className="admin-loading"><p>Loading analytics...</p></div>;
  }

  if (error) {
    return <div className="admin-error"><p>Error: {error}</p></div>;
  }

  return (
    <div className="analytics-container">
      <h1>Dashboard Analytics</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Total Revenue</h3>
            <p className="stat-value">{currencyFormatter.format(analytics.totalRevenue)}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <h3>Total Orders</h3>
            <p className="stat-value">{analytics.totalOrders}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Total Users</h3>
            <p className="stat-value">{analytics.totalUsers}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Average Order</h3>
            <p className="stat-value">
              {analytics.totalOrders > 0
                ? currencyFormatter.format(analytics.totalRevenue / analytics.totalOrders)
                : '$0.00'}
            </p>
          </div>
        </div>
      </div>

      <div className="analytics-section">
        <h2>Orders by Status</h2>
        <div className="status-grid">
          {Object.entries(analytics.ordersByStatus).map(([status, count]) => (
            <div key={status} className="status-item">
              <span className="status-label">{status}</span>
              <span className="status-count">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="analytics-section">
        <h2>Popular Meals</h2>
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Meal Name</th>
                <th>Orders</th>
                <th>Quantity Sold</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {analytics.popularMeals && analytics.popularMeals.length > 0 ? (
                analytics.popularMeals.map((meal) => (
                  <tr key={meal.id}>
                    <td>{meal.name}</td>
                    <td>{meal.totalOrders}</td>
                    <td>{meal.totalQuantity}</td>
                    <td>{currencyFormatter.format(meal.revenue)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="no-data">No data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="analytics-section">
        <h2>Recent Orders</h2>
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Email</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {analytics.recentOrders && analytics.recentOrders.length > 0 ? (
                analytics.recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="order-id">{order.id.substring(0, 8)}...</td>
                    <td>{order.customer_name}</td>
                    <td>{order.customer_email}</td>
                    <td>
                      <span className={`status-badge status-${order.status || 'pending'}`}>
                        {order.status || 'pending'}
                      </span>
                    </td>
                    <td>{new Date(order.created_at).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="no-data">No orders yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
