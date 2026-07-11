/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ObjectId, ObjectState, GameState, Clue, GameLog, Job } from './types';
import { generateNewGame, DUMMY_ITEMS, ALL_CLUES, generateDailyJobs, generateCampaignChain, generateInitialSketches } from './utils/puzzleGenerator';
import { initializeTornNote } from './utils/tornNoteGenerator';
import { gameAudio } from './utils/AudioEngine';

import GameScene from './components/GameScene';
import NarrativeBox from './components/NarrativeBox';
import ClueTracker from './components/ClueTracker';
import IntroScreen from './components/IntroScreen';
import RainEffect from './components/RainEffect';
import FilmGrain from './components/FilmGrain';
import AlleywayShop from './components/AlleywayShop';
import SandboxDashboard from './components/SandboxDashboard';
import TornNotePuzzle from './components/TornNotePuzzle';
import WriterMode from './components/WriterMode';

import * as Lucide from 'lucide-react';

function getAgencyHint(gameState: GameState): string {
  const cash = gameState.economy?.cash ?? 0;
  const reputation = gameState.reputation ?? 0;
  const completedJobs = (gameState.availableJobs ?? []).filter(j => j && j.completed);
  const incompleteJobs = (gameState.availableJobs ?? []).filter(j => j && !j.completed);
  const incompleteSketches = (gameState.sketches ?? []).filter(s => s && !s.completed);
  const currentDay = gameState.currentDay ?? 1;

  if (cash < 110 && incompleteJobs.length > 0) {
    return "Наш бюджет опасно низок! В конце дня снимутся налоги и расходы (-110$), и если мы уйдем в минус — агентство закроют. Срочно выезжай на любое доступное дело!";
  }
  if (incompleteSketches.length > 0) {
    return "Свидетели ждут в приемной! Загляни во вкладку «Допрос и Фоторобот», чтобы составить фотороботы преступников на 100%. Это даст важнейшие зацепки перед началом расследований!";
  }
  if (incompleteJobs.length > 0) {
    const firstJob = incompleteJobs[0];
    return `В сводках есть нераскрытое оперативное дело: "${firstJob.title}". Кликай по карточке и нажимай «Начать расследование», чтобы выехать на место!`;
  }
  
  // Story chapters hint
  const completedChapters = gameState.storyState?.completedChapters ?? [];
  const chapters = gameState.campaignChapters && gameState.campaignChapters.length > 0 
    ? gameState.campaignChapters 
    : [
        { id: 'story_chapter_1', title: 'Похищение Сапфирового Глаза', reputationRequired: 0, reward: 200, infoCost: 0, completed: false, risk: 'low', roomTemplateId: 'room_antique', timeLimit: null },
        { id: 'story_chapter_2', title: 'Контрабанда в полночь', reputationRequired: 15, reward: 300, infoCost: 0, completed: false, risk: 'medium', roomTemplateId: 'room_captain', timeLimit: 180 },
        { id: 'story_chapter_3', title: 'Финал в небесах', reputationRequired: 30, reward: 400, infoCost: 0, completed: false, risk: 'high', roomTemplateId: 'room_captain', timeLimit: 120 }
      ];
  
  const activeCh = chapters.find((ch, idx) => !ch.completed && !completedChapters.includes(idx + 1));
  if (activeCh && currentDay >= 3) {
    if (reputation < (activeCh.reputationRequired ?? 0)) {
      return `Для продвижения по сюжету к главе "${activeCh.title}" нам не хватает репутации (нужно ${activeCh.reputationRequired}★, у нас ${reputation}★). Раскрывай ежедневные дела в сводках!`;
    }
    return `Мы готовы к крупному делу! Сюжетная глава "${activeCh.title}" ждет нас. Нажимай на карточку главы ниже!`;
  }
  
  return "Все оперативные дела на сегодня завершены! Барт, мы отлично потрудились. Пора нажать на кнопку «Завершить день», чтобы оплатить счета и перейти к следующему дню.";
}

