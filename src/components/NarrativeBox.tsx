/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { gameAudio } from '../utils/AudioEngine';

interface NarrativeBoxProps {
  dialogue: {
    sender: 'detective' | 'cat' | 'system';
    text: string;
    mood?: string;
  } | null;
  onNext?: () => void;
}

export default function NarrativeBox({ dialogue, onNext }: NarrativeBoxProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!dialogue) {
      setDisplayedText('');
      return;
    }

    let index = 0;
    const fullText = dialogue.text;
    setDisplayedText('');
    setIsTyping(true);

    const interval = setInterval(() => {
      setDisplayedText((prev) => prev + fullText.charAt(index));
      index++;

      // Play soft typewriter sound for letters (but don't saturate audio threads)
      if (index % 3 === 0 && dialogue.sender !== 'system') {
        try {
          gameAudio.playClick();
        } catch (e) {}
      }

      if (index >= fullText.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 20); // Speedy and responsive typewriter speed

    return () => clearInterval(interval);
  }, [dialogue]);

  if (!dialogue) return null;

  const handleSkipOrNext = () => {
    if (isTyping) {
      setDisplayedText(dialogue.text);
      setIsTyping(false);
    } else if (onNext) {
      onNext();
    }
  };

  const getSenderName = () => {
    if (dialogue.sender === 'detective') return 'Детектив Барт Ванс';
    if (dialogue.sender === 'cat') return 'Кот Миднайт (вы)';
    return 'Расследование';
  };

  const getMoodLabel = () => {
    if (dialogue.sender === 'detective') {
      const mood = dialogue.mood || 'serious';
      if (mood === 'silly') return '[глупое недоумение]';
      if (mood === 'shocked') return '[драматический шок]';
      if (mood === 'thoughtful') return '[глубокие думы]';
      if (mood === 'proud') return '[самоуверенная гордость]';
      return '[очень серьезно]';
    }
    if (dialogue.sender === 'cat') {
      return '[наглое кошачье величие]';
    }
    return '';
  };

  return (
    <div 
      onClick={handleSkipOrNext}
      className="w-full border border-white/10 bg-[#0c0c0c]/90 rounded-none p-5 cursor-pointer hover:border-white/20 transition-all duration-200 select-none relative shadow-2xl backdrop-blur-sm"
    >
      {/* Decorative vertical accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-white/40" />

      <div className="flex gap-5 items-start pl-2">
        {/* Avatar Silhouette */}
        <div className="w-16 h-16 rounded-none border border-white/10 bg-[#050505] flex-shrink-0 flex items-center justify-center overflow-hidden">
          {dialogue.sender === 'detective' ? (
            // Detective mini silhouette
            <svg viewBox="0 0 100 100" className="w-12 h-12 text-white/40 fill-current">
              <path d="M50,15 C40,15 35,22 35,28 C35,29 40,30 45,30 C50,30 55,29 55,28 C55,22 50,15 50,15 Z M25,40 C25,40 28,32 50,32 C72,32 75,40 75,40 L65,75 L35,75 Z" />
              <rect x="42" y="55" width="4" height="15" fill="#444" />
            </svg>
          ) : dialogue.sender === 'cat' ? (
            // Cat mini silhouette
            <svg viewBox="0 0 100 100" className="w-12 h-12 text-white/60 fill-current">
              <circle cx="50" cy="45" r="18" />
              <polygon points="34,35 25,12 44,28" />
              <polygon points="66,35 75,12 56,28" />
              <circle cx="43" cy="45" r="3" fill="#fff" />
              <circle cx="57" cy="45" r="3" fill="#fff" />
            </svg>
          ) : (
            // Case Icon
            <span className="text-xl font-bold font-mono text-white/20">?</span>
          )}
        </div>

        {/* Text Container */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
            <span className="font-sans text-[11px] font-bold text-white uppercase tracking-[0.2em]">
              {getSenderName()}
            </span>
            <span className="font-serif text-[10px] text-white/40 italic">
              {getMoodLabel()}
            </span>
          </div>
          
          <p className="font-serif text-[15px] text-white/95 leading-relaxed min-h-12 italic">
            {displayedText}
            {isTyping && <span className="inline-block w-1.5 h-3.5 bg-white/80 ml-1 animate-pulse" />}
          </p>
        </div>
      </div>

      {/* Action Indicator */}
      <div className="absolute bottom-2 right-4 font-mono text-[8px] text-white/30 tracking-[0.15em] uppercase">
        {isTyping ? '[ Кликни для пропуска ]' : '[ Далее // Нажми на текст ]'}
      </div>
    </div>
  );
}
