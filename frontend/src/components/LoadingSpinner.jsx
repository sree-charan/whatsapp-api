import React from 'react';
import { Spinner } from './ui';

const LoadingSpinner = ({ 
  size = 'md', 
  text = 'Loading...', 
  className = '',
  showText = true,
  fullScreen = false 
}) => {
  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const content = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <Spinner size={size} className="text-primary-600" />
      {showText && (
        <p className={`mt-2 text-secondary-600 ${textSizeClasses[size]}`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner; 