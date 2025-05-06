import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface CustomDropdownProps {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  className?: string;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  value,
  options,
  onChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(option => option.value === value);

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-transparent text-[15px] text-gray-900 focus:outline-none"
      >
        <span>{selectedOption?.label}</span>
        <ChevronDown 
          size={20} 
          className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 animate-fade-in">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-between px-4 py-2.5 text-[13px] hover:bg-gray-50 transition-colors"
            >
              <span className={option.value === value ? 'text-secondary font-medium' : 'text-gray-900'}>
                {option.label}
              </span>
              {option.value === value && (
                <Check size={16} className="text-secondary" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default CustomDropdown;