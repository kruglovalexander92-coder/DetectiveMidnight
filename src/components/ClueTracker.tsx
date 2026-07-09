/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Clue, PuzzleItem, TornNoteState } from '../types';
import { DUMMY_ITEMS } from '../utils/puzzleGenerator';
import * as Lucide from 'lucide-react';

interface ClueTrackerProps {
  currentClues: Clue[];
  foundClueIds: string[];
  inventory: string[];
  safeCode: string;
  customItems?: Record<string, PuzzleItem>;
  activeTornNote?: TornNoteState;
  onOpenTornNote?: () => void;
}

interface SelectedDetail {
  type: 'clue' | 'item';
  name: string;
  description: string;
  icon: string;
  idx?: number;
}

// Icon mapper helper
const IconComponent = ({ name, className }: { name: string; className?: string }) => {
  const Icon = (Lucide as any)[name];
  if (!Icon) return <Lucide.Search className={className} />;
  return <Icon className={className} />;
};

export default function ClueTracker({
  currentClues,
  foundClueIds,
  inventory,
  safeCode,
  customItems,
  activeTornNote,
  onOpenTornNote
 }: ClueTrackerProps) {
  const [activeDetail, setActiveDetail] = useState<SelectedDetail | null>(null);

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Clues section */}
      <div className="border border-white/10 bg-[#0a0a0a] rounded-none p-4 shadow-2xl">
        <h3 className="font-sans text-[11px] font-bold text-white/95 uppercase tracking-[0.25em] border-b border-white/10 pb-2.5 mb-4 flex items-center justify-between">
          <span>СЕКРЕТНЫЕ УЛИКИ ДЕЛА</span>
          <span className="text-black bg-white px-2 py-0.5 text-[9px] font-mono font-bold tracking-normal">
            {foundClueIds.length} / 3 НАЙДЕНО
          </span>
        </h3>

        <div className="grid grid-cols-3 gap-3">
          {currentClues.map((clue, idx) => {
            const isFound = foundClueIds.includes(clue.id);

            return (
              <div 
                key={clue.id}
                onClick={() => {
                  if (isFound) {
                    setActiveDetail({
                      type: 'clue',
                      name: clue.name,
                      description: clue.description,
                      icon: clue.icon,
                      idx: idx + 1
                    });
                  }
                }}
                className={`relative aspect-[3/4] border rounded-none flex flex-col justify-between p-2.5 transition-all duration-300 ${
                  isFound 
                    ? 'border-white/30 bg-black text-white shadow-xl transform rotate-1 cursor-pointer hover:border-white/60 hover:scale-[1.02]' 
                    : 'border-dashed border-white/5 bg-transparent text-white/20 select-none cursor-not-allowed'
                }`}
                title={isFound ? "Нажмите для подробного просмотра" : "Эта улика еще не найдена"}
              >
                {isFound ? (
                  <>
                    <div className="flex justify-between items-start">
                      <span className="text-[8px] font-mono font-bold text-white/50 bg-white/5 px-1">
                        УЛИКА №{idx + 1}
                      </span>
                      <IconComponent name={clue.icon} className="w-3.5 h-3.5 text-white/60" />
                    </div>
                    
                    <div className="my-2 flex-1 flex flex-col justify-center">
                      <h4 className="font-serif text-[12px] font-bold leading-tight mb-1 line-clamp-1">
                        {clue.name}
                      </h4>
                      <p className="font-serif italic text-[10px] leading-tight text-white/60 overflow-y-auto max-h-[60px] custom-scrollbar">
                        {clue.description}
                      </p>
                    </div>

                    <div className="border-t border-white/10 pt-1.5 text-center">
                      <span className="text-[8px] font-mono text-white/40 uppercase tracking-[0.15em] animate-pulse">
                        Изучить
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center select-none">
                    <span className="text-lg font-bold font-serif italic opacity-10">?</span>
                    <span className="text-[8px] font-mono uppercase tracking-[0.15em] mt-2 opacity-25">
                      Улика №{idx + 1}
                    </span>
                    <span className="text-[8px] font-serif italic text-white/30 mt-1 leading-none">
                      В розыске
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Torn Note Puzzle shortcut */}
      {activeTornNote && (
        <div className="border border-amber-500/30 bg-[#16120e] rounded-none p-4 shadow-2xl relative overflow-hidden">
          {/* Subtle amber background pattern */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-950/10 to-transparent pointer-events-none" />

          <h3 className="font-sans text-[11px] font-bold text-amber-500 uppercase tracking-[0.25em] border-b border-amber-900/30 pb-2.5 mb-3 flex items-center justify-between">
            <span>НАЙДЕННЫЕ ОБРЫВКИ</span>
            <span className={`px-2 py-0.5 text-[9px] font-mono font-bold tracking-normal ${
              activeTornNote.completed 
                ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-500/20' 
                : 'text-amber-400 bg-amber-950/40 border border-amber-500/20'
            }`}>
              {activeTornNote.completed ? 'СОБРАНО' : 'НЕ СЛОЖЕНО'}
            </span>
          </h3>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border border-amber-900/40 bg-stone-900 flex items-center justify-center shrink-0">
              <Lucide.FileQuestion className={`w-5 h-5 ${activeTornNote.completed ? 'text-emerald-500' : 'text-amber-500 animate-pulse'}`} />
            </div>
            <div className="flex-1">
              <h4 className="font-serif text-xs font-bold text-stone-200">
                Записка из мусорной корзины
              </h4>
              <p className="font-sans text-[9.5px] text-stone-400 mt-0.5 leading-tight line-clamp-1">
                {activeTornNote.completed ? 'Прочитано: ' + activeTornNote.fullText : 'Кусочки порваны и лежат в беспорядке.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (onOpenTornNote) onOpenTornNote();
            }}
            className="w-full mt-3.5 py-2 border border-amber-500/40 hover:border-amber-500 bg-amber-950/20 hover:bg-amber-950/40 text-amber-400 font-sans text-[9px] font-bold uppercase tracking-wider transition-all hover:scale-[1.01] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Lucide.Puzzle className="w-3.5 h-3.5 animate-pulse" />
            <span>{activeTornNote.completed ? 'Прочитать записку' : '🧩 Собрать пазл'}</span>
          </button>
        </div>
      )}

      {/* Inventory section */}
      <div className="border border-white/10 bg-[#0a0a0a] rounded-none p-4 shadow-2xl">
        <h3 className="font-sans text-[11px] font-bold text-white/90 uppercase tracking-[0.25em] border-b border-white/10 pb-2.5 mb-3">
          В КЛИПСАХ УЛИК (ИНВЕНТАРЬ)
        </h3>

        {inventory.length === 0 ? (
          <div className="h-14 border border-dashed border-white/5 rounded-none flex items-center justify-center font-serif text-[10px] text-white/30 italic">
            Пасть кота пуста... Пока что.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {inventory.map((itemId) => {
              const item = (customItems && customItems[itemId]) || (DUMMY_ITEMS as any)[itemId];
              if (!item) return null;

              const description = itemId === 'safe_code_note'
                ? `Код от сейфа: ${safeCode}`
                : item.description;

              return (
                <div 
                  key={itemId}
                  onClick={() => {
                    setActiveDetail({
                      type: 'item',
                      name: item.name,
                      description: description,
                      icon: item.icon
                    });
                  }}
                  className="flex items-center gap-2.5 border border-white/10 bg-black p-2 rounded-none shadow-lg max-w-[240px] cursor-pointer hover:border-white/30 hover:scale-[1.02] transition-all"
                  title="Нажмите для подробного просмотра"
                >
                  <div className="w-8 h-8 rounded-none border border-white/10 bg-[#080808] flex items-center justify-center flex-shrink-0">
                    <IconComponent name={item.icon} className="w-3.5 h-3.5 text-white/80" />
                  </div>
                  <div>
                    <h5 className="font-serif text-xs font-bold text-white leading-tight">
                      {item.name}
                    </h5>
                    <p className="font-mono text-[8px] text-white/50 leading-none mt-0.5 uppercase tracking-wider truncate max-w-[150px]">
                      {description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal Overlay */}
      {activeDetail && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          onClick={() => setActiveDetail(null)}
        >
          <div 
            className="w-full max-w-md border border-white/20 bg-[#0c0c0c] p-6 shadow-2xl relative flex flex-col items-center text-center animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Retro frame lines */}
            <div className="absolute inset-1 border border-white/5 pointer-events-none" />

            {/* Icon */}
            <div className="w-16 h-16 border border-white/15 bg-black flex items-center justify-center mb-5 mt-2 shadow-inner">
              <IconComponent name={activeDetail.icon} className="w-8 h-8 text-white" />
            </div>

            {/* Type badge */}
            <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/40 mb-2">
              {activeDetail.type === 'clue' ? `Найденная улика №${activeDetail.idx}` : 'Предмет в инвентаре'}
            </span>

            {/* Name */}
            <h4 className="font-serif text-xl sm:text-2xl font-bold text-white tracking-wide mb-4 leading-tight">
              {activeDetail.name}
            </h4>

            {/* Line separator */}
            <div className="w-12 h-0.5 bg-white/20 mb-5" />

            {/* Description */}
            <p className="font-serif italic text-sm sm:text-base text-white/80 leading-relaxed mb-6 px-2 whitespace-pre-line">
              {activeDetail.description}
            </p>

            {/* Status indicator */}
            <div className="w-full border-t border-white/10 pt-4 pb-2 flex justify-between items-center px-2">
              <span className="font-mono text-[8px] text-white/30 uppercase tracking-[0.15em]">
                Статус: Изучено
              </span>
              <button
                onClick={() => setActiveDetail(null)}
                className="px-4 py-1.5 border border-white/15 hover:border-white/40 bg-black text-[9px] font-mono uppercase tracking-[0.2em] text-white/60 hover:text-white transition-all cursor-pointer"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
