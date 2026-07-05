import './Button.css';

export const Button = ({
  children, variant = 'primary', size = 'md', icon: Icon,
  fullWidth = false, disabled = false, loading = false,
  onClick, type = 'button', className = '', ...props
}) => {
  const buttonClasses = `btn btn-${variant} btn-${size} ${fullWidth ? 'btn-full' : ''} ${disabled || loading ? 'btn-disabled' : ''} ${className}`
    .trim().split(/\s+/).join(' ');

  return (
    <button className={buttonClasses} onClick={onClick} disabled={disabled || loading} type={type} {...props}>
      {loading ? (
        <><span className="spinner"></span><span>{children}</span></>
      ) : (
        <>{Icon && <Icon className="btn-icon" />}<span>{children}</span></>
      )}
    </button>
  );
};

export default Button;
