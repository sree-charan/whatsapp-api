import React from 'react';
import { Loader2 } from 'lucide-react';

const Button = React.forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  className = '',
  type = 'button',
  ...props
}, ref) => {
  const baseClasses = 'btn';
  
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    whatsapp: 'btn-whatsapp',
    success: 'btn-success',
    warning: 'btn-warning',
    danger: 'btn-danger',
    outline: 'btn-outline btn-primary',
    ghost: 'btn-ghost',
  };
  
  const sizes = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg',
  };
  
  const classes = [
    baseClasses,
    variants[variant],
    sizes[size],
    className,
  ].filter(Boolean).join(' ');
  
  const isDisabled = disabled || loading;
  
  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={classes}
      {...props}
    >
      {loading && (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      )}
      {!loading && leftIcon && (
        <span className="mr-2">
          {leftIcon}
        </span>
      )}
      <span className={loading ? 'opacity-70' : ''}>
        {children}
      </span>
      {!loading && rightIcon && (
        <span className="ml-2">
          {rightIcon}
        </span>
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button; 