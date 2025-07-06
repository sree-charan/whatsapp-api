import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

// Toast Context
const ToastContext = createContext();

// Toast Provider
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    const newToast = { 
      id, 
      duration: 5000, 
      ...toast 
    };
    
    setToasts(prev => [...prev, newToast]);

    if (newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const removeAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, removeAllToasts }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

// Hook to use toast
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  const { addToast, removeToast, removeAllToasts } = context;

  return {
    toast: {
      success: (message, options = {}) => addToast({ type: 'success', message, ...options }),
      error: (message, options = {}) => addToast({ type: 'error', message, ...options }),
      warning: (message, options = {}) => addToast({ type: 'warning', message, ...options }),
      info: (message, options = {}) => addToast({ type: 'info', message, ...options }),
      custom: (content, options = {}) => addToast({ type: 'custom', content, ...options }),
    },
    removeToast,
    removeAllToasts,
  };
};

// Toast Container
const ToastContainer = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

// Individual Toast Component
const Toast = ({ toast, onRemove }) => {
  const { id, type, message, title, content, action } = toast;

  const handleRemove = () => {
    onRemove(id);
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-success-600" />,
    error: <AlertCircle className="w-5 h-5 text-danger-600" />,
    warning: <AlertTriangle className="w-5 h-5 text-warning-600" />,
    info: <Info className="w-5 h-5 text-primary-600" />,
  };

  const toastClasses = {
    success: 'toast toast-success',
    error: 'toast toast-error',
    warning: 'toast toast-warning',
    info: 'toast toast-info',
    custom: 'toast',
  };

  if (type === 'custom') {
    return (
      <div className={toastClasses[type]}>
        <div className="flex">
          <div className="flex-1">
            {content}
          </div>
          <button
            onClick={handleRemove}
            className="ml-4 text-secondary-400 hover:text-secondary-600 focus:outline-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={toastClasses[type]}>
      <div className="flex">
        {icons[type] && (
          <div className="flex-shrink-0">
            {icons[type]}
          </div>
        )}
        
        <div className="ml-3 flex-1">
          {title && (
            <h4 className="text-sm font-medium text-secondary-900 mb-1">
              {title}
            </h4>
          )}
          <p className="text-sm text-secondary-700">
            {message}
          </p>
          {action && (
            <div className="mt-2">
              {action}
            </div>
          )}
        </div>
        
        <button
          onClick={handleRemove}
          className="ml-4 text-secondary-400 hover:text-secondary-600 focus:outline-none"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast; 