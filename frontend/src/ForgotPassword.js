// src/ForgotPassword.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ForgotPassword.css';
import { FaEnvelope, FaLock } from 'react-icons/fa';

function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const navigate = useNavigate();

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

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsLoading(true);

    if (!email) {
      setError('Please enter your email address.');
      setIsLoading(false);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/forgot-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to send OTP.');
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      setMessage(data.message);
      setStep(2);
      setOtpTimer(120); // 2-minute timer
      setCanResend(false);
      setIsLoading(false);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;
    setMessage('');
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/forgot-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to resend OTP.');
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      setMessage('OTP resent successfully! Check your email.');
      setOtp('');
      setOtpTimer(120);
      setCanResend(false);
      setIsLoading(false);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsLoading(true);

    if (!otp || !/^\d{6}$/.test(otp)) {
      setError('Please enter a valid 6-digit OTP.');
      setIsLoading(false);
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      setIsLoading(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/reset-password-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code: otp,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to reset password.');
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      setMessage('Password reset successfully. Redirecting to login...');
      setIsLoading(false);
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <form onSubmit={step === 1 ? handleSendOTP : handleVerifyOTP}>
        <h2>Forgot Password (Step {step} of 2)</h2>

        {step === 1 && (
          <div className="form-step">
            <div className="input-group">
              <label htmlFor="email">
                <FaEnvelope className="input-icon" /> Enter your email
                <span className="helper-text"> (e.g., user@example.com)</span>
              </label>
              <input
                type="email"
                id="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-describedby={error ? 'email-error' : undefined}
              />
              {error && <p id="email-error" className="error">{error}</p>}
              {message && <p className="message">{message}</p>}
            </div>
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send OTP'}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="form-step">
            <div className="input-group">
              <label htmlFor="otp">
                OTP Code
                <span className="helper-text"> (6 digits)</span>
              </label>
              <input
                type="text"
                id="otp"
                placeholder="Enter the OTP code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                required
                maxLength="6"
                aria-describedby={error ? 'otp-error' : undefined}
              />
              {error && error.includes('OTP') && <p id="otp-error" className="error">{error}</p>}
              {otpTimer > 0 ? (
                <p className="helper-text">
                  Resend available in {Math.floor(otpTimer / 60)}:
                  {(otpTimer % 60).toString().padStart(2, '0')}
                </p>
              ) : (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleResendOTP}
                  disabled={!canResend || isLoading}
                >
                  Resend OTP
                </button>
              )}
            </div>
            <div className="input-group">
              <label htmlFor="new_password">
                <FaLock className="input-icon" /> New Password
                <span className="helper-text"> (min 8 characters)</span>
              </label>
              <input
                type="password"
                id="new_password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                aria-describedby={error && error.includes('Password') ? 'password-error' : undefined}
              />
              {error && error.includes('Password') && <p id="password-error" className="error">{error}</p>}
            </div>
            <div className="input-group">
              <label htmlFor="confirm_password">
                <FaLock className="input-icon" /> Confirm Password
              </label>
              <input
                type="password"
                id="confirm_password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                aria-describedby={error && error.includes('match') ? 'confirm-password-error' : undefined}
              />
              {error && error.includes('match') && <p id="confirm-password-error" className="error">{error}</p>}
            </div>
            <div className="button-group">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setStep(1);
                  setMessage('');
                  setError('');
                  setOtp('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
              >
                Back
              </button>
              <button type="submit" disabled={isLoading}>
                {isLoading ? 'Resetting...' : 'Verify OTP & Reset Password'}
              </button>
            </div>
            {message && <p className="message">{message}</p>}
          </div>
        )}

        <p>
          <button type="button" onClick={() => navigate('/')}>Back to Login</button>
        </p>
      </form>
    </div>
  );
}

export default ForgotPassword;