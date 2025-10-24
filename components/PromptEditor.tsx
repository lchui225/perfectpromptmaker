import React, { useState } from 'react';
import ClipboardIcon from './icons/ClipboardIcon';
import SparklesIcon from './icons/SparklesIcon';

interface PromptEditorProps {
  initialPrompt: string;
  setInitialPrompt: (prompt: string) => void;
  refinedPrompt: string;
  onStart: () => void;
  isLoading: boolean;
  isStarted: boolean;
}

const PromptEditor: React.FC<PromptEditorProps> = ({
  initialPrompt,
  setInitialPrompt,
  refinedPrompt,
  onStart,
  isLoading,
  isStarted,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(refinedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col space-y-6 p-4 md:p-6 bg-white rounded-xl shadow-lg h-full">
      <div className="flex-grow flex flex-col">
        <label htmlFor="initial-prompt" className="text-lg font-semibold text-gray-700 mb-2">
          Your Idea or Rough Prompt
        </label>
        <textarea
          id="initial-prompt"
          value={initialPrompt}
          onChange={(e) => setInitialPrompt(e.target.value)}
          placeholder="e.g., 'write a story about a space cat' or 'explain quantum physics to a 5-year-old'"
          className="w-full flex-grow p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow duration-200 resize-none text-gray-800 disabled:bg-gray-50"
          rows={6}
          disabled={isStarted}
        />
        {!isStarted && (
            <button
            onClick={onStart}
            disabled={isLoading || !initialPrompt.trim()}
            className="mt-4 w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors duration-200"
            >
            {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
                <>
                    <SparklesIcon className="w-5 h-5 mr-2" />
                    Start Refining
                </>
            )}
            </button>
        )}
      </div>

      <div className="flex-grow flex flex-col">
        <label htmlFor="refined-prompt" className="text-lg font-semibold text-gray-700 mb-2">
          AI-Perfected Prompt
        </label>
        <div className="relative w-full flex-grow">
          <textarea
            id="refined-prompt"
            value={refinedPrompt}
            readOnly
            placeholder="Your refined prompt will appear here..."
            className="w-full h-full p-3 pr-12 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-shadow duration-200 resize-none text-gray-800"
            rows={6}
          />
          {refinedPrompt && (
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 p-2 text-gray-500 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              title="Copy to clipboard"
            >
              <ClipboardIcon className="w-5 h-5" />
            </button>
          )}
        </div>
        {copied && (
          <p className="text-sm text-green-600 mt-2 text-center">Copied to clipboard!</p>
        )}
      </div>
    </div>
  );
};

export default PromptEditor;
