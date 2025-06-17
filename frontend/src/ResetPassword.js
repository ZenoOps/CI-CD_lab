// src/ResetPassword.js
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ResetPassword.css';

function ResetPassword() {
  const { token } = useParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://ladyfirstme.pythonanywhere.com/api/auth'
  : 'http://localhost:8000/api/auth';

  // `${API_BASE_URL}

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/reset-password/${token}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: newPassword, confirm_password: confirmPassword }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Password reset successfully. Redirecting to login...');
        setTimeout(() => navigate('/'), 2000);
      } else {
        setError(data.error || 'Failed to reset password.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div className="reset-password-container">
      <h2>Reset Password</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <button type="submit">Reset Password</button>
        {message && <p className="message">{message}</p>}
        {error && <p className="error">{error}</p>}
        <p>
          <button type="button" onClick={() => navigate('/')}>Back to Login</button>
        </p>
      </form>
    </div>
  );
}

export default ResetPassword;