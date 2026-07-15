/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
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
  const [displayedBartText, setDisplayedBartText] = useState('');
  const [displayedCatText, setDisplayedCatText] = useState('');
  const [isBartTyping, setIsBartTyping] = useState(false);
  const [isCatTyping, setIsCatTyping] = useState(false);
  const [activeSide, setActiveSide] = useState<'bart' | 'cat' | 'none'>('none');

  const bartScrollRef = useRef<HTMLDivElement>(null);
  const catScrollRef = useRef<HTMLDivElement>(null);

  // Smooth scroll to the bottom when text is typed or changed
  useEffect(() => {
    if (bartScrollRef.current) {
      bartScrollRef.current.scrollTo({
        top: bartScrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [displayedBartText]);

  useEffect(() => {
    if (catScrollRef.current) {
      catScrollRef.current.scrollTo({
        top: catScrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [displayedCatText]);

  // Helper functions for automatic reactions
  const getCatReactionForBart = (bartText: string, bartMood: string): string => {
    const t = bartText.toLowerCase();
    if (t.includes('мяту') || t.includes('мята') || t.includes('лапку') || t.includes('хромает')) {
      return `🌿 (=^-ω-^=) 🌿\n«МЯЯЯТУ! СРОЧНО ДАЙ ТРАВУ!»\n*зрачки расширены до предела*`;
    }
    if (t.includes('разбил') || t.includes('штраф') || t.includes('имущество') || t.includes('погром') || t.includes('грохот')) {
      return `(=^･_･^=) *спешно умывается*\n«Это не я! Ваза сама упала под силой гравитации...»`;
    }
    if (t.includes('сейф') || t.includes('код') || t.includes('комбинац') || t.includes('шифр') || t.includes('нашел')) {
      return `(=✧ω✧=) *глаза горят от азарта*\n«Очередной успех кошачьего гения! А теперь... где мой лосось?»`;
    }
    if (t.includes('рыбка') || t.includes('аквариум')) {
      return `(=^･ω･^=) *гипнотизирует лужу*\n«Рыбка! Хватай её, Барт! Она уплывает в щель!»`;
    }
    if (t.includes('драгоценные') || t.includes('конспекты') || t.includes('книги')) {
      return `(=\`ｪ\`=) *лениво потягивается*\n«Бумага отлично шуршит под когтями. Рекомендую.»`;
    }

    // Fallback based on mood
    if (bartMood === 'shocked' || bartMood === 'surprise') {
      return `( 🙀 ) *шерсть дыбом*\n«Ого! Что это там зашуршало?!»`;
    }
    if (bartMood === 'thoughtful') {
      return `(=^·_·^=) *смотрит на стену*\n«Я вижу призраков... Или это просто пылинка?»`;
    }
    if (bartMood === 'silly' || bartMood === 'sarcasm') {
      return `( 🙄 ) *красноречиво вздыхает*\n«Барт, твои теории вызывают у меня зевоту.»`;
    }
    if (bartMood === 'proud') {
      return `(=^-ω-^=) *довольное мурчание*\n«Конечно, без меня ты бы до сих пор искал лупу.»`;
    }

    return `(=^·_·^=) *мяукает*\n«Мяу. Продолжай наблюдение.»`;
  };

  const getBartReactionForCat = (catText: string, catMood: string): string => {
    const t = catText.toLowerCase();
    if (t.includes('крадется') || t.includes('направляется')) {
      return `«Тише, Миднайт... Ступай мягко. Кошачьи лапы — наше секретное оружие.»`;
    }
    if (t.includes('мяу') || t.includes('мурч')) {
      return `«Я слышу тебя, напарник. Этот звук означает, что мы близки к разгадке!»`;
    }
    return `«Внимательно наблюдаю за тобой. Не упусти ни одной важной детали, Миднайт.»`;
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

  useEffect(() => {
    if (!dialogue) {
      setDisplayedBartText('');
      setDisplayedCatText('');
      setIsBartTyping(false);
      setIsCatTyping(false);
      setActiveSide('none');
      return;
    }

    const fullText = dialogue.text;
    const sender = dialogue.sender;
    const mood = dialogue.mood || 'serious';

    let timeoutId: any;

    if (sender === 'detective') {
      // 1. Bart starts speaking, Cat waits
      setActiveSide('bart');
      setDisplayedBartText('');
      setDisplayedCatText('...');
      setIsBartTyping(true);
      setIsCatTyping(false);

      let idx = 0;
      const typeBart = () => {
        if (idx >= fullText.length) {
          setIsBartTyping(false);
          // Wait random (1.0 to 3.0 sec) pause, then Cat reacts!
          const randomDelay = 1000 + Math.random() * 2000;
          timeoutId = setTimeout(() => {
            setActiveSide('cat');
            setIsCatTyping(true);
            const catReaction = getCatReactionForBart(fullText, mood);
            try { gameAudio.playCatMeow(); } catch (e) {}
            let catIdx = 0;
            const typeCat = () => {
              if (catIdx >= catReaction.length) {
                setIsCatTyping(false);
                return;
              }
              catIdx++;
              setDisplayedCatText(catReaction.slice(0, catIdx));
              if (catIdx % 3 === 0) {
                try { gameAudio.playCatTypeSound(); } catch(e){}
              }
              timeoutId = setTimeout(typeCat, 15);
            };
            typeCat();
          }, randomDelay);
          return;
        }

        idx++;
        setDisplayedBartText(fullText.slice(0, idx));
        if (idx % 3 === 0) {
          try { gameAudio.playClick(); } catch(e){}
        }

        // Dynamic typing speed
        const char = fullText[idx - 1];
        let delay = 20;
        if (char === '.' || char === '!' || char === '?' || char === '…') delay = 400;
        else if (char === ',' || char === ';' || char === ':') delay = 150;
        else if (char === ' ') delay = 35;

        timeoutId = setTimeout(typeBart, delay);
      };

      timeoutId = setTimeout(typeBart, 25);

    } else if (sender === 'cat') {
      // 1. Cat acts/meows, Bart listens
      setActiveSide('cat');
      setDisplayedCatText('');
      setDisplayedBartText('...');
      setIsCatTyping(true);
      setIsBartTyping(false);
      try { gameAudio.playCatMeow(); } catch (e) {}

      let idx = 0;
      const typeCat = () => {
        if (idx >= fullText.length) {
          setIsCatTyping(false);
          // Wait random (1.0 to 3.0 sec) pause, then Bart reacts!
          const randomDelay = 1000 + Math.random() * 2000;
          timeoutId = setTimeout(() => {
            setActiveSide('bart');
            setIsBartTyping(true);
            const bartReaction = getBartReactionForCat(fullText, mood);
            let bartIdx = 0;
            const typeBart = () => {
              if (bartIdx >= bartReaction.length) {
                setIsBartTyping(false);
                return;
              }
              bartIdx++;
              setDisplayedBartText(bartReaction.slice(0, bartIdx));
              if (bartIdx % 3 === 0) {
                try { gameAudio.playClick(); } catch(e){}
              }
              timeoutId = setTimeout(typeBart, 15);
            };
            typeBart();
          }, randomDelay);
          return;
        }

        idx++;
        setDisplayedCatText(fullText.slice(0, idx));
        if (idx % 3 === 0) {
          try { gameAudio.playCatTypeSound(); } catch(e){}
        }

        // Dynamic typing speed
        const char = fullText[idx - 1];
        let delay = 20;
        if (char === '.' || char === '!' || char === '?' || char === '…') delay = 400;
        else if (char === ',' || char === ';' || char === ':') delay = 150;
        else if (char === ' ') delay = 35;

        timeoutId = setTimeout(typeCat, delay);
      };

      timeoutId = setTimeout(typeCat, 25);

    } else {
      // system
      setActiveSide('none');
      setDisplayedBartText('');
      setDisplayedCatText('');
      setIsBartTyping(true);
      setIsCatTyping(false);

      let idx = 0;
      const typeSystem = () => {
        if (idx >= fullText.length) {
          setIsBartTyping(false);
          return;
        }
        idx++;
        setDisplayedBartText(fullText.slice(0, idx));
        setDisplayedCatText('*усиленно прислушивается*');
        if (idx % 3 === 0) {
          try { gameAudio.playClick(); } catch(e){}
        }
        timeoutId = setTimeout(typeSystem, 20);
      };
      timeoutId = setTimeout(typeSystem, 25);
    }

    return () => clearTimeout(timeoutId);
  }, [dialogue]);

  if (!dialogue) return null;

  const handleSkipOrNext = () => {
    if (isBartTyping || isCatTyping) {
      // Skip typing to final text instantly
      const fullText = dialogue.text;
      const mood = dialogue.mood || 'serious';
      if (dialogue.sender === 'detective') {
        setDisplayedBartText(fullText);
        setDisplayedCatText(getCatReactionForBart(fullText, mood));
      } else if (dialogue.sender === 'cat') {
        setDisplayedCatText(fullText);
        setDisplayedBartText(getBartReactionForCat(fullText, mood));
      } else {
        setDisplayedBartText(fullText);
        setDisplayedCatText('*усиленно прислушивается*');
      }
      setIsBartTyping(false);
      setIsCatTyping(false);
    } else if (onNext) {
      onNext();
    }
  };

  const getMoodLabel = () => {
    const mood = dialogue.mood || 'serious';
    if (mood === 'silly') return '[глупое недоумение]';
    if (mood === 'shocked') return '[драматический шок]';
    if (mood === 'thoughtful') return '[глубокие думы]';
    if (mood === 'proud') return '[самоуверенная гордость]';
    return '[очень серьезно]';
  };

  const emojiInfo = getCatEmojiInfo(dialogue.sender, dialogue.text, dialogue.mood);
  const bartEmojiInfo = getBartEmojiInfo(dialogue.sender, dialogue.text, dialogue.mood);

  return (
    <div 
      onClick={handleSkipOrNext}
      className="w-full flex flex-col gap-4 select-none cursor-pointer"
    >
      {/* System message banner spans across the top if system is speaking */}
      {dialogue.sender === 'system' && (
        <div className="w-full border border-amber-500/20 bg-amber-950/15 p-2 flex items-center gap-3 shadow-md">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
          <span className="font-mono text-[9px] uppercase tracking-widest text-amber-500/80 font-bold">Рапорт:</span>
          <p className="font-serif text-[12px] text-stone-300 italic flex-1 truncate">{displayedBartText}</p>
        </div>
      )}

      {/* Two columns layout side-by-side on md+, stacked on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full items-stretch">
        
        {/* LEFT COLUMN: BART VANCE */}
        <div 
          onClick={(e) => {
            if (isBartTyping || isCatTyping) {
              // If typing, let the outer container handle it to skip typing
              return;
            }
            if (activeSide !== 'bart') {
              e.stopPropagation();
              setActiveSide('bart');
              try { gameAudio.playClick(); } catch(err){}
            }
          }}
          className={`border bg-[#0c0c0c]/90 p-4 relative flex flex-col justify-between transition-all duration-300 cursor-pointer ${
            activeSide === 'bart' && dialogue.sender !== 'system'
              ? 'border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.12)] bg-[#110e0a]/95'
              : 'border-white/5 opacity-70 hover:opacity-90'
          }`}
        >
          {/* Active side indicator bar */}
          {activeSide === 'bart' && dialogue.sender !== 'system' && (
            <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-amber-500" />
          )}

          <div>
            {/* Header */}
            <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-3">
              <span className="font-sans text-[11px] font-bold text-stone-200 uppercase tracking-[0.18em]">
                Детектив Барт Ванс
              </span>
              <span className="font-serif text-[10px] text-amber-400/80 italic">
                {activeSide === 'bart' && dialogue.sender !== 'system' ? getMoodLabel() : '[слушает]'}
              </span>
            </div>

            {/* Content box */}
            <div className="flex gap-4 items-start">
              {/* Large Avatar */}
              <div className={`relative w-20 h-20 md:w-24 md:h-24 shrink-0 border p-0.5 bg-black transition-all duration-300 ${
                activeSide === 'bart' && dialogue.sender !== 'system'
                  ? 'border-amber-500/60 scale-105'
                  : 'border-white/5 opacity-50'
              }`}>
                <img 
                  src={bartEmojiInfo.path} 
                  alt="Б. Ванс" 
                  referrerPolicy="no-referrer" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute -bottom-2.5 left-0 right-0 text-center z-10">
                  <span className={`text-[7px] font-mono font-bold bg-neutral-900 border px-1 py-0.5 uppercase tracking-wider block truncate ${
                    activeSide === 'bart' && dialogue.sender !== 'system' ? 'border-amber-500/40 text-amber-400' : 'border-white/10 text-stone-400'
                  }`}>
                    {bartEmojiInfo.label}
                  </span>
                </div>
              </div>

              {/* Speech bubble text */}
              <div className="flex-1 min-w-0 bg-black/40 border border-amber-950/40 p-2.5 rounded-sm min-h-[95px] flex flex-col justify-between">
                <div ref={bartScrollRef} className="max-h-[72px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-amber-950/40">
                  <p className="font-serif text-[13px] text-stone-200 leading-relaxed italic whitespace-pre-line">
                    {dialogue.sender === 'system' ? '...' : displayedBartText}
                    {isBartTyping && <span className="inline-block w-1.5 h-3.5 bg-white/80 ml-1 animate-pulse" />}
                  </p>
                </div>
                <div className="text-[8px] font-mono text-stone-500 mt-1 block italic select-none">
                  — Б. Ванс, детектив
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CAT MIDNIGHT */}
        <div 
          onClick={(e) => {
            if (isBartTyping || isCatTyping) {
              // If typing, let the outer container handle it to skip typing
              return;
            }
            if (activeSide !== 'cat') {
              e.stopPropagation();
              setActiveSide('cat');
              try { gameAudio.playClick(); } catch(err){}
            }
          }}
          className={`border bg-[#0c0c0c]/90 p-4 relative flex flex-col justify-between transition-all duration-300 cursor-pointer ${
            activeSide === 'cat' && dialogue.sender !== 'system'
              ? 'border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.12)] bg-[#0a110d]/95'
              : 'border-white/5 opacity-70 hover:opacity-90'
          }`}
        >
          {/* Active side indicator bar */}
          {activeSide === 'cat' && dialogue.sender !== 'system' && (
            <div className="absolute right-0 top-0 bottom-0 w-[4px] bg-emerald-500" />
          )}

          <div>
            {/* Header */}
            <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-3">
              <span className="font-sans text-[11px] font-bold text-emerald-400 uppercase tracking-[0.18em]">
                Кот Миднайт <span className="text-[9px] text-white/40 normal-case">(вы)</span>
              </span>
              <span className="font-serif text-[10px] text-emerald-400/80 italic">
                — {emojiInfo.label}
              </span>
            </div>

            {/* Content box */}
            <div className="flex gap-4 items-start">
              {/* Speech bubble text / Monospace reaction container */}
              <div className="flex-1 min-w-0 bg-black/40 border border-emerald-950/40 p-2.5 rounded-sm min-h-[95px] flex flex-col justify-between">
                <div ref={catScrollRef} className="max-h-[72px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-emerald-950/40">
                  <p className="font-mono text-[11px] text-emerald-400/90 leading-normal whitespace-pre-line">
                    {dialogue.sender === 'system' ? '*усиленно прислушивается*' : displayedCatText}
                    {isCatTyping && <span className="inline-block w-1.5 h-3 bg-emerald-400/80 ml-1 animate-pulse" />}
                  </p>
                </div>
                <div className="text-[8px] font-sans text-stone-500 mt-1 block italic select-none">
                  {emojiInfo.subText}
                </div>
              </div>

              {/* Large Avatar */}
              <div className={`relative w-20 h-20 md:w-24 md:h-24 shrink-0 border p-0.5 bg-black transition-all duration-300 ${
                activeSide === 'cat' && dialogue.sender !== 'system'
                  ? 'border-emerald-500/60 scale-105'
                  : 'border-white/5 opacity-50'
              }`}>
                <img 
                  src={emojiInfo.path} 
                  alt="Миднайт" 
                  referrerPolicy="no-referrer" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute -bottom-2.5 left-0 right-0 text-center z-10">
                  <span className={`text-[7px] font-mono font-bold bg-neutral-900 border px-1 py-0.5 uppercase tracking-wider block truncate ${
                    activeSide === 'cat' && dialogue.sender !== 'system' ? 'border-emerald-500/40 text-emerald-400' : 'border-white/10 text-stone-400'
                  }`}>
                    {emojiInfo.label}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Action Indicator or Finish Button */}
      <div className="flex justify-end items-center mt-1 pr-1">
        {isBartTyping || isCatTyping ? (
          <div className="font-mono text-[8px] text-white/30 tracking-[0.15em] uppercase animate-pulse">
            [ Кликни для пропуска диалога ]
          </div>
        ) : pendingVictory ? (
          <div className="font-mono text-[8.5px] text-amber-400 tracking-[0.1em] uppercase animate-pulse">
            [ Расследование раскрыто! Нажмите кнопку на панели справа ]
          </div>
        ) : (
          <div className="font-mono text-[8px] text-white/30 tracking-[0.15em] uppercase">
            [ Далее // Нажми на текст ]
          </div>
        )}
      </div>
    </div>
  );
}
