/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import * as Lucide from 'lucide-react';
import { gameAudio } from '../utils/AudioEngine';

interface IntroScreenProps {
  onStartGame: (enableAudio: boolean, mode: 'sandbox' | 'story', chapter: number) => void;
}

export default function IntroScreen({ onStartGame }: IntroScreenProps) {
  const [showRules, setShowRules] = useState(false);
  const [activeTab, setActiveTab] = useState<'story' | 'sandbox'>('story');
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const handleStart = () => {
    onStartGame(soundEnabled, activeTab, activeTab === 'story' ? selectedChapter : 1);
  };

  const storyChapters = [
    {
      number: 1,
      title: 'Глава I: Офис Лорда',
      caseName: 'Похищение Сапфирового Глаза',
      headline: '«ГОЛОС МЕГАПОЛИСА: Дерзкая кража в резиденции Кэррингтон! Лорд в ярости, полиция бессильна. Детектив Барт Ванс берется за расследование века!»',
      desc: 'Выясните, как вор проник в сейф. Найдите зацепки и тайники в роскошном кабинете лорда.',
      unlocked: true,
      icon: 'Home'
    },
    {
      number: 2,
      title: 'Глава II: Причал и Склад №9',
      caseName: 'Контрабанда в полночь',
      headline: '«ВЕЧЕРНИЙ ПРОТОКОЛ: След похищенного камня ведет в затуманенные доки. Свидетели заметили подозрительную активность у Склада №9!»',
      desc: 'Сыщик Ванс и кот Миднайт пробираются на охраняемый пирс. Особая механика: перемещайтесь между пирсом и складом, чтобы раскрыть контрабандную схему!',
      unlocked: true,
      icon: 'Anchor'
    },
    {
      number: 3,
      title: 'Глава III: Дирижабль «Эклипс»',
      caseName: 'Финал в небесах',
      headline: '«КРИМИНАЛЬНАЯ ХРОНИКА: Элитный лайнер "Эклипс" покидает город. Похититель на борту, готовый уничтожить улики прямо во время грозы в облаках!»',
      desc: 'Заключительное расследование на высоте 3000 метров во время бури. Предотвратите диверсию и верните Сапфировый Глаз!',
      unlocked: true,
      icon: 'Wind'
    }
  ];

  return (
    <div className="absolute inset-0 bg-[#070707] flex flex-col justify-between p-6 sm:p-10 select-none z-40 overflow-y-auto custom-scrollbar">
      {/* Decorative elegant frame overlay with double-border effect */}
      <div className="absolute inset-4 sm:inset-6 border-double border-4 border-white/10 pointer-events-none" />
      <div className="absolute inset-6 sm:inset-8 border border-white/5 pointer-events-none" />

      {/* Header Title with massive elegant display serif typography */}
      <div className="w-full text-center mt-4 z-10">
        <span className="font-sans text-[10px] uppercase tracking-[0.5em] text-white/40 block mb-2">
          НУАРНЫЙ ДЕТЕКТИВНЫЙ КВЕСТ
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl font-normal tracking-tight text-white flex flex-col leading-none">
          <span className="italic font-light">Детектив</span>
          <span className="font-bold uppercase text-3xl sm:text-4xl tracking-widest mt-1">Миднайт</span>
          <span className="text-white/40 font-serif text-xs sm:text-sm italic tracking-widest mt-2">
            и Дело о мокрой полуночи
          </span>
        </h1>
        <div className="w-12 h-[1px] bg-white/20 mx-auto mt-4" />
      </div>

      {/* Center content */}
      <div className="max-w-3xl w-full mx-auto my-4 flex-1 flex flex-col justify-center items-center gap-6 z-10">
        {!showRules ? (
          <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            {/* Left side: News Board / Settings (7 cols) */}
            <div className="md:col-span-8 flex flex-col border border-white/10 bg-black/60 p-5 sm:p-6 backdrop-blur-md">
              
              {/* Tab Selector */}
              <div className="flex border-b border-white/10 mb-4 pb-2 justify-between items-center">
                <div className="flex gap-4">
                  <button
                    onClick={() => { gameAudio.playClick(); setActiveTab('story'); }}
                    className={`font-serif text-sm tracking-wider pb-1 transition-all relative ${
                      activeTab === 'story' ? 'text-white font-bold' : 'text-white/40 hover:text-white/70'
                    }`}
                  >
                    Сюжетная кампания
                    {activeTab === 'story' && <div className="absolute bottom-0 inset-x-0 h-[2px] bg-white" />}
                  </button>
                  <button
                    onClick={() => { gameAudio.playClick(); setActiveTab('sandbox'); }}
                    className={`font-serif text-sm tracking-wider pb-1 transition-all relative ${
                      activeTab === 'sandbox' ? 'text-white font-bold' : 'text-white/40 hover:text-white/70'
                    }`}
                  >
                    Песочница
                    {activeTab === 'sandbox' && <div className="absolute bottom-0 inset-x-0 h-[2px] bg-white" />}
                  </button>
                </div>
                <span className="font-mono text-[8px] uppercase tracking-widest text-white/30">ВЫБОР ДЕЛА</span>
              </div>

              {/* Story mode details */}
              {activeTab === 'story' ? (
                <div className="flex-1 flex flex-col gap-4">
                  <div className="grid grid-cols-3 gap-2">
                    {storyChapters.map(ch => (
                      <button
                        key={ch.number}
                        onClick={() => { gameAudio.playClick(); setSelectedChapter(ch.number); }}
                        className={`p-2.5 text-left border transition-all flex flex-col justify-between h-24 rounded-none ${
                          selectedChapter === ch.number
                            ? 'border-white bg-white/5 text-white'
                            : 'border-white/10 bg-black/40 text-white/40 hover:border-white/30 hover:text-white/70'
                        }`}
                      >
                        <span className="font-mono text-[8px] uppercase block">ГЛАВА {ch.number}</span>
                        <div>
                          <div className="font-serif text-[10px] font-bold leading-tight line-clamp-1">{ch.title.split(': ')[1]}</div>
                          <span className="text-[7px] uppercase font-sans text-white/30 block mt-0.5">{ch.caseName}</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Selected chapter news headline */}
                  {selectedChapter && (
                    <div className="flex-1 border border-white/5 bg-[#0b0b0b] p-3 flex flex-col justify-between">
                      <div>
                        <div className="font-mono text-[8px] uppercase text-amber-500/80 tracking-widest mb-1">
                          ГАЗЕТНАЯ СВОДКА (Сюжетное превью)
                        </div>
                        <p className="font-serif italic text-xs leading-relaxed text-white/80 border-l border-white/20 pl-2.5 my-2">
                          {storyChapters[selectedChapter - 1].headline}
                        </p>
                        <p className="text-[10px] leading-relaxed text-white/50 font-sans mt-2">
                          {storyChapters[selectedChapter - 1].desc}
                        </p>
                      </div>
                      <div className="font-mono text-[7px] text-white/30 text-right uppercase tracking-widest pt-2 border-t border-white/5 mt-2">
                        Офицер Ванс & Кот Миднайт приступают к операции
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Sandbox mode details */
                <div className="flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="font-serif italic text-sm text-white/80 leading-relaxed">
                      «Большой город хранит миллионы тайн. Каждую ночь на пульт дежурного поступает новый вызов. Кого-то обокрали, кого-то заперли, у кого-то пропали фамильные драгоценности. Барт Ванс протирает очки, а я навостряю уши...»
                    </div>
                    <p className="text-[10px] leading-relaxed text-white/50 font-sans">
                      В Песочнице каждая игра генерируется полностью случайным образом! Игра будет выбирать одну из пяти уникальных атмосферных локаций (кабинет антиквара, гримерная примы, офис банкира, судовая каюта или каюта дирижабля) со своими наборами предметов, улик, паролей сейфа и комбинаций ключей. Полная свобода расследования.
                    </p>
                  </div>
                  <div className="border border-white/5 bg-[#0a0a0a] p-3 rounded-none font-mono text-[8px] space-y-0.5 text-white/30 mt-4">
                    <div>• Локация: Генерация случайной комнаты</div>
                    <div>• Улики: Случайный набор из 6 возможных зацепок</div>
                    <div>• Код сейфа: Случайные 3 цифры</div>
                    <div>• Интерактивность: Полностью процедурные взаимосвязи</div>
                  </div>
                </div>
              )}
            </div>

            {/* Right side: Launch Panel (4 cols) */}
            <div className="md:col-span-4 border border-white/10 bg-black/80 p-5 flex flex-col justify-between text-center">
              <div>
                <span className="font-mono text-[8px] uppercase tracking-widest text-white/40 block mb-3">СТАТУС ИГРОКА</span>
                <div className="w-12 h-12 rounded-full border border-white/10 bg-black flex items-center justify-center mx-auto mb-2">
                  <Lucide.ShieldCheck className="w-5 h-5 text-white/80" />
                </div>
                <div className="font-serif text-sm font-bold italic text-white leading-tight">Сыщик Барт Ванс</div>
                <span className="font-sans text-[8px] text-white/40 uppercase tracking-[0.2em] block mt-0.5 mb-4">лицензия №9082</span>
                
                <div className="border-t border-white/5 pt-3 text-left space-y-1.5 font-sans text-[9px] text-white/50 mb-4">
                  <div className="flex justify-between">
                    <span>Баланс:</span>
                    <span className="font-mono text-white">150 $</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Помощник:</span>
                    <span className="font-mono text-white">Кот Миднайт</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Расходы:</span>
                    <span className="font-mono text-white/30">табак, кофе, паштет</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 mt-auto">
                {/* Audio Option Switcher */}
                <div className="flex items-center justify-between border border-white/5 bg-black p-2 rounded-none">
                  <span className="font-mono text-[8px] uppercase text-white/40 tracking-wider">Звуковое сопровождение:</span>
                  <button
                    onClick={() => { gameAudio.playClick(); setSoundEnabled(!soundEnabled); }}
                    className="p-1 rounded hover:bg-white/5 transition-all"
                  >
                    {soundEnabled ? (
                      <Lucide.Volume2 className="w-4 h-4 text-white" />
                    ) : (
                      <Lucide.VolumeX className="w-4 h-4 text-white/30" />
                    )}
                  </button>
                </div>

                <button 
                  onClick={handleStart}
                  className="w-full h-12 bg-white hover:bg-neutral-200 text-black font-sans text-xs font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Lucide.Play className="w-3.5 h-3.5 fill-black" />
                  Начать расследование
                </button>

                <button 
                  onClick={() => {
                    gameAudio.playClick();
                    setShowRules(true);
                  }}
                  className="w-full h-9 border border-dashed border-white/5 hover:border-white/20 text-white/40 hover:text-white/60 font-mono text-[9px] uppercase tracking-wider transition-all"
                >
                  Как играть? [Инструкция]
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full border border-white/10 bg-black/60 p-6 sm:p-8 backdrop-blur-md font-sans max-w-2xl">
            <h2 className="font-serif text-xl font-bold italic text-white border-b border-white/10 pb-3 mb-5 tracking-wide flex justify-between items-center">
              <span>Рапорт об оперативных правилах</span>
              <span className="font-mono text-[9px] uppercase tracking-widest text-white/40 not-italic">СТАТЬЯ I // РАЗДЕЛ II</span>
            </h2>
            
            <ul className="text-xs text-white/80 space-y-3.5 list-none pl-0">
              <li className="flex items-start gap-2">
                <span className="text-white/30 font-mono mt-0.5">01 //</span>
                <span>
                  <strong className="text-white uppercase font-sans tracking-wider text-[10px] mr-1 block sm:inline">Ваша роль:</strong> Вы играете за кота <strong className="text-white font-serif italic">Миднайта</strong>. Детектив Барт Ванс думает, что расследование ведет он, но его умственные способности слегка... переоценены.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-white/30 font-mono mt-0.5">02 //</span>
                <span>
                  <strong className="text-white uppercase font-sans tracking-wider text-[10px] mr-1 block sm:inline">Задача:</strong> Найти ровно <strong className="text-white font-serif italic font-bold">3 скрытые улики</strong> на сцене преступления, чтобы доказать вину подозреваемого.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-white/30 font-mono mt-0.5">03 //</span>
                <span>
                  <strong className="text-white uppercase font-sans tracking-wider text-[10px] mr-1 block sm:inline">Взаимодействие:</strong> Нажимайте на предметы в комнате. Миднайт пойдет туда и совершит кошачьи шалости: сбросит книги, подерет ковер, перевернет мусорку или запрыгнет на шкаф.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-white/30 font-mono mt-0.5">04 //</span>
                <span>
                  <strong className="text-white uppercase font-sans tracking-wider text-[10px] mr-1 block sm:inline">Загадки и коды:</strong> Некоторые улики заперты! Ищите ключи в других вещах, светите лампой в темные углы или подглядывайте кодовые комбинации для сейфа.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-white/30 font-mono mt-0.5">05 //</span>
                <span>
                  <strong className="text-white uppercase font-sans tracking-wider text-[10px] mr-1 block sm:inline">Бюджет и экономика:</strong> Каждое раскрытое дело приносит вам солидное вознаграждение! Однако каждый день детективное бюро несет обязательные расходы на содержание кошачьего паштета, аренду офиса, закупку крепкого табака и порций кофе. Держите баланс выше нуля!
                </span>
              </li>
            </ul>

            <button 
              onClick={() => {
                gameAudio.playClick();
                setShowRules(false);
              }}
              className="mt-8 w-full h-11 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs font-sans uppercase tracking-[0.2em] border border-white/10 transition-all"
            >
              Вернуться назад
            </button>
          </div>
        )}
      </div>

      {/* Footer information */}
      <div className="w-full text-center flex justify-between items-center text-[9px] font-mono text-white/30 px-4 mt-4 z-10">
        <span className="tracking-widest">ВЕРСИЯ: СИНТЕТИЧЕСКИЙ НУАР 2.0</span>
        <span className="tracking-widest">РАЗРАБОТАНО КЛИЕНТОМ: КОТ МИДНАЙТ © 2026</span>
      </div>
    </div>
  );
}
