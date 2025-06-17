import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaSortDown, FaPowerOff } from 'react-icons/fa';
import './Header.css';

function Header({ isAuthenticated, user, handleLogout }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? 'https://ladyfirstme.pythonanywhere.com/api/auth'
    : 'http://localhost:8000/api/auth';

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);

  const checkBodyMeasurements = async (e) => {
    e.preventDefault(); // Prevent default navigation
    if (!user.is_setup_complete) {
      navigate('/account-setup', {
        state: { message: 'Complete your account setup to sell products.' },
      });
      toggleMobileMenu();
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/body-measurements/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        const requiredFields = ['height_cm', 'chest_bust', 'waist', 'hip', 'inseam', 'foot_size_us'];
        const missingFields = requiredFields.filter((field) => !data[field] || data[field] === '' || data[field] === null);

        if (missingFields.length > 0) {
          navigate('/measurements', {
            state: { message: 'Please set your Height, Chest/Bust, Waist, Hip, Inseam, and Foot Size before selling a product.' },
          });
        } else {
          navigate('/upload');
        }
      } else {
        navigate('/measurements', {
          state: { message: 'Failed to fetch measurements. Please set your measurements.' },
        });
      }
    } catch (error) {
      navigate('/measurements', {
        state: { message: 'Error fetching measurements. Please set your measurements.' },
      });
    }
    toggleMobileMenu();
  };

  return (
    <header className="header">
      {/* Left: Logo and Subtitle */}
      <div className="header-left">
        <h1>Ladyfirst.me</h1>
        <p className="subtitle">Your one-stop marketplace for buying and selling</p>
      </div>

      {/* Right: Navigation and Hamburger */}
      {isAuthenticated && (
        <div className="header-right">
          <button className="hamburger" onClick={toggleMobileMenu}>
            <FaSortDown size={30} />
          </button>
          <nav className={`nav ${isMobileMenuOpen ? 'active' : ''}`}>
            <ul>
              <li><Link to="/dashboard" onClick={toggleMobileMenu}>Dashboard</Link></li>
              <li><Link to="/profile" onClick={toggleMobileMenu}>Own</Link></li>
              <li>
                {user.is_setup_complete ? (
                  <Link to="#" onClick={checkBodyMeasurements}>Sell</Link>
                ) : (
                  <Link
                    to="/account-setup"
                    onClick={toggleMobileMenu}
                    className="disabled-link"
                    title="Complete your account setup to sell products"
                  >
                    Sell (Setup Required)
                  </Link>
                )}
              </li>
              <li><Link to="/seller/dashboard">Tickets</Link></li>
              <li><Link to={`/profile/${user.username}`} onClick={toggleMobileMenu}>Profile</Link></li>
              <li><Link to="/cart">Cart</Link></li>
              <li><Link to="/orders">Orders</Link></li>
              <li><Link to="/inbox">Inbox</Link></li>
              {/* <li><Link to="/measurements" onClick={toggleMobileMenu}>Measurements</Link></li> */}
              <li>
                <button onClick={() => { handleLogout(); toggleMobileMenu(); }} className="logout-button">
                  <FaPowerOff />
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
}

export default Header;