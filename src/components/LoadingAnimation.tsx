import React from 'react';

interface LoadingAnimationProps {
  className?: string;
}

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ className = '' }) => {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="flex items-center space-x-1 mb-2">
        {['K', 'E', 'B', 'A', 'P', 'P'].map((letter, index) => (
          <span
            key={index}
            className="text-xl font-bold text-secondary animate-bounce"
            style={{
              animationDelay: `${index * 100}ms`,
              animationDuration: '1s'
            }}
          >
            {letter}
          </span>
        ))}
      </div>
      <div className="flex space-x-2">
        <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
        <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
      </div>
    </div>
  );
};

export default LoadingAnimation;