import React, { useState, useEffect, useCallback } from 'react';
import countries from './countries';
import './Register.css';
import { FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';

function AccountSetup({ onSetupComplete, user }) {
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(user.country || '');
  const [selectedProvince, setSelectedProvince] = useState(user.province || '');
  const [countryCode, setCountryCode] = useState('');

  const [formData, setFormData] = useState({
    username: user.username || '',
    email: user.email || '',
    phone_number: user.phone_number ? user.phone_number.replace(/^\+\d+/, '') : '',
    country_code: '',
    country: user.country || '',
    province: user.province || '',
    city: user.city || '',
    postal_code: user.postal_code || '',
    full_address: user.full_address || '',
  });

  const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? 'https://ladyfirstme.pythonanywhere.com/api/auth'
    : 'http://localhost:8000/api/auth';

  const sortedCountries = [...countries].sort((a, b) => a.name.localeCompare(b.name));

  // Get provinces for selected country
  const getProvinces = useCallback(() => {
    const country = countries.find((c) => c.name === selectedCountry);
    return country ? country.provinces : [];
  }, [selectedCountry]);

  // Get cities for selected province
  const getCities = useCallback(() => {
    const country = countries.find((c) => c.name === selectedCountry);
    if (country) {
      const province = country.provinces.find((p) => p.name === selectedProvince);
      return province ? province.cities : [];
    }
    return [];
  }, [selectedCountry, selectedProvince]);

  // Set initial country code based on user country
  useEffect(() => {
    if (user.country) {
      const country = countries.find((c) => c.name === user.country);
      if (country) {
        setCountryCode(country.phone || '');
        setFormData((prev) => ({ ...prev, country_code: country.phone || '' }));
      }
    } else {
      const defaultCountry = countries.find((c) => c.code === 'MM');
      if (defaultCountry) {
        setCountryCode(defaultCountry.phone || '');
        setFormData((prev) => ({ ...prev, country_code: defaultCountry.phone || '' }));
      }
    }
  }, [user.country]);

  // Reset province and city when country changes
  useEffect(() => {
    setFormData((prev) => ({ ...prev, province: '', city: '' }));
    setSelectedProvince('');
    const country = countries.find((c) => c.name === selectedCountry);
    setCountryCode(country ? country.phone || '' : '');
    setFormData((prev) => ({ ...prev, country_code: country ? country.phone || '' : '' }));
  }, [selectedCountry]);

  // Reset city when province changes
  useEffect(() => {
    setFormData((prev) => ({ ...prev, city: '' }));
  }, [selectedProvince]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: '' });

    if (name === 'username') {
      if (!value) {
        setErrors({ ...errors, username: 'Username is required.' });
      } else if (value.length < 3) {
        setErrors({ ...errors, username: 'Username must be at least 3 characters.' });
      }
    }

    if (name === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setErrors({ ...errors, email: 'Please enter a valid email address.' });
    }

    if (name === 'phone_number') {
      const cleanPhone = value.replace(/\D/g, '');
      if (cleanPhone && cleanPhone.length < 6) {
        setErrors({ ...errors, phone_number: 'Phone number must be at least 6 digits.' });
      } else if (!cleanPhone && user.phone_number) {
        setFormData({ ...formData, phone_number: user.phone_number.replace(/^\+\d+/, '') });
        setErrors({ ...errors, phone_number: '' });
      }
    }

    if (name === 'country') {
      setSelectedCountry(value);
      setFormData({ ...formData, country: value, province: '', city: '' });
    }

    if (name === 'province') {
      setSelectedProvince(value);
      setFormData({ ...formData, province: value, city: '' });
    }
  };

  const handleCountryCodeChange = (e) => {
    const value = e.target.value;
    setCountryCode(value);
    setFormData({ ...formData, country_code: value });
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.username) newErrors.username = 'Username is required.';
    if (formData.username && formData.username.length < 3)
      newErrors.username = 'Username must be at least 3 characters.';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = 'Please enter a valid email address.';
    if (formData.phone_number && formData.phone_number.replace(/\D/g, '').length < 6)
      newErrors.phone_number = 'Phone number must be at least 6 digits.';
    if (!user.email && !user.phone_number && !formData.email && !formData.phone_number)
      newErrors.email = 'Either email or phone number is required.';
    if (!formData.country) newErrors.country = 'Country is required.';
    if (!formData.province) newErrors.province = 'Province/State is required.';
    if (!formData.city) newErrors.city = 'City is required.';
    if (!formData.postal_code) newErrors.postal_code = 'Postal code is required.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);

    if (!validateForm()) {
      setMessage('Please fill in all required fields correctly.');
      setIsLoading(false);
      return;
    }

    try {
      const payload = { ...formData };
      if (payload.phone_number && payload.country_code) {
        payload.phone_number = `${payload.country_code}${payload.phone_number.replace(/\D/g, '')}`;
      } else if (user.phone_number && !payload.phone_number) {
        payload.phone_number = user.phone_number;
      }
      delete payload.country_code;
      Object.keys(payload).forEach((key) => {
        if (payload[key] === '') payload[key] = null;
      });

      const response = await fetch(`${API_BASE_URL}/complete-account-setup/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await response.json();
      if (response.ok) {
        setMessage('Account setup completed successfully!');
        setTimeout(() => {
          onSetupComplete();
        }, 2000);
      } else {
        setErrors(json);
        if (json.error === 'Account setup is already completed') {
          setMessage('Your account setup is already completed.');
          setTimeout(() => {
            onSetupComplete();
          }, 2000);
        } else {
          setMessage(json.error || 'Failed to complete account setup.');
        }
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
        <h2>Complete Your Profile</h2>

        <div className="form-step">
          {/* Personal Information */}
          <h3>Personal Information</h3>
          <div className="input-group">
            <label htmlFor="username">
              <FaUser className="input-icon" /> Username
              <span className="helper-text"> (min 3 characters)</span>
            </label>
            <input
              type="text"
              id="username"
              name="username"
              placeholder="Enter your username"
              value={formData.username}
              onChange={handleChange}
              required
              className={errors.username ? 'input-error' : ''}
            />
            {errors.username && <p className="error-text">{errors.username}</p>}
          </div>
          {!user.email && (
            <div className="input-group">
              <label htmlFor="email">
                <FaEnvelope className="input-icon" /> Email
                <span className="helper-text"> (either email or phone required)</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? 'input-error' : ''}
              />
              {errors.email && <p className="error-text">{errors.email}</p>}
            </div>
          )}
          {!user.phone_number && (
            <div className="input-group">
              <label htmlFor="phone_number">
                <FaPhone className="input-icon" /> Phone Number
                <span className="helper-text"> (either email or phone required)</span>
              </label>
              <div className="unit-input">
                <select
                  value={countryCode}
                  onChange={handleCountryCodeChange}
                  className={errors.phone_number ? 'input-error' : ''}
                >
                  <option value="">Code</option>
                  {sortedCountries.map((country) => (
                    <option key={country.code} value={country.phone}>
                      {country.phone} ({country.name})
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  id="phone_number"
                  name="phone_number"
                  placeholder="123456789"
                  value={formData.phone_number}
                  onChange={handleChange}
                  className={errors.phone_number ? 'input-error' : ''}
                />
              </div>
              {errors.phone_number && <p className="error-text">{errors.phone_number}</p>}
            </div>
          )}

          {/* Address Information */}
          <h3>Address Information</h3>
          <div className="input-group">
            <label htmlFor="country">
              <FaMapMarkerAlt className="input-icon" /> Country
            </label>
            <select
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              required
              className={errors.country ? 'input-error' : ''}
            >
              <option value="">Select Country</option>
              {sortedCountries.map((country) => (
                <option key={country.code} value={country.name}>
                  {country.name}
                </option>
              ))}
            </select>
            {errors.country && <p className="error-text">{errors.country}</p>}
          </div>
          <div className="input-group">
            <label htmlFor="province">
              <FaMapMarkerAlt className="input-icon" /> Province/State
            </label>
            <select
              id="province"
              name="province"
              value={formData.province}
              onChange={handleChange}
              required
              disabled={!selectedCountry}
              className={errors.province ? 'input-error' : ''}
            >
              <option value="">Select Province/State</option>
              {getProvinces().map((province) => (
                <option key={province.name} value={province.name}>
                  {province.name}
                </option>
              ))}
            </select>
            {errors.province && <p className="error-text">{errors.province}</p>}
          </div>
          <div className="input-group">
            <label htmlFor="city">
              <FaMapMarkerAlt className="input-icon" /> City
            </label>
            <select
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              required
              disabled={!selectedProvince}
              className={errors.city ? 'input-error' : ''}
            >
              <option value="">Select City</option>
              {getCities().map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            {errors.city && <p className="error-text">{errors.city}</p>}
          </div>
          <div className="input-group">
            <label htmlFor="postal_code">
              <FaMapMarkerAlt className="input-icon" /> Postal Code
            </label>
            <input
              type="text"
              id="postal_code"
              name="postal_code"
              placeholder="Enter your postal code"
              value={formData.postal_code}
              onChange={handleChange}
              required
              className={errors.postal_code ? 'input-error' : ''}
            />
            {errors.postal_code && <p className="error-text">{errors.postal_code}</p>}
          </div>
          <div className="input-group">
            <label htmlFor="full_address">
              <FaMapMarkerAlt className="input-icon" /> Full Address
              <span className="helper-text"> (optional)</span>
            </label>
            <textarea
              id="full_address"
              name="full_address"
              placeholder="Enter your full address"
              value={formData.full_address}
              onChange={handleChange}
              className={errors.full_address ? 'input-error' : ''}
            />
            {errors.full_address && <p className="error-text">{errors.full_address}</p>}
          </div>

          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? 'Submitting...' : 'Complete Setup'}
          </button>
        </div>

        {message && (
          <p className={message.includes('Error') ? 'error-text' : 'message'}>{message}</p>
        )}
      </form>
    </div>
  );
}

export default AccountSetup;