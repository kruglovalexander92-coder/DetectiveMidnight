/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GameState, Job } from '../types';
import * as Lucide from 'lucide-react';
import { gameAudio } from '../utils/AudioEngine';
import CrimeBoard from './CrimeBoard';
import SuspectInterrogation from './SuspectInterrogation';

interface SandboxDashboardProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  onSelectJob: (job: Job) => void;
  onEndDay: () => void;
  onBuyLead: (jobId: string) => void;
  onReturnToMenu: () => void;
}

const STORY_CHAPTERS_DATA: Job[] = [
  {
    id: 'story_chapter_1',
    caseName: 'Сюжет: Глава I',
    title: 'Похищение Сапфирового Глаза',
    description: 'Дерзкая кража в резиденции Кэррингтон! Лорд в ярости, полиция бессильна. Проведите обыск в роскошном кабинете лорда и найдите легендарный синий камень.',
    reward: 200,
    reputationRequired: 0,
    infoCost: 0,
    timeLimit: null,
    risk: 'low',
    roomTemplateId: 'room_antique',
    completed: false
  },
  {
    id: 'story_chapter_2',
    caseName: 'Сюжет: Глава II',
    title: 'Контрабанда в полночь',
    description: 'След похищенного камня ведет в затуманенные доки. Свидетели заметили подозрительную активность на пирсе и складе №9! Перемещайтесь между локациями, собирая улики.',
    reward: 300,
    reputationRequired: 15,
    infoCost: 0,
    timeLimit: 180,
    risk: 'medium',
    roomTemplateId: 'room_captain',
    completed: false
  },
  {
    id: 'story_chapter_3',
    caseName: 'Сюжет: Глава III',
    title: 'Финал в небесах',
    description: 'Элитный лайнер "Эклипс" покидает город в грозу. Предотвратите диверсию во время полета в облаках и задержите главаря заговорщиков!',
    reward: 400,
    reputationRequired: 30,
    infoCost: 0,
    timeLimit: 120,
    risk: 'high',
    roomTemplateId: 'room_captain',
    completed: false
  }
];

