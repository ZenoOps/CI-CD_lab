import React, { useEffect, useState } from 'react';
import './SellerDashboard.css';

function SellerDashboard() {
  const [orders, setOrders] = useState([]);

  const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://ladyfirstme.pythonanywhere.com/api/auth'
  : 'http://localhost:8000/api/auth';

  // `${API_BASE_URL}

  const fetchOrders = async () => {
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/seller/orders/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      console.log("Fetched Seller Orders:", data);
      if (res.ok) {
        setOrders(data);
      } else {
        console.error("Failed to fetch seller orders:", data);
      }
    } catch (error) {
      console.error("Error fetching seller orders:", error);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/seller/orders/${orderId}/update-status/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (res.ok) {
        fetchOrders();
      } else {
        alert(data.error || 'Failed to update order status');
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Server error while updating order status");
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="dashboard-container">
      <h2>Seller Dashboard</h2>
      {orders.length === 0 ? (
        <p>No orders received yet.</p>
      ) : (
        <div className="dashboard-orders">
          {orders.map(order => (
            <div key={order.id} className="dashboard-order-card">
              <img src={order.product.image_url} alt={order.product.title} className="order-image" />
              <div className="order-details">
                <h4>{order.product.title}</h4>
                <p>Quantity: {order.quantity}</p>
                <p>Total: ฿{order.total_price}</p>
                <div className="order-status-row">
                  <span className={`order-status ${order.status.toLowerCase()}`}>{order.status}</span>
                  <span className={`payment-status ${order.payment_status.toLowerCase()}`}>{order.payment_status}</span>
                </div>
                {order.buyer && <p>Buyer: {order.buyer.username}</p>}
                <select
                  className="status-select"
                  value={order.status}
                  onChange={(e) => handleStatusChange(order.id, e.target.value)}
                >
                  <option value="Pending">Pending</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SellerDashboard;
