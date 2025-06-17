import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './ProductDetail.css';

function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');

  const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://ladyfirstme.pythonanywhere.com/api/auth'
  : 'http://localhost:8000/api/auth';

  // `${API_BASE_URL}

  useEffect(() => {
    async function fetchProduct() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/products/${id}/`);
        const data = await response.json();
        if (response.ok) {
          setProduct(data);
        } else {
          setError('Failed to load product details.');
        }
      } catch (err) {
        setError('Error: ' + err.message);
      }
    }

    fetchProduct();
  }, [id]);

  if (error) return <p className="error-message">{error}</p>;
  if (!product) return <p>Loading product details...</p>;

  const discount = product.original_price && product.second_hand_price
    ? Math.round(((parseFloat(product.original_price) - parseFloat(product.second_hand_price)) / parseFloat(product.original_price)) * 100)
    : 0;

  const handleAddToCart = () => {
    const existingCart = JSON.parse(localStorage.getItem('cart')) || [];

    const newItem = {
      id: product.id,
      title: product.title,
      price: product.second_hand_price,
      image: product.image_url || `${API_BASE_URL}/media/${product.image}`,
      quantity: 1,
    };

    const isAlreadyInCart = existingCart.find((item) => item.id === product.id);

    if (!isAlreadyInCart) {
      existingCart.push(newItem);
      localStorage.setItem('cart', JSON.stringify(existingCart));
      alert('Added to cart!');
    } else {
      alert('Item already in cart!');
    }
  };

  return (
    <>
      <div className="product-detail-wrapper">
        <div className="product-detail-left">
          <img
            src={product.image_url || `${API_BASE_URL}/media/${product.image}`}
            alt={product.title}
          />
        </div>

        <div className="product-detail-right">
          <h1>{product.title}</h1>
          <div className="price-row">
            <span className="price">฿{product.second_hand_price}</span>
            <span className="original-price">฿{product.original_price}</span>
            {discount > 0 && <span className="discount">-{discount}%</span>}
          </div>

          <div className="detail-line"><strong>Brand:</strong> {product.brand_name || 'No Brand'}</div>
          <div className="detail-line"><strong>Condition:</strong> {product.condition}</div>
          <div className="detail-line"><strong>Size:</strong> {product.size}</div>
          <div className="detail-line"><strong>Color:</strong> {product.color}</div>

          <div className="product-description">
            <h4>Product Description</h4>
            <p>{product.description}</p>
          </div>

          <div className="product-detail-buttons">
            <button className="btn-outline-black">Buy Now</button>
            <button className="btn-filled-black" onClick={handleAddToCart}>Add to Cart</button>
          </div>
        </div>
      </div>

      {product.seller && (
        <div className="store-card">
          <div className="store-left">
            <div className="store-logo">
              {product.seller.username ? product.seller.username.charAt(0).toUpperCase() : 'S'}
            </div>
            <div className="store-info">
              <h3>{product.seller.username || 'Seller'}</h3>
              <div className="store-tags">
                <span className="tag">📞 {product.seller.phone_number || 'N/A'}</span>
                <span className="tag">✉️ {product.seller.email || 'N/A'}</span>
                <span className="tag">📍 {product.seller.city || 'City'}, {product.seller.province || 'Province'}, {product.seller.country || 'Country'}</span>
              </div>
            </div>
          </div>
          <div className="store-actions">
            <Link>💬 Chat</Link>
            <Link to={`/profile/${product.seller.username}`} className="btn-store-outline">
              🏪 Go to Store
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

export default ProductDetail;
