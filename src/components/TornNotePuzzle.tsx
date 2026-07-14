/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GameState, TornNotePiece } from '../types';
import * as Lucide from 'lucide-react';
import { gameAudio } from '../utils/AudioEngine';

interface TornNotePuzzleProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  onClose: () => void;
}

export default function TornNotePuzzle({
  gameState,
  setGameState,
  onClose
}: TornNotePuzzleProps) {
  const activeNote = gameState.activeTornNote;

  // Local state for the puzzle board
  // We keep a local arrangement of pieces in slots 0 to 5
  const [boardSlots, setBoardSlots] = useState<(TornNotePiece | null)[]>([
    null, null, null, null, null, null
  ]);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showFullLetter, setShowFullLetter] = useState(false);

  // Initialize board with the note pieces from activeNote
  useEffect(() => {
    if (!activeNote) return;

    // Place pieces into slots
    // If the pieces already have a currentSlot, we place them there.
    // Otherwise, we place them in the first available slots to fill the board.
    const initialSlots = [null, null, null, null, null, null] as (TornNotePiece | null)[];
    
    // We clone the pieces so we can mutate safely in state
    const piecesToPlace = activeNote.pieces.map(p => ({ ...p }));
    
    piecesToPlace.forEach((piece, index) => {
      if (piece.currentSlot !== null && piece.currentSlot >= 0 && piece.currentSlot < 6) {
        initialSlots[piece.currentSlot] = piece;
      } else {
        // Find first empty slot
        const emptyIdx = initialSlots.indexOf(null);
        if (emptyIdx !== -1) {
          piece.currentSlot = emptyIdx;
          initialSlots[emptyIdx] = piece;
        }
      }
    });

    setBoardSlots(initialSlots);
    setIsSuccess(activeNote.completed);
    if (activeNote.completed) {
      setShowFullLetter(true);
    }
  }, [activeNote]);

  if (!activeNote) return null;

  // Sound triggers
  const playClick = () => {
    try { if (!gameState.isMuted) gameAudio.playClick(); } catch (e) {}
  };

  const playSuccess = () => {
    try { if (!gameState.isMuted) gameAudio.playClueFound(); } catch (e) {}
  };

  // Check if the board matches correct solution:
  // Every slot i has a piece with originalIndex === i and rotation === 0
  const checkCompletion = (currentSlots: (TornNotePiece | null)[]) => {
    const isCompleted = currentSlots.every((piece, index) => {
      return piece !== null && piece.originalIndex === index && piece.rotation === 0;
    });

    if (isCompleted && !isSuccess) {
      setIsSuccess(true);
      setShowFullLetter(true);
      playSuccess();

      // Update global GameState
      setGameState(prev => {
        if (!prev.activeTornNote) return prev;
        
        const updatedNote = {
          ...prev.activeTornNote,
          completed: true,
          pieces: currentSlots.filter((p): p is TornNotePiece => p !== null)
        };

        const logsCopy = [...prev.logs];
        const logsPush = (sender: 'detective' | 'cat' | 'system', text: string) => {
          const id = `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
          logsCopy.push({
            id,
            sender,
            text,
            timestamp: new Date().toLocaleTimeString()
          });
        };

        logsPush('system', '🧩 ЗАПИСКА СОБРАНА! Секретное письмо успешно расшифровано.');

        let newDialogueText = '«Готово! Линии разрывов совпали, и текст стал полностью читаемым! Что тут у нас...»';
        
        // Find held clue if exists
        const newFoundClues = [...prev.foundClueIds];
        if (updatedNote.clueIdToUnlock && !newFoundClues.includes(updatedNote.clueIdToUnlock)) {
          newFoundClues.push(updatedNote.clueIdToUnlock);
          const clue = prev.currentClues.find(c => c.id === updatedNote.clueIdToUnlock);
          newDialogueText += clue ? `\n\nНу, как я и предполагал! Перед нами важная улика — "${clue.name}"! ${clue.findingMessage}` : '';
          logsPush('system', `Найдена улика: ${clue?.name || 'Секретный документ'}`);
        }

        // Give reward cash + reputation if not claimed yet
        let updatedCash = prev.economy?.cash ?? 150;
        let updatedReputation = prev.reputation ?? 0;
        let recentExpensesList = prev.economy?.recentExpenses ? [...prev.economy.recentExpenses] : [];

        if (!prev.activeTornNote.rewardClaimed) {
          updatedCash += 30;
          updatedReputation += 15;
          recentExpensesList = [
            { name: 'Заначка из мусорной корзины', amount: -30, timestamp: new Date().toLocaleTimeString() },
            ...recentExpensesList
          ];
          logsPush('system', '💰 НАХОДКА! В корзине среди бумаг была припрятана заначка контрабандистов: +30$ и +15 Репутации!');
          updatedNote.rewardClaimed = true;
        }

        // Check Victory conditions if clues collected
        let nextStatus = prev.gameStatus;
        let isPendingVictory = prev.pendingVictory;
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
          updatedReputation += repGain;

          logsPush('system', `ДЕЛО УСПЕШНО РАСКРЫТО! Получен гонорар: +${reward}$. Чистая прибыль: +${netProfit}$.`);
          logsPush('system', `📈 РЕПУТАЦИЯ ПОВЫШЕНА: +${repGain} очков!`);
        }

        return {
          ...prev,
          activeTornNote: updatedNote,
          foundClueIds: newFoundClues,
          logs: logsCopy,
          gameStatus: nextStatus,
          pendingVictory: isPendingVictory || prev.pendingVictory,
          economy: {
            cash: updatedCash,
            recentExpenses: recentExpensesList
          },
          reputation: updatedReputation,
          activeDialogue: {
            sender: 'detective',
            text: newDialogueText,
            mood: 'proud'
          }
        };
      });
    }
  };

  // Handle slot interaction
  const handleSlotClick = (slotIdx: number) => {
    if (isSuccess) return;
    playClick();

    if (selectedSlotIndex === null) {
      // First select
      if (boardSlots[slotIdx] !== null) {
        setSelectedSlotIndex(slotIdx);
      }
    } else {
      // We have a previously selected slot.
      // If we clicked the same slot, we deselect it.
      if (selectedSlotIndex === slotIdx) {
        setSelectedSlotIndex(null);
      } else {
        // Swap pieces in selectedSlotIndex and slotIdx
        const newSlots = [...boardSlots];
        const pieceA = newSlots[selectedSlotIndex];
        const pieceB = newSlots[slotIdx];

        if (pieceA) pieceA.currentSlot = slotIdx;
        if (pieceB) pieceB.currentSlot = selectedSlotIndex;

        newSlots[selectedSlotIndex] = pieceB;
        newSlots[slotIdx] = pieceA;

        setBoardSlots(newSlots);
        setSelectedSlotIndex(null);
        
        // Save current positions to GameState
        setGameState(prev => {
          if (!prev.activeTornNote) return prev;
          const piecesToSave = newSlots.filter((p): p is TornNotePiece => p !== null);
          return {
            ...prev,
            activeTornNote: {
              ...prev.activeTornNote,
              pieces: piecesToSave
            }
          };
        });

        checkCompletion(newSlots);
      }
    }
  };

  // Rotate a piece in a slot by 90 degrees clockwise
  const handleRotatePiece = (slotIdx: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering slot selection swap
    if (isSuccess) return;
    playClick();

    const newSlots = [...boardSlots];
    const piece = newSlots[slotIdx];
    if (piece) {
      // Rotate 90 deg clockwise (0 -> 90 -> 180 -> 270 -> 0)
      piece.rotation = (piece.rotation + 90) % 360;
      setBoardSlots(newSlots);
      
      // Save rotation to GameState
      setGameState(prev => {
        if (!prev.activeTornNote) return prev;
        const piecesToSave = newSlots.filter((p): p is TornNotePiece => p !== null);
        return {
          ...prev,
          activeTornNote: {
            ...prev.activeTornNote,
            pieces: piecesToSave
          }
        };
      });

      checkCompletion(newSlots);
    }
  };

  // Custom jagged rip clip-path styles
  // To make it feel super authentic, we give slightly different rips based on piece index
  const getPieceClipPath = (idx: number) => {
    // Generate a beautiful procedural torn paper edge clip-path
    if (idx === 0) {
      // Left edge is straight (start of letter), right is torn
      return "polygon(0% 0%, 93% 0%, 88% 10%, 93% 22%, 87% 35%, 94% 48%, 89% 60%, 94% 72%, 88% 85%, 93% 94%, 90% 100%, 0% 100%)";
    } else if (idx === 5) {
      // Left edge is torn, right edge is straight (end of letter)
      return "polygon(10% 0%, 100% 0%, 100% 100%, 8% 100%, 12% 92%, 6% 80%, 12% 68%, 7% 55%, 13% 42%, 8% 30%, 12% 18%, 6% 8%)";
    } else {
      // Both edges are torn
      return "polygon(8% 0%, 92% 0%, 87% 10%, 93% 22%, 88% 35%, 94% 48%, 89% 60%, 94% 72%, 88% 85%, 93% 94%, 89% 100%, 11% 100%, 6% 91%, 12% 82%, 7% 70%, 12% 58%, 8% 45%, 13% 32%, 7% 20%, 11% 8%)";
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-950/95 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-4 overflow-y-auto">
      {/* Background grain texture */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-stone-900/40 via-stone-950/90 to-stone-950 pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-4xl border-2 border-stone-800 bg-[#16120e] p-6 sm:p-8 shadow-2xl relative flex flex-col items-center animate-fade-in text-stone-200">
        
        {/* Retro style paper clips and design touches */}
        <div className="absolute -top-3 left-1/4 w-12 h-6 border-b border-x border-stone-500 rounded-b bg-stone-700 opacity-60" />
        <div className="absolute -top-3 right-1/4 w-12 h-6 border-b border-x border-stone-500 rounded-b bg-stone-700 opacity-60" />
        
        {/* Header */}
        <div className="w-full flex justify-between items-start border-b border-stone-800 pb-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1 bg-amber-900/50 border border-amber-600 rounded">
                <Lucide.FileQuestion className="w-4 h-4 text-amber-500" />
              </span>
              <h2 className="font-sans text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-amber-500">
                Мини-игра: Клочки разорванной записки
              </h2>
            </div>
            <p className="font-serif italic text-xs text-stone-400">
              «Миднайт перевернул мусорную корзину! Из неё высыпались обрывки секретного письма. Сложите их вместе, чтобы раскрыть тайну!»
            </p>
          </div>
          
          <button 
            onClick={() => {
              playClick();
              onClose();
            }}
            className="p-1 border border-stone-800 hover:border-stone-600 hover:bg-stone-900 text-stone-400 hover:text-white transition-all cursor-pointer"
            title="Закрыть головоломку"
          >
            <Lucide.X className="w-5 h-5" />
          </button>
        </div>

        {/* Instructions Panel */}
        {!isSuccess && (
          <div className="w-full bg-[#1b140f] border border-amber-900/30 p-3 mb-6 text-xs font-sans leading-relaxed text-amber-100 flex items-start gap-2.5">
            <Lucide.Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-400">Как играть:</strong> Нажмите на клочок записки, чтобы выбрать его. Затем нажмите на другой клочок, чтобы <strong className="text-white underline">поменять их местами</strong>. Используйте кнопку поворотника <strong className="text-amber-500">⟳ 90°</strong> под каждым клочком, чтобы крутить его. Буквы должны выстроиться в ровные горизонтальные строчки!
            </div>
          </div>
        )}

        {/* Puzzle Board Area */}
        <div className="w-full flex flex-col items-center justify-center my-4 py-8 px-4 bg-stone-900/60 border border-stone-800 shadow-inner relative overflow-hidden min-h-[300px]">
          
          {/* Wooden/table accent grids */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(255,255,255,0.02)_1px,_transparent_1px)] bg-[size:40px_40px] opacity-25" />

          {/* Slots & Pieces Row */}
          <div className={`flex justify-center items-center relative z-10 w-full max-w-2xl select-none transition-all duration-500 ${
            isSuccess ? 'gap-0 shadow-2xl border border-stone-400/30 p-1 bg-[#fbf8f0]' : 'gap-1 sm:gap-2'
          }`}>
            {boardSlots.map((piece, idx) => {
              const isSelected = selectedSlotIndex === idx;

              return (
                <div 
                  key={`slot_${idx}`}
                  onClick={() => handleSlotClick(idx)}
                  className={`relative aspect-[1/2.5] w-[75px] sm:w-[95px] border transition-all duration-500 flex flex-col items-center justify-center cursor-pointer ${
                    isSelected 
                      ? 'border-amber-500 bg-amber-900/10 ring-4 ring-amber-500/30 z-20' 
                      : piece 
                        ? 'border-transparent bg-transparent' 
                        : 'border-dashed border-stone-800 bg-stone-950/40 hover:bg-stone-950/70'
                  }`}
                >
                  {/* Slot guide text behind empty slot */}
                  {!piece && (
                    <span className="font-mono text-[9px] text-stone-700 uppercase tracking-widest pointer-events-none">
                      Часть {idx + 1}
                    </span>
                  )}

                  {/* Render Ripped Piece */}
                  {piece && (
                    <div 
                      style={{ 
                        clipPath: isSuccess ? 'none' : getPieceClipPath(piece.originalIndex),
                        transform: `rotate(${piece.rotation}deg)`,
                      }}
                      className={`absolute inset-0 bg-[#fbf8f0] p-2 py-4 flex flex-col justify-between items-center text-stone-950 transition-all duration-500 ${
                        isSuccess 
                          ? 'border-y border-stone-300/40 shadow-none' 
                          : 'border-y border-stone-200 shadow-md hover:brightness-105 active:scale-95'
                      }`}
                    >
                      {/* Top burn mark details */}
                      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-b from-stone-400/15 to-transparent pointer-events-none" />

                      {/* Handwritten / Monospace Text lines on the strip */}
                      <div className="flex-1 flex flex-col justify-around w-full font-mono text-[10px] sm:text-xs font-bold leading-none tracking-tight text-center whitespace-pre py-2 select-none">
                        {piece.textLines.map((line, lIdx) => (
                          <div 
                            key={`line_${lIdx}`} 
                            className="bg-transparent text-[#1f242d] border-b border-stone-200/30 select-none pb-1"
                          >
                            {line}
                          </div>
                        ))}
                      </div>

                      {/* Torn texture bottom detail */}
                      <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-t from-stone-400/15 to-transparent pointer-events-none" />
                    </div>
                  )}

                  {/* Rotate Button Overlay at the bottom */}
                  {piece && !isSuccess && (
                    <button
                      onClick={(e) => handleRotatePiece(idx, e)}
                      className="absolute -bottom-7 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-stone-800 border border-stone-700 text-stone-300 hover:bg-stone-700 hover:text-white flex items-center justify-center transition-all shadow-md z-30 pointer-events-auto"
                      title="Повернуть клочок на 90 градусов"
                    >
                      <Lucide.RotateCw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Success Glitter Canvas */}
          {isSuccess && (
            <div className="absolute inset-0 bg-emerald-950/20 border-2 border-emerald-500/40 pointer-events-none flex items-center justify-center animate-fade-in">
              <div className="absolute top-4 right-4 bg-emerald-500 text-stone-950 text-[9px] font-mono font-bold py-1 px-2.5 uppercase tracking-wider animate-pulse">
                ✓ ТЕКСТ ВОССТАНОВЛЕН
              </div>
            </div>
          )}
        </div>

        {/* Restored Message Display Panel */}
        {showFullLetter && (
          <div className="w-full bg-[#fbf8f0] border-4 border-[#e9e3cf] p-5 sm:p-6 text-stone-900 shadow-xl animate-fade-in-up mt-4 relative">
            <div className="absolute -top-3 left-6 w-8 h-8 rounded-full bg-stone-900/15" />
            <div className="absolute -top-3 right-6 w-8 h-8 rounded-full bg-stone-900/15" />

            <div className="border-b border-stone-300/60 pb-2 mb-3 flex items-center justify-between">
              <span className="font-mono text-[9.5px] uppercase tracking-wider text-stone-500 font-bold">
                СЕКРЕТНОЕ ДОНЕСЕНИЕ (РАСШИФРОВАНО)
              </span>
              <span className="font-serif italic text-xs text-amber-800 font-bold">
                Шкатулка улик Барта
              </span>
            </div>

            <p className="font-serif text-sm sm:text-base italic leading-relaxed text-stone-800 font-medium pl-2 border-l-2 border-stone-300">
              «{activeNote.fullText}»
            </p>

            {/* Unlock details or rewards */}
            <div className="mt-4 border-t border-stone-200 pt-3.5 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
              <div className="flex items-center gap-2 text-emerald-700">
                <Lucide.BadgeCheck className="w-5 h-5" />
                <span className="font-sans text-xs font-bold">
                  Вы заслужили признание! +30$ и +15 Репутации добавлены в бюро!
                </span>
              </div>
              
              {activeNote.clueIdToUnlock && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-mono uppercase tracking-wider px-3 py-1.5 font-bold flex items-center gap-1.5">
                  <Lucide.Unlock className="w-3.5 h-3.5" />
                  Улика разблокирована
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="w-full flex justify-end gap-3 border-t border-stone-800 pt-5 mt-6">
          <button
            onClick={() => {
              playClick();
              onClose();
            }}
            className="px-5 py-2 border border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-200 font-sans text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            {isSuccess ? 'Отлично' : 'Вернуться к делу'}
          </button>
        </div>

      </div>
    </div>
  );
}
