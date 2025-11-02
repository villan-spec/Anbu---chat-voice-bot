
import React from 'react';
import { Message, Role } from '../types';
import { LoadingSpinner } from './icons';

interface ChatBubbleProps {
  message: Message;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.role === Role.USER;
  const isAI = message.role === Role.AI;
  const isError = message.role === Role.ERROR;
  const isLoading = message.content === '...';

  const bubbleClasses = isUser
    ? 'bg-amber-200 text-amber-900 self-end'
    : isError
    ? 'bg-red-100 text-red-700 self-start'
    : 'bg-white text-gray-800 self-start';
  
  const bubbleAlignment = isUser ? 'items-end' : 'items-start';

  return (
    <div className={`w-full flex flex-col ${bubbleAlignment}`}>
        <div className={`max-w-md md:max-w-lg lg:max-w-2xl px-4 py-3 rounded-2xl shadow-sm ${bubbleClasses}`}>
        {isLoading && isAI ? (
            <div className="flex items-center space-x-2">
                <LoadingSpinner />
                <span className="text-sm text-gray-500">சிந்திக்கிறேன்...</span>
            </div>
        ) : (
            <p className="whitespace-pre-wrap">{message.content}</p>
        )}
        </div>
    </div>
  );
};
