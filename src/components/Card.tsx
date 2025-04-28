import React, { ReactNode } from 'react';
import { useTelegram } from '../context/TelegramContext';

interface CardProps {
  children: ReactNode;
  title?: string;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({ 
  children, 
  title, 
  className = '',
  onClick,
  hover = false
}) => {
  const { colorScheme } = useTelegram();
  const isDarkMode = colorScheme === 'dark';
  
  return (
    <div 
      className={`
        rounded-lg 
        ${isDarkMode ? 'bg-gray-800' : 'bg-white'} 
        p-4 
        shadow-sm
        ${hover ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {title && (
        <h3 className="text-lg font-semibold mb-2 font-proxima">{title}</h3>
      )}
      {children}
    </div>
  );
};

export default Card;