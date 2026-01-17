
import React from 'react';
import { Flavor } from '../types';

interface FlavorSelectorProps {
  flavors: Flavor[];
  selectedFlavor: Flavor;
  onSelectFlavor: (flavor: Flavor) => void;
  customFlavor: string;
  onCustomFlavorChange: (flavor: string) => void;
}

const FlavorSelector: React.FC<FlavorSelectorProps> = ({
  flavors,
  selectedFlavor,
  onSelectFlavor,
  customFlavor,
  onCustomFlavorChange
}) => {
  const isCustomFlavorActive = customFlavor.trim() !== '';

  return (
    <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
        {flavors.map((flavor) => (
            <button
            key={flavor}
            onClick={() => onSelectFlavor(flavor)}
            className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 ease-in-out transform hover:scale-105
                ${
                selectedFlavor === flavor && !isCustomFlavorActive
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }
            `}
            >
            {flavor}
            </button>
        ))}
        </div>
        <div>
            <input 
                type="text"
                placeholder="Or type a custom flavor..."
                value={customFlavor}
                onChange={(e) => onCustomFlavorChange(e.target.value)}
                className={`w-full px-4 py-2 bg-gray-900 border-2 rounded-lg transition-colors duration-200 text-gray-200 placeholder-gray-500
                ${isCustomFlavorActive ? 'border-purple-500 ring-2 ring-purple-500/50' : 'border-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-purple-500'}
                `}
            />
        </div>
    </div>
  );
};

export default FlavorSelector;
