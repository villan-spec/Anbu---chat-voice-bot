import React from 'react';
import { Tone, Language, InteractionModel } from '../types';
import { ToneSelector } from './ToneSelector';
import { LanguageSelector } from './LanguageSelector';
import { ModelSelector } from './ModelSelector';
import { SpeakerOnIcon, SpeakerOffIcon } from './icons';

interface HeaderProps {
  currentTone: Tone;
  onToneChange: (tone: Tone) => void;
  isSpeechEnabled: boolean;
  onSpeechToggle: () => void;
  currentLanguage: Language;
  onLanguageChange: (language: Language) => void;
  currentModel: InteractionModel;
  onModelChange: (model: InteractionModel) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTone,
  onToneChange,
  isSpeechEnabled,
  onSpeechToggle,
  currentLanguage,
  onLanguageChange,
  currentModel,
  onModelChange,
}) => {
  const isVoiceModel = currentModel === InteractionModel.VOICE;

  return (
    <header className="bg-amber-100/80 backdrop-blur-sm text-amber-900 p-3 shadow-md fixed top-0 left-0 right-0 z-10">
      <div className="container mx-auto flex justify-between items-center max-w-4xl">
        <h1 className="text-2xl font-bold font-catamaran">அன்பு <span className="hidden sm:inline">(Anbu)</span></h1>
        <div className="flex items-center space-x-2 sm:space-x-4">
          <LanguageSelector selectedLanguage={currentLanguage} onLanguageChange={onLanguageChange} />
          <ModelSelector selectedModel={currentModel} onModelChange={onModelChange} language={currentLanguage} />
          <ToneSelector selectedTone={currentTone} onToneChange={onToneChange} language={currentLanguage} />
          <button
            onClick={onSpeechToggle}
            className={`p-2 rounded-full hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors ${isVoiceModel ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label={isSpeechEnabled ? "Disable speech output" : "Enable speech output"}
            disabled={isVoiceModel}
            title={isVoiceModel ? "Speech is always on in Voice Model" : "Toggle browser speech"}
          >
            {isSpeechEnabled || isVoiceModel ? <SpeakerOnIcon className="w-6 h-6" /> : <SpeakerOffIcon className="w-6 h-6 text-gray-500" />}
          </button>
        </div>
      </div>
    </header>
  );
};
