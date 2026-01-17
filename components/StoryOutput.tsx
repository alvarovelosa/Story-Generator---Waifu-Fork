
import React from 'react';
import Loader from './Loader';
import { CheckIcon } from './icons';

interface StoryOutputProps {
  output: string | string[] | null;
  isLoading: boolean;
  error: string | null;
  onSelectIdea: (idea: string) => void;
}

const StoryOutput: React.FC<StoryOutputProps> = ({ output, isLoading, error, onSelectIdea }) => {
  if (isLoading) {
    return (
      <div className="mt-8 p-6 bg-gray-800 rounded-2xl shadow-lg flex flex-col items-center justify-center min-h-[200px]">
        <Loader />
        <p className="mt-4 text-purple-300 animate-pulse">The AI is pondering your story...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8 p-6 bg-red-900/50 border border-red-500 text-red-300 rounded-2xl shadow-lg">
        <h3 className="font-bold text-lg">An Error Occurred</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!output) {
    return (
        <div className="mt-8 p-6 bg-gray-800 rounded-2xl shadow-lg flex flex-col items-center justify-center min-h-[200px] border-2 border-dashed border-gray-700">
            <p className="text-gray-500">Your next chapter will appear here...</p>
        </div>
    );
  }
  
  return (
    <div className="mt-8 p-6 bg-gray-800 rounded-2xl shadow-lg space-y-4">
      <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
        {Array.isArray(output) ? 'Here are some ideas...' : "Here's what happens next..."}
      </h3>
      {Array.isArray(output) ? (
        <div className="space-y-4">
          {output.map((idea, index) => (
            <div key={index} className="p-4 bg-gray-900 rounded-lg border-l-4 border-pink-500 group transition-all hover:bg-gray-900/80">
              <p className="text-gray-300 leading-relaxed"><strong className="text-pink-400">Idea {index + 1}:</strong> {idea}</p>
              <button 
                onClick={() => onSelectIdea(idea)}
                className="mt-3 flex items-center gap-2 px-3 py-1 text-sm font-semibold bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-transform transform group-hover:translate-y-0 translate-y-2 opacity-0 group-hover:opacity-100"
              >
                <CheckIcon className="w-4 h-4"/>
                Choose this idea
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 bg-gray-900 rounded-lg">
          <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{output}</p>
        </div>
      )}
    </div>
  );
};

export default StoryOutput;
