import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark';
}

const Logo: React.FC<LogoProps> = ({ className = '', variant = 'light' }) => {
  const textColor = variant === 'light' ? '#FFFFFF' : '#000000';

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="w-32 h-32 mb-4 animate-fade-in">
        <svg width="100%" height="100%" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M256 512c141.385 0 256-114.615 256-256S397.385 0 256 0 0 114.615 0 256s114.615 256 256 256z" fill="#FFCD38"/>
          <path d="M347.644 184.54c-5.862-5.862-15.368-5.862-21.23 0l-70.414 70.414-70.414-70.414c-5.862-5.862-15.368-5.862-21.23 0-5.862 5.862-5.862 15.368 0 21.23l70.414 70.414-70.414 70.414c-5.862 5.862-5.862 15.368 0 21.23 2.931 2.931 6.775 4.396 10.615 4.396s7.684-1.466 10.615-4.396l70.414-70.414 70.414 70.414c2.931 2.931 6.775 4.396 10.615 4.396s7.684-1.466 10.615-4.396c5.862-5.862 5.862-15.368 0-21.23l-70.414-70.414 70.414-70.414c5.862-5.862 5.862-15.368 0-21.23z" fill="#FFFFFF"/>
        </svg>
      </div>
      <div className="flex flex-col items-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <svg width="120" height="32" viewBox="0 0 120 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14.4 7.2h4.8v19.2h-4.8V7.2zm24 0h4.8v19.2h-4.8V7.2zm-12 0h4.8v19.2h-4.8V7.2zm36 0h4.8v19.2h-4.8V7.2zm24 0h4.8v19.2h-4.8V7.2zm12 0h4.8v19.2h-4.8V7.2z" fill={textColor}/>
        </svg>
        <p className="text-sm mt-2" style={{ color: textColor }}>
          Discover the finest kebabs
        </p>
      </div>
    </div>
  );
};

export default Logo;