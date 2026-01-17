
import React from 'react';
import { SparklesIcon } from './icons';

const Header: React.FC = () => {
  return (
    <header className="text-center">
      <div className="flex items-center justify-center gap-4">
        <SparklesIcon className="w-10 h-10 text-purple-400" />
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
          AI Story Generator
        </h1>
      </div>
      <p className="mt-4 text-lg text-gray-400">
        Unleash your creativity. Let AI co-author your next masterpiece.
      </p>
    </header>
  );
};

export default Header;
