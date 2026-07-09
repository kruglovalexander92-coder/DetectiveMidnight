/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import * as Lucide from 'lucide-react';
import { gameAudio } from '../utils/AudioEngine';

interface IntroScreenProps {
  onStartNewGame: (enableAudio: boolean) => void;
  onContinueGame: (enableAudio: boolean) => void;
  hasSavedGame: boolean;
  savedDay?: number;
  savedCash?: number;
  savedReputation?: number;
}

export default function IntroScreen({
  onStartNewGame,
  onContinueGame,
  hasSavedGame,
  savedDay = 1,
  savedCash = 150,
  savedReputation = 0
}: IntroScreenProps) {
  const [showRules, setShowRules] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showConfirmNewGame, setShowConfirmNewGame] = useState(false);

  const handleStartNew = () => {
    if (hasSavedGame) {
      gameAudio.playClick();
      setShowConfirmNewGame(true);
    } else {
      onStartNewGame(soundEnabled);
    }
  };

  const handleConfirmNew = () => {
    gameAudio.playClick();
    onStartNewGame(soundEnabled);
  };

  const handleContinue = () => {
    onContinueGame(soundEnabled);
  };

  return (
    <div className="absolute inset-0 bg-[#070707] flex flex-col justify-between p-6 sm:p-10 select-none z-40 overflow-y-auto custom-scrollbar">
      {/* Decorative elegant frame overlay with double-border effect */}
      <div className="absolute inset-4 sm:inset-6 border-double border-4 border-white/10 pointer-events-none" />
      <div className="absolute inset-6 sm:inset-8 border border-white/5 pointer-events-none" />

      {/* Header Title with massive elegant display serif typography */}
      <div className="w-full text-center mt-4 z-10">
        <span className="font-sans text-[10px] uppercase tracking-[0.5em] text-white/40 block mb-2">
          АТМОСФЕРНЫЙ ДЕТЕКТИВНЫЙ КВЕСТ
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl font-normal tracking-tight text-white flex flex-col leading-none">
          <span className="italic font-light text-white/70 text-2xl sm:text-3xl">Сыщик</span>
          <span className="font-bold uppercase text-3xl sm:text-4xl tracking-widest mt-1">Миднайт</span>
          <span className="text-white/40 font-serif text-xs sm:text-sm italic tracking-widest mt-2">
            и Дело о мокрой полуночи
          </span>
        </h1>
        <div className="w-12 h-[1px] bg-white/20 mx-auto mt-4" />
      </div>

      {/* Center content / main menu cards */}
      <div className="max-w-md w-full mx-auto my-4 flex-1 flex flex-col justify-center items-center gap-6 z-10">
        
        {/* Rules detail view */}
        {showRules ? (
          <div className="w-full border border-white/10 bg-black/80 p-6 sm:p-8 backdrop-blur-md font-sans animate-fade-in relative">
            <h2 className="font-serif text-lg font-bold italic text-white border-b border-white/10 pb-3 mb-5 tracking-wide flex justify-between items-center">
              <span>Статья оперативных правил</span>
              <span className="font-mono text-[8px] uppercase tracking-widest text-white/40 not-italic">КОДЕКС БЮРО</span>
            </h2>
            
            <ul className="text-xs text-white/80 space-y-3 list-none pl-0">
              <li className="flex items-start gap-2">
                <span className="text-white/30 font-mono mt-0.5">01 //</span>
                <span>
                  <strong className="text-white uppercase font-sans tracking-wider text-[10px] mr-1 block sm:inline">Роль кота:</strong> Вы играете за кота <strong className="text-white font-serif italic">Миднайта</strong>. Детектив Барт Ванс думает, что расследование ведет он, но его умственные способности слегка переоценены.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-white/30 font-mono mt-0.5">02 //</span>
                <span>
                  <strong className="text-white uppercase font-sans tracking-wider text-[10px] mr-1 block sm:inline">Задача:</strong> Найти ровно <strong className="text-white font-serif italic font-bold">3 скрытые улики</strong> на сцене преступления, чтобы закрыть дело.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-white/30 font-mono mt-0.5">03 //</span>
                <span>
                  <strong className="text-white uppercase font-sans tracking-wider text-[10px] mr-1 block sm:inline">Взаимодействие:</strong> Кликайте по предметам. Миднайт пойдет туда и перевернет мусорку, уронит книги, подерет ковер или залезет на шкаф.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-white/30 font-mono mt-0.5">04 //</span>
                <span>
                  <strong className="text-white uppercase font-sans tracking-wider text-[10px] mr-1 block sm:inline">Подсказки и коды:</strong> Ищите ключи от запертых ящиков, светите лампой в темные углы или разгадывайте коды для сейфа.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-white/30 font-mono mt-0.5">05 //</span>
                <span>
                  <strong className="text-white uppercase font-sans tracking-wider text-[10px] mr-1 block sm:inline">Бюджет и расходы:</strong> Каждый день бюро платит <strong className="text-red-400 font-mono">110$</strong> за аренду и лососевый паштет. Держите баланс кассы выше нуля!
                </span>
              </li>
            </ul>

            <button 
              onClick={() => {
                gameAudio.playClick();
                setShowRules(false);
              }}
              className="mt-6 w-full h-11 bg-white/5 hover:bg-white/10 text-white hover:text-white text-xs font-sans uppercase tracking-[0.2em] border border-white/10 transition-all rounded-none"
            >
              Вернуться назад
            </button>
          </div>
        ) : showConfirmNewGame ? (
          /* Confirmation before overwriting saved progress */
          <div className="w-full border border-red-500/20 bg-black/90 p-6 backdrop-blur-md font-sans text-center animate-fade-in relative">
            <Lucide.AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3 animate-pulse" />
            <h3 className="font-serif text-base font-bold italic text-white mb-2">Начать новую игру?</h3>
            <p className="text-[11px] leading-relaxed text-white/60 mb-6">
              Обнаружено сохранение на <strong className="text-white">Дне {savedDay}</strong> с балансом <strong className="text-emerald-400">{savedCash}$</strong>. Нажимая кнопку продолжить, вы полностью сотрете текущий прогресс бюро и начнете карьеру заново с Дня 1.
            </p>

            <div className="space-y-2">
              <button
                onClick={handleConfirmNew}
                className="w-full h-11 bg-red-700 hover:bg-red-600 text-white text-xs font-sans uppercase tracking-[0.15em] transition-all font-bold rounded-none"
              >
                Да, стереть прогресс и начать заново
              </button>
              <button
                onClick={() => {
                  gameAudio.playClick();
                  setShowConfirmNewGame(false);
                }}
                className="w-full h-10 border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 text-xs font-sans uppercase tracking-[0.15em] transition-all rounded-none"
              >
                Отмена
              </button>
            </div>
          </div>
        ) : (
          /* Main menu options panel */
          <div className="w-full border border-white/10 bg-black/60 p-6 backdrop-blur-md flex flex-col justify-between items-center text-center relative gap-6">
            
            {/* Status indicator */}
            <div className="w-full border-b border-white/10 pb-4">
              <span className="font-mono text-[8px] uppercase tracking-widest text-white/40 block mb-2">ГЛАВНЫЙ ОФИС СЫЩИКОВ</span>
              <div className="font-serif text-sm italic text-white/90 leading-tight">Агентство «Ванс и Миднайт»</div>
              <span className="font-sans text-[8px] text-white/40 uppercase tracking-[0.2em] block mt-1">Лондон • Бейкер-стрит, 221-Б</span>
            </div>

            {/* Menu Options */}
            <div className="w-full flex flex-col gap-3">
              
              {/* CONTINUE GAME BUTTON (IF SAVE EXISTS) */}
              {hasSavedGame && (
                <button 
                  onClick={handleContinue}
                  className="w-full border-2 border-emerald-500 bg-emerald-950/20 hover:bg-emerald-900/30 text-emerald-300 font-sans p-3.5 transition-all flex flex-col items-center justify-center gap-0.5 shadow-lg group hover:scale-[1.02] active:scale-[0.98] rounded-none cursor-pointer"
                >
                  <span className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 text-white group-hover:text-emerald-300">
                    <Lucide.Play className="w-3 h-3 fill-white group-hover:fill-emerald-300" />
                    Продолжить расследование
                  </span>
                  <span className="font-mono text-[9px] text-white/50 group-hover:text-white/70">
                    День {savedDay} • Баланс: {savedCash}$ • Репутация: {savedReputation}★
                  </span>
                </button>
              )}

              {/* START GAME BUTTON */}
              <button 
                onClick={handleStartNew}
                className={`w-full h-12 bg-white hover:bg-neutral-200 text-black font-sans text-xs font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-2xl hover:scale-[1.02] active:scale-[0.98] rounded-none ${
                  !hasSavedGame ? 'border-2 border-white' : ''
                }`}
              >
                <Lucide.FilePlus className="w-3.5 h-3.5 text-black" />
                Начать игру
              </button>

              {/* RULES BUTTON */}
              <button 
                onClick={() => {
                  gameAudio.playClick();
                  setShowRules(true);
                }}
                className="w-full h-10 border border-dashed border-white/5 hover:border-white/20 text-white/40 hover:text-white/60 font-mono text-[9px] uppercase tracking-wider transition-all rounded-none"
              >
                Как играть? [Рапорт]
              </button>
            </div>

            {/* Sound controls footer block */}
            <div className="w-full border-t border-white/5 pt-4 flex items-center justify-between">
              <span className="font-mono text-[8px] uppercase text-white/30 tracking-wider">ЗВУК В ИГРЕ:</span>
              <button
                onClick={() => { gameAudio.playClick(); setSoundEnabled(!soundEnabled); }}
                className="flex items-center gap-1.5 px-3 py-1 border border-white/10 hover:bg-white/5 text-[9px] font-mono uppercase text-white/50 hover:text-white transition-all rounded-none"
              >
                {soundEnabled ? (
                  <>
                    <Lucide.Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Включен</span>
                  </>
                ) : (
                  <>
                    <Lucide.VolumeX className="w-3.5 h-3.5 text-white/30" />
                    <span>Выключен</span>
                  </>
                )}
              </button>
            </div>

          </div>
        )}
      </div>

      {/* Footer information */}
      <div className="w-full text-center flex justify-between items-center text-[8px] font-mono text-white/20 px-4 mt-4 z-10">
        <span className="tracking-widest">ВЕРСИЯ: СИНТЕТИЧЕСКИЙ НУАР 2.0</span>
        <span className="tracking-widest">РАЗРАБОТАНО КЛИЕНТОМ: КОТ МИДНАЙТ © 2026</span>
      </div>
    </div>
  );
}
