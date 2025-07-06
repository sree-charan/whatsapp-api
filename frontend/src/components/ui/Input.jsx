import React from 'react';
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

const Input = React.forwardRef(({
  label,
  error,
  success,
  helperText,
  leftIcon,
  rightIcon,
  type = 'text',
  size = 'md',
  variant = 'default',
  className = '',
  wrapperClassName = '',
  showPasswordToggle = false,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [inputType, setInputType] = React.useState(type);
  
  React.useEffect(() => {
    if (showPasswordToggle && type === 'password') {
      setInputType(showPassword ? 'text' : 'password');
    }
  }, [showPassword, showPasswordToggle, type]);
  
  const baseClasses = 'input';
  
  const variants = {
    default: '',
    error: 'input-error',
    success: 'input-success',
  };
  
  const sizes = {
    sm: 'input-sm',
    md: '',
    lg: 'input-lg',
  };
  
  let currentVariant = variant;
  if (error) currentVariant = 'error';
  if (success) currentVariant = 'success';
  
  const classes = [
    baseClasses,
    variants[currentVariant],
    sizes[size],
    leftIcon ? 'pl-10' : '',
    (rightIcon || showPasswordToggle || error || success) ? 'pr-10' : '',
    className,
  ].filter(Boolean).join(' ');
  
  const renderIcon = () => {
    if (error) return <AlertCircle className="w-5 h-5 text-danger-500" />;
    if (success) return <CheckCircle className="w-5 h-5 text-success-500" />;
    if (showPasswordToggle && type === 'password') {
      return (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="text-secondary-400 hover:text-secondary-600 focus:outline-none"
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      );
    }
    return rightIcon;
  };
  
  return (
    <div className={`stack-sm ${wrapperClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-secondary-700 mb-1">
          {label}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400">
            {leftIcon}
          </div>
        )}
        
        <input
          ref={ref}
          type={inputType}
          className={classes}
          {...props}
        />
        
        {(rightIcon || showPasswordToggle || error || success) && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {renderIcon()}
          </div>
        )}
      </div>
      
      {(error || success || helperText) && (
        <div className="text-sm">
          {error && (
            <p className="text-danger-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {error}
            </p>
          )}
          {success && !error && (
            <p className="text-success-600 flex items-center">
              <CheckCircle className="w-4 h-4 mr-1" />
              {success}
            </p>
          )}
          {helperText && !error && !success && (
            <p className="text-secondary-500">{helperText}</p>
          )}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input; 