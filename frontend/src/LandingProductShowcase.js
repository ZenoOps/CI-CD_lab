import React, { useEffect, useState, useRef } from 'react';
import './LandingProductShowcase.css';
import { Link } from 'react-router-dom';


function LandingProductShowcase() {
  const [products, setProducts] = useState([]);
  const rowRef = useRef(null);

  const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? 'https://ladyfirstme.pythonanywhere.com'
    : 'http://localhost:8000';

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/auth/products/?sort_by=low_to_high&limit=10`
        );
        const data = await response.json();

        const sortedByDateDesc = (data.products || []).sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );

        setProducts(sortedByDateDesc);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchProducts();
  }, []);

  const scrollRight = () => {
    if (rowRef.current) rowRef.current.scrollBy({ left: 300, behavior: 'smooth' });
  };

  const scrollLeft = () => {
    if (rowRef.current) rowRef.current.scrollBy({ left: -300, behavior: 'smooth' });
  };

  return (
    <div className="product-showcase-container">
      <div className="product-showcase-header">
        <div className="product-tabs">
          <button className="product-tab active">Latest Arrivals</button>
        </div>
        <a href="/products?sort_by=low_to_high" className="view-all">VIEW ALL PRODUCTS</a>
      </div>

      <div className="product-row-wrapper">
        <button className="arrow-button left" onClick={scrollLeft}>←</button>

        <div className="product-cards-row" ref={rowRef}>
          {products.length > 0 ? (
            products.map((product) => (
              <Link key={product.id} to={`/products/${product.id}`} className="product-link">
                <div className="product-card">
                  <img src={product.image_url} alt={product.title} />
                  <div className="price">฿{product.second_hand_price}</div>
                  <h4>{product.title}</h4>
                  <p>{product.category_name} | {product.brand_name}</p>
                </div>
              </Link>
            ))
          ) : (
            <p style={{ padding: '1rem' }}>Loading products...</p>
          )}
        </div>

        <button className="arrow-button right" onClick={scrollRight}>→</button>
      </div>
    </div>
  );
}

export default LandingProductShowcase;