function getLogicalHint(gameState: GameState): string {
  if (gameState.gameStatus === 'sandbox_dashboard') {
    return getAgencyHint(gameState);
  }

  const { objects, inventory, foundClueIds, safeCode, solvedSteps } = gameState;

  // Find easy spot (rug, trashcan, painting holding a clue)
  const easySpotObj = Object.values(objects).find(
    obj => ['rug', 'trashcan', 'painting'].includes(obj.id) && obj.heldClueId !== null
  );
  const easySpot = easySpotObj ? easySpotObj.id : null;
  const easyClueFound = easySpotObj ? foundClueIds.includes(easySpotObj.heldClueId!) : false;

  // Find key spot (holding 'key_brass')
  const keySpotObj = Object.values(objects).find(obj => obj.heldItemId === 'key_brass');
  const keySpot = keySpotObj ? keySpotObj.id : null;
  
  const hasKey = inventory.includes('key_brass');
  const deskOpened = !objects.desk.locked;

  // 1. If easy clue is not found and the easy spot is not yet interacted/revealed
  if (easySpot && !easyClueFound) {
    const obj = objects[easySpot];
    const isInteracted = easySpot === 'rug' ? obj.toggled : easySpot === 'trashcan' ? obj.tipped : obj.toggled;
    if (!isInteracted) {
      if (easySpot === 'rug') {
        return "Миднайт подозрительно косится на край персидского ковра. Кажется, там что-то бугрится... Стоит подрать его когтями.";
      }
      if (easySpot === 'trashcan') {
        return "Переполненное мусорное ведро в углу качается от сквозняка. Одно хорошее кошачье усилие — и его содержимое окажется на полу.";
      }
      if (easySpot === 'painting') {
        return "Мрачная картина с морским пейзажем висит криво. Возможно, за ней прячется тайник? Миднайту стоит поправить её лапой.";
      }
    }
  }

  // 2. If desk is locked and player doesn't have the key
  if (!deskOpened && !hasKey) {
    if (keySpot) {
      const obj = objects[keySpot];
      const keyRevealed = keySpot === 'bookshelf' ? obj.booksFallen : obj.tipped;
      if (!keyRevealed) {
        if (keySpot === 'bookshelf') {
          return "Письменный стол заперт на крепкий замок. Миднайт, посмотри на книжную полку — эти тяжелые книги выглядят так, будто их давно пора сбросить на пол.";
        }
        if (keySpot === 'fishbowl') {
          return "Письменный стол заперт. Но посмотри на аквариум на комоде... На самом дне поблескивает что-то латунное. Нужно аккуратно опрокинуть его лапой.";
        }
      } else {
        return "Латунный ключ где-то на полу! Миднайту нужно подобрать его (кликнуть по объекту еще раз).";
      }
    }
  }

  // 3. If player has the key but desk is locked
  if (!deskOpened && hasKey) {
    return "Латунный ключ у нас в зубах! Нужно подойти к Письменному столу и использовать ключ, чтобы открыть запертый ящик.";
  }

  // 4. Safe Code retrieval hints
  const hasSafeCode = inventory.includes('safe_code_note') || gameState.logs.some(l => l.text.includes('кодовый шифр') || l.text.includes('код от сейфа'));
  const safeLocked = objects.safe.locked;

  if (safeLocked && !hasSafeCode) {
    if (solvedSteps.includes('safe_code_via_lamp')) {
      const lampOn = objects.lamp.toggled;
      const booksFallen = objects.bookshelf.booksFallen;
      if (!lampOn) {
        return "Сейф заперт кодовым шифром. Хм, на напольном торшере видны следы когтей. Попробуй включить торшер, чтобы осветить комнату.";
      }
      if (!booksFallen) {
        return "Торшер горит, но тени от книг на полке закрывают заднюю стенку шкафа. Миднайту нужно сбросить книги с полки, чтобы прочесть скрытые цифры.";
      }
    }
    if (solvedSteps.includes('safe_code_via_painting')) {
      const paintingTilted = objects.painting.toggled;
      if (!paintingTilted) {
        return "Сейф заперт кодовым шифром. Мрачная картина на стене скрывает какую-то тайну на обоях. Миднайт должен сдвинуть картину лапой.";
      } else {
        return "Картина наклонена, но Миднайт должен получше изучить стену за ней — там осталась записка с кодом сейфа!";
      }
    }
  }

  // 5. If player has safe code but safe is locked
  if (safeLocked && hasSafeCode) {
    return `Кодовая комбинация от сейфа у нас в блокноте: [ ${safeCode} ]! Нажми на Сейф, прокрути барабаны до верных цифр и нажми «Повернуть рукоять».`;
  }

  // 6. Generic prompt to explore remaining interactive items
  return "Мы обыскали основные места. Попробуй пошевелить другие предметы в комнате: подери ковер, урони мусорное ведро или включи лампу.";
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>(() => generateNewGame());
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isTornNoteOpen, setIsTornNoteOpen] = useState(false);
  
  // Writer and AI Critic States
  const [isWriterOpen, setIsWriterOpen] = useState(false);
  const [showPublishPopup, setShowPublishPopup] = useState(false);
  const [ratingIdea, setRatingIdea] = useState(5);
  const [ratingExecution, setRatingExecution] = useState(5);
  const [isCritiquing, setIsCritiquing] = useState(false);
  const [critiqueResult, setCritiqueResult] = useState<any | null>(null);
  const [dayTransition, setDayTransition] = useState<{
    isActive: boolean;
    fromDay: number;
    toDay: number;
    isFadingOut: boolean;
  } | null>(null);

  // Auto-open the torn note puzzle when it is newly created and not yet completed
  useEffect(() => {
    if (gameState.activeTornNote && !gameState.activeTornNote.completed) {
      setIsTornNoteOpen(true);
    }
  }, [gameState.activeTornNote?.id]);

  // Auto-trigger the "Publish custom campaign" popup when all chapters of a custom campaign are completed
  useEffect(() => {
    if (
      gameState.campaignChapters &&
      gameState.campaignChapters.length > 0 &&
      gameState.customCampaignIdea &&
      gameState.campaignChapters.every(ch => ch.completed) &&
      !showPublishPopup &&
      !critiqueResult
    ) {
      setShowPublishPopup(true);
      setRatingIdea(5);
      setRatingExecution(5);
    }
  }, [gameState.campaignChapters, gameState.customCampaignIdea]);

  // Check if saved game exists in localStorage on mount or state changes
  const [hasSavedGame, setHasSavedGame] = useState<boolean>(false);
  const [savedData, setSavedData] = useState<{ day: number; cash: number; reputation: number } | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('noir_midnight_save_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.gameStatus && parsed.gameStatus !== 'intro') {
          setHasSavedGame(true);
          setSavedData({
            day: parsed.currentDay ?? 1,
            cash: parsed.economy?.cash ?? 150,
            reputation: parsed.reputation ?? 0
          });
        }
      }
    } catch (e) {
      console.warn("Could not read saved game status", e);
    }
  }, [gameState.gameStatus]);

  // Persistent saving of game state
  useEffect(() => {
    if (gameState.gameStatus === 'intro') return; // Don't save on intro
    try {
      localStorage.setItem('noir_midnight_save_v2', JSON.stringify(gameState));
    } catch (e) {
      console.warn("Could not save game state to localStorage", e);
    }
  }, [gameState]);

  // Auto-play ambient music adjustments when mute changes
  useEffect(() => {
    try {
      gameAudio.setMute(gameState.isMuted);
    } catch (e) {
      console.warn("Audio initialization postponed until user gesture", e);
    }
  }, [gameState.isMuted]);

  // Handle start of a completely fresh sandbox career (Day 1)
  const handleStartNewGame = (enableAudio: boolean) => {
    const initialJobs = generateDailyJobs(1, 0);
    const campaignLen = Math.floor(Math.random() * 8) + 3; // 3 to 10 chapters
    const campaignChapters = generateCampaignChain(campaignLen, 0);
    
    const freshState = {
      ...generateNewGame('sandbox', 1, 150, 0),
      gameStatus: 'sandbox_dashboard' as const,
      currentDay: 1,
      daysSurvived: 0,
      availableJobs: initialJobs,
      campaignChapters: campaignChapters,
      activeJob: null,
      reputation: 0,
      economy: {
        cash: 150,
        recentExpenses: []
      },
      isMuted: !enableAudio,
      storyState: {
        mode: 'sandbox' as const,
        chapter: 1,
        currentLocationId: 'pier' as const,
        completedChapters: []
      }
    };

    setGameState(freshState);

    // Bootstrap Audio
    setTimeout(() => {
      try {
        gameAudio.init();
        gameAudio.setMute(!enableAudio);
        if (enableAudio) {
          gameAudio.playMeow();
        }
      } catch (e) {
        console.error("Audio gesture initialization error:", e);
      }
    }, 100);
  };

  // Handle continuing/resuming from saved state
  const handleContinueGame = (enableAudio: boolean) => {
    try {
      const saved = localStorage.getItem('noir_midnight_save_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.gameStatus) {
          let campaignChapters = parsed.campaignChapters;
          if (!campaignChapters || campaignChapters.length === 0) {
            const campaignLen = Math.floor(Math.random() * 8) + 3; // 3 to 10 chapters
            campaignChapters = generateCampaignChain(campaignLen, parsed.reputation || 0);
          }

          setGameState({
            ...parsed,
            campaignChapters,
            sketches: parsed.sketches || generateInitialSketches(),
            isMuted: !enableAudio
          });
          
          setTimeout(() => {
            try {
              gameAudio.init();
              gameAudio.setMute(!enableAudio);
              if (enableAudio) {
                gameAudio.playMeow();
              }
            } catch (e) {}
          }, 100);
          return;
        }
      }
    } catch (e) {
      console.warn("Error resuming saved game", e);
    }
    // Fallback if load fails
    handleStartNewGame(enableAudio);
  };

  const addLog = (sender: 'detective' | 'cat' | 'system', text: string): GameLog => {
    return {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      sender,
      text,
      timestamp: new Date().toLocaleTimeString()
    };
  };

  const getReputationRank = (rep: number): string => {
    if (rep < 20) return 'Дворовый сыщик';
    if (rep < 50) return 'Местный детектив';
    if (rep < 90) return 'Знаменитый ищейка';
    return 'Легенда Миднайта';
  };

  // Timer countdown hook
  useEffect(() => {
    if (gameState.gameStatus !== 'playing' || !gameState.timerActive) return;
    
    const interval = setInterval(() => {
      setGameState(prev => {
        if (prev.gameStatus !== 'playing' || !prev.timerActive) {
          clearInterval(interval);
          return prev;
        }
        
        if (prev.timeLeft && prev.timeLeft > 1) {
          // Play click-tock sound occasionally if near end
          if (prev.timeLeft <= 30 && !prev.isMuted && prev.timeLeft % 2 === 0) {
            try {
              gameAudio.playClick();
            } catch (e) {}
          }
          return {
            ...prev,
            timeLeft: prev.timeLeft - 1
          };
        } else {
          // Time is up! Game is lost!
          clearInterval(interval);
          
          const newLogs = [...prev.logs];
          newLogs.push({
            id: `log_timer_fail_${Date.now()}`,
            sender: 'system',
            text: '❌ ВРЕМЯ ИСТЕКЛО! Подозреваемый скрылся в тумане. Дело провалено! С вас списан штраф за затяжку расследования: -50$. Репутация снижена на -10.',
            timestamp: new Date().toLocaleTimeString()
          });

          try {
            if (!prev.isMuted) {
              gameAudio.playPurr();
            }
          } catch (e) {}

          const finalCash = Math.max(0, (prev.economy?.cash ?? 150) - 50);
          const finalRep = Math.max(0, (prev.reputation ?? 0) - 10);
          
          return {
            ...prev,
            gameStatus: 'lost',
            reputation: finalRep,
            economy: {
              cash: finalCash,
              recentExpenses: [
                { name: 'Штраф за провал дела', amount: 50, timestamp: new Date().toLocaleTimeString() },
                ...(prev.economy?.recentExpenses || [])
              ]
            },
            activeDialogue: {
              sender: 'detective',
              text: '«О нет, Миднайт! Стрелки часов пробили полночь, а подозреваемый растворился в лондонском тумане... Кабинет пуст. Мы упустили его! Какое фиаско для нашего бюро...»',
              mood: 'shocked'
            }
          };
        }
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [gameState.gameStatus, gameState.timerActive]);

  // Handle Shop purchases
  const handleBuyItem = (itemId: 'catnip' | 'rumor' | 'safe_code' | 'writer_reset') => {
    if (gameState.gameStatus !== 'playing') return;
    setGameState(prev => {
      const currentCash = prev.economy?.cash ?? 150;
      let cost = 0;
      if (itemId === 'catnip') cost = 30;
      else if (itemId === 'rumor') cost = 45;
      else if (itemId === 'safe_code') cost = 60;
      else if (itemId === 'writer_reset') cost = 25;

      if (currentCash < cost) return prev;

      const newCash = currentCash - cost;
      const newInventory = [...prev.inventory];
      const newLogs = [...prev.logs];
      let newDialogueText = '';
      let newDialogueMood = 'proud';
      let newHasCatnipSenses = prev.hasCatnipSenses;
      let newIsInjured = prev.isInjured;
      const newRevealedObjects = [...(prev.revealedObjects || [])];

      let newWriterCasesToday = prev.writerCasesToday;
      let newWriterNovelLastDay = prev.writerNovelLastDay;

      if (itemId === 'catnip') {
        newIsInjured = false;
        newHasCatnipSenses = true;
        newLogs.push({
          id: `log_buy_catnip_${Date.now()}`,
          sender: 'system',
          text: `💸 Куплена кошачья мята (-30$). Травмы излечены, активировано шестое чувство Миднайта!`,
          timestamp: new Date().toLocaleTimeString()
        });
        newDialogueText = '«О-о-о... Эта зеленая сушеная травка пахнет божественно! Моя лапка больше не болит, а мир заиграл яркими красками. Я чую, где спрятаны улики!»';
        newDialogueMood = 'proud';
        try { if (!prev.isMuted) gameAudio.playPurr(); } catch (e) {}
      } else if (itemId === 'rumor') {
        // Find container object holding clues/items that is not already revealed
        const containerObjects = (Object.values(prev.objects) as any[]).filter(obj => {
          const hasSomething = obj.heldClueId !== null || obj.heldItemId !== null;
          const isAlreadyRevealed = newRevealedObjects.includes(obj.id);
          return hasSomething && !isAlreadyRevealed;
        });

        let revealedId: any = null;
        if (containerObjects.length > 0) {
          const chosen = containerObjects[Math.floor(Math.random() * containerObjects.length)];
          revealedId = chosen.id;
          newRevealedObjects.push(revealedId);
        } else {
          const remainingObjects = Object.keys(prev.objects).filter(id => !newRevealedObjects.includes(id as any));
          if (remainingObjects.length > 0) {
            revealedId = remainingObjects[0];
            newRevealedObjects.push(revealedId);
          }
        }

        newLogs.push({
          id: `log_buy_rumor_${Date.now()}`,
          sender: 'system',
          text: `💸 Куплены слухи у крысы Реми (-45$). Получена зацепка о тайниках!`,
          timestamp: new Date().toLocaleTimeString()
        });
        if (revealedId) {
          const objName = prev.objects[revealedId].name;
          newDialogueText = `«Реми шепнул мне на ухо: "Пи-пи... Посмотри в сторону: ${objName}". Кажется, там точно скрыто что-то ценное!»`;
        } else {
          newDialogueText = '«Реми пискнул: "Все тайники чисты, сыщик! Ищи в сейфе!"»';
        }
        newDialogueMood = 'thoughtful';
        try { if (!prev.isMuted) gameAudio.playClick(); } catch (e) {}
      } else if (itemId === 'safe_code') {
        if (!newInventory.includes('safe_code_note')) {
          newInventory.push('safe_code_note');
        }
        newLogs.push({
          id: `log_buy_safecode_${Date.now()}`,
          sender: 'system',
          text: `💸 Куплен шифр у пса Барни (-60$). Код от сейфа добавлен в блокнот!`,
          timestamp: new Date().toLocaleTimeString()
        });
        newDialogueText = `«Барни протянул мне обрывок бумажки: "Р-р-гав! Держи свой шифр от сейфа, Барт: ${prev.safeCode}". Ну вот и всё, сейф у нас в кармане!»`;
        newDialogueMood = 'shocked';
        try { if (!prev.isMuted) gameAudio.playClick(); } catch (e) {}
      } else if (itemId === 'writer_reset') {
        newWriterCasesToday = 0;
        newWriterNovelLastDay = undefined;
        newLogs.push({
          id: `log_buy_writer_reset_${Date.now()}`,
          sender: 'system',
          text: `💸 Куплены кофе и сигареты (-25$). Лимиты писателя полностью сброшены!`,
          timestamp: new Date().toLocaleTimeString()
        });
        newDialogueText = '«Горячий двойной эспрессо и терпкий сигаретный дым. Мои мысли прояснились, пальцы готовы снова барабанить по клавишам Ундервуда!»';
        newDialogueMood = 'proud';
        try { if (!prev.isMuted) gameAudio.playTypewriterBell(); } catch (e) {}
      }

      const expensesList = [
        { 
          name: itemId === 'catnip' ? 'Кошачья мята богов' : itemId === 'rumor' ? 'Слухи у Реми' : itemId === 'safe_code' ? 'Шифр у Барни' : 'Кофе и сигареты писателя', 
          amount: cost, 
          timestamp: new Date().toLocaleTimeString() 
        },
        ...(prev.economy?.recentExpenses || [])
      ];

      return {
        ...prev,
        inventory: newInventory,
        isInjured: newIsInjured,
        hasCatnipSenses: newHasCatnipSenses,
        revealedObjects: newRevealedObjects,
        writerCasesToday: newWriterCasesToday,
        writerNovelLastDay: newWriterNovelLastDay,
        logs: newLogs,
        economy: {
          cash: newCash,
          recentExpenses: expensesList
        },
        activeDialogue: {
          sender: itemId === 'catnip' ? 'cat' : 'detective',
          text: newDialogueText,
          mood: newDialogueMood
        }
      };
    });
  };

  // Main puzzle interaction handler
  const handleObjectInteraction = (id: ObjectId, action: string) => {
    if (gameState.gameStatus !== 'playing') return;
    if (gameState.catAction === 'walking') return;

    const currentObj = gameState.objects[id];
    
    // Multi-room visibility rules for Chapter 2 and custom locations
    const isChapter2 = gameState.storyState?.mode === 'story' && gameState.storyState?.chapter === 2;
    const isMultiRoom = gameState.roomInfo?.id === 'room_mansion' || gameState.roomInfo?.id === 'room_shop' || gameState.roomInfo?.id === 'room_museum';
    const hasMultipleRooms = isChapter2 || isMultiRoom;
    const currentLocation = gameState.storyState?.currentLocationId || 'pier';

    const isVisible = (oid: ObjectId) => {
      if (!hasMultipleRooms) return true;
      if (currentLocation === 'pier') {
        return ['rug', 'trashcan', 'painting', 'fishbowl'].includes(oid);
      } else {
        return ['bookshelf', 'desk', 'safe', 'lamp'].includes(oid);
      }
    };

    const getClimbSteps = (from: string, to: string): string[] => {
      if (from === to) return [];
      const visible = (oid: ObjectId) => isVisible(oid);
      
      const getX = (spot: string): number => {
        if (spot === 'bookshelf') return 14;
        if (spot === 'painting') return 31;
        if (spot === 'desk') return 59;
        if (spot === 'fishbowl') return 52;
        if (spot === 'lamp') return 78;
        if (spot === 'safe') return 92.5;
        if (spot === 'trashcan') return 85;
        if (spot === 'rug') return 47;
        return 45; // 'center'
      };

      const getHeightClass = (spot: string): 'floor' | 'medium' | 'high' => {
        if (spot === 'center' || spot === 'rug' || spot === 'trashcan') return 'floor';
        if (spot === 'bookshelf' || spot === 'painting' || spot === 'lamp') return 'high';
        return 'medium'; // desk, safe, fishbowl
      };

      const fromX = getX(from);
      const toX = getX(to);
      const toHeight = getHeightClass(to);
      const fromHeight = getHeightClass(from);

      // If jumping to a high item (bookshelf, painting, lamp) and starting from floor
      if (toHeight === 'high' && fromHeight === 'floor') {
        // Only medium-height objects (desk, safe) are valid stepping stones
        const possibleHelpers: ObjectId[] = ['desk', 'safe'];
        const bestHelper = possibleHelpers.find(helper => {
          if (helper === to) return false;
          if (!visible(helper)) return false;
          const helperX = getX(helper);
          const distToTarget = Math.abs(helperX - toX);
          
          // Stepping stone must be close enough (physically nearby) to the target
          if (distToTarget <= 30) {
            return true;
          }
          return false;
        });

        if (bestHelper) {
          return [bestHelper, to];
        }
      }

      return [to];
    };

    const getClimbDuration = (from: string, steps: string[]): number => {
      if (steps.length === 0) return 800;
      
      let total = 0;
      let current = from;
      
      for (const step of steps) {
        const isFromFloor = current === 'center' || current === 'rug' || current === 'trashcan';
        const isToFloor = step === 'center' || step === 'rug' || step === 'trashcan';
        
        if (isFromFloor && isToFloor) {
          total += 700;
        } else if (isFromFloor && !isToFloor) {
          total += 1515;
        } else if (!isFromFloor && isToFloor) {
          total += 1365;
        } else {
          // Elevated to Elevated. Check distance.
          const getX = (s: string) => {
            if (s === 'bookshelf') return 14;
            if (s === 'painting') return 31;
            if (s === 'desk') return 59;
            if (s === 'safe') return 92.5;
            if (s === 'lamp') return 78;
            return 45;
          };
          const dist = Math.abs(getX(current) - getX(step));
          if (dist < 25) {
            total += 900;
          } else {
            total += 1915;
          }
        }
        current = step;
      }
      
      return total;
    };

    const climbSteps = getClimbSteps(gameState.catPosition, id);
    const climbDelay = getClimbDuration(gameState.catPosition, climbSteps) * (gameState.isInjured ? 1.5 : 1);

    // 1. Cat walks to the object
    setGameState(prev => ({
      ...prev,
      catPosition: id,
      catAction: 'walking',
      activeDialogue: {
        sender: 'cat',
        text: `*Миднайт крадется к объекту: ${currentObj.name}...*`
      },
      logs: [
        ...prev.logs,
        addLog('system', `Миднайт направляется к: ${currentObj.name}.`)
      ]
    }));

    // Play soft purr/footstep sound
    if (!gameState.isMuted) {
      gameAudio.playPurr();
    }

    // 2. Perform action after walking transition completed
    setTimeout(() => {
      setGameState(prev => {
        const getItemDetail = (itemId: string) => {
          return (prev.customItems && prev.customItems[itemId]) || (DUMMY_ITEMS as any)[itemId];
        };
        const objectsCopy = { ...prev.objects };
        const obj = { ...objectsCopy[id] };
        let newAction: GameState['catAction'] = 'idle';
        let dialogueText = '';
        let dialogueMood = 'serious';
        let logText = '';
        let dialogueSender: 'detective' | 'cat' | 'system' = 'detective';
        
        const newInventory = [...prev.inventory];
        const newFoundClues = [...prev.foundClueIds];
        const newLogs = [...prev.logs];
        let newActiveTornNote = prev.activeTornNote;
        let finalIsInjured = prev.isInjured;
        let finalHasCatnipSenses = prev.hasCatnipSenses;
        let ateCatnipThisTurn = false;

        // Custom action state determination
        if (id === 'rug') {
          newAction = 'scratching';
          if (!prev.isMuted) gameAudio.playScratch();
          obj.toggled = true;
          logText = 'Кот когтями разодрал край ковра и отвернул его.';
          
          if (obj.heldClueId && !newFoundClues.includes(obj.heldClueId)) {
            newFoundClues.push(obj.heldClueId);
            const clue = prev.currentClues.find(c => c.id === obj.heldClueId);
            dialogueText = clue ? clue.findingMessage : 'Улика найдена под ковром!';
            dialogueMood = 'shocked';
            if (!prev.isMuted) gameAudio.playClueFound();
          } else if (obj.heldItemId) {
            if (obj.heldItemId === 'catnip') {
              finalIsInjured = false;
              finalHasCatnipSenses = true;
              ateCatnipThisTurn = true;
              obj.heldItemId = null;
              newLogs.push(addLog('system', `🌿 НАХОДКА! Миднайт откопал под ковром кошачью мяту! Травмы излечены, шестое чувство активировано!`));
              dialogueText = '«О-о-о! Миднайт откопал под ковром кошачью мяту и тут же её съел! Его раны затянулись, а глаза сверкают — шестое чувство полностью активировано!»';
              dialogueMood = 'proud';
              if (!prev.isMuted) { try { gameAudio.playPurr(); } catch (e) {} }
            } else if (!newInventory.includes(obj.heldItemId)) {
              newInventory.push(obj.heldItemId);
              const item = getItemDetail(obj.heldItemId);
              dialogueText = `«Миднайт, выплюнь каку! О... это же ${item.name}! Где ты его откопал?»`;
              dialogueMood = 'thoughtful';
              if (!prev.isMuted) gameAudio.playClick();
            }
          } else {
            dialogueText = '«Миднайт, прекрати драть казенный ковер! Иди лучше займись делом!»';
            dialogueMood = 'serious';
          }
        } 
        
        else if (id === 'trashcan') {
          newAction = 'pushing';
          if (!prev.isMuted) gameAudio.playCrash();
          obj.tipped = true;
          logText = 'Кот с разбегу опрокинул мусорную корзину!';
          
          const roomTemplateId = prev.roomInfo?.id || 'room_antique';
          
          // Decide if a torn note drops. 
          // If the trashcan holds a clue, it MUST drop.
          // Otherwise, we have a 40% chance of dropping a decorative/atmospheric dummy note, and 60% chance of no note.
          const shouldDropNote = obj.heldClueId !== null || Math.random() < 0.4;
          
          if (shouldDropNote) {
            const notePuzzle = initializeTornNote(roomTemplateId, obj.heldClueId);
            newActiveTornNote = notePuzzle;
          }
          obj.heldClueId = null; 

          if (obj.heldItemId) {
            if (obj.heldItemId === 'catnip') {
              finalIsInjured = false;
              finalHasCatnipSenses = true;
              ateCatnipThisTurn = true;
              obj.heldItemId = null;
              newLogs.push(addLog('system', `🌿 НАХОДКА! Миднайт выудил из мусора кошачью мяту! Травмы излечены, шестое чувство активировано!`));
              if (shouldDropNote) {
                dialogueText = '«Какой погром! Но постой... из мусорной корзины выкатилась кошачья мята! Миднайт тут же съел её, его раны затянулись, а глаза сверкают — шестое чувство полностью активировано! И еще тут куча обрывков секретного письма!»';
              } else {
                dialogueText = '«Какой погром! Но постой... из мусорной корзины выкатилась кошачья мята! Миднайт тут же съел её, его раны затянулись, а глаза сверкают — шестое чувство полностью активировано!»';
              }
              dialogueMood = 'proud';
              if (!prev.isMuted) { try { gameAudio.playPurr(); } catch (e) {} }
            } else if (!newInventory.includes(obj.heldItemId)) {
              newInventory.push(obj.heldItemId);
              const item = getItemDetail(obj.heldItemId);
              if (shouldDropNote) {
                dialogueText = `«Какой погром! Но... постой, из груды мусора выкатился предмет: ${item.name}! И еще тут... куча обрывков секретного письма! Давайте соберем их!»`;
              } else {
                dialogueText = `«Какой погром! Но... постой, из груды мусора выкатился предмет: ${item.name}!»`;
              }
              dialogueMood = 'shocked';
              if (!prev.isMuted) gameAudio.playClick();
            }
          } else {
            if (shouldDropNote) {
              dialogueText = '«Какой погром! Но... постой, Миднайт выкатил из корзины кучу обрывков. Это же разорванное секретное письмо! Давайте сложить его!»';
              dialogueMood = 'shocked';
            } else {
              dialogueText = '«Ох, какой грохот! Мусорная корзина перевернута вверх дном, но внутри лишь старые газеты и окурки. Ничего полезного...»';
              dialogueMood = 'serious';
            }
          }
        } 
        
        else if (id === 'painting') {
          newAction = 'scratching';
          if (!prev.isMuted) gameAudio.playScratch();
          obj.toggled = true;
          logText = 'Кот лапой скосил картину набок.';

          const isSafeCodeBehindPainting = prev.solvedSteps.includes('safe_code_via_painting');

          if (obj.heldClueId && !newFoundClues.includes(obj.heldClueId)) {
            newFoundClues.push(obj.heldClueId);
            const clue = prev.currentClues.find(c => c.id === obj.heldClueId);
            dialogueText = clue ? clue.findingMessage : 'Улика найдена за картиной!';
            dialogueMood = 'shocked';
            if (!prev.isMuted) gameAudio.playClueFound();
          } else if (isSafeCodeBehindPainting && !newInventory.includes('safe_code_note')) {
            newInventory.push('safe_code_note');
            dialogueText = `«Миднайт, ты сдвинул пейзаж... Ого! На стене под картиной нацарапан шифр: [Код сейфа: ${prev.safeCode}]! Запишу в блокнот...»`;
            dialogueMood = 'thoughtful';
            if (!prev.isMuted) gameAudio.playClick();
          } else if (obj.heldItemId && !newInventory.includes(obj.heldItemId)) {
            newInventory.push(obj.heldItemId);
            const item = getItemDetail(obj.heldItemId);
            dialogueText = `«Миднайт сдвинул картину лапой... Ба, да за рамой скотчем был приклеен ${item.name}! Какая интересная находка!»`;
            dialogueMood = 'shocked';
            obj.heldItemId = null;
            if (!prev.isMuted) gameAudio.playClick();
          } else {
            dialogueText = '«Ван Гог бы перевернулся в гробу! Зачем ты раскачиваешь раму, Миднайт? Там нет мышей!»';
            dialogueMood = 'serious';
          }
        } 
        
        else if (id === 'bookshelf') {
          newAction = 'pushing';
          if (!prev.isMuted) gameAudio.playCrash();
          obj.booksFallen = true;
          logText = 'Кот сбросил увесистые фолианты с полки!';

          const isSafeCodeBehindBooks = prev.solvedSteps.includes('safe_code_via_lamp') && prev.objects.lamp.toggled;

          if (obj.heldClueId && !newFoundClues.includes(obj.heldClueId)) {
            newFoundClues.push(obj.heldClueId);
            const clue = prev.currentClues.find(c => c.id === obj.heldClueId);
            dialogueText = clue ? clue.findingMessage : 'Улика вывалилась из книг!';
            dialogueMood = 'shocked';
            if (!prev.isMuted) gameAudio.playClueFound();
          } else if (obj.heldItemId) {
            if (obj.heldItemId === 'catnip') {
              finalIsInjured = false;
              finalHasCatnipSenses = true;
              ateCatnipThisTurn = true;
              obj.heldItemId = null;
              newLogs.push(addLog('system', `🌿 НАХОДКА! Из книги выпала кошачья мята! Травмы излечены, шестое чувство активировано!`));
              dialogueText = '«Мои драгоценные конспекты летят на пол! Но погоди... из корешка одной из книг выпала засушенная кошачья мята! Миднайт мигом её проглотил. Раны затянулись, шестое чувство активировано!»';
              dialogueMood = 'proud';
              if (!prev.isMuted) { try { gameAudio.playPurr(); } catch (e) {} }
            } else if (!newInventory.includes(obj.heldItemId)) {
              newInventory.push(obj.heldItemId);
              const item = getItemDetail(obj.heldItemId);
              dialogueText = `«Мои драгоценные конспекты! Ой, постой, из распоротого корешка книги "Убийство в Эссексе" выпал ${item.name}! Ловко!»`;
              dialogueMood = 'proud';
              if (!prev.isMuted) gameAudio.playClick();
            }
          } else if (isSafeCodeBehindBooks && !newInventory.includes('safe_code_note')) {
            newInventory.push('safe_code_note');
            dialogueText = `«Ба! На полке в углу, куда падает свет торшера, проступила кодовая комбинация: [${prev.safeCode}]! Это невероятно!»`;
            dialogueMood = 'proud';
            if (!prev.isMuted) gameAudio.playClick();
          } else {
            dialogueText = '«Ай! Книги летят прямо на меня! Миднайт, прекрати хулиганить! Это научные труды, а не кошачья когтеточка!»';
            dialogueMood = 'silly';
          }
        } 
        
        else if (id === 'fishbowl') {
          newAction = 'pushing';
          if (!prev.isMuted) gameAudio.playCrash();
          obj.tipped = true;
          logText = 'Кот опрокинул аквариум! Вода залила комод.';
          
          if (obj.heldItemId) {
            if (obj.heldItemId === 'catnip') {
              finalIsInjured = false;
              finalHasCatnipSenses = true;
              ateCatnipThisTurn = true;
              obj.heldItemId = null;
              newLogs.push(addLog('system', `🌿 НАХОДКА! Из аквариума вымыло кошачью мяту! Травмы излечены, шестое чувство активировано!`));
              dialogueText = '«О нет! Золотая рыбка на полу! Но постой... вместе с водой вымыло кошачью мяту! Миднайт мигом слизнул её — раны затянулись, а глаза горят мистическим блеском шестого чувства!»';
              dialogueMood = 'shocked';
              if (!prev.isMuted) { try { gameAudio.playPurr(); } catch (e) {} }
            } else if (!newInventory.includes(obj.heldItemId)) {
              newInventory.push(obj.heldItemId);
              const item = getItemDetail(obj.heldItemId);
              dialogueText = `«О нет! Золотая рыбка! Лови её! Погоди-ка... Вместе с водой на поднос вымыло ${item.name}! Как он там оказался?»`;
              dialogueMood = 'shocked';
              if (!prev.isMuted) gameAudio.playClick();
            }
          } else {
            dialogueText = '«Вода повсюду! Хватит устраивать купание, Миднайт! Рыбка выглядит испуганной, а я промок до нитки!»';
            dialogueMood = 'serious';
          }
        } 
        
        else if (id === 'lamp') {
          newAction = 'jumping';
          if (!prev.isMuted) gameAudio.playClick();
          obj.toggled = !obj.toggled;
          logText = obj.toggled ? 'Кот нажал на рычаг торшера и зажег лампу.' : 'Кот выключил торшер лапой.';

          const isSafeCodeViaLamp = prev.solvedSteps.includes('safe_code_via_lamp');

          if (obj.toggled) {
            if (isSafeCodeViaLamp && prev.objects.bookshelf.booksFallen && !newInventory.includes('safe_code_note')) {
              newInventory.push('safe_code_note');
              dialogueText = `«Свет озарил пустую полку... Смотри, на задней стенке шкафа проступили цифры: [${prev.safeCode}]! Это код от сейфа!»`;
              dialogueMood = 'shocked';
              if (!prev.isMuted) gameAudio.playClick();
            } else if (isSafeCodeViaLamp && !prev.objects.bookshelf.booksFallen) {
              dialogueText = '«Свет горит. Но тени от тяжелых книг на полке мешают что-то разглядеть. Нужно освободить место...»';
              dialogueMood = 'thoughtful';
            } else {
              dialogueText = '«Свет зажегся. Стало уютнее, но тени заплясали по стенам еще зловещее. Ищи лучше, Миднайт!»';
              dialogueMood = 'serious';
            }
          } else {
            dialogueText = '«Эй! Стало темно! Не играй с выключателем, у нас серьезная работа.»';
            dialogueMood = 'serious';
          }
        } 
        
        else if (id === 'desk') {
          if (obj.locked) {
            if (newInventory.includes('key_brass')) {
              obj.locked = false;
              newAction = 'meowing';
              if (!prev.isMuted) gameAudio.playClick();
              logText = 'Кот поскреб лапкой замочную скважину, а Барт отпер её латунным ключом!';
              
              const isSafeCodeViaDesk = prev.solvedSteps.includes('safe_code_via_desk');

              if (obj.heldClueId && !newFoundClues.includes(obj.heldClueId)) {
                newFoundClues.push(obj.heldClueId);
                const clue = prev.currentClues.find(c => c.id === obj.heldClueId);
                dialogueText = clue 
                  ? `«Замок поддался! Открываю ящик... О боже, да тут ${clue.name}! ${clue.description}»`
                  : 'Найдена улика в столе!';
                dialogueMood = 'shocked';
                if (!prev.isMuted) gameAudio.playClueFound();
              }

              if (isSafeCodeViaDesk && !newInventory.includes('safe_code_note')) {
                newInventory.push('safe_code_note');
                dialogueText += ` Кроме того, под двойным дном лежит бумажка! Это комбинация от сейфа: [${prev.safeCode}]!`;
                dialogueMood = 'shocked';
              }

              if (obj.heldItemId && !newInventory.includes(obj.heldItemId)) {
                newInventory.push(obj.heldItemId);
                const item = getItemDetail(obj.heldItemId);
                dialogueText += ` И еще... посмотри-ка! В ящике лежит ${item.name}!`;
                obj.heldItemId = null;
                dialogueMood = 'shocked';
              }
              
              const keyIdx = newInventory.indexOf('key_brass');
              if (keyIdx > -1) newInventory.splice(keyIdx, 1);
            } else {
              newAction = 'meowing';
              if (!prev.isMuted) gameAudio.playClick();
              dialogueText = '«Этот выдвижной ящик плотно заперт. Замочная скважина совсем крошечная, латунная. Нам нужен ключ.»';
              dialogueMood = 'thoughtful';
              logText = 'Кот скребется в запертый ящик стола.';
            }
          } else {
            dialogueText = '«Ящик стола уже открыт. Здесь только засохшая чернильница и пыль времени...»';
            if (obj.heldItemId && !newInventory.includes(obj.heldItemId)) {
              newInventory.push(obj.heldItemId);
              const item = getItemDetail(obj.heldItemId);
              dialogueText += ` Но погоди, под бумагами припрятан ${item.name}!`;
              obj.heldItemId = null;
            }
            dialogueMood = 'serious';
            logText = 'Кот заглянул в уже открытый стол.';
          }
        }

        // Apply item updates
        objectsCopy[id] = obj;
        
        // Push log
        if (logText) {
          newLogs.push(addLog('cat', logText));
        }

        // Check if safe_code_note was just added to inventory
        if (newInventory.includes('safe_code_note') && !prev.inventory.includes('safe_code_note')) {
          newLogs.push(addLog('system', `Записан кодовый шифр от сейфа: ${prev.safeCode}`));
        }

        let updatedCash = prev.economy?.cash ?? 150;
        let recentExpensesList = prev.economy?.recentExpenses ? [...prev.economy.recentExpenses] : [];

        // Check for Injury / Penalty risk on destructive actions
        let isDestructive = false;
        if (id === 'bookshelf' && !prev.objects.bookshelf.booksFallen) isDestructive = true;
        if (id === 'trashcan' && !prev.objects.trashcan.tipped) isDestructive = true;
        if (id === 'fishbowl' && !prev.objects.fishbowl.tipped) isDestructive = true;

        let gotInjured = false;
        let gotFine = false;
        let fineAmount = 30;

        const currentRep = prev.reputation ?? 0;
        const hazardChance = currentRep >= 60 ? 0.35 : currentRep >= 25 ? 0.25 : 0.15;

        if (isDestructive && Math.random() < hazardChance) {
          const coin = Math.random();
          if (coin < 0.4) {
            gotInjured = true;
          } else if (coin < 0.8) {
            gotFine = true;
          } else {
            gotInjured = true;
            gotFine = true;
          }
        }

        if (ateCatnipThisTurn) {
          gotInjured = false;
        }

        // Apply injury
        if (gotInjured && !finalIsInjured) {
          finalIsInjured = true;
          newLogs.push(addLog('system', `⚠️ ТРАВМА! Миднайт поранил лапу о разбитые осколки или падающие предметы! Движения замедлены.`));
          dialogueText = `«Ай! Кот хромает! Миднайт поранил лапку... Мне нужно купить Кошачью мяту в Лавке подворотни, чтобы поскорее залечить его рану!»`;
          dialogueMood = 'shocked';
          dialogueSender = 'detective';
        }

        // Apply fine
        if (gotFine) {
          updatedCash = Math.max(0, updatedCash - fineAmount);
          recentExpensesList = [
            { name: 'Штраф за порчу имущества', amount: fineAmount, timestamp: new Date().toLocaleTimeString() },
            ...recentExpensesList
          ];
          newLogs.push(addLog('system', `⚠️ ШТРАФ! Из бюджета бюро списано -${fineAmount}$ за испорченное имущество.`));
          if (!gotInjured) {
            dialogueText = `«Шмяк! Бабах! О боже, Миднайт, ты разбил казенное имущество! Хозяин выставил нам счет на ${fineAmount}$. Придется платить из бюджета бюро...»`;
            dialogueMood = 'serious';
            dialogueSender = 'detective';
          }
        }

        // Check Victory conditions
        let nextStatus = prev.gameStatus;
        let isPendingVictory = false;
        let updatedReputation = prev.reputation ?? 0;

        if (newFoundClues.length >= 3 && prev.foundClueIds.length < 3) {
          isPendingVictory = true;
          const isStory = prev.storyState?.mode === 'story';
          const ch = prev.storyState?.chapter ?? 1;
          const reward = isStory ? (ch === 1 ? 200 : ch === 2 ? 300 : 400) : (prev.activeJob?.reward ?? 150);
          const expensesTotal = 110;
          const netProfit = reward - expensesTotal;
          updatedCash += netProfit;

          recentExpensesList = [
            { name: 'Аренда офиса Барта', amount: 50, timestamp: new Date().toLocaleTimeString() },
            { name: 'Паштет из лосося для Миднайта', amount: 35, timestamp: new Date().toLocaleTimeString() },
            { name: 'Табак для трубки Барта', amount: 15, timestamp: new Date().toLocaleTimeString() },
            { name: 'Черный крепкий кофе', amount: 10, timestamp: new Date().toLocaleTimeString() },
            ...recentExpensesList
          ];

          const repGain = isStory 
            ? (ch === 1 ? 15 : ch === 2 ? 25 : 40) 
            : (prev.activeJob?.risk === 'high' ? 35 : prev.activeJob?.risk === 'medium' ? 20 : 10);
          const timerBonus = prev.timerActive ? 10 : 0;
          updatedReputation += (repGain + timerBonus);

          newLogs.push(addLog('system', `ДЕЛО УСПЕШНО РАСКРЫТО! Получен гонорар: +${reward}$. Списаны расходы бюро: -${expensesTotal}$. Чистая прибыль: +${netProfit}$.`));
          newLogs.push(addLog('system', `📈 РЕПУТАЦИЯ ПОВЫШЕНА: +${repGain} очков!${timerBonus ? ` Бонус за скорость: +${timerBonus} очков!` : ''}`));
          setTimeout(() => {
            if (!prev.isMuted) gameAudio.playClueFound();
          }, 1000);
        }

        // Automatically settle cat back to idle after action animation finishes
        if (newAction !== 'idle') {
          setTimeout(() => {
            setGameState(p => {
              if (p.catPosition === id && p.catAction === newAction) {
                return { ...p, catAction: 'idle' };
              }
              return p;
            });
          }, 2200);
        }

        return {
          ...prev,
          objects: objectsCopy,
          catAction: newAction,
          inventory: newInventory,
          foundClueIds: newFoundClues,
          activeTornNote: newActiveTornNote,
          logs: newLogs,
          gameStatus: nextStatus,
          pendingVictory: isPendingVictory || prev.pendingVictory,
          economy: {
            cash: updatedCash,
            recentExpenses: recentExpensesList
          },
          reputation: updatedReputation,
          isInjured: finalIsInjured,
          hasCatnipSenses: finalHasCatnipSenses,
          activeDialogue: {
            sender: dialogueSender,
            text: dialogueText,
            mood: dialogueMood
          }
        };
      });
    }, climbDelay);
  };

  // Safe Code Validation
  const handleEnterSafeCode = (code: string): boolean => {
    if (code === gameState.safeCode) {
      // Crack safe!
      setGameState(prev => {
        const objectsCopy = { ...prev.objects };
        const safeObj = { ...objectsCopy['safe'] };
        safeObj.locked = false;
        objectsCopy['safe'] = safeObj;
        
        const newFoundClues = [...prev.foundClueIds];
        const newInventory = [...prev.inventory];
        const newLogs = [...prev.logs];
        let dialogueText = '';
        let dialogueMood = 'proud';

        newLogs.push(addLog('system', `Механический сейф успешно открыт комбинацией ${code}.`));

        if (safeObj.heldClueId && !newFoundClues.includes(safeObj.heldClueId)) {
          newFoundClues.push(safeObj.heldClueId);
          const clue = prev.currentClues.find(c => c.id === safeObj.heldClueId);
          dialogueText = clue 
            ? `«Сейф щелкнул и распахнулся! Ого, внутри лежит завернутый в шелк предмет... Это же ${clue.name}! ${clue.description}»`
            : 'Улика извлечена из сейфа!';
          dialogueMood = 'shocked';
          if (!prev.isMuted) gameAudio.playClueFound();
        }

        // Consume safe code note if present in inventory
        const noteIdx = newInventory.indexOf('safe_code_note');
        if (noteIdx > -1) newInventory.splice(noteIdx, 1);

        // Check win
        let nextStatus = prev.gameStatus;
        let isPendingVictory = false;
        let updatedCash = prev.economy?.cash ?? 150;
        let recentExpensesList = prev.economy?.recentExpenses ? [...prev.economy.recentExpenses] : [];
        let updatedReputation = prev.reputation ?? 0;

        if (newFoundClues.length >= 3) {
          isPendingVictory = true;
          const isStory = prev.storyState?.mode === 'story';
          const ch = prev.storyState?.chapter ?? 1;
          const reward = isStory ? (ch === 1 ? 200 : ch === 2 ? 300 : 400) : (prev.activeJob?.reward ?? 150);
          const expensesTotal = 110;
          const netProfit = reward - expensesTotal;
          updatedCash += netProfit;

          recentExpensesList = [
            { name: 'Аренда офиса Барта', amount: 50, timestamp: new Date().toLocaleTimeString() },
            { name: 'Паштет из лосося для Миднайта', amount: 35, timestamp: new Date().toLocaleTimeString() },
            { name: 'Табак для трубки Барта', amount: 15, timestamp: new Date().toLocaleTimeString() },
            { name: 'Черный крепкий кофе', amount: 10, timestamp: new Date().toLocaleTimeString() }
          ];

          const repGain = isStory 
            ? (ch === 1 ? 15 : ch === 2 ? 25 : 40) 
            : (prev.activeJob?.risk === 'high' ? 35 : prev.activeJob?.risk === 'medium' ? 20 : 10);
          const timerBonus = prev.timerActive ? 10 : 0;
          updatedReputation += (repGain + timerBonus);

          newLogs.push(addLog('system', `ДЕЛО УСПЕШНО РАСКРЫТО! Получен гонорар: +${reward}$. Списаны расходы бюро: -${expensesTotal}$. Чистая прибыль: +${netProfit}$.`));
          newLogs.push(addLog('system', `📈 РЕПУТАЦИЯ ПОВЫШЕНА: +${repGain} очков!${timerBonus ? ` Бонус за скорость: +${timerBonus} очков!` : ''}`));
        }

        return {
          ...prev,
          objects: objectsCopy,
          foundClueIds: newFoundClues,
          inventory: newInventory,
          logs: newLogs,
          gameStatus: nextStatus,
          pendingVictory: isPendingVictory || prev.pendingVictory,
          economy: {
            cash: updatedCash,
            recentExpenses: recentExpensesList
          },
          reputation: updatedReputation,
          activeDialogue: {
            sender: 'detective',
            text: dialogueText,
            mood: dialogueMood
          }
        };
      });
      return true;
    }
    return false;
  };

  // Reset or load a new case retaining cash balance
  const handleResetGame = () => {
    gameAudio.stopAmbientMusic();
    const isStory = gameState.storyState?.mode === 'story';
    const currentCh = gameState.storyState?.chapter || 1;
    const currentCash = gameState.economy?.cash || 150;
    
    let nextChapter = currentCh;
    let nextMode = gameState.storyState?.mode || 'sandbox';

    if (gameState.gameStatus === 'won' && isStory) {
      if (currentCh < 3) {
        nextChapter = currentCh + 1;
      } else {
        // Completed campaign, reset to start menu (intro)
        setGameState(prev => ({
          ...prev,
          gameStatus: 'intro'
        }));
        return;
      }
    }

    const cleanState = generateNewGame(nextMode, nextChapter, currentCash, gameState.reputation || 0);
    cleanState.gameStatus = 'playing';
    cleanState.isMuted = gameState.isMuted;
    setGameState(cleanState);
    
    setTimeout(() => {
      try {
        gameAudio.init();
        gameAudio.setMute(gameState.isMuted);
        if (!gameState.isMuted) {
          gameAudio.playMeow();
        }
      } catch (e) {}
    }, 100);
  };

  const handleReturnToMenu = () => {
    gameAudio.stopAmbientMusic();
    setIsShopOpen(false);
    setIsLogOpen(false);
    setGameState(prev => {
      let updatedJobs = prev.availableJobs;
      let updatedCampaignChapters = prev.campaignChapters;
      let updatedCompletedChapters = prev.storyState?.completedChapters ? [...prev.storyState.completedChapters] : [];

      if (prev.gameStatus === 'won' || prev.gameStatus === 'playing') {
        // Mark current activeJob as completed in availableJobs
        updatedJobs = prev.availableJobs?.map(job => {
          if (prev.activeJob && job.id === prev.activeJob.id) {
            return { ...job, completed: true };
          }
          return job;
        }) || [];

        // Check if story chapter is completed, add to completedChapters array
        if (prev.storyState?.mode === 'story' && prev.storyState?.chapter) {
          const finishedCh = prev.storyState.chapter;
          if (!updatedCompletedChapters.includes(finishedCh)) {
            updatedCompletedChapters.push(finishedCh);
          }
        }

        // Also mark completed in campaignChapters!
        updatedCampaignChapters = prev.campaignChapters?.map(job => {
          if (prev.activeJob && job.id === prev.activeJob.id) {
            return { ...job, completed: true };
          }
          return job;
        }) || [];
      }

      return {
        ...prev,
        availableJobs: updatedJobs,
        campaignChapters: updatedCampaignChapters,
        storyState: prev.storyState ? {
          ...prev.storyState,
          completedChapters: updatedCompletedChapters
        } : undefined,
        gameStatus: 'intro',
        activeJob: null
      };
    });
  };

  const handleSelectJob = (job: Job) => {
    setIsShopOpen(false);
    setIsLogOpen(false);
    setGameState(prev => {
      const isStory = job.id.startsWith('story_chapter_');
      let chapterNum = 1;
      if (isStory) {
        const match = job.id.match(/story_chapter_(\d+)/);
        if (match) {
          chapterNum = parseInt(match[1], 10);
        }
      }

      const cleanState = generateNewGame(
        isStory ? 'story' : 'sandbox',
        chapterNum,
        prev.economy?.cash || 150,
        prev.reputation || 0,
        job
      );

      return {
        ...cleanState,
        availableJobs: prev.availableJobs,
        campaignChapters: prev.campaignChapters,
        currentDay: prev.currentDay,
        daysSurvived: prev.daysSurvived,
        gameStatus: 'playing',
        isMuted: prev.isMuted,
        storyState: {
          ...cleanState.storyState,
          completedChapters: prev.storyState?.completedChapters || []
        }
      };
    });
  };

  const handleEndDay = () => {
    const fromDay = gameState.currentDay ?? 1;
    const toDay = fromDay + 1;

    setDayTransition({
      isActive: true,
      fromDay,
      toDay,
      isFadingOut: false
    });

    try {
      if (!gameState.isMuted) {
        gameAudio.playClick();
      }
    } catch (e) {}

    setTimeout(() => {
      setGameState(prev => {
        const nextDay = (prev.currentDay ?? 1) + 1;
        const nextRep = prev.reputation ?? 0;
        
        // Deduct rent and expenses
        const updatedCash = (prev.economy?.cash ?? 150) - 110;
        
        const dailyExpensesList = [
          { name: `Аренда офиса (День ${prev.currentDay ?? 1})`, amount: 50, timestamp: new Date().toLocaleTimeString() },
          { name: `Паштет из лосося (День ${prev.currentDay ?? 1})`, amount: 35, timestamp: new Date().toLocaleTimeString() },
          { name: `Крепкий табак Барта (День ${prev.currentDay ?? 1})`, amount: 15, timestamp: new Date().toLocaleTimeString() },
          { name: `Черный кофе (День ${prev.currentDay ?? 1})`, amount: 10, timestamp: new Date().toLocaleTimeString() },
          ...(prev.economy?.recentExpenses || [])
        ];

        // Generate new random jobs
        const newJobs = generateDailyJobs(nextDay, nextRep);

        const nextStatus = updatedCash < 0 ? 'lost' : 'sandbox_dashboard';

        return {
          ...prev,
          currentDay: nextDay,
          writerCasesToday: 0,
          daysSurvived: (prev.daysSurvived ?? 0) + (updatedCash >= 0 ? 1 : 0),
          availableJobs: newJobs,
          activeJob: null,
          gameStatus: nextStatus,
          economy: {
            cash: updatedCash,
            recentExpenses: dailyExpensesList
          }
        };
      });

      // Start fading out the transition screen
      setDayTransition(prev => prev ? { ...prev, isFadingOut: true } : null);

      setTimeout(() => {
        setDayTransition(null);
      }, 1000);

    }, 3000);
  };

  const handleBuyLead = (jobId: string) => {
    setGameState(prev => {
      const targetJob = prev.availableJobs?.find(j => j.id === jobId);
      if (!targetJob) return prev;
      
      const cost = targetJob.infoCost;
      const currentCash = prev.economy?.cash ?? 150;
      if (currentCash < cost) return prev;

      const updatedJobs = prev.availableJobs?.map(j => {
        if (j.id === jobId) {
          return { ...j, leadPurchased: true };
         }
        return j;
      }) || [];

      const updatedExpensesList = [
        { name: `Сведения от крысы Реми (Кейс #${jobId.split('_').slice(-1)[0]})`, amount: cost, timestamp: new Date().toLocaleTimeString() },
        ...(prev.economy?.recentExpenses || [])
      ];

      return {
        ...prev,
        economy: {
          cash: currentCash - cost,
          recentExpenses: updatedExpensesList
        },
        availableJobs: updatedJobs
      };
    });
  };

  const handleReturnToDashboard = () => {
    gameAudio.stopAmbientMusic();
    setIsShopOpen(false);
    setIsLogOpen(false);
    setGameState(prev => {
      // Mark current activeJob as completed in availableJobs
      const updatedJobs = prev.availableJobs?.map(job => {
        if (prev.activeJob && job.id === prev.activeJob.id) {
          return { ...job, completed: true };
        }
        return job;
      }) || [];

      // Check if story chapter is completed, add to completedChapters array
      let updatedCompletedChapters = prev.storyState?.completedChapters ? [...prev.storyState.completedChapters] : [];
      if (prev.storyState?.mode === 'story' && prev.storyState?.chapter) {
        const finishedCh = prev.storyState.chapter;
        if (!updatedCompletedChapters.includes(finishedCh)) {
          updatedCompletedChapters.push(finishedCh);
        }
      }

      // Also mark completed in campaignChapters!
      const updatedCampaignChapters = prev.campaignChapters?.map(job => {
        if (prev.activeJob && job.id === prev.activeJob.id) {
          return { ...job, completed: true };
        }
        return job;
      }) || [];

      // Calculate writer royalties if it was a custom-written case
      let royaltiesGained = 0;
      let newLogs = prev.logs ? [...prev.logs] : [];
      if (prev.activeJob) {
        const jobId = prev.activeJob.id;
        if (jobId.startsWith('custom_job_') || jobId.startsWith('custom_campaign_ch_')) {
          royaltiesGained = Math.round(prev.activeJob.reward * 0.4);
          newLogs.push(addLog('system', `✍️ НАЧИСЛЕНИЕ РОЯЛТИ: Как создатель дела, вы получаете 40% авторского гонорара (+${royaltiesGained}$ в сейф калибра 30-х)!`));
        }
      }

      return {
        ...prev,
        gameStatus: 'sandbox_dashboard',
        activeJob: null,
        availableJobs: updatedJobs,
        campaignChapters: updatedCampaignChapters,
        writerRoyalties: (prev.writerRoyalties ?? 0) + royaltiesGained,
        logs: newLogs,
        pendingVictory: false,
        storyState: {
          ...prev.storyState,
          mode: 'sandbox',
          completedChapters: updatedCompletedChapters
        }
      };
    });
  };

  const handlePublishSubmit = async () => {
    setIsCritiquing(true);
    setCritiqueResult(null);
    try {
      const response = await fetch('/api/writer/critique', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: gameState.customCampaignIdea || 'Детективный роман о Вансе и его коте Миднайте',
          ratingIdea,
          ratingExecution
        })
      });
      const data = await response.json();
      setCritiqueResult(data);
    } catch (err) {
      console.error('Critique failed:', err);
      setCritiqueResult({
        grade: 'B',
        sales_performance: 'Посредственный тираж',
        profit: 100,
        review: 'Литературный критик не смог достучаться до редакции из-за тумана, но издательство выплатило базовый гонорар за старания.'
      });
    } finally {
      setIsCritiquing(false);
    }
  };

  const handleClaimRoyalties = () => {
    if (!critiqueResult) return;
    const profit = critiqueResult.profit || 0;
    
    setGameState(prev => {
      const currentCash = prev.economy?.cash ?? 150;
      
      const newLogs = [...prev.logs];
      newLogs.push(addLog('system', `📚 ИЗДАТЕЛЬСТВО: Опубликован роман "${prev.customCampaignIdea || 'Дело Миднайта'}"! Продажи принесли: ${profit}$!`));
      
      return {
        ...prev,
        economy: {
          ...prev.economy,
          cash: currentCash + profit
        },
        // Reset custom campaign states so they can write another one!
        customCampaignIdea: null,
        campaignChapters: []
      };
    });
    
    setShowPublishPopup(false);
    setCritiqueResult(null);
  };

  const handleChangeLocation = (loc: 'pier' | 'warehouse' | 'hall' | 'study' | 'attic' | 'basement') => {
    if (gameState.gameStatus !== 'playing') return;
    gameAudio.playClick();
    setGameState(prev => {
      const roomId = prev.roomInfo?.id;
      let logLocName = '';
      let dialogueText = '';
      let isTransitionBlocked = false;
      let blockDialogue = '';
      const updatedSolvedSteps = [...(prev.solvedSteps || [])];
      const updatedInventory = [...(prev.inventory || [])];

      // Chapter 2 / Multi-Room / Sandbox 2-room Layout: Block Warehouse if not unlocked
      if (loc === 'warehouse') {
        const isUnlocked = updatedSolvedSteps.includes('unlocked_warehouse');
        if (!isUnlocked) {
          if (updatedInventory.includes('key_door')) {
            updatedSolvedSteps.push('unlocked_warehouse');
          } else {
            isTransitionBlocked = true;
            blockDialogue = '«Дверь на склад закрыта на прочный стальной замок! Нам нужен Стальной дверной ключ. Миднайт, посмотри на причале!»';
          }
        }
      }

      // 4-Room Layouts (Chapter 1 / 3): Block Attic and Basement
      if (loc === 'attic') {
        const isUnlocked = updatedSolvedSteps.includes('unlocked_attic');
        if (!isUnlocked) {
          if (updatedInventory.includes('key_door')) {
            updatedSolvedSteps.push('unlocked_attic');
          } else {
            isTransitionBlocked = true;
            blockDialogue = '«Дверь на чердак заперта! Требуется стальной дверной ключ... Кажется, в кабинете хозяина на столе был запертый ящик стола — ключ может быть там.»';
          }
        }
      }

      if (loc === 'basement') {
        const isUnlocked = updatedSolvedSteps.includes('unlocked_basement');
        if (!isUnlocked) {
          if (updatedInventory.includes('passcard')) {
            updatedSolvedSteps.push('unlocked_basement');
          } else {
            isTransitionBlocked = true;
            blockDialogue = '«Люк в подвал заблокирован электронным замком Синдиката! Требуется Электронная ключ-карта. Интересно, заговорщики не прячут её на чердаке?»';
          }
        }
      }

      if (isTransitionBlocked) {
        return {
          ...prev,
          activeDialogue: {
            sender: 'detective',
            text: blockDialogue,
            mood: 'thoughtful'
          },
          logs: [
            ...prev.logs,
            {
              id: `log_blocked_${Date.now()}`,
              sender: 'system',
              text: '🔒 Путь заблокирован! Требуется специальный ключ или допуск.',
              timestamp: new Date().toLocaleTimeString()
            }
          ]
        };
      }

      if (loc === 'hall') {
        logLocName = 'Холл особняка';
        dialogueText = '«Мы спустились в холодный скрипучий холл первого этажа. Под ковром или в мусорной корзине точно что-то скрыто...»';
      } else if (loc === 'study') {
        logLocName = 'Кабинет хозяина';
        dialogueText = '«Вот мы и в кабинете. На лакированном столе разбросаны шифры, лампа отбрасывает косые тени на стены...»';
      } else if (loc === 'attic') {
        logLocName = 'Пыльный чердак';
        dialogueText = '«Уф, ну и пылища! Под самой крышей воет ветер, а среди старых книг и винтажных портретов таятся грязные тайны...»';
      } else if (loc === 'basement') {
        logLocName = 'Сырой подвал';
        dialogueText = '«Мы спустились по винтовой лестнице в подвал. С потолка капает сырость, а в углу стоит массивный стальной сейф...»';
      } else if (roomId === 'room_mansion') {
        logLocName = loc === 'pier' ? 'Первый этаж (Прихожая)' : 'Второй этаж (Гостиная)';
        dialogueText = loc === 'pier' 
          ? '«Итак, мы спустились в просторный холл первого этажа. Под ногами скрипит дорогой паркет...»'
          : '«Мы поднялись по дубовой лестнице на второй этаж. В этой гостиной лорд проводил последние часы...»';
      } else if (roomId === 'room_shop') {
        logLocName = loc === 'pier' ? 'Торговый зал' : 'Подсобка и склад';
        dialogueText = loc === 'pier' 
          ? '«Мы вернулись в торговый зал лавки. Полки заставлены мешками, но касса пуста...»'
          : '«Так-так, это служебная подсобка. Здесь темно и пахнет сырой мешковиной. Идеальный тайник!»';
      } else if (roomId === 'room_museum') {
        logLocName = loc === 'pier' ? 'Зал картин' : 'Зал скульптур';
        dialogueText = loc === 'pier' 
          ? '«Вернулись в картинную галерею. Вековые шедевры молчаливо следят за каждым нашим шагом...»'
          : '«Мы вошли в зал скульптур. Мраморные статуи отбрасывают длинные, пугающие тени во мраке...»';
      } else {
        logLocName = loc === 'pier' ? 'Туманный причал' : 'Склад №9';
        dialogueText = loc === 'pier' 
          ? '«Бр-р, какой промозглый туман на этом причале! Миднайт, держись ближе к моим ботинкам, чтобы не свалиться в воду!»'
          : '«Итак, мы пробрались внутрь Склада №9. Здесь темно, хоть глаз выколи... Какие тайны скрывают контрабандисты?»';
      }

      let systemLogMsg = `Миднайт и Барт переместились: ${logLocName}`;
      if (updatedSolvedSteps.length > prev.solvedSteps.length) {
        if (loc === 'warehouse') systemLogMsg = `🔓 Вы использовали Стальной ключ и отперли дверь на Склад!`;
        if (loc === 'attic') systemLogMsg = `🔓 Вы использовали Стальной ключ и отперли дверь на Чердак!`;
        if (loc === 'basement') systemLogMsg = `🔓 Вы использовали Ключ-карту и отперли Люк в подвал!`;
      }

      return {
        ...prev,
        solvedSteps: updatedSolvedSteps,
        storyState: {
          ...prev.storyState,
          currentLocationId: loc
        },
        logs: [
          ...prev.logs,
          addLog('system', systemLogMsg)
        ],
        activeDialogue: {
          sender: 'detective',
          text: dialogueText,
          mood: 'thoughtful'
        }
      };
    });
  };

  return (
    <div className="relative w-full min-h-screen bg-[#050505] text-white flex flex-col font-sans selection:bg-white selection:text-black">
      {/* Visual overlay effects */}
      <RainEffect />
      <FilmGrain />

      {/* Atmospheric Header Bar */}
      <header className="w-full border-b border-white/10 bg-black/90 px-5 py-4 flex justify-between items-center z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-none border border-white/15 bg-black flex items-center justify-center">
            <Lucide.Cat className="w-4 h-4 text-white/70" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-sm sm:text-base font-bold tracking-wide italic leading-none">
                Noir Detective Cat
              </h1>
              <div className="flex flex-wrap items-center gap-1.5">
                <div className="px-2 py-0.5 border border-emerald-500/30 bg-emerald-950/20 rounded-none text-[8px] font-mono text-emerald-400 font-bold uppercase tracking-widest leading-none">
                  Бюджет бюро: {gameState.economy?.cash ?? 150}$
                </div>
                {gameState.reputation !== undefined && (
                  <div className="px-2 py-0.5 border border-amber-500/30 bg-amber-950/20 rounded-none text-[8px] font-mono text-amber-400 font-bold uppercase tracking-widest leading-none">
                    ★ {gameState.reputation} ({getReputationRank(gameState.reputation)})
                  </div>
                )}
              </div>
            </div>
            <span className="font-sans text-[8px] text-white/40 uppercase tracking-[0.25em] block mt-1.5 leading-none">
              {gameState.roomInfo?.caseName || 'КЕЙС №42'} // {gameState.storyState?.mode === 'story' ? `СЮЖЕТ (ГЛАВА ${gameState.storyState?.chapter ?? 1})` : 'ПЕСОЧНИЦА'}
            </span>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-4">
          {gameState.gameStatus === 'sandbox_dashboard' ? (
            (() => {
              const completedCount = (gameState.availableJobs ?? []).filter(j => j && j.completed).length;
              let simulatedTime = '09:00';
              let desc = 'Утро (До темноты: 9 ч.)';
              if (completedCount === 1) {
                simulatedTime = '12:00';
                desc = 'Полдень (До темноты: 6 ч.)';
              } else if (completedCount === 2) {
                simulatedTime = '15:00';
                desc = 'День (До темноты: 3 ч.)';
              } else if (completedCount >= 3) {
                simulatedTime = '18:00';
                desc = 'Вечер (Стемнело! Пора закрывать день)';
              }

              return (
                <button
                  onClick={() => {
                    gameAudio.playClick();
                    let chatDesc = "Пора приниматься за расследования!";
                    if (completedCount === 1) chatDesc = "Половина дня впереди, работаем!";
                    if (completedCount === 2) chatDesc = "Солнце клонится к закату. Успеем ли закрыть последнее дело?";
                    if (completedCount >= 3) chatDesc = "На город опустились густые сумерки. Пора завершать день!";
                    
                    setGameState(prev => ({
                      ...prev,
                      activeDialogue: {
                        sender: 'detective',
                        text: `«Барт взглянул на свои карманные часы: "${simulatedTime}. ${chatDesc}"»`,
                        mood: 'thoughtful'
                      }
                    }));
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-amber-500/40 bg-amber-950/30 hover:bg-amber-950/50 text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest leading-none cursor-pointer transition-all"
                  title="Посмотреть время рабочего дня"
                >
                  <Lucide.Clock className="w-3.5 h-3.5 shrink-0 animate-pulse text-amber-500" />
                  <span>ВРЕМЯ: {simulatedTime} ({desc})</span>
                </button>
              );
            })()
          ) : (
            gameState.timerActive && gameState.timeLeft !== undefined && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 border border-red-500/40 bg-red-950/40 animate-pulse text-[10px] font-mono font-bold text-red-400 uppercase tracking-widest leading-none">
                <Lucide.Clock className="w-3.5 h-3.5 shrink-0" />
                <span>ВРЕМЯ: {Math.floor(gameState.timeLeft / 60)}:{(gameState.timeLeft % 60) < 10 ? '0' : ''}{gameState.timeLeft % 60}</span>
              </div>
            )
          )}

          <div className="flex gap-2">
          <button 
            onClick={() => {
              gameAudio.playClick();
              const hintText = getLogicalHint(gameState);
              setGameState(prev => ({
                ...prev,
                activeDialogue: {
                  sender: 'detective',
                  text: `«Хм... ${hintText}»`,
                  mood: 'thoughtful'
                }
              }));
            }}
            className="px-3 h-8 rounded-none border border-white/10 hover:border-white/30 bg-black text-[9px] font-sans uppercase tracking-[0.15em] flex items-center gap-1.5 text-white/50 hover:text-white transition-all shadow"
            title="Получить подсказку"
          >
            <Lucide.Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            Подсказка
          </button>

          <button 
            onClick={() => {
              gameAudio.playClick();
              setIsHelpOpen(!isHelpOpen);
            }}
            className="w-8 h-8 rounded-none border border-white/10 hover:border-white/30 bg-black flex items-center justify-center text-white/50 hover:text-white transition-all shadow"
            title="Инструкция"
          >
            <Lucide.HelpCircle className="w-4 h-4" />
          </button>
          
          <button 
            onClick={() => {
              setGameState(prev => ({ ...prev, isMuted: !prev.isMuted }));
            }}
            className="w-8 h-8 rounded-none border border-white/10 hover:border-white/30 bg-black flex items-center justify-center text-white/50 hover:text-white transition-all shadow"
            title={gameState.isMuted ? "Включить звук" : "Выключить звук"}
          >
            {gameState.isMuted ? <Lucide.VolumeX className="w-4 h-4" /> : <Lucide.Volume2 className="w-4 h-4" />}
          </button>

          <button 
            onClick={handleResetGame}
            className="px-3.5 h-8 rounded-none border border-white/10 hover:border-white/30 bg-black text-[9px] font-sans uppercase tracking-[0.15em] flex items-center gap-1.5 text-white/50 hover:text-white transition-all shadow"
            title="Перегенерировать загадку"
          >
            <Lucide.RotateCcw className="w-3.5 h-3.5" />
            Сброс
          </button>

          <button 
            onClick={handleReturnToMenu}
            className="px-3 h-8 rounded-none border border-red-500/10 hover:border-red-500/30 bg-black text-[9px] font-sans uppercase tracking-[0.15em] flex items-center gap-1 text-red-400/70 hover:text-red-400 transition-all shadow"
            title="Вернуться в главное меню"
          >
            <Lucide.LogOut className="w-3.5 h-3.5" />
            Меню
          </button>
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      {gameState.gameStatus === 'sandbox_dashboard' ? (
        <>
          <SandboxDashboard 
            gameState={gameState}
            setGameState={setGameState}
            onSelectJob={handleSelectJob}
            onEndDay={handleEndDay}
            onBuyLead={handleBuyLead}
            onReturnToMenu={handleReturnToMenu}
            onOpenWriter={() => setIsWriterOpen(true)}
          />
          {isWriterOpen && (
            <WriterMode
              gameState={gameState}
              setGameState={setGameState}
              onClose={() => setIsWriterOpen(false)}
            />
          )}
        </>
      ) : (
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 flex flex-col lg:flex-row gap-5 relative z-20 min-h-[580px]">
        
        {/* Left side: Game Visuals Grid */}
        <div className="flex-1 flex flex-col gap-3 justify-between">
          <GameScene 
            gameState={gameState} 
            onObjectInteraction={handleObjectInteraction}
            onEnterSafeCode={handleEnterSafeCode}
            onChangeLocation={handleChangeLocation}
          />
          
          {/* Active Dialog Bubble */}
          <NarrativeBox 
            dialogue={gameState.activeDialogue}
            pendingVictory={gameState.pendingVictory}
            onNext={() => {
              setGameState(prev => {
                if (prev.pendingVictory) {
                  return {
                    ...prev,
                    activeDialogue: null,
                    gameStatus: 'won',
                    pendingVictory: false
                  };
                }
                return { ...prev, activeDialogue: null };
              });
            }}
          />
        </div>

        {/* Right side: Case files, logs, clues */}
        <div className="w-full lg:w-[380px] flex flex-col gap-3 shrink-0">
          {/* Tracker holds case cards & items */}
          <ClueTracker 
            currentClues={gameState.currentClues}
            foundClueIds={gameState.foundClueIds}
            inventory={gameState.inventory}
            safeCode={gameState.safeCode}
            customItems={gameState.customItems}
            activeTornNote={gameState.activeTornNote}
            onOpenTornNote={() => setIsTornNoteOpen(true)}
          />

          {/* Collapsible Panel Triggers (Shop and Logs) */}
          <div className="grid grid-cols-2 gap-3.5 mt-1 select-none shrink-0">
            <button 
              onClick={() => {
                gameAudio.playClick();
                setIsShopOpen(true);
                setIsLogOpen(false);
              }}
              className="py-3 border border-amber-500/30 hover:border-amber-500/60 bg-amber-950/10 hover:bg-amber-950/25 text-amber-400 font-sans text-[10px] font-bold uppercase tracking-[0.18em] transition-all flex items-center justify-center gap-2 relative shadow-lg hover:scale-[1.02] cursor-pointer"
              title="Открыть Кошачью лавку"
            >
              <Lucide.Store className="w-4 h-4 text-amber-500 animate-pulse" />
              <span>Лавка подворотни</span>
              {gameState.isInjured && (
                <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-red-600 rounded-full border border-black animate-ping" />
              )}
            </button>
            <button 
              onClick={() => {
                gameAudio.playClick();
                setIsLogOpen(true);
                setIsShopOpen(false);
              }}
              className="py-3 border border-white/10 hover:border-white/20 bg-black/60 text-white/80 hover:text-white hover:bg-black/90 font-sans text-[10px] font-bold uppercase tracking-[0.18em] transition-all flex items-center justify-center gap-2 relative shadow-lg hover:scale-[1.02] cursor-pointer"
              title="Открыть Протокол Осмотра"
            >
              <Lucide.FileText className="w-4 h-4 text-white/50" />
              <span>Логи ({gameState.logs.length})</span>
            </button>
          </div>
        </div>
      </main>
      )}

      {/* DRAWER BACKDROP */}
      {(isShopOpen || isLogOpen) && (
        <div 
          onClick={() => {
            setIsShopOpen(false);
            setIsLogOpen(false);
          }}
          className="fixed inset-0 bg-black/60 z-[90] backdrop-blur-[3px] transition-all duration-300 animate-fade-in"
        />
      )}

      {/* DRAWER: ALLEYWAY SHOP */}
      {isShopOpen && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-[#070707] border-l border-white/15 z-[100] p-6 shadow-2xl flex flex-col backdrop-blur-md transition-all duration-300">
          <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-4 select-none">
            <div className="flex items-center gap-2.5">
              <Lucide.Store className="w-4 h-4 text-amber-500 animate-pulse" />
              <h3 className="font-serif text-sm font-bold tracking-wide italic text-amber-100 uppercase">
                Кошачья лавка подворотни
              </h3>
            </div>
            <button 
              onClick={() => {
                gameAudio.playClick();
                setIsShopOpen(false);
              }}
              className="px-2 py-1 text-white/40 hover:text-white border border-white/5 hover:border-white/15 bg-black/40 font-mono text-[9px] uppercase tracking-wider transition-all cursor-pointer"
            >
              [Закрыть]
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
            <AlleywayShop 
              gameState={gameState}
              onBuyItem={(itemId) => {
                handleBuyItem(itemId);
              }}
            />
          </div>

          <div className="border-t border-white/10 pt-4 mt-4 text-center select-none">
            <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.2em] block">
              Баланс бюро: <span className="text-emerald-400 font-bold">{gameState.economy?.cash ?? 150}$</span>
            </span>
          </div>
        </div>
      )}

      {/* DRAWER: PROTOCOL LOGS */}
      {isLogOpen && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-[#070707] border-l border-white/15 z-[100] p-6 shadow-2xl flex flex-col backdrop-blur-md transition-all duration-300">
          <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-4 select-none">
            <div className="flex items-center gap-2.5">
              <Lucide.FileText className="w-4 h-4 text-white/80 animate-pulse" />
              <h3 className="font-serif text-sm font-bold tracking-wide italic text-white uppercase">
                Протокол Осмотра (Логи)
              </h3>
            </div>
            <button 
              onClick={() => {
                gameAudio.playClick();
                setIsLogOpen(false);
              }}
              className="px-2 py-1 text-white/40 hover:text-white border border-white/5 hover:border-white/15 bg-black/40 font-mono text-[9px] uppercase tracking-wider transition-all cursor-pointer"
            >
              [Закрыть]
            </button>
          </div>

          <div className="flex-1 overflow-y-auto font-mono text-[11px] text-white/60 space-y-3 pr-2 select-text custom-scrollbar">
            {gameState.logs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center font-serif italic text-white/30 text-xs">
                Пока никаких записей в протоколе нет.
              </div>
            ) : (
              [...gameState.logs].reverse().map((log) => (
                <div key={log.id} className="border-b border-white/5 pb-2.5 leading-relaxed">
                  <div className="flex justify-between items-center mb-1 select-none">
                    <span className="text-white/20 text-[9px]">[{log.timestamp}]</span>
                    <span className={`text-[8px] uppercase tracking-widest font-sans px-1 border ${
                      log.sender === 'detective' 
                        ? 'border-white/20 text-white/60 bg-white/5' 
                        : log.sender === 'cat' 
                          ? 'border-yellow-500/20 text-yellow-500/80 bg-yellow-950/10' 
                          : 'border-red-500/20 text-red-400 bg-red-950/10'
                    }`}>
                      {log.sender === 'detective' ? 'Барт' : log.sender === 'cat' ? 'Миднайт' : 'Инфо'}
                    </span>
                  </div>
                  <p className="text-white/85">{log.text}</p>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-white/10 pt-4 mt-4 text-right select-none">
            <span className="font-mono text-[9px] text-white/30 uppercase tracking-[0.2em]">
              Всего записей в протоколе: {gameState.logs.length}
            </span>
          </div>
        </div>
      )}

      {/* HELP GUIDE OVERLAY */}
      {isHelpOpen && (
        <div className="absolute inset-0 bg-black/95 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md border border-white/10 bg-black p-6 sm:p-8 rounded-none shadow-2xl relative font-sans">
            <button 
              onClick={() => {
                gameAudio.playClick();
                setIsHelpOpen(false);
              }}
              className="absolute top-3 right-4 font-mono text-white/40 hover:text-white text-[11px] uppercase tracking-wider"
            >
              [Закрыть]
            </button>
            
            <h2 className="font-serif text-lg font-bold italic text-white border-b border-white/10 pb-2.5 mb-5 tracking-wide">
              Как устроен детективный квест?
            </h2>

            <div className="space-y-4 text-xs text-white/70">
              <p className="font-serif italic leading-relaxed">
                Каждое новое расследование генерирует случайную комбинацию предметов и мест улик. Чтобы победить, найдите 3 спрятанные улики.
              </p>
              
              <div className="border border-white/10 bg-[#080808] p-3 rounded-none font-mono text-[10px] space-y-1 text-white/50">
                <div className="text-white uppercase font-bold mb-1">Пример логической цепочки:</div>
                <div>1. Кот сбрасывает книги $\to$ Находит Латунный ключ</div>
                <div>2. Кот несет ключ к Столу $\to$ Отпирает запертый Ящик</div>
                <div>3. В ящике лежит Бумажка с шифром сейфа (например: 3-8-2)</div>
                <div>4. Игрок нажимает на Сейф $\to$ Вводит шифр 3-8-2 $\to$ Находит третью улику!</div>
              </div>

              <p className="font-serif italic leading-relaxed">
                Кликая по предметам, вы отдаете команду коту Миднайту пойти туда и взаимодействовать. Обязательно читайте комментарии детектива Барта Ванса — в его глупых рассуждениях часто кроются подсказки!
              </p>
            </div>
            
            <button 
              onClick={() => {
                gameAudio.playClick();
                setIsHelpOpen(false);
              }}
              className="mt-6 w-full h-11 bg-white hover:bg-neutral-200 text-black text-xs font-sans font-bold uppercase tracking-[0.2em] rounded-none transition-all"
            >
              Понятно
            </button>
          </div>
        </div>
      )}

      {/* GAME INTRO OVERLAY */}
      {gameState.gameStatus === 'intro' && (
        <IntroScreen 
          onStartNewGame={handleStartNewGame} 
          onContinueGame={handleContinueGame}
          hasSavedGame={hasSavedGame}
          savedDay={savedData?.day}
          savedCash={savedData?.cash}
          savedReputation={savedData?.reputation}
        />
      )}

      {/* DAY TRANSITION OVERLAY */}
      {dayTransition && (
        <div className={`absolute inset-0 bg-black z-50 flex flex-col justify-center items-center p-6 text-center select-none transition-opacity duration-1000 ${
          dayTransition.isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}>
          <div className="max-w-md w-full border border-white/10 bg-[#080808] p-8 relative">
            <div className="absolute inset-2 border border-white/5 pointer-events-none" />
            
            <span className="font-sans text-[8px] uppercase tracking-[0.4em] text-amber-500/80 mb-3 block animate-pulse">
              ★ СУТОЧНЫЙ ОТЧЕТ БЮРО ★
            </span>

            <h3 className="font-serif text-2xl font-bold text-white italic tracking-wide mb-2">
              День {dayTransition.fromDay} завершен
            </h3>

            <div className="h-[1px] bg-white/10 my-4" />

            <div className="font-serif text-[11px] text-white/60 leading-relaxed italic mb-6 space-y-3">
              <p>
                «Барт аккуратно тушит трубку, вытряхивая пепел в пепельницу. За окном шумит лондонский ливень...»
              </p>
              <p>
                «Миднайт сворачивается пушистым клубком на сейфе и сладко засыпает. На сегодня расследования окончены.»
              </p>
            </div>

            <div className="border border-red-500/10 bg-red-950/10 p-3 mb-6 text-left">
              <div className="flex justify-between font-mono text-[9px] text-red-400 font-bold uppercase tracking-widest mb-1.5">
                <span>Списание за содержание:</span>
                <span>-110$</span>
              </div>
              <div className="space-y-0.5 text-[8px] font-mono text-white/30 pl-2">
                <div>• Аренда кабинета Барта: 50$</div>
                <div>• Кошачий паштет с лососем: 35$</div>
                <div>• Трубочный табак и кофе: 25$</div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-white/40 font-mono text-[9px] uppercase tracking-widest animate-pulse">
              <Lucide.Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
              <span>Наступает День {dayTransition.toDay}...</span>
            </div>
          </div>
        </div>
      )}

      {/* GAME VICTORY CONGRATULATIONS OVERLAY */}
      {gameState.gameStatus === 'won' && (
        <div className="absolute inset-0 bg-black flex flex-col justify-center items-center p-6 sm:p-8 z-50 text-center select-none overflow-y-auto custom-scrollbar animate-fade-in">
          <div className="absolute inset-4 sm:inset-6 border-double border-4 border-white/10 pointer-events-none" />
          <div className="absolute inset-6 sm:inset-10 border border-white/5 pointer-events-none" />
          
          <span className="font-sans text-[9px] uppercase tracking-[0.5em] text-white/40 mb-2 animate-pulse z-10">
            ★ ДЕЛО РАСКРЫТО СЫСКНЫМ БЮРО ★
          </span>

          <h2 className="font-serif text-3xl sm:text-4xl font-bold italic tracking-wide text-white leading-none mb-4 z-10">
            {gameState.storyState?.mode === 'story' 
              ? `Успех: Глава ${gameState.storyState.chapter} завершена!` 
              : 'Дело успешно закрыто!'}
          </h2>

          <div className="max-w-2xl w-full mx-auto grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch z-10 mb-6">
            
            {/* Story Reflection (7 cols) */}
            <div className="md:col-span-7 border border-white/10 bg-black/80 backdrop-blur-sm p-5 flex flex-col justify-between text-left">
              <div>
                <div className="flex gap-1 mb-3">
                  {[0, 1, 2].map(n => (
                    <Lucide.CheckCircle2 key={n} className="w-5 h-5 text-white/80" />
                  ))}
                </div>

                <p className="font-serif text-[13px] text-white/90 leading-relaxed italic mb-4">
                  {gameState.storyState?.mode === 'story' && gameState.storyState.chapter === 1 && (
                    `«Я вытер капли дождя с лица и бережно спрятал Сапфировый Глаз лорда в бархатный футляр. Но радоваться рано — вор признался на допросе, что подельники уже ждут его у причала, готовые вывезти контрабанду на Склад №9. Миднайт уже умывается — кажется, кот знает, что дело только начинается!»`
                  )}
                  {gameState.storyState?.mode === 'story' && gameState.storyState.chapter === 2 && (
                    `«В тумане причала пахло сыростью и порохом. Но благодаря лапам Миднайта мы отыскали накладные контрабанды и билет первого класса. Похоже, организатор кражи прямо сейчас поднимается на борт великого дирижабля "Эклипс". Наш путь лежит в облака!»`
                  )}
                  {gameState.storyState?.mode === 'story' && gameState.storyState.chapter === 3 && (
                    `«Мы стояли на гондоле дирижабля, пока молнии освещали бескрайнее грозовое небо. Сапфировый Глаз возвращен, заговорщики в кандалах, а капитан жмет мне руку. Газеты будут трубить об этом вечно! Но самое главное — Миднайт засыпает у меня на коленях, заслужив пожизненный запас лосося.»`
                  )}
                  {gameState.storyState?.mode === 'sandbox' && (
                    `«Дело о "${gameState.activeJob?.title || 'секретном происшествии'}" успешно закрыто! Три неопровержимые улики лежали на моем полированном столе. Подозреваемый загнан в угол, а пушистый сыщик Миднайт сидит на сейфе и довольно мурчит. Бюджет бюро пополнен!»`
                  )}
                  {(!gameState.storyState?.mode) && (
                    `«Три неопровержимые улики лежали на моем полированном столе. Дело было шито белыми нитками. Окружной прокурор будет в восторге, а моя фотография украсит первую полосу утренних новостей!»`
                  )}
                </p>
              </div>

              <div className="border-t border-white/5 pt-3.5 font-mono text-[9px] text-white/40 space-y-1">
                <div className="text-white/70 font-bold uppercase font-sans tracking-widest text-[8px] mb-1">Сводка по делу:</div>
                <div>• Собрано улик: {gameState.foundClueIds.length} из 3</div>
                <div>• Спец-код от сейфа: {gameState.safeCode}</div>
                <div>• Локация: {gameState.roomInfo?.roomName || 'Кабинет'}</div>
                {gameState.storyState?.mode === 'sandbox' && (
                  <div>• Сыграно в бесконечном режиме: День {gameState.currentDay}</div>
                )}
              </div>
            </div>

            {/* Financial Ledger (5 cols) */}
            <div className="md:col-span-5 border border-white/10 bg-neutral-950 p-5 flex flex-col justify-between text-left">
              <div>
                <span className="font-mono text-[8px] uppercase tracking-widest text-white/50 block mb-2.5">БУХГАЛТЕРСКИЙ ОТЧЕТ БЮРО</span>
                <div className="h-[1px] bg-white/10 mb-3" />

                <div className="space-y-2 font-mono text-[10px]">
                  <div className="flex justify-between text-white/60">
                    <span>Стартовый баланс:</span>
                    <span>
                      {gameState.storyState?.mode === 'story' 
                        ? ((gameState.economy?.cash ?? 150) - (gameState.storyState.chapter === 1 ? 90 : gameState.storyState.chapter === 2 ? 190 : 290))
                        : ((gameState.economy?.cash ?? 150) - (gameState.activeJob?.reward ?? 150))
                      }$
                    </span>
                  </div>

                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>+ Гонорар за раскрытие:</span>
                    <span>+{gameState.storyState?.mode === 'story' ? (gameState.storyState.chapter === 1 ? 200 : gameState.storyState.chapter === 2 ? 300 : 400) : (gameState.activeJob?.reward ?? 150)}$</span>
                  </div>

                  {gameState.storyState?.mode === 'story' ? (
                    <>
                      <div className="text-white/30 text-[8px] uppercase tracking-wider pt-2">Удержанные расходы бюро:</div>
                      <div className="space-y-1 text-red-400/70 text-[9px] pl-1 border-l border-white/5">
                        <div className="flex justify-between">
                          <span>• Аренда офиса:</span>
                          <span>-50$</span>
                        </div>
                        <div className="flex justify-between">
                          <span>• Лососевый паштет:</span>
                          <span>-35$</span>
                        </div>
                        <div className="flex justify-between">
                          <span>• Крепкий табак:</span>
                          <span>-15$</span>
                        </div>
                        <div className="flex justify-between">
                          <span>• Свежий кофе:</span>
                          <span>-10$</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-white/30 text-[8px] uppercase tracking-wider pt-2">Расходы / штрафы по делу:</div>
                      <div className="space-y-1 text-red-400/70 text-[9px] pl-1 border-l border-white/5 max-h-24 overflow-y-auto">
                        {gameState.economy?.recentExpenses && gameState.economy.recentExpenses.length > 0 ? (
                          gameState.economy.recentExpenses.map((expense, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span>• {expense.name}:</span>
                              <span>-{expense.amount}$</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-white/30 italic">Расходов по делу нет</div>
                        )}
                      </div>
                    </>
                  )}

                  <div className="h-[1px] bg-white/5 my-2" />

                  <div className="flex justify-between text-white font-bold border-t border-white/10 pt-2 text-[11px]">
                    <span>Текущая касса:</span>
                    <span className="text-emerald-400">{gameState.economy?.cash ?? 150}$</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 border border-emerald-500/10 bg-emerald-950/15 p-2 rounded-none text-center">
                <span className="font-mono text-[8px] text-emerald-400/90 uppercase tracking-widest font-bold">
                  ★ БАНКРОТСТВО ПРЕДОТВРАЩЕНО ★
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 z-10">
            {gameState.storyState?.mode === 'story' ? (
              <div className="flex flex-col items-center gap-4">
                {gameState.storyState.chapter >= (gameState.campaignChapters?.length || 3) && (
                  <div className="px-4 py-2 border border-yellow-500/30 bg-yellow-950/20 text-yellow-400 text-xs font-serif italic mb-1 uppercase tracking-widest animate-pulse">
                    🏆 Кампания полностью пройдена!
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={handleReturnToDashboard}
                    className="h-12 px-8 bg-white hover:bg-neutral-200 text-black font-sans text-xs font-bold uppercase tracking-[0.2em] rounded-none transition-all flex items-center justify-center gap-2 shadow-2xl hover:scale-105"
                  >
                    <Lucide.ArrowLeft className="w-3.5 h-3.5 text-black" />
                    Вернуться в бюро (День {gameState.currentDay ?? 1})
                  </button>

                  {gameState.storyState.chapter < (gameState.campaignChapters?.length || 3) && (
                    <button 
                      onClick={() => {
                        gameAudio.playClick();
                        const currentChNum = gameState.storyState?.chapter ?? 1;
                        const nextChNum = currentChNum + 1;
                        const nextJob = gameState.campaignChapters?.find(j => j.id === `story_chapter_${nextChNum}`);
                        if (nextJob) {
                          setGameState(prev => {
                            const updatedJobs = prev.availableJobs?.map(job => {
                              if (prev.activeJob && job.id === prev.activeJob.id) {
                                return { ...job, completed: true };
                              }
                              return job;
                            }) || [];

                            let updatedCompletedChapters = prev.storyState?.completedChapters ? [...prev.storyState.completedChapters] : [];
                            if (prev.storyState?.mode === 'story' && prev.storyState?.chapter) {
                              const finishedCh = prev.storyState.chapter;
                              if (!updatedCompletedChapters.includes(finishedCh)) {
                                updatedCompletedChapters.push(finishedCh);
                              }
                            }

                            const updatedCampaignChapters = prev.campaignChapters?.map(job => {
                              if (prev.activeJob && job.id === prev.activeJob.id) {
                                return { ...job, completed: true };
                              }
                              return job;
                            }) || [];

                            const cleanState = generateNewGame(
                              'story',
                              nextChNum,
                              prev.economy?.cash || 150,
                              prev.reputation || 0,
                              nextJob
                            );

                            return {
                              ...cleanState,
                              availableJobs: updatedJobs,
                              campaignChapters: updatedCampaignChapters,
                              currentDay: prev.currentDay,
                              daysSurvived: prev.daysSurvived,
                              gameStatus: 'playing',
                              isMuted: prev.isMuted,
                              storyState: {
                                ...cleanState.storyState,
                                completedChapters: updatedCompletedChapters
                              }
                            };
                          });
                        } else {
                          handleReturnToDashboard();
                        }
                      }}
                      className="h-12 px-8 border border-white/20 hover:border-white text-white font-sans text-xs font-bold uppercase tracking-[0.2em] rounded-none transition-all flex items-center justify-center gap-2 bg-black/40 hover:scale-105"
                    >
                      <Lucide.ArrowRight className="w-4 h-4 text-white animate-pulse" />
                      Перейти к Главе {gameState.storyState.chapter + 1}
                    </button>
                  )}

                  <button 
                    onClick={handleReturnToMenu}
                    className="h-12 px-8 border border-white/10 hover:border-white/20 text-white/50 font-sans text-xs font-bold uppercase tracking-[0.2em] rounded-none transition-all flex items-center justify-center gap-2 bg-black/20"
                  >
                    <Lucide.LogOut className="w-3.5 h-3.5" />
                    Главное меню
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button 
                  onClick={handleReturnToDashboard}
                  className="h-12 px-8 bg-white hover:bg-neutral-200 text-black font-sans text-xs font-bold uppercase tracking-[0.2em] rounded-none transition-all flex items-center justify-center gap-2 shadow-2xl hover:scale-105"
                >
                  <Lucide.ArrowLeft className="w-3.5 h-3.5 text-black" />
                  Вернуться в бюро (День {gameState.currentDay ?? 1})
                </button>
                <button 
                  onClick={handleReturnToMenu}
                  className="h-12 px-8 border border-white/20 hover:border-white text-white font-sans text-xs font-bold uppercase tracking-[0.2em] rounded-none transition-all flex items-center justify-center gap-2 bg-black/40"
                >
                  <Lucide.LogOut className="w-3.5 h-3.5" />
                  Главное меню
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* GAME OVER / TIME EXPIRED OVERLAY */}
      {gameState.gameStatus === 'lost' && (
        <div className="absolute inset-0 bg-black flex flex-col justify-center items-center p-6 sm:p-8 z-50 text-center select-none overflow-y-auto custom-scrollbar animate-fade-in">
          <div className="absolute inset-4 sm:inset-6 border-double border-4 border-red-500/10 pointer-events-none" />
          <div className="absolute inset-6 sm:inset-10 border border-red-500/5 pointer-events-none" />
          
          <span className="font-sans text-[9px] uppercase tracking-[0.5em] text-red-500 mb-2 animate-pulse z-10">
            {gameState.economy && gameState.economy.cash < 0 ? '🚨 БАНКРОТСТВО БЮРО 🚨' : '🚨 КЕЙС ПРОВАЛЕН 🚨'}
          </span>

          <h2 className="font-serif text-3xl sm:text-4xl font-bold italic tracking-wide text-white leading-none mb-4 z-10">
            {gameState.economy && gameState.economy.cash < 0 
              ? 'Средства на аренду и еду исчерпаны!' 
              : 'Время вышло! Подозреваемый скрылся!'}
          </h2>

          <div className="max-w-2xl w-full mx-auto grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch z-10 mb-6">
            
            {/* Narrative failure explanation */}
            <div className="md:col-span-7 border border-red-500/10 bg-black/80 backdrop-blur-sm p-5 flex flex-col justify-between text-left">
              <div>
                <div className="flex gap-1 mb-3 text-red-500">
                  <Lucide.AlertCircle className="w-5 h-5" />
                </div>

                <p className="font-serif text-[13px] text-white/90 leading-relaxed italic mb-4">
                  {gameState.economy && gameState.economy.cash < 0 ? (
                    `«В кассе детективного бюро свистит ветер — у нас не осталось денег даже на кошачий паштет. Суровый хозяин помещения выставил наши вещи на улицу и заколотил дверь досками. Детектив Ванс кутается в мокрый плащ, а верный Миднайт грустно мяукает под лондонским дождем. Наше агентство закрыто из-за банкротства...»`
                  ) : (
                    `«Стрелки часов пробили полночь, оставив нас ни с чем. Подозреваемый бесследно растворился в лондонском тумане, прихватив с собой ценности. Барт Ванс в отчаянии рвет на себе плащ, а Миднайт лишь грустно почесывает ухо... Какое сокрушительное фиаско для нашего детективного бюро!»`
                  )}
                </p>
              </div>

              <div className="border-t border-white/5 pt-3.5 font-mono text-[9px] text-white/40 space-y-1">
                <div className="text-red-400 font-bold uppercase font-sans tracking-widest text-[8px] mb-1">Статистика выживания:</div>
                <div>• Пройдено дней в бюро: {gameState.currentDay ?? 1} дн.</div>
                <div>• Успешных расследований за сегодня: {gameState.daysSurvived ?? 0}</div>
                <div>• Конечная репутация: {gameState.reputation ?? 0} ед.</div>
              </div>
            </div>

            {/* Financial Ledger Penalty */}
            <div className="md:col-span-5 border border-red-500/10 bg-neutral-950 p-5 flex flex-col justify-between text-left">
              <div>
                <span className="font-mono text-[8px] uppercase tracking-widest text-red-400/80 block mb-2.5">ФИНАНСОВЫЙ КРАХ</span>
                <div className="h-[1px] bg-red-500/10 mb-3" />

                <div className="space-y-2 font-mono text-[10px]">
                  <div className="flex justify-between text-white/60">
                    <span>Итоговый баланс:</span>
                    <span className={gameState.economy && gameState.economy.cash < 0 ? 'text-red-500 font-bold' : ''}>
                      {gameState.economy?.cash ?? 0}$
                    </span>
                  </div>

                  {!(gameState.economy && gameState.economy.cash < 0) && (
                    <>
                      <div className="flex justify-between text-red-400">
                        <span>- Неустойка:</span>
                        <span>-50$</span>
                      </div>
                      <div className="flex justify-between text-amber-500">
                        <span>★ Репутация:</span>
                        <span>-10 очков</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-4 border border-red-500/20 bg-red-950/15 p-2 rounded-none text-center">
                <span className="font-mono text-[8px] text-red-400 uppercase tracking-widest font-bold">
                  {gameState.economy && gameState.economy.cash < 0 ? '🚫 ДЕЛО ЗАКРЫТО ИЗ-ЗА БАНКРОТСТВА 🚫' : '⚠️ РЕПУТАЦИЯ ИСПОРЧЕНА ⚠️'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 z-10">
            {gameState.economy && gameState.economy.cash < 0 ? (
              <button 
                onClick={handleReturnToMenu}
                className="h-12 px-8 bg-white hover:bg-neutral-200 text-black font-sans text-xs font-bold uppercase tracking-[0.2em] rounded-none transition-all flex items-center justify-center gap-2 shadow-2xl"
              >
                <Lucide.RotateCcw className="w-3.5 h-3.5 text-black" />
                Вернуться в главное меню
              </button>
            ) : gameState.storyState?.mode === 'sandbox' ? (
              <>
                <button 
                  onClick={handleReturnToDashboard}
                  className="h-12 px-8 bg-white hover:bg-neutral-200 text-black font-sans text-xs font-bold uppercase tracking-[0.2em] rounded-none transition-all flex items-center justify-center gap-2 shadow-2xl hover:scale-105"
                >
                  <Lucide.ArrowLeft className="w-3.5 h-3.5 text-black" />
                  Вернуться в бюро (День {gameState.currentDay ?? 1})
                </button>
                <button 
                  onClick={handleReturnToMenu}
                  className="h-12 px-8 border border-white/20 hover:border-white text-white font-sans text-xs font-bold uppercase tracking-[0.2em] rounded-none transition-all flex items-center justify-center gap-2 bg-black/40"
                >
                  <Lucide.LogOut className="w-3.5 h-3.5" />
                  Главное меню
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={handleResetGame}
                  className="h-12 px-8 bg-white hover:bg-neutral-200 text-black font-sans text-xs font-bold uppercase tracking-[0.2em] rounded-none transition-all flex items-center justify-center gap-2 shadow-2xl hover:scale-105"
                >
                  <Lucide.RotateCcw className="w-3.5 h-3.5 text-black" />
                  Начать расследование заново
                </button>
                <button 
                  onClick={handleReturnToMenu}
                  className="h-12 px-8 border border-white/20 hover:border-white text-white font-sans text-xs font-bold uppercase tracking-[0.2em] rounded-none transition-all flex items-center justify-center gap-2 bg-black/40"
                >
                  <Lucide.LogOut className="w-3.5 h-3.5" />
                  Главное меню
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* TORN NOTE PUZZLE OVERLAY */}
      {isTornNoteOpen && gameState.activeTornNote && (
        <TornNotePuzzle 
          gameState={gameState}
          setGameState={setGameState}
          onClose={() => setIsTornNoteOpen(false)}
        />
      )}

      {/* WRITER CAMPAIGN CRITIQUE / PUBLISHING OVERLAY */}
      {showPublishPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-none p-6 md:p-8 font-mono text-xs text-neutral-300 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto custom-scrollbar">
            {/* Double Border Frame */}
            <div className="absolute inset-2 border border-neutral-800/60 pointer-events-none" />
            <div className="absolute inset-3 border border-neutral-800/30 pointer-events-none" />
            
            {/* Header */}
            <div className="text-center mb-6 relative z-10">
              <span className="text-[10px] text-amber-500 uppercase tracking-[0.3em] font-bold block mb-1">Издательский дом «Граб Стрит»</span>
              <h2 className="font-serif text-2xl font-bold italic text-white tracking-wide">Издание Бульварного Романа</h2>
              <div className="h-[1px] bg-neutral-800 my-3" />
              <p className="text-[11px] text-neutral-400 italic">
                Вы завершили детективную кампанию: <span className="text-amber-400 font-bold">«{gameState.customCampaignIdea || 'Приключения Ванса и Миднайта'}»</span>
              </p>
            </div>

            {!critiqueResult && !isCritiquing ? (
              <div className="space-y-6 relative z-10">
                <p className="text-[11px] leading-relaxed text-neutral-400 text-center">
                  Поздравляем! Ваш детективный роман успешно прошел обкатку в реальных делах. Перед тем как отправить рукопись на печатные станки, оцените свои впечатления от этой истории:
                </p>

                {/* Rating 1: Idea */}
                <div className="bg-black/40 p-4 border border-neutral-800/50">
                  <span className="text-[10px] text-neutral-400 uppercase tracking-widest block mb-2 font-bold">Оценка вашей идеи (Сюжет & Концепция)</span>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRatingIdea(star)}
                        className="p-1 hover:scale-125 transition-transform cursor-pointer"
                      >
                        <Lucide.Star
                          className={`w-6 h-6 ${
                            star <= ratingIdea ? 'text-amber-400 fill-amber-400' : 'text-neutral-600'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-3 text-amber-400 font-bold text-sm">{ratingIdea}/5</span>
                  </div>
                  <p className="text-[9px] text-neutral-500 mt-1">Насколько интересным и интригующим получился основной синопсис дела?</p>
                </div>

                {/* Rating 2: AI Execution */}
                <div className="bg-black/40 p-4 border border-neutral-800/50">
                  <span className="text-[10px] text-neutral-400 uppercase tracking-widest block mb-2 font-bold">Оценка работы ИИ (Генерация глав & Подсказок)</span>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRatingExecution(star)}
                        className="p-1 hover:scale-125 transition-transform cursor-pointer"
                      >
                        <Lucide.Star
                          className={`w-6 h-6 ${
                            star <= ratingExecution ? 'text-amber-400 fill-amber-400' : 'text-neutral-600'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-3 text-amber-400 font-bold text-sm">{ratingExecution}/5</span>
                  </div>
                  <p className="text-[9px] text-neutral-500 mt-1">Оцените качество проработки улик, атмосферных диалогов и интерактивных загадок.</p>
                </div>

                <button
                  onClick={handlePublishSubmit}
                  className="w-full h-12 bg-white hover:bg-neutral-200 text-black font-sans text-xs font-bold uppercase tracking-[0.2em] rounded-none transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <Lucide.BookOpen className="w-4 h-4" />
                  Отправить ИИ-Критику и Напечатать Роман
                </button>
              </div>
            ) : isCritiquing ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-4 relative z-10">
                <div className="relative">
                  <div className="w-12 h-12 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                  <Lucide.FileText className="w-5 h-5 text-amber-500 absolute inset-0 m-auto animate-pulse" />
                </div>
                <div className="text-center">
                  <span className="text-[10px] uppercase tracking-widest text-amber-400 block font-bold animate-pulse">Печатный пресс запущен</span>
                  <p className="text-[9px] text-neutral-500 mt-1">Шум свинцовых литер, запах свежей типографской краски...</p>
                  <p className="text-[9px] text-neutral-500">Редактор внимательно изучает рукопись...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-5 relative z-10 animate-fade-in">
                {/* Book Jacket Mockup */}
                <div className="bg-black/60 border border-neutral-800 p-5 rounded-none font-serif relative text-left">
                  <div className="absolute top-3 right-4 border border-amber-500/30 text-amber-500/80 font-mono text-[9px] px-2 py-0.5 uppercase tracking-wider">
                    ИЗДАНИЕ ОДОБРЕНО
                  </div>
                  
                  <span className="text-[8px] font-mono text-neutral-500 uppercase tracking-widest block mb-1">Рецензируемое произведение</span>
                  <h3 className="text-white text-base font-bold italic tracking-wide mb-1">«{gameState.customCampaignIdea}»</h3>
                  <p className="text-[10px] text-neutral-400 font-mono mb-4">Авторы: Сыскное агентство Ванса и ИИ-Ассистент</p>
                  
                  <div className="grid grid-cols-2 gap-4 border-t border-neutral-800/60 pt-4 font-mono text-[11px]">
                    <div>
                      <span className="text-neutral-500 text-[9px] block">ОЦЕНКА КРИТИКА:</span>
                      <span className="text-2xl font-serif font-bold text-amber-500 tracking-wide">
                        {critiqueResult.grade || 'B+'}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-500 text-[9px] block">УСПЕХ В ПРОДАЖАХ:</span>
                      <span className="text-xs font-bold text-white uppercase tracking-wider block mt-1.5">
                        {critiqueResult.sales_performance || 'Стабильный спрос'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 bg-neutral-950 p-4 border border-neutral-900 font-serif text-[12px] italic text-neutral-300 leading-relaxed relative">
                    <Lucide.Quote className="w-8 h-8 text-neutral-800 absolute -top-2 -left-1 opacity-20 pointer-events-none" />
                    {critiqueResult.review || 'Критик благосклонно отнесся к роману.'}
                  </div>

                  <div className="mt-4 border-t border-dashed border-neutral-800 pt-3 flex justify-between items-center font-mono">
                    <span className="text-neutral-500 text-[10px]">ИТОГОВЫЙ ГОНОРАР АВТОРА:</span>
                    <span className={`text-sm font-bold ${critiqueResult.profit >= 0 ? 'text-green-400' : 'text-red-500'}`}>
                      {critiqueResult.profit >= 0 ? `+${critiqueResult.profit}$` : `${critiqueResult.profit}$`}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleClaimRoyalties}
                  className="w-full h-12 bg-amber-500 hover:bg-amber-400 text-black font-sans text-xs font-bold uppercase tracking-[0.2em] rounded-none transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  <Lucide.Coins className="w-4 h-4" />
                  Забрать Гонорар и Вернуться к Делам
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
