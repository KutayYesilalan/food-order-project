import { useEffect, useState, useContext } from 'react';
import AuthContext from '../../store/AuthContext';

export default function UserManagement() {
  const { token } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const response = await fetch('http://localhost:3000/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return <div className="admin-loading"><p>Loading users...</p></div>;
  }

  if (error) {
    return <div className="admin-error"><p>Error: {error}</p></div>;
  }

  return (
    <div className="user-management">
      <h1>User Management</h1>

      <div className="stats-summary">
        <div className="stat-item">
          <span className="stat-label">Total Users:</span>
          <span className="stat-value">{users.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Admin Users:</span>
          <span className="stat-value">{users.filter(u => u.is_admin).length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Regular Users:</span>
          <span className="stat-value">{users.filter(u => !u.is_admin).length}</span>
        </div>
      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Total Orders</th>
              <th>Joined Date</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-data">No users found</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td className="user-id">{user.id.substring(0, 8)}...</td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    {user.is_admin ? (
                      <span className="role-badge role-admin">Admin</span>
                    ) : (
                      <span className="role-badge role-user">User</span>
                    )}
                  </td>
                  <td>{user.orderCount}</td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
