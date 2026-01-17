import React from 'react';
import { PencilIcon, LightBulbIcon } from './icons';

interface ActionButtonsProps {
  length: number;
  onLengthChange: (length: number) => void;
  onContinue: () => void;
  onGenerateIdeas: () => void;
  isLoading: boolean;
  lengthOptions: number[];
  promptTokens: number;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  length,
  onLengthChange,
  onContinue,
  onGenerateIdeas,
  isLoading,
  lengthOptions,
  promptTokens
}) => {
  const hasPrompt = promptTokens > 0;

  return (
    <div className="space-y-4">
      {hasPrompt && (
        <div className="p-3 bg-gray-900/70 rounded-lg text-sm text-gray-400 border border-gray-700 text-center">
          <p className="font-semibold text-gray-300">
            Estimated Prompt Size: <span className="font-mono text-purple-400">{promptTokens.toLocaleString()}</span> tokens
          </p>
        </div>
      )}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="flex-grow flex gap-2 w-full sm:w-auto">
          <button
            onClick={onContinue}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:bg-purple-900 disabled:cursor-not-allowed transition-all duration-200"
          >
            <PencilIcon className="w-5 h-5"/>
            {isLoading ? 'Writing...' : 'Continue Story'}
          </button>
          <button
            onClick={onGenerateIdeas}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 font-bold text-white bg-pink-500 rounded-lg hover:bg-pink-600 disabled:bg-pink-800 disabled:cursor-not-allowed transition-all duration-200"
          >
            <LightBulbIcon className="w-5 h-5"/>
            {isLoading ? 'Thinking...' : 'Generate 2 Ideas'}
          </button>
        </div>

        <div className="flex-shrink-0 flex items-center gap-2 bg-gray-700 p-1 rounded-lg w-full sm:w-auto">
          <span className="text-xs font-semibold px-2 text-gray-400">LENGTH</span>
          {lengthOptions.map(option => (
              <button
              key={option}
              onClick={() => onLengthChange(option)}
              disabled={isLoading}
              className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors duration-200
                  ${
                  length === option
                      ? 'bg-purple-500 text-white'
                      : 'bg-transparent text-gray-300 hover:bg-gray-600'
                  }
              `}
              >
              {option}
              </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ActionButtons;