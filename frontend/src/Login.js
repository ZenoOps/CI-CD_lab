// src/Login.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Login.css';
import { FaEnvelope, FaLock } from 'react-icons/fa';

function Login({ onLogin, toggleToRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});

  const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? 'https://ladyfirstme.pythonanywhere.com/api/auth'
    : 'http://localhost:8000/api/auth';

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setErrors({});

    if (!email) {
      setErrors({ email: 'Please enter your email.' });
      setError('Please enter your email.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ email: 'Please enter a valid email address.' });
      setError('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setErrors({ password: 'Password is required.' });
      setError('Password is required.');
      return;
    }

    try {
      const payload = { email, password };

      const response = await fetch(`${API_BASE_URL}/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await response.json();
      if (response.ok) {
        localStorage.setItem('access_token', json.access);
        localStorage.setItem('refresh_token', json.refresh);
        setMessage('Logged in successfully!');
        setEmail('');
        setPassword('');
        onLogin();
      } else {
        setError(json.error || 'Invalid credentials. Please try again.');
      }
    } catch (error) {
      setError('Error: Unable to connect to the server.');
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleLogin}>
        <h2>Login to Your Account</h2>

        <div className="form-step">
          <div className="input-group">
            <label htmlFor="email">
              <FaEnvelope className="input-icon" /> Email
              <span className="helper-text"> (e.g., user@example.com)</span>
            </label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={errors.email ? 'input-error' : ''}
            />
            {errors.email && <p className="error-text">{errors.email}</p>}
          </div>

          <div className="input-group">
            <label htmlFor="password">
              <FaLock className="input-icon" /> Password
            </label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={errors.password ? 'input-error' : ''}
            />
            {errors.password && <p className="error-text">{errors.password}</p>}
          </div>
        </div>

        <button type="submit" className="btn-primary">Login</button>

        {message && <p className="message">{message}</p>}
        {error && <p className="error-text">{error}</p>}

        <p className="toggle-text">
          Don't have an account?{' '}
          <span className="toggle-link" onClick={toggleToRegister}>
            Create one.
          </span>
        </p>
        <p className="forgot-password">
          <Link to="/forgot-password">Forgot Password?</Link>
        </p>
      </form>
    </div>
  );
}

export default Login;