import { FiAlertCircle, FiCheckCircle, FiLogOut, FiTrash2 } from 'react-icons/fi';
import Modal from './Modal';
import '../Button/Button.css';
import './ConfirmDialog.css';

export const ConfirmDialog = ({
  isOpen, title, message, type = 'confirm',
  onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', isLoading = false
}) => {
  const getIcon = () => {
    switch (type) {
      case 'delete': return <FiTrash2 className="confirm-icon confirm-icon-delete" />;
      case 'logout': return <FiLogOut className="confirm-icon confirm-icon-logout" />;
      case 'save':   return <FiCheckCircle className="confirm-icon confirm-icon-save" />;
      default:       return <FiAlertCircle className="confirm-icon confirm-icon-confirm" />;
    }
  };

  const getButtonColor = () => {
    switch (type) {
      case 'delete': case 'logout': return 'danger';
      case 'save': return 'success';
      default: return 'primary';
    }
  };

  const actions = (
    <div className="confirm-actions">
      <button className="btn btn-secondary" onClick={onCancel} disabled={isLoading}>
        {cancelText}
      </button>
      <button className={`btn btn-${getButtonColor()}`} onClick={onConfirm} disabled={isLoading}>
        {isLoading ? <span className="flex gap-2 flex-center"><span className="spinner"></span>{confirmText}</span> : confirmText}
      </button>
    </div>
  );

  return (
    <Modal isOpen={isOpen} title={title} onClose={onCancel} size="sm" actions={actions} closeButton={!isLoading}>
      <div className="confirm-dialog-content">
        <div className="confirm-icon-container">{getIcon()}</div>
        <p className="confirm-message">{message}</p>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
