import React, { ButtonHTMLAttributes } from 'react';
import { useTelegram } from '../context/TelegramContext';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const { themeParams } = useTelegram();
  
  // Define base styles based on variant
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-secondary text-primary hover:bg-opacity-90 active:bg-opacity-100 font-medium';
      case 'secondary':
        return 'bg-tertiary text-white hover:bg-opacity-90 active:bg-opacity-100 font-medium';
      case 'tertiary':
        return 'bg-transparent text-secondary hover:bg-secondary hover:bg-opacity-10 font-medium';
      case 'outline':
        return 'bg-transparent border border-secondary text-secondary hover:bg-secondary hover:bg-opacity-10 font-medium';
      default:
        return 'bg-secondary text-primary hover:bg-opacity-90 active:bg-opacity-100 font-medium';
    }
  };

  // Define size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1 text-sm';
      case 'md':
        return 'px-4 py-2';
      case 'lg':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2';
    }
  };

  // Combine all classes
  const buttonClasses = `
    rounded-md
    transition-all
    duration-200
    flex
    items-center
    justify-center
    gap-2
    ${getVariantClasses()}
    ${getSizeClasses()}
    ${fullWidth ? 'w-full' : ''}
    ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}
    ${className}
  `;

  return (
    <button 
      className={buttonClasses} 
      disabled={disabled || loading} 
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {icon && !loading && <span>{icon}</span>}
      {children}
    </button>
  );
};

export default Button;