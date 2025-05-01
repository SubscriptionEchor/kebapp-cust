import React from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  isVegOnly: boolean;
  isNonVegOnly: boolean;
  onVegToggle: () => void;
  onNonVegToggle: () => void;
  selectedTags: string[];
  onTagSelect: (tag: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  isVegOnly,
  isNonVegOnly,
  onVegToggle,
  onNonVegToggle,
  selectedTags,
  onTagSelect
}) => {
  const tags = ["Bestseller", "Chef's Special"];

  return (
    <div className="bg-white border-b border-gray-100">
      <div className="px-4 py-3">
        <div className="relative">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder='Search for "Seekh Kebab"'
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
          />
          <Search 
            size={20} 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
        </div>
      </div>

      <div className="px-4 pb-3 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-4 min-w-max">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 shrink-0">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={isVegOnly}
                  onChange={onVegToggle}
                  className="sr-only peer"
                />
                <div className="w-8 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-green-600 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
              </div>
              <span className="text-xs font-medium">Veg</span>
            </label>
            
            <label className="flex items-center gap-2 shrink-0">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={isNonVegOnly}
                  onChange={onNonVegToggle}
                  className="sr-only peer"
                />
                <div className="w-8 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-red-600 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
              </div>
              <span className="text-xs font-medium">Non-veg</span>
            </label>
          </div>

          <div className="flex gap-2 shrink-0">
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => onTagSelect(tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors shrink-0 ${
                  selectedTags.includes(tag)
                    ? 'bg-secondary text-black'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;