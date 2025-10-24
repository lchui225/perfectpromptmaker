import React from 'react';
import SparklesIcon from './icons/SparklesIcon';

const Header: React.FC = () => {
  return (
    <header className="w-full p-4 border-b border-gray-200 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto flex items-center justify-center space-x-3">
        <SparklesIcon className="w-8 h-8 text-indigo-500" />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Perfect Prompt Maker</h1>
          <p className="text-sm text-gray-500">
            Refine your ideas into powerful, precise prompts with AI assistance.
          </p>
        </div>
      </div>
    </header>
  );
};

export default Header;
