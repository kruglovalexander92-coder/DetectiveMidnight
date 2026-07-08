/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ObjectId, ObjectState, GameState, Clue, GameLog } from './types';
import { generateNewGame, DUMMY_ITEMS, ALL_CLUES } from './utils/puzzleGenerator';
import { gameAudio } from './utils/AudioEngine';

import GameScene from './components/GameScene';
import NarrativeBox from './components/NarrativeBox';
import ClueTracker from './components/ClueTracker';
import IntroScreen from './components/IntroScreen';
import RainEffect from './components/RainEffect';
import FilmGrain from './components/FilmGrain';

import * as Lucide from 'lucide-react';

function getLogicalHint(gameState: GameState): string {
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

  // Auto-play ambient music adjustments when mute changes
  useEffect(() => {
    try {
      gameAudio.setMute(gameState.isMuted);
    } catch (e) {
      console.warn("Audio initialization postponed until user gesture", e);
    }
  }, [gameState.isMuted]);

  // Handle beginning of the game from the Intro screen
  const handleStartGame = (enableAudio: boolean, mode: 'sandbox' | 'story', chapter: number) => {
    const freshState = generateNewGame(mode, chapter, gameState.economy?.cash || 150);
    freshState.gameStatus = 'playing';
    freshState.isMuted = !enableAudio;
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

  const addLog = (sender: 'detective' | 'cat' | 'system', text: string): GameLog => {
    return {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      sender,
      text,
      timestamp: new Date().toLocaleTimeString()
    };
  };

  // Main puzzle interaction handler
  const handleObjectInteraction = (id: ObjectId, action: string) => {
    if (gameState.gameStatus !== 'playing') return;
    if (gameState.catAction === 'walking') return;

    const currentObj = gameState.objects[id];
    
    // Multi-room visibility rules for Chapter 2
    const isChapter2 = gameState.storyState?.mode === 'story' && gameState.storyState?.chapter === 2;
    const currentLocation = gameState.storyState?.currentLocationId || 'pier';

    const isVisible = (oid: ObjectId) => {
      if (!isChapter2) return true;
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
          
          // Stepping stone must be extremely close (physically nearby) to the target
          if (distToTarget <= 12) {
            const isBetween = (fromX <= helperX && helperX <= toX) || (toX <= helperX && helperX <= fromX);
            return isBetween || distToTarget <= 8;
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
    const climbDelay = getClimbDuration(gameState.catPosition, climbSteps);

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

        // Custom action state determination
        if (id === 'rug') {
          newAction = 'scratching';
          if (!gameState.isMuted) gameAudio.playScratch();
          obj.toggled = true;
          logText = 'Кот когтями разодрал край ковра и отвернул его.';
          
          if (obj.heldClueId && !newFoundClues.includes(obj.heldClueId)) {
            newFoundClues.push(obj.heldClueId);
            const clue = prev.currentClues.find(c => c.id === obj.heldClueId);
            dialogueText = clue ? clue.findingMessage : 'Улика найдена под ковром!';
            dialogueMood = 'shocked';
            if (!gameState.isMuted) gameAudio.playClueFound();
          } else if (obj.heldItemId && !newInventory.includes(obj.heldItemId)) {
            newInventory.push(obj.heldItemId);
            const item = getItemDetail(obj.heldItemId);
            dialogueText = `«Миднайт, выплюнь каку! О... это же ${item.name}! Где ты его откопал?»`;
            dialogueMood = 'thoughtful';
            if (!gameState.isMuted) gameAudio.playClick();
          } else {
            dialogueText = '«Миднайт, прекрати драть казенный ковер! Иди лучше займись делом!»';
            dialogueMood = 'serious';
          }
        } 
        
        else if (id === 'trashcan') {
          newAction = 'pushing';
          if (!gameState.isMuted) gameAudio.playCrash();
          obj.tipped = true;
          logText = 'Кот с разбегу опрокинул мусорную корзину!';
          
          if (obj.heldClueId && !newFoundClues.includes(obj.heldClueId)) {
            newFoundClues.push(obj.heldClueId);
            const clue = prev.currentClues.find(c => c.id === obj.heldClueId);
            dialogueText = clue ? clue.findingMessage : 'Улика найдена в мусоре!';
            dialogueMood = 'shocked';
            if (!gameState.isMuted) gameAudio.playClueFound();
          } else if (obj.heldItemId && !newInventory.includes(obj.heldItemId)) {
            newInventory.push(obj.heldItemId);
            const item = getItemDetail(obj.heldItemId);
            dialogueText = `«Какой погром! Но... постой, из кучи бумаг выкатился предмет: ${item.name}! Кот, ты гений маскировки!»`;
            dialogueMood = 'shocked';
            if (!gameState.isMuted) gameAudio.playClick();
          } else {
            dialogueText = '«Тьфу! Ну и свинство! Миднайт, весь пол в объедках от вчерашнего пончика! Больше никакого корма до вечера!»';
            dialogueMood = 'silly';
          }
        } 
        
        else if (id === 'painting') {
          newAction = 'scratching';
          if (!gameState.isMuted) gameAudio.playScratch();
          obj.toggled = true;
          logText = 'Кот лапой скосил картину набок.';

          const isSafeCodeBehindPainting = prev.solvedSteps.includes('safe_code_via_painting');

          if (obj.heldClueId && !newFoundClues.includes(obj.heldClueId)) {
            newFoundClues.push(obj.heldClueId);
            const clue = prev.currentClues.find(c => c.id === obj.heldClueId);
            dialogueText = clue ? clue.findingMessage : 'Улика найдена за картиной!';
            dialogueMood = 'shocked';
            if (!gameState.isMuted) gameAudio.playClueFound();
          } else if (isSafeCodeBehindPainting && !newInventory.includes('safe_code_note')) {
            newInventory.push('safe_code_note');
            dialogueText = `«Миднайт, ты сдвинул пейзаж... Ого! На стене под картиной нацарапан шифр: [Код сейфа: ${prev.safeCode}]! Запишу в блокнот...»`;
            dialogueMood = 'thoughtful';
            if (!gameState.isMuted) gameAudio.playClick();
          } else {
            dialogueText = '«Ван Гог бы перевернулся в гробу! Зачем ты раскачиваешь раму, Миднайт? Там нет мышей!»';
            dialogueMood = 'serious';
          }
        } 
        
        else if (id === 'bookshelf') {
          newAction = 'pushing';
          if (!gameState.isMuted) gameAudio.playCrash();
          obj.booksFallen = true;
          logText = 'Кот сбросил увесистые фолианты с полки!';

          const isSafeCodeBehindBooks = prev.solvedSteps.includes('safe_code_via_lamp') && prev.objects.lamp.toggled;

          if (obj.heldClueId && !newFoundClues.includes(obj.heldClueId)) {
            newFoundClues.push(obj.heldClueId);
            const clue = prev.currentClues.find(c => c.id === obj.heldClueId);
            dialogueText = clue ? clue.findingMessage : 'Улика вывалилась из книг!';
            dialogueMood = 'shocked';
            if (!gameState.isMuted) gameAudio.playClueFound();
          } else if (obj.heldItemId && !newInventory.includes(obj.heldItemId)) {
            newInventory.push(obj.heldItemId);
            const item = getItemDetail(obj.heldItemId);
            dialogueText = `«Мои драгоценные конспекты! Ой, постой, из распоротого корешка книги "Убийство в Эссексе" выпал ${item.name}! Ловко!»`;
            dialogueMood = 'proud';
            if (!gameState.isMuted) gameAudio.playClick();
          } else if (isSafeCodeBehindBooks && !newInventory.includes('safe_code_note')) {
            newInventory.push('safe_code_note');
            dialogueText = `«Ба! На полке в углу, куда падает свет торшера, проступила кодовая комбинация: [${prev.safeCode}]! Это невероятно!»`;
            dialogueMood = 'proud';
            if (!gameState.isMuted) gameAudio.playClick();
          } else {
            dialogueText = '«Ай! Книги летят прямо на меня! Миднайт, прекрати хулиганить! Это научные труды, а не кошачья когтеточка!»';
            dialogueMood = 'silly';
          }
        } 
        
        else if (id === 'fishbowl') {
          newAction = 'pushing';
          if (!gameState.isMuted) gameAudio.playCrash();
          obj.tipped = true;
          logText = 'Кот опрокинул аквариум! Вода залила комод.';
          
          if (obj.heldItemId && !newInventory.includes(obj.heldItemId)) {
            newInventory.push(obj.heldItemId);
            const item = getItemDetail(obj.heldItemId);
            dialogueText = `«О нет! Золотая рыбка! Лови её! Погоди-ка... Вместе с водой на поднос вымыло ${item.name}! Как он там оказался?»`;
            dialogueMood = 'shocked';
            if (!gameState.isMuted) gameAudio.playClick();
          } else {
            dialogueText = '«Вода повсюду! Хватит устраивать купание, Миднайт! Рыбка выглядит испуганной, а я промок до нитки!»';
            dialogueMood = 'serious';
          }
        } 
        
        else if (id === 'lamp') {
          newAction = 'jumping';
          if (!gameState.isMuted) gameAudio.playClick();
          obj.toggled = !obj.toggled;
          logText = obj.toggled ? 'Кот нажал на рычаг торшера и зажег лампу.' : 'Кот выключил торшер лапой.';

          const isSafeCodeViaLamp = prev.solvedSteps.includes('safe_code_via_lamp');

          if (obj.toggled) {
            if (isSafeCodeViaLamp && prev.objects.bookshelf.booksFallen && !newInventory.includes('safe_code_note')) {
              newInventory.push('safe_code_note');
              dialogueText = `«Свет озарил пустую полку... Смотри, на задней стенке шкафа проступили цифры: [${prev.safeCode}]! Это код от сейфа!»`;
              dialogueMood = 'shocked';
              if (!gameState.isMuted) gameAudio.playClick();
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
              // Unlock desk drawer
              obj.locked = false;
              newAction = 'meowing';
              if (!gameState.isMuted) gameAudio.playClick();
              logText = 'Кот поскреб лапкой замочную скважину, а Барт отпер её латунным ключом!';
              
              const isSafeCodeViaDesk = prev.solvedSteps.includes('safe_code_via_desk');

              if (obj.heldClueId && !newFoundClues.includes(obj.heldClueId)) {
                newFoundClues.push(obj.heldClueId);
                const clue = prev.currentClues.find(c => c.id === obj.heldClueId);
                dialogueText = clue 
                  ? `«Замок поддался! Открываю ящик... О боже, да тут ${clue.name}! ${clue.description}»`
                  : 'Найдена улика в столе!';
                dialogueMood = 'shocked';
                if (!gameState.isMuted) gameAudio.playClueFound();
              }

              if (isSafeCodeViaDesk && !newInventory.includes('safe_code_note')) {
                newInventory.push('safe_code_note');
                dialogueText += ` Кроме того, под двойным дном лежит бумажка! Это комбинация от сейфа: [${prev.safeCode}]!`;
                dialogueMood = 'shocked';
              }
              
              // Consume brass key
              const keyIdx = newInventory.indexOf('key_brass');
              if (keyIdx > -1) newInventory.splice(keyIdx, 1);
            } else {
              newAction = 'meowing';
              if (!gameState.isMuted) gameAudio.playClick();
              dialogueText = '«Этот выдвижной ящик плотно заперт. Замочная скважина совсем крошечная, латунная. Нам нужен ключ.»';
              dialogueMood = 'thoughtful';
              logText = 'Кот скребется в запертый ящик стола.';
            }
          } else {
            dialogueText = '«Ящик стола уже открыт. Здесь только засохшая чернильница и пыль времени...»';
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

        // Check Victory conditions
        let nextStatus = prev.gameStatus;
        let isPendingVictory = false;
        let updatedCash = prev.economy?.cash ?? 150;
        let recentExpensesList = prev.economy?.recentExpenses ? [...prev.economy.recentExpenses] : [];

        if (newFoundClues.length >= 3) {
          isPendingVictory = true;
          const isStory = prev.storyState?.mode === 'story';
          const ch = prev.storyState?.chapter ?? 1;
          const reward = isStory ? (ch === 1 ? 200 : ch === 2 ? 300 : 400) : 150;
          const expensesTotal = 110;
          const netProfit = reward - expensesTotal;
          updatedCash += netProfit;

          recentExpensesList = [
            { name: 'Аренда офиса Барта', amount: 50, timestamp: new Date().toLocaleTimeString() },
            { name: 'Паштет из лосося для Миднайта', amount: 35, timestamp: new Date().toLocaleTimeString() },
            { name: 'Табак для трубки Барта', amount: 15, timestamp: new Date().toLocaleTimeString() },
            { name: 'Черный крепкий кофе', amount: 10, timestamp: new Date().toLocaleTimeString() }
          ];

          newLogs.push(addLog('system', `ДЕЛО УСПЕШНО РАСКРЫТО! Получен гонорар: +${reward}$. Списаны расходы бюро: -${expensesTotal}$. Чистая прибыль: +${netProfit}$.`));
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
          logs: newLogs,
          gameStatus: nextStatus,
          pendingVictory: isPendingVictory || prev.pendingVictory,
          economy: {
            cash: updatedCash,
            recentExpenses: recentExpensesList
          },
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

        if (newFoundClues.length >= 3) {
          isPendingVictory = true;
          const isStory = prev.storyState?.mode === 'story';
          const ch = prev.storyState?.chapter ?? 1;
          const reward = isStory ? (ch === 1 ? 200 : ch === 2 ? 300 : 400) : 150;
          const expensesTotal = 110;
          const netProfit = reward - expensesTotal;
          updatedCash += netProfit;

          recentExpensesList = [
            { name: 'Аренда офиса Барта', amount: 50, timestamp: new Date().toLocaleTimeString() },
            { name: 'Паштет из лосося для Миднайта', amount: 35, timestamp: new Date().toLocaleTimeString() },
            { name: 'Табак для трубки Барта', amount: 15, timestamp: new Date().toLocaleTimeString() },
            { name: 'Черный крепкий кофе', amount: 10, timestamp: new Date().toLocaleTimeString() }
          ];

          newLogs.push(addLog('system', `ДЕЛО УСПЕШНО РАСКРЫТО! Получен гонорар: +${reward}$. Списаны расходы бюро: -${expensesTotal}$. Чистая прибыль: +${netProfit}$.`));
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

    const cleanState = generateNewGame(nextMode, nextChapter, currentCash);
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
    setGameState(prev => ({
      ...prev,
      gameStatus: 'intro'
    }));
  };

  const handleChangeLocation = (loc: 'pier' | 'warehouse') => {
    if (gameState.gameStatus !== 'playing') return;
    gameAudio.playClick();
    setGameState(prev => ({
      ...prev,
      storyState: {
        ...prev.storyState,
        currentLocationId: loc
      },
      logs: [
        ...prev.logs,
        addLog('system', `Миднайт и Барт переместились: ${loc === 'pier' ? 'Туманный причал' : 'Склад №9'}`)
      ],
      activeDialogue: {
        sender: 'detective',
        text: loc === 'pier' 
          ? '«Бр-р, какой промозглый туман на этом причале! Миднайт, держись ближе к моим ботинкам, чтобы не свалиться в воду!»'
          : '«Итак, мы пробрались внутрь Склада №9. Здесь темно, хоть глаз выколи... Какие тайны скрывают контрабандисты?»',
        mood: 'thoughtful'
      }
    }));
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
              <div className="px-2 py-0.5 border border-emerald-500/30 bg-emerald-950/20 rounded-none text-[8px] font-mono text-emerald-400 font-bold uppercase tracking-widest leading-none">
                Бюджет бюро: {gameState.economy?.cash ?? 150}$
              </div>
            </div>
            <span className="font-sans text-[8px] text-white/40 uppercase tracking-[0.25em] block mt-1.5 leading-none">
              {gameState.roomInfo?.caseName || 'КЕЙС №42'} // {gameState.storyState?.mode === 'story' ? `СЮЖЕТ (ГЛАВА ${gameState.storyState?.chapter ?? 1})` : 'ПЕСОЧНИЦА'}
            </span>
          </div>
        </div>

        {/* Global Controls */}
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
      </header>

      {/* Main Container Layout */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 flex flex-col lg:flex-row gap-6 relative z-20">
        
        {/* Left side: Game Visuals Grid */}
        <div className="flex-1 flex flex-col gap-4">
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
        <div className="w-full lg:w-[380px] flex flex-col gap-4">
          {/* Tracker holds case cards & items */}
          <ClueTracker 
            currentClues={gameState.currentClues}
            foundClueIds={gameState.foundClueIds}
            inventory={gameState.inventory}
            safeCode={gameState.safeCode}
            customItems={gameState.customItems}
          />

          {/* Action Log Box */}
          <div className="border border-white/10 bg-[#0a0a0a] rounded-none p-4 flex-1 flex flex-col min-h-[160px] shadow-2xl">
            <h3 className="font-sans text-[11px] font-bold text-white/80 uppercase tracking-[0.25em] border-b border-white/10 pb-2.5 mb-3">
              Протокол осмотра (Логи)
            </h3>
            
            <div className="flex-1 overflow-y-auto max-h-[220px] font-mono text-[10px] text-white/50 space-y-2 pr-1 select-text custom-scrollbar">
              {gameState.logs.map((log) => (
                <div key={log.id} className="border-b border-white/5 pb-1">
                  <span className="text-white/20 mr-1.5">[{log.timestamp}]</span>
                  <span className={`font-bold mr-1.5 ${
                    log.sender === 'detective' ? 'text-white/60' : log.sender === 'cat' ? 'text-white/90' : 'text-white/30'
                  }`}>
                    {log.sender === 'detective' ? 'Барт:' : log.sender === 'cat' ? 'Миднайт:' : 'ИНФО:'}
                  </span>
                  <span>{log.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

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
        <IntroScreen onStartGame={handleStartGame} />
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
                  {(!gameState.storyState?.mode || gameState.storyState.mode === 'sandbox') && (
                    `«Три неопровержимые улики лежали на моем полированном столе. Дело было шито белыми нитками. Окружной прокурор будет в восторге, а моя фотография украсит первую полосу утренних новостей! Конечно, пушистый сорванец Миднайт крутился рядом и устроил погром... но сегодня он заслужил двойной паштет!»`
                  )}
                </p>
              </div>

              <div className="border-t border-white/5 pt-3.5 font-mono text-[9px] text-white/40 space-y-1">
                <div className="text-white/70 font-bold uppercase font-sans tracking-widest text-[8px] mb-1">Сводка по делу:</div>
                <div>• Собрано улик: {gameState.foundClueIds.length} из 3</div>
                <div>• Спец-код от сейфа: {gameState.safeCode}</div>
                <div>• Оперативники: детектив Ванс & кот Миднайт</div>
              </div>
            </div>

            {/* Financial Ledger (5 cols) */}
            <div className="md:col-span-5 border border-white/10 bg-neutral-950 p-5 flex flex-col justify-between text-left">
              <div>
                <span className="font-mono text-[8px] uppercase tracking-widest text-white/50 block mb-2.5">БУХГАЛТЕРСКИЙ ОТЧЕТ БЮРО</span>
                <div className="h-[1px] bg-white/10 mb-3" />

                <div className="space-y-2 font-mono text-[10px]">
                  <div className="flex justify-between text-white/60">
                    <span>Стартовый капитал:</span>
                    <span>{(gameState.economy?.cash ?? 150) - (gameState.storyState?.mode === 'story' ? (gameState.storyState.chapter === 1 ? 90 : gameState.storyState.chapter === 2 ? 190 : 290) : 40)}$</span>
                  </div>

                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>+ Гонорар за раскрытие:</span>
                    <span>+{gameState.storyState?.mode === 'story' ? (gameState.storyState.chapter === 1 ? 200 : gameState.storyState.chapter === 2 ? 300 : 400) : 150}$</span>
                  </div>

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

                  <div className="h-[1px] bg-white/5 my-2" />

                  <div className="flex justify-between text-white font-bold border-t border-white/10 pt-2 text-[11px]">
                    <span>Итоговый капитал:</span>
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
            {gameState.storyState?.mode === 'story' && gameState.storyState.chapter < 3 ? (
              <button 
                onClick={handleResetGame}
                className="h-12 px-8 bg-white hover:bg-neutral-200 text-black font-sans text-xs font-bold uppercase tracking-[0.2em] rounded-none transition-all flex items-center justify-center gap-2 shadow-2xl hover:scale-105"
              >
                <Lucide.ArrowRight className="w-4 h-4 text-black animate-pulse" />
                Перейти к Главе {gameState.storyState.chapter + 1}
              </button>
            ) : gameState.storyState?.mode === 'story' && gameState.storyState.chapter === 3 ? (
              <div className="flex flex-col items-center gap-3">
                <div className="px-4 py-2 border border-yellow-500/30 bg-yellow-950/20 text-yellow-400 text-xs font-serif italic mb-1 uppercase tracking-widest">
                  🏆 Кампания полностью пройдена!
                </div>
                <button 
                  onClick={handleReturnToMenu}
                  className="h-12 px-8 bg-white hover:bg-neutral-200 text-black font-sans text-xs font-bold uppercase tracking-[0.2em] rounded-none transition-all flex items-center justify-center gap-2 shadow-2xl"
                >
                  <Lucide.RotateCcw className="w-3.5 h-3.5" />
                  Вернуться в главное меню
                </button>
              </div>
            ) : (
              <>
                <button 
                  onClick={handleResetGame}
                  className="h-12 px-8 bg-white hover:bg-neutral-200 text-black font-sans text-xs font-bold uppercase tracking-[0.2em] rounded-none transition-all flex items-center justify-center gap-2 shadow-2xl hover:scale-105"
                >
                  <Lucide.RotateCcw className="w-3.5 h-3.5" />
                  Начать следующее дело
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
    </div>
  );
}
