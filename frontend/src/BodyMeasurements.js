import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Register.css';
import { FaWeight, FaShoePrints, FaRuler } from 'react-icons/fa';

function BodyMeasurements() {
  const [measurements, setMeasurements] = useState({
    weight_kg: '',
    height_cm: '',
    chest_bust: '',
    waist: '',
    hip: '',
    inseam: '',
    foot_size_us: '',
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [weightUnit, setWeightUnit] = useState('kg');
  const [weightInput, setWeightInput] = useState('');
  const [heightUnit, setHeightUnit] = useState('cm');
  const [heightCmInput, setHeightCmInput] = useState('');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [footSizeUnit, setFootSizeUnit] = useState('us');
  const [footSizeInput, setFootSizeInput] = useState('');

  const location = useLocation();
  const navigate = useNavigate();
  const redirectMessage = location.state?.message || '';

  const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? 'https://ladyfirstme.pythonanywhere.com/api/auth'
    : 'http://localhost:8000/api/auth';

  useEffect(() => {
    const fetchMeasurements = async () => {
      setIsLoading(true);
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
          setMeasurements({
            weight_kg: data.weight_kg || '',
            height_cm: data.height_cm || '',
            chest_bust: data.chest_bust || '',
            waist: data.waist || '',
            hip: data.hip || '',
            inseam: data.inseam || '',
            foot_size_us: data.foot_size_us || '',
          });
          setWeightInput(data.weight_kg || '');
          setHeightCmInput(data.height_cm || '');
          setFootSizeInput(data.foot_size_us || '');
        } else {
          setMessage('Failed to fetch measurements.');
        }
      } catch (error) {
        setMessage('Error: Unable to connect to the server.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchMeasurements();
  }, [API_BASE_URL]);

  useEffect(() => {
    if (weightUnit === 'lbs' && measurements.weight_kg) {
      setWeightInput((parseFloat(measurements.weight_kg) / 0.453592).toFixed(2));
    } else {
      setWeightInput(measurements.weight_kg || '');
    }
  }, [weightUnit, measurements.weight_kg]);

  useEffect(() => {
    if (heightUnit === 'ft' && measurements.height_cm) {
      const totalInches = parseFloat(measurements.height_cm) / 2.54;
      const ft = Math.floor(totalInches / 12);
      const inch = (totalInches % 12).toFixed(1);
      setHeightFt(ft);
      setHeightIn(inch);
    } else {
      setHeightCmInput(measurements.height_cm || '');
    }
  }, [heightUnit, measurements.height_cm]);

  useEffect(() => {
    if (footSizeUnit === 'eu' && measurements.foot_size_us) {
      const euSize = parseFloat(measurements.foot_size_us) + 31;
      setFootSizeInput(euSize.toFixed(1));
    } else {
      setFootSizeInput(measurements.foot_size_us || '');
    }
  }, [footSizeUnit, measurements.foot_size_us]);

  const convertWeightToKg = (value, unit) => {
    if (!value || isNaN(value)) return '';
    return unit === 'lbs' ? parseFloat(value) * 0.453592 : parseFloat(value);
  };

  const convertHeightToCm = (ft, inch, unit, cmValue) => {
    if (unit === 'cm') {
      return cmValue && !isNaN(cmValue) ? parseFloat(cmValue) : '';
    }
    const feet = ft && !isNaN(ft) ? parseInt(ft) : 0;
    const inches = inch && !isNaN(inch) ? parseFloat(inch) : 0;
    return (feet * 12 + inches) * 2.54;
  };

  const convertFootSizeToUs = (value, unit) => {
    if (!value || isNaN(value)) return '';
    if (unit === 'eu') {
      const usSize = parseFloat(value) - 31;
      return usSize > 0 ? usSize.toFixed(1) : '';
    }
    return parseFloat(value).toFixed(1);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setMeasurements({ ...measurements, [name]: value });
    setErrors({ ...errors, [name]: '' });

    if (value && (isNaN(value) || parseFloat(value) <= 0)) {
      setErrors({ ...errors, [name]: `${name.replace('_', ' ')} must be a positive number.` });
    }
  };

  const handleWeightChange = (e) => {
    const value = e.target.value;
    setWeightInput(value);
    setErrors((prev) => ({ ...prev, weight_kg: '' }));

    if (!value || isNaN(value) || parseFloat(value) <= 0) {
      setErrors((prev) => ({ ...prev, weight_kg: 'Weight must be a positive number.' }));
      setMeasurements((prev) => ({ ...prev, weight_kg: '' }));
      return;
    }

    const weightInKg = convertWeightToKg(value, weightUnit);
    setMeasurements((prev) => ({ ...prev, weight_kg: weightInKg }));
  };

  const handleHeightChange = (e, type) => {
    const value = e.target.value;
    if (type === 'cm') {
      setHeightCmInput(value);
      setErrors({ ...errors, height_cm: '' });
      if (value && (isNaN(value) || parseFloat(value) <= 0)) {
        setErrors({ ...errors, height_cm: 'Height must be a positive number.' });
      } else {
        setMeasurements({ ...measurements, height_cm: value });
      }
    } else if (type === 'ft') {
      setHeightFt(value);
      setErrors({ ...errors, height_cm: '' });
      if (value && (isNaN(value) || parseInt(value) < 0)) {
        setErrors({ ...errors, height_cm: 'Height must be a positive number.' });
      } else {
        setMeasurements({
          ...measurements,
          height_cm: convertHeightToCm(value, heightIn, heightUnit, heightCmInput),
        });
      }
    } else if (type === 'in') {
      setHeightIn(value);
      setErrors({ ...errors, height_cm: '' });
      if (value && (isNaN(value) || parseFloat(value) < 0)) {
        setErrors({ ...errors, height_cm: 'Height must be a positive number.' });
      } else {
        setMeasurements({
          ...measurements,
          height_cm: convertHeightToCm(heightFt, value, heightUnit, heightCmInput),
        });
      }
    }
  };

  const handleFootSizeChange = (e) => {
    const value = e.target.value;
    setFootSizeInput(value);
    setErrors({ ...errors, foot_size_us: '' });
    if (value && (isNaN(value) || parseFloat(value) <= 0)) {
      setErrors({ ...errors, foot_size_us: 'Foot size must be a positive number.' });
    } else {
      const convertedSize = convertFootSizeToUs(value, footSizeUnit);
      setMeasurements({ ...measurements, foot_size_us: convertedSize });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const numericFields = ['weight_kg', 'height_cm', 'chest_bust', 'waist', 'hip', 'inseam', 'foot_size_us'];
    
    // Check for positive numbers
    numericFields.forEach((field) => {
      if (measurements[field] && (isNaN(measurements[field]) || parseFloat(measurements[field]) <= 0)) {
        newErrors[field] = `${field.replace('_', ' ')} must be a positive number.`;
      }
    });

    // If redirected to set measurements for selling, enforce required fields
    if (redirectMessage) {
      const requiredFields = ['height_cm', 'chest_bust', 'waist', 'hip', 'inseam', 'foot_size_us'];
      requiredFields.forEach((field) => {
        if (!measurements[field] || measurements[field] === '' || measurements[field] === null) {
          newErrors[field] = `${field.replace('_', ' ')} is required to sell a product.`;
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);

    if (!validateForm()) {
      setMessage('Please correct the errors in the form.');
      setIsLoading(false);
      return;
    }

    try {
      const payload = { ...measurements };
      Object.keys(payload).forEach((key) => {
        if (payload[key] === '') payload[key] = null;
      });

      const response = await fetch(`${API_BASE_URL}/body-measurements/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await response.json();
      if (response.ok) {
        setMessage('Measurements updated successfully!');
        setMeasurements(json.measurements);
        setWeightInput(json.measurements.weight_kg || '');
        setHeightCmInput(json.measurements.height_cm || '');
        setFootSizeInput(json.measurements.foot_size_us || '');
        // If redirected from "Sell", navigate to /upload after successful save
        if (redirectMessage) {
          navigate('/upload');
        }
      } else {
        setErrors(json);
        setMessage(json.error || 'Failed to update measurements.');
      }
    } catch (error) {
      setMessage('Error: Unable to connect to the server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-container">
      <form className="register-form" onSubmit={handleSubmit}>
        <h2>Body Measurements</h2>
        <p>All fields are optional unless specified. Leave blank to unset.</p>
        {redirectMessage && <p className="error-text">{redirectMessage}</p>}

        <div className="form-step">
          <div className="input-group">
            <label htmlFor="weight_kg">
              <FaWeight className="input-icon" /> Weight
            </label>
            <div className="unit-input">
              <input
                type="number"
                id="weight_kg"
                placeholder="Enter your weight"
                value={weightInput}
                onChange={handleWeightChange}
                min="0"
                step="0.1"
                className={errors.weight_kg ? 'input-error' : ''}
              />
              <select
                value={weightUnit}
                onChange={(e) => setWeightUnit(e.target.value)}
              >
                <option value="kg">kg</option>
                <option value="lbs">lbs</option>
              </select>
            </div>
            {errors.weight_kg && <p className="error-text">{errors.weight_kg}</p>}
          </div>

          <div className="input-group">
            <label htmlFor="height_cm">
              <FaRuler className="input-icon" /> Height
            </label>
            <div className="unit-input">
              {heightUnit === 'cm' ? (
                <input
                  type="number"
                  id="height_cm"
                  placeholder="Enter your height"
                  value={heightCmInput}
                  onChange={(e) => handleHeightChange(e, 'cm')}
                  min="0"
                  step="0.1"
                  className={errors.height_cm ? 'input-error' : ''}
                />
              ) : (
                <div className="height-ft-in">
                  <input
                    type="number"
                    id="height_ft"
                    placeholder="Feet"
                    value={heightFt}
                    onChange={(e) => handleHeightChange(e, 'ft')}
                    min="0"
                    className={errors.height_cm ? 'input-error' : ''}
                  />
                  <input
                    type="number"
                    id="height_in"
                    placeholder="Inches"
                    value={heightIn}
                    onChange={(e) => handleHeightChange(e, 'in')}
                    min="0"
                    step="0.1"
                    className={errors.height_cm ? 'input-error' : ''}
                  />
                </div>
              )}
              <select
                value={heightUnit}
                onChange={(e) => setHeightUnit(e.target.value)}
              >
                <option value="cm">cm</option>
                <option value="ft">ft/in</option>
              </select>
            </div>
            {errors.height_cm && <p className="error-text">{errors.height_cm}</p>}
          </div>

          <div className="input-group">
            <label htmlFor="chest_bust">
              <FaRuler className="input-icon" /> Chest/Bust (cm)
            </label>
            <input
              type="number"
              id="chest_bust"
              name="chest_bust"
              placeholder="Enter your chest/bust"
              value={measurements.chest_bust}
              onChange={handleChange}
              min="0"
              step="0.1"
              className={errors.chest_bust ? 'input-error' : ''}
            />
            {errors.chest_bust && <p className="error-text">{errors.chest_bust}</p>}
          </div>

          <div className="input-group">
            <label htmlFor="waist">
              <FaRuler className="input-icon" /> Waist (cm)
            </label>
            <input
              type="number"
              id="waist"
              name="waist"
              placeholder="Enter your waist"
              value={measurements.waist}
              onChange={handleChange}
              min="0"
              step="0.1"
              className={errors.waist ? 'input-error' : ''}
            />
            {errors.waist && <p className="error-text">{errors.waist}</p>}
          </div>

          <div className="input-group">
            <label htmlFor="hip">
              <FaRuler className="input-icon" /> Hip (cm)
            </label>
            <input
              type="number"
              id="hip"
              name="hip"
              placeholder="Enter your hip"
              value={measurements.hip}
              onChange={handleChange}
              min="0"
              step="0.1"
              className={errors.hip ? 'input-error' : ''}
            />
            {errors.hip && <p className="error-text">{errors.hip}</p>}
          </div>

          <div className="input-group">
            <label htmlFor="inseam">
              <FaRuler className="input-icon" /> Inseam (cm)
            </label>
            <input
              type="number"
              id="inseam"
              name="inseam"
              placeholder="Enter your inseam"
              value={measurements.inseam}
              onChange={handleChange}
              min="0"
              step="0.1"
              className={errors.inseam ? 'input-error' : ''}
            />
            {errors.inseam && <p className="error-text">{errors.inseam}</p>}
          </div>

          <div className="input-group">
            <label htmlFor="foot_size_us">
              <FaShoePrints className="input-icon" /> Foot Size
            </label>
            <div className="unit-input">
              <input
                type="number"
                id="foot_size_us"
                placeholder="Enter your foot size"
                value={footSizeInput}
                onChange={handleFootSizeChange}
                min="0"
                step="0.1"
                className={errors.foot_size_us ? 'input-error' : ''}
              />
              <select
                value={footSizeUnit}
                onChange={(e) => setFootSizeUnit(e.target.value)}
              >
                <option value="us">US</option>
                <option value="eu">EU</option>
              </select>
            </div>
            {errors.foot_size_us && <p className="error-text">{errors.foot_size_us}</p>}
          </div>

          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Measurements'}
          </button>
        </div>

        {message && (
          <p className={message.includes('Error') ? 'error-text' : 'message'}>{message}</p>
        )}
      </form>
    </div>
  );
}

export default BodyMeasurements;