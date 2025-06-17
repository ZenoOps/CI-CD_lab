import React, { useState, useEffect } from 'react';
import './Register.css';
import { FaEnvelope, FaLock, FaUser } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Register({ onRegisterSuccess, toggleToLogin, toggleToForgotPassword }) {
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [shortToken, setShortToken] = useState('');

  const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? 'https://ladyfirstme.pythonanywhere.com/api/auth'
    : 'http://localhost:8000/api/auth';

  useEffect(() => {
    let timer;
    if (otpTimer > 0) {
      timer = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpTimer]);

  const validatePassword = (password, username) => {
    const errors = {};
    
    if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters long.';
    }
    if (/^\d+$/.test(password)) {
      errors.password = 'Password cannot be entirely numeric.';
    }
    if (password.toLowerCase() === username.toLowerCase()) {
      errors.password = 'Password cannot be the same as your username.';
    }
    if (!/[A-Z]/.test(password)) {
      errors.password = 'Password must contain at least one uppercase letter.';
    }
    if (!/[a-z]/.test(password)) {
      errors.password = 'Password must contain at least one lowercase letter.';
    }
    if (!/\d/.test(password)) {
      errors.password = 'Password must contain at least one number.';
    }
    if (!/[@$!%*?&]/.test(password)) {
      errors.password = 'Password must contain at least one special character (@$!%*?&).';
    }

    return errors;
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setMessage("");
    setErrors({});
    setIsLoading(true);
  
    if (!email) {
      setErrors({ email: "Please enter your email." });
      setMessage("Please enter your email.");
      toast.error("Please enter your email.");
      setIsLoading(false);
      return;
    }
  
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ email: "Please enter a valid email address." });
      setMessage("Please enter a valid email address.");
      toast.error("Please enter a valid email address.");
      setIsLoading(false);
      return;
    }
  
    try {
      const response = await fetch(`${API_BASE_URL}/send-otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
  
      const json = await response.json();
      console.log("Send OTP Response:", json);
  
      if (!response.ok) {
        const errorMessage = json.error || "Failed to send OTP.";
        setErrors({ email: errorMessage });
        setMessage(errorMessage);
        toast.error(errorMessage);
        setIsLoading(false);
        return;
      }
  
      setMessage("OTP sent successfully! Check your email inbox or spam.");
      toast.success("OTP sent successfully! Check your email inbox or spam.");
      setStep(2);
      setOtpTimer(120);
      setCanResend(false);
      setIsLoading(false);
    } catch (error) {
      const errorMessage = error.message || "Unable to connect to the server.";
      setErrors({ email: errorMessage });
      setMessage(errorMessage);
      toast.error(errorMessage);
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;
    setMessage('');
    setErrors({});
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/send-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const json = await response.json();
        const errorMessage = json.error || 'Failed to resend OTP.';
        setErrors(json);
        setMessage(errorMessage);
        toast.error(errorMessage);
        setIsLoading(false);
        return;
      }

      setMessage('OTP sent successfully! Check your email inbox or spam.');
      toast.success('OTP sent successfully! Check your email inbox or spam.');
      setOtp('');
      setOtpTimer(120);
      setCanResend(false);
      setIsLoading(false);
    } catch (error) {
      const errorMessage = error.message || 'Unable to connect to the server.';
      setMessage(errorMessage);
      toast.error(errorMessage);
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setMessage('');
    setErrors({});
    setIsLoading(true);

    if (!otp || !/^\d{6}$/.test(otp)) {
      setErrors({ otp: 'Please enter a valid 6-digit OTP.' });
      setMessage('Please enter a valid 6-digit OTP.');
      toast.error('Please enter a valid 6-digit OTP.');
      setIsLoading(false);
      return;
    }

    const payload = {
      email,
      code: otp,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/verify-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const json = await response.json();
        const errorMessage = json.error || 'Invalid OTP.';
        setErrors(json);
        setMessage(errorMessage);
        toast.error(errorMessage);
        setIsLoading(false);
        return;
      }

      const json = await response.json();
      setShortToken(json.short_token);
      setMessage('OTP verified successfully! Now set your username and password.');
      toast.success('OTP verified successfully! Now set your username and password.');
      setStep(3);
      setIsLoading(false);
    } catch (error) {
      const errorMessage = error.message || 'Unable to connect to the server.';
      setMessage(errorMessage);
      toast.error(errorMessage);
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage('');
    setErrors({});
    setIsLoading(true);

    if (!username) {
      setErrors({ username: 'Username is required.' });
      setMessage('Username is required.');
      toast.error('Username is required.');
      setIsLoading(false);
      return;
    }
    if (username.length < 3) {
      setErrors({ username: 'Username must be at least 3 characters.' });
      setMessage('Username must be at least 3 characters.');
      toast.error('Username must be at least 3 characters.');
      setIsLoading(false);
      return;
    }

    const passwordErrors = validatePassword(password, username);
    if (Object.keys(passwordErrors).length > 0) {
      setErrors(passwordErrors);
      setMessage(passwordErrors.password);
      toast.error(passwordErrors.password);
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setErrors({ confirm_password: 'Passwords do not match.' });
      setMessage('Passwords do not match.');
      toast.error('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    const payload = {
      username,
      email,
      password,
      confirm_password: confirmPassword,
      short_token: shortToken,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const json = await response.json();
        const errorMessage = json.error || 'Registration failed.';
        setErrors(json);
        setMessage(errorMessage);
        toast.error(errorMessage);
        setIsLoading(false);
        return;
      }

      const json = await response.json();
      localStorage.setItem('access_token', json.access);
      localStorage.setItem('refresh_token', json.refresh);
      setMessage('Account created successfully!');
      toast.success('Account created successfully!');
      setTimeout(() => {
        setEmail('');
        setOtp('');
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        setShortToken('');
        setStep(1);
        onRegisterSuccess();
      }, 1500);
      setIsLoading(false);
    } catch (error) {
      const errorMessage = error.message || 'Unable to connect to the server.';
      setMessage(errorMessage);
      toast.error(errorMessage);
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setMessage('');
      setErrors({});
      setOtp('');
      setOtpTimer(0);
      setCanResend(false);
    } else if (step === 3) {
      setStep(2);
      setMessage('');
      setErrors({});
      setUsername('');
      setPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <div className="register-container">
      <ToastContainer />
      <h2>Register</h2>

      {message && <p className="message">{message}</p>}

      {step === 1 && (
        <form onSubmit={handleSendOTP}>
          <div className="input-group">
            <FaEnvelope className="input-icon" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {errors.email && <span className="error">{errors.email}</span>}
          </div>
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Sending OTP...' : 'Send OTP'}
          </button>
          <p className="toggle-text">
            Already have an account?{' '}
            <span onClick={toggleToLogin}>Login here</span>
          </p>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleVerifyOTP}>
          <div className="input-group">
            <FaLock className="input-icon" />
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength="6"
              required
            />
            {errors.otp && <span className="error">{errors.otp}</span>}
          </div>
          <p>
            Time remaining: {Math.floor(otpTimer / 60)}:
            {(otpTimer % 60).toString().padStart(2, '0')}
          </p>
          <button
            type="button"
            onClick={handleResendOTP}
            disabled={!canResend || isLoading}
            className="resend-button"
          >
            {isLoading ? 'Resending...' : canResend ? 'Resend OTP' : 'Wait to resend'}
          </button>
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Verifying...' : 'Verify OTP'}
          </button>
          <button type="button" onClick={handleBack} className="back-button">
            Back
          </button>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleRegister}>
          <div className="input-group">
            <FaUser className="input-icon" />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            {errors.username && <span className="error">{errors.username}</span>}
          </div>
          <div className="input-group">
            <FaLock className="input-icon" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {errors.password && <span className="error">{errors.password}</span>}
          </div>
          <div className="input-group">
            <FaLock className="input-icon" />
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            {errors.confirm_password && (
              <span className="error">{errors.confirm_password}</span>
            )}
          </div>
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Registering...' : 'Register'}
          </button>
          <button type="button" onClick={handleBack} className="back-button">
            Back
          </button>
        </form>
      )}
    </div>
  );
}

export default Register;