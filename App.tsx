import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message, Role, Tone, Language, InteractionModel } from './types';
import { generateResponse, generateSpeech } from './services/geminiService';
import { ChatBubble } from './components/ChatBubble';
import { ChatInput } from './components/ChatInput';
import { Header } from './components/Header';

// Fix: Add type definitions for the Web Speech API to resolve TypeScript errors.
interface SpeechRecognition {
  continuous: boolean;
  lang: string;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onstart: () => void;
  onend: () => void;
  onresult: (event: any) => void;
  onerror: (event: any) => void;
}

interface SpeechRecognitionStatic {
  new(): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionStatic;
    webkitSpeechRecognition: SpeechRecognitionStatic;
  }
}

const initialMessages: Record<Language, Message> = {
  [Language.TAMIL]: { role: Role.AI, content: 'வணக்கம்! நான் அன்பு, உங்கள் தமிழ் AI நண்பன். நான் எப்படி உதவ முடியும்?' },
  [Language.ENGLISH]: { role: Role.AI, content: 'Hello! I am Anbu, your friendly AI assistant. How can I help you today?' },
};

const placeholders: Record<Language, string> = {
  [Language.TAMIL]: 'தமிழில் தட்டச்சு செய்யவும் அல்லது பேசவும்...',
  [Language.ENGLISH]: 'Type or speak in English...',
};

const App: React.FC = () => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(Language.TAMIL);
  const [messages, setMessages] = useState<Message[]>([initialMessages[currentLanguage]]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentTone, setCurrentTone] = useState<Tone>(Tone.ADULT);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [currentModel, setCurrentModel] = useState<InteractionModel>(InteractionModel.CHAT);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Scroll to bottom of chat
  useEffect(() => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);
  
  // Reset chat and stop audio when language changes
  useEffect(() => {
    setMessages([initialMessages[currentLanguage]]);
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();
    if (activeAudioSourceRef.current) {
      activeAudioSourceRef.current.stop();
      activeAudioSourceRef.current = null;
    }
  }, [currentLanguage]);

  // Initialize Speech Recognition and update language
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = currentLanguage === Language.TAMIL ? 'ta-IN' : 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputValue(transcript);
    };
    recognitionRef.current = recognition;
  }, [currentLanguage]);

  // Audio decoding helpers from Gemini docs
  const decode = (base64: string): Uint8Array => {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const decodeAudioData = async (
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const playAudioFromBase64 = useCallback(async (base64Audio: string) => {
    if (!base64Audio) return;

    try {
       // Stop any currently playing audio from this source
      if (activeAudioSourceRef.current) {
        activeAudioSourceRef.current.stop();
        activeAudioSourceRef.current = null;
      }

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;
      
      const audioBytes = decode(base64Audio);
      const audioBuffer = await decodeAudioData(audioBytes, ctx, 24000, 1);
      
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start();

      activeAudioSourceRef.current = source; // Store the new source
      source.onended = () => { // Clean up when it finishes
          if (activeAudioSourceRef.current === source) {
              activeAudioSourceRef.current = null;
          }
      };
    } catch (error) {
        console.error("Failed to decode and play audio:", error);
        const errorText = currentLanguage === Language.TAMIL ? "குரலை இயக்க முடியவில்லை." : "Could not play the voice.";
        const errorMessage: Message = { role: Role.ERROR, content: errorText };
        setMessages(prev => [...prev, errorMessage]);
    }
  }, [currentLanguage]);

  const speakWithBrowserAPI = useCallback((text: string, lang: Language) => {
    if (!isSpeechEnabled || !text || !window.speechSynthesis) return;

    // Cancel any ongoing speech to prevent overlap.
    window.speechSynthesis.cancel();
  
    const utterance = new SpeechSynthesisUtterance(text);
  
    // Find the appropriate voice at the time of speaking.
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice: SpeechSynthesisVoice | undefined;
  
    if (lang === Language.TAMIL) {
      utterance.lang = 'ta-IN';
      selectedVoice = voices.find(voice => voice.lang === 'ta-IN') || voices.find(voice => voice.lang.startsWith('ta-'));
    } else {
      utterance.lang = 'en-US';
      selectedVoice = voices.find(voice => voice.lang === 'en-US') || voices.find(voice => voice.lang.startsWith('en-'));
    }
  
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
  
    window.speechSynthesis.speak(utterance);
  }, [isSpeechEnabled]);

  const handleSendMessage = useCallback(async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isLoading) return;

    // Capture state at the beginning of the function call to prevent race conditions.
    const languageForRequest = currentLanguage;
    const toneForRequest = currentTone;
    const modelForRequest = currentModel;
    const speechEnabledForRequest = isSpeechEnabled;
    const historyForRequest = messages;

    const userMessage: Message = { role: Role.USER, content: trimmedInput };
    const loadingMessage: Message = { role: Role.AI, content: '...' };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const aiResponseText = await generateResponse(trimmedInput, historyForRequest, toneForRequest, languageForRequest);
      const aiMessage: Message = { role: Role.AI, content: aiResponseText };
      
      setMessages(prev => [...prev.slice(0, -1), aiMessage]);
      
      // Use the captured state to decide on audio playback
      if (modelForRequest === InteractionModel.VOICE) {
        const audioData = await generateSpeech(aiResponseText, languageForRequest);
        await playAudioFromBase64(audioData);
      } else if (speechEnabledForRequest) {
        speakWithBrowserAPI(aiResponseText, languageForRequest);
      }

    } catch (error) {
      const errorMessageContent = error instanceof Error ? error.message : "An unknown error occurred.";
      const errorText = languageForRequest === Language.TAMIL ? `பிழை: ${errorMessageContent}` : `Error: ${errorMessageContent}`;
      const errorMessage: Message = { role: Role.ERROR, content: errorText };
      setMessages(prev => [...prev.slice(0, -1), errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, messages, currentTone, currentLanguage, currentModel, isSpeechEnabled, speakWithBrowserAPI, playAudioFromBase64]);

  const handleMicClick = () => {
    if (!recognitionRef.current) {
        alert("Speech recognition is not supported in your browser.");
        return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  return (
    <div className="bg-amber-50 min-h-screen flex flex-col font-noto-sans-tamil">
      <Header
        currentTone={currentTone}
        onToneChange={setCurrentTone}
        isSpeechEnabled={isSpeechEnabled}
        onSpeechToggle={() => setIsSpeechEnabled(prev => !prev)}
        currentLanguage={currentLanguage}
        onLanguageChange={setCurrentLanguage}
        currentModel={currentModel}
        onModelChange={setCurrentModel}
      />
      <main ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 pt-24 pb-28 space-y-4 container mx-auto max-w-4xl">
        {messages.map((msg, index) => (
          <ChatBubble key={index} message={msg} />
        ))}
      </main>
      <ChatInput
        inputValue={inputValue}
        onInputChange={(e) => setInputValue(e.target.value)}
        onSendMessage={handleSendMessage}
        isListening={isListening}
        onMicClick={handleMicClick}
        isLoading={isLoading}
        placeholder={placeholders[currentLanguage]}
      />
    </div>
  );
};

export default App;
