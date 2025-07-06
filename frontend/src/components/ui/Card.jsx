import React from 'react';

const Card = ({
  children,
  className = '',
  hover = false,
  gradient = false,
  ...props
}) => {
  const classes = [
    'card',
    hover ? 'card-hover' : '',
    gradient ? 'bg-gradient-soft' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

const CardHeader = ({
  children,
  className = '',
  action,
  ...props
}) => {
  return (
    <div className={`card-header ${className}`} {...props}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {children}
        </div>
        {action && (
          <div className="ml-4">
            {action}
          </div>
        )}
      </div>
    </div>
  );
};

const CardTitle = ({
  children,
  className = '',
  size = 'lg',
  ...props
}) => {
  const sizes = {
    sm: 'text-sm font-medium',
    md: 'text-base font-semibold',
    lg: 'text-lg font-semibold',
    xl: 'text-xl font-bold',
  };

  return (
    <h3 className={`text-secondary-900 ${sizes[size]} ${className}`} {...props}>
      {children}
    </h3>
  );
};

const CardDescription = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <p className={`text-secondary-600 text-sm mt-1 ${className}`} {...props}>
      {children}
    </p>
  );
};

const CardBody = ({
  children,
  className = '',
  padding = true,
  ...props
}) => {
  const classes = [
    padding ? 'card-body' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

const CardFooter = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`card-footer ${className}`} {...props}>
      {children}
    </div>
  );
};

// Export all components
Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card; 