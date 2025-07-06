import React from 'react';
import { Loader2 } from 'lucide-react';

// Spinner Component
export const Spinner = ({
  size = 'md',
  className = '',
  ...props
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  return (
    <Loader2 
      className={`animate-spin ${sizes[size]} ${className}`} 
      {...props} 
    />
  );
};

// Loading Overlay Component
export const LoadingOverlay = ({
  children,
  loading = false,
  text = 'Loading...',
  className = '',
}) => {
  if (!loading) return children;

  return (
    <div className={`relative ${className}`}>
      {children}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
        <div className="flex flex-col items-center space-y-3">
          <Spinner size="lg" className="text-primary-600" />
          <p className="text-sm font-medium text-secondary-700">{text}</p>
        </div>
      </div>
    </div>
  );
};

// Skeleton Components
export const Skeleton = ({
  className = '',
  ...props
}) => {
  return (
    <div 
      className={`skeleton ${className}`} 
      {...props} 
    />
  );
};

export const SkeletonLine = ({
  className = '',
  ...props
}) => {
  return (
    <div 
      className={`skeleton-line ${className}`} 
      {...props} 
    />
  );
};

export const SkeletonText = ({
  lines = 3,
  className = '',
  ...props
}) => {
  return (
    <div className={`space-y-2 ${className}`} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine 
          key={i} 
          className={i === lines - 1 ? 'w-3/4' : ''}
        />
      ))}
    </div>
  );
};

export const SkeletonCard = ({
  showAvatar = false,
  showImage = false,
  className = '',
  ...props
}) => {
  return (
    <div className={`card p-6 ${className}`} {...props}>
      {showImage && (
        <Skeleton className="w-full h-48 mb-4 rounded-xl" />
      )}
      
      <div className="flex items-start space-x-4">
        {showAvatar && (
          <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
        )}
        
        <div className="flex-1 space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <SkeletonText lines={2} />
          <div className="flex space-x-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const SkeletonTable = ({
  rows = 5,
  columns = 4,
  className = '',
  ...props
}) => {
  return (
    <div className={`card overflow-hidden ${className}`} {...props}>
      {/* Header */}
      <div className="card-header">
        <div className="flex space-x-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-20" />
          ))}
        </div>
      </div>
      
      {/* Rows */}
      <div className="divide-y divide-secondary-200">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4">
            <div className="flex space-x-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton 
                  key={colIndex} 
                  className={`h-4 ${colIndex === 0 ? 'w-32' : colIndex === 1 ? 'w-24' : 'w-16'}`} 
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Progress Component
export const Progress = ({
  value = 0,
  max = 100,
  size = 'md',
  variant = 'primary',
  showLabel = false,
  className = '',
  ...props
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };
  
  const variants = {
    primary: 'bg-primary-600',
    success: 'bg-success-600',
    warning: 'bg-warning-600',
    danger: 'bg-danger-600',
  };
  
  return (
    <div className={`space-y-2 ${className}`} {...props}>
      {showLabel && (
        <div className="flex justify-between text-sm text-secondary-600">
          <span>Progress</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={`w-full bg-secondary-200 rounded-full overflow-hidden ${sizes[size]}`}>
        <div 
          className={`${variants[variant]} ${sizes[size]} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// Pulse Loading Animation
export const PulseLoading = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <div className={`animate-pulse ${className}`} {...props}>
      {children}
    </div>
  );
};

// Export as default for main Spinner
const Loading = Spinner;
export default Loading; 