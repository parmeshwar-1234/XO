import React from 'react';

interface LoadingDotsProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const LoadingDots: React.FC<LoadingDotsProps> = ({ size = 'md', text }) => {
  const dotSizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const gapClasses = {
    sm: 'gap-1',
    md: 'gap-2',
    lg: 'gap-3',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`flex ${gapClasses[size]} items-center justify-center`}>
        <div
          className={`${dotSizeClasses[size]} bg-purple-600 rounded-full animate-bounce`}
          style={{ animationDelay: '0s' }}
        />
        <div
          className={`${dotSizeClasses[size]} bg-purple-600 rounded-full animate-bounce`}
          style={{ animationDelay: '0.2s' }}
        />
        <div
          className={`${dotSizeClasses[size]} bg-purple-600 rounded-full animate-bounce`}
          style={{ animationDelay: '0.4s' }}
        />
      </div>
      {text && <p className="text-gray-600 dark:text-gray-400 font-medium text-sm">{text}</p>}
    </div>
  );
};

export default LoadingDots;
