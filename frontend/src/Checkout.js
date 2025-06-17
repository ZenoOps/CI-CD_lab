// src/Checkout.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import countries from './countries';
import './Checkout.css';

function Checkout() {
  const [cartItems, setCartItems] = useState([]);
  const [userInfo, setUserInfo] = useState({
    username: '',
    email: '',
    phone_number: '',
  });
  const [selectedAddress, setSelectedAddress] = useState({
    country: '',
    province: '',
    city: '',
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const navigate = useNavigate();

  const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://ladyfirstme.pythonanywhere.com'
  : 'http://localhost:8000';

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('cart')) || [];
    setCartItems(savedCart);

    const fetchUserData = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) return;

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/user/`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        if (response.ok) {
          setUserInfo(data);
          setSelectedAddress({
            country: data.country || '',
            province: data.province || '',
            city: data.city || '',
          });
        }
      } catch (err) {
        console.error("Error fetching user info", err);
      }
    };

    fetchUserData();
  }, []);

  const isUserInfoValid = () => {
    return selectedAddress.country && selectedAddress.province && selectedAddress.city;
  };

  const handleUpdateUserInfo = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/user/`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          country: selectedAddress.country,
          province: selectedAddress.province,
          city: selectedAddress.city,
        }),
      });

      if (response.ok) {
        alert("Shipping address updated!");
      } else {
        const data = await response.json();
        console.error("Update failed", data);
        setMessage(data.error || "Failed to update address");
      }
    } catch (err) {
      console.error("Update error", err);
    }
  };

  const handlePlaceOrder = async () => {
    if (!isUserInfoValid()) {
      setMessage("Please complete and confirm your shipping information before placing the order.");
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/auth/place-order/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orders: cartItems.map((item) => ({
            product: item.id,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.removeItem("cart");
        setCartItems([]);
        setMessage("Order placed successfully!");
        setConfirmed(true);
        setTimeout(() => navigate("/orders"), 2000);
      } else {
        console.error("Order failed", data);
        setMessage("Failed to place order.");
      }
    } catch (err) {
      console.error("Order placement failed", err);
      setMessage("Failed to place order.");
    } finally {
      setLoading(false);
    }
  };

  const countryObj = countries.find(c => c.name === selectedAddress.country);
  const provinces = countryObj ? countryObj.provinces : [];
  const provinceObj = provinces.find(p => p.name === selectedAddress.province);
  const cities = provinceObj ? provinceObj.cities : [];

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="checkout-container">
      <h2>Checkout</h2>
      <div className="user-info-form">
        <h3 className='checkout-h3'>Shipping Information</h3>
        {['username', 'email', 'phone_number'].map((field) => (
          <input
            key={field}
            type={field === 'email' ? 'email' : 'text'}
            placeholder={field.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            value={userInfo[field] || ''}
            readOnly
          />
        ))}

        <label>Country:</label>
        <select value={selectedAddress.country} onChange={(e) => setSelectedAddress({ country: e.target.value, province: '', city: '' })}>
          <option value="">Select a country</option>
          {countries.map((c) => (
            <option key={c.code} value={c.name}>{c.name}</option>
          ))}
        </select>

        <label>Province:</label>
        <select value={selectedAddress.province} onChange={(e) => setSelectedAddress({ ...selectedAddress, province: e.target.value, city: '' })} disabled={!selectedAddress.country}>
          <option value="">Select a province</option>
          {provinces.map((p) => (
            <option key={p.name} value={p.name}>{p.name}</option>
          ))}
        </select>

        <label>City:</label>
        <select value={selectedAddress.city} onChange={(e) => setSelectedAddress({ ...selectedAddress, city: e.target.value })} disabled={!selectedAddress.province}>
          <option value="">Select a city</option>
          {cities.map((city) => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>

        <div className="address-preview">
          <strong>Current Shipping Address:</strong>
          <p>
            {selectedAddress.city || '-'}, {selectedAddress.province || '-'}, {selectedAddress.country || '-'}
          </p>
        </div>

        <button onClick={handleUpdateUserInfo} disabled={loading}>Update Info</button>
      </div>

      <div className="order-summary">
        <h3 className='checkout-h3'>Order Summary</h3>
        {cartItems.map((item) => (
          <div key={item.id} className="order-item">
            <p>{item.title} x {item.quantity} = ฿{(item.price * item.quantity).toFixed(2)}</p>
          </div>
        ))}
        <h4>Total: ฿{totalPrice.toFixed(2)}</h4>

        {!confirmed && (
          <button onClick={handlePlaceOrder} className="btn-checkout" disabled={loading || cartItems.length === 0}>
            {loading ? 'Placing Order...' : 'Confirm & Place Order'}
          </button>
        )}
      </div>

      {message && <p className="checkout-message">{message}</p>}
    </div>
  );
}

export default Checkout;
