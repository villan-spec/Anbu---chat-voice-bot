import React from 'react';
import { MicrophoneIcon, SendIcon } from './icons';

interface ChatInputProps {
  inputValue: string;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSendMessage: () => void;
  isListening: boolean;
  onMicClick: () => void;
  isLoading: boolean;
  placeholder: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  inputValue,
  onInputChange,
  onSendMessage,
  isListening,
  onMicClick,
  isLoading,
  placeholder,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  return (
    <div className="bg-amber-50/80 backdrop-blur-sm p-4 border-t border-amber-200 fixed bottom-0 left-0 right-0">
      <div className="container mx-auto flex items-center space-x-2 max-w-4xl">
        <textarea
          value={inputValue}
          onChange={onInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-grow bg-white border border-amber-300 rounded-2xl p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none max-h-32"
          rows={1}
          disabled={isLoading}
        />
        <button
          onClick={onMicClick}
          className={`p-3 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 ${
            isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-amber-400 text-white hover:bg-amber-500'
          }`}
          aria-label="Record voice input"
          disabled={isLoading}
        >
          <MicrophoneIcon className="w-6 h-6" />
        </button>
        <button
          onClick={onSendMessage}
          className="p-3 rounded-full bg-amber-500 text-white hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors disabled:bg-gray-300"
          aria-label="Send message"
          disabled={isLoading || !inputValue.trim()}
        >
          <SendIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
