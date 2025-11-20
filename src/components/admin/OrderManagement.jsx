import { useEffect, useState, useContext } from 'react';
import AuthContext from '../../store/AuthContext';
import { currencyFormatter } from '../../util/formatting';

export default function OrderManagement() {
  const { token } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const statuses = ['pending', 'confirmed', 'preparing', 'delivering', 'delivered', 'cancelled'];

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      const response = await fetch('http://localhost:3000/admin/orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleStatusUpdate(orderId, newStatus) {
    try {
      const response = await fetch(`http://localhost:3000/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      await fetchOrders();
      if (selectedOrder?.id === orderId) {
        const updatedOrder = orders.find(o => o.id === orderId);
        if (updatedOrder) {
          setSelectedOrder({ ...updatedOrder, status: newStatus });
        }
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }

  function handleViewDetails(order) {
    setSelectedOrder(order);
  }

  function handleCloseDetails() {
    setSelectedOrder(null);
  }

  if (isLoading) {
    return <div className="admin-loading"><p>Loading orders...</p></div>;
  }

  if (error) {
    return <div className="admin-error"><p>Error: {error}</p></div>;
  }

  return (
    <div className="order-management">
      <h1>Order Management</h1>

      {selectedOrder && (
        <div className="modal-backdrop" onClick={handleCloseDetails}>
          <div className="modal order-details-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Order Details</h2>

            <div className="order-info-section">
              <h3>Order Information</h3>
              <p><strong>Order ID:</strong> {selectedOrder.id}</p>
              <p><strong>Date:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</p>
              <p>
                <strong>Status:</strong>
                <select
                  value={selectedOrder.status}
                  onChange={(e) => handleStatusUpdate(selectedOrder.id, e.target.value)}
                  className="status-select"
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </p>
            </div>

            <div className="order-info-section">
              <h3>Customer Information</h3>
              <p><strong>Name:</strong> {selectedOrder.customer.name}</p>
              <p><strong>Email:</strong> {selectedOrder.customer.email}</p>
              <p><strong>Address:</strong></p>
              <p className="address-text">
                {selectedOrder.customer.street}<br />
                {selectedOrder.customer.city}, {selectedOrder.customer['postal-code']}
              </p>
            </div>

            <div className="order-info-section">
              <h3>Items</h3>
              <table className="order-items-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Price</th>
                    <th>Qty</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.name}</td>
                      <td>{currencyFormatter.format(item.price)}</td>
                      <td>{item.quantity}</td>
                      <td>{currencyFormatter.format(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3"><strong>Total</strong></td>
                    <td><strong>{currencyFormatter.format(selectedOrder.total)}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="form-actions">
              <button onClick={handleCloseDetails} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Email</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-data">No orders yet</td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id}>
                  <td className="order-id">{order.id.substring(0, 8)}...</td>
                  <td>{order.customer.name}</td>
                  <td>{order.customer.email}</td>
                  <td>{currencyFormatter.format(order.total)}</td>
                  <td>
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                      className={`status-badge status-${order.status}`}
                    >
                      {statuses.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </td>
                  <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="actions-cell">
                    <button
                      onClick={() => handleViewDetails(order)}
                      className="btn-icon btn-view"
                      title="View Details"
                    >
                      👁️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
