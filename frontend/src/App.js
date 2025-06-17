// src/App.js
import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Register from './Register';
import Login from './Login';
import AccountSetup from './AccountSetup';
import BodyMeasurements from './BodyMeasurements';
import Dashboard from './Dashboard';
import Profile from './Profile';
import UploadProduct from './UploadProduct';
import UserProfile from './UserProfile';
import ProductDetail from './ProductDetail';
import Header from './Header';
import Footer from './Footer';
import Cart from './Cart';
import Checkout from './Checkout';
import OrderHistory from './OrderHistory';
import SellerDashboard from './SellerDashboard';
import InboxPage from './InboxPage';
import ForgotPassword from './ForgotPassword';
import './App.css';

function AppContent() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? 'https://ladyfirstme.pythonanywhere.com/api/auth'
    : 'http://localhost:8000/api/auth';

  const refreshToken = useCallback(async () => {
    const refresh_token = localStorage.getItem('refresh_token');
    if (!refresh_token) {
      setIsAuthenticated(false);
      setUser(null);
      setLoading(false);
      return false;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refresh_token }),
      });
      if (response.ok) {
        const json = await response.json();
        localStorage.setItem('access_token', json.access);
        return true;
      } else {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
        setIsAuthenticated(false);
        navigate('/');
        return false;
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
      setIsAuthenticated(false);
      navigate('/');
      return false;
    }
  }, [navigate, API_BASE_URL]);

  const handleLogout = useCallback(async () => {
    try {
      let accessToken = localStorage.getItem('access_token');
      const refreshTokenValue = localStorage.getItem('refresh_token');
  
      if (!refreshTokenValue) {
        console.warn('No refresh token found, proceeding with client-side cleanup');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
        setIsAuthenticated(false);
        navigate('/');
        return;
      }
  
      if (!accessToken) {
        const refreshed = await refreshToken();
        if (!refreshed) {
          console.warn('Failed to refresh token, proceeding with cleanup');
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          setUser(null);
          setIsAuthenticated(false);
          navigate('/');
          return;
        }
        accessToken = localStorage.getItem('access_token');
      }
  
      const response = await fetch(`${API_BASE_URL}/logout/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ refresh: refreshTokenValue }),
      });
  
      if (!response.ok) {
        // Treat 401 as a non-critical error since we're logging out anyway
        if (response.status === 401) {
          console.warn('User not found during logout, proceeding with cleanup');
        } else {
          console.error('Logout failed:', response.status, await response.text());
        }
      }
  
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
      setIsAuthenticated(false);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
      setIsAuthenticated(false);
      navigate('/');
    }
  }, [navigate, refreshToken, API_BASE_URL]);

  const checkUser = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('access_token');
    if (!token) {
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/user/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUser({
          id: data.id,
          username: data.username,
          email: data.email,
          phone_number: data.phone_number,
          is_setup_complete: data.is_setup_complete,
        });
        setIsAuthenticated(true);
      } else if (response.status === 401) {
        const refreshed = await refreshToken();
        if (refreshed) {
          await checkUser();
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, [refreshToken, API_BASE_URL]);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  const handleLoginSuccess = () => {
    checkUser();
  };

  const handleSetupComplete = () => {
    checkUser();
    navigate('/measurements');
  };

  const toggleToLogin = () => setShowRegister(false);
  const toggleToRegister = () => setShowRegister(true);

  if (loading) {
    return <p>Loading please wait...</p>;
  }

  return (
    <div className="app-container">
      <Header isAuthenticated={isAuthenticated} user={user} handleLogout={handleLogout} />
      <main>
        <Routes>
          <Route path="/profile/:username" element={<UserProfile />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          {isAuthenticated ? (
            user.is_setup_complete ? (
              <>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/upload" element={<UploadProduct />} />
                <Route path="/profile" element={<Profile handleLogout={handleLogout} />} /> {/* Pass handleLogout */}
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/orders" element={<OrderHistory />} />
                <Route path="/seller/dashboard" element={<SellerDashboard />} />
                <Route path="/inbox" element={<InboxPage />} />
                <Route path="/measurements" element={<BodyMeasurements />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </>
            ) : (
              <>
                <Route
                  path="/account-setup"
                  element={<AccountSetup onSetupComplete={handleSetupComplete} user={user} />}
                />
                <Route path="*" element={<Navigate to="/account-setup" replace />} />
              </>
            )
          ) : (
            <>
              <Route
                path="/"
                element={showRegister ? (
                  <Register onRegisterSuccess={toggleToLogin} toggleToLogin={toggleToLogin} />
                ) : (
                  <Login onLogin={handleLoginSuccess} toggleToRegister={toggleToRegister} />
                )}
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;