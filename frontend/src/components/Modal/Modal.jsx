import { FiX } from 'react-icons/fi';
import './Modal.css';

export const Modal = ({
  isOpen, title, children, onClose,
  size = 'md', actions, closeButton = true, className = ''
}) => {
  const sizeClasses = { sm: 'modal-sm', md: 'modal-md', lg: 'modal-lg', xl: 'modal-xl', full: 'modal-full' };
  if (!isOpen) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`modal-container ${sizeClasses[size]} ${className}`} onClick={(e) => e.stopPropagation()}>
        {title && (
          <div className="modal-header">
            <h2 className="modal-title">{title}</h2>
            {closeButton && (
              <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
                <FiX size={20} />
              </button>
            )}
          </div>
        )}
        <div className="modal-body">{children}</div>
        {actions && <div className="modal-footer">{actions}</div>}
      </div>
    </div>
  );
};

export default Modal;
