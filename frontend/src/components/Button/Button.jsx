import { motion } from 'framer-motion';
import './Button.css';

/**
 * Modern Button Component
 * Provides multiple variants and sizes with smooth animations
 */
export const Button = ({
  children,
  variant = 'primary', // primary, secondary, danger, success, warning, ghost
  size = 'md', // sm, md, lg
  icon: Icon,
  fullWidth = false,
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
  ...props
}) => {
  const buttonClasses = `
    btn
    btn-${variant}
    btn-${size}
    ${fullWidth ? 'btn-full' : ''}
    ${disabled || loading ? 'btn-disabled' : ''}
    ${className}
  `.trim().split(/\s+/).join(' ');

  const motionProps = {
    whileHover: !disabled && !loading ? { scale: 1.02 } : {},
    whileTap: !disabled && !loading ? { scale: 0.98 } : {},
    initial: { opacity: 1 },
    transition: { type: 'spring', damping: 25, stiffness: 300 }
  };

  return (
    <motion.button
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled || loading}
      type={type}
      {...motionProps}
      {...props}
    >
      {loading ? (
        <>
          <span className="spinner"></span>
          <span>{children}</span>
        </>
      ) : (
        <>
          {Icon && <Icon className="btn-icon" />}
          <span>{children}</span>
        </>
      )}
    </motion.button>
  );
};

export default Button;
