import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import PaperAirplaneIcon from './icons/PaperAirplaneIcon';
import SparklesIcon from './icons/SparklesIcon';

interface AssistantChatProps {
  chatHistory: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  isStarted: boolean;
}

const AssistantChat: React.FC<AssistantChatProps> = ({
  chatHistory,
  onSendMessage,
  isLoading,
  isStarted
}) => {
  const [message, setMessage] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg p-4 md:p-6">
      <h2 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Refinement Assistant</h2>
      <div ref={chatContainerRef} className="flex-grow overflow-y-auto pr-2 space-y-4">
        {!isStarted && (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                <SparklesIcon className="w-16 h-16 text-gray-300 mb-4"/>
                <p className="font-semibold">Your conversation will appear here.</p>
                <p className="text-sm">Start by entering your initial prompt on the left and click "Start Refining".</p>
            </div>
        )}
        {chatHistory.map((chat, index) => (
          <div key={index} className={`flex ${chat.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl ${
                chat.sender === 'user'
                  ? 'bg-indigo-500 text-white rounded-br-none'
                  : 'bg-gray-100 text-gray-800 rounded-bl-none'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{chat.text}</p>
            </div>
          </div>
        ))}
         {isLoading && chatHistory.length > 0 && (
          <div className="flex justify-start">
            <div className="max-w-xs px-4 py-3 rounded-2xl bg-gray-100 text-gray-800 rounded-bl-none">
              <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="mt-4 flex items-center space-x-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={isStarted ? "Answer questions or add details..." : "Start refining to enable chat"}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow duration-200 disabled:bg-gray-100"
          disabled={!isStarted || isLoading}
        />
        <button
          type="submit"
          disabled={!message.trim() || isLoading || !isStarted}
          className="p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors"
        >
          <PaperAirplaneIcon className="w-6 h-6" />
        </button>
      </form>
    </div>
  );
};

export default AssistantChat;
