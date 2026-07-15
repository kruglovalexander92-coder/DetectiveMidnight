/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GameState, SuspectSketch } from '../types';
import * as Lucide from 'lucide-react';
import { gameAudio } from '../utils/AudioEngine';

interface SuspectInterrogationProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  initialActiveSketchId?: string;
}

export default function SuspectInterrogation({
  gameState,
  setGameState,
  initialActiveSketchId
}: SuspectInterrogationProps) {
  const sketches = gameState.sketches ?? [];
  const [activeSketchId, setActiveSketchId] = useState<string>(initialActiveSketchId || (sketches[0]?.id || 'sketch_1'));

  useEffect(() => {
    if (initialActiveSketchId) {
      setActiveSketchId(initialActiveSketchId);
    }
  }, [initialActiveSketchId]);
  const [interrogationLogs, setInterrogationLogs] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState<{ text: string; type: 'info' | 'success' | 'error' } | null>(null);

  const currentSketch = sketches.find(s => s.id === activeSketchId) || sketches[0];

  if (!currentSketch) return null;

  const playClick = () => {
    try { gameAudio.playClick(); } catch (e) {}
  };

  const handleUpdateFeature = (feature: 'Hair' | 'Eyes' | 'Mustache' | 'Skin', direction: 'next' | 'prev') => {
    playClick();
    if (currentSketch.completed) return;

    const optionsMap = {
      Hair: ['short', 'curly', 'tophat', 'bald'],
      Eyes: ['normal', 'angry', 'monocle', 'glasses'],
      Mustache: ['none', 'gentleman', 'beard', 'pirate'],
      Skin: ['fair', 'pale', 'tanned']
    };

    const options = optionsMap[feature];
    const currentValue = currentSketch[`current${feature}` as keyof SuspectSketch] as string;
    let currentIndex = options.indexOf(currentValue);
    
    if (direction === 'next') {
      currentIndex = (currentIndex + 1) % options.length;
    } else {
      currentIndex = (currentIndex - 1 + options.length) % options.length;
    }

    const newValue = options[currentIndex];

    setGameState(prev => {
      const updatedSketches = (prev.sketches ?? []).map(s => {
        if (s.id === currentSketch.id) {
          return {
            ...s,
            [`current${feature}`]: newValue
          };
        }
        return s;
      });
      return {
        ...prev,
        sketches: updatedSketches
      };
    });

    setMessage(null);
  };

  const askWitness = (questionType: 'hair' | 'eyes' | 'mustache' | 'skin') => {
    playClick();
    let reply = '';
    const name = currentSketch.witnessName;

    if (currentSketch.id === 'sketch_1') {
      if (questionType === 'hair') {
        reply = `«О, на нем был этот высокий черный фетровый цилиндр! Настоящий фокусник или гробовщик... Надвинут прямо на уши!»`;
      } else if (questionType === 'eyes') {
        reply = `«Он щурился, но я отчетливо видела благородный господский монокль на цепочке в левом глазу! Это так врезалось в память!»`;
      } else if (questionType === 'mustache') {
        reply = `«У него были очень аккуратные, тонкие усики, как у истинного джентльмена старой закалки. Никакой дикой бороды!»`;
      } else if (questionType === 'skin') {
        reply = `«Лицо... боже, он был бледным как смерть! Белый как мел, словно не видел солнечного света лет десять!»`;
      }
    } else if (currentSketch.id === 'sketch_2') {
      if (questionType === 'hair') {
        reply = `«Ха! Какая прическа, малец? Лысый как колено! Солнце отражалось от его макушки так, что слепило глаза!»`;
      } else if (questionType === 'eyes') {
        reply = `«Он носил такие круглые, старомодные очки в железной оправе. Глаза сквозь стекла казались огромными, как у совы!»`;
      } else if (questionType === 'mustache') {
        reply = `«О боже, у него была здоровенная, дремучая пиратская бородища! Черная с проседью, растрепанная ветром!»`;
      } else if (questionType === 'skin') {
        reply = `«Мужик весь обветрился и обгорел на солнце. Настоящий загар морского волка, темно-бронзовый цвет кожи!»`;
      }
    } else {
      if (questionType === 'hair') {
        reply = `«У него были пышные, кудрявые каштановые волосы, которые забавно торчали из-под дорогого котелка.»`;
      } else if (questionType === 'eyes') {
        reply = `«Никаких очков он не носил, но взгляд... уф! Глаза были сердитыми, брови насуплены, будто он ненавидел весь мир!»`;
      } else if (questionType === 'mustache') {
        reply = `«Под носом красовались лихие закрученные пиратские усы без бороды. Тонкие на концах, подкрученные помадой.»`;
      } else if (questionType === 'skin') {
        reply = `«Кожа была обычной, здоровой. Никакой мертвенной бледности или африканского загара — нормальный светлый тон кожи.»`;
      }
    }

    const currentLogs = interrogationLogs[currentSketch.id] || [];
    if (!currentLogs.includes(reply)) {
      setInterrogationLogs(prev => ({
        ...prev,
        [currentSketch.id]: [...currentLogs, reply]
      }));
    }

    setGameState(prev => {
      const currentMin = prev.currentTimeMinutes ?? 540;
      return {
        ...prev,
        currentTimeMinutes: Math.min(1080, currentMin + 15)
      };
    });
  };

  const verifySketch = () => {
    playClick();
    
    const isHairOk = currentSketch.currentHair === currentSketch.targetHair;
    const isEyesOk = currentSketch.currentEyes === currentSketch.targetEyes;
    const isMustacheOk = currentSketch.currentMustache === currentSketch.targetMustache;
    const isSkinOk = currentSketch.currentSkin === currentSketch.targetSkin;

    let matchCount = 0;
    if (isHairOk) matchCount++;
    if (isEyesOk) matchCount++;
    if (isMustacheOk) matchCount++;
    if (isSkinOk) matchCount++;

    const accuracy = Math.round((matchCount / 4) * 100);

    setGameState(prev => {
      const updatedSketches = (prev.sketches ?? []).map(s => {
        if (s.id === currentSketch.id) {
          return {
            ...s,
            accuracy,
            completed: accuracy === 100
          };
        }
        return s;
      });
      const currentMin = prev.currentTimeMinutes ?? 540;
      return {
        ...prev,
        sketches: updatedSketches,
        currentTimeMinutes: Math.min(1080, currentMin + 20)
      };
    });

    if (accuracy === 100) {
      try { gameAudio.playMeow(); } catch (e) {}
      setMessage({
        text: `Потрясающе! Свидетель воскликнул: «Да, это абсолютно ОН!» Личность преступника успешно подтверждена. Вы можете забрать награду в досье ниже!`,
        type: 'success'
      });
    } else {
      let feedback = '';
      if (!isHairOk) {
        feedback = `«Хм, на его голове определенно было надето/причесано что-то другое...»`;
      } else if (!isSkinOk) {
        feedback = `«Что-то не так с цветом его лица. Он был куда ${currentSketch.targetSkin === 'pale' ? 'бледнее' : currentSketch.targetSkin === 'tanned' ? 'загорелее' : 'обычнее'}!»`;
      } else if (!isEyesOk) {
        feedback = `«Его взгляд или аксессуары для глаз выглядели иначе. Припомните детали!»`;
      } else {
        feedback = `«Растительность на лице не совпадает. Борода или усы отличались!»`;
      }

      setMessage({
        text: `Точность фоторобота: ${accuracy}%. Свидетель хмурится: ${feedback}`,
        type: 'error'
      });
    }
  };

  const claimReward = () => {
    playClick();
    if (!currentSketch.completed || currentSketch.rewardClaimed) return;

    setGameState(prev => {
      let currentCash = prev.economy?.cash ?? 150;
      let currentRep = prev.reputation ?? 0;
      let logs = [...prev.logs];

      if (currentSketch.id === 'sketch_1') {
        currentCash += 50;
        currentRep += 10;
        logs.push({
          id: `log_sketch_reward_1_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sender: 'system',
          text: `Фоторобот «Шляпника» завершен! Получено 50$ и +10★ репутации за раскрытие сообщника!`
        });
      } else if (currentSketch.id === 'sketch_2') {
        currentCash += 70;
        currentRep += 15;
        logs.push({
          id: `log_sketch_reward_2_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sender: 'system',
          text: `Фоторобот «Якоря» завершен! Получено 70$ и +15★ репутации. Стоимость улик в делах снижена!`
        });
      } else {
        currentCash += 150;
        currentRep += 25;
        logs.push({
          id: `log_sketch_reward_3_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sender: 'system',
          text: `Фоторобот Барона Сен-Клера завершен! Выплачена госпремия 150$ и орден почета Скотленд-Ярда (+25★)!`
        });
      }

      const updatedSketches = (prev.sketches ?? []).map(s => {
        if (s.id === currentSketch.id) {
          return { ...s, rewardClaimed: true };
        }
        return s;
      });

      return {
        ...prev,
        reputation: currentRep,
        economy: {
          ...(prev.economy ?? { cash: 150, leadPrice: 40 }),
          cash: currentCash
        },
        sketches: updatedSketches,
        logs
      };
    });

    setMessage({
      text: `Награда за поимку сообщника успешно начислена на счет вашего бюро! Преступный синдикат несет тяжелые потери!`,
      type: 'success'
    });
  };

  const getSkinColorHex = (skin: string) => {
    if (skin === 'pale') return '#e2e8f0'; // grayish slate-pale
    if (skin === 'tanned') return '#bc8054'; // sea wolf tanned bronze
    return '#f3d3b7'; // healthy pale-fair
  };

  const renderVectorSketch = () => {
    const skinColor = getSkinColorHex(currentSketch.currentSkin);
    
    return (
      <svg viewBox="0 0 100 120" className="w-full h-full max-h-[220px]">
        {/* Background shadow */}
        <rect x="0" y="0" width="100" height="120" fill="#0f0d0b" />
        {/* Fine grid paper style lines */}
        <line x1="10" y1="0" x2="10" y2="120" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
        <line x1="30" y1="0" x2="30" y2="120" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
        <line x1="50" y1="0" x2="50" y2="120" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
        <line x1="70" y1="0" x2="70" y2="120" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
        <line x1="90" y1="0" x2="90" y2="120" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
        <line x1="0" y1="20" x2="100" y2="20" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
        <line x1="0" y1="40" x2="100" y2="40" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
        <line x1="0" y1="60" x2="100" y2="60" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
        <line x1="0" y1="80" x2="100" y2="80" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
        <line x1="0" y1="100" x2="100" y2="100" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />

        {/* Neck */}
        <path d="M42,75 L42,95 L58,95 L58,75 Z" fill={skinColor} stroke="#2e2722" strokeWidth="1" />
        
        {/* Collar & coat */}
        <path d="M30,95 Q50,90 70,95 L72,118 L28,118 Z" fill="#1c1917" stroke="#2e2722" strokeWidth="1" />
        <path d="M42,95 L50,108 L58,95" fill="none" stroke="#443e38" strokeWidth="1" />

        {/* Head/Face base */}
        <ellipse cx="50" cy="55" rx="20" ry="24" fill={skinColor} stroke="#2e2722" strokeWidth="1.2" />

        {/* Ears */}
        <circle cx="28" cy="55" r="4" fill={skinColor} stroke="#2e2722" strokeWidth="1" />
        <circle cx="72" cy="55" r="4" fill={skinColor} stroke="#2e2722" strokeWidth="1" />

        {/* HAIR / HEADWEAR */}
        {currentSketch.currentHair === 'short' && (
          <g id="hair_short">
            <path d="M29,45 Q50,22 71,45 Q50,38 29,45 Z" fill="#2d1f18" stroke="#170e0a" strokeWidth="1" />
            <path d="M30,44 L34,53 L38,44" fill="#2d1f18" stroke="#170e0a" strokeWidth="0.8" />
            <path d="M70,44 L66,53 L62,44" fill="#2d1f18" stroke="#170e0a" strokeWidth="0.8" />
          </g>
        )}
        {currentSketch.currentHair === 'curly' && (
          <g id="hair_curly">
            <circle cx="35" cy="36" r="6" fill="#422c21" />
            <circle cx="50" cy="30" r="8" fill="#422c21" />
            <circle cx="65" cy="36" r="6" fill="#422c21" />
            <circle cx="31" cy="45" r="5" fill="#422c21" />
            <circle cx="69" cy="45" r="5" fill="#422c21" />
            {/* Outline touchups */}
            <path d="M26,48 Q20,35 40,28 Q50,22 60,28 Q80,35 74,48" fill="none" stroke="#23150e" strokeWidth="1" />
          </g>
        )}
        {currentSketch.currentHair === 'tophat' && (
          <g id="hair_tophat">
            {/* Hat brim */}
            <ellipse cx="50" cy="34" rx="24" ry="4" fill="#171719" stroke="#000000" strokeWidth="1" />
            {/* Hat cylinder body */}
            <path d="M33,33 L35,6 L65,6 L67,33 Z" fill="#171719" stroke="#000000" strokeWidth="1.2" />
            {/* Ribbon */}
            <path d="M33.4,28 L33.7,31.5 Q50,34 66.3,31.5 L66.6,28 Z" fill="#991b1b" />
          </g>
        )}
        {currentSketch.currentHair === 'bald' && (
          <g id="hair_bald">
            {/* Shimming bald reflection curve */}
            <path d="M40,36 Q50,33 60,36" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
          </g>
        )}

        {/* EYES */}
        {currentSketch.currentEyes === 'normal' && (
          <g id="eyes_normal">
            <ellipse cx="42" cy="51" rx="2.5" ry="1.5" fill="#1e1b18" />
            <ellipse cx="58" cy="51" rx="2.5" ry="1.5" fill="#1e1b18" />
            {/* Brows */}
            <path d="M38,47 Q42,46 46,48" fill="none" stroke="#2c2520" strokeWidth="1" />
            <path d="M54,48 Q58,46 62,47" fill="none" stroke="#2c2520" strokeWidth="1" />
          </g>
        )}
        {currentSketch.currentEyes === 'angry' && (
          <g id="eyes_angry">
            <path d="M39,52 L45,49" stroke="#110c08" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M61,52 L55,49" stroke="#110c08" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="42" cy="53" r="1.5" fill="#991b1b" />
            <circle cx="58" cy="53" r="1.5" fill="#991b1b" />
          </g>
        )}
        {currentSketch.currentEyes === 'glasses' && (
          <g id="eyes_glasses">
            {/* Left rim */}
            <circle cx="42" cy="52" r="5" fill="none" stroke="#171719" strokeWidth="1.5" />
            {/* Right rim */}
            <circle cx="58" cy="52" r="5" fill="none" stroke="#171719" strokeWidth="1.5" />
            {/* Bridge */}
            <path d="M47,52 L53,52" fill="none" stroke="#171719" strokeWidth="1.5" />
            {/* Small pupils inside */}
            <circle cx="42" cy="52" r="1" fill="#111" />
            <circle cx="58" cy="52" r="1" fill="#111" />
          </g>
        )}
        {currentSketch.currentEyes === 'monocle' && (
          <g id="eyes_monocle">
            {/* Normal right eye */}
            <circle cx="58" cy="51" r="1.5" fill="#1e1b18" />
            {/* Left eye monocle */}
            <circle cx="42" cy="51" r="5.5" fill="rgba(255,255,255,0.1)" stroke="#d97706" strokeWidth="1.2" />
            {/* Cord hanging down */}
            <path d="M38,54 Q32,68 34,80" fill="none" stroke="#78350f" strokeWidth="0.8" />
            {/* Left pupil */}
            <circle cx="42" cy="51" r="1.2" fill="#111" />
          </g>
        )}

        {/* Nose */}
        <path d="M49,53 L47,62 L51,62" fill="none" stroke="#2e2722" strokeWidth="1.2" strokeLinecap="round" />

        {/* MUSTACHE / FACIAL HAIR */}
        {currentSketch.currentMustache === 'gentleman' && (
          <g id="mustache_gentleman">
            {/* Left curled wing */}
            <path d="M48,65 Q35,63 35,59" fill="none" stroke="#1a1412" strokeWidth="2" strokeLinecap="round" />
            {/* Right curled wing */}
            <path d="M52,65 Q65,63 65,59" fill="none" stroke="#1a1412" strokeWidth="2" strokeLinecap="round" />
            <ellipse cx="50" cy="64.5" rx="3" ry="1.5" fill="#1a1412" />
          </g>
        )}
        {currentSketch.currentMustache === 'beard' && (
          <g id="mustache_beard">
            {/* Heavy maritime beard overlaying bottom face */}
            <path d="M30,62 Q50,92 70,62 Q75,78 68,90 Q50,102 32,90 Q25,78 30,62 Z" fill="#2d1f18" stroke="#170e0a" strokeWidth="1" />
            {/* Mustache row */}
            <path d="M38,65 Q50,69 62,65" stroke="#170e0a" strokeWidth="2.5" fill="none" />
          </g>
        )}
        {currentSketch.currentMustache === 'pirate' && (
          <g id="mustache_pirate">
            {/* Downward drooping mustache tips */}
            <path d="M48,64 Q38,66 36,75" fill="none" stroke="#2b2d2f" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M52,64 Q62,66 64,75" fill="none" stroke="#2b2d2f" strokeWidth="2.2" strokeLinecap="round" />
            <ellipse cx="50" cy="63.5" rx="3.5" ry="1.5" fill="#2b2d2f" />
          </g>
        )}
        {currentSketch.currentMustache === 'none' && (
          <g id="mustache_none">
            {/* Mouth line */}
            <path d="M44,68 Q50,71 56,68" fill="none" stroke="#5c433b" strokeWidth="1" />
          </g>
        )}
      </svg>
    );
  };

  return (
    <div className="w-full flex flex-col gap-4 animate-fade-in text-white/90">
      
      {/* Upper Navigation of Suspects */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 shrink-0 select-none">
        {sketches.map((sketch) => {
          const isActive = sketch.id === activeSketchId;
          return (
            <button
              key={sketch.id}
              onClick={() => {
                playClick();
                setActiveSketchId(sketch.id);
                setMessage(null);
              }}
              className={`py-2 px-1.5 border text-center transition-all cursor-pointer flex flex-col justify-center items-center relative ${
                isActive
                  ? 'border-amber-500 bg-amber-950/20 text-white'
                  : 'border-white/5 bg-black/40 text-white/55 hover:border-white/10 hover:bg-black/60'
              }`}
            >
              <div className="absolute top-1 right-1">
                {sketch.completed ? (
                  <Lucide.CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 fill-black/60" />
                ) : (
                  <Lucide.HelpCircle className="w-3.5 h-3.5 text-white/25" />
                )}
              </div>
              <span className="font-serif text-[10px] font-black tracking-wide truncate max-w-full">
                {sketch.name}
              </span>
              <span className="font-mono text-[6.5px] text-white/40 uppercase mt-0.5 tracking-wider">
                Свидетель: {sketch.witnessName.split(' ')[1] || sketch.witnessName}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main split work board */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
        
        {/* LEFT COLUMN (7 cols): Interrogation & Questions */}
        <div className="md:col-span-7 border border-amber-950/40 bg-[#0d0907] p-4 flex flex-col justify-between relative shadow-xl">
          <div className="absolute inset-1 border border-white/5 pointer-events-none" />
          
          <div>
            <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-3">
              <span className="font-mono text-[7.5px] text-amber-500 font-bold uppercase tracking-widest">
                🗣️ КОМНАТА ДОПРОСА СВИДЕТЕЛЕЙ
              </span>
              <span className="font-sans text-[8px] text-white/30 uppercase">
                Дело синдиката
              </span>
            </div>

            {/* Witness profile card */}
            <div className="border border-white/5 bg-black/40 p-3 mb-4 flex gap-3 items-center">
              <div className="w-10 h-10 border border-amber-500/10 bg-amber-950/20 flex items-center justify-center shrink-0">
                <Lucide.UserCircle className="w-6 h-6 text-amber-500/80" />
              </div>
              <div>
                <span className="font-mono text-[7px] text-white/40 block leading-none">ГЛАВНЫЙ СВИДЕТЕЛЬ:</span>
                <div className="font-serif text-xs font-bold text-amber-100 mt-1">{currentSketch.witnessName}</div>
                <span className="text-[8px] text-emerald-400 uppercase font-mono">Дает показания сыщику</span>
              </div>
            </div>

            {/* Witness Statement display */}
            <div className="bg-[#120e0c] border-l-2 border-amber-500 p-3 mb-4">
              <p className="font-serif italic text-[11px] leading-relaxed text-white/80">
                {currentSketch.witnessStatement}
              </p>
            </div>

            {/* Questions list */}
            <div className="space-y-1.5">
              <span className="font-mono text-[8px] text-white/30 uppercase block mb-1">
                Задать вопросы свидетелю:
              </span>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => askWitness('hair')}
                  className="p-2 border border-white/5 bg-black/30 hover:border-amber-500/40 hover:bg-amber-950/15 text-left font-serif text-[10.5px] text-amber-100/80 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Lucide.MessageSquareQuote className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  «Опишите его прическу/головной убор»
                </button>
                <button
                  onClick={() => askWitness('eyes')}
                  className="p-2 border border-white/5 bg-black/30 hover:border-amber-500/40 hover:bg-amber-950/15 text-left font-serif text-[10.5px] text-amber-100/80 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Lucide.MessageSquareQuote className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  «Какие особые приметы на глазах?»
                </button>
                <button
                  onClick={() => askWitness('mustache')}
                  className="p-2 border border-white/5 bg-black/30 hover:border-amber-500/40 hover:bg-amber-950/15 text-left font-serif text-[10.5px] text-amber-100/80 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Lucide.MessageSquareQuote className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  «Был ли у него ус или борода?»
                </button>
                <button
                  onClick={() => askWitness('skin')}
                  className="p-2 border border-white/5 bg-black/30 hover:border-amber-500/40 hover:bg-amber-950/15 text-left font-serif text-[10.5px] text-amber-100/80 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Lucide.MessageSquareQuote className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  «Какой у него был тон кожи?»
                </button>
              </div>
            </div>
          </div>

          {/* Dialogue log results */}
          <div className="mt-4 border-t border-white/5 pt-3">
            <span className="font-mono text-[7px] text-white/30 uppercase tracking-widest block mb-1.5">
              ПРОТОКОЛ ПОКАЗАНИЙ ПОДОЗРЕВАЕМОГО:
            </span>
            <div className="bg-black/30 border border-white/5 p-2 h-20 overflow-y-auto custom-scrollbar font-serif text-[10px] space-y-1 text-white/60">
              {(interrogationLogs[currentSketch.id] || []).length === 0 ? (
                <div className="italic text-white/20 text-center pt-5">
                  Задайте вопросы свидетелю выше, чтобы зафиксировать детали в протоколе...
                </div>
              ) : (
                interrogationLogs[currentSketch.id].map((log, idx) => (
                  <div key={idx} className="border-b border-white/5 pb-1 last:border-0">
                    <span className="text-amber-500/70 font-mono text-[8px] mr-1">[{currentSketch.witnessName.split(' ')[1]}]:</span>
                    <span>{log}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN (5 cols): Canvas and Toggles */}
        <div className="md:col-span-5 border border-amber-950/40 bg-[#070708] p-4 flex flex-col justify-between relative shadow-xl">
          <div className="absolute inset-1 border border-white/5 pointer-events-none" />
          
          <div className="flex flex-col items-center">
            <div className="w-full flex justify-between items-center border-b border-white/10 pb-2 mb-3">
              <span className="font-mono text-[7.5px] text-amber-500 font-bold uppercase tracking-widest">
                📐 ЛАБОРАТОРИЯ СОСТАВЛЕНИЯ ФОТОРОБОТА
              </span>
              <span className="font-mono text-[8px] text-amber-500 font-bold">
                {currentSketch.completed ? '100% ✓' : `${currentSketch.accuracy}%`}
              </span>
            </div>

            {/* Real SVG Sketch Canvas */}
            <div className="w-40 h-40 border-2 border-white/10 relative shadow-2xl bg-black rounded-sm overflow-hidden mb-3">
              {renderVectorSketch()}
              
              {currentSketch.completed && (
                <div className="absolute inset-0 bg-emerald-950/70 flex flex-col items-center justify-center p-2 text-center backdrop-blur-[1px]">
                  <Lucide.CheckCircle2 className="w-10 h-10 text-emerald-400 mb-1" />
                  <span className="font-serif text-[10px] uppercase font-black tracking-widest bg-emerald-900 px-1.5 py-0.5 text-white">
                    СВЕРЕНО ✓
                  </span>
                </div>
              )}
            </div>

            {/* Adjusters panel */}
            <div className="w-full space-y-1.5">
              {/* Hair adjuster */}
              <div className="flex items-center justify-between border border-white/5 bg-black/40 p-1 pl-2 text-[10px]">
                <span className="font-mono text-white/50 text-[8px] uppercase">Волосы / Шляпа:</span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={currentSketch.completed}
                    onClick={() => handleUpdateFeature('Hair', 'prev')}
                    className="p-1 text-white/40 hover:text-white hover:bg-white/5 disabled:opacity-20 cursor-pointer"
                  >
                    <Lucide.ChevronLeft className="w-3 h-3" />
                  </button>
                  <span className="font-mono text-[9px] w-16 text-center font-bold text-amber-400 uppercase">
                    {currentSketch.currentHair === 'short' ? 'Стрижка' : currentSketch.currentHair === 'curly' ? 'Кудри' : currentSketch.currentHair === 'tophat' ? 'Цилиндр' : 'Лысина'}
                  </span>
                  <button
                    disabled={currentSketch.completed}
                    onClick={() => handleUpdateFeature('Hair', 'next')}
                    className="p-1 text-white/40 hover:text-white hover:bg-white/5 disabled:opacity-20 cursor-pointer"
                  >
                    <Lucide.ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Eyes adjuster */}
              <div className="flex items-center justify-between border border-white/5 bg-black/40 p-1 pl-2 text-[10px]">
                <span className="font-mono text-white/50 text-[8px] uppercase">Взгляд / Очки:</span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={currentSketch.completed}
                    onClick={() => handleUpdateFeature('Eyes', 'prev')}
                    className="p-1 text-white/40 hover:text-white hover:bg-white/5 disabled:opacity-20 cursor-pointer"
                  >
                    <Lucide.ChevronLeft className="w-3 h-3" />
                  </button>
                  <span className="font-mono text-[9px] w-16 text-center font-bold text-amber-400 uppercase">
                    {currentSketch.currentEyes === 'normal' ? 'Обычный' : currentSketch.currentEyes === 'angry' ? 'Гневный' : currentSketch.currentEyes === 'monocle' ? 'Монокль' : 'Очки'}
                  </span>
                  <button
                    disabled={currentSketch.completed}
                    onClick={() => handleUpdateFeature('Eyes', 'next')}
                    className="p-1 text-white/40 hover:text-white hover:bg-white/5 disabled:opacity-20 cursor-pointer"
                  >
                    <Lucide.ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Mustache adjuster */}
              <div className="flex items-center justify-between border border-white/5 bg-black/40 p-1 pl-2 text-[10px]">
                <span className="font-mono text-white/50 text-[8px] uppercase">Усы / Борода:</span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={currentSketch.completed}
                    onClick={() => handleUpdateFeature('Mustache', 'prev')}
                    className="p-1 text-white/40 hover:text-white hover:bg-white/5 disabled:opacity-20 cursor-pointer"
                  >
                    <Lucide.ChevronLeft className="w-3 h-3" />
                  </button>
                  <span className="font-mono text-[9px] w-16 text-center font-bold text-amber-400 uppercase">
                    {currentSketch.currentMustache === 'none' ? 'Чисто' : currentSketch.currentMustache === 'gentleman' ? 'Усы-Poirot' : currentSketch.currentMustache === 'beard' ? 'Борода' : 'Усы-Пират'}
                  </span>
                  <button
                    disabled={currentSketch.completed}
                    onClick={() => handleUpdateFeature('Mustache', 'next')}
                    className="p-1 text-white/40 hover:text-white hover:bg-white/5 disabled:opacity-20 cursor-pointer"
                  >
                    <Lucide.ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Skin adjuster */}
              <div className="flex items-center justify-between border border-white/5 bg-black/40 p-1 pl-2 text-[10px]">
                <span className="font-mono text-white/50 text-[8px] uppercase">Цвет кожи:</span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={currentSketch.completed}
                    onClick={() => handleUpdateFeature('Skin', 'prev')}
                    className="p-1 text-white/40 hover:text-white hover:bg-white/5 disabled:opacity-20 cursor-pointer"
                  >
                    <Lucide.ChevronLeft className="w-3 h-3" />
                  </button>
                  <span className="font-mono text-[9px] w-16 text-center font-bold text-amber-400 uppercase">
                    {currentSketch.currentSkin === 'fair' ? 'Светлый' : currentSketch.currentSkin === 'pale' ? 'Бледный' : 'Загорелый'}
                  </span>
                  <button
                    disabled={currentSketch.completed}
                    onClick={() => handleUpdateFeature('Skin', 'next')}
                    className="p-1 text-white/40 hover:text-white hover:bg-white/5 disabled:opacity-20 cursor-pointer"
                  >
                    <Lucide.ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-white/10 pt-3">
            {!currentSketch.completed ? (
              <button
                onClick={verifySketch}
                className="w-full h-9 bg-amber-600 hover:bg-amber-700 text-white font-sans text-[10px] font-bold uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow hover:scale-[1.01]"
              >
                <Lucide.Fingerprint className="w-4 h-4" />
                Сверить фоторобот
              </button>
            ) : (
              <div className="border border-dashed border-emerald-500/20 bg-emerald-950/10 p-2 text-center text-emerald-300 font-serif text-[10.5px]">
                «Личность идентифицирована Скотленд-Ярдом»
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Message and rewards panel */}
      {message && (
        <div className={`p-3 border text-xs leading-relaxed font-serif relative ${
          message.type === 'success'
            ? 'border-emerald-500/20 bg-emerald-950/15 text-emerald-200'
            : message.type === 'error'
              ? 'border-red-500/20 bg-red-950/15 text-red-200'
              : 'border-blue-500/20 bg-blue-950/15 text-blue-200'
        }`}>
          <div className="absolute top-1 left-1">
            {message.type === 'success' ? (
              <Lucide.Sparkles className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />
            ) : (
              <Lucide.AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
            )}
          </div>
          <p className="pl-6 italic">
            {message.text}
          </p>
        </div>
      )}

      {/* Dossier profile & Unlocked benefits */}
      <div className="border border-white/10 bg-[#090807] p-4 flex flex-col md:flex-row justify-between items-stretch gap-4 select-none">
        <div className="flex-1">
          <span className="font-mono text-[7px] text-white/30 uppercase tracking-[0.25em] block mb-1">
            РАССЛЕДОВАНИЕ СГОВОРЩИКОВ СИНДИКАТА
          </span>
          <h4 className="font-serif text-sm font-black text-amber-100 flex items-center gap-1.5 uppercase">
            <Lucide.FolderClosed className="w-4 h-4 text-amber-500" />
            {currentSketch.completed ? currentSketch.name : 'ФИГУРАНТ НЕ ИДЕНТИФИЦИРОВАН'}
          </h4>
          <p className="font-serif italic text-[11px] leading-relaxed text-stone-400 mt-1 max-w-2xl">
            {currentSketch.completed 
              ? `«Данный преступник был успешно опознан по зарисовке. Под прессингом доказательств он дал показания детективу Барту, снижая оперативные издержки!»` 
              : `«Сопоставьте показания свидетелей с визуальной картой, чтобы заставить преступника сдаться властям и получить щедрые преференции для расследований!»`
            }
          </p>
        </div>

        <div className="w-full md:w-64 border-l border-white/5 pl-0 md:pl-4 flex flex-col justify-between">
          <div>
            <span className="font-mono text-[7px] text-white/30 uppercase block mb-1">ГРАНТ И ПРЕФЕРЕНЦИЯ:</span>
            <div className="font-sans text-[10px] text-amber-400/90 leading-tight font-bold">
              • {currentSketch.unlockedHint}
            </div>
          </div>

          <div className="mt-3">
            {currentSketch.completed ? (
              <button
                disabled={currentSketch.rewardClaimed}
                onClick={claimReward}
                className={`w-full h-8 font-sans text-[9px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  currentSketch.rewardClaimed
                    ? 'border border-white/5 bg-black/40 text-white/20 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow'
                }`}
              >
                <Lucide.Gift className="w-3.5 h-3.5" />
                {currentSketch.rewardClaimed ? 'Награда получена' : 'Получить награду'}
              </button>
            ) : (
              <div className="w-full h-8 border border-white/5 bg-black/40 text-white/25 text-[8.5px] uppercase font-mono tracking-widest flex items-center justify-center gap-1">
                <Lucide.Lock className="w-3 h-3" /> Требуется 100% точности
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
