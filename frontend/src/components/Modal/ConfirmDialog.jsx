import { motion } from 'framer-motion';
import { FiAlertCircle, FiCheckCircle, FiLogOut, FiTrash2 } from 'react-icons/fi';
import Modal from './Modal';
import '../Button/Button.css';
import './ConfirmDialog.css';

/**
 * Confirmation Dialog Component
 * Reusable for delete, save, update, and logout confirmations
 */
export const ConfirmDialog = ({
  isOpen,
  title,
  message,
  type = 'confirm', // 'confirm', 'delete', 'logout', 'save'
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false
}) => {
  const getIcon = () => {
    switch (type) {
      case 'delete':
        return <FiTrash2 className="confirm-icon confirm-icon-delete" />;
      case 'logout':
        return <FiLogOut className="confirm-icon confirm-icon-logout" />;
      case 'save':
        return <FiCheckCircle className="confirm-icon confirm-icon-save" />;
      default:
        return <FiAlertCircle className="confirm-icon confirm-icon-confirm" />;
    }
  };

  const getButtonColor = () => {
    switch (type) {
      case 'delete':
      case 'logout':
        return 'danger';
      case 'save':
        return 'success';
      default:
        return 'primary';
    }
  };

  const iconVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: {
        type: 'spring',
        damping: 20,
        stiffness: 300
      }
    }
  };

  const buttonVariants = {
    hover: { scale: 1.05 },
    tap: { scale: 0.95 }
  };

  const actions = (
    <div className="confirm-actions">
      <motion.button
        className="btn btn-secondary"
        onClick={onCancel}
        disabled={isLoading}
        variants={buttonVariants}
        whileHover="hover"
        whileTap="tap"
      >
        {cancelText}
      </motion.button>
      <motion.button
        className={`btn btn-${getButtonColor()}`}
        onClick={onConfirm}
        disabled={isLoading}
        variants={buttonVariants}
        whileHover="hover"
        whileTap="tap"
      >
        {isLoading ? (
          <span className="flex gap-2 flex-center">
            <span className="spinner"></span>
            {confirmText}
          </span>
        ) : (
          confirmText
        )}
      </motion.button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      title={title}
      onClose={onCancel}
      size="sm"
      actions={actions}
      closeButton={!isLoading}
    >
      <div className="confirm-dialog-content">
        <motion.div
          className="confirm-icon-container"
          variants={iconVariants}
          initial="hidden"
          animate="visible"
        >
          {getIcon()}
        </motion.div>
        <p className="confirm-message">{message}</p>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
