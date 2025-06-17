import React, { useEffect, useState } from 'react';
import './OrderHistory.css';
import { Link } from 'react-router-dom';

function OrderHistory() {
  const [orders, setOrders] = useState([]);

  const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://ladyfirstme.pythonanywhere.com'
  : 'http://localhost:8000';

  // `${API_BASE_URL}

  const handlePayment = async (orderId) => {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/api/auth/pay-order/${orderId}/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    if (response.ok) {
      alert("Payment successful!");
      setOrders(prev =>
        prev.map(order =>
          order.id === orderId ? { ...order, payment_status: 'Paid' } : order
        )
      );
    } else {
      alert(data.error || data.message || "Payment failed");
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/api/auth/myorders/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setOrders(data);
    };

    fetchOrders();
  }, []);

  return (
    <div className="cart-container">
      <h2>My Order History</h2>
      {orders.length === 0 ? (
        <p>No orders yet.</p>
      ) : (
        <div className="cart-items">
          {orders.map(order => (
            <div key={order.id} className="cart-item">
              <Link to={`/products/${order.product.id}`} className="order-image-link">
                <img
                  src={order.product.image_url}
                  alt={order.product.title}
                />
              </Link>
              <div className="item-info">
                <Link to={`/products/${order.product.id}`} className="order-info-title-link">
                  <h4>{order.product.title}</h4>
                </Link>
                <p>Quantity: {order.quantity}</p>
                <p>Total: ฿{order.total_price}</p>
                <div className="order-status-row">
                  <span className={`order-status ${order.status.toLowerCase()}`}>{order.status}</span>
                  <span className={`payment-status ${order.payment_status.toLowerCase()}`}>{order.payment_status}</span>
                </div>
                <p>Ordered At: {new Date(order.created_at).toLocaleString()}</p>
                {order.payment_status === 'Pending' && (
                  <button className="btn-pay-now" onClick={() => handlePayment(order.id)}>
                    Pay Now
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default OrderHistory;
