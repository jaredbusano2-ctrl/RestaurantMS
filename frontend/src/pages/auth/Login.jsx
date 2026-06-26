import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import axiosInstance from '../../utils/axiosInstance';
import { getDefaultRoute } from '../../utils/roleGuard';
import Button from '../../components/Button/Button';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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
        navigate(getDefaultRoute(userData.role));
      } else {
        setError(res.data.message || 'Login failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', damping: 25, stiffness: 200 },
    },
  };

  const logoVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: { type: 'spring', damping: 20, stiffness: 300, delay: 0.1 },
    },
  };

  const features = [
    { icon: '⚡', text: 'Fast & efficient order management' },
    { icon: '👨‍🍳', text: 'Real-time kitchen display' },
    { icon: '💳', text: 'Smart billing & payments' },
    { icon: '📦', text: 'Inventory tracking' },
  ];

  return (
    <div className="login-wrapper">
      {/* Left Panel - Brand & Features */}
      <motion.div
        className="login-left"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <div className="login-left-content">
          <motion.div
            className="login-logo"
            variants={logoVariants}
            initial="hidden"
            animate="visible"
          >
            <span>🍽️</span>
          </motion.div>

          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <motion.h1 variants={itemVariants} className="login-brand-name">
              FlavorRush
            </motion.h1>
            <motion.p variants={itemVariants} className="login-tagline">
              Restaurant Management System
            </motion.p>

            <motion.div variants={itemVariants} className="login-features">
              {features.map((feature, idx) => (
                <motion.div
                  key={idx}
                  className="login-feature"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                >
                  <span className="feature-icon">{feature.icon}</span>
                  <span>{feature.text}</span>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="login-testimonial"
            >
              <p className="testimonial-text">
                "Streamline your restaurant operations with our comprehensive management system."
              </p>
            </motion.div>
          </motion.div>
        </div>

        {/* Decorative Elements */}
        <div className="login-decoration login-decoration-1"></div>
        <div className="login-decoration login-decoration-2"></div>
        <div className="login-decoration login-decoration-3"></div>
      </motion.div>

      {/* Right Panel - Login Form */}
      <motion.div
        className="login-right"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <motion.div
          className="login-form-box"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="login-form-header">
            <h2>Welcome Back</h2>
            <p className="login-subtitle">Sign in to your restaurant account</p>
          </motion.div>

          {error && (
            <motion.div
              className="login-error"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <span className="error-icon">⚠️</span>
              {error}
            </motion.div>
          )}

          <motion.form onSubmit={handleSubmit} variants={itemVariants} className="login-form">
            {/* Email Field */}
            <motion.div variants={itemVariants} className="form-group">
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
            </motion.div>

            {/* Password Field */}
            <motion.div variants={itemVariants} className="form-group">
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
                <motion.button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {showPassword ? (
                    <FiEyeOff size={18} />
                  ) : (
                    <FiEye size={18} />
                  )}
                </motion.button>
              </div>
            </motion.div>

            {/* Submit Button */}
            <motion.div variants={itemVariants} className="form-group">
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
            </motion.div>
          </motion.form>

          {/* Footer */}
          <motion.div variants={itemVariants} className="login-footer">
            <p className="login-help-text">
               •FLAVOR RUSH• 
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;