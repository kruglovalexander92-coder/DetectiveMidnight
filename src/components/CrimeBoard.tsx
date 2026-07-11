/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GameState, Job } from '../types';
import * as Lucide from 'lucide-react';
import { gameAudio } from '../utils/AudioEngine';

interface CrimeBoardProps {
  gameState: GameState;
  onSelectJob: (job: Job) => void;
  STORY_CHAPTERS_DATA: Job[];
}

export default function CrimeBoard({
  gameState,
  onSelectJob,
  STORY_CHAPTERS_DATA
}: CrimeBoardProps) {
  const [selectedNode, setSelectedNode] = useState<{
    type: 'chapter' | 'suspect' | 'relic' | 'note';
    id: string;
    title: string;
    desc: string;
    job?: Job;
    relicName?: string;
  } | null>(null);

  const completedChapters = gameState.storyState?.completedChapters ?? [];
  const reputation = gameState.reputation ?? 0;
  const cash = gameState.economy?.cash ?? 150;

  // Sound handler
  const playClickSound = () => {
    try {
      gameAudio.playClick();
    } catch (e) {}
  };

  // Helper to romanize chapter numbers
  const romanize = (num: number): string => {
    const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
    return roman[num - 1] || num.toString();
  };

  // Setup clues/relics details
  const RELICS_DATA = [
    {
      id: 'relic_1',
      name: 'Брошь «Крылья Бабочки»',
      chapterNum: 1,
      iconName: 'Sparkles', // Represents the moth-like glittering brooch
      desc: '«Изящный серебряный кулон в виде мотылька, инкрустированный мелкими сапфирами. Барт обнаружил его под тяжелым бархатным ковром в кабинете лорда Кэррингтона. Когти зацепили его чисто случайно!»',
      imageDesc: 'Брошь сверкает холодным синим блеском...'
    },
    {
      id: 'relic_2',
      name: 'Скарб «Сердце Бездны»',
      chapterNum: 2,
      iconName: 'Heart', // Represents the mysterious heart container/amulet
      desc: '«Тяжелый золотой амулет в форме сердца, украшенный рубином. Был найден в потайном отсеке сейфа на Складе №9. На его оборотной стороне выгравированы инициалы: "А. К."»',
      imageDesc: 'Амулет бьется словно живое сердце...'
    },
    {
      id: 'relic_3',
      name: 'Инструмент «Часовые шестерни»',
      chapterNum: 3,
      iconName: 'Wrench', // Represents the intricate pocket watch/wrench tools
      desc: '«Разбитые карманные часы из латуни с застрявшим на шестеренках тонким металлическим волоском. Механизм остановился ровно в полночь. Оставлены преступником во время спешного бегства с дирижабля.»',
      imageDesc: 'Шестеренки заклинило на отметке 12:00...'
    }
  ];

  // Helper to get status of a chapter
  const getChapterStatus = (index: number, chapter: Job) => {
    const chNum = index + 1;
    const isCompleted = completedChapters.includes(chNum) || chapter.completed;
    
    let isLocked = false;
    let lockReason = '';

    if (index > 0) {
      const prevChCompleted = completedChapters.includes(chNum - 1) || (STORY_CHAPTERS_DATA[index - 1]?.completed);
      if (!prevChCompleted) {
        isLocked = true;
        lockReason = `Раскройте Главу ${romanize(chNum - 1)}`;
      } else if (reputation < chapter.reputationRequired) {
        isLocked = true;
        lockReason = `Репутация ${chapter.reputationRequired}★`;
      }
    }

    return { isCompleted, isLocked, lockReason };
  };

  // Determine central suspect info based on progress
  const getSuspectInfo = () => {
    const totalCompleted = completedChapters.length;
    if (totalCompleted === 0) {
      return {
        name: 'Теневой Барон (???)',
        status: 'ЛИЧНОСТЬ НЕ УСТАНОВЛЕНА',
        desc: '«Неуловимый призрак, управляющий криминальной цепочкой Лондона. Все ниточки сходятся к нему, но у Барта пока слишком мало зацепок, чтобы сорвать маску.»',
        isRevealed: false,
        isArrested: false
      };
    } else if (totalCompleted === 1 || totalCompleted === 2) {
      return {
        name: 'Барон Альфред фон Кроу',
        status: 'ГЛАВНЫЙ ПОДОЗРЕВАЕМЫЙ',
        desc: '«Влиятельный аристократ и меценат. Барт нашел следы его тайных визитов в резиденцию лорда и зашифрованные ордера на складские грузы. Вся полиция на ушах!»',
        isRevealed: true,
        isArrested: false
      };
    } else {
      return {
        name: 'Граф Альфред фон Кроу',
        status: 'АРЕСТОВАН И ОБЕЗВРЕЖЕН',
        desc: '«Синдикат «Рубиновый Коготь» разбит! Барт лично настиг Кроу в небесном лаундже дирижабля и передал Скотленд-Ярду. Дело закрыто с абсолютным успехом!»',
        isRevealed: true,
        isArrested: true
      };
    }
  };

  const suspect = getSuspectInfo();

  const sketches = gameState.sketches ?? [];
  const sketch1 = sketches.find(s => s.id === 'sketch_1');
  const sketch2 = sketches.find(s => s.id === 'sketch_2');
  const sketch3 = sketches.find(s => s.id === 'sketch_3');

  return (
    <div className="flex-1 w-full flex flex-col relative select-none">
      
      {/* CORKBOARD VIEW CONTAINER */}
      <div className="relative w-full h-[440px] border-[10px] border-[#2c1d11] bg-[#1a110a] shadow-inner overflow-hidden flex flex-col justify-between">
        {/* Cork pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#100a06_1.5px,transparent_1.5px)] [background-size:12px_12px] opacity-40 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#2a1b10]/20 via-transparent to-black/60 pointer-events-none" />

        {/* Board Title Banner */}
        <div className="absolute top-3 left-4 right-4 flex justify-between items-center border-b border-white/5 pb-2 z-10 pointer-events-none select-none">
          <div className="flex items-center gap-1.5">
            <Lucide.Compass className="w-4 h-4 text-amber-500 animate-spin" style={{ animationDuration: '10s' }} />
            <h3 className="font-serif text-xs font-bold tracking-wide text-amber-200 uppercase">
              Следственная доска бюро
            </h3>
          </div>
          <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-red-500/70 font-bold animate-pulse">
            • ДЕЛО «РУБИНОВЫЙ КОГОТЬ»
          </span>
        </div>

        {/* SVG INTERACTIVE RED THREADS */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <defs>
            <filter id="threadShadow" x="-10%" y="-10%" width="130%" height="130%">
              <feDropShadow dx="1" dy="3" stdDeviation="2" floodColor="#000000" floodOpacity="0.95" />
            </filter>
          </defs>

          {/* Chapters Sequential Threads */}
          {/* Chapter I (18%, 28%) -> Chapter II (50%, 23%) */}
          <line 
            x1="18%" y1="28%" 
            x2="50%" y2="23%" 
            stroke="#991b1b" strokeWidth="4" strokeDasharray={completedChapters.includes(1) ? "none" : "4 4"}
            filter="url(#threadShadow)"
            className="transition-all duration-500"
          />
          {/* Chapter II (50%, 23%) -> Chapter III (82%, 28%) */}
          <line 
            x1="50%" y1="23%" 
            x2="82%" y2="28%" 
            stroke="#991b1b" strokeWidth="4" strokeDasharray={completedChapters.includes(2) ? "none" : "4 4"}
            filter="url(#threadShadow)"
            className="transition-all duration-500"
          />

          {/* Chapters Connection to central suspect (50%, 55%) */}
          {/* Chapter I -> Suspect */}
          <line 
            x1="18%" y1="28%" 
            x2="50%" y2="55%" 
            stroke="#b91c1c" strokeWidth="3" opacity={completedChapters.includes(1) ? "0.95" : "0.25"}
            filter="url(#threadShadow)"
            className="transition-all duration-500"
          />
          {/* Chapter II -> Suspect */}
          <line 
            x1="50%" y1="23%" 
            x2="50%" y2="55%" 
            stroke="#b91c1c" strokeWidth="3" opacity={completedChapters.includes(2) ? "0.95" : "0.25"}
            filter="url(#threadShadow)"
            className="transition-all duration-500"
          />
          {/* Chapter III -> Suspect */}
          <line 
            x1="82%" y1="28%" 
            x2="50%" y2="55%" 
            stroke="#b91c1c" strokeWidth="3" opacity={completedChapters.includes(3) ? "0.95" : "0.25"}
            filter="url(#threadShadow)"
            className="transition-all duration-500"
          />

          {/* Newspaper Decors connection to Chapter I */}
          <line 
            x1="14%" y1="65%" 
            x2="18%" y2="28%" 
            stroke="#7f1d1d" strokeWidth="2.5" opacity="0.6"
            filter="url(#threadShadow)"
          />

          {/* Dock map connection to Chapter II */}
          <line 
            x1="80%" y1="65%" 
            x2="50%" y2="23%" 
            stroke="#7f1d1d" strokeWidth="2.5" opacity="0.6"
            filter="url(#threadShadow)"
          />

          {/* Sketch 1 (Wilhelm) Thread if completed */}
          {sketch1?.completed && (
            <line 
              x1="18%" y1="28%" 
              x2="15%" y2="72%" 
              stroke="#b91c1c" strokeWidth="3"
              filter="url(#threadShadow)"
              className="transition-all duration-500"
            />
          )}

          {/* Sketch 2 (Anchor) Thread if completed */}
          {sketch2?.completed && (
            <line 
              x1="50%" y1="23%" 
              x2="48%" y2="72%" 
              stroke="#b91c1c" strokeWidth="3"
              filter="url(#threadShadow)"
              className="transition-all duration-500"
            />
          )}

          {/* Sketch 3 (Saint-Clair) Thread if completed */}
          {sketch3?.completed && (
            <line 
              x1="82%" y1="28%" 
              x2="78%" y2="72%" 
              stroke="#b91c1c" strokeWidth="3"
              filter="url(#threadShadow)"
              className="transition-all duration-500"
            />
          )}
        </svg>

        {/* INTERACTIVE CORKBOARD ELEMENTS */}
        <div className="absolute inset-0 pt-10 pb-20 px-4 relative z-10 overflow-hidden pointer-events-none">
          
          {/* POLAROID NODE 1: CHAPTER I */}
          {STORY_CHAPTERS_DATA[0] && (() => {
            const chapter = STORY_CHAPTERS_DATA[0];
            const { isCompleted, isLocked, lockReason } = getChapterStatus(0, chapter);
            return (
              <div 
                style={{ left: '10%', top: '15%' }}
                onClick={() => {
                  playClickSound();
                  setSelectedNode({
                    type: 'chapter',
                    id: chapter.id,
                    title: `Глава I: ${chapter.title}`,
                    desc: chapter.description,
                    job: chapter
                  });
                }}
                className={`absolute w-[115px] bg-[#fcf9f2] p-2 pb-3.5 shadow-2xl border border-stone-200/50 cursor-pointer pointer-events-auto hover:scale-105 active:scale-98 hover:-rotate-1 transition-all -rotate-3 select-none flex flex-col justify-between ${
                  isCompleted ? 'opacity-90' : isLocked ? 'brightness-50' : ''
                }`}
              >
                {/* Red Pin decor */}
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-red-600 border border-stone-900 shadow-lg" />
                
                {/* Photo aspect box */}
                <div className="aspect-[4/3] w-full bg-[#1c1815] flex flex-col items-center justify-center border border-stone-300 relative text-white">
                  {isCompleted ? (
                    <div className="absolute inset-0 bg-emerald-950/20 flex items-center justify-center">
                      <span className="font-serif font-black text-emerald-500 text-[11px] tracking-wider border-2 border-emerald-500 p-0.5 uppercase -rotate-12 select-none animate-pulse">
                        РАСКРЫТО ✓
                      </span>
                    </div>
                  ) : isLocked ? (
                    <Lucide.Lock className="w-5 h-5 text-stone-500" />
                  ) : (
                    <Lucide.Compass className="w-6 h-6 text-amber-500 animate-pulse" />
                  )}
                  <span className="font-mono text-[7px] text-stone-400 absolute bottom-1 right-1">Study_92</span>
                </div>

                <div className="mt-2 text-center">
                  <span className="font-serif text-[8.5px] font-bold text-stone-950 block leading-tight">
                    Глава I
                  </span>
                  <p className="font-serif italic text-[7px] text-stone-500 leading-tight line-clamp-1 mt-0.5">
                    {chapter.title}
                  </p>
                </div>
              </div>
            );
          })()}

          {/* POLAROID NODE 2: CHAPTER II */}
          {STORY_CHAPTERS_DATA[1] && (() => {
            const chapter = STORY_CHAPTERS_DATA[1];
            const { isCompleted, isLocked, lockReason } = getChapterStatus(1, chapter);
            return (
              <div 
                style={{ left: '42%', top: '7%' }}
                onClick={() => {
                  playClickSound();
                  setSelectedNode({
                    type: 'chapter',
                    id: chapter.id,
                    title: `Глава II: ${chapter.title}`,
                    desc: chapter.description,
                    job: chapter
                  });
                }}
                className={`absolute w-[115px] bg-[#fcf9f2] p-2 pb-3.5 shadow-2xl border border-stone-200/50 cursor-pointer pointer-events-auto hover:scale-105 active:scale-98 hover:rotate-1 transition-all rotate-2 select-none flex flex-col justify-between ${
                  isCompleted ? 'opacity-90' : isLocked ? 'brightness-50' : ''
                }`}
              >
                {/* Red Pin decor */}
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-red-600 border border-stone-900 shadow-lg" />
                
                {/* Photo aspect box */}
                <div className="aspect-[4/3] w-full bg-[#15171c] flex flex-col items-center justify-center border border-stone-300 relative text-white">
                  {isCompleted ? (
                    <div className="absolute inset-0 bg-emerald-950/20 flex items-center justify-center">
                      <span className="font-serif font-black text-emerald-500 text-[11px] tracking-wider border-2 border-emerald-500 p-0.5 uppercase -rotate-12 select-none">
                        РАСКРЫТО ✓
                      </span>
                    </div>
                  ) : isLocked ? (
                    <div className="flex flex-col items-center gap-0.5">
                      <Lucide.Lock className="w-4 h-4 text-stone-500" />
                      <span className="text-[6px] font-mono uppercase text-red-400 font-bold">{chapter.reputationRequired}★</span>
                    </div>
                  ) : (
                    <Lucide.Anchor className="w-6 h-6 text-sky-400 animate-pulse" />
                  )}
                  <span className="font-mono text-[7px] text-stone-400 absolute bottom-1 right-1">Dock_09</span>
                </div>

                <div className="mt-2 text-center">
                  <span className="font-serif text-[8.5px] font-bold text-stone-950 block leading-tight">
                    Глава II
                  </span>
                  <p className="font-serif italic text-[7px] text-stone-500 leading-tight line-clamp-1 mt-0.5">
                    {chapter.title}
                  </p>
                </div>
              </div>
            );
          })()}

          {/* POLAROID NODE 3: CHAPTER III */}
          {STORY_CHAPTERS_DATA[2] && (() => {
            const chapter = STORY_CHAPTERS_DATA[2];
            const { isCompleted, isLocked, lockReason } = getChapterStatus(2, chapter);
            return (
              <div 
                style={{ right: '10%', top: '15%' }}
                onClick={() => {
                  playClickSound();
                  setSelectedNode({
                    type: 'chapter',
                    id: chapter.id,
                    title: `Глава III: ${chapter.title}`,
                    desc: chapter.description,
                    job: chapter
                  });
                }}
                className={`absolute w-[115px] bg-[#fcf9f2] p-2 pb-3.5 shadow-2xl border border-stone-200/50 cursor-pointer pointer-events-auto hover:scale-105 active:scale-98 hover:-rotate-1 transition-all -rotate-3 select-none flex flex-col justify-between ${
                  isCompleted ? 'opacity-90' : isLocked ? 'brightness-50' : ''
                }`}
              >
                {/* Red Pin decor */}
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-red-600 border border-stone-900 shadow-lg" />
                
                {/* Photo aspect box */}
                <div className="aspect-[4/3] w-full bg-[#1c151c] flex flex-col items-center justify-center border border-stone-300 relative text-white">
                  {isCompleted ? (
                    <div className="absolute inset-0 bg-emerald-950/20 flex items-center justify-center">
                      <span className="font-serif font-black text-emerald-500 text-[11px] tracking-wider border-2 border-emerald-500 p-0.5 uppercase -rotate-12 select-none animate-bounce">
                        РАСКРЫТО ✓
                      </span>
                    </div>
                  ) : isLocked ? (
                    <div className="flex flex-col items-center gap-0.5">
                      <Lucide.Lock className="w-4 h-4 text-stone-500" />
                      <span className="text-[6px] font-mono uppercase text-red-400 font-bold">{chapter.reputationRequired}★</span>
                    </div>
                  ) : (
                    <Lucide.Wind className="w-6 h-6 text-purple-400 animate-pulse" />
                  )}
                  <span className="font-mono text-[7px] text-stone-400 absolute bottom-1 right-1">Airship_X</span>
                </div>

                <div className="mt-2 text-center">
                  <span className="font-serif text-[8.5px] font-bold text-stone-950 block leading-tight">
                    Глава III
                  </span>
                  <p className="font-serif italic text-[7px] text-stone-500 leading-tight line-clamp-1 mt-0.5">
                    {chapter.title}
                  </p>
                </div>
              </div>
            );
          })()}

          {/* POLAROID NODE 4: CENTRAL SUSPECT (VILLAIN) */}
          <div 
            style={{ left: '41%', top: '39%' }}
            onClick={() => {
              playClickSound();
              setSelectedNode({
                type: 'suspect',
                id: 'suspect_baron',
                title: suspect.name,
                desc: suspect.desc
              });
            }}
            className={`absolute w-[125px] bg-[#efe9dc] p-2 pb-3.5 shadow-2xl border border-amber-900/30 cursor-pointer pointer-events-auto hover:scale-105 active:scale-98 hover:rotate-1 transition-all select-none flex flex-col justify-between ${
              suspect.isArrested ? 'border-emerald-800' : 'border-amber-900/40'
            }`}
          >
            {/* Emerald/Red Pin decor */}
            <div className={`absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border border-stone-900 shadow-lg ${
              suspect.isArrested ? 'bg-emerald-600' : suspect.isRevealed ? 'bg-amber-600' : 'bg-red-800'
            }`} />
            
            {/* Suspect Photo */}
            <div className="aspect-square w-full bg-[#110e0c] flex flex-col items-center justify-center border border-stone-400 relative text-white overflow-hidden">
              {suspect.isArrested ? (
                <>
                  <Lucide.ShieldAlert className="w-10 h-10 text-emerald-500 opacity-20 absolute" />
                  <span className="font-serif font-black text-red-600 text-center text-[10px] tracking-widest border-4 border-red-600 px-1 py-0.5 uppercase rotate-[15deg] select-none font-bold bg-[#110e0c]/80 z-10 animate-pulse">
                    АРЕСТОВАН
                  </span>
                  {/* Silhouette shadow representation */}
                  <div className="w-full h-full bg-[radial-gradient(circle_at_center,transparent_30%,#110e0c_80%)] flex items-center justify-center">
                    <Lucide.User className="w-12 h-12 text-stone-600" />
                  </div>
                </>
              ) : suspect.isRevealed ? (
                <div className="w-full h-full bg-[radial-gradient(circle_at_center,transparent_20%,#110e0c_70%)] flex flex-col items-center justify-center p-2">
                  <Lucide.ShieldCheck className="w-8 h-8 text-amber-500 animate-pulse mb-1" />
                  <span className="text-[7px] font-mono text-center text-amber-400 leading-none">ГРАФ ФОН КРОУ</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-2">
                  <Lucide.UserX className="w-9 h-9 text-stone-700 animate-pulse" />
                  <span className="font-serif text-[14px] text-stone-600 font-bold select-none animate-pulse">?</span>
                </div>
              )}
              <span className="font-mono text-[6px] font-bold text-stone-500 absolute bottom-1 left-2">TARGET_ID: KROW_A</span>
            </div>

            <div className="mt-2 text-center">
              <span className="font-mono text-[7px] text-red-500 font-bold block uppercase tracking-wider">
                {suspect.status}
              </span>
              <span className="font-serif text-[8.5px] font-black text-stone-900 block leading-tight mt-0.5">
                {suspect.name}
              </span>
            </div>
          </div>

          {/* DECORATIVE ELEMENT 1: LONDON DAILY NEWSPAPER CLIPPING */}
          <div 
            style={{ left: '4%', top: '60%' }}
            onClick={() => {
              playClickSound();
              setSelectedNode({
                type: 'note',
                id: 'news_clipping',
                title: '«Вестник Лондона»',
                desc: '«Дерзкое похищение века! Синий Сапфир лорда Кэррингтона пропал бесследно. Подозрения падают на кошачий синдикат. Старый лорд предлагает 200$ за поимку вора и возвращение камня в резиденцию. Расследование поручено частному детективному агентству Барта!»'
              });
            }}
            className="absolute w-[125px] bg-[#eae5d8] border border-stone-300 p-2 text-stone-800 shadow-xl cursor-pointer pointer-events-auto hover:scale-105 active:scale-98 transition-all rotate-3 flex flex-col gap-1"
          >
            <div className="absolute -top-1 left-4 w-2 h-2 rounded-full bg-stone-500/80 shadow" />
            <span className="font-serif text-[7.5px] text-stone-900 font-black border-b border-stone-400 pb-0.5 uppercase tracking-wide leading-none block">
              Вестник Лондона
            </span>
            <span className="font-mono text-[5.5px] text-stone-500 block leading-none">9 ИЮЛЯ 1896 ГОДА</span>
            <p className="font-serif italic text-[7.5px] leading-snug text-stone-700 line-clamp-3">
              «...сокровища Ее Величества под угрозой! Тайный орден «Рубиновый Коготь» угрожает спокойствию граждан. Ведется следствие...»
            </p>
          </div>

          {/* DECORATIVE ELEMENT 2: PORT LOGISTICS MAP SECTION */}
          <div 
            style={{ right: '4%', top: '56%' }}
            onClick={() => {
              playClickSound();
              setSelectedNode({
                type: 'note',
                id: 'dock_map',
                title: 'Карта устья Темзы: Склад №9',
                desc: '«Пыльный фрагмент навигационной карты лондонских доков. Подозрительные контейнеры синдиката были выгружены на Пирсе «Б» и перевезены на Склад №9. На карте от руки нарисован красный крест на перекрестке складского района.»'
              });
            }}
            className="absolute w-[120px] bg-[#dcd2bb] border border-amber-950/20 p-2.5 text-stone-800 shadow-xl cursor-pointer pointer-events-auto hover:scale-105 active:scale-98 transition-all -rotate-3 flex flex-col gap-1.5"
          >
            <div className="absolute -top-1 right-5 w-2 h-2 rounded-full bg-[#1d4ed8] shadow" />
            <div className="w-full h-11 bg-[#beaf91] border border-stone-400/40 relative flex items-center justify-center overflow-hidden">
              {/* Absctract map lines simulation */}
              <div className="absolute inset-0 border border-dashed border-red-500/30 m-1.5 flex items-center justify-center">
                <span className="text-red-600 font-black text-sm select-none">❌</span>
              </div>
              <span className="font-mono text-[5.5px] text-stone-600 absolute top-1 left-1 font-bold">GRID_09</span>
            </div>
            <span className="font-serif text-[7.5px] font-bold text-center text-stone-900 block leading-tight">
              Карта Порта (Склад №9)
            </span>
          </div>

          {/* DECORATIVE ELEMENT 3: STICKY REMARK NOTE */}
          <div 
            style={{ left: '26%', top: '44%' }}
            onClick={() => {
              playClickSound();
              setSelectedNode({
                type: 'note',
                id: 'note_alibi',
                title: 'Заметка о бароне Кроу',
                desc: '«Алиби барона фон Кроу трещит по швам. Он утверждает, что провел вечер похищения в Опере. Однако Миднайт уверяет: в углу взломанного кабинета лорда отчетливо пахло его излюбленным табаком "Английская Смесь #4". Этот аристократ точно замешан!»'
              });
            }}
            className="absolute w-[80px] bg-amber-200/90 border border-amber-300 p-1.5 text-amber-950 shadow-md cursor-pointer pointer-events-auto hover:scale-105 active:scale-98 transition-all -rotate-6"
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-red-600/80 shadow" />
            <span className="font-sans text-[6px] uppercase tracking-widest text-amber-900 font-black block border-b border-amber-800/10 pb-0.5 mb-1 text-center">
              ЗАМЕТКА К БАТУ
            </span>
            <p className="font-serif italic text-[7.5px] leading-tight text-amber-900">
              «Проверить: Оперное алиби ложное. Опросить лодочников у дока №9...»
            </p>
          </div>

          {/* COMPLETED SKETCHES POLAROIDS ON THE BOARD */}
          {sketch1?.completed && (
            <div 
              style={{ left: '10%', top: '60%', zIndex: 30 }}
              onClick={() => {
                playClickSound();
                setSelectedNode({
                  type: 'suspect',
                  id: 'sketch_1_revealed',
                  title: sketch1.name,
                  desc: `«Опознанный сообщник синдиката. Миссис Виггинс помогла составить этот точный фоторобот. Благодаря вашей работе его влияние нейтрализовано, а банда Шляпника разгромлена!»`
                });
              }}
              className="absolute w-[95px] bg-[#fcf9f2] p-1.5 pb-2.5 shadow-2xl border border-stone-200/50 cursor-pointer pointer-events-auto hover:scale-105 active:scale-98 hover:rotate-1 transition-all rotate-2 select-none flex flex-col justify-between"
            >
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-red-600 border border-stone-900 shadow-md" />
              <div className="aspect-square w-full bg-[#110e0c] flex items-center justify-center border border-stone-300 relative text-white overflow-hidden">
                <svg viewBox="0 0 100 120" className="w-full h-full">
                  <rect x="0" y="0" width="100" height="120" fill="#0f0d0b" />
                  <ellipse cx="50" cy="55" rx="20" ry="24" fill={sketch1.currentSkin === 'pale' ? '#e2e8f0' : sketch1.currentSkin === 'tanned' ? '#bc8054' : '#f3d3b7'} stroke="#2e2722" strokeWidth="2.5" />
                  <ellipse cx="50" cy="34" rx="24" ry="4" fill="#171719" />
                  <path d="M33,33 L35,6 L65,6 L67,33 Z" fill="#171719" />
                  <path d="M33.4,28 L33.7,31.5 Q50,34 66.3,31.5 L66.6,28 Z" fill="#991b1b" />
                  <circle cx="58" cy="51" r="1.5" fill="#1e1b18" />
                  <circle cx="42" cy="51" r="5.5" fill="none" stroke="#d97706" strokeWidth="2" />
                  <path d="M48,65 Q35,63 35,59" fill="none" stroke="#1a1412" strokeWidth="3" />
                  <path d="M52,65 Q65,63 65,59" fill="none" stroke="#1a1412" strokeWidth="3" />
                </svg>
                <div className="absolute top-0.5 right-1 font-mono text-[5px] text-emerald-400 font-bold uppercase tracking-wider bg-black/60 px-0.5">ОПОЗНАН</div>
              </div>
              <div className="mt-1 text-center leading-none">
                <span className="font-serif text-[7.5px] font-bold text-stone-950 block truncate">
                  В. Артурович
                </span>
                <span className="font-mono text-[5.5px] text-stone-500 uppercase block mt-0.5">
                  «Шляпник»
                </span>
              </div>
            </div>
          )}

          {sketch2?.completed && (
            <div 
              style={{ left: '44%', top: '68%', zIndex: 30 }}
              onClick={() => {
                playClickSound();
                setSelectedNode({
                  type: 'suspect',
                  id: 'sketch_2_revealed',
                  title: sketch2.name,
                  desc: `«Опознанный сообщник у причала — Морской Волк «Якорь». Помог получить наводки на тайные грузы, снизив стоимость поиска улик во всем городе!»`
                });
              }}
              className="absolute w-[95px] bg-[#fcf9f2] p-1.5 pb-2.5 shadow-2xl border border-stone-200/50 cursor-pointer pointer-events-auto hover:scale-105 active:scale-98 hover:-rotate-1 transition-all -rotate-3 select-none flex flex-col justify-between"
            >
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-red-600 border border-stone-900 shadow-md" />
              <div className="aspect-square w-full bg-[#110e0c] flex items-center justify-center border border-stone-300 relative text-white overflow-hidden">
                <svg viewBox="0 0 100 120" className="w-full h-full">
                  <rect x="0" y="0" width="100" height="120" fill="#0f0d0b" />
                  <ellipse cx="50" cy="55" rx="20" ry="24" fill={sketch2.currentSkin === 'pale' ? '#e2e8f0' : sketch2.currentSkin === 'tanned' ? '#bc8054' : '#f3d3b7'} stroke="#2e2722" strokeWidth="2.5" />
                  <circle cx="42" cy="52" r="5" fill="none" stroke="#171719" strokeWidth="2" />
                  <circle cx="58" cy="52" r="5" fill="none" stroke="#171719" strokeWidth="2" />
                  <path d="M47,52 L53,52" fill="none" stroke="#171719" strokeWidth="2" />
                  <path d="M30,62 Q50,92 70,62 Q75,78 68,90 Q50,102 32,90 Q25,78 30,62 Z" fill="#2d1f18" stroke="#170e0a" strokeWidth="1" />
                </svg>
                <div className="absolute top-0.5 right-1 font-mono text-[5px] text-emerald-400 font-bold uppercase tracking-wider bg-black/60 px-0.5">ОПОЗНАН</div>
              </div>
              <div className="mt-1 text-center leading-none">
                <span className="font-serif text-[7.5px] font-bold text-stone-950 block truncate">
                  Морской Волк
                </span>
                <span className="font-mono text-[5.5px] text-stone-500 uppercase block mt-0.5">
                  «Якорь»
                </span>
              </div>
            </div>
          )}

          {sketch3?.completed && (
            <div 
              style={{ right: '10%', top: '60%', zIndex: 30 }}
              onClick={() => {
                playClickSound();
                setSelectedNode({
                  type: 'suspect',
                  id: 'sketch_3_revealed',
                  title: sketch3.name,
                  desc: `«Опознанный организатор саботажа — Барон Сен-Клер. Полностью раскрыт перед взлетом дирижабля! Скотленд-Ярд выплатил огромную госпремию за предотвращение крушения!»`
                });
              }}
              className="absolute w-[95px] bg-[#fcf9f2] p-1.5 pb-2.5 shadow-2xl border border-stone-200/50 cursor-pointer pointer-events-auto hover:scale-105 active:scale-98 hover:rotate-1 transition-all rotate-2 select-none flex flex-col justify-between"
            >
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-red-600 border border-stone-900 shadow-md" />
              <div className="aspect-square w-full bg-[#110e0c] flex items-center justify-center border border-stone-300 relative text-white overflow-hidden">
                <svg viewBox="0 0 100 120" className="w-full h-full">
                  <rect x="0" y="0" width="100" height="120" fill="#0f0d0b" />
                  <ellipse cx="50" cy="55" rx="20" ry="24" fill={sketch3.currentSkin === 'pale' ? '#e2e8f0' : sketch3.currentSkin === 'tanned' ? '#bc8054' : '#f3d3b7'} stroke="#2e2722" strokeWidth="2.5" />
                  <circle cx="35" cy="36" r="6" fill="#422c21" />
                  <circle cx="50" cy="30" r="8" fill="#422c21" />
                  <circle cx="65" cy="36" r="6" fill="#422c21" />
                  <circle cx="31" cy="45" r="5" fill="#422c21" />
                  <circle cx="69" cy="45" r="5" fill="#422c21" />
                  <path d="M39,52 L45,49" stroke="#110c08" strokeWidth="2.5" />
                  <path d="M61,52 L55,49" stroke="#110c08" strokeWidth="2.5" />
                  <path d="M48,64 Q38,66 36,75" fill="none" stroke="#2b2d2f" strokeWidth="2.5" />
                  <path d="M52,64 Q62,66 64,75" fill="none" stroke="#2b2d2f" strokeWidth="2.5" />
                </svg>
                <div className="absolute top-0.5 right-1 font-mono text-[5px] text-emerald-400 font-bold uppercase tracking-wider bg-black/60 px-0.5">ОПОЗНАН</div>
              </div>
              <div className="mt-1 text-center leading-none">
                <span className="font-serif text-[7.5px] font-bold text-stone-950 block truncate">
                  Сен-Клер
                </span>
                <span className="font-mono text-[5.5px] text-stone-500 uppercase block mt-0.5">
                  Барон
                </span>
              </div>
            </div>
          )}

        </div>

        {/* BOTTOM PANEL: EVIDENCE RELICS CASE (Шкатулка улик) */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#090807] border-t border-amber-950/40 px-4 py-2 flex items-center justify-between z-20 select-none">
          
          <div className="flex flex-col">
            <span className="font-mono text-[7px] text-amber-500/50 uppercase tracking-[0.25em] block">
              РЕЛИКВИИ ДЕЛА
            </span>
            <span className="font-serif text-[10px] italic text-stone-400">
              Шкатулка улик синдиката
            </span>
          </div>

          {/* RELICS SLOTS ROW */}
          <div className="flex gap-4 items-center">
            {RELICS_DATA.map((relic, index) => {
              const isUnlocked = completedChapters.includes(relic.chapterNum) || (STORY_CHAPTERS_DATA[index]?.completed);
              const Icon = (Lucide as any)[relic.iconName] || Lucide.Sparkles;

              return (
                <div 
                  key={relic.id}
                  onClick={() => {
                    if (isUnlocked) {
                      playClickSound();
                      setSelectedNode({
                        type: 'relic',
                        id: relic.id,
                        title: relic.name,
                        desc: relic.desc,
                        relicName: relic.name
                      });
                    }
                  }}
                  className={`w-11 h-11 border transition-all flex flex-col items-center justify-center relative cursor-pointer group ${
                    isUnlocked 
                      ? 'border-[#0ea5e9]/40 bg-[#0c4a6e]/10 hover:border-[#0ea5e9] hover:bg-[#0c4a6e]/20 text-[#38bdf8] shadow-[0_0_12px_rgba(14,165,233,0.15)] hover:shadow-[0_0_18px_rgba(14,165,233,0.3)]' 
                      : 'border-white/5 bg-black/40 text-white/10 cursor-not-allowed'
                  }`}
                  title={isUnlocked ? `${relic.name} (Раскрыто)` : 'Заблокировано (Раскройте соответствующую главу)'}
                >
                  <div className="absolute inset-1 border border-white/5 pointer-events-none" />
                  
                  {isUnlocked ? (
                    <Icon className="w-5 h-5 animate-pulse" style={{ animationDuration: '4s' }} />
                  ) : (
                    <Lucide.Lock className="w-3.5 h-3.5" />
                  )}

                  {/* Little chapter digit badge */}
                  <span className={`absolute bottom-0.5 right-1 font-mono text-[6px] font-black ${
                    isUnlocked ? 'text-[#38bdf8]/60' : 'text-white/5'
                  }`}>
                    {romanize(relic.chapterNum)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="hidden sm:flex flex-col text-right font-mono text-[8px] text-white/30 tracking-widest uppercase">
            <span>Раскрыто глав:</span>
            <span className="text-emerald-400 font-bold text-[9px]">{completedChapters.length} / 3</span>
          </div>

        </div>

      </div>

      {/* NODE DETAILED INSPECTION CARD OVERLAY */}
      {selectedNode && (
        <div className="absolute inset-0 bg-black/75 z-40 flex items-center justify-center p-4 backdrop-blur-[2px]">
          <div className="max-w-sm w-full border border-amber-900/40 bg-[#0d0907] p-5 relative shadow-2xl animate-fade-in flex flex-col">
            <div className="absolute inset-1.5 border border-white/5 pointer-events-none" />
            
            {/* Header info */}
            <div className="flex justify-between items-start border-b border-amber-950/30 pb-2 mb-3">
              <span className="font-mono text-[7px] text-amber-500/60 uppercase tracking-[0.25em] block">
                {selectedNode.type === 'chapter' ? 'СЮЖЕТНЫЙ ЭПИЗОД' : selectedNode.type === 'suspect' ? 'ДОСЬЕ ФИГУРАНТА' : selectedNode.type === 'relic' ? 'ВЕЩЕСТВЕННАЯ УЛИКА' : 'ДЕТЕКТИВНЫЙ ПРОТОКОЛ'}
              </span>
              <button 
                onClick={() => {
                  playClickSound();
                  setSelectedNode(null);
                }}
                className="text-[8px] font-mono text-white/40 hover:text-white uppercase tracking-wider cursor-pointer"
              >
                [Закрыть]
              </button>
            </div>

            {/* Title */}
            <h4 className="font-serif text-sm font-black text-amber-100 tracking-wide mb-2.5">
              {selectedNode.title}
            </h4>

            {/* Body Description */}
            <p className="font-serif text-[11px] leading-relaxed text-white/70 italic mb-4 whitespace-pre-line bg-black/30 p-2.5 border border-white/5">
              {selectedNode.desc}
            </p>

            {/* If Chapter Selected - requirements and select button */}
            {selectedNode.type === 'chapter' && selectedNode.job && (() => {
              const chapter = selectedNode.job;
              const chIndex = STORY_CHAPTERS_DATA.findIndex(j => j.id === chapter.id);
              const { isCompleted, isLocked, lockReason } = getChapterStatus(chIndex, chapter);

              return (
                <div className="mt-1 flex flex-col gap-3">
                  <div className="border border-white/5 bg-black/50 p-2 font-mono text-[8px] text-white/40 space-y-1">
                    <div className="flex justify-between">
                      <span>Награда дела:</span>
                      <span className="text-emerald-400 font-bold font-sans">+{chapter.reward}$</span>
                    </div>
                    {chapter.reputationRequired > 0 && (
                      <div className="flex justify-between">
                        <span>Требуемая репутация:</span>
                        <span className="text-amber-500 font-bold">{chapter.reputationRequired}★</span>
                      </div>
                    )}
                    {isLocked && lockReason && (
                      <div className="text-red-400 text-right italic font-serif text-[8.5px] font-bold uppercase mt-1">
                        ⚠ заблокировано: {lockReason}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        playClickSound();
                        setSelectedNode(null);
                      }}
                      className="flex-1 h-8 border border-white/10 hover:border-white/20 bg-neutral-900 text-white font-sans text-[9px] font-bold uppercase tracking-widest transition-all rounded-none"
                    >
                      Назад
                    </button>
                    {!isLocked && (
                      <button
                        onClick={() => {
                          playClickSound();
                          setSelectedNode(null);
                          onSelectJob(chapter);
                        }}
                        className="flex-1 h-8 bg-amber-600 hover:bg-amber-500 text-white font-sans text-[9px] font-bold uppercase tracking-widest transition-all rounded-none shadow-md"
                      >
                        {isCompleted ? 'Перепройти дело' : 'Начать расследование'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* General close button for non-chapters */}
            {selectedNode.type !== 'chapter' && (
              <button
                onClick={() => {
                  playClickSound();
                  setSelectedNode(null);
                }}
                className="w-full h-8 bg-amber-950/20 hover:bg-amber-950/40 border border-amber-900/30 text-amber-300 font-sans text-[9px] font-bold uppercase tracking-widest transition-all rounded-none mt-1"
              >
                Вернуться к доске
              </button>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
