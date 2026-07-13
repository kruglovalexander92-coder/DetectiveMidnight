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
  pendingVictory?: boolean;
}

export default function NarrativeBox({ dialogue, onNext, pendingVictory }: NarrativeBoxProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!dialogue) {
      setDisplayedText('');
      return;
    }

    const fullText = dialogue.text;
    setDisplayedText('');
    setIsTyping(true);

    let index = 0;
    let timeoutId: any;

    const typeCharacter = () => {
      if (index >= fullText.length) {
        setIsTyping(false);
        return;
      }

      index++;
      setDisplayedText(fullText.slice(0, index));

      // Play soft typewriter sound for letters (but don't saturate audio threads)
      if (index % 3 === 0 && dialogue.sender !== 'system') {
        try {
          gameAudio.playClick();
        } catch (e) {}
      }

      // Calculate dynamic delay for dramatic pauses
      const char = fullText[index - 1];
      let delay = 25; // base delay in ms

      if (char === '.' || char === '!' || char === '?' || char === '…') {
        delay = 450; // Dramatic end-of-sentence pause
      } else if (char === ',' || char === ';' || char === ':' || char === '—') {
        delay = 180; // Clause/phrase pause
      } else if (char === ' ') {
        delay = 40; // Natural word spacing gap
      }

      timeoutId = setTimeout(typeCharacter, delay);
    };

    timeoutId = setTimeout(typeCharacter, 25);

    return () => clearTimeout(timeoutId);
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

  const getCatEmojiInfo = (
    sender: 'detective' | 'cat' | 'system',
    text: string,
    mood?: string
  ) => {
    let emojiName = 'neutral';
    let label = 'Нейтрально';
    let subText = 'Просто делает свою кошачью работу';

    const t = text.toLowerCase();

    if (sender === 'cat') {
      if (t.includes('нашел') || t.includes('победа') || t.includes('успех') || t.includes('завершить')) {
        emojiName = 'victory';
        label = 'Победа';
        subText = 'Очередной триумф кошачьего гения 😎';
      } else if (t.includes('мяу') || t.includes('мурч') || t.includes('урчит')) {
        emojiName = 'interest';
        label = 'Интерес';
        subText = 'Мурчит от удовольствия и внимания 😻';
      } else if (t.includes('шкр') || t.includes('деру') || t.includes('когт')) {
        emojiName = 'on_edge';
        label = 'На взводе';
        subText = 'Когти выпущены, ковер приговорен 😼';
      } else {
        emojiName = 'attention';
        label = 'Внимание';
        subText = 'Внимательно следит за развитием дела 👀';
      }
    } else if (sender === 'detective') {
      if (t.includes('хромает') || t.includes('ранил') || t.includes('лапку') || t.includes('боль') || t.includes('мяту')) {
        emojiName = 'oh-no';
        label = 'Ой-ой...';
        subText = 'Миднайту больно, нужна кошачья мята! 😱';
      } else if (t.includes('разбил') || t.includes('бабах') || t.includes('имущество') || t.includes('штраф') || t.includes('счет на')) {
        emojiName = 'irritation';
        label = 'Раздражение';
        subText = '«Это было ради следствия!» 😾';
      } else if (t.includes('прекрати') || t.includes('хулиганить') || t.includes('хватит') || t.includes('ай!')) {
        emojiName = 'sarcasm';
        label = 'Сарказм';
        subText = 'Саркастически зевает на претензии Барта 😸';
      } else if (t.includes('код') || t.includes('цифр') || t.includes('комбинац') || t.includes('шифр')) {
        emojiName = 'attention';
        label = 'Внимание';
        subText = 'Ага! Кажется, детектив напал на след! 👀';
      } else if (t.includes('погром') || t.includes('находка') || t.includes('выкатил') || t.includes('выпал') || t.includes('нашел')) {
        emojiName = 'victory';
        label = 'Победа';
        subText = '«Без меня ты бы искал это до утра, Барт» 😎';
      } else if (t.includes('темно') || t.includes('выключател')) {
        emojiName = 'lazy-gaze';
        label = 'Ленивый взгляд';
        subText = 'В темноте кошачьи глаза видят всё 😴';
      } else if (t.includes('заперт') || t.includes('замочн') || t.includes('нужен ключ')) {
        emojiName = 'hmm';
        label = 'Хмм...';
        subText = 'Задумчиво изучает щель в двери 😟';
      } else {
        if (mood === 'silly') {
          emojiName = 'well_of_course';
          label = 'Ну конечно';
          subText = 'Слушает очередную глупость напарника 🙄';
        } else if (mood === 'shocked') {
          emojiName = 'looking-at-the-player';
          label = 'На игрока';
          subText = 'Красноречиво смотрит прямо на вас 😳';
        } else if (mood === 'thoughtful') {
          emojiName = 'hmm';
          label = 'Хмм...';
          subText = 'Строит свои собственные кошачьи теории 😟';
        } else if (mood === 'proud') {
          emojiName = 'skepticism';
          label = 'Скепсис';
          subText = 'Выражает крайнее сомнение в гениальности Барта 🤨';
        } else if (mood === 'serious') {
          emojiName = 'tired-of-smal--talk';
          label = 'Устал';
          subText = 'Устал от занудных монологов Ванса 🥱';
        } else {
          emojiName = 'neutral';
          label = 'Нейтрально';
          subText = 'Просто делает свою кошачью работу 😐';
        }
      }
    } else {
      if (t.includes('успеш') || t.includes('открыт') || t.includes('выиграл')) {
        emojiName = 'victory';
        label = 'Победа';
        subText = 'Идеально спланированное кошачье дело! 😎';
      } else if (t.includes('пауз')) {
        emojiName = 'dramatic-pause';
        label = 'Пауза';
        subText = 'Нагнетаем детективный саспенс 😐...';
      } else {
        emojiName = 'neutral';
        label = 'Нейтрально';
        subText = 'Сохраняет полное спокойствие 😐';
      }
    }

    return {
      path: `/src/img/Cat_emojis/Cat_emoji_${emojiName}.png`,
      label,
      subText
    };
  };

  const getBartEmojiInfo = (
    sender: 'detective' | 'cat' | 'system',
    text: string,
    mood?: string
  ) => {
    let emojiName = 'neutral';
    let label = 'Нейтрально';

    const m = mood ? mood.toLowerCase() : '';
    const t = text.toLowerCase();

    // Map by mood first
    if (m === 'shocked') {
      emojiName = 'surprise';
      label = 'Удивление';
    } else if (m === 'thoughtful') {
      emojiName = 'thinking';
      label = 'Раздумья';
    } else if (m === 'proud') {
      emojiName = 'satisfaction';
      label = 'Удовлетворение';
    } else if (m === 'serious') {
      emojiName = 'concentration';
      label = 'Концентрация';
    } else if (m === 'silly') {
      emojiName = 'sarcasm';
      label = 'Сарказм';
    } else {
      // Map by text keywords
      if (t.includes('черт') || t.includes('проклятье') || t.includes('нельзя') || t.includes('прекрати') || t.includes('хулиган')) {
        emojiName = 'anger';
        label = 'Гнев';
      } else if (t.includes('великолепно') || t.includes('эврика') || t.includes('озарение') || t.includes('гениаль')) {
        emojiName = 'inspiration';
        label = 'Вдохновение';
      } else if (t.includes('ба!') || t.includes('ого') || t.includes('невероятно') || t.includes('о боже')) {
        emojiName = 'surprise';
        label = 'Сюрприз';
      } else if (t.includes('радост') || t.includes('отличн') || t.includes('ура')) {
        emojiName = 'joy';
        label = 'Радость';
      } else if (t.includes('устал') || t.includes('пылищ') || t.includes('темно') || t.includes('тяжел')) {
        emojiName = 'tiredness';
        label = 'Усталость';
      } else if (t.includes('любопытн') || t.includes('интерес') || t.includes('хмм')) {
        emojiName = 'interest';
        label = 'Интерес';
      } else if (t.includes('разбил') || t.includes('штраф') || t.includes('промок') || t.includes('грохот') || t.includes('на меня')) {
        emojiName = 'irritation';
        label = 'Раздражение';
      } else if (t.includes('очевидно') || t.includes('конечно') || t.includes('прекрати')) {
        emojiName = 'skepticism';
        label = 'Скепсис';
      } else if (t.includes('изуч') || t.includes('код') || t.includes('шифр') || t.includes('комбинац')) {
        emojiName = 'concentration';
        label = 'Концентрация';
      } else if (t.includes('нашел') || t.includes('секрет') || t.includes('шкатулк') || t.includes('находка')) {
        emojiName = 'delight';
        label = 'Восторг';
      }
    }

    return {
      path: `/src/img/Bart_emodjis/Bart_emodji_${emojiName}.png`,
      label
    };
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

  const emojiInfo = getCatEmojiInfo(dialogue.sender, dialogue.text, dialogue.mood);
  const bartEmojiInfo = getBartEmojiInfo(dialogue.sender, dialogue.text, dialogue.mood);

  return (
    <div 
      onClick={handleSkipOrNext}
      className="w-full border border-white/10 bg-[#0c0c0c]/90 rounded-none p-5 cursor-pointer hover:border-white/20 transition-all duration-200 select-none relative shadow-2xl backdrop-blur-sm"
    >
      {/* Decorative vertical accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-white/40" />

      <div className="flex flex-col sm:flex-row gap-5 items-stretch pl-2 w-full">
        {/* Double Avatars section */}
        <div className="flex flex-row sm:flex-col gap-3 justify-center sm:justify-start items-center shrink-0 mb-3 sm:mb-0">
          {/* Bart Vance Avatar */}
          <div className={`relative w-16 h-16 border rounded-none p-0.5 bg-[#0a0a0a]/80 transition-all duration-300 ${
            dialogue.sender === 'detective' 
              ? 'border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.2)] scale-105 z-10' 
              : 'border-white/5 opacity-40 scale-95 hover:opacity-80'
          }`}>
            <div className="w-full h-full bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden">
              <svg viewBox="0 0 100 100" className="w-10 h-10 text-white/10 fill-current absolute z-0">
                <path d="M50,12 C32,12 28,25 28,25 L72,25 C72,25 68,12 50,12 Z M20,25 C18,25 18,28 20,28 L80,28 C82,28 82,25 80,25 Z M32,32 C32,32 35,50 50,50 C65,50 68,32 68,32 L60,82 L40,82 Z" />
              </svg>
              <img 
                src={bartEmojiInfo.path} 
                alt="Б. Ванс" 
                referrerPolicy="no-referrer" 
                className="w-full h-full object-cover relative z-10 transition-all duration-300"
              />
              {dialogue.sender === 'detective' && (
                <div className="absolute inset-0 bg-gradient-to-t from-amber-500/10 to-transparent pointer-events-none z-20" />
              )}
            </div>
            <div className="absolute -bottom-2 left-0 right-0 text-center z-30">
              <span className={`text-[7.5px] font-mono font-bold bg-neutral-900 border px-1 py-0.5 uppercase tracking-wider block truncate transition-all duration-300 ${
                dialogue.sender === 'detective'
                  ? 'border-amber-500/40 text-amber-400 animate-pulse'
                  : 'border-white/10 text-stone-400'
              }`}>
                {dialogue.sender === 'detective' ? bartEmojiInfo.label : 'Б. Ванс'}
              </span>
            </div>
          </div>

          {/* VS Divider or link line */}
          <div className="hidden sm:block w-[1px] h-3 bg-white/10" />

          {/* Midnight Avatar */}
          <div className={`relative w-16 h-16 border rounded-none p-0.5 bg-[#0a0a0a]/80 transition-all duration-300 ${
            dialogue.sender === 'cat' 
              ? 'border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.2)] scale-105 z-10' 
              : 'border-white/10 opacity-80 scale-95 hover:opacity-100 hover:border-white/20'
          }`}>
            <div className="w-full h-full bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden">
              <img 
                src={emojiInfo.path} 
                alt={emojiInfo.label} 
                referrerPolicy="no-referrer" 
                className="w-full h-full object-cover transition-all duration-300"
              />
              {dialogue.sender === 'cat' && (
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/10 to-transparent pointer-events-none" />
              )}
            </div>
            <div className="absolute -bottom-2 left-0 right-0 text-center">
              <span className="text-[7.5px] font-mono font-bold bg-neutral-900 border border-emerald-500/30 px-1 py-0.5 text-emerald-400 uppercase tracking-wider block truncate animate-pulse">
                {emojiInfo.label}
              </span>
            </div>
          </div>
        </div>

        {/* Text Container */}
        <div className="flex-1 min-w-0 flex flex-col justify-between pl-0 sm:pl-3">
          <div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
              <span className="font-sans text-[11px] font-bold text-white uppercase tracking-[0.2em]">
                {getSenderName()}
              </span>
              <span className="font-serif text-[10px] text-white/40 italic">
                {getMoodLabel()}
              </span>
              {/* Cat's silent inner translation */}
              <span className="font-serif text-[10px] text-emerald-400/80 italic ml-auto sm:ml-0">
                — {emojiInfo.subText}
              </span>
            </div>
            
            <p className="font-serif text-[15px] text-white/95 leading-relaxed min-h-12 italic">
              {displayedText}
              {isTyping && <span className="inline-block w-1.5 h-3.5 bg-white/80 ml-1 animate-pulse" />}
            </p>
          </div>
        </div>
      </div>

      {/* Action Indicator or Finish Button */}
      {isTyping ? (
        <div className="absolute bottom-2 right-4 font-mono text-[8px] text-white/30 tracking-[0.15em] uppercase">
          [ Кликни для пропуска ]
        </div>
      ) : pendingVictory ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onNext) onNext();
          }}
          className="absolute bottom-1.5 right-4 px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/40 border border-amber-500/40 text-[9px] text-amber-400 font-sans font-bold uppercase tracking-widest animate-pulse transition-all rounded-none"
        >
          Завершить расследование
        </button>
      ) : (
        <div className="absolute bottom-2 right-4 font-mono text-[8px] text-white/30 tracking-[0.15em] uppercase">
          [ Далее // Нажми на текст ]
        </div>
      )}
    </div>
  );
}