export default function SandboxDashboard({
  gameState,
  setGameState,
  onSelectJob,
  onEndDay,
  onBuyLead,
  onReturnToMenu
}: SandboxDashboardProps) {
  const currentDay = gameState.currentDay ?? 1;
  const reputation = gameState.reputation ?? 0;
  const cash = gameState.economy?.cash ?? 150;
  const dailyJobs = gameState.availableJobs ?? [];
  const completedChapters = gameState.storyState?.completedChapters ?? [];
  const [storyViewMode, setStoryViewMode] = useState<'corkboard' | 'cards' | 'interrogate'>('corkboard');

  // Helper for rank name
  const getReputationRank = (rep: number): string => {
    if (rep < 20) return 'Уличный следопыт';
    if (rep < 50) return 'Опытный сыщик';
    if (rep < 90) return 'Гроза преступности Лондона';
    return 'Легендарный Детектив-Кот';
  };

  const currentRank = getReputationRank(reputation);

  // Sound handler wrapper
  const handleStartJobClick = (job: Job) => {
    try {
      gameAudio.playClick();
    } catch (e) {}
    onSelectJob(job);
  };

  const handleEndDayClick = () => {
    try {
      gameAudio.playClick();
      gameAudio.playMeow();
    } catch (e) {}
    onEndDay();
  };

  const handleBuyLeadClick = (jobId: string) => {
    try {
      gameAudio.playClick();
    } catch (e) {}
    onBuyLead(jobId);
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto p-4 flex flex-col gap-4 relative z-20 animate-fade-in min-h-[580px]">
      
      {/* Top dashboard summary board */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch shrink-0">
        
        {/* Day Calendar polaroid card (4 cols) */}
        <div className="md:col-span-4 border border-white/10 bg-black/60 p-5 flex flex-col justify-between relative overflow-hidden backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-16 h-16 border-t border-r border-white/5 pointer-events-none" />
          
          <div>
            <span className="font-mono text-[8px] uppercase tracking-[0.25em] text-amber-500/80 block mb-1">
              📅 ДЕТЕКТИВНЫЙ КАЛЕНДАРЬ
            </span>
            <div className="font-serif text-3xl font-bold text-white tracking-wide italic leading-none mb-0.5">
              День {currentDay}
            </div>
            <span className="font-sans text-[9px] text-white/40 uppercase tracking-widest block mb-3">
              Бюро на плаву: {gameState.daysSurvived ?? (currentDay - 1)} дн.
            </span>

            <div className="h-[1px] bg-white/10 my-2.5" />
            
            <p className="font-serif text-[10px] leading-relaxed text-white/50 italic">
              «Расходы на аренду офиса и поставки лососевого паштета списываются в конце каждого дня. Если баланс опустится ниже нуля, контора закроется банками-кредиторами!»
            </p>
          </div>

          <div className="mt-4 border border-white/5 bg-neutral-950 p-2.5">
            <div className="flex justify-between items-center text-[10px] font-mono text-white/50 mb-0.5">
              <span>Ежедневные счета:</span>
              <span className="text-red-400 font-bold">-110$</span>
            </div>
            <div className="space-y-0.5 text-[8px] font-mono text-white/30 pl-2">
              <div>• Аренда офиса Барта: 50$</div>
              <div>• Паштет из лосося для кота: 35$</div>
              <div>• Крепкий табак Барта: 15$</div>
              <div>• Порция кофе: 10$</div>
            </div>
          </div>
        </div>

        {/* Bureau Status Board (8 cols) */}
        <div className="md:col-span-8 border border-white/10 bg-[#0a0a0a]/80 p-5 flex flex-col justify-between backdrop-blur-sm">
          <div>
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="font-mono text-[8px] uppercase tracking-[0.25em] text-white/40 block mb-0.5">
                  ЛИЦЕНЗИОННЫЙ СТАТУС БЮРО
                </span>
                <h2 className="font-serif text-lg sm:text-xl font-bold text-white leading-tight">
                  Агентство «Ванс и Миднайт»
                </h2>
              </div>
              
              <div className="text-right">
                <span className="font-mono text-[8px] uppercase tracking-widest text-emerald-400 block mb-0.5">
                  ТЕКУЩАЯ КАССА
                </span>
                <div className="font-mono text-lg sm:text-xl font-bold text-emerald-400">
                  {cash}$
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-3">
              {/* Reputation metric widget */}
              <div className="border border-white/5 bg-black/40 p-2.5 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-none border border-amber-500/20 bg-amber-950/10 flex items-center justify-center shrink-0">
                  <Lucide.Award className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <span className="font-sans text-[8px] uppercase tracking-wider text-white/40 block leading-none">
                    Ранг репутации
                  </span>
                  <div className="font-serif text-[11px] font-bold text-white/90 italic mt-0.5 leading-none">
                    {currentRank}
                  </div>
                  <div className="flex items-center gap-1 mt-1 leading-none">
                    <span className="font-mono text-[9px] text-amber-400 font-bold">{reputation}</span>
                    <span className="text-[8px] text-white/30">очков репутации</span>
                  </div>
                </div>
              </div>

              {/* Day survivors widget */}
              <div className="border border-white/5 bg-black/40 p-2.5 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-none border border-sky-500/20 bg-sky-950/10 flex items-center justify-center shrink-0">
                  <Lucide.TrendingUp className="w-4 h-4 text-sky-400" />
                </div>
                <div>
                  <span className="font-sans text-[8px] uppercase tracking-wider text-white/40 block leading-none">
                    Прогрессия выживания
                  </span>
                  <div className="font-serif text-[11px] font-bold text-white/90 italic mt-0.5 leading-none">
                    День {currentDay} (активен)
                  </div>
                  <div className="font-mono text-[9px] text-sky-400 mt-1 leading-none">
                    {dailyJobs.filter(j => j.completed).length} из {dailyJobs.length} дел раскрыто
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-3 mt-2 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="font-serif italic text-[10px] text-white/40 text-center sm:text-left">
              «Раскрывайте криминальные дела из сводок, чтобы заработать гонорар до наступления темноты!»
            </p>
            
            <button
              onClick={handleEndDayClick}
              className="px-5 h-10 bg-white hover:bg-neutral-200 text-black font-sans text-[10px] font-bold uppercase tracking-[0.2em] rounded-none transition-all flex items-center gap-1.5 shrink-0 shadow hover:scale-[1.01]"
            >
              <Lucide.Moon className="w-3.5 h-3.5 fill-black" />
              Завершить день (-110$)
            </button>
          </div>
        </div>
      </div>

      {/* Main Corkboard Section */}
      <div className="flex-1 border border-amber-950/40 bg-[#120e0b] p-5 text-white text-left shadow-2xl relative overflow-y-auto custom-scrollbar min-h-[250px] flex flex-col gap-5">
        {/* Wood texture background simulation */}
        <div className="absolute inset-0 bg-[radial-gradient(#1a1410_1px,transparent_1px)] [background-size:16px_16px] opacity-25 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#100c0a]/40 to-[#080605] pointer-events-none" />

        {/* SECTION 1: STORY INVESTIGATIONS (Unlocked from Day 3) */}
        {currentDay >= 3 && (
          <div className="relative z-10">
            {/* ANNOUNCEMENT BANNER FOR NEWLY UNLOCKED FEATURE */}
            <div className="border border-amber-500/30 bg-amber-950/15 p-4 mb-5 rounded-none flex items-start gap-3.5 shadow-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-transparent pointer-events-none" />
              <div className="w-10 h-10 rounded-none border border-amber-500/20 bg-amber-950/40 flex items-center justify-center shrink-0">
                <Lucide.Megaphone className="w-5 h-5 text-amber-500 animate-bounce" />
              </div>
              <div className="flex-1">
                <span className="px-1.5 py-0.5 border border-amber-500/30 bg-amber-950/30 text-amber-400 text-[7px] font-mono font-bold uppercase tracking-widest mb-1.5 inline-block">
                  ★ СЕНСАЦИЯ В СВОДКАХ ★
                </span>
                <h4 className="font-serif text-xs font-bold text-amber-100 uppercase tracking-wide mb-1">
                  Доступно многосерийное сюжетное расследование!
                </h4>
                <p className="font-serif text-[10.5px] italic text-white/60 leading-relaxed max-w-3xl">
                  «Барт развернул свежий выпуск газеты с чашкой утреннего кофе: "Глянь на первую полосу, Барт! Нам бросил вызов настоящий криминальный синдикат. Дело состоит из нескольких связанных глав. Когти к бою, усатый детектив!"»
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-amber-850/40 pb-2 mb-4 gap-3">
              <div className="flex items-center gap-2">
                <Lucide.Compass className="w-4 h-4 text-amber-500 animate-spin" style={{ animationDuration: '8s' }} />
                <h3 className="font-serif text-sm font-bold italic tracking-wide text-amber-100 uppercase">
                  Особые Сюжетные Расследования
                </h3>
              </div>
              
              {/* VIEW SWITCHER */}
              <div className="flex items-center gap-1 bg-black/40 border border-amber-950/40 p-1 self-stretch sm:self-auto shrink-0 select-none">
                <button
                  onClick={() => {
                    try { gameAudio.playClick(); } catch (e) {}
                    setStoryViewMode('corkboard');
                  }}
                  className={`px-3 py-1 font-sans text-[8px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    storyViewMode === 'corkboard'
                      ? 'bg-amber-600 text-white shadow'
                      : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                  }`}
                  title="Интерактивная доска улик"
                >
                  <Lucide.Pin className="w-2.5 h-2.5 rotate-45 text-amber-400" />
                  <span>Доска улик</span>
                </button>
                <button
                  onClick={() => {
                    try { gameAudio.playClick(); } catch (e) {}
                    setStoryViewMode('cards');
                  }}
                  className={`px-3 py-1 font-sans text-[8px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    storyViewMode === 'cards'
                      ? 'bg-amber-600 text-white shadow'
                      : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                  }`}
                  title="Карточки глав"
                >
                  <Lucide.Layers className="w-2.5 h-2.5 text-white/50" />
                  <span>Карточки</span>
                </button>
                <button
                  onClick={() => {
                    try { gameAudio.playClick(); } catch (e) {}
                    setStoryViewMode('interrogate');
                  }}
                  className={`px-3 py-1 font-sans text-[8px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    storyViewMode === 'interrogate'
                      ? 'bg-amber-600 text-white shadow'
                      : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                  }`}
                  title="Допрос свидетелей и Фоторобот"
                >
                  <Lucide.UserCheck className="w-2.5 h-2.5 text-amber-400" />
                  <span>Допрос и Фоторобот</span>
                </button>
              </div>
            </div>

            {storyViewMode === 'corkboard' ? (
              <CrimeBoard 
                gameState={gameState}
                STORY_CHAPTERS_DATA={gameState.campaignChapters && gameState.campaignChapters.length > 0 
                  ? gameState.campaignChapters 
                  : STORY_CHAPTERS_DATA}
                onSelectJob={onSelectJob}
              />
            ) : storyViewMode === 'cards' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
                {(gameState.campaignChapters && gameState.campaignChapters.length > 0 
                  ? gameState.campaignChapters 
                  : STORY_CHAPTERS_DATA
                ).map((chapter, index) => {
                  const chNum = index + 1;
                  const isCompleted = chapter.completed || completedChapters.includes(chNum);
                  
                  // Romanizing helper
                  const romanize = (num: number): string => {
                    const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
                    return roman[num - 1] || num.toString();
                  };

                  // Dynamic chapter unlocked conditions
                  let isLocked = false;
                  let lockReason = '';

                  if (index > 0) {
                    const prevChapters = gameState.campaignChapters || STORY_CHAPTERS_DATA;
                    const prevCh = prevChapters[index - 1];
                    const prevChCompleted = prevCh.completed || completedChapters.includes(chNum - 1);
                    
                    if (!prevChCompleted) {
                      isLocked = true;
                      lockReason = `Требуется раскрыть Главу ${romanize(chNum - 1)}`;
                    } else if (reputation < chapter.reputationRequired) {
                      isLocked = true;
                      lockReason = `Требуется репутация ${chapter.reputationRequired}★`;
                    }
                  }

                  // Color codes based on chapters and completeness
                  const borderStyles = isCompleted
                    ? 'border-emerald-950 bg-emerald-950/5 text-emerald-100/60 opacity-80'
                    : isLocked
                      ? 'border-neutral-900/60 bg-neutral-950/50 text-white/30'
                      : chNum === 1
                        ? 'border-amber-900/40 bg-[#1e1713] hover:border-amber-700/60'
                        : chNum % 3 === 2
                          ? 'border-blue-900/40 bg-[#131a22] hover:border-blue-700/60'
                          : 'border-purple-900/40 bg-[#1b1522] hover:border-purple-700/60';

                  const iconsPool = ['Compass', 'Anchor', 'Wind', 'BookOpen', 'Shield', 'Key', 'Eye', 'Map', 'Cat', 'Award'];
                  const iconName = iconsPool[(chNum - 1) % iconsPool.length];
                  const Icon = (Lucide as any)[iconName] || Lucide.FileText;

                  return (
                    <div key={chapter.id} className={`border p-4 flex flex-col justify-between relative transition-all shadow-md ${borderStyles}`}>
                      {/* Pushpin decor */}
                      <div className={`absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border shadow pointer-events-none ${
                        isCompleted 
                          ? 'bg-emerald-700 border-emerald-900' 
                          : isLocked 
                            ? 'bg-neutral-800 border-neutral-950' 
                            : 'bg-red-700 border-red-950'
                      }`} />

                      <div>
                        <div className="flex justify-between items-start mb-2 border-b border-white/5 pb-1.5">
                          <span className="font-mono text-[8px] uppercase tracking-wider text-white/40 block">
                            Сюжет // Глава {romanize(chNum)}
                          </span>
                          {isCompleted ? (
                            <span className="px-1.5 py-0.5 border border-emerald-500/20 bg-emerald-950/40 text-emerald-400 text-[7px] font-mono font-bold uppercase tracking-widest rounded-none">
                              РАСКРЫТО ✓
                            </span>
                          ) : isLocked ? (
                            <span className="px-1.5 py-0.5 border border-red-500/25 bg-red-950/20 text-red-400 text-[6.5px] font-mono font-bold uppercase tracking-widest rounded-none flex items-center gap-1">
                              <Lucide.Lock className="w-2.5 h-2.5" /> ТРЕБУЕТСЯ {chapter.reputationRequired}★
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 border border-amber-500/20 bg-amber-950/30 text-amber-400 text-[7px] font-mono font-bold uppercase tracking-widest rounded-none">
                              ДОСТУПНО
                            </span>
                          )}
                        </div>

                        <div className="flex gap-2 items-start mb-2">
                          <div className={`p-1.5 bg-black/40 border border-white/5 shrink-0 ${
                            isLocked ? 'text-white/20' : isCompleted ? 'text-emerald-500/40' : 'text-amber-400'
                          }`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <h4 className={`font-serif text-xs font-bold leading-tight ${isCompleted ? 'text-emerald-200/40' : 'text-white'}`}>
                            {chapter.title}
                          </h4>
                        </div>

                        <p className="text-[10px] leading-relaxed text-white/50 mb-4 font-sans line-clamp-3">
                          {chapter.description}
                        </p>

                        <div className="space-y-1 font-mono text-[8px] text-white/30 border-t border-white/5 pt-2 mb-3">
                          <div className="flex justify-between">
                            <span>Награда дела:</span>
                            <span className="text-emerald-400 font-bold">+{chapter.reward}$</span>
                          </div>
                          {isLocked && lockReason && (
                            <div className="text-red-400/80 text-[7.5px] italic text-right mt-0.5">
                              ⚠ {lockReason}
                            </div>
                          )}
                        </div>
                      </div>

                      {!isLocked && (
                        <button
                          onClick={() => handleStartJobClick(chapter)}
                          className={`w-full h-8 font-sans text-[9px] font-bold uppercase tracking-[0.15em] transition-all rounded-none flex items-center justify-center gap-1.5 ${
                            isCompleted
                              ? 'bg-neutral-900 border border-white/10 hover:border-white/30 text-white/60 hover:text-white'
                              : 'bg-amber-600 hover:bg-amber-500 text-white'
                          }`}
                        >
                          <Lucide.Search className="w-3 h-3" />
                          {isCompleted ? 'Перепройти главу' : 'Начать расследование'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <SuspectInterrogation 
                gameState={gameState}
                setGameState={setGameState}
              />
            )}
          </div>
        )}

        {/* SECTION 2: DAILY CONTRACTS */}
        <div className="relative z-10 flex-1 flex flex-col">
          <div className="flex justify-between items-center border-b border-amber-900/40 pb-2 mb-4">
            <div className="flex items-center gap-2">
              <Lucide.ClipboardList className="w-4 h-4 text-amber-500" />
              <h3 className="font-serif text-sm font-bold italic tracking-wide text-amber-100 uppercase">
                Ежедневные Оперативные Контракты
              </h3>
            </div>
            <span className="font-mono text-[8px] uppercase tracking-widest text-amber-500/40">
              КРИМИНАЛЬНЫЕ СВОДКИ НА СЕГОДНЯ
            </span>
          </div>

          {dailyJobs.length === 0 ? (
            <div className="flex-1 flex flex-col justify-center items-center text-center py-8 border border-dashed border-amber-900/10 bg-amber-950/5 p-6">
              <Lucide.FileQuestion className="w-8 h-8 text-amber-600/30 mb-2" />
              <p className="font-serif text-[11px] text-amber-200/50 italic max-w-sm">
                «Сегодня на лондонских улицах подозрительно тихо... Ни одного вызова в газетах. Кот умывается — к хорошей погоде, а Барт скучает. Придется закрыть день и оплатить счета!»
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dailyJobs.map(job => {
                const isLocked = reputation < job.reputationRequired;
                const hasLeadPaid = job.infoCost === 0 || job.leadPurchased;

                return (
                  <div 
                    key={job.id} 
                    className={`border transition-all flex flex-col justify-between p-4 rounded-none relative ${
                      job.completed
                        ? 'border-emerald-800/20 bg-emerald-950/5 text-emerald-100/45 opacity-60'
                        : isLocked
                          ? 'border-neutral-900 bg-[#0c0c0c] text-white/25'
                          : 'border-amber-900/30 bg-[#16120f] text-white/90 shadow-sm hover:border-amber-750'
                    }`}
                  >
                    {/* Pushpin decor */}
                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#9f1239] border border-stone-900 shadow pointer-events-none" />

                    <div>
                      {/* Header line of the card */}
                      <div className="flex justify-between items-start mb-2 border-b border-amber-950/25 pb-1.5">
                        <span className="font-mono text-[8px] uppercase tracking-widest text-amber-500/70 font-bold block">
                          Дело #{job.id.split('_').slice(-1)[0]}
                        </span>
                        
                        {job.completed ? (
                          <span className="px-1.5 py-0.5 border border-emerald-500/20 bg-emerald-950/30 text-emerald-400 text-[7px] font-mono font-bold uppercase tracking-widest rounded-none">
                            РАСКРЫТО ✓
                          </span>
                        ) : isLocked ? (
                          <span className="px-1.5 py-0.5 border border-red-500/20 bg-red-950/30 text-red-400 text-[6.5px] font-mono font-bold uppercase tracking-widest rounded-none flex items-center gap-1">
                            <Lucide.Lock className="w-2.5 h-2.5" /> ТРЕБУЕТСЯ {job.reputationRequired}★
                          </span>
                        ) : (
                          <span className={`px-1.5 py-0.5 border text-[6.5px] font-mono font-bold uppercase tracking-widest rounded-none ${
                            job.risk === 'high' 
                              ? 'border-red-500/30 bg-red-950/20 text-red-400' 
                              : job.risk === 'medium'
                                ? 'border-amber-500/30 bg-amber-950/20 text-amber-400'
                                : 'border-blue-500/30 bg-blue-950/20 text-blue-400'
                          }`}>
                            {job.risk === 'high' ? '⚠️ ВЫСОКИЙ РИСК' : job.risk === 'medium' ? '⚡ СРЕДНИЙ РИСК' : '🍃 НИЗКИЙ РИСК'}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h4 className={`font-serif text-xs font-bold italic mb-1.5 tracking-wide ${
                        job.completed ? 'text-emerald-300/30 line-through' : 'text-amber-100'
                      }`}>
                        {job.title}
                      </h4>

                      {/* Description */}
                      <p className="text-[10px] leading-relaxed text-white/50 mb-3 font-sans line-clamp-3">
                        {job.description}
                      </p>

                      {/* Meta stats badges */}
                      <div className="space-y-1 font-mono text-[8px] text-white/35 border-t border-amber-950/10 pt-2 mb-3">
                        <div className="flex justify-between">
                          <span>Гонорар дела:</span>
                          <span className="text-emerald-400 font-bold font-sans">+{job.reward}$</span>
                        </div>
                        
                        {job.timeLimit && (
                          <div className="flex justify-between">
                            <span>Лимит времени:</span>
                            <span className="text-red-400">⏳ {Math.floor(job.timeLimit / 60)} мин.</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions footer of the card */}
                    {!job.completed && !isLocked && (
                      <div className="space-y-1.5 mt-2 pt-1 border-t border-amber-950/10">
                        {/* Buy Lead Info Block */}
                        {job.infoCost > 0 && !job.leadPurchased && (
                          <button
                            onClick={() => handleBuyLeadClick(job.id)}
                            disabled={cash < job.infoCost}
                            className="w-full h-7 border border-amber-600/30 hover:border-amber-550 bg-amber-950/20 hover:bg-amber-950/40 text-[8px] font-mono font-bold uppercase tracking-wider text-amber-400 disabled:opacity-40 disabled:pointer-events-none transition-all rounded-none flex items-center justify-center gap-1"
                          >
                            <Lucide.HelpCircle className="w-3 h-3 text-amber-500" />
                            Купить наводку крысы (-{job.infoCost}$)
                          </button>
                        )}

                        <button
                          onClick={() => handleStartJobClick(job)}
                          disabled={!hasLeadPaid}
                          className={`w-full h-8 font-sans text-[9px] font-bold uppercase tracking-[0.15em] transition-all rounded-none flex items-center justify-center gap-1.5 ${
                            !hasLeadPaid
                              ? 'bg-neutral-800 text-white/30 border border-neutral-700 cursor-not-allowed'
                              : 'bg-amber-600 hover:bg-amber-500 text-white shadow active:scale-[0.98]'
                          }`}
                        >
                          <Lucide.Search className="w-3 h-3" />
                          {!hasLeadPaid ? 'Требуется наводка' : 'Начать расследование'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Return to Main Menu link */}
      <div className="text-center mt-1 shrink-0 relative z-10">
        <button
          onClick={() => {
            try { gameAudio.playClick(); } catch (e) {}
            onReturnToMenu();
          }}
          className="text-[9px] font-mono text-white/30 hover:text-white/60 uppercase tracking-widest border-b border-dashed border-white/10 hover:border-white/30 pb-0.5 transition-all"
        >
          ← Вернуться в главное меню
        </button>
      </div>
    </div>
  );
}
