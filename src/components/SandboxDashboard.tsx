/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { GameState, Job } from '../types';
import * as Lucide from 'lucide-react';
import { gameAudio } from '../utils/AudioEngine';
import CrimeBoard from './CrimeBoard';
import SuspectInterrogation from './SuspectInterrogation';
import { extractCaseTags, evaluateCaseFolder, generateContextualSketchForJob } from '../utils/tagHelper';

interface SandboxDashboardProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  onSelectJob: (job: Job) => void;
  onEndDay: () => void;
  onBuyLead: (jobId: string) => void;
  onReturnToMenu: () => void;
  onOpenWriter?: () => void;
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
    timeLimit: 210,
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
    timeLimit: 150,
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
  onReturnToMenu,
  onOpenWriter
}: SandboxDashboardProps) {
  const currentDay = gameState.currentDay ?? 1;
  const reputation = gameState.reputation ?? 0;
  const cash = gameState.economy?.cash ?? 150;
  const dailyJobs = (gameState.availableJobs ?? []).filter(j => j && !j.completed);
  const completedChapters = gameState.storyState?.completedChapters ?? [];
  const [storyViewMode, setStoryViewMode] = useState<'cards' | 'interrogate'>('cards');
  const [activeTab, setActiveTab] = useState<'daily' | 'story' | 'archive'>('daily');
  const [isCrimeBoardOpen, setIsCrimeBoardOpen] = useState(false);
  const [pendingJob, setPendingJob] = useState<Job | null>(null);
  const [zoomedJob, setZoomedJob] = useState<Job | null>(null);
  const [activeInterrogationSketchId, setActiveInterrogationSketchId] = useState<string | undefined>(undefined);
  const [isArchiveExpanded, setIsArchiveExpanded] = useState(false);
  const [unacknowledgedChapter, setUnacknowledgedChapter] = useState<Job | null>(null);

  const [archiveSubTab, setArchiveSubTab] = useState<'story' | 'solo'>('story');
  const [fileJobId, setFileJobId] = useState<string | null>(null);

  const campaignChapters = gameState.campaignChapters && gameState.campaignChapters.length > 0 
    ? gameState.campaignChapters 
    : STORY_CHAPTERS_DATA;

  const archivedChapters = campaignChapters.filter((chapter, idx) => {
    const chNum = idx + 1;
    const isCompleted = chapter.completed || completedChapters.includes(chNum);
    return isCompleted;
  });

  const archivedSoloJobs = (gameState.availableJobs ?? []).filter(j => j && j.completed);

  // Automatically switch sub-tab if one of them is empty
  useEffect(() => {
    if (archivedChapters.length === 0 && archivedSoloJobs.length > 0 && archiveSubTab === 'story') {
      setArchiveSubTab('solo');
    } else if (archivedChapters.length > 0 && archivedSoloJobs.length === 0 && archiveSubTab === 'solo') {
      setArchiveSubTab('story');
    }
  }, [archivedChapters.length, archivedSoloJobs.length, archiveSubTab]);

  const handleFileCaseToFolder = (folderId: string, caseId: string) => {
    try { gameAudio.playClick(); } catch (e) {}
    setGameState(prev => {
      const folders = (prev.caseFolders ?? []).map(f => {
        if (f.id === folderId) {
          if (f.caseIds.includes(caseId)) return f;
          const updatedIds = [...f.caseIds, caseId];
          const cases = (prev.availableJobs ?? []).filter(j => updatedIds.includes(j.id));
          const tagsSet = new Set<string>();
          cases.forEach(c => {
            extractCaseTags(c.title || c.caseName || '', c.description || '').forEach(t => tagsSet.add(t));
          });
          return {
            ...f,
            caseIds: updatedIds,
            tags: Array.from(tagsSet).slice(0, 4)
          };
        }
        return f;
      });
      return { ...prev, caseFolders: folders };
    });
    setFileJobId(null);
  };

  // Check for newly unlocked story campaign or chapters to show the pop-up
  useEffect(() => {
    if (currentDay >= 3) {
      const campaignChapters = gameState.campaignChapters && gameState.campaignChapters.length > 0 
        ? gameState.campaignChapters 
        : STORY_CHAPTERS_DATA;

      const firstUnlocked = campaignChapters.find((chapter, index) => {
        const chNum = index + 1;
        const isCompleted = chapter.completed || completedChapters.includes(chNum);
        if (isCompleted) return false;
        
        if (index > 0) {
          const prevCh = campaignChapters[index - 1];
          const prevChCompleted = prevCh ? (prevCh.completed || completedChapters.includes(index)) : false;
          if (!prevChCompleted) return false;
          if (reputation < chapter.reputationRequired) return false;
        }
        return true;
      });

      if (firstUnlocked) {
        const notified = gameState.notifiedChapters ?? [];
        
        // Failsafe check from localStorage
        let localNotified: string[] = [];
        try {
          const stored = localStorage.getItem('noir_midnight_notified_chapters');
          if (stored) {
            localNotified = JSON.parse(stored);
          }
        } catch (e) {}

        if (!notified.includes(firstUnlocked.id) && !localNotified.includes(firstUnlocked.id)) {
          setUnacknowledgedChapter(firstUnlocked);
        }
      }
    }
  }, [currentDay, gameState.notifiedChapters, gameState.campaignChapters, completedChapters, reputation]);

  const handleAcknowledgeChapter = (openTab: boolean) => {
    if (unacknowledgedChapter) {
      const chapterId = unacknowledgedChapter.id;
      
      // Save immediately to localStorage as a failsafe fallback!
      try {
        let localNotified: string[] = [];
        const stored = localStorage.getItem('noir_midnight_notified_chapters');
        if (stored) {
          localNotified = JSON.parse(stored);
        }
        if (!localNotified.includes(chapterId)) {
          localNotified.push(chapterId);
          localStorage.setItem('noir_midnight_notified_chapters', JSON.stringify(localNotified));
        }
      } catch (e) {}

      setGameState(prev => {
        const notified = prev.notifiedChapters ?? [];
        if (!notified.includes(chapterId)) {
          return {
            ...prev,
            notifiedChapters: [...notified, chapterId]
          };
        }
        return prev;
      });
      setUnacknowledgedChapter(null);
      if (openTab) {
        setActiveTab('story');
      }
    }
  };

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

    const isStoryOrCampaign = job.id.startsWith('story_') || job.id.startsWith('custom_campaign_ch_');
    if (!isStoryOrCampaign) {
      // Regular cases don't require suspect sketch completion warnings
      onSelectJob(job);
      return;
    }

    // Story investigations check if their specific sketch is complete
    let sketches = gameState.sketches ?? [];
    let sketch = sketches.find(s => s.id === job.id);

    if (!sketch) {
      // Dynamically generate context-bound sketch if it doesn't exist
      const newSketch = generateContextualSketchForJob(job);
      sketches = [...sketches, newSketch];
      sketch = newSketch;
      setGameState(prev => ({
        ...prev,
        sketches: [...(prev.sketches ?? []), newSketch]
      }));
    }

    if (sketch && !sketch.completed) {
      setActiveInterrogationSketchId(sketch.id);
      setPendingJob(job);
    } else {
      onSelectJob(job);
    }
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
    <div 
      className="flex-1 w-full max-w-7xl mx-auto p-2 md:p-3 lg:py-2.5 flex flex-col gap-2 relative z-20 animate-fade-in border border-white/10 bg-[#070708]/90 backdrop-blur-[0.5px]"
    >
      
      {/* Top dashboard summary board */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-stretch shrink-0 relative z-10">
        
        {/* Day Calendar polaroid card (4 cols) */}
        <div className="md:col-span-4 border border-white/10 bg-black/80 p-2.5 flex flex-col justify-between relative overflow-hidden backdrop-blur-md">
          <div className="absolute top-0 right-0 w-16 h-16 border-t border-r border-white/5 pointer-events-none" />
          
          <div className="flex flex-col gap-1.5">
            <div>
              <span className="font-mono text-[7px] uppercase tracking-[0.25em] text-amber-500/80 block mb-0.5">
                📅 ДЕТЕКТИВНЫЙ КАЛЕНДАРЬ
              </span>
              <div className="font-serif text-2xl font-bold text-white tracking-wide italic leading-none mb-0.5">
                День {currentDay}
              </div>
              <span className="font-sans text-[8.5px] text-white/40 uppercase tracking-widest block mb-1">
                Бюро на плаву: {gameState.daysSurvived ?? (currentDay - 1)} дн.
              </span>

              <div className="h-[1px] bg-white/10 my-1" />
              
              <p className="font-serif text-[9px] leading-normal text-white/50 italic">
                «Расходы на аренду офиса и поставки лососевого паштета списываются в конце каждого дня. Если баланс опустится ниже нуля, контора закроется банками-кредиторами!»
              </p>
            </div>

            {/* Budget Widget (Moved here and made larger) */}
            <div className="border border-emerald-500/20 bg-emerald-950/20 p-1.5 flex justify-between items-center rounded-none">
              <div>
                <span className="font-mono text-[7px] uppercase tracking-wider text-emerald-400 block leading-none mb-0.5">
                  БЮДЖЕТ БЮРО
                </span>
                <span className="font-sans text-xl font-bold text-emerald-400 font-mono tracking-wide leading-none">
                  {cash}$
                </span>
              </div>
              <Lucide.Wallet className="w-4 h-4 text-emerald-500/60" />
            </div>

            {/* Daily Bills List */}
            <div className="border border-white/5 bg-neutral-950 p-1.5">
              <div className="flex justify-between items-center text-[9px] font-mono text-white/50 mb-0.5">
                <span>Ежедневные счета:</span>
                <span className="text-red-400 font-bold">-110$</span>
              </div>
              <div className="space-y-0 text-[7.5px] font-mono text-white/30 pl-2">
                <div>• Аренда офиса Барта: 50$</div>
                <div>• Паштет из лосося для кота: 35$</div>
                <div>• Крепкий табак Барта: 15$</div>
                <div>• Порция кофе: 10$</div>
              </div>
            </div>
          </div>

          {/* End Day Button (Moved here) */}
          <button
            onClick={handleEndDayClick}
            className="w-full h-8 mt-2 bg-[#d4d4d8] hover:bg-white text-black font-sans text-[9px] font-bold uppercase tracking-[0.2em] rounded-none transition-all flex items-center justify-center gap-1.5 shrink-0 shadow hover:scale-[1.01] cursor-pointer"
          >
            <Lucide.Moon className="w-3.5 h-3.5 fill-black text-black" />
            Завершить день (-110$)
          </button>
        </div>

        {/* Bureau Status Board (8 cols) */}
        <div 
          className="md:col-span-8 border border-white/10 p-3 flex flex-col justify-between relative overflow-hidden bg-cover bg-center bg-no-repeat min-h-[160px]"
          style={{ backgroundImage: `url('${activeTab === 'story' ? '/src/img/Art/Agency2.png' : (activeTab === 'archive' ? '/src/img/Art/Archive.png' : '/src/img/Art/Agency.png')}')` }}
        >
          {/* No dark overlay, keeping original brightness */}

          {/* Wrapper to place all content above overlay */}
          <div className="relative z-10 flex-1 flex flex-col justify-between gap-1.5 h-full">
            <div className="bg-black/55 border border-white/5 p-2 max-w-sm backdrop-blur-[1px] shadow-lg">
              <span className="font-mono text-[7.5px] uppercase tracking-[0.25em] text-white/50 block mb-0.5">
                ЛИЦЕНЗИОННЫЙ СТАТУС БЮРО
              </span>
              <h2 className="font-serif text-base sm:text-lg font-bold text-white leading-tight">
                Агентство «Ванс и Миднайт»
              </h2>
              
              {/* Bureau Rating Badge (Moved here under the Agency name) */}
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className="px-2 py-0.5 border border-amber-500/30 bg-amber-950/40 rounded-none text-[8.5px] font-mono text-amber-400 font-bold uppercase tracking-widest leading-none flex items-center gap-1 shadow">
                  <span>★</span>
                  <span>{reputation} ({currentRank.toUpperCase()})</span>
                </div>
              </div>
            </div>

            <p className="font-serif italic text-[9px] text-white/90 leading-relaxed text-left max-w-lg mt-auto bg-black/55 border border-white/5 p-2 backdrop-blur-[1px] shadow-lg">
              «Раскрывайте криминальные дела на сводках, чтобы заработать историю и восстановить репутацию»
            </p>
          </div>
        </div>
      </div>

      {/* Main Corkboard Section */}
      <div className="flex-1 border border-white/10 bg-black/80 p-3 text-white text-left shadow-2xl relative overflow-y-auto md:overflow-y-hidden custom-scrollbar flex flex-col gap-2.5 backdrop-blur-md">
        {/* Wood texture background simulation */}
        <div className="absolute inset-0 bg-[radial-gradient(#1a1410_1px,transparent_1px)] [background-size:16px_16px] opacity-25 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#100c0a]/40 to-[#080605] pointer-events-none" />

        {/* Main Tab Switcher */}
        <div className="relative z-10 flex border-b border-white/10 select-none shrink-0 mb-0.5 gap-1 bg-black/30 p-1">
          <button
            onClick={() => {
              try { gameAudio.playClick(); } catch (e) {}
              setActiveTab('daily');
            }}
            className={`flex-1 sm:flex-initial px-1.5 sm:px-3 py-1 font-serif text-[9px] sm:text-[10.5px] font-bold uppercase tracking-wider transition-all rounded-none flex items-center justify-center gap-1 border cursor-pointer ${
              activeTab === 'daily'
                ? 'bg-amber-950/40 border-amber-500/50 text-amber-300 shadow-lg'
                : 'bg-black/40 border-transparent text-white/40 hover:text-white/70 hover:bg-white/5'
            }`}
          >
            <Lucide.ClipboardList className={`w-3 h-3 ${activeTab === 'daily' ? 'text-amber-400' : 'text-white/40'}`} />
            <span>Ежедневные Контракты</span>
          </button>

          <button
            onClick={() => {
              try { gameAudio.playClick(); } catch (e) {}
              setActiveTab('story');
            }}
            className={`flex-1 sm:flex-initial px-1.5 sm:px-3 py-1 font-serif text-[9px] sm:text-[10.5px] font-bold uppercase tracking-wider transition-all rounded-none flex items-center justify-center gap-1 border cursor-pointer ${
              activeTab === 'story'
                ? 'bg-amber-950/40 border-amber-500/50 text-amber-300 shadow-lg'
                : 'bg-black/40 border-transparent text-white/40 hover:text-white/70 hover:bg-white/5'
            }`}
          >
            <Lucide.Compass className={`w-3 h-3 ${activeTab === 'story' ? 'text-amber-400' : 'text-white/40'}`} />
            <span>Сюжетные Кампании</span>
          </button>

          <button
            onClick={() => {
              try { gameAudio.playClick(); } catch (e) {}
              setActiveTab('archive');
            }}
            className={`flex-1 sm:flex-initial px-1.5 sm:px-3 py-1 font-serif text-[9px] sm:text-[10.5px] font-bold uppercase tracking-wider transition-all rounded-none flex items-center justify-center gap-1 border cursor-pointer ${
              activeTab === 'archive'
                ? 'bg-amber-950/40 border-amber-500/50 text-amber-300 shadow-lg'
                : 'bg-black/40 border-transparent text-white/40 hover:text-white/70 hover:bg-white/5'
            }`}
          >
            <Lucide.Archive className={`w-3 h-3 ${activeTab === 'archive' ? 'text-amber-400' : 'text-white/40'}`} />
            <span>Архив дел {(() => {
              const totalArchived = archivedChapters.length + archivedSoloJobs.length;
              return totalArchived > 0 ? `(${totalArchived})` : '';
            })()}</span>
          </button>

          {/* Writer Cabinet Tab Button ("Писать мемуары") */}
          {onOpenWriter && (
            <button
              onClick={() => {
                try {
                  gameAudio.playClick();
                  if (currentDay >= 5) {
                    gameAudio.playTypewriterBell();
                  }
                } catch (e) {}
                onOpenWriter();
              }}
              className={`flex-1 sm:flex-initial px-1.5 sm:px-3 py-1 font-serif text-[9px] sm:text-[10.5px] font-bold uppercase tracking-wider transition-all rounded-none flex items-center justify-center gap-1 border cursor-pointer ${
                currentDay < 5 
                  ? "bg-black/25 border-transparent text-white/20 hover:text-white/30 hover:bg-white/5"
                  : "bg-black/40 border-transparent text-white/40 hover:text-white/70 hover:bg-white/5"
              }`}
            >
              {currentDay < 5 ? (
                <Lucide.Lock className="w-3 h-3 text-red-500/50" />
              ) : (
                <Lucide.PenTool className="w-3 h-3 text-white/40" />
              )}
              <span>Писать мемуары</span>
            </button>
          )}
        </div>

         {/* SECTION 1 (HIGH PRIORITY): DAILY CONTRACTS */}
         {activeTab === 'daily' && (
           <div className="relative z-10 flex-1 flex flex-col animate-fade-in">
             <div className="flex justify-between items-center border-b border-amber-900/40 pb-1.5 mb-2">
               <div className="flex items-center gap-2">
                 <Lucide.ClipboardList className="w-4 h-4 text-amber-500" />
                 <h3 className="font-serif text-xs sm:text-sm font-bold italic tracking-wide text-amber-100 uppercase">
                   Ежедневные Оперативные Контракты
                 </h3>
               </div>
               <span className="font-mono text-[8px] uppercase tracking-widest text-amber-500/40 hidden sm:inline">
                 КРИМИНАЛЬНЫЕ СВОДКИ НА СЕГОДНЯ
               </span>
             </div>
 
             {dailyJobs.length === 0 ? (
               <div className="flex-1 flex flex-col justify-center items-center text-center py-6 border border-dashed border-amber-900/10 bg-amber-950/5 p-6">
                 <Lucide.FileQuestion className="w-8 h-8 text-amber-600/30 mb-2" />
                 <p className="font-serif text-[11px] text-amber-200/50 italic max-w-sm">
                   «Сегодня на лондонских улицах подозрительно тихо... Ни одного вызова в газетах. Кот умывается — к хорошей погоде, а Барт скучает. Придется закрыть день и оплатить счета!»
                 </p>
               </div>
             ) : (
               <div className="flex flex-row overflow-x-auto gap-2.5 lg:gap-3 pb-3 pt-1.5 custom-scrollbar md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-x-visible md:pb-0">
                 {dailyJobs.map(job => {
                   const isLocked = reputation < job.reputationRequired;
                   const hasLeadPaid = job.infoCost === 0 || job.leadPurchased;
 
                   return (
                     <div 
                       key={job.id} 
                       onClick={() => {
                          try { gameAudio.playClick(); } catch (e) {}
                          setZoomedJob(job);
                        }} className={`border transition-all flex flex-col justify-between p-2.5 py-2 rounded-none relative cursor-zoom-in shrink-0 w-[270px] md:w-auto hover:border-amber-500/55 hover:shadow-lg hover:scale-[1.01] ${
                        job.completed
                          ? 'border-emerald-800/10 bg-emerald-950/5 text-emerald-100/40 opacity-60'
                          : isLocked
                            ? 'border-neutral-900 bg-[#0c0c0c] text-white/20'
                            : 'border-amber-900/25 bg-[#14110e] text-white/95 shadow-sm hover:border-amber-700/50'
                      }`}
                    >
                      {/* Pushpin decor */}
                      <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#9f1239] border border-stone-900 shadow pointer-events-none" />

                      <div>
                        {/* Header line of the card */}
                        <div className="flex justify-between items-start mb-1 border-b border-amber-950/20 pb-0.5">
                          <span className="font-mono text-[7px] uppercase tracking-widest text-amber-500/60 font-bold block">
                            Дело #{job.id.split('_').slice(-1)[0]}
                          </span>
                          
                          {job.completed ? (
                            <span className="px-1 py-0.2 border border-emerald-500/20 bg-emerald-950/30 text-emerald-400 text-[6px] font-mono font-bold uppercase tracking-widest rounded-none">
                              РАСКРЫТО ✓
                            </span>
                          ) : isLocked ? (
                            <span className="px-1 py-0.2 border border-red-500/20 bg-red-950/30 text-red-400 text-[5.5px] font-mono font-bold uppercase tracking-widest rounded-none flex items-center gap-1">
                              <Lucide.Lock className="w-2 h-2" /> {job.reputationRequired}★
                            </span>
                          ) : (
                            <span className={`px-1 py-0.2 border text-[5.5px] font-mono font-bold uppercase tracking-widest rounded-none ${
                              job.risk === 'high' 
                                ? 'border-red-500/30 bg-red-950/20 text-red-400' 
                                : job.risk === 'medium'
                                  ? 'border-amber-500/30 bg-amber-950/20 text-amber-400'
                                  : 'border-blue-500/30 bg-blue-950/20 text-blue-400'
                            }`}>
                              {job.risk === 'high' ? '⚠️ ВЫСОКИЙ' : job.risk === 'medium' ? '⚡ СРЕДНИЙ' : '🍃 НИЗКИЙ'}
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h4 className={`font-serif text-[10.5px] font-bold italic mb-0.5 tracking-wide leading-tight ${
                          job.completed ? 'text-emerald-300/25 line-through' : 'text-amber-100'
                        }`}>
                          {job.title}
                        </h4>

                        {/* Description */}
                        <p className="text-[9px] leading-normal text-white/45 mb-1.5 font-sans line-clamp-2">
                          {job.description}
                        </p>

                        {/* Meta stats badges */}
                        <div className="flex justify-between items-center font-mono text-[7.5px] border-t border-amber-950/15 pt-1 mb-1.5 text-white/35">
                          <span className="text-emerald-400 font-bold uppercase tracking-wider">Гонорар: +{job.reward}$</span>
                          {job.timeLimit && (
                            <span className="text-amber-400/80">⏳ {Math.floor(job.timeLimit / 60)} мин.</span>
                          )}
                        </div>
                      </div>

                      {/* Actions footer of the card */}
                      {!job.completed && !isLocked && (
                        <div className="space-y-1 mt-0.5 pt-1 border-t border-amber-950/15">
                          {/* Buy Lead Info Block */}
                          {job.infoCost > 0 && !job.leadPurchased && (
                            <button
                              onClick={() => handleBuyLeadClick(job.id)}
                              disabled={cash < job.infoCost}
                              className="w-full h-6 border border-amber-600/20 hover:border-amber-550 bg-amber-950/15 hover:bg-amber-950/30 text-[7px] font-mono font-bold uppercase tracking-wider text-amber-400 disabled:opacity-40 disabled:pointer-events-none transition-all rounded-none flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Lucide.HelpCircle className="w-2 h-2 text-amber-500" />
                              Купить наводку крысы (-{job.infoCost}$)
                            </button>
                          )}

                          <button
                            onClick={() => handleStartJobClick(job)}
                            disabled={!hasLeadPaid}
                            className={`w-full h-6 font-sans text-[8px] font-bold uppercase tracking-[0.12em] transition-all rounded-none flex items-center justify-center gap-1 cursor-pointer ${
                              !hasLeadPaid
                                ? 'bg-neutral-800 text-white/20 border border-neutral-750 cursor-not-allowed'
                                : 'bg-amber-600 hover:bg-amber-500 text-white shadow active:scale-[0.98]'
                            }`}
                          >
                            <Lucide.Search className="w-2.5 h-2.5" />
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
        )}

        {/* TAB 2: STORY INVESTIGATIONS LOCKED */}
        {activeTab === 'story' && currentDay < 3 && (
          <div className="relative z-10 flex-1 flex flex-col justify-center items-center text-center py-12 border border-dashed border-amber-900/15 bg-amber-950/5 p-6 min-h-[300px] animate-fade-in">
            <Lucide.Lock className="w-10 h-10 text-amber-600/30 mb-3 animate-pulse" />
            <h4 className="font-serif text-sm font-bold text-amber-200 uppercase tracking-wide mb-2">
              Раздел заблокирован
            </h4>
            <p className="font-serif text-[11px] text-amber-200/50 italic max-w-sm leading-relaxed">
              «Сюжетные дела и доступ к допросам свидетелей откроются на 3-й день расследования. Сначала наберитесь опыта и репутации на ежедневных контрактах!»
            </p>
          </div>
        )}

        {/* TAB 2: STORY INVESTIGATIONS ACTIVE */}
        {activeTab === 'story' && currentDay >= 3 && (
          <div className="relative z-10 flex-1 flex flex-col gap-4 animate-fade-in text-left">

            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center border-b border-amber-850/40 pb-2.5 mb-4 gap-3">
              <div className="flex items-center gap-2">
                <Lucide.Compass className="w-4 h-4 text-amber-500 animate-spin" style={{ animationDuration: '8s' }} />
                <h3 className="font-serif text-sm font-bold italic tracking-wide text-amber-100 uppercase">
                  Особые Сюжетные Расследования
                </h3>
              </div>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {/* VIEW SWITCHER */}
                <div className="flex items-center gap-1 bg-black/40 border border-amber-950/40 p-1 shrink-0 select-none">
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
                    <span>Карточки глав</span>
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

                {/* CRIMEBOARD BUTTON */}
                <button
                  onClick={() => {
                    try { gameAudio.playClick(); } catch (e) {}
                    setIsCrimeBoardOpen(true);
                  }}
                  className="px-4 py-1.5 border border-rose-500/35 hover:border-rose-400 bg-rose-950/15 hover:bg-rose-950/30 text-rose-400 font-sans text-[8px] font-bold uppercase tracking-[0.15em] rounded-none transition-all flex items-center justify-center gap-1.5 shadow cursor-pointer"
                >
                  <Lucide.Pin className="w-3 h-3 rotate-45 text-rose-400" />
                  <span>Доска улик</span>
                </button>
              </div>
            </div>

            {storyViewMode === 'cards' ? (
              (() => {
                const activeChapters = campaignChapters.filter((chapter, idx) => {
                  const chNum = idx + 1;
                  const isCompleted = chapter.completed || completedChapters.includes(chNum);
                  return !isCompleted;
                });

                return (
                  <div className="space-y-6">
                    {activeChapters.length === 0 ? (
                      <div className="border border-dashed border-emerald-900/40 bg-emerald-950/5 p-6 text-center">
                        <Lucide.Award className="w-7 h-7 text-emerald-500 mx-auto mb-2" />
                        <h4 className="font-serif text-xs font-bold text-emerald-200 uppercase tracking-wide mb-1">
                          Все сюжетные дела раскрыты!
                        </h4>
                        <p className="font-serif text-[10.5px] italic text-white/60 leading-relaxed max-w-xl mx-auto">
                          «Барт довольно замурчал, поглаживая усы: "Улицы Лондона вздохнули свободно, шеф! Все основные главы раскрыты. Но дела из архива ниже всегда можно пройти бесплатно, либо напишите новый кейс в Кабинете писателя!"»
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
                        {activeChapters.map((chapter) => {
                          const index = campaignChapters.findIndex(c => c.id === chapter.id);
                          const chNum = index + 1;
                          
                          // Romanizing helper
                          const romanize = (num: number): string => {
                            const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
                            return roman[num - 1] || num.toString();
                          };

                          // Dynamic chapter unlocked conditions
                          let isLocked = false;
                          let lockReason = '';

                          if (index > 0) {
                            const prevChapters = campaignChapters;
                            const prevCh = prevChapters[index - 1];
                            const prevChCompleted = prevCh ? (prevCh.completed || completedChapters.includes(chNum - 1)) : false;
                            
                            if (!prevChCompleted) {
                              isLocked = true;
                              lockReason = `Требуется раскрыть Главу ${romanize(chNum - 1)}`;
                            } else if (reputation < chapter.reputationRequired) {
                              isLocked = true;
                              lockReason = `Требуется репутация ${chapter.reputationRequired}★`;
                            }
                          }

                          // Color codes based on chapters and completeness
                          const borderStyles = isLocked
                            ? 'border-neutral-900 bg-neutral-950/50 text-white/30'
                            : chNum === 1
                              ? 'border-amber-900/40 bg-[#1e1713] hover:border-amber-750/60'
                              : chNum % 3 === 2
                                ? 'border-blue-900/40 bg-[#131a22] hover:border-blue-750/60'
                                : 'border-purple-900/40 bg-[#1b1522] hover:border-purple-750/60';

                          const iconsPool = ['Compass', 'Anchor', 'Wind', 'BookOpen', 'Shield', 'Key', 'Eye', 'Map', 'Cat', 'Award'];
                          const iconName = iconsPool[(chNum - 1) % iconsPool.length];
                          const Icon = (Lucide as any)[iconName] || Lucide.FileText;

                          return (
                            <div key={chapter.id} onClick={() => {
                              try { gameAudio.playClick(); } catch (e) {}
                              setZoomedJob(chapter);
                            }} className={`border p-4 flex flex-col justify-between relative transition-all shadow-md cursor-zoom-in hover:scale-[1.01] ${borderStyles}`}>
                              {/* Pushpin decor */}
                              <div className={`absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border shadow pointer-events-none ${
                                isLocked ? 'bg-neutral-800 border-neutral-950' : 'bg-red-700 border-red-950'
                              }`} />

                              <div>
                                <div className="flex justify-between items-start mb-2 border-b border-white/5 pb-1.5">
                                  <span className="font-mono text-[8px] uppercase tracking-wider text-white/40 block">
                                    Сюжет // Глава {romanize(chNum)}
                                  </span>
                                  {isLocked ? (
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
                                    isLocked ? 'text-white/20' : 'text-amber-400'
                                  }`}>
                                    <Icon className="w-3.5 h-3.5" />
                                  </div>
                                  <h4 className="font-serif text-xs font-bold leading-tight text-white">
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
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartJobClick(chapter);
                                  }}
                                  className="w-full h-8 font-sans text-[9px] font-bold uppercase tracking-[0.15em] transition-all bg-amber-600 hover:bg-amber-500 text-white rounded-none flex items-center justify-center gap-1.5"
                                >
                                  <Lucide.Search className="w-3 h-3" />
                                  Начать расследование
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}


                  </div>
                );
              })()
            ) : (
              <SuspectInterrogation 
                gameState={gameState}
                setGameState={setGameState}
                initialActiveSketchId={activeInterrogationSketchId}
              />
            )}
          </div>
        )}

        {/* TAB 3: ARCHIVE */}
        {activeTab === 'archive' && (
          <div className="relative z-10 flex-1 flex flex-col animate-fade-in text-left overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center border-b border-amber-900/40 pb-1.5 mb-2 shrink-0">
              <div className="flex items-center gap-2">
                <Lucide.Archive className="w-4 h-4 text-amber-500" />
                <h3 className="font-serif text-xs sm:text-sm font-bold italic tracking-wide text-amber-100 uppercase">
                  Архив раскрытых и завершенных дел
                </h3>
              </div>
              <span className="font-mono text-[8px] uppercase tracking-widest text-amber-500/40 hidden sm:inline">
                ДЕЛО ЗАКРЫТО // СЕЙФ БЮРО
              </span>
            </div>

            <div className="border border-zinc-850 bg-zinc-950/30 flex-1 flex flex-col overflow-hidden">
              <div className="flex border-b border-zinc-800 bg-black/40 shrink-0 select-none">
                <button
                  onClick={() => {
                    try { gameAudio.playClick(); } catch (e) {}
                    setArchiveSubTab('story');
                  }}
                  className={`px-4 py-2 font-serif text-[10px] uppercase tracking-wider font-bold transition-all border-b-2 rounded-none cursor-pointer ${
                    archiveSubTab === 'story'
                      ? 'border-amber-500 text-white bg-white/5'
                      : 'border-transparent text-white/45 hover:text-white/70 hover:bg-white/5'
                  }`}
                >
                  Сюжетные дела ({archivedChapters.length})
                </button>
                <button
                  onClick={() => {
                    try { gameAudio.playClick(); } catch (e) {}
                    setArchiveSubTab('solo');
                  }}
                  className={`px-4 py-2 font-serif text-[10px] uppercase tracking-wider font-bold transition-all border-b-2 rounded-none cursor-pointer ${
                    archiveSubTab === 'solo'
                      ? 'border-amber-500 text-white bg-white/5'
                      : 'border-transparent text-white/45 hover:text-white/70 hover:bg-white/5'
                  }`}
                >
                  Одиночные дела ({archivedSoloJobs.length})
                </button>
              </div>

              <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
                {archiveSubTab === 'story' ? (
                  archivedChapters.length === 0 ? (
                    <p className="font-serif text-[10px] text-white/35 italic text-center py-6">
                      Нет раскрытых сюжетных дел.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {archivedChapters.map((chapter) => {
                        const index = campaignChapters.findIndex(c => c.id === chapter.id);
                        const chNum = index + 1;
                        
                        const romanize = (num: number): string => {
                          const roman = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
                          return roman[num - 1] || num.toString();
                        };

                        const iconsPool = ['Compass', 'Anchor', 'Wind', 'BookOpen', 'Shield', 'Key', 'Eye', 'Map', 'Cat', 'Award'];
                        const iconName = iconsPool[(chNum - 1) % iconsPool.length];
                        const Icon = (Lucide as any)[iconName] || Lucide.FileText;

                        return (
                          <div 
                            key={chapter.id} 
                            onClick={() => {
                              try { gameAudio.playClick(); } catch (e) {}
                              setZoomedJob(chapter);
                            }}
                            className="border border-emerald-950/30 bg-emerald-950/5 text-emerald-100/60 p-4 flex flex-col justify-between relative shadow-inner cursor-zoom-in hover:border-emerald-700/50 hover:bg-emerald-950/10 transition-all hover:scale-[1.01]"
                          >
                            <div>
                              <div className="flex justify-between items-start mb-2 border-b border-emerald-950/20 pb-1.5">
                                <span className="font-mono text-[8px] uppercase tracking-wider text-emerald-500/55 block">
                                  Сюжет // Глава {romanize(chNum)}
                                </span>
                                <span className="px-1.5 py-0.5 border border-emerald-500/20 bg-emerald-950/40 text-emerald-400 text-[7px] font-mono font-bold uppercase tracking-widest rounded-none">
                                  РАСКРЫТО ✓
                                </span>
                              </div>

                              <div className="flex gap-2 items-start mb-2">
                                <div className="p-1.5 bg-black/40 border border-white/5 shrink-0 text-emerald-500/50">
                                  <Icon className="w-3.5 h-3.5" />
                                </div>
                                <h4 className="font-serif text-xs font-bold leading-tight text-emerald-200/50">
                                  {chapter.title}
                                </h4>
                              </div>

                              <p className="text-[10px] leading-relaxed text-emerald-100/40 mb-4 font-sans line-clamp-3 italic">
                                {chapter.description}
                              </p>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartJobClick(chapter);
                              }}
                              className="w-full h-8 font-sans text-[9px] font-bold uppercase tracking-[0.15em] transition-all rounded-none flex items-center justify-center gap-1.5 bg-zinc-950 border border-zinc-800 hover:border-emerald-700 hover:bg-emerald-950/20 text-emerald-400 hover:text-emerald-300 shadow cursor-pointer"
                            >
                              <Lucide.RotateCcw className="w-3 h-3 text-emerald-500" />
                              Перепройти бесплатно
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )
                ) : (
                  archivedSoloJobs.length === 0 ? (
                    <p className="font-serif text-[10px] text-white/35 italic text-center py-6">
                      Нет завершенных одиночных дел. Раскройте ежедневные контракты или дела писателя, чтобы они переместились сюда!
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {archivedSoloJobs.map((job) => {
                        return (
                          <div 
                            key={job.id} 
                            onClick={() => {
                              try { gameAudio.playClick(); } catch (e) {}
                              setZoomedJob(job);
                            }}
                            className="border border-emerald-950/30 bg-emerald-950/5 text-emerald-100/60 p-4 flex flex-col justify-between relative shadow-inner cursor-zoom-in hover:border-emerald-700/50 hover:bg-emerald-950/10 transition-all hover:scale-[1.01]"
                          >
                            <div>
                              <div className="flex justify-between items-start mb-2 border-b border-emerald-950/20 pb-1.5">
                                <span className="font-mono text-[8px] uppercase tracking-wider text-emerald-500/55 block">
                                  Дело #{job.id.split('_').slice(-1)[0]}
                                </span>
                                <span className="px-1.5 py-0.5 border border-emerald-500/20 bg-emerald-950/40 text-emerald-400 text-[7px] font-mono font-bold uppercase tracking-widest rounded-none">
                                  В АРХИВЕ ✓
                                </span>
                              </div>

                              <div className="flex gap-2 items-start mb-2">
                                <div className="p-1.5 bg-black/40 border border-white/5 shrink-0 text-emerald-500/50">
                                  <Lucide.FileText className="w-3.5 h-3.5" />
                                </div>
                                <h4 className="font-serif text-xs font-bold leading-tight text-emerald-200/50">
                                  {job.title}
                                </h4>
                              </div>

                              <p className="text-[10px] leading-relaxed text-emerald-100/40 mb-4 font-sans line-clamp-3 italic">
                                {job.description}
                              </p>

                              {(() => {
                                const parentFolder = (gameState.caseFolders ?? []).find(f => f.caseIds.includes(job.id));
                                if (parentFolder) {
                                  return (
                                    <div className="mb-4 p-1.5 bg-neutral-950/80 border border-emerald-950/25 text-[8.5px] font-serif text-emerald-400/80 italic">
                                      📁 Подшито в роман-папку: <span className="font-bold text-emerald-300">«{parentFolder.title}»</span>
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </div>

                            <div className="space-y-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartJobClick(job);
                                }}
                                className="w-full h-8 font-sans text-[9px] font-bold uppercase tracking-[0.15em] transition-all rounded-none flex items-center justify-center gap-1.5 bg-zinc-950 border border-zinc-800 hover:border-emerald-700 hover:bg-emerald-950/20 text-emerald-400 hover:text-emerald-300 shadow cursor-pointer"
                              >
                                <Lucide.RotateCcw className="w-3 h-3 text-emerald-500" />
                                Перепройти бесплатно
                              </button>

                              {(() => {
                                const parentFolder = (gameState.caseFolders ?? []).find(f => f.caseIds.includes(job.id));
                                const isFiled = !!parentFolder;

                                if (isFiled) {
                                  return (
                                    <div className="text-center text-[8px] font-mono text-emerald-500/55 uppercase py-1 border border-dashed border-emerald-950/35 bg-emerald-950/5">
                                      Подшито ✓
                                    </div>
                                  );
                                }

                                const activeFolders = (gameState.caseFolders ?? []).filter(f => f.status === 'writing');

                                if (fileJobId === job.id) {
                                  return (
                                    <div 
                                      onClick={(e) => e.stopPropagation()}
                                      className="bg-zinc-950 p-2 border border-amber-900/35 space-y-1.5 text-left animate-fade-in relative z-20 cursor-default"
                                    >
                                      <div className="text-[7.5px] font-mono text-amber-500 font-bold uppercase">
                                        Выберите роман-папку:
                                      </div>
                                      {activeFolders.length > 0 ? (
                                        <div className="space-y-1 max-h-[80px] overflow-y-auto custom-scrollbar">
                                          {activeFolders.map(folder => (
                                            <button
                                              key={folder.id}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleFileCaseToFolder(folder.id, job.id);
                                              }}
                                              className="w-full text-left px-2 py-1 bg-[#141210] hover:bg-amber-950/30 border border-white/5 text-[9px] font-serif text-white truncate hover:border-amber-500/30 transition-all cursor-pointer block"
                                            >
                                              📁 «{folder.title}»
                                            </button>
                                          ))}
                                        </div>
                                      ) : (
                                        <div className="text-[8px] font-serif text-white/40 italic leading-tight">
                                          Нет активных романов-папок. Создайте их в Кабинете писателя!
                                        </div>
                                      )}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setFileJobId(null);
                                        }}
                                        className="w-full py-0.5 border border-white/10 hover:bg-white/5 text-center text-[7.5px] font-mono text-white/50 uppercase cursor-pointer block"
                                      >
                                        Отмена
                                      </button>
                                    </div>
                                  );
                                }

                                return (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      try { gameAudio.playClick(); } catch (e) {}
                                      setFileJobId(job.id);
                                    }}
                                    className="w-full h-8 font-sans text-[9px] font-bold uppercase tracking-[0.15em] transition-all rounded-none flex items-center justify-center gap-1.5 bg-[#12100e] border border-amber-900/35 hover:border-amber-550 hover:bg-amber-950/20 text-amber-500 hover:text-amber-400 shadow cursor-pointer"
                                  >
                                    <Lucide.FolderPlus className="w-3 h-3 text-amber-500" />
                                    Подшить в роман
                                  </button>
                                );
                              })()}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>



      {/* DETACHED POPUP MODAL FOR INTERACTIVE CORKBOARD */}
      {isCrimeBoardOpen && createPortal(
        <div className="fixed inset-0 z-[100] bg-black/85 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="relative w-full max-w-4xl border-2 border-amber-950/80 bg-[#120e0b] shadow-2xl overflow-hidden flex flex-col p-4 animate-scale-up">
            {/* Wooden background */}
            <div className="absolute inset-0 bg-[radial-gradient(#1a1410_1px,transparent_1px)] [background-size:16px_16px] opacity-25 pointer-events-none" />
            <div className="flex justify-between items-center border-b border-amber-900/40 pb-2 mb-3 relative z-10">
              <div className="flex items-center gap-1.5">
                <Lucide.Compass className="w-4 h-4 text-amber-500 animate-spin" style={{ animationDuration: '10s' }} />
                <h3 className="font-serif text-sm font-bold tracking-wide text-amber-200 uppercase">
                  Интерактивная доска улик бюро
                </h3>
              </div>
              <button
                onClick={() => {
                  try { gameAudio.playClick(); } catch (e) {}
                  setIsCrimeBoardOpen(false);
                }}
                className="px-3 py-1 bg-amber-950/40 hover:bg-amber-950/70 border border-amber-900/30 text-amber-400 text-xs font-mono font-bold uppercase transition-all rounded-none cursor-pointer"
              >
                [ Закрыть × ]
              </button>
            </div>
            
            <div className="relative z-10">
              <CrimeBoard 
                gameState={gameState}
                STORY_CHAPTERS_DATA={gameState.campaignChapters && gameState.campaignChapters.length > 0 
                  ? gameState.campaignChapters 
                  : STORY_CHAPTERS_DATA}
                onSelectJob={(job) => {
                  setIsCrimeBoardOpen(false);
                  handleStartJobClick(job);
                }}
              />
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Witness Interrogation Recommendation warning popup */}
      {pendingJob && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="max-w-md w-full border border-amber-900/50 bg-[#0d0907] p-6 relative shadow-2xl animate-fade-in flex flex-col">
            <div className="absolute inset-1.5 border border-white/5 pointer-events-none" />
            
            <div className="flex justify-between items-start border-b border-amber-950/30 pb-2.5 mb-4">
              <span className="font-mono text-[8px] text-amber-500/70 uppercase tracking-[0.25em] block">
                🚨 РЕКОМЕНДАЦИЯ БЮРО ВАНСА
              </span>
              <button 
                onClick={() => setPendingJob(null)}
                className="text-white/40 hover:text-white font-mono text-[9px] uppercase tracking-wider"
              >
                [Закрыть]
              </button>
            </div>

            <div className="flex gap-3.5 items-start mb-4">
              <div className="w-12 h-12 rounded-none border border-amber-500/20 bg-amber-950/30 flex items-center justify-center shrink-0">
                <Lucide.UserCheck className="w-6 h-6 text-amber-500 animate-pulse" />
              </div>
              <div>
                <h4 className="font-serif text-sm font-black text-amber-100 uppercase tracking-wide mb-1">
                  Свидетели еще не допрошены!
                </h4>
                <p className="font-serif text-[11px] italic text-white/70 leading-relaxed">
                  «Миднайт подозрительно мяукнул, а Барт почесал затылок: "Погоди-ка, напарник! Мы ведь еще не завершили составление фотороботов во вкладке <strong>'Допрос свидетелей'</strong>. Допрос дает 100% точные приметы подозреваемого (шляпу, цвет костюма, очки). Без фоторобота искать улики на месте будет в разы сложнее!"»
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 mt-2">
              <button
                onClick={() => {
                  try { gameAudio.playClick(); } catch (e) {}
                  setStoryViewMode('interrogate');
                  setPendingJob(null);
                }}
                className="flex-1 h-9 bg-amber-600 hover:bg-amber-500 text-white font-sans text-[10px] font-bold uppercase tracking-wider transition-all rounded-none flex items-center justify-center gap-1.5 shadow"
              >
                <Lucide.UserCheck className="w-4 h-4" />
                Допросить свидетелей
              </button>
              <button
                onClick={() => {
                  try { gameAudio.playClick(); } catch (e) {}
                  const jobToStart = pendingJob;
                  setPendingJob(null);
                  onSelectJob(jobToStart);
                }}
                className="flex-1 h-9 border border-white/10 hover:border-white/30 hover:bg-white/5 text-white/60 hover:text-white font-sans text-[10px] font-bold uppercase tracking-wider transition-all rounded-none flex items-center justify-center gap-1.5"
              >
                Выехать всё равно 🕵️‍♂️
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Story Campaign / Chapter Unlock Popup */}
      {unacknowledgedChapter && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="max-w-md w-full border-2 border-amber-500/30 bg-[#0d0907] p-6 relative shadow-2xl animate-fade-in flex flex-col">
            <div className="absolute inset-1.5 border border-white/5 pointer-events-none" />
            
            <div className="flex justify-between items-start border-b border-amber-950/30 pb-2.5 mb-4">
              <span className="px-1.5 py-0.5 border border-amber-500/30 bg-amber-950/30 text-amber-400 text-[8px] font-mono font-bold uppercase tracking-widest leading-none">
                ★ СЕНСАЦИЯ В СВОДКАХ ★
              </span>
              <button 
                onClick={() => {
                  try { gameAudio.playClick(); } catch (e) {}
                  handleAcknowledgeChapter(false);
                }}
                className="text-white/40 hover:text-white font-mono text-[9px] uppercase tracking-wider cursor-pointer"
              >
                [Закрыть]
              </button>
            </div>

            <div className="flex gap-3.5 items-start mb-4">
              <div className="w-12 h-12 rounded-none border border-amber-500/20 bg-[#16100c] flex items-center justify-center shrink-0">
                <Lucide.Megaphone className="w-6 h-6 text-amber-500 animate-bounce" />
              </div>
              <div>
                <h4 className="font-serif text-sm font-black text-amber-100 uppercase tracking-wide mb-1.5 leading-tight">
                  {unacknowledgedChapter.id === 'story_chapter_1' 
                    ? 'Доступно многосерийное сюжетное расследование!' 
                    : 'Доступна новая сюжетная глава!'}
                </h4>
                
                {unacknowledgedChapter.id === 'story_chapter_1' ? (
                  <p className="font-serif text-[11px] italic text-white/70 leading-relaxed">
                    «Барт развернул свежий выпуск газеты с чашкой утреннего кофе: "Глянь на первую полосу, Барт! Нам бросил вызов настоящий криминальный синдикат. Дело состоит из нескольких связанных глав. Когти к бою, усатый детектив!"»
                  </p>
                ) : (
                  <div className="space-y-2">
                    <p className="font-serif text-[11px] italic text-white/70 leading-relaxed">
                      «Мы раскрыли предыдущую главу, и перед нами открывается новое дело:»
                    </p>
                    <div className="p-2 border border-amber-950/30 bg-[#140e0b] font-serif text-[11px]">
                      <span className="text-amber-400 font-bold block mb-0.5">{unacknowledgedChapter.title}</span>
                      <span className="text-white/50 block line-clamp-2">{unacknowledgedChapter.description}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 mt-2">
              <button
                onClick={() => {
                  try { gameAudio.playClick(); } catch (e) {}
                  handleAcknowledgeChapter(true);
                }}
                className="flex-1 h-9 bg-amber-600 hover:bg-amber-500 text-white font-sans text-[10px] font-bold uppercase tracking-wider transition-all rounded-none flex items-center justify-center gap-1.5 shadow cursor-pointer"
              >
                <Lucide.Compass className="w-4 h-4" />
                Открыть расследования
              </button>
              <button
                onClick={() => {
                  try { gameAudio.playClick(); } catch (e) {}
                  handleAcknowledgeChapter(false);
                }}
                className="flex-1 h-9 border border-white/10 hover:border-white/30 hover:bg-white/5 text-white/60 hover:text-white font-sans text-[10px] font-bold uppercase tracking-wider transition-all rounded-none flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Позже
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Zoomed Case dossier detail popup */}
      {zoomedJob && (() => {
        const isStoryOrCampaign = zoomedJob.id.startsWith('story_') || zoomedJob.id.startsWith('custom_campaign_ch_');
        
        const getChapterNum = (job: Job) => {
          if (job.id.startsWith('story_chapter_')) {
            return parseInt(job.id.replace('story_chapter_', ''), 10);
          }
          const campaignChapters = gameState.campaignChapters && gameState.campaignChapters.length > 0
            ? gameState.campaignChapters
            : STORY_CHAPTERS_DATA;
          const index = campaignChapters.findIndex(c => c.id === job.id);
          return index !== -1 ? index + 1 : 1;
        };

        const chNum = getChapterNum(zoomedJob);
        const isJobCompleted = zoomedJob.completed || (isStoryOrCampaign && completedChapters.includes(chNum));
        const isJobLocked = reputation < zoomedJob.reputationRequired;
        const hasLeadPaid = zoomedJob.infoCost === 0 || zoomedJob.leadPurchased;

        return (
          <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-md">
            <div className="max-w-lg w-full border border-amber-900/50 bg-[#0d0a08] p-6 sm:p-7 relative shadow-2xl animate-fade-in flex flex-col text-left">
              <div className="absolute inset-1.5 border border-white/5 pointer-events-none" />
              
              {/* Pushpin decor */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-red-700 border-2 border-stone-900 shadow-xl z-20 flex items-center justify-center pointer-events-none">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              </div>

              {/* Solved / Archived Stamp */}
              {isJobCompleted && (
                <div className="absolute top-12 right-6 border-2 border-dashed border-emerald-500/40 text-emerald-400 font-serif text-[11px] font-bold uppercase tracking-widest px-3 py-1 rotate-12 select-none z-20 pointer-events-none bg-emerald-950/20 backdrop-blur-[1px]">
                  РАСКРЫТО ✓
                </div>
              )}
              {isJobLocked && (
                <div className="absolute top-12 right-6 border-2 border-dashed border-red-500/40 text-red-400 font-serif text-[11px] font-bold uppercase tracking-widest px-3 py-1 -rotate-12 select-none z-20 pointer-events-none bg-red-950/20 backdrop-blur-[1px]">
                  ЗАКРЫТО 🔒
                </div>
              )}

              {/* Dossier Header */}
              <div className="flex justify-between items-start border-b border-amber-950/30 pb-2.5 mb-4">
                <div>
                  <span className="font-mono text-[8px] text-amber-500/70 uppercase tracking-[0.25em] block mb-0.5">
                    📂 УГОЛОВНОЕ ДЕЛО №{zoomedJob.id.split('_').slice(-1)[0].toUpperCase()}
                  </span>
                  <span className="font-serif text-[9px] text-white/40 italic uppercase tracking-wider block">
                    {isStoryOrCampaign ? `СЮЖЕТНАЯ КАМПАНИЯ // ГЛАВА ${chNum}` : 'ОДИНАРНЫЙ УЛИЧНЫЙ КОНТРАКТ'}
                  </span>
                </div>
                <button 
                  onClick={() => {
                    try { gameAudio.playClick(); } catch (e) {}
                    setZoomedJob(null);
                  }}
                  className="text-white/40 hover:text-white font-mono text-[9px] uppercase tracking-wider border border-white/10 hover:border-white/30 px-2 py-0.5 transition-all cursor-pointer bg-white/5"
                >
                  [Закрыть]
                </button>
              </div>

              {/* Content Body */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-serif text-base font-bold text-amber-100 uppercase tracking-wide leading-snug">
                    {zoomedJob.title || zoomedJob.caseName}
                  </h4>
                </div>

                <div className="p-3 border border-amber-950/20 bg-[#120e0c] font-serif text-[11.5px] italic text-white/80 leading-relaxed max-h-[140px] overflow-y-auto custom-scrollbar">
                  «{zoomedJob.description}»
                </div>

                {/* Dossier Meta Grid */}
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono border-t border-b border-amber-950/20 py-3 my-2 text-white/70">
                  <div className="flex items-center gap-1.5">
                    <Lucide.Award className="w-3.5 h-3.5 text-amber-500/80" />
                    <span>Репутация: <strong className="text-amber-400">{zoomedJob.reputationRequired}★</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Lucide.AlertTriangle className={`w-3.5 h-3.5 ${
                      zoomedJob.risk === 'high' ? 'text-red-500' : zoomedJob.risk === 'medium' ? 'text-amber-500' : 'text-blue-400'
                    }`} />
                    <span>Сложность: <strong className={
                      zoomedJob.risk === 'high' ? 'text-red-400' : zoomedJob.risk === 'medium' ? 'text-amber-400' : 'text-blue-400'
                    }>
                      {zoomedJob.risk === 'high' ? 'Высокая' : zoomedJob.risk === 'medium' ? 'Средняя' : 'Низкая'}
                    </strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Lucide.DollarSign className="w-3.5 h-3.5 text-emerald-500/80" />
                    <span>Гонорар: <strong className="text-emerald-400">+{zoomedJob.reward}$</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Lucide.Clock className="w-3.5 h-3.5 text-amber-500/80" />
                    <span>Время: <strong className="text-white">{zoomedJob.timeLimit ? `${Math.floor(zoomedJob.timeLimit / 60)} мин.` : 'Без лимита'}</strong></span>
                  </div>
                </div>

                {/* Lead / Hint status block */}
                {!isJobLocked && !isJobCompleted && (
                  <div className="p-2.5 border border-amber-950/20 bg-black/30 flex items-center justify-between text-[10px] font-mono">
                    <div className="flex items-center gap-1.5 text-white/60">
                      <Lucide.HelpCircle className={`w-4 h-4 ${hasLeadPaid ? 'text-emerald-400' : 'text-amber-500 animate-pulse'}`} />
                      <span>Наводка:</span>
                      <span className={hasLeadPaid ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                        {hasLeadPaid ? 'ПОЛУЧЕНА ✓' : 'ТРЕБУЕТСЯ КУПИТЬ ⚠️'}
                      </span>
                    </div>
                    {zoomedJob.infoCost > 0 && !zoomedJob.leadPurchased && (
                      <button
                        onClick={() => {
                          handleBuyLeadClick(zoomedJob.id);
                          setZoomedJob(prev => prev ? { ...prev, leadPurchased: true } : null);
                        }}
                        disabled={cash < zoomedJob.infoCost}
                        className="px-2.5 py-1 border border-amber-600/30 hover:border-amber-500 bg-amber-950/20 hover:bg-amber-950/40 text-[9px] font-bold text-amber-400 disabled:opacity-40 disabled:pointer-events-none transition-all rounded-none cursor-pointer"
                      >
                        Купить (-{zoomedJob.infoCost}$)
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="flex flex-col sm:flex-row gap-2.5 mt-5">
                <button
                  onClick={() => {
                    try { gameAudio.playClick(); } catch (e) {}
                    setZoomedJob(null);
                  }}
                  className="flex-1 h-9 border border-white/10 hover:border-white/30 hover:bg-white/5 text-white/60 hover:text-white font-sans text-[10px] font-bold uppercase tracking-wider transition-all rounded-none flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Закрыть досье
                </button>

                {!isJobLocked && (
                  <button
                    onClick={() => {
                      setZoomedJob(null);
                      handleStartJobClick(zoomedJob);
                    }}
                    disabled={!hasLeadPaid}
                    className={`flex-1 h-9 font-sans text-[10px] font-bold uppercase tracking-wider transition-all rounded-none flex items-center justify-center gap-1.5 cursor-pointer ${
                      !hasLeadPaid
                        ? 'bg-neutral-800 text-white/20 border border-neutral-750 cursor-not-allowed'
                        : 'bg-amber-600 hover:bg-amber-500 text-white shadow'
                    }`}
                  >
                    <Lucide.Search className="w-4 h-4" />
                    {isJobCompleted ? 'Перепройти бесплатно' : !hasLeadPaid ? 'Требуется наводка' : 'Начать следствие'}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
