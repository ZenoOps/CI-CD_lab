import React, { useState, useEffect } from 'react';
import './ProductUpload.css';

function ProductUpload({ onUploadSuccess }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [secondHandPrice, setSecondHandPrice] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [condition, setCondition] = useState('gently_used');
  const [size, setSize] = useState('M');
  const [color, setColor] = useState('white');
  const [image, setImage] = useState(null);
  const [authDoc, setAuthDoc] = useState(null);
  const [message, setMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(null);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? 'https://ladyfirstme.pythonanywhere.com'
    : 'http://localhost:8000';

  useEffect(() => {
    async function fetchData() {
      try {
        const catRes = await fetch(`${API_BASE_URL}/api/auth/categories/`);
        const catData = await catRes.json();
        setCategories(catData);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
      try {
        const brandRes = await fetch(`${API_BASE_URL}/api/auth/brands/`);
        const brandData = await brandRes.json();
        setBrands(brandData);
      } catch (error) {
        console.error("Error fetching brands:", error);
      }
    }
    fetchData();
  }, [API_BASE_URL]); // Added API_BASE_URL to dependency array

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setOriginalPrice('');
    setSecondHandPrice('');
    setCategory('');
    setBrand('');
    setCondition('gently_used');
    setSize('M');
    setColor('white');
    setImage(null);
    setAuthDoc(null);
    setUploadProgress(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setUploadProgress(0);
    const data = new FormData();
    data.append("title", title);
    data.append("description", description);
    data.append("original_price", originalPrice);
    data.append("second_hand_price", secondHandPrice);
    data.append("category", category);
    if (brand) data.append("brand", brand);
    data.append("condition", condition);
    data.append("size", size);
    data.append("color", color);
    if (image) data.append("image", image);
    if (authDoc) data.append("authenticity_document", authDoc);

    const token = localStorage.getItem("access_token");
    if (!token) {
      setMessage("Error: No authentication token found.");
      return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE_URL}/api/auth/products/`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setMessage("Product uploaded successfully!");
        resetForm();
        onUploadSuccess && onUploadSuccess(); // Call the onUploadSuccess prop
      } else {
        setMessage("Error: " + xhr.responseText);
        setUploadProgress(null);
      }
    };

    xhr.onerror = () => {
      setMessage("Upload failed.");
      setUploadProgress(null);
    };

    xhr.send(data);
  };

  const handleDragOver = (e) => e.preventDefault();
  const handleDragEnter = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setImage(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  return (
    <div className="upload-wrapper">
      <form className="upload-form" onSubmit={handleSubmit} encType="multipart/form-data">
        <div className="upload-left">
          <label
            htmlFor="image-upload"
            className={`file-drop ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {image ? (
              <img src={URL.createObjectURL(image)} alt="Preview" />
            ) : (
              <>
                <span className="upload-icon">⬆️</span>
                <p>Choose a file or drag and drop it here</p>
                <p className="upload-hint">High quality .jpg files &lt; 20 MB or .mp4 &lt; 200 MB</p>
              </>
            )}
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files[0])}
              hidden
            />
          </label>
        </div>

        <div className="upload-right">
          <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} required />
          <input type="number" placeholder="Original Price" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} />
          <input type="number" placeholder="Second Hand Price" value={secondHandPrice} onChange={(e) => setSecondHandPrice(e.target.value)} required />

          <select value={category} onChange={(e) => setCategory(e.target.value)} required>
            <option value="">Choose Category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>

          <select value={brand} onChange={(e) => setBrand(e.target.value)}>
            <option value="">Choose Brand (optional)</option>
            {brands.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
          </select>

          <select value={condition} onChange={(e) => setCondition(e.target.value)}>
            <option value="gently_used">Gently Used</option>
            <option value="like_new">Like New</option>
            <option value="worn">Worn</option>
            <option value="brand_new">Brand New</option>
          </select>

          <select value={size} onChange={(e) => setSize(e.target.value)}>
            <option value="S">S</option>
            <option value="M">M</option>
            <option value="L">L</option>
            <option value="XL">XL</option>
            <option value="XXL">XXL</option>
            <option value="custom">Custom</option>
          </select>

          <select value={color} onChange={(e) => setColor(e.target.value)}>
            <option value="black">Black</option>
            <option value="white">White</option>
            <option value="brown">Brown</option>
            <option value="red">Red</option>
            <option value="yellow">Yellow</option>
          </select>

          <label>Authenticity Document (optional)</label>
          <input type="file" accept="application/pdf,image/*" onChange={(e) => setAuthDoc(e.target.files[0])} />

          <button type="submit">Upload Product</button>

          {uploadProgress !== null && (
            <div className="progress-bar">
              <div className="progress" style={{ width: `${uploadProgress}%` }} />
              <span>{uploadProgress}%</span>
            </div>
          )}

          {message && <p className="upload-message">{message}</p>}
        </div>
      </form>
    </div>
  );
}

export default ProductUpload;