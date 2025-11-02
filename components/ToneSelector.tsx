import React from 'react';
import { Tone, Language } from '../types';

interface ToneSelectorProps {
  selectedTone: Tone;
  onToneChange: (tone: Tone) => void;
  language: Language;
}

export const ToneSelector: React.FC<ToneSelectorProps> = ({ selectedTone, onToneChange, language }) => {
  const tones = Object.values(Tone);

  const tamilTones: { [key in Tone]: string } = {
    [Tone.FUNNY]: 'நகைச்சுவை',
    [Tone.ADULT]: 'முதிர்ந்த',
    [Tone.PROFESSIONAL]: 'தொழில்முறை',
    [Tone.POETIC]: 'கவிதை',
  };
  
  const labels = language === Language.TAMIL ? tamilTones : null;

  return (
    <div className="relative">
      <select
        value={selectedTone}
        onChange={(e) => onToneChange(e.target.value as Tone)}
        className="appearance-none bg-white border border-amber-300 text-amber-900 text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 block w-full p-2.5 pr-8"
        aria-label="Select chatbot tone"
      >
        {tones.map((tone) => (
          <option key={tone} value={tone}>
            {labels ? labels[tone] : tone}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-amber-900">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
      </div>
    </div>
  );
};
