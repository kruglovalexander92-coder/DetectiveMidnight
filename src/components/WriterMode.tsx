/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { GameState, Job, CaseFolder } from "../types";
import * as Lucide from "lucide-react";
import { gameAudio } from "../utils/AudioEngine";
import { extractCaseTags, evaluateCaseFolder } from "../utils/tagHelper";

interface WriterModeProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  onClose: () => void;
}

export default function WriterMode({
  gameState,
  setGameState,
  onClose,
}: WriterModeProps) {
  const [writeType, setWriteType] = useState<"single" | "campaign">("single");
  const [ideaText, setIdeaText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<any>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [writerError, setWriterError] = useState<string | null>(null);
  const [isShiftActive, setIsShiftActive] = useState(false);

  const [rightPanelTab, setRightPanelTab] = useState<'novels' | 'folders'>('novels');
  const [newFolderTitle, setNewFolderTitle] = useState('');
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);

  const handleCreateFolder = () => {
    if (!newFolderTitle.trim()) return;
    try { gameAudio.playClick(); } catch (e) {}
    const newFolder: CaseFolder = {
      id: `folder_${Date.now()}`,
      title: newFolderTitle.trim(),
      tags: [],
      caseIds: [],
      status: 'writing',
      timestamp: new Date().toLocaleDateString('ru-RU'),
    };
    setGameState(prev => ({
      ...prev,
      caseFolders: [...(prev.caseFolders ?? []), newFolder]
    }));
    setNewFolderTitle('');
    setShowNewFolderInput(false);
  };

  const handleFileCaseToFolder = (folderId: string, caseId: string) => {
    try { gameAudio.playClick(); } catch (e) {}
    setGameState(prev => {
      const folders = (prev.caseFolders ?? []).map(f => {
        if (f.id === folderId) {
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
  };

  const handleUnfileCase = (folderId: string, caseId: string) => {
    try { gameAudio.playClick(); } catch (e) {}
    setGameState(prev => {
      const folders = (prev.caseFolders ?? []).map(f => {
        if (f.id === folderId) {
          const updatedIds = f.caseIds.filter(id => id !== caseId);
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
  };

  const handlePublishFolder = (folderId: string) => {
    try {
      gameAudio.playClick();
      gameAudio.playClueFound();
    } catch (e) {}
    
    setGameState(prev => {
      const folder = (prev.caseFolders ?? []).find(f => f.id === folderId);
      if (!folder) return prev;
      
      const evalResult = evaluateCaseFolder(folder.caseIds, prev.availableJobs ?? []);
      
      const updatedFolders = (prev.caseFolders ?? []).map(f => {
        if (f.id === folderId) {
          return {
            ...f,
            status: 'published' as const,
            rating: evalResult.rating,
            review: evalResult.review,
            bestsellerRank: evalResult.score,
            profit: evalResult.profit,
            tags: evalResult.allTags.slice(0, 4)
          };
        }
        return f;
      });
      
      return {
        ...prev,
        caseFolders: updatedFolders,
        writerRoyalties: (prev.writerRoyalties ?? 0) + evalResult.profit
      };
    });
  };

  // Claim Royalties sound handler
  const claimRoyalties = () => {
    const royalties = gameState.writerRoyalties ?? 0;
    if (royalties <= 0) return;

    try {
      gameAudio.playClick();
      gameAudio.playClueFound();
    } catch (e) {}

    setGameState((prev) => ({
      ...prev,
      writerRoyalties: 0,
      writerTotalEarned: (prev.writerTotalEarned ?? 0) + royalties,
      economy: {
        ...prev.economy!,
        cash: (prev.economy?.cash ?? 150) + royalties,
      },
    }));
  };

  // Keyboard keys layouts (Russian Cyrillic + English fallback)
  const keyboardRows = [
    ["Й", "Ц", "У", "К", "Е", "Н", "Г", "Ш", "Щ", "З", "Х", "Ъ"],
    ["Ф", "Ы", "В", "А", "П", "Р", "О", "Л", "Д", "Ж", "Э"],
    ["Я", "Ч", "С", "М", "И", "Т", "Ь", "Б", "Ю", ",", "."],
  ];

  // Handle typing sounds and animations for virtual/physical typing
  const handleKeyTrigger = (char: string) => {
    try {
      gameAudio.playTypewriterKey();
    } catch (e) {}
    setActiveKey(char);
    setTimeout(() => setActiveKey(null), 100);
  };

  // Physical keyboard hook
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept global shortcuts if focused on other things, but play typewriter keys
      if (e.key.length === 1) {
        handleKeyTrigger(e.key.toUpperCase());
      } else if (e.key === "Enter") {
        try {
          gameAudio.playTypewriterBell();
        } catch (err) {}
      } else if (e.key === "Backspace") {
        try {
          gameAudio.playTypewriterKey();
        } catch (err) {}
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleVirtualKeyPress = (char: string) => {
    handleKeyTrigger(char);
    const addedChar = isShiftActive ? char.toUpperCase() : char.toLowerCase();
    setIdeaText((prev) => prev + addedChar);
    setIsShiftActive(false); // Reset shift state after one key is entered
    setWriterError(null);
  };

  const handleBackspacePress = () => {
    try {
      gameAudio.playTypewriterKey();
    } catch (e) {}
    setIdeaText((prev) => prev.slice(0, -1));
    setWriterError(null);
  };

  const handleSpacePress = () => {
    try {
      gameAudio.playTypewriterKey();
    } catch (e) {}
    setIdeaText((prev) => prev + " ");
    setWriterError(null);
  };

  const handleEnterPress = () => {
    try {
      gameAudio.playTypewriterBell();
    } catch (e) {}
    setIdeaText((prev) => prev + "\n");
    setWriterError(null);
  };

  // Generate the story!
  const handleGenerate = async () => {
    if (isGenerating) return;

    if (!ideaText.trim()) {
      setWriterError("Пожалуйста, напишите краткую идею дела или замысел романа на листе перед запуском!");
      try {
        gameAudio.playClick();
      } catch (e) {}
      return;
    }

    // Limit check
    if (writeType === "single") {
      const casesToday = gameState.writerCasesToday ?? 0;
      if (casesToday >= 2) {
        setWriterError("Дневной лимит исчерпан: вы можете написать только 2 дела в день. Купите кофе и сигареты в лавке подворотни для сброса!");
        try { gameAudio.playClick(); } catch (e) {}
        return;
      }
    } else {
      const currentDay = gameState.currentDay ?? 1;
      const lastNovelDay = gameState.writerNovelLastDay;
      if (lastNovelDay !== undefined && (currentDay - lastNovelDay) < 3) {
        const remainingDays = 3 - (currentDay - lastNovelDay);
        setWriterError(`Лимит романов: писать роман можно раз в 3 дня. Откат спадет через ${remainingDays} дн. Купите кофе и сигареты в лавке подворотни!`);
        try { gameAudio.playClick(); } catch (e) {}
        return;
      }
    }

    try {
      gameAudio.playClick();
      gameAudio.playTypewriterBell();
    } catch (e) {}

    setWriterError(null);
    setIsGenerating(true);
    setGenerationResult(null);

    const startTime = Date.now();

    try {
      const response = await fetch("/api/writer/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: writeType, idea: ideaText }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Ошибка генерации дела");
      }

      // Ensure a minimum delay of 1800ms to let the user see the gorgeous loading sequence and explanation
      const elapsed = Date.now() - startTime;
      const minDelay = 1800;
      if (elapsed < minDelay) {
        await new Promise((resolve) => setTimeout(resolve, minDelay - elapsed));
      }

      setGenerationResult(data);

      // Successfully integrated into state
      if (writeType === "single") {
        // Create custom job object
        const customJob: Job = {
          id: `custom_job_${Date.now()}`,
          caseName: data.caseName || "Спецзадание",
          title: data.title || "Особое поручение",
          description: data.description || "Новое дело",
          reward: data.reward || 300,
          reputationRequired: 0,
          infoCost: 0,
          timeLimit: null,
          risk: data.risk || "medium",
          roomTemplateId: data.roomTemplateId || "room_antique",
          completed: false,
          leadPurchased: true, // Custom stories have free leads
        };

        setGameState((prev) => ({
          ...prev,
          availableJobs: [customJob, ...(prev.availableJobs ?? [])],
          writerCasesToday: (prev.writerCasesToday ?? 0) + 1,
        }));
      } else {
        // Campaign chapters
        const customChapters: Job[] = data.chapters.map((ch: any, idx: number) => ({
          id: `custom_campaign_ch_${idx + 1}_${Date.now()}`,
          caseName: ch.caseName || `Глава ${idx + 1}`,
          title: ch.title || `Расследование ${idx + 1}`,
          description: ch.description || `Глава сюжетной кампании`,
          reward: ch.reward || (250 + idx * 100),
          reputationRequired: 0,
          infoCost: 0,
          timeLimit: idx === data.chapters.length - 1 ? 150 : null, // Final chapter time limit!
          risk: ch.risk || "medium",
          roomTemplateId: ch.roomTemplateId || "room_antique",
          completed: false,
        }));

        setGameState((prev) => ({
          ...prev,
          campaignChapters: customChapters,
          customCampaignIdea: ideaText,
          customCampaignTitle: data.chapters[data.chapters.length - 1]?.title || "Повесть о Миднайте",
          writerNovelLastDay: prev.currentDay ?? 1,
        }));
      }
    } catch (err: any) {
      console.error(err);
      alert("Не удалось связаться с издательством. Проверьте подключение.");
    } finally {
      setIsGenerating(false);
    }
  };

  const clearWriterResults = () => {
    try {
      gameAudio.playClick();
    } catch (e) {}
    setGenerationResult(null);
    setIdeaText("");
    setWriterError(null);
  };

  const casesToday = gameState.writerCasesToday ?? 0;
  const lastNovelDay = gameState.writerNovelLastDay;
  const currentDay = gameState.currentDay ?? 1;
  const isNovelAvailable = lastNovelDay === undefined || (currentDay - lastNovelDay) >= 3;
  const remainingDays = lastNovelDay !== undefined ? 3 - (currentDay - lastNovelDay) : 0;

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex flex-col p-3 md:p-4 select-none overflow-hidden">
      {/* HEADER BAR */}
      <div className="flex justify-between items-center border-b border-white/10 pb-2.5 mb-3 shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <Lucide.PenTool className="w-4 h-4 md:w-5 md:h-5 text-amber-500 animate-pulse" />
          <div>
            <h2 className="font-serif text-sm md:text-base font-bold text-white tracking-wide uppercase italic">
              Писательский Кабинет
            </h2>
            <p className="text-[8px] md:text-[9px] font-mono text-white/40 uppercase tracking-widest">
              ROYAL TYPEWRITER CO. // СОАВТОРСТВО С ИИ
            </p>
          </div>
        </div>

        {/* LIMITS COUNTER DISPLAY */}
        <div className="flex items-center gap-3 bg-[#0d0d0f] px-3 py-1.5 border border-white/5 font-mono text-[8px] md:text-[9px] text-white/75 select-none">
          <div className="flex items-center gap-1.5 border-r border-white/10 pr-3">
            <span className="text-white/40">ДЕЛА СЕГОДНЯ:</span>
            <span className={casesToday >= 2 ? "text-red-400 font-bold animate-pulse" : "text-emerald-400 font-bold"}>
              {Math.max(0, 2 - casesToday)} / 2
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-white/40">БУЛЬВАРНЫЙ РОМАН:</span>
            {isNovelAvailable ? (
              <span className="text-emerald-400 font-bold">ДОСТУПЕН</span>
            ) : (
              <span className="text-amber-500 font-bold">ОТКАТ {remainingDays} ДН.</span>
            )}
          </div>
        </div>

        <button
          onClick={() => {
            try {
              gameAudio.playClick();
            } catch (e) {}
            onClose();
          }}
          className="h-7.5 px-3 md:h-8 md:px-4 border border-white/15 hover:border-white/40 bg-neutral-950 hover:bg-neutral-900 text-white/70 hover:text-white font-mono text-[8px] md:text-[9px] uppercase tracking-widest transition-all cursor-pointer"
        >
          ← Вернуться в Бюро
        </button>
      </div>

      {/* MAIN CONTAINER */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-stretch min-h-0 overflow-y-auto lg:overflow-hidden">
        
        {/* LEFT/CENTER: THE ROYAL TYPEWRITER DESK */}
        <div className="lg:col-span-8 border border-neutral-800 bg-[#0c0c0d] p-3 md:p-4 flex flex-col justify-between relative shadow-inner overflow-hidden min-h-[450px] lg:min-h-0">
          {/* Desk leather texture background pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#141414_1px,transparent_1px)] [background-size:12px_12px] opacity-40 pointer-events-none" />
          
          {/* Top mechanical roller / typewriter bar decor */}
          <div className="relative h-10 w-full bg-neutral-900 border-y border-stone-800 shrink-0 flex items-center justify-between px-4 z-10">
            <div className="w-4 h-6 bg-stone-700 border border-stone-600 rounded-sm shadow" />
            <div className="flex-1 mx-2 h-2.5 bg-neutral-950 border border-stone-800/80 rounded-full overflow-hidden flex items-center">
              <div className="h-[2px] bg-amber-500/20 w-full animate-pulse" />
            </div>
            <div className="w-4 h-6 bg-stone-700 border border-stone-600 rounded-sm shadow" />
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 bg-stone-800 text-[7px] text-stone-500 font-mono tracking-widest px-1.5 border border-stone-700 select-none">
              CARRIAGE RETURN
            </div>
          </div>

          {/* THE PAPER SHEET CONTAINER */}
          <div className="flex-1 my-2 bg-[#f7f4eb] text-neutral-950 border border-amber-950/20 p-4 md:p-5 shadow-2xl relative overflow-y-auto custom-scrollbar flex flex-col min-h-[140px]">
            {/* Fine texture lines of paper */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#fbf9f4] via-[#f7f4eb] to-[#efebe0] pointer-events-none" />
            <div className="absolute inset-y-0 left-8 w-[1px] bg-red-400/20 pointer-events-none" />

            {/* Paper content */}
            <div className="relative z-10 flex-1 flex flex-col justify-between min-h-0">
              
              {isGenerating ? (
                /* LOADING & EXPLANATORY SCREEN DURING AI GENERATION */
                <div className="flex-1 flex flex-col items-center justify-center text-center py-6 px-4 animate-fade-in text-neutral-900 my-auto">
                  <div className="relative mb-3.5 animate-bounce">
                    <div className="w-12 h-12 border-4 border-amber-900/15 border-t-amber-900 rounded-full animate-spin" />
                    <Lucide.PenTool className="w-5 h-5 text-amber-950 absolute inset-0 m-auto" />
                  </div>
                  
                  <div className="space-y-3 max-w-md">
                    <span className="font-mono text-[8px] md:text-[9px] text-amber-900/60 uppercase tracking-[0.25em] font-bold block animate-pulse">
                      ✉ ОТПРАВКА В ИЗДАТЕЛЬСТВО
                    </span>
                    <h3 className="font-serif text-xs md:text-sm font-bold text-neutral-900 italic uppercase">
                      ИИ-Литератор создает новое дело...
                    </h3>
                    <p className="font-serif text-[10px] md:text-[11px] leading-relaxed text-neutral-700 italic">
                      «Издательский ИИ-Ассистент кропотливо изучает ваш замысел, сплетает интригующие диалоги подозреваемых, генерирует интерактивные улики и расставляет ловушки на месте преступления. Слышен быстрый стук печатных литер...»
                    </p>
                    <div className="h-[1px] bg-neutral-300 w-20 mx-auto my-1" />
                    <p className="font-mono text-[8px] text-neutral-500">
                      Процесс занимает от 5 до 15 секунд. Пожалуйста, не закрывайте кабинет.
                    </p>
                  </div>
                </div>
              ) : !generationResult ? (
                <>
                  <div>
                    {/* Mode Choice inside the paper */}
                    <div className="flex justify-center gap-3 mb-3 select-none">
                      <button
                        onClick={() => {
                          try { gameAudio.playClick(); } catch (e) {}
                          setWriteType("single");
                        }}
                        className={`px-2.5 py-1 font-serif text-[10px] font-bold tracking-wide transition-all border ${
                          writeType === "single"
                            ? "border-neutral-900 bg-neutral-950 text-white"
                            : "border-neutral-900/10 hover:border-neutral-900/40 text-neutral-600"
                        }`}
                      >
                        ✍ Одиночное дело
                      </button>
                      <button
                        onClick={() => {
                          try { gameAudio.playClick(); } catch (e) {}
                          setWriteType("campaign");
                        }}
                        className={`px-2.5 py-1 font-serif text-[10px] font-bold tracking-wide transition-all border ${
                          writeType === "campaign"
                            ? "border-neutral-900 bg-neutral-950 text-white"
                            : "border-neutral-900/10 hover:border-neutral-900/40 text-neutral-600"
                        }`}
                      >
                        📚 Бульварный роман (3-5 глав)
                      </button>
                    </div>

                    <div className="text-center mb-2">
                      <span className="font-mono text-[7.5px] text-neutral-400 block uppercase tracking-widest leading-none">
                        ПОЛЕ ДЛЯ НАБОРА ТЕКСТА
                      </span>
                      <h3 className="font-serif text-[11px] font-bold text-neutral-800 uppercase italic mt-1">
                        {writeType === "single" ? "Сводка одиночного происшествия" : "Сюжетная линия будущего романа"}
                      </h3>
                    </div>

                    {/* TEXTAREA WRITING SPACE */}
                    <div className="relative mt-2 flex-1 flex flex-col min-h-0">
                      <textarea
                        value={ideaText}
                        onChange={(e) => {
                          if (e.target.value.length > ideaText.length) {
                            try { gameAudio.playTypewriterKey(); } catch (err) {}
                          }
                          setIdeaText(e.target.value);
                          setWriterError(null);
                        }}
                        placeholder={
                          writeType === "single"
                            ? "Напишите краткую идею дела... Например: 'Кот находит запертую шкатулку вора в лавке антиквара, но вор нападает в темноте...'"
                            : "Напишите замысел бульварного романа... Например: 'Таинственное ограбление века в Музее. Ванс и Миднайт идут по следу похитителей...'"
                        }
                        className="w-full flex-1 min-h-[60px] md:min-h-[100px] bg-transparent text-neutral-900 font-serif text-[11px] md:text-[12px] leading-relaxed resize-none border-b border-dashed border-neutral-300 focus:outline-none focus:border-neutral-600 text-left placeholder:text-neutral-400 placeholder:italic select-text"
                        disabled={isGenerating}
                      />
                      <div className="text-[8px] font-mono text-neutral-400 text-right mt-1">
                        {ideaText.length} симв. // Вводите с клавиатуры или нажимайте клавиши ниже
                      </div>
                    </div>
                  </div>

                  {writerError && (
                    <div className="mt-2.5 bg-red-50 border border-red-200/60 p-2 text-center animate-fade-in shrink-0">
                      <p className="font-mono text-[9px] text-red-700 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
                        <Lucide.AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                        {writerError}
                      </p>
                    </div>
                  )}

                  {/* SUBMIT LEATHER STAMP */}
                  <div className="text-center mt-3 shrink-0">
                    <button
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="inline-flex items-center gap-2 px-6 h-9 bg-neutral-900 hover:bg-neutral-800 text-white text-[9.5px] font-sans font-bold uppercase tracking-[0.2em] rounded-none shadow-md disabled:opacity-30 transition-all cursor-pointer"
                    >
                      <Lucide.Settings className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
                      Запустить в производство
                    </button>
                  </div>
                </>
              ) : (
                /* RESULT VIEW ON THE PAPER */
                <div className="flex flex-col justify-between h-full text-neutral-900 animate-fade-in text-left">
                  <div>
                    <div className="flex justify-between items-center border-b border-neutral-300 pb-2 mb-3">
                      <span className="font-mono text-[8px] text-neutral-500 uppercase tracking-widest">
                        ✓ ИЗДАТЕЛЬСТВО СВЯЗАЛОСЬ // РОМАН ПРИНЯТ
                      </span>
                      <button
                        onClick={clearWriterResults}
                        className="text-[9px] font-mono text-red-700 hover:text-red-900 underline"
                      >
                        Написать другое
                      </button>
                    </div>

                    {writeType === "single" ? (
                      <div className="space-y-2">
                        <span className="px-2 py-0.5 border border-amber-900 bg-amber-900 text-white font-mono text-[7px] font-bold uppercase tracking-widest inline-block">
                          {generationResult.caseName || "Дело раскрыто!"}
                        </span>
                        <h3 className="font-serif text-md font-bold italic tracking-wide">
                          {generationResult.title}
                        </h3>
                        <p className="font-serif text-[11px] leading-relaxed italic text-neutral-700">
                          {generationResult.description}
                        </p>
                        <div className="h-[1px] bg-neutral-200 my-2" />
                        <div className="font-mono text-[8.5px] text-neutral-500 space-y-0.5">
                          <div>• Бюджет контракта: <strong className="text-emerald-800 font-sans font-bold">+{generationResult.reward}$</strong></div>
                          <div>• Место действия: <strong>{generationResult.roomTemplateId}</strong></div>
                          <div>• Уровень опасности: <strong>{generationResult.risk === 'high' ? 'Высокий' : generationResult.risk === 'medium' ? 'Средний' : 'Низкий'}</strong></div>
                        </div>
                        <div className="border border-emerald-900/10 bg-emerald-50 p-2.5 mt-3">
                          <p className="font-serif text-[10px] text-emerald-950 italic">
                            «Барт зажег трубку: "Клянусь усами Миднайта, этот набросок достоин первых полос! Мы добавили это расследование в ежедневные оперативные сводки на доску!"»
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        <span className="px-2 py-0.5 border border-purple-950 bg-purple-950 text-white font-mono text-[7px] font-bold uppercase tracking-widest inline-block">
                          РОМАН ИЗ 3-Х ГЛАВ
                        </span>
                        <h3 className="font-serif text-xs font-bold tracking-wide italic border-b border-neutral-200 pb-1">
                          «{gameState.customCampaignTitle || "Повесть о Миднайте"}»
                        </h3>

                        <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                          {generationResult.chapters?.map((ch: any, i: number) => (
                            <div key={i} className="border-l-2 border-amber-800/40 pl-2">
                              <h4 className="font-serif text-[10.5px] font-bold leading-tight">
                                {ch.caseName}: {ch.title}
                              </h4>
                              <p className="text-[9px] font-serif text-neutral-600 italic leading-snug">
                                {ch.description}
                              </p>
                            </div>
                          ))}
                        </div>

                        <div className="border border-purple-900/15 bg-purple-50 p-2 text-left">
                          <p className="font-serif text-[9.5px] text-purple-950 italic">
                            «Кампания успешно вписана в кодекс. Пройдите все главы романа в Особых Сюжетных Расследованиях на доске. По завершении вы сможете издать роман и получить вердикт ИИ-Критика!»
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={clearWriterResults}
                    className="mt-3 w-full h-8 bg-neutral-900 hover:bg-neutral-800 text-white text-[8.5px] font-sans font-bold uppercase tracking-wider rounded-none transition-all cursor-pointer"
                  >
                    Вернуться к пергаменту
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* VIRTUAL RETRO ROUNDED KEYS OF TYPEWRITER */}
          <div className="relative shrink-0 border-t border-neutral-800 bg-[#070707] p-2 md:p-3 mt-1 select-none">
            {/* Typewriter mechanical bars decor overlay background */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#030303]/40 to-neutral-950 pointer-events-none" />
            
            <div className="relative z-10 flex flex-col gap-1.5 md:gap-2 max-w-xl mx-auto">
              {keyboardRows.map((row, rIdx) => (
                <div key={rIdx} className="flex justify-center gap-1 md:gap-1.5">
                  {row.map((char) => {
                    const isPressed = activeKey === char;
                    return (
                      <button
                        key={char}
                        onClick={() => handleVirtualKeyPress(char)}
                        disabled={isGenerating || !!generationResult}
                        className={`w-6.5 h-6.5 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-mono text-[8px] sm:text-[10px] font-bold border cursor-pointer select-none transition-all shadow-md active:scale-95 ${
                          isPressed
                            ? "bg-amber-500 border-amber-600 text-black scale-95 shadow-inner"
                            : "bg-gradient-to-b from-stone-800 to-stone-950 hover:from-stone-750 hover:to-stone-900 border-stone-700/60 text-stone-300 shadow"
                        }`}
                      >
                        {isShiftActive ? char.toUpperCase() : char.toLowerCase()}
                      </button>
                    );
                  })}
                </div>
              ))}

              {/* Spacebar & Action Keys Row */}
              <div className="flex justify-center gap-2 items-center mt-0.5">
                <button
                  onClick={() => {
                    try { gameAudio.playClick(); } catch (e) {}
                    setIsShiftActive((prev) => !prev);
                  }}
                  disabled={isGenerating || !!generationResult}
                  className={`px-2.5 h-6 md:h-7 font-mono text-[7px] md:text-[8px] uppercase tracking-wider rounded border cursor-pointer transition-all ${
                    isShiftActive
                      ? "bg-amber-500 border-amber-600 text-black font-bold"
                      : "bg-stone-900 hover:bg-stone-850 text-stone-400 hover:text-white border-stone-800"
                  }`}
                  title="Shift (Заглавные)"
                >
                  [Shift]
                </button>

                <button
                  onClick={handleBackspacePress}
                  disabled={isGenerating || !!generationResult || ideaText.length === 0}
                  className="px-2 h-6 md:h-7 bg-stone-900 hover:bg-stone-850 text-stone-400 hover:text-white font-mono text-[7.5px] md:text-[8px] uppercase tracking-wider rounded border border-stone-800 cursor-pointer"
                  title="Стереть"
                >
                  [←]
                </button>

                <button
                  onClick={handleSpacePress}
                  disabled={isGenerating || !!generationResult}
                  className="w-24 sm:w-36 h-6 md:h-7 bg-stone-900 hover:bg-stone-850 rounded border border-stone-800/80 shadow cursor-pointer"
                  title="Пробел"
                />

                <button
                  onClick={handleEnterPress}
                  disabled={isGenerating || !!generationResult}
                  className="px-2 h-6 md:h-7 bg-stone-900 hover:bg-stone-850 text-amber-500 font-mono text-[7.5px] md:text-[8px] uppercase tracking-wider rounded border border-stone-800 cursor-pointer"
                  title="Перевод строки"
                >
                  [↩]
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: ROYALTIES & NOVELS LOG */}
        <div className="lg:col-span-4 flex flex-col gap-4 lg:overflow-hidden min-h-0">
          
          {/* ROYALTY CLAIM BOX */}
          <div className="border border-neutral-800 bg-[#080809] p-3 md:p-4 flex flex-col justify-between relative overflow-hidden shrink-0">
            {/* Top gold line */}
            <div className="absolute top-0 inset-x-0 h-[2px] bg-amber-500/80" />
            <div className="absolute top-0 right-0 w-12 h-12 border-t border-r border-white/5 pointer-events-none" />

            <div>
              <span className="font-mono text-[8px] uppercase tracking-[0.25em] text-amber-500 block mb-1">
                💰 РОЯЛТИ И ГОНОРАРЫ
              </span>
              <h3 className="font-serif text-xs md:text-sm font-bold text-white mb-1.5 italic">
                Сейф Роялти Писателя
              </h3>
              <p className="text-[9.5px] text-white/50 leading-relaxed font-serif italic mb-2">
                «Издательство выплачивает 40% от гонораров раскрытых дел, написанных вами! Забирайте накопления здесь, чтобы пополнить кассу агентства.»
              </p>

              <div className="border border-white/5 bg-neutral-950 p-2.5 flex justify-between items-center mb-2.5">
                <div>
                  <span className="font-sans text-[7.5px] uppercase tracking-wider text-white/40 block">
                    Доступные начисления
                  </span>
                  <div className="font-mono text-lg font-bold text-emerald-400 mt-0.5">
                    {gameState.writerRoyalties ?? 0}$
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-sans text-[7.5px] uppercase tracking-wider text-white/40 block">
                    Всего заработано
                  </span>
                  <div className="font-mono text-xs text-white/60 mt-1">
                    {(gameState.writerTotalEarned ?? 0) + (gameState.writerRoyalties ?? 0)}$
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={claimRoyalties}
              disabled={(gameState.writerRoyalties ?? 0) <= 0}
              className="w-full h-8 bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-800 text-white disabled:text-white/30 text-[8.5px] font-sans font-bold uppercase tracking-widest transition-all cursor-pointer rounded-none flex items-center justify-center gap-1 shadow"
            >
              <Lucide.Coins className="w-3.5 h-3.5" />
              Забрать гонорар
            </button>
          </div>

          {/* DUAL TAB PANEL: LIST OF PUBLISHED NOVELS & CASE FOLDERS */}
          <div className="flex-1 border border-neutral-800 bg-[#080809] p-3 md:p-4 flex flex-col relative overflow-hidden min-h-[220px] lg:min-h-0">
            <div className="absolute top-0 right-0 w-12 h-12 border-t border-r border-white/5 pointer-events-none" />
            
            {/* Tab selector headers */}
            <div className="flex border-b border-white/10 mb-2.5">
              <button
                onClick={() => {
                  try { gameAudio.playClick(); } catch (e) {}
                  setRightPanelTab('novels');
                }}
                className={`flex-1 pb-1.5 font-serif text-[10px] uppercase tracking-wider font-bold text-center transition-all border-b-2 rounded-none ${
                  rightPanelTab === 'novels'
                    ? 'border-amber-500 text-white'
                    : 'border-transparent text-white/45 hover:text-white/70'
                }`}
              >
                Романы ({gameState.publishedBooks?.length ?? 0})
              </button>
              <button
                onClick={() => {
                  try { gameAudio.playClick(); } catch (e) {}
                  setRightPanelTab('folders');
                }}
                className={`flex-1 pb-1.5 font-serif text-[10px] uppercase tracking-wider font-bold text-center transition-all border-b-2 rounded-none ${
                  rightPanelTab === 'folders'
                    ? 'border-amber-500 text-white'
                    : 'border-transparent text-white/45 hover:text-white/70'
                }`}
              >
                Папки Дел ({gameState.caseFolders?.length ?? 0})
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 text-left pr-1 min-h-0">
              {rightPanelTab === 'novels' ? (
                /* TAB 1: STANDARD PUBLISHED NOVELS */
                !gameState.publishedBooks || gameState.publishedBooks.length === 0 ? (
                  <div className="h-full flex flex-col justify-center items-center text-center py-6">
                    <Lucide.BookMarked className="w-6 h-6 text-white/10 mb-1.5" />
                    <p className="font-serif text-[10px] text-white/40 italic max-w-[180px]">
                      «На полках еще нет ваших книг. Напишите сюжетную кампанию на три главы, пройдите ее и опубликуйте детективный роман!»
                    </p>
                  </div>
                ) : (
                  gameState.publishedBooks.map((book) => {
                    const statusColors = 
                      book.status === 'bestseller' 
                        ? 'border-amber-500/30 bg-amber-950/15 text-amber-300' 
                        : book.status === 'hit'
                          ? 'border-sky-500/30 bg-sky-950/15 text-sky-300'
                          : 'border-red-500/20 bg-red-950/15 text-red-400';

                    const statusLabels = {
                      bestseller: '★ БЕСТСЕЛЛЕР ★',
                      hit: '✓ УСПЕШНЫЙ ХИТ',
                      flop: '⚠ ПРОВАЛ ПРОДАЖ'
                    };

                    return (
                      <div key={book.id} className="border border-white/5 bg-black/40 p-2.5 relative hover:border-white/15 transition-all">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-serif text-[10px] md:text-[11px] font-bold text-amber-100 leading-tight">
                            «{book.title}»
                          </h4>
                          <span className="font-mono text-[7px] text-white/30">{book.timestamp}</span>
                        </div>

                        <div className={`border p-1 text-[7px] font-mono font-bold tracking-widest text-center my-1 uppercase ${statusColors}`}>
                          {statusLabels[book.status] || 'ОПУБЛИКОВАНО'}
                        </div>

                        <p className="font-serif text-[9px] md:text-[9.5px] italic text-white/50 leading-normal mb-2">
                          Идея: "{book.idea}"
                        </p>

                        <div className="bg-neutral-950/80 p-2 border border-white/5 mb-1 text-[9px]">
                          <div className="font-mono text-[7px] text-amber-500/80 font-bold uppercase mb-1 flex items-center gap-1">
                            <Lucide.MessageSquare className="w-2.5 h-2.5" /> Колонки Критика Лондона:
                          </div>
                          <p className="font-serif text-[9px] md:text-[9.5px] text-white/70 italic leading-snug">
                            {book.review}
                          </p>
                        </div>

                        <div className="flex justify-between font-mono text-[7.5px] md:text-[8px] text-white/30 border-t border-white/5 pt-1.5 mt-1.5">
                          <div className="flex items-center gap-1">
                            <span>Оценки:</span>
                            <span className="text-amber-400">Идея: {book.ratingIdea}★</span>
                            <span>/</span>
                            <span className="text-purple-400">ИИ: {book.ratingExecution}★</span>
                          </div>
                          <div>
                            <span>Выручка:</span>
                            <span className="text-emerald-400 font-bold ml-1">+{book.profit}$</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )
              ) : (
                /* TAB 2: CASE FOLDERS (РОМАНЫ-ПАПКИ) */
                <div className="space-y-3">
                  {/* Create New Folder Button or Form */}
                  {!showNewFolderInput ? (
                    <button
                      onClick={() => {
                        try { gameAudio.playClick(); } catch (e) {}
                        setShowNewFolderInput(true);
                      }}
                      className="w-full h-8 bg-zinc-950 border border-dashed border-zinc-800 hover:border-amber-600/50 hover:bg-amber-950/10 text-amber-500 font-sans text-[8.5px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                    >
                      <Lucide.FolderPlus className="w-3.5 h-3.5" />
                      Новый роман-папка
                    </button>
                  ) : (
                    <div className="border border-amber-900/30 bg-neutral-950 p-2.5 space-y-2">
                      <div className="font-serif text-[9px] font-bold text-amber-200 uppercase tracking-wide">
                        Название нового романа-папки:
                      </div>
                      <input
                        type="text"
                        value={newFolderTitle}
                        onChange={(e) => setNewFolderTitle(e.target.value)}
                        placeholder="например, Загадка пекарни Бейкера..."
                        className="w-full h-7 bg-neutral-900 border border-white/10 text-white font-serif text-[9.5px] px-2 rounded-none outline-none focus:border-amber-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCreateFolder();
                        }}
                      />
                      <div className="flex gap-1.5 justify-end">
                        <button
                          onClick={() => {
                            try { gameAudio.playClick(); } catch (e) {}
                            setShowNewFolderInput(false);
                            setNewFolderTitle('');
                          }}
                          className="h-6 px-2.5 border border-white/10 text-white/50 hover:text-white hover:border-white/20 font-mono text-[7.5px] uppercase tracking-wider transition-all"
                        >
                          Отмена
                        </button>
                        <button
                          onClick={handleCreateFolder}
                          disabled={!newFolderTitle.trim()}
                          className="h-6 px-3 bg-amber-600 hover:bg-amber-500 disabled:bg-neutral-800 text-white font-mono text-[7.5px] uppercase tracking-wider transition-all font-bold"
                        >
                          Создать
                        </button>
                      </div>
                    </div>
                  )}

                  {/* List of Folders */}
                  {!gameState.caseFolders || gameState.caseFolders.length === 0 ? (
                    <div className="h-full flex flex-col justify-center items-center text-center py-6">
                      <Lucide.FolderHeart className="w-6 h-6 text-white/10 mb-1.5" />
                      <p className="font-serif text-[10px] text-white/40 italic max-w-[200px] leading-relaxed">
                        «Кабинет чист. Создайте папку-роман, чтобы подшивать туда обычные дела писателя с пересекающимися событиями, объединяя их сквозной интригой!»
                      </p>
                    </div>
                  ) : (
                    gameState.caseFolders.map((folder) => {
                      const filedCases = (gameState.availableJobs ?? []).filter(j => folder.caseIds.includes(j.id));
                      const isCaseFiledGlobal = (caseId: string) => (gameState.caseFolders ?? []).some(f => f.caseIds.includes(caseId));
                      const unfiledCustomCases = (gameState.availableJobs ?? []).filter(j => j.id.startsWith('custom_job_') && !isCaseFiledGlobal(j.id));

                      const isPublished = folder.status === 'published';

                      const rankColors = 
                        folder.bestsellerRank && folder.bestsellerRank >= 80 
                          ? 'border-amber-500/30 bg-amber-950/15 text-amber-300' 
                          : folder.bestsellerRank && folder.bestsellerRank >= 60
                            ? 'border-sky-500/30 bg-sky-950/15 text-sky-300'
                            : 'border-zinc-800 bg-neutral-900 text-white/60';

                      const rankLabel = 
                        folder.bestsellerRank && folder.bestsellerRank >= 80 
                          ? '★ СУПЕР-БЕСТСЕЛЛЕР ★' 
                          : folder.bestsellerRank && folder.bestsellerRank >= 60
                            ? '✓ УСПЕШНЫЙ ХИТ'
                            : '📖 РОМАН-ПАПКА';

                      return (
                        <div key={folder.id} className="border border-white/5 bg-black/45 p-2.5 space-y-2 relative hover:border-white/10 transition-all">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-1 text-amber-100 font-serif text-[10px] font-bold">
                              <Lucide.Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              <span>«{folder.title}»</span>
                            </div>
                            <span className="font-mono text-[7px] text-white/30 shrink-0">{folder.timestamp}</span>
                          </div>

                          {/* Subheading / Tags */}
                          {folder.tags && folder.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {folder.tags.map((tag, tIdx) => (
                                <span key={tIdx} className="bg-amber-950/20 text-amber-400 px-1 py-0.5 border border-amber-500/10 text-[7px] font-mono rounded-none">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Status and Rating badge */}
                          {isPublished && (
                            <div className="space-y-1.5">
                              <div className={`border p-1 text-[7px] font-mono font-bold tracking-widest text-center uppercase ${rankColors}`}>
                                {rankLabel} (Специфика: {folder.bestsellerRank}%)
                              </div>
                              <div className="flex justify-between font-mono text-[7px] text-white/30">
                                <div className="flex items-center gap-0.5">
                                  <span>Оценка:</span>
                                  {Array.from({ length: folder.rating || 3 }).map((_, i) => (
                                    <Lucide.Star key={i} className="w-2.5 h-2.5 fill-amber-400 text-amber-400 shrink-0" />
                                  ))}
                                </div>
                                <div className="text-emerald-400 font-bold">
                                  Выручка: +{folder.profit}$
                                </div>
                              </div>
                              <p className="font-serif text-[9px] text-white/70 italic bg-neutral-950/80 p-2 border border-white/5 leading-normal">
                                {folder.review}
                              </p>
                            </div>
                          )}

                          {/* Filed Cases List */}
                          <div className="space-y-1 border-t border-white/5 pt-1.5">
                            <div className="font-mono text-[7px] text-white/40 uppercase mb-1 flex justify-between">
                              <span>Подшитые дела ({folder.caseIds.length})</span>
                              {isPublished && <span className="text-emerald-500 font-bold">Опубликовано ✓</span>}
                            </div>
                            {folder.caseIds.length === 0 ? (
                              <p className="font-serif text-[8.5px] text-white/30 italic">
                                Папка пуста. Подшейте обычные дела писателя ниже.
                              </p>
                            ) : (
                              filedCases.map(c => {
                                const title = c.title || c.caseName || '';
                                const tags = extractCaseTags(title, c.description || '');
                                return (
                                  <div key={c.id} className="bg-neutral-900/60 p-1.5 border border-white/5 flex justify-between items-center text-[8.5px] font-serif">
                                    <div>
                                      <div className="font-bold text-white/80 leading-tight">«{c.caseName}»</div>
                                      <div className="flex gap-1 mt-0.5">
                                        {tags.map((t, idx) => (
                                          <span key={idx} className="text-[6.5px] font-mono text-white/40">#{t}</span>
                                        ))}
                                      </div>
                                    </div>
                                    {!isPublished && (
                                      <button
                                        onClick={() => handleUnfileCase(folder.id, c.id)}
                                        className="text-red-400 hover:text-red-300 font-mono text-[7px] font-bold p-1 border border-red-500/10 hover:bg-red-950/20"
                                        title="Извлечь из папки"
                                      >
                                        [Удалить]
                                      </button>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>

                          {/* Action - File/Attach Case */}
                          {!isPublished && (
                            <div className="space-y-1.5 pt-1 border-t border-dashed border-white/5">
                              {unfiledCustomCases.length > 0 ? (
                                <div className="bg-neutral-950 p-1.5 border border-white/5 space-y-1">
                                  <div className="font-mono text-[7px] text-amber-500/80 font-bold uppercase">
                                    Доступные дела писателя ({unfiledCustomCases.length}):
                                  </div>
                                  <div className="max-h-[85px] overflow-y-auto custom-scrollbar space-y-1">
                                    {unfiledCustomCases.map(c => {
                                      const title = c.title || c.caseName || '';
                                      const tags = extractCaseTags(title, c.description || '');
                                      return (
                                        <div key={c.id} className="bg-zinc-900/50 p-1 flex justify-between items-center text-[8px] font-serif hover:bg-zinc-900">
                                          <div className="truncate max-w-[125px]">
                                            <span className="text-white block truncate font-bold">«{c.caseName}»</span>
                                            <span className="text-[6.5px] font-mono text-white/30 block truncate">#{tags.join(', #')}</span>
                                          </div>
                                          <button
                                            onClick={() => handleFileCaseToFolder(folder.id, c.id)}
                                            className="bg-amber-950/40 text-amber-400 font-mono text-[7px] font-bold px-1.5 py-0.5 border border-amber-500/20 hover:bg-amber-500 hover:text-black transition-all"
                                          >
                                            Подшить
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ) : (
                                <p className="font-serif text-[8.5px] text-white/30 italic text-center">
                                  «Нет новых дел для подшивания. Создайте одиночное дело на печатной машинке!»
                                </p>
                              )}

                              {/* Publish button */}
                              {folder.caseIds.length >= 2 ? (
                                <button
                                  onClick={() => handlePublishFolder(folder.id)}
                                  className="w-full h-7 bg-amber-600 hover:bg-amber-500 text-white font-sans text-[8px] font-bold uppercase tracking-wider transition-all rounded-none flex items-center justify-center gap-1 shadow"
                                >
                                  <Lucide.BookOpen className="w-3 h-3" />
                                  Опубликовать роман-папку
                                </button>
                              ) : (
                                <div className="text-center font-serif text-[7.5px] text-amber-200/50 italic leading-snug">
                                  * Подшейте как минимум 2 дела, чтобы издать готовый роман-папку.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
