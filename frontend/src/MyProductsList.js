import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { FaEdit, FaTrash } from "react-icons/fa";
import "./MyProductsList.css";

function MyProductsList() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    second_hand_price: "",
  });

  const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? 'https://ladyfirstme.pythonanywhere.com/api/auth'
    : 'http://localhost:8000/api/auth';

  const getAccessToken = () => localStorage.getItem("access_token");

  const refreshToken = useCallback(async () => {
    const refresh_token = localStorage.getItem('refresh_token');
    if (!refresh_token) {
      setError("Authentication token expired. Please log in again.");
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
        setError("Session expired. Please log in again.");
        return false;
      }
    } catch (error) {
      setError("Error refreshing token: " + error.message);
      return false;
    }
  }, []);

  const fetchMyProducts = useCallback(async () => {
    setLoading(true);
    const token = getAccessToken();
    if (!token) {
      setError("Please log in to view your products.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/my-products/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setProducts(data);
        setError("");
      } else if (response.status === 401) {
        const refreshed = await refreshToken();
        if (refreshed) {
          await fetchMyProducts(); // Retry after refreshing token
        } else {
          setError("Session expired. Please log in again.");
        }
      } else {
        setError("Failed to load your products. Please try again.");
      }
    } catch (err) {
      setError("Error fetching products: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [refreshToken]);

  useEffect(() => {
    fetchMyProducts();
  }, [fetchMyProducts]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    const token = getAccessToken();
    if (!token) {
      setError("Please log in to delete products.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/products/${id}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setProducts((prev) => prev.filter((product) => product.id !== id));
        setError("");
      } else if (response.status === 401) {
        const refreshed = await refreshToken();
        if (refreshed) {
          await handleDelete(id); // Retry after refreshing token
        } else {
          setError("Session expired. Please log in again.");
        }
      } else if (response.status === 403) {
        setError("You are not authorized to delete this product.");
      } else {
        setError("Failed to delete product. Please try again.");
      }
    } catch (error) {
      setError("Error deleting product: " + error.message);
    }
  };

  const openEditForm = (product) => {
    setEditProduct(product);
    setFormData({
      title: product.title,
      description: product.description,
      second_hand_price: product.second_hand_price,
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEdit = async () => {
    if (!editProduct) return;
    const token = getAccessToken();
    if (!token) {
      setError("Please log in to edit products.");
      return;
    }

    try {
      const updatedData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        second_hand_price: parseFloat(formData.second_hand_price) || 0,
      };

      const response = await fetch(`${API_BASE_URL}/products/${editProduct.id}/`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
      });

      if (response.ok) {
        setProducts((prev) =>
          prev.map((product) =>
            product.id === editProduct.id ? { ...product, ...updatedData } : product
          )
        );
        setEditProduct(null);
        setError("");
      } else if (response.status === 401) {
        const refreshed = await refreshToken();
        if (refreshed) {
          await handleEdit(); // Retry after refreshing token
        } else {
          setError("Session expired. Please log in again.");
        }
      } else {
        const errorData = await response.json();
        setError(`Failed to update product: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      setError("Error updating product: " + error.message);
    }
  };

  return (
    <div className="my-products-container">
      <h2>My Uploaded Products</h2>
      {error && <p className="error-message">{error}</p>}
      {loading && <p className="loading-message">Loading products...</p>}

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
                      : product.image.startsWith("http")
                      ? product.image
                      : `${API_BASE_URL.replace('/api/auth', '')}/media/${product.image}`
                  }
                  alt={product.title}
                />
                <div className="card-body">
                  <h3>{product.title}</h3>
                  <p className="price">${product.second_hand_price}</p>
                  <p>{product.category_name} | {product.brand_name}</p>
                </div>
              </Link>

              <div className="icon-buttons">
                <FaEdit className="icon edit-icon" onClick={() => openEditForm(product)} />
                <FaTrash className="icon delete-icon" onClick={() => handleDelete(product.id)} />
              </div>
            </div>
          ))
        ) : (
          !loading && <p>No products found.</p>
        )}
      </div>

      {editProduct && (
        <div className="modal">
          <div className="modal-content">
            <h3>Edit Product</h3>
            <label>Title:</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />

            <label>Description:</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
            ></textarea>

            <label>Price (USD):</label>
            <input
              type="number"
              name="second_hand_price"
              value={formData.second_hand_price}
              onChange={handleChange}
              min="0"
              step="0.01"
              required
            />

            <div className="modal-buttons">
              <button onClick={handleEdit} className="save-btn">Save</button>
              <button onClick={() => setEditProduct(null)} className="cancel-btn">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyProductsList;