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

  // Dynamic Campaign detection helpers
  const getCampaignTheme = (): string => {
    const textToScan = STORY_CHAPTERS_DATA.map(ch => (ch.title + ' ' + ch.description)).join(' ').toLowerCase();
    if (textToScan.includes('шелковая маска') || textToScan.includes('шелков')) return 'ШЕЛКОВАЯ МАСКА';
    if (textToScan.includes('синдикат тумана') || textToScan.includes('туман')) return 'СИНДИКАТ ТУМАНА';
    return 'РУБИНОВЫЙ КОГОТЬ';
  };

  const activeTheme = getCampaignTheme();

  const getCampaignVillain = () => {
    if (activeTheme === 'ШЕЛКОВАЯ МАСКА') {
      return {
        name: 'Шпион «Граф»',
        status: 'ГЛАВНЫЙ ПОДОЗРЕВАЕМЫЙ',
        desc: '«Таинственный международный агент, похитивший чертежи супероружия Великобритании. Миднайт нашел его тайные шифры под ковром.»'
      };
    }
    if (activeTheme === 'СИНДИКАТ ТУМАНА') {
      return {
        name: 'Джек «Семь Хвостов»',
        status: 'ГЛАВНЫЙ ПОДОЗРЕВАЕМЫЙ',
        desc: '«Главарь шайки контрабандистов Ист-Энда. Пронырливый и коварный, он держит в страхе весь порт Лондона. Все улики ведут в его логово.»'
      };
    }
    return {
      name: 'Барон Альфред фон Кроу',
      status: 'ГЛАВНЫЙ ПОДОЗРЕВАЕМЫЙ',
      desc: '«Влиятельный аристократ и меценат. Барт нашел следы его тайных визитов в резиденцию лорда и зашифрованные ордера на складские грузы. Вся полиция на ушах!»'
    };
  };

  const getCampaignRelics = () => {
    if (activeTheme === 'ШЕЛКОВАЯ МАСКА') {
      return [
        {
          id: 'relic_1',
          name: 'Цилиндр и Маска «Графа»',
          chapterNum: 1,
          iconName: 'Smile',
          desc: '«Шелковая маска с серебряной вышивкой, найденная в архивах министерства. Оставлена лазутчиком во время ночного налета.»',
          imageDesc: 'Маска пахнет дорогим одеколоном...'
        },
        {
          id: 'relic_2',
          name: 'Секретный Шифр Ллойда',
          chapterNum: 2,
          iconName: 'Lock',
          desc: '«Кодовая таблица с набором символов, спрятанная в двойном дне шкатулки. Помогает прочесть переписку шпионов.»',
          imageDesc: 'Символы на пергаменте мерцают...'
        },
        {
          id: 'relic_3',
          name: 'Миниатюрный Манометр',
          chapterNum: 3,
          iconName: 'Watch',
          desc: '«Прибор с разбитым стеклом, регулирующий подачу пара в экспрессе. Был сорван, чтобы пустить поезд под откос!»',
          imageDesc: 'Стрелка заклинила на критической отметке...'
        }
      ];
    }
    if (activeTheme === 'СИНДИКАТ ТУМАНА') {
      return [
        {
          id: 'relic_1',
          name: 'Часы соверена Джека',
          chapterNum: 1,
          iconName: 'Watch',
          desc: '«Серебряные карманные часы с выгравированным якорем и семью надрезами на крышке. Свидетельствуют об участии Джека.»',
          imageDesc: 'Стрелки остановились на времени отлива...'
        },
        {
          id: 'relic_2',
          name: 'Контрабандный Гроссбух',
          chapterNum: 2,
          iconName: 'BookOpen',
          desc: '«Толстый кожаный блокнот со списком всех взяток портовым чиновникам Лондона. Ключевая улика обвинения!»',
          imageDesc: 'Чернила расплылись от соленой воды...'
        },
        {
          id: 'relic_3',
          name: 'Алмазная Пектораль',
          chapterNum: 3,
          iconName: 'Gem',
          desc: '«Похищенное украшение из королевской сокровищницы. Найдено в потайном сейфе казино за фальшивой панелью.»',
          imageDesc: 'Камни переливаются радужными искрами...'
        }
      ];
    }
    return [
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
  };

  const getCampaignDecors = () => {
    if (activeTheme === 'ШЕЛКОВАЯ МАСКА') {
      return {
        news: {
          title: '«Вестник Лондона»',
          desc: '«Дерзкое похищение века! Секретные чертежи супероружия Великобритании пропали бесследно. Главный подозреваемый — иностранный шпион по кличке "Граф". Премьер-министр предлагает 300$ за поимку вора и возвращение чертежей. Дело поручено нашему бюро!»',
          short: '«...безопасность Империи под угрозой! Шпионский орден "Шелковая Маска" угрожает Короне. Ведется следствие...»'
        },
        map: {
          title: 'Схема Военного Архива',
          desc: '«План секретных переходов архива Военного министерства. Помогает проследить маршрут проникновения и побега неуловимого шпиона.»'
        },
        memo: {
          title: 'Заметка о Графе',
          desc: '«Алиби Графа трещит по швам. Он утверждает, что провел вечер в посольстве. Однако Миднайт уверяет: в углу взломанного архива отчетливо пахло его изысканным австрийским одеколоном. Шпион точно замешан!»'
        }
      };
    }
    if (activeTheme === 'СИНДИКАТ ТУМАНА') {
      return {
        news: {
          title: '«Вестник Лондона»',
          desc: '«Крупнейшее ограбление на Темзе! Королевские алмазы исчезли из сейфа ювелира в доках. Подозрения падают на шайку контрабандистов. Лорд-мэр предлагает 250$ за поимку главаря. Следствие ведут Ванс и Миднайт!»',
          short: '«...драгоценности Короны под угрозой! Контрабандная банда "Синдикат Тумана" грабит лавки Лондона. Идет обыск...»'
        },
        map: {
          title: 'Карта портовых каналов',
          desc: '«Фрагмент логистической карты причалов Ист-Энда. Потайные склады синдиката Джека обведены красным карандашом на пирсе.»'
        },
        memo: {
          title: 'Заметка о Джеке',
          desc: '«Алиби Джека "Семь Хвостов" опровергнуто. Он клянется, что удил рыбу в открытом море. Однако Миднайт нашел чешую редкой озерной рыбы прямо у взломанного сейфа. Лидер шайки точно врет!»'
        }
      };
    }
    return {
      news: {
        title: '«Вестник Лондона»',
        desc: '«Дерзкое похищение века! Синий Сапфир лорда Кэррингтона пропал бесследно. Подозрения падают на кошачий синдикат. Старый лорд предлагает 200$ за поимку вора и возвращение камня в резиденцию. Расследование поручено частному детективному агентству Барта!»',
        short: '«...сокровища Ее Величества под угрозой! Тайный орден «Рубиновый Коготь» угрожает спокойствию граждан. Ведется следствие...»'
      },
      map: {
        title: 'Карта устья Темзы: Склад №9',
        desc: '«Пыльный фрагмент навигационной карты лондонских доков. Подозрительные контейнеры синдиката были выгружены на Пирсе «Б» и перевезены на Склад №9. На карте от руки нарисован красный крест на перекрестке складского района.»'
      },
      memo: {
        title: 'Заметка о бароне Кроу',
        desc: '«Алиби барона фон Кроу трещит по швам. Он утверждает, что провел вечер похищения в Опере. Однако Миднайт уверяет: в углу взломанного кабинета лорда отчетливо пахло его излюбленным табаком "Английская Смесь #4". Этот аристократ точно замешан!»'
      }
    };
  };

  // Dynamic relics data mapped to all chapters in the active campaign
  const getChapterRelic = (index: number, chapter: Job) => {
    const campaignRelics = getCampaignRelics();
    if (index < campaignRelics.length) {
      return campaignRelics[index];
    }
    const backupIndex = (index - 3) % BACKUP_RELICS.length;
    const backup = BACKUP_RELICS[backupIndex];
    return {
      id: `relic_${index + 1}`,
      name: backup.name,
      chapterNum: index + 1,
      iconName: backup.iconName,
      desc: backup.desc,
      imageDesc: 'Ключевое вещественное доказательство по этому делу...'
    };
  };

  const BACKUP_RELICS = [
    { name: 'Латунная пуля', iconName: 'Flame', desc: '«Сплющенная пуля, извлеченная из дубовой панели. Калибр совпадает с наградным оружием подозреваемого.»' },
    { name: 'Обрывок шифрограммы', iconName: 'FileText', desc: '«Клочок обгоревшей бумаги с колонками цифр. Удалось разобрать координаты тайной встречи.»' },
    { name: 'Флакон с опиумом', iconName: 'Droplet', desc: '«Крошечный пузырек темного стекла со следами снотворного. Использовался для усыпления бдительности охраны.»' },
    { name: 'Золотая запонка', iconName: 'Sparkles', desc: '«Элегантная запонка с гравировкой в виде герба. Была найдена под ковром на месте преступления.»' },
    { name: 'Запятнанный платок', iconName: 'Scissors', desc: '«Батистовый платок с монограммой и следами угольной пыли. Преступник явно прятал лицо.»' },
    { name: 'Старинная отмычка', iconName: 'Key', desc: '«Профессиональный воровской инструмент с гравировкой лондонских трущоб. Взломал не один замок.»' },
    { name: 'Билет на экспресс', iconName: 'Ticket', desc: '«Использованный билет в купе первого класса. Временной штамп совпадает с моментом побега.»' },
    { name: 'Оторванная пуговица', iconName: 'Circle', desc: '«Металлическая пуговица от дорогого фрака. Найдена зацепившейся за оконную раму кабинета.»' },
  ];

  const decors = getCampaignDecors();

  // Prevent vertical scroll on document body while the Crime Board is open
  React.useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const N = STORY_CHAPTERS_DATA.length;

  // Predefined scattered, organic coordinates for up to 12 chapters and relics
  const CHAPTER_PRESETS = [
    { left: 8, top: 22, rot: -6 },   // Chapter 1 (Top-Left, shifted down)
    { left: 26, top: 46, rot: 5 },    // Chapter 2 (Middle-Left, shifted down)
    { left: 48, top: 18, rot: -3 },   // Chapter 3 (Top-Center, above suspect, shifted down)
    { left: 69, top: 38, rot: 6 },    // Chapter 4 (Middle-Right, shifted down)
    { left: 86, top: 24, rot: -5 },   // Chapter 5 (Top-Right, shifted down)
    { left: 7, top: 52, rot: 4 },    // Chapter 6 (Middle-Left-Lower)
    { left: 85, top: 54, rot: -6 },  // Chapter 7 (Middle-Right-Lower)
    { left: 14, top: 73, rot: 7 },   // Chapter 8 (Bottom-Left)
    { left: 33, top: 74, rot: -4 },  // Chapter 9 (Bottom-Left-Center)
    { left: 51, top: 75, rot: 5 },   // Chapter 10 (Bottom-Center)
    { left: 68, top: 73, rot: -7 },  // Chapter 11 (Bottom-Right-Center)
    { left: 86, top: 72, rot: 6 },   // Chapter 12 (Bottom-Right)
  ];

  const RELIC_PRESETS = [
    { left: 14, top: 32, rot: 8 },   // Relic 1 (Near Chapter 1, shifted down)
    { left: 33, top: 56, rot: -10 }, // Relic 2 (Near Chapter 2, shifted down)
    { left: 42, top: 28, rot: 5 },   // Relic 3 (Near Chapter 3, shifted down)
    { left: 62, top: 48, rot: -4 },  // Relic 4 (Near Chapter 4, shifted down)
    { left: 77, top: 32, rot: 7 },   // Relic 5 (Near Chapter 5, shifted down)
    { left: 17, top: 62, rot: -6 },  // Relic 6 (Near Chapter 6)
    { left: 75, top: 64, rot: 9 },   // Relic 7 (Near Chapter 7)
    { left: 20, top: 64, rot: -5 },  // Relic 8 (Near Chapter 8)
    { left: 41, top: 65, rot: 4 },   // Relic 9 (Near Chapter 9)
    { left: 61, top: 66, rot: -8 },  // Relic 10 (Near Chapter 10)
    { left: 78, top: 65, rot: 6 },   // Relic 11 (Near Chapter 11)
    { left: 88, top: 58, rot: -5 },  // Relic 12 (Near Chapter 12)
  ];

  const getChapterPos = (i: number) => {
    const cardWidthPercent = N <= 3 ? 12 : N <= 5 ? 10 : 8.5;
    
    // Distribute left positions evenly across [6%, 86%] to cover the full width
    let left = 6 + (i * 80) / Math.max(1, N - 1);
    
    // Add subtle pseudo-random organic offset so they don't look like a clinical spreadsheet grid
    left += (i * 13) % 5 - 2; // -2% to +2% offset
    
    // Spaced out alternate row heights utilizing both upper and lower halves of the board
    // Row 1 (Even index) is in the upper half: ~16% (above the suspect)
    // Row 2 (Odd index) is in the lower half: ~70% (below the suspect)
    // This spreads cards all over the board, completely eliminating the upper half crowding
    const top = (i % 2 === 0) 
      ? 16 + ((i * 7) % 3) 
      : 70 + ((i * 7) % 3);
      
    const rot = (i * 7) % 11 - 5; // -5 to +5 degrees rotation for physical photo card look

    return { 
      left, 
      top, 
      rot,
      cardWidthPercent,
      cx: left + cardWidthPercent / 2,
      cy: top + 10
    };
  };

  const getRelicPos = (i: number) => {
    const relicWidthPercent = N <= 3 ? 10 : N <= 5 ? 8 : 7;
    const chPos = getChapterPos(i);
    
    // Place relic between its chapter card and the central suspect card to form a beautiful flow
    // Top row chapter relics go slightly below (~34%)
    // Bottom row chapter relics go slightly above (~52%)
    const top = (i % 2 === 0)
      ? 34 + ((i * 5) % 4)
      : 52 + ((i * 5) % 4);
      
    // Shift relic horizontally slightly towards the center from the chapter card
    const shift = 6;
    const left = chPos.left + (chPos.left < 45 ? shift : -shift);
    const rot = (i * 9) % 13 - 6; // -6 to +6 degrees rotation

    return { 
      left, 
      top, 
      rot,
      relicWidthPercent,
      cx: left + relicWidthPercent / 2,
      cy: top + 9
    };
  };

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
    const villain = getCampaignVillain();
    
    if (totalCompleted === 0) {
      return {
        name: `Теневой Лидер (???)`,
        status: 'ЛИЧНОСТЬ НЕ УСТАНОВЛЕНА',
        desc: `«Неуловимый призрак, управляющий криминальной цепочкой дела «${activeTheme}». Все ниточки сходятся к нему, но у Барта пока слишком мало зацепок, чтобы сорвать маску.»`,
        isRevealed: false,
        isArrested: false
      };
    } else if (totalCompleted < STORY_CHAPTERS_DATA.length) {
      return {
        name: villain.name,
        status: 'ГЛАВНЫЙ ПОДОЗРЕВАЕМЫЙ',
        desc: villain.desc,
        isRevealed: true,
        isArrested: false
      };
    } else {
      return {
        name: villain.name,
        status: 'АРЕСТОВАН И ОБЕЗВРЕЖЕН',
        desc: `«Синдикат «${activeTheme}» разбит! Барт лично настиг злодея (${villain.name}) и передал Скотленд-Ярду. Дело закрыто с абсолютным успехом!»`,
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
      <div 
        style={{ 
          backgroundImage: "url('/src/img/Caseboard/Caseboard_bg.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
        className="relative w-full h-[550px] border-[10px] border-[#2c1d11] bg-[#1a110a] shadow-inner overflow-hidden flex flex-col justify-between"
      >
        {/* Cork pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#100a06_1.5px,transparent_1.5px)] [background-size:12px_12px] opacity-20 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/80 pointer-events-none" />

        {/* Board Title Banner */}
        <div className="absolute top-3 left-4 right-4 flex justify-between items-center border-b border-white/5 pb-2 z-10 pointer-events-none select-none">
          <div className="flex items-center gap-1.5">
            <Lucide.Compass className="w-4 h-4 text-amber-500 animate-spin" style={{ animationDuration: '10s' }} />
            <h3 className="font-serif text-xs font-bold tracking-wide text-amber-200 uppercase">
              Следственная доска бюро
            </h3>
          </div>
          <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-red-500/70 font-bold animate-pulse">
            • ДЕЛО «{activeTheme}»
          </span>
        </div>

        {/* SVG INTERACTIVE RED THREADS */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <defs>
            <filter id="threadShadow" x="-10%" y="-10%" width="130%" height="130%">
              <feDropShadow dx="1" dy="3" stdDeviation="2" floodColor="#000000" floodOpacity="0.95" />
            </filter>
          </defs>

          {/* Sequential Chapter Threads */}
          {STORY_CHAPTERS_DATA.slice(0, -1).map((_, i) => {
            const ch1 = STORY_CHAPTERS_DATA[i];
            const pos1 = getChapterPos(i);
            const pos2 = getChapterPos(i + 1);
            const isCompleted = completedChapters.includes(i + 1) || ch1.completed;
            return (
              <line 
                key={`ch_conn_${i}`}
                x1={`${pos1.cx}%`} y1={`${pos1.cy}%`} 
                x2={`${pos2.cx}%`} y2={`${pos2.cy}%`} 
                stroke="#b91c1c" strokeWidth="3.5" 
                strokeDasharray={isCompleted ? "none" : "4 4"}
                opacity={isCompleted ? "0.95" : "0.45"}
                filter="url(#threadShadow)"
                className="transition-all duration-500"
              />
            );
          })}

          {/* Threads from Chapter to its Relic */}
          {STORY_CHAPTERS_DATA.map((chapter, i) => {
            const posCh = getChapterPos(i);
            const posRel = getRelicPos(i);
            const isUnlocked = completedChapters.includes(i + 1) || chapter.completed;
            if (!isUnlocked) return null;
            return (
              <line 
                key={`relic_conn_${i}`}
                x1={`${posCh.cx}%`} y1={`${posCh.cy}%`} 
                x2={`${posRel.cx}%`} y2={`${posRel.cy}%`} 
                stroke="#b91c1c" strokeWidth="2" 
                opacity="0.8"
                filter="url(#threadShadow)"
                className="transition-all duration-500"
              />
            );
          })}

          {/* Threads from Relic to Central Suspect */}
          {STORY_CHAPTERS_DATA.map((chapter, i) => {
            const posRel = getRelicPos(i);
            const isUnlocked = completedChapters.includes(i + 1) || chapter.completed;
            if (!isUnlocked) return null;
            return (
              <line 
                key={`suspect_conn_${i}`}
                x1={`${posRel.cx}%`} y1={`${posRel.cy}%`} 
                x2="50%" y2="42%" 
                stroke="#b91c1c" strokeWidth="2.2" 
                opacity="0.8"
                filter="url(#threadShadow)"
                className="transition-all duration-500"
              />
            );
          })}

          {/* Decorative newspaper / map connections */}
          <line 
            x1="9%" y1="40%" 
            x2={`${getChapterPos(0).cx}%`} y2={`${getChapterPos(0).cy}%`} 
            stroke="#7f1d1d" strokeWidth="2" opacity="0.45"
            filter="url(#threadShadow)"
          />
          <line 
            x1="91%" y1="40%" 
            x2={`${getChapterPos(STORY_CHAPTERS_DATA.length - 1).cx}%`} y2={`${getChapterPos(STORY_CHAPTERS_DATA.length - 1).cy}%`} 
            stroke="#7f1d1d" strokeWidth="2" opacity="0.45"
            filter="url(#threadShadow)"
          />

          {/* Sketch 1 (Wilhelm) Thread if completed */}
          {sketch1?.completed && (
            <line 
              x1="21%" y1="52%" 
              x2="50%" y2="42%" 
              stroke="#b91c1c" strokeWidth="2.5"
              filter="url(#threadShadow)"
              className="transition-all duration-500"
            />
          )}

          {/* Sketch 2 (Anchor) Thread if completed */}
          {sketch2?.completed && (
            <line 
              x1="37%" y1="57%" 
              x2="50%" y2="42%" 
              stroke="#b91c1c" strokeWidth="2.5"
              filter="url(#threadShadow)"
              className="transition-all duration-500"
            />
          )}

          {/* Sketch 3 (Saint-Clair) Thread if completed */}
          {sketch3?.completed && (
            <line 
              x1="77%" y1="52%" 
              x2="50%" y2="42%" 
              stroke="#b91c1c" strokeWidth="2.5"
              filter="url(#threadShadow)"
              className="transition-all duration-500"
            />
          )}
        </svg>

        {/* INTERACTIVE CORKBOARD ELEMENTS */}
        <div className="absolute inset-0 pt-10 pb-20 px-4 z-10 pointer-events-none">
          
          {/* DYNAMIC CHAPTER POLAROIDS */}
          {STORY_CHAPTERS_DATA.map((chapter, i) => {
            const { isCompleted, isLocked, lockReason } = getChapterStatus(i, chapter);
            const pos = getChapterPos(i);
            const cardWidth = pos.cardWidthPercent;
            
            // Scaled components to support N chapters beautifully
            const widthClass = cardWidth === 12 ? 'w-[105px]' : cardWidth === 10 ? 'w-[85px]' : 'w-[72px]';
            const paddingClass = cardWidth === 12 ? 'p-1.5 pb-2.5' : cardWidth === 10 ? 'p-1.5 pb-2' : 'p-1 pb-1.5';
            const iconSize = cardWidth === 12 ? 'w-5 h-5' : cardWidth === 10 ? 'w-4 h-4' : 'w-3.5 h-3.5';
            const fontSizeTitle = cardWidth === 12 ? 'text-[8.5px]' : cardWidth === 10 ? 'text-[7.5px]' : 'text-[6.5px]';
            const fontSizeDesc = cardWidth === 12 ? 'text-[7px]' : cardWidth === 10 ? 'text-[6px]' : 'text-[5px]';
            
            const getIcon = () => {
              if (i === 0) return <Lucide.Compass className={`${iconSize} text-amber-500 animate-pulse`} />;
              if (i === STORY_CHAPTERS_DATA.length - 1) return <Lucide.Wind className={`${iconSize} text-purple-400 animate-pulse`} />;
              const dLower = chapter.description.toLowerCase();
              if (dLower.includes('порт') || dLower.includes('пирс') || dLower.includes('склад') || dLower.includes('морск')) {
                return <Lucide.Anchor className={`${iconSize} text-sky-400 animate-pulse`} />;
              }
              return <Lucide.BookOpen className={`${iconSize} text-amber-500/80 animate-pulse`} />;
            };

            return (
              <div 
                key={chapter.id}
                style={{ left: `${pos.left}%`, top: `${pos.top}%`, transform: `rotate(${pos.rot}deg)` }}
                onClick={() => {
                  playClickSound();
                  setSelectedNode({
                    type: 'chapter',
                    id: chapter.id,
                    title: `Глава ${romanize(i + 1)}: ${chapter.title}`,
                    desc: chapter.description,
                    job: chapter
                  });
                }}
                className={`absolute ${widthClass} ${paddingClass} bg-[#fcf9f2] shadow-2xl border border-stone-200/50 cursor-pointer pointer-events-auto hover:scale-105 active:scale-98 hover:rotate-0 transition-all select-none flex flex-col justify-between ${
                  isCompleted ? 'opacity-90' : isLocked ? 'brightness-50' : ''
                }`}
              >
                {/* Red Pin decor */}
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-red-600 border border-stone-900 shadow-lg" />
                
                {/* Photo aspect box */}
                <div className="aspect-[4/3] w-full bg-[#1c1815] flex flex-col items-center justify-center border border-stone-300 relative text-white">
                  {isCompleted ? (
                    <div className="absolute inset-0 bg-emerald-950/20 flex items-center justify-center">
                      <span className="font-serif font-black text-emerald-500 text-[8px] tracking-wider border border-emerald-500 px-0.5 uppercase -rotate-12 select-none animate-pulse">
                        РАСКРЫТО ✓
                      </span>
                    </div>
                  ) : isLocked ? (
                    <div className="flex flex-col items-center">
                      <Lucide.Lock className={`${iconSize} text-stone-500`} />
                      {chapter.reputationRequired > 0 && (
                        <span className="text-[5.5px] font-mono uppercase text-red-400 font-bold leading-none mt-0.5">{chapter.reputationRequired}★</span>
                      )}
                    </div>
                  ) : (
                    getIcon()
                  )}
                  <span className="font-mono text-[5.5px] text-stone-400 absolute bottom-0.5 right-1">CASE_{i+1}</span>
                </div>

                <div className="mt-1 text-center leading-none">
                  <span className={`font-serif ${fontSizeTitle} font-black text-stone-950 block leading-tight`}>
                    Глава {romanize(i + 1)}
                  </span>
                  <p className={`font-serif italic ${fontSizeDesc} text-stone-500 leading-tight line-clamp-1 mt-0.5`}>
                    {chapter.title}
                  </p>
                </div>
              </div>
            );
          })}

          {/* POLAROID NODE: CENTRAL SUSPECT (VILLAIN) */}
          <div 
            style={{ left: '50%', top: '32%', transform: 'translate(-50%, 0)' }}
            onClick={() => {
              playClickSound();
              setSelectedNode({
                type: 'suspect',
                id: 'suspect_baron',
                title: suspect.name,
                desc: suspect.desc
              });
            }}
            className={`absolute w-[125px] bg-[#efe9dc] p-2 pb-3 shadow-2xl cursor-pointer pointer-events-auto hover:scale-105 active:scale-98 hover:rotate-1 transition-all select-none flex flex-col justify-between ${
              suspect.isArrested ? 'border-emerald-800 border-2' : 'border border-amber-900/40'
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
                  <div className="w-full h-full bg-[radial-gradient(circle_at_center,transparent_30%,#110e0c_80%)] flex items-center justify-center">
                    <Lucide.User className="w-12 h-12 text-stone-600" />
                  </div>
                </>
              ) : suspect.isRevealed ? (
                <div className="w-full h-full bg-[radial-gradient(circle_at_center,transparent_20%,#110e0c_70%)] flex flex-col items-center justify-center p-2 text-center">
                  <Lucide.ShieldCheck className="w-8 h-8 text-amber-500 animate-pulse mb-1 mx-auto" />
                  <span className="text-[7.5px] font-mono text-center text-amber-400 leading-tight uppercase font-bold">{suspect.name}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-2">
                  <Lucide.UserX className="w-9 h-9 text-stone-700 animate-pulse" />
                  <span className="font-serif text-[14px] text-stone-600 font-bold select-none animate-pulse">?</span>
                </div>
              )}
              <span className="font-mono text-[6px] font-bold text-stone-500 absolute bottom-1 left-2">TARGET_ID: {activeTheme === 'РУБИНОВЫЙ КОГОТЬ' ? 'KROW_A' : activeTheme === 'ШЕЛКОВАЯ МАСКА' ? 'GRAF_X' : 'JACK_7'}</span>
            </div>

            <div className="mt-1.5 text-center leading-none">
              <span className="font-mono text-[7px] text-red-500 font-bold block uppercase tracking-wider">
                {suspect.status}
              </span>
              <span className="font-serif text-[8.5px] font-black text-stone-900 block leading-tight mt-0.5">
                {suspect.name}
              </span>
            </div>
          </div>

          {/* DECORATIVE ELEMENT 1: NEWSPAPER CLIPPING */}
          <div 
            style={{ left: '3%', top: '28%' }}
            onClick={() => {
              playClickSound();
              setSelectedNode({
                type: 'note',
                id: 'news_clipping',
                title: decors.news.title,
                desc: decors.news.desc
              });
            }}
            className="absolute w-[115px] bg-[#eae5d8] border border-stone-300 p-2 text-stone-800 shadow-xl cursor-pointer pointer-events-auto hover:scale-105 active:scale-98 transition-all rotate-3 flex flex-col gap-1"
          >
            <div className="absolute -top-1 left-4 w-2 h-2 rounded-full bg-stone-500/80 shadow" />
            <span className="font-serif text-[7.5px] text-stone-900 font-black border-b border-stone-400 pb-0.5 uppercase tracking-wide leading-none block">
              Вестник Лондона
            </span>
            <span className="font-mono text-[5.5px] text-stone-500 block leading-none">9 ИЮЛЯ 1896</span>
            <p className="font-serif italic text-[7.5px] leading-snug text-stone-700 line-clamp-3">
              {decors.news.short}
            </p>
          </div>

          {/* DECORATIVE ELEMENT 2: PORT LOGISTICS MAP SECTION */}
          <div 
            style={{ right: '3%', top: '27%' }}
            onClick={() => {
              playClickSound();
              setSelectedNode({
                type: 'note',
                id: 'dock_map',
                title: decors.map.title,
                desc: decors.map.desc
              });
            }}
            className="absolute w-[110px] bg-[#dcd2bb] border border-amber-950/20 p-2 text-stone-800 shadow-xl cursor-pointer pointer-events-auto hover:scale-105 active:scale-98 transition-all -rotate-3 flex flex-col gap-1.5"
          >
            <div className="absolute -top-1 right-5 w-2 h-2 rounded-full bg-[#1d4ed8] shadow" />
            <div className="w-full h-10 bg-[#beaf91] border border-stone-400/40 relative flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 border border-dashed border-red-500/30 m-1.5 flex items-center justify-center">
                <span className="text-red-600 font-black text-sm select-none">❌</span>
              </div>
              <span className="font-mono text-[5.5px] text-stone-600 absolute top-1 left-1 font-bold">GRID_09</span>
            </div>
            <span className="font-serif text-[7.5px] font-bold text-center text-stone-900 block leading-tight">
              {decors.map.title}
            </span>
          </div>

          {/* DECORATIVE ELEMENT 3: STICKY MEMO NOTE */}
          <div 
            style={{ left: '29%', top: '48%' }}
            onClick={() => {
              playClickSound();
              setSelectedNode({
                type: 'note',
                id: 'note_alibi',
                title: decors.memo.title,
                desc: decors.memo.desc
              });
            }}
            className="absolute w-[80px] bg-amber-200/90 border border-amber-300 p-1.5 text-amber-950 shadow-md cursor-pointer pointer-events-auto hover:scale-105 active:scale-98 transition-all -rotate-6"
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-red-600/80 shadow" />
            <span className="font-sans text-[6px] uppercase tracking-widest text-amber-900 font-black block border-b border-amber-800/10 pb-0.5 mb-1 text-center">
              ЗАМЕТКА БАРТУ
            </span>
            <p className="font-serif italic text-[7.5px] leading-tight text-amber-900">
              {decors.memo.desc.length > 55 ? `${decors.memo.desc.substring(1, 55)}...` : decors.memo.desc}
            </p>
          </div>

          {/* COMPLETED SKETCHES POLAROIDS ON THE BOARD */}
          {sketch1?.completed && (
            <div 
              style={{ left: '16%', top: '45%', zIndex: 30 }}
              onClick={() => {
                playClickSound();
                setSelectedNode({
                  type: 'suspect',
                  id: 'sketch_1_revealed',
                  title: sketch1.name,
                  desc: `«Опознанный сообщник синдиката. Миссис Виггинс помогла составить этот точный фоторобот. Благодаря вашей работе его влияние нейтрализовано, а банда Шляпника разгромлена!»`
                });
              }}
              className="absolute w-[90px] bg-[#fcf9f2] p-1.5 pb-2 shadow-2xl border border-stone-200/50 cursor-pointer pointer-events-auto hover:scale-105 active:scale-98 hover:rotate-1 transition-all rotate-2 select-none flex flex-col justify-between"
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
              style={{ left: '32%', top: '50%', zIndex: 30 }}
              onClick={() => {
                playClickSound();
                setSelectedNode({
                  type: 'suspect',
                  id: 'sketch_2_revealed',
                  title: sketch2.name,
                  desc: `«Опознанный сообщник у причала — Морской Волк «Якорь». Помог получить наводки на тайные грузы, снизив стоимость поиска улик во всем городе!»`
                });
              }}
              className="absolute w-[90px] bg-[#fcf9f2] p-1.5 pb-2 shadow-2xl border border-stone-200/50 cursor-pointer pointer-events-auto hover:scale-105 active:scale-98 hover:-rotate-1 transition-all -rotate-3 select-none flex flex-col justify-between"
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
              style={{ right: '18%', top: '45%', zIndex: 30 }}
              onClick={() => {
                playClickSound();
                setSelectedNode({
                  type: 'suspect',
                  id: 'sketch_3_revealed',
                  title: sketch3.name,
                  desc: `«Опознанный организатор саботажа — Барон Сен-Клер. Полностью раскрыт перед взлетом дирижабля! Скотленд-Ярд выплатил огромную госпремию за предотвращение крушения!»`
                });
              }}
              className="absolute w-[90px] bg-[#fcf9f2] p-1.5 pb-2 shadow-2xl border border-stone-200/50 cursor-pointer pointer-events-auto hover:scale-105 active:scale-98 hover:rotate-1 transition-all rotate-2 select-none flex flex-col justify-between"
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

          {/* DYNAMIC RELICS FOUND AND PINNED ON THE BOARD */}
          {STORY_CHAPTERS_DATA.map((chapter, i) => {
            const isUnlocked = completedChapters.includes(i + 1) || chapter.completed;
            if (!isUnlocked) return null; // Only show relics we have found!
            
            const relic = getChapterRelic(i, chapter);
            const pos = getRelicPos(i);
            const relicWidth = pos.relicWidthPercent;
            
            // Dynamic scale class helpers
            const widthClass = relicWidth === 10 ? 'w-[92px]' : relicWidth === 8 ? 'w-[75px]' : 'w-[64px]';
            const paddingClass = relicWidth === 10 ? 'p-1.5 pb-2' : 'p-1 pb-1.5';
            const iconSize = relicWidth === 10 ? 'w-4.5 h-4.5' : 'w-3.5 h-3.5';
            const fontSizeName = relicWidth === 10 ? 'text-[7.5px]' : 'text-[6.5px]';
            
            const Icon = (Lucide as any)[relic.iconName] || Lucide.Sparkles;

            return (
              <div 
                key={relic.id}
                style={{ left: `${pos.left}%`, top: `${pos.top}%`, transform: `rotate(${pos.rot}deg)` }}
                onClick={() => {
                  playClickSound();
                  setSelectedNode({
                    type: 'relic',
                    id: relic.id,
                    title: relic.name,
                    desc: relic.desc,
                    relicName: relic.name
                  });
                }}
                className={`absolute ${widthClass} ${paddingClass} bg-[#fdfaf4] shadow-2xl border border-sky-300/30 cursor-pointer pointer-events-auto hover:scale-105 active:scale-98 transition-all select-none flex flex-col justify-between`}
              >
                {/* Blue Pin decor */}
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-[#0284c7] border border-stone-900 shadow-md" />
                
                {/* Photo Aspect box representing found relic */}
                <div className="aspect-square w-full bg-[#09151f] flex flex-col items-center justify-center border border-[#38bdf8]/20 relative text-[#38bdf8] overflow-hidden">
                  <div className="absolute inset-0.5 border border-[#38bdf8]/5 pointer-events-none" />
                  <Icon className={`${iconSize} animate-pulse`} style={{ animationDuration: '4s' }} />
                  <div className="absolute top-0.5 right-1 font-mono text-[4.5px] text-sky-400 font-bold uppercase bg-[#09151f]/80 px-0.5">EVIDENCE</div>
                </div>

                <div className="mt-1 text-center leading-none">
                  <span className={`font-serif ${fontSizeName} font-bold text-stone-900 block truncate`}>
                    {relic.name}
                  </span>
                  <span className="font-mono text-[5px] text-sky-600 uppercase font-black block mt-0.5">
                    УЛИКА {romanize(i + 1)}
                  </span>
                </div>
              </div>
            );
          })}

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
            {STORY_CHAPTERS_DATA.map((chapter, index) => {
              const isUnlocked = completedChapters.includes(index + 1) || chapter.completed;
              const relic = getChapterRelic(index, chapter);
              const Icon = (Lucide as any)[relic.iconName] || Lucide.Sparkles;
              const slotSize = N <= 3 ? 'w-11 h-11' : N <= 5 ? 'w-9 h-9' : 'w-8 h-8';
              const iconSize = N <= 3 ? 'w-5 h-5' : N <= 5 ? 'w-4 h-4' : 'w-3.5 h-3.5';

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
                  className={`${slotSize} border transition-all flex flex-col items-center justify-center relative ${
                    isUnlocked 
                      ? 'border-[#0ea5e9]/40 bg-[#0c4a6e]/10 hover:border-[#0ea5e9] hover:bg-[#0c4a6e]/20 text-[#38bdf8] shadow-[0_0_12px_rgba(14,165,233,0.15)] hover:shadow-[0_0_18px_rgba(14,165,233,0.3)] cursor-pointer group' 
                      : 'border-white/5 bg-black/40 text-white/10 cursor-not-allowed'
                  }`}
                  title={isUnlocked ? `${relic.name} (Раскрыто)` : 'Заблокировано (Раскройте соответствующую главу)'}
                >
                  <div className="absolute inset-1 border border-white/5 pointer-events-none" />
                  
                  {isUnlocked ? (
                    <Icon className={`${iconSize} animate-pulse`} style={{ animationDuration: '4s' }} />
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
            <span className="text-emerald-400 font-bold text-[9px]">{completedChapters.length} / {STORY_CHAPTERS_DATA.length}</span>
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
