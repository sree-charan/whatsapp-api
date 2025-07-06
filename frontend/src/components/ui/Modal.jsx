import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = '',
  overlayClassName = '',
  ...props
}) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && closeOnEscape) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, closeOnEscape, onClose]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-[95vw] max-h-[95vh]',
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`modal-overlay ${overlayClassName}`}
      onClick={handleOverlayClick}
    >
      <div 
        ref={modalRef}
        className={`modal ${sizes[size]} ${className}`}
        {...props}
      >
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-secondary-200">
            <div className="flex-1">
              {title && (
                <h2 className="text-lg font-semibold text-secondary-900">
                  {title}
                </h2>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 text-secondary-400 hover:text-secondary-600 hover:bg-secondary-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
        
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

// Modal Header Component
const ModalHeader = ({ children, className = '', ...props }) => {
  return (
    <div className={`pb-4 border-b border-secondary-200 ${className}`} {...props}>
      {children}
    </div>
  );
};

// Modal Body Component
const ModalBody = ({ children, className = '', ...props }) => {
  return (
    <div className={`py-4 ${className}`} {...props}>
      {children}
    </div>
  );
};

// Modal Footer Component
const ModalFooter = ({ children, className = '', ...props }) => {
  return (
    <div className={`pt-4 border-t border-secondary-200 flex justify-end space-x-3 ${className}`} {...props}>
      {children}
    </div>
  );
};

// Confirmation Modal Component
export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  loading = false,
  ...props
}) => {
  const handleConfirm = () => {
    onConfirm();
  };

  const buttonVariants = {
    primary: 'btn-primary',
    danger: 'btn-danger',
    warning: 'btn-warning',
    success: 'btn-success',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      {...props}
    >
      <ModalBody>
        <p className="text-secondary-700">
          {message}
        </p>
      </ModalBody>
      
      <ModalFooter>
        <button
          onClick={onClose}
          disabled={loading}
          className="btn btn-ghost"
        >
          {cancelText}
        </button>
        <button
          onClick={handleConfirm}
          disabled={loading}
          className={`btn ${buttonVariants[variant]}`}
        >
          {loading ? 'Processing...' : confirmText}
        </button>
      </ModalFooter>
    </Modal>
  );
};

// Export modal components
Modal.Header = ModalHeader;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;

export default Modal; 