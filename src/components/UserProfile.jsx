import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../store/AuthContext';
import { currencyFormatter } from '../util/formatting';
import Button from './UI/Button';

export default function UserProfile() {
  const { user, token, logout, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }

    async function fetchOrders() {
      try {
        const response = await fetch('http://localhost:3000/orders', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }

        const data = await response.json();
        setOrders(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrders();
  }, [isAuthenticated, token, navigate]);

  function handleLogout() {
    logout();
    navigate('/');
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="user-profile">
      <div className="profile-header">
        <h1>My Profile</h1>
        <Button onClick={handleLogout} textOnly>
          Logout
        </Button>
      </div>

      <div className="profile-info">
        <h2>Account Information</h2>
        <div className="info-item">
          <span className="label">Name:</span>
          <span className="value">{user.name}</span>
        </div>
        <div className="info-item">
          <span className="label">Email:</span>
          <span className="value">{user.email}</span>
        </div>
      </div>

      <div className="order-history">
        <h2>Order History</h2>
        {isLoading && <p>Loading orders...</p>}
        {error && <p className="error-message">{error}</p>}

        {!isLoading && !error && orders.length === 0 && (
          <p className="no-orders">No orders yet. Start shopping!</p>
        )}

        {!isLoading && !error && orders.length > 0 && (
          <ul className="orders-list">
            {orders.map(order => {
              const orderTotal = order.items.reduce(
                (total, item) => total + item.quantity * parseFloat(item.price),
                0
              );

              return (
                <li key={order.id} className="order-item">
                  <div className="order-header">
                    <span className="order-id">Order #{order.id.substring(0, 8)}</span>
                    <span className="order-date">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="order-items">
                    {order.items.map(item => (
                      <div key={item.id} className="item">
                        <span>{item.name} x {item.quantity}</span>
                        <span>{currencyFormatter.format(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="order-total">
                    <strong>Total: {currencyFormatter.format(orderTotal)}</strong>
                  </div>
                  <div className="order-address">
                    <p>
                      {order.customer.name}<br />
                      {order.customer.street}<br />
                      {order.customer['postal-code']} {order.customer.city}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="profile-actions">
        <Button onClick={() => navigate('/')}>Back to Shop</Button>
      </div>
    </div>
  );
}
