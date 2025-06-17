import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MyProductsList from './MyProductsList';
import './Profile.css'; // Ensure this CSS file includes styles for the password form

function Profile({ handleLogout }) {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_new_password: '',
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const navigate = useNavigate();

  const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? 'https://ladyfirstme.pythonanywhere.com/api/auth'
    : 'http://localhost:8000/api/auth';

  // Fetch user details
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('Authentication token not found.');
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/user/`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data);
        } else {
          setError('Failed to load user data.');
        }
      } catch (err) {
        setError('Error: ' + err.message);
      }
    };

    fetchUser();
  }, []);

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const token = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    if (!token || !refreshToken) {
      setError('Authentication token not found.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/change-password/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          old_password: passwordData.old_password,
          new_password: passwordData.new_password,
          confirm_new_password: passwordData.confirm_new_password,
          refresh_token: refreshToken,
        }),
      });

      if (response.ok) {
        setSuccess('Password changed successfully. You have been logged out.');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(
          errorData.old_password ||
          errorData.new_password ||
          errorData.confirm_new_password ||
          errorData.error ||
          'Failed to change password.'
        );
      }
    } catch (err) {
      setError('Error changing password: ' + err.message);
    }
  };

  // Handle password form input changes
  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Toggle password form visibility
  const togglePasswordForm = () => {
    setShowPasswordForm((prev) => !prev);
    setError('');
    setSuccess('');
    setPasswordData({
      old_password: '',
      new_password: '',
      confirm_new_password: '',
    });
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be reversed.')) {
      return;
    }
  
    const token = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    if (!token || !refreshToken) {
      setError('Authentication token not found.');
      return;
    }
  
    try {
      const response = await fetch(`${API_BASE_URL}/delete-account/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });
  
      if (response.ok) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        navigate('/');
      } else {
        const errorData = await response.json();
        setError(`Failed to delete account: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      setError('Error deleting account: ' + err.message);
    }
  };

  return (
    <div className="profile-container">
      <h2>Profile</h2>
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}
      {user ? (
        <div className="user-info">
          <p><strong>Username:</strong> {user.username}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Phone:</strong> {user.phone_number || 'Not provided'}</p>
          <p><strong>Country:</strong> {user.country || 'Not provided'}</p>
          <p><strong>Province:</strong> {user.province || 'Not provided'}</p>
          <p><strong>City:</strong> {user.city || 'Not provided'}</p>
          <button className="change-password-btn" onClick={togglePasswordForm}>
            {showPasswordForm ? 'Cancel' : 'Change Password'}
          </button>
          {showPasswordForm && (
            <form className="password-form" onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label htmlFor="old_password">Old Password:</label>
                <input
                  type="password"
                  id="old_password"
                  name="old_password"
                  value={passwordData.old_password}
                  onChange={handlePasswordInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="new_password">New Password:</label>
                <input
                  type="password"
                  id="new_password"
                  name="new_password"
                  value={passwordData.new_password}
                  onChange={handlePasswordInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirm_new_password">Confirm New Password:</label>
                <input
                  type="password"
                  id="confirm_new_password"
                  name="confirm_new_password"
                  value={passwordData.confirm_new_password}
                  onChange={handlePasswordInputChange}
                  required
                />
              </div>
              <button type="submit" className="submit-password-btn">
                Submit
              </button>
            </form>
          )}
          <button className="delete-account-btn" onClick={handleDeleteAccount}>
            Delete Account
          </button>
        </div>
      ) : (
        <p>Loading user data...</p>
      )}
      <MyProductsList />
    </div>
  );
}

export default Profile;