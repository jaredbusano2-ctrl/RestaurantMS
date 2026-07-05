import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import axiosInstance from '../../utils/axiosInstance';
import { getDefaultRoute } from '../../utils/roleGuard';
import Button from '../../components/Button/Button';
import './Login.css';

// Success Modal Component
const SuccessModal = ({ show, onClose, userRole }) => {
  if (!show) return null;

  const getRedirectMessage = (role) => {
    const messages = {
      admin: 'Welcome back, Administrator!',
      manager: 'Welcome back, Manager!',
      cashier: 'Welcome back, Cashier!',
      kitchen: 'Welcome back, Kitchen Staff!'
    };
    return messages[role] || 'Login successful!';
  };

  return (
    <div className="success-modal-overlay" onClick={onClose}>
      <div className="success-modal" onClick={(e) => e.stopPropagation()}>
        <div className="success-modal-icon">
          <FiCheckCircle size={60} color="#22c55e" />
        </div>
        <h2 className="success-modal-title">Login Successful!</h2>
        <p className="success-modal-message">{getRedirectMessage(userRole)}</p>
        <p className="success-modal-sub">Redirecting you to the dashboard...</p>
        <button className="success-modal-button" onClick={onClose}>
          Continue
        </button>
      </div>
    </div>
  );
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axiosInstance.post('/api/auth/login', { email, password });
      if (res.data.success) {
        const { token, ...userData } = res.data.data;
        login(token, userData);
        setLoggedInUser(userData);
        
        // Show success modal
        setShowSuccessModal(true);

        setTimeout(() => {
          setShowSuccessModal(false);
          navigate(getDefaultRoute(userData.role));
        }, 1500);
      } else {
        setError(res.data.message || 'Login failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    if (loggedInUser) {
      navigate(getDefaultRoute(loggedInUser.role));
    }
  };

  const features = [
    { icon: '⚡', text: 'Fast & efficient order management' },
    { icon: '👨‍🍳', text: 'Real-time kitchen display' },
    { icon: '💳', text: 'Smart billing & payments' },
    { icon: '📦', text: 'Inventory tracking' },
  ];

  return (
    <>
      <div className="login-wrapper">
        <div className="login-left">
          <div className="login-left-content">
            <div className="login-logo">
              <span>🍽️</span>
            </div>

            <div>
              <h1 className="login-brand-name">FlavorRush</h1>
              <p className="login-tagline">Restaurant Management System</p>

              <div className="login-features">
                {features.map((feature, idx) => (
                  <div key={idx} className="login-feature">
                    <span className="feature-icon">{feature.icon}</span>
                    <span>{feature.text}</span>
                  </div>
                ))}
              </div>

              <div className="login-testimonial">
                <p className="testimonial-text">
                  "Streamline your restaurant operations with our comprehensive management system."
                </p>
              </div>
            </div>
          </div>

          <div className="login-decoration login-decoration-1"></div>
          <div className="login-decoration login-decoration-2"></div>
          <div className="login-decoration login-decoration-3"></div>
        </div>

        <div className="login-right">
          <div className="login-form-box">
            <div className="login-form-header">
              <h2>Welcome Back</h2>
              <p className="login-subtitle">Sign in to your restaurant account</p>
            </div>

            {error && (
              <div className="login-error">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="form-input-wrapper">
                  <FiMail className="form-icon" />
                  <input
                    type="email"
                    className="form-input"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="form-input-wrapper">
                  <FiLock className="form-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={loading}
                  disabled={loading}
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <SuccessModal 
        show={showSuccessModal}
        onClose={handleModalClose}
        userRole={loggedInUser?.role}
      />
    </>
  );
};

export default Login;