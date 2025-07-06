import React from 'react';

const Badge = ({
  children,
  variant = 'secondary',
  size = 'md',
  dot = false,
  className = '',
  ...props
}) => {
  const baseClasses = 'badge';
  
  const variants = {
    primary: 'badge-primary',
    secondary: 'badge-secondary',
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
  };
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };
  
  const classes = [
    baseClasses,
    variants[variant],
    sizes[size],
    className,
  ].filter(Boolean).join(' ');
  
  if (dot) {
    return (
      <span className={`status-dot ${variant === 'primary' ? 'bg-primary-500' : variant === 'success' ? 'status-connected' : variant === 'warning' ? 'status-connecting' : variant === 'danger' ? 'status-disconnected' : 'status-inactive'} ${className}`} {...props} />
    );
  }
  
  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
};

export default Badge; 