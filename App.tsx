import React, { useState, useCallback } from 'react';
import { ChatMessage } from './types';
import { refinePrompt } from './services/geminiService';
import Header from './components/Header';
import PromptEditor from './components/PromptEditor';
import AssistantChat from './components/AssistantChat';

const App: React.FC = () => {
  const [initialPrompt, setInitialPrompt] = useState<string>('');
  const [refinedPrompt, setRefinedPrompt] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isStarted, setIsStarted] = useState<boolean>(false);

  const handleStartRefinement = useCallback(async () => {
    if (!initialPrompt.trim() || isLoading) return;

    setIsLoading(true);
    setIsStarted(true);

    const userMessage: ChatMessage = { sender: 'user', text: initialPrompt };
    setChatHistory([userMessage]);

    const response = await refinePrompt(initialPrompt, initialPrompt, [userMessage]);

    setRefinedPrompt(response.revisedPrompt);
    setChatHistory((prev) => [
      ...prev,
      { sender: 'assistant', text: response.explanation },
    ]);
    setIsLoading(false);
  }, [initialPrompt, isLoading]);

  const handleSendMessage = useCallback(async (message: string) => {
    if (!message.trim() || isLoading) return;

    setIsLoading(true);
    const userMessage: ChatMessage = { sender: 'user', text: message };
    const newHistory = [...chatHistory, userMessage];
    setChatHistory(newHistory);

    const response = await refinePrompt(initialPrompt, refinedPrompt, newHistory);

    setRefinedPrompt(response.revisedPrompt);
    setChatHistory((prev) => [
      ...prev,
      { sender: 'assistant', text: response.explanation },
    ]);
    setIsLoading(false);
  }, [isLoading, chatHistory, initialPrompt, refinedPrompt]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <Header />
      <main className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-120px)]">
          <PromptEditor
            initialPrompt={initialPrompt}
            setInitialPrompt={setInitialPrompt}
            refinedPrompt={refinedPrompt}
            onStart={handleStartRefinement}
            isLoading={isLoading && !isStarted}
            isStarted={isStarted}
          />
          <AssistantChat
            chatHistory={chatHistory}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            isStarted={isStarted}
          />
        </div>
      </main>
    </div>
  );
};

export default App;
