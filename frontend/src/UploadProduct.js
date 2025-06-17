import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductUpload from './ProductUpload';

function UploadProduct() {
  const navigate = useNavigate();
  const [isSetupComplete, setIsSetupComplete] = useState(null);
  const [areMeasurementsSet, setAreMeasurementsSet] = useState(null);
  const [message, setMessage] = useState('');

  const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? 'https://ladyfirstme.pythonanywhere.com/api/auth'
    : 'http://localhost:8000/api/auth';

  // Check if user setup is complete
  useEffect(() => {
    const checkUserSetup = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setMessage('Error: No authentication token found.');
        navigate('/');
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
          if (!data.is_setup_complete) {
            setIsSetupComplete(false);
            navigate('/account-setup', {
              state: { message: 'Please complete your account setup before uploading a product.' },
            });
          } else {
            setIsSetupComplete(true);
          }
        } else {
          setMessage('Error: Unable to verify user status.');
          navigate('/');
        }
      } catch (error) {
        setMessage('Error: Unable to connect to the server.');
        navigate('/');
      }
    };
    checkUserSetup();
  }, [navigate, API_BASE_URL]);

  // Check if body measurements are set
  useEffect(() => {
    if (!isSetupComplete) return; // Wait until setup check is complete

    const checkBodyMeasurements = async () => {
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
            setAreMeasurementsSet(false);
            navigate('/measurements', {
              state: { message: 'Please set your Height, Chest/Bust, Waist, Hip, Inseam, and Foot Size before selling a product.' },
            });
          } else {
            setAreMeasurementsSet(true);
          }
        } else {
          setMessage('Failed to fetch measurements.');
          navigate('/measurements');
        }
      } catch (error) {
        setMessage('Error: Unable to connect to the server.');
        navigate('/measurements');
      }
    };
    checkBodyMeasurements();
  }, [isSetupComplete, navigate, API_BASE_URL]);

  // Handler for successful upload
  const handleUploadSuccess = () => {
    setMessage('Product uploaded successfully! Redirecting to dashboard...');
    setTimeout(() => {
      navigate('/dashboard');
    }, 2000);
  };

  // Display a loading message or redirect message while checking setup status
  if (isSetupComplete === null || areMeasurementsSet === null) {
    return <p>Checking account setup and measurements...</p>;
  }

  if (!isSetupComplete || !areMeasurementsSet) {
    return <p>Redirecting...</p>;
  }

  return (
    <div>
      {message && <p className="upload-message">{message}</p>}
      <ProductUpload onUploadSuccess={handleUploadSuccess} />
    </div>
  );
}

export default UploadProduct;