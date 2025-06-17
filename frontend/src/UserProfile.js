import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import './UserProfile.css';

function UserProfile({ isAuthenticated }) {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [errorProfile, setErrorProfile] = useState('');
  const [errorProducts, setErrorProducts] = useState('');

  const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? 'https://ladyfirstme.pythonanywhere.com/api/auth'
    : 'http://localhost:8000/api/auth';

  const MEDIA_BASE_URL = process.env.NODE_ENV === 'production'
    ? 'https://ladyfirstme.pythonanywhere.com'
    : 'http://localhost:8000';

  // Fetch public profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/profile/${username}/`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Profile data:', data); // Debug log
          setProfile(data);
        } else {
          const errorText = await response.text();
          setErrorProfile(`Profile not found (Status: ${response.status}). ${errorText}`);
        }
      } catch (err) {
        setErrorProfile('Error fetching profile: ' + err.message);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [username]);

  // Fetch products created by this user
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/user-products/${username}/`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Products data:', data); // Debug log
          // Ensure data is an array
          if (Array.isArray(data)) {
            setProducts(data);
          } else {
            setErrorProducts('Invalid products data format received from server.');
          }
        } else {
          const errorText = await response.text();
          setErrorProducts(`Failed to load products (Status: ${response.status}). ${errorText}`);
        }
      } catch (err) {
        setErrorProducts('Error fetching products: ' + err.message);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, [username]);

  // Show loading state for profile
  if (loadingProfile) return <p className="loading-message">Loading profile...</p>;

  // Show error message if profile fetch fails
  if (errorProfile) return <p className="error-message">{errorProfile}</p>;

  return (
    <div className="user-profile">
      <h2>{profile.username}'s Profile</h2>

      <div className="profile-info">
        {/* Profile Image */}
        <img
          className="profile-picture"
          src={
            profile.profile_picture
              ? profile.profile_picture.startsWith('http')
                ? profile.profile_picture
                : `${MEDIA_BASE_URL}/media/${profile.profile_picture}`
              : "https://t4.ftcdn.net/jpg/08/70/79/11/360_F_870791115_Uf9FfGH8xZbdrtUinaJbEMKtIAVucoLE.jpg"
          }
          alt={`${profile.username}'s profile`}
          onError={(e) => {
            console.log('Profile image failed to load, falling back to default');
            e.target.src = "https://t4.ftcdn.net/jpg/08/70/79/11/360_F_870791115_Uf9FfGH8xZbdrtUinaJbEMKtIAVucoLE.jpg";
          }}
        />

        {/* User Information */}
        <div className="profile-details">
          <p><strong>Email:</strong> {profile.email || 'Not provided'}</p>
          <p><strong>Phone:</strong> {profile.phone_number || 'Not provided'}</p>
          <p>
            <strong>Location:</strong>{' '}
            {[profile.city, profile.province, profile.country]
              .filter(Boolean)
              .join(', ') || 'Not provided'}
          </p>
        </div>
      </div>

      {/* User Products */}
      <h3>Products Uploaded by {profile.username}</h3>
      {loadingProducts ? (
        <p className="loading-message">Loading products...</p>
      ) : errorProducts ? (
        <p className="error-message">{errorProducts}</p>
      ) : (
        <div className="product-cards">
          {products.length > 0 ? (
            products.map((product) => (
              <div className="product-card" key={product.id}>
                <Link to={`/products/${product.id}`} className="product-link">
                  <img
                    className="product-image"
                    src={
                      product.image_url
                        ? product.image_url
                        : product.image && product.image.startsWith('http')
                        ? product.image
                        : product.image
                        ? `${MEDIA_BASE_URL}/media/${product.image}`
                        : "https://t4.ftcdn.net/jpg/08/70/79/11/360_F_870791115_Uf9FfGH8xZbdrtUinaJbEMKtIAVucoLE.jpg"
                    }
                    alt={product.title}
                    onError={(e) => {
                      console.log('Product image failed to load, falling back to default');
                      e.target.src = "https://t4.ftcdn.net/jpg/08/70/79/11/360_F_870791115_Uf9FfGH8xZbdrtUinaJbEMKtIAVucoLE.jpg";
                    }}
                  />
                  <h4>{product.title}</h4>
                  <p>Price: ${product.second_hand_price}</p>
                  <p>
                    {product.category_name || 'Unknown Category'} |{' '}
                    {product.brand_name || 'Unknown Brand'}
                  </p>
                </Link>
              </div>
            ))
          ) : (
            <p className="no-products-message">No products found.</p>
          )}
        </div>
      )}

      {/* Conditionally render the sign-up banner */}
      {!isAuthenticated && (
        <div className="seller-signup-banner">
          <h3>YOU CAN BE A SELLER</h3>
          <Link to="/" className="signup-button">SIGN UP FOR FREE</Link>
        </div>
      )}
    </div>
  );
}

export default UserProfile;