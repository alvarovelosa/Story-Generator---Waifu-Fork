import React from 'react';
import { TagIcon } from './icons';
import Loader from './Loader';

interface TitleGeneratorProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  onGenerate: () => void;
  generatedTitle: string;
  isLoading: boolean;
  error: string | null;
}

const TitleGenerator: React.FC<TitleGeneratorProps> = ({
  prompt,
  onPromptChange,
  onGenerate,
  generatedTitle,
  isLoading,
  error,
}) => {
  return (
    <div className="space-y-4">
      <textarea
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        placeholder="Add a prompt for the title, e.g., 'Make it sound mysterious' or 'A title for a young adult novel'"
        className="w-full h-20 p-3 bg-gray-900 border-2 border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors duration-200 text-gray-200 placeholder-gray-500 resize-y text-sm"
      />
      <button
        onClick={onGenerate}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 px-5 py-3 font-bold text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:bg-teal-900 disabled:cursor-not-allowed transition-all duration-200"
      >
        <TagIcon className="w-5 h-5" />
        {isLoading ? 'Generating...' : 'Generate Title'}
      </button>
      
      {isLoading && (
        <div className="pt-4 flex justify-center">
            <Loader />
        </div>
      )}

      {error && (
        <div className="mt-2 p-3 bg-red-900/50 border border-red-500 text-red-300 rounded-lg">
          <p>{error}</p>
        </div>
      )}
      
      {generatedTitle && !isLoading && (
        <div className="pt-4 text-center">
            <p className="text-sm text-gray-400">Generated Title:</p>
            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500">
                {generatedTitle}
            </h3>
        </div>
      )}

    </div>
  );
};

export default TitleGenerator;
