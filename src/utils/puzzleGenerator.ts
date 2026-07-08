/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Clue, ObjectId, ObjectState, GameState, GameLog, RoomInfo, StoryState, EconomyState } from '../types';

export const ALL_CLUES: Clue[] = [
  {
    id: 'clue_poison',
    name: 'Флакон с ядом',
    description: 'Флакон с черепом и надписью «Цианид». Небольшой осадок на дне пахнет горьким миндалем.',
    icon: 'Skull',
    findingMessage: 'Кот выкатил откуда-то маленький темный флакон. Барт восклицает: «Ого! Яд! Значит, жертву отравили... Или это просто средство от клопов? Надо понюхать... Ой, в глазах темнеет!»'
  },
  {
    id: 'clue_letter',
    name: 'Обрывок записки',
    description: 'Обугленный клочок бумаги со словами «...в полночь у старого причала. Не опаздывай, иначе...»',
    icon: 'FileText',
    findingMessage: 'Кот достал из щели обгоревший лист. Барт читает: «Тайная встреча! Мой детективный нюх подсказывает, что тут пахнет заговором. Или это просто счет за прачечную?»'
  },
  {
    id: 'clue_watch',
    name: 'Золотые часы',
    description: 'Дорогие карманные часы с треснувшим стеклом, застывшие ровно на 23:14.',
    icon: 'Watch',
    findingMessage: 'Под грудой хлама обнаружились золотые часы. Барт задумчиво трет подбородок: «Часы остановились на 23:14. Это либо время преступления, либо у владельца просто кончился завод... Ах да, они же золотые!»'
  },
  {
    id: 'clue_ledger',
    name: 'Шифрованный блокнот',
    description: 'Записная книжка в кожаном переплете со списками швейцарских счетов и шифром «Цезарь».',
    icon: 'BookOpen',
    findingMessage: 'Кот выудил из потайного места блокнот. Барт щурится: «Тайные коды и миллионные счета! Наверняка здесь зашифрован заговор мирового масштаба. Или список покупок на неделю...»'
  },
  {
    id: 'clue_handkerchief',
    name: 'Шелковый платок',
    description: 'Батистовый платок с монограммой «В.А.» и следами дорогой помады цвета темной вишни.',
    icon: 'Sparkles',
    findingMessage: 'Кот вытащил из щели дамский платок. Барт вдыхает аромат: «Пахнет дорогим парфюмом и... опасностью. Хм, монограмма "В.А.". Возможно, это Вильгельм Артурович, или Великий Альфред, или... Василиса Алибабаевна?»'
  },
  {
    id: 'clue_feather',
    name: 'Черное перо',
    description: 'Крупное черное перо редкой птицы, слегка испачканное машинным маслом.',
    icon: 'Feather',
    findingMessage: 'Кот играет с черным пером. Барт берет его в руки: «Хм... Воронье перо. Знак тайного общества, или убийца — птица? Нет, птицы не умеют держать револьвер. Хотя надо проверить алиби местного попугая!»'
  },
  {
    id: 'clue_glasses',
    name: 'Треснувшие очки',
    description: 'Очки в тонкой роговой оправе с одной разбитой линзой.',
    icon: 'Eye',
    findingMessage: 'Под ковром нашлись треснувшие очки! Барт щурится через разбитое стекло: «Ого, очки в роговой оправе! Убийца явно потерял зрение в пылу борьбы! Либо преступник — близорукий интеллектуал, либо... просто любитель читать в темноте!»'
  },
  {
    id: 'clue_matchbox',
    name: 'Спичечный коробок',
    description: 'Коробок из элитного джаз-клуба «Синяя Нота» с нацарапанным адресом на обороте.',
    icon: 'Flame',
    findingMessage: 'Кот Midnight скинул с полки коробок спичек. Барт поднимает его: «Джаз-клуб "Синяя Нота"! И адрес на обороте! Какое злачное место... Придется провести там секретное расследование сегодня ночью. Исключительно ради дела!»'
  },
  {
    id: 'clue_cufflink',
    name: 'Серебряная запонка',
    description: 'Дорогая запонка в виде змеи с крошечным изумрудным глазом.',
    icon: 'Sparkles',
    findingMessage: 'Midnight откопал блестящую штучку! Барт восторженно рассматривает её: «Серебряная запонка с изумрудным глазом! Изысканный вкус. Преступник явно принадлежит к высшему обществу! Или просто украл её у кого-то... например, у меня?! Ох нет, мои на месте»'
  },
  {
    id: 'clue_cigarette',
    name: 'Окурок сигары',
    description: 'Окурок редкой гаванской сигары с золотым фирменным ободком.',
    icon: 'Flame',
    findingMessage: 'Кот Midnight лапой выкатил окурок из угла. Барт кашляет от запаха: «Премиальная гаванская сигара! Убийца — богач или пижон. Ну или тот, кто любит донашивать чужие окурки. Но мы запишем это как след миллионера!»'
  },
  {
    id: 'clue_ticket',
    name: 'Театральный билет',
    description: 'Билет в ложу на оперу «Кармен», датированный сегодняшним числом.',
    icon: 'Ticket',
    findingMessage: 'В мусорке нашелся билет в оперу! Барт восклицает: «Ложа на Кармен! На сегодняшнее число! Наш подозреваемый — театрал и эстет! Либо он пытался обеспечить себе алиби. Жаль, опера уже началась, а у нас тут труп!»'
  }
];

export const ROOM_TEMPLATES: RoomInfo[] = [
  {
    id: 'room_antique',
    name: 'Кабинет антиквара',
    caseName: 'Дело №48: «Проклятие золотого скарабея»',
    caseIntro: '«Запах старой бумаги и сухого чая висел в воздухе. Антиквар лежал ничком на своем роскошном ковре, а под его креслом копошились тени. Нам нужны три улики, чтобы во всем разобраться!»',
    wallColor: 'bg-[#0f0e0c]',
    accentBorder: 'border-amber-950/40',
    tintStyle: 'amber-tint',
    objectNames: {
      bookshelf: 'Древние фолианты',
      desk: 'Стол коллекционера',
      rug: 'Потертый персидский ковер',
      safe: 'Сейф с секретом',
      lamp: 'Бронзовая лампа',
      trashcan: 'Медная корзина',
      painting: 'Старинный натюрморт',
      fishbowl: 'Пыльный круглый аквариум'
    },
    objectDescriptions: {
      bookshelf: 'Высокие полки забиты алхимическими трактатами и старинными картами.',
      desk: 'Дубовый стол с потайными ящиками. Изрисован странными символами.',
      rug: 'Тяжелый ковер ручной работы. Под ним явно спрятан какой-то тайник.',
      safe: 'Тяжелый сейф, обитый кованым железом. На дверце красуется кодовый диск.',
      lamp: 'Старая масляная лампа. Отбрасывает тусклый янтарный свет на стены.',
      trashcan: 'Корзина для ненужных бумаг и старых писем антиквара.',
      painting: 'Потемневшая от времени картина с изображением золотого жука.',
      fishbowl: 'Заросший водорослями круглый аквариум с мутной водой.'
    }
  },
  {
    id: 'room_ballerina',
    name: 'Гримерная балерины',
    caseName: 'Дело №57: «Последнее танго в багровых тонах»',
    caseIntro: '«В воздухе все еще пахло пудрой и дорогими духами, смешанными со сладким ароматом яда. Прима исчезла прямо перед премьерой, оставив лишь ворох улик...»',
    wallColor: 'bg-[#120a0d]',
    accentBorder: 'border-rose-950/40',
    tintStyle: 'rose-tint',
    objectNames: {
      bookshelf: 'Полка с пьесами',
      desk: 'Туалетный столик',
      rug: 'Мягкий пушистый коврик',
      safe: 'Музыкальная шкатулка',
      lamp: 'Торшер с бахромой',
      trashcan: 'Корзина с розами',
      painting: 'Портрет балерины',
      fishbowl: 'Хрустальная ваза с лилией'
    },
    objectDescriptions: {
      bookshelf: 'Сборники Шекспира, балетные либретто и куча старых любовных писем.',
      desk: 'Столик, заваленный пудрой, театральным гримом и флаконами.',
      rug: 'Розовый пушистый коврик, на котором кот очень любит точить когти.',
      safe: 'Небольшой запертый сундучок с трехзначным кодовым диском.',
      lamp: 'Торшер под розовым шелковым абажуром, дающий мягкий интимный свет.',
      trashcan: 'Корзина, наполненная увядшими розами и разорванными записками.',
      painting: 'Большая картина, изображающая балерину в танце на фоне заката.',
      fishbowl: 'Большая ваза, наполненная водой с лепестками роз и одинокой рыбкой.'
    }
  },
  {
    id: 'room_banker',
    name: 'Кабинет банкира',
    caseName: 'Дело №34: «Крах на золотой бирже»',
    caseIntro: '«Дождь хлестал по стеклу кабинета на 12-м этаже. Банкир заперся изнутри, но три миллиона долларов испарились из его сейфа, оставив лишь холодный пепел...»',
    wallColor: 'bg-[#080d0d]',
    accentBorder: 'border-emerald-950/40',
    tintStyle: 'emerald-tint',
    objectNames: {
      bookshelf: 'Стеллаж с отчетами',
      desk: 'Стол из красного дерева',
      rug: 'Строгий шерстяной ковер',
      safe: 'Стальной сейф «Сан-Галли»',
      lamp: 'Изумрудная лампа',
      trashcan: 'Металлическое ведро',
      painting: 'Индустриальный пейзаж',
      fishbowl: 'Офисный аквариум'
    },
    objectDescriptions: {
      bookshelf: 'Тяжелые папки с надписями "Аудит", "Налоги" и закрытыми архивами.',
      desk: 'Массивный стол со столешницей из зеленого сукна. Здесь велись крупные сделки.',
      rug: 'Аккуратный дорогой ковер с геометрическим орнаментом.',
      safe: 'Огромный несгораемый шкаф с кодовым механическим замком.',
      lamp: 'Знаменитая зеленая настольная лампа банкира. Свет яркий и деловой.',
      trashcan: 'Ведро, забитое скомканными финансовыми графиками и порванными акциями.',
      painting: 'Картина с изображением дымящих фабричных труб и поездов начала века.',
      fishbowl: 'Высокий современный аквариум со сложным фильтром и неоновыми рыбками.'
    }
  },
  {
    id: 'room_captain',
    name: 'Каюта на «Левиафане»',
    caseName: 'Дело №19: «Штормовой секрет капитана»',
    caseIntro: '«Корабль скрипел на волнах, словно раненый зверь. Капитан ушел на палубу два часа назад и не вернулся, оставив судовой сейф запертым. Время разгадать его штормовые тайны!»',
    wallColor: 'bg-[#060a10]',
    accentBorder: 'border-blue-950/40',
    tintStyle: 'blue-tint',
    objectNames: {
      bookshelf: 'Судовая библиотека',
      desk: 'Капитанское бюро',
      rug: 'Грубый джутовый коврик',
      safe: 'Судовой сейф на засовах',
      lamp: 'Штормовой керосиновый фонарь',
      trashcan: 'Бочонок из-под пороха',
      painting: 'Морское сражение',
      fishbowl: 'Морской круглый аквариум'
    },
    objectDescriptions: {
      bookshelf: 'Навигационные карты, лоции океанов и потрепанные вахтенные журналы.',
      desk: 'Письменный привинченный стол с компасом, секстантом и следами соли.',
      rug: 'Просоленный грубый коврик из кокосового волокна.',
      safe: 'Встроенный в переборку сейф с мощными засовами и трехзначным кодом.',
      lamp: 'Качающийся подвесной фонарь, отбрасывающий длинные тени по каюте.',
      trashcan: 'Старый бочонок, приспособленный под мусор и обрезки снастей.',
      painting: 'Драматический холст, изображающий гибель фрегата в грозу.',
      fishbowl: 'Маленький аквариум с соленой водой, живым кораллом и морским коньком.'
    }
  }
];

// Prescripted story templates
export const STORY_TEMPLATES: Record<number, RoomInfo> = {
  1: {
    id: 'story_chapter_1',
    name: 'Кабинет лорда Харингтона',
    caseName: 'Глава I: «Тайна Сапфирового Глаза»',
    caseIntro: '«Лорд Харингтон в панике! Его фамильное сокровище — синий Сапфировый Глаз — было похищено из сейфа в его запертом кабинете. Нам нужно отыскать три улики, чтобы выследить вора!»',
    wallColor: 'bg-[#0f0e0c]',
    accentBorder: 'border-amber-950/50',
    tintStyle: 'amber-tint',
    objectNames: {
      bookshelf: 'Книжная библиотека лорда',
      desk: 'Лакированный стол лорда',
      rug: 'Плотный ворсистый ковер',
      safe: 'Кованый сейф лорда',
      lamp: 'Кабинетный торшер',
      trashcan: 'Узорная урна для бумаг',
      painting: 'Фамильный портрет предка',
      fishbowl: 'Декоративная ваза с карпами'
    },
    objectDescriptions: {
      bookshelf: 'Книги по генеалогии и истории дворянства Англии.',
      desk: 'Письменный прибор из серебра и сургуч. Здесь лежали ценные бумаги.',
      rug: 'Огромный персидский ковер. Кажется, его недавно двигали.',
      safe: 'Стальной сейф, из которого загадочно пропал знаменитый сапфир.',
      lamp: 'Величественный напольный торшер с золотыми кистями.',
      trashcan: 'Урна с обрывками гербовой бумаги и писем.',
      painting: 'Массивный портрет первого лорда Харингтона. Взгляд предка следит за вами.',
      fishbowl: 'Аквариум с золотистыми карпами и блестящими ракушками.'
    }
  },
  2: {
    id: 'story_chapter_2',
    name: 'Мрачные причалы и Склад №9',
    caseName: 'Глава II: «След портовых контрабандистов»',
    caseIntro: '«Улики ведут в туманные портовые доки. Нам нужно обыскать как сырой пирс снаружи, так и мрачное нутро Склада №9! Перемещайся между пирсом и складом, чтобы собрать три улики!»',
    wallColor: 'bg-[#060a10]',
    accentBorder: 'border-blue-950/50',
    tintStyle: 'blue-tint',
    // We will partition objects: 
    // Pier: rug (мокрый пирс), trashcan (бочка с рыбой), painting (спасательный круг), fishbowl (ведро с наживкой)
    // Warehouse: bookshelf (грузовой стеллаж), desk (стол смотрителя), safe (сейф контрабандистов), lamp (керосинка)
    objectNames: {
      bookshelf: 'Стеллаж с ящиками [Внутри склада]',
      desk: 'Стол портового смотрителя [Внутри склада]',
      rug: 'Доски туманного пирса [На пирсе]',
      safe: 'Сейф банды контрабандистов [Внутри склада]',
      lamp: 'Штормовая керосинка [Внутри склада]',
      trashcan: 'Бочка с тухлой сельдью [На пирсе]',
      painting: 'Старый спасательный круг [На пирсе]',
      fishbowl: 'Ведро с наживкой [На пирсе]'
    },
    objectDescriptions: {
      bookshelf: 'Деревянный стеллаж, забитый ящиками с контрабандным чаем и табаком.',
      desk: 'Шаткиий столик смотрителя, залитый дешевым ромом.',
      rug: 'Мокрые, скользкие деревянные доски пирса у черной качающейся воды.',
      safe: 'Потрепанный металлический сейф с кодовым механическим лимбом.',
      lamp: 'Висящий на цепи закопченный фонарь, раскачивающийся от порывов ветра.',
      trashcan: 'Старая бочка, полная рыбных костей, мусора и мокрых газет.',
      painting: 'Висящий на стене склада облезлый спасательный круг.',
      fishbowl: 'Жестяное ведро с болотной водой и сонной наживкой для ловли крабов.'
    }
  },
  3: {
    id: 'story_chapter_3',
    name: 'Люкс-салон дирижабля «Эклипс»',
    caseName: 'Глава III: «Заговор в облаках»',
    caseIntro: '«Мы летим над грозовым фронтом на борту роскошного дирижабля "Эклипс". Похититель находится среди VIP-гостей салона. Собери последние три улики, чтобы разоблачить его до посадки!»',
    wallColor: 'bg-[#120a0d]',
    accentBorder: 'border-rose-950/50',
    tintStyle: 'rose-tint',
    objectNames: {
      bookshelf: 'Полка с багажом и саквояжами',
      desk: 'Лакированный столик для коктейлей',
      rug: 'Шелковый ковер с эмблемой',
      safe: 'Сейф капитана дирижабля',
      lamp: 'Изящное настенное бра',
      trashcan: 'Хрустальная пепельница на стойке',
      painting: 'Иллюминатор в облаках',
      fishbowl: 'Бокал со льдом и бренди'
    },
    objectDescriptions: {
      bookshelf: 'Кожаные чемоданы богатых пассажиров и полка с меню полета.',
      desk: 'Маленький полированный столик, пахнущий дорогим алкоголем и заговором.',
      rug: 'Мягчайший шелковый ковер с эмблемой флота дирижаблей.',
      safe: 'Встроенный в роскошную перегородку сейф с трехзначным кодовым диском.',
      lamp: 'Матовое бра в стиле ар-деко, бросающее мягкий перламутровый свет.',
      trashcan: 'Серебряная напольная пепельница с окурками элитных сигар.',
      painting: 'Круглое окно-иллюминатор, сквозь которое видны сверкающие молнии.',
      fishbowl: 'Хрустальный бокал с подтаявшим льдом, на дне которого что-то блестит...'
    }
  }
};

// Helper to shuffle an array
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateNewGame(
  mode: 'sandbox' | 'story' = 'sandbox',
  chapter: number = 1,
  currentCash: number = 150
): GameState {
  // 1. Generate safe code
  const codeDigits = [
    Math.floor(Math.random() * 9) + 1,
    Math.floor(Math.random() * 9) + 1,
    Math.floor(Math.random() * 9) + 1
  ];
  const safeCode = codeDigits.join('');

  // 2. Select appropriate room info
  let roomInfo: RoomInfo;
  if (mode === 'story') {
    roomInfo = STORY_TEMPLATES[chapter] || STORY_TEMPLATES[1];
  } else {
    roomInfo = ROOM_TEMPLATES[Math.floor(Math.random() * ROOM_TEMPLATES.length)];
  }

  // 3. Choose 3 clues
  const selectedClues = shuffleArray(ALL_CLUES).slice(0, 3);
  const [clue1, clue2, clue3] = selectedClues;

  // If story mode chapter 1, customize clues to make it fully narrative-themed
  if (mode === 'story' && chapter === 1) {
    clue1.name = 'Чертеж вентиляции';
    clue1.description = 'Схема воздуховодов поместья лорда. Один из каналов ведет прямо в хранилище...';
    clue2.name = 'Золотая шпилька';
    clue2.description = 'Шпилька для волос с монограммой лорда. Очевидно, ею вскрывали замок стола.';
    clue3.name = 'Сапфировый Глаз!';
    clue3.description = 'Огромный, завораживающий драгоценный синий сапфир. Верните его лорду!';
    clue3.findingMessage = 'Кот Миднайт выудил из сейфа умопомрачительный синий камень! Барт Ванс вопит от восторга: «Клянусь моей шляпой, это Сапфировый Глаз лорда! Мы раскрыли это дело! Миднайт, ты гений! (Но рапорт все равно пишу я)»';
  } else if (mode === 'story' && chapter === 2) {
    clue1.name = 'Свежая портовая рыба';
    clue1.description = 'Сельдь со следами бензина. Кажется, ею прикармливали сторожевого пса у ворот склада.';
    clue2.name = 'Накладная контрабанды';
    clue2.description = 'Документ, подтверждающий доставку партии ящиков на дирижабль «Эклипс» сегодня вечером.';
    clue3.name = 'Билет на дирижабль';
    clue3.description = 'Пассажирский билет первого класса на дирижабль «Эклипс», выписанный на вымышленное имя.';
    clue3.findingMessage = 'Миднайт достает из сейфа билет первого класса! Барт ликует: «Билет на дирижабль "Эклипс"! Преступник бежит из города по воздуху! Мы должны перехватить его! Скорее на борт!»';
  } else if (mode === 'story' && chapter === 3) {
    clue1.name = 'План взрыва дирижабля';
    clue1.description = 'Секретная записка с планом поджога горючего баллона дирижабля прямо в облаках для заметания следов!';
    clue2.name = 'Тайный шифр сообщников';
    clue2.description = 'Блокнот с кодами радиста. Преступник координировал свои действия с подельниками на земле.';
    clue3.name = 'Флакон с сонным зельем';
    clue3.description = 'Опустошенный пузырек, использованный для усыпления лорда и охраны.';
    clue3.findingMessage = 'Кот сбрасывает флакон со снотворным. Барт кричит: «Вот оно! Главная улика! Капитан, арестуйте вон того господина в шляпе-котелке! Дело о Сапфировом Глазе закрыто!»';
  }

  // 4. Position and size generation with collision-free slots
  const floorCandidates = ['bookshelf', 'desk', 'safe', 'lamp', 'trashcan'] as ObjectId[];
  const shuffledFloor = shuffleArray(floorCandidates);
  
  // Find an item for the left side (must be narrow, desk is 26% wide)
  const leftIndex = shuffledFloor.findIndex(id => id !== 'desk');
  const leftId = shuffledFloor[leftIndex];
  shuffledFloor.splice(leftIndex, 1); // remove from list
  
  // Assign left position
  const leftW = leftId === 'bookshelf' ? 15 : leftId === 'safe' ? 12 : 8;
  const leftH = leftId === 'bookshelf' ? 68 : leftId === 'safe' ? 26 : leftId === 'lamp' ? 52 : 14;
  const leftX = 2;
  const leftY = 84 - leftH;
  
  const floorPositions: Record<ObjectId, { x: number; y: number; w: number; h: number }> = {} as any;
  floorPositions[leftId] = { x: leftX, y: leftY, w: leftW, h: leftH };
  
  // Assign right positions sequentially
  let currentX = 34; // start after detective zone [18, 33]
  const padding = 3.5; // padding between items
  
  for (const id of shuffledFloor) {
    const w = id === 'desk' ? 26 : id === 'bookshelf' ? 15 : id === 'safe' ? 12 : 8;
    const h = id === 'desk' ? 32 : id === 'bookshelf' ? 68 : id === 'safe' ? 26 : id === 'lamp' ? 52 : 14;
    
    let finalX = currentX;
    if (finalX + w > 99) {
      finalX = 99 - w;
    }
    
    floorPositions[id] = {
      x: finalX,
      y: 84 - h,
      w,
      h
    };
    
    currentX = finalX + w + padding;
  }
  
  // Painting (wall object) - hangs on left or right wall, avoiding center window [35, 65]
  const paintingOnLeft = Math.random() > 0.5;
  const paintingW = 12;
  const paintingH = 15;
  const paintingX = paintingOnLeft ? 4 : 80;
  const paintingY = 16;
  
  // Rug (flat floor object) - centered
  const rugX = 31;
  const rugY = 82;
  const rugW = 38;
  const rugH = 14;
  
  // Fishbowl (sits on desk)
  const deskPos = floorPositions['desk'];
  const fishbowlW = 8;
  const fishbowlH = 8;
  const fishbowlX = deskPos.x + 3; // placed on desk left
  const fishbowlY = deskPos.y - fishbowlH; // sitting on desk surface

  // Define initial objects with custom names & descriptions from room template and dynamic positions
  const objects: Record<ObjectId, ObjectState> = {
    bookshelf: {
      id: 'bookshelf',
      name: roomInfo.objectNames.bookshelf,
      icon: 'Library',
      description: roomInfo.objectDescriptions.bookshelf,
      isInteractive: true,
      stateDescription: 'Книги стоят ровно. Кот может прыгнуть наверх или сбросить пару томов.',
      booksFallen: false,
      heldClueId: null,
      heldItemId: null,
      x: floorPositions.bookshelf.x,
      y: floorPositions.bookshelf.y,
      w: floorPositions.bookshelf.w,
      h: floorPositions.bookshelf.h,
      shape: 'vertical-rect'
    },
    desk: {
      id: 'desk',
      name: roomInfo.objectNames.desk,
      icon: 'SquareDot',
      description: roomInfo.objectDescriptions.desk,
      isInteractive: true,
      stateDescription: 'Выдвижной ящик плотно заперт на латунный замок.',
      locked: true,
      heldClueId: null,
      heldItemId: null,
      x: floorPositions.desk.x,
      y: floorPositions.desk.y,
      w: floorPositions.desk.w,
      h: floorPositions.desk.h,
      shape: 'horizontal-rect'
    },
    rug: {
      id: 'rug',
      name: roomInfo.objectNames.rug,
      icon: 'Grid',
      description: roomInfo.objectDescriptions.rug,
      isInteractive: true,
      stateDescription: 'Лежит ровно, но кажется, под ним что-то топорщится.',
      toggled: false,
      heldClueId: null,
      heldItemId: null,
      x: rugX,
      y: rugY,
      w: rugW,
      h: rugH,
      shape: 'oval'
    },
    safe: {
      id: 'safe',
      name: roomInfo.objectNames.safe,
      icon: 'Lock',
      description: roomInfo.objectDescriptions.safe,
      isInteractive: true,
      stateDescription: 'Заперт. Нужна трехзначная кодовая комбинация.',
      locked: true,
      heldClueId: null,
      heldItemId: null,
      x: floorPositions.safe.x,
      y: floorPositions.safe.y,
      w: floorPositions.safe.w,
      h: floorPositions.safe.h,
      shape: 'rect'
    },
    lamp: {
      id: 'lamp',
      name: roomInfo.objectNames.lamp,
      icon: 'Lightbulb',
      description: roomInfo.objectDescriptions.lamp,
      isInteractive: true,
      stateDescription: 'Торшер выключен. Отбрасывает длинные зловещие тени.',
      toggled: false,
      tipped: false,
      heldClueId: null,
      heldItemId: null,
      x: floorPositions.lamp.x,
      y: floorPositions.lamp.y,
      w: floorPositions.lamp.w,
      h: floorPositions.lamp.h,
      shape: 'vertical-rect'
    },
    trashcan: {
      id: 'trashcan',
      name: roomInfo.objectNames.trashcan,
      icon: 'Trash2',
      description: roomInfo.objectDescriptions.trashcan,
      isInteractive: true,
      stateDescription: 'Стоит в углу. Выглядит очень неустойчиво — так и просит перевернуть его.',
      tipped: false,
      heldClueId: null,
      heldItemId: null,
      x: floorPositions.trashcan.x,
      y: floorPositions.trashcan.y,
      w: floorPositions.trashcan.w,
      h: floorPositions.trashcan.h,
      shape: 'vertical-rect'
    },
    painting: {
      id: 'painting',
      name: roomInfo.objectNames.painting,
      icon: 'Image',
      description: roomInfo.objectDescriptions.painting,
      isInteractive: true,
      stateDescription: 'Висит ровно, скрывая часть стены.',
      toggled: false,
      heldClueId: null,
      heldItemId: null,
      x: paintingX,
      y: paintingY,
      w: paintingW,
      h: paintingH,
      shape: 'rect'
    },
    fishbowl: {
      id: 'fishbowl',
      name: roomInfo.objectNames.fishbowl,
      icon: 'Waves',
      description: roomInfo.objectDescriptions.fishbowl,
      isInteractive: true,
      stateDescription: 'Вода тихонько плещется. На самом дне блестит что-то золотистое.',
      tipped: false,
      heldClueId: null,
      heldItemId: null,
      x: fishbowlX,
      y: fishbowlY,
      w: fishbowlW,
      h: fishbowlH,
      shape: 'circle'
    }
  };

  // --- procedural dependency assembly ---
  const directSpotPool: ObjectId[] = ['rug', 'trashcan', 'painting'];
  const indirectSpotPool: ObjectId[] = ['bookshelf', 'fishbowl'];

  const shuffledDirect = shuffleArray(directSpotPool);
  const shuffledIndirect = shuffleArray(indirectSpotPool);

  // Clue 1: Simple / Direct placement
  const easySpot = shuffledDirect[0];
  objects[easySpot].heldClueId = clue1.id;

  // Clue 2: Medium (Requires key_brass to open desk drawer)
  objects['desk'].heldClueId = clue2.id;
  
  // Key spot: hide brass key in one of the indirect spots (bookshelf or fishbowl)
  const keySpot = shuffledIndirect[0];
  objects[keySpot].heldItemId = 'key_brass';

  // Clue 3: Hard (Requires Safe Code to open Safe)
  objects['safe'].heldClueId = clue3.id;

  // Hide the safe code
  const safeCodeMethods = ['lamp_light', 'painting_back', 'desk_drawer'];
  const chosenMethod = safeCodeMethods[Math.floor(Math.random() * safeCodeMethods.length)];

  const solvedSteps = [];

  if (chosenMethod === 'lamp_light') {
    objects['lamp'].description += ' На абажуре изнутри видны следы когтей.';
    solvedSteps.push('safe_code_via_lamp');
  } else if (chosenMethod === 'painting_back') {
    objects['painting'].description += ' Кажется, за рамой торчит клочок пергамента.';
    solvedSteps.push('safe_code_via_painting');
  } else {
    objects['desk'].heldItemId = 'safe_code_note';
    solvedSteps.push('safe_code_via_desk');
  }

  // Dummy catnip placement
  const dummySpots = [shuffledDirect[1], shuffledDirect[2], shuffledIndirect[1]].filter(s => s !== keySpot && s !== easySpot);
  if (dummySpots.length > 0) {
    objects[dummySpots[0]].heldItemId = 'catnip';
  }

  // Set up initial logs
  const logs: GameLog[] = [
    {
      id: 'log_1',
      sender: 'system',
      text: `${roomInfo.caseName}. Место действия: ${roomInfo.name}.`,
      timestamp: new Date().toLocaleTimeString()
    },
    {
      id: 'log_2',
      sender: 'detective',
      text: roomInfo.caseIntro,
      timestamp: new Date().toLocaleTimeString()
    },
    {
      id: 'log_3',
      sender: 'cat',
      text: '«Мяу. Этот двуногий в плаще опять пытается играть в Шерлока. Будет забавно, если я снова найду все улики, пока он чешет затылок. Пора приниматься за кошачью работу!»',
      timestamp: new Date().toLocaleTimeString()
    }
  ];

  // Set up story state
  const storyState: StoryState = {
    mode,
    chapter,
    currentLocationId: 'pier', // Chapter 2 starts at the pier
    completedChapters: []
  };

  // Set up economy state
  const economy: EconomyState = {
    cash: currentCash,
    recentExpenses: []
  };

  return {
    currentClues: selectedClues,
    foundClueIds: [],
    inventory: [],
    objects,
    safeCode,
    activeDialogue: {
      sender: 'detective',
      text: roomInfo.caseIntro,
      mood: 'serious'
    },
    catPosition: 'center',
    catAction: 'idle',
    isMuted: true,
    gameStatus: 'intro',
    logs,
    solvedSteps,
    roomInfo,
    economy,
    storyState
  };
}

export const DUMMY_ITEMS = {
  key_brass: {
    id: 'key_brass',
    name: 'Латунный ключ',
    description: 'Маленький резной ключ с напылением. Идеально подходит для выдвижного ящика стола.',
    icon: 'Key'
  },
  safe_code_note: {
    id: 'safe_code_note',
    name: 'Записка с кодом',
    description: 'Клочок бумаги с поспешно нацарапанными тремя цифрами.',
    icon: 'FileCode'
  },
  catnip: {
    id: 'catnip',
    name: 'Элитная кошачья мята',
    description: 'О! Сушеная мята! Трава богов. Делает кота временно счастливым, а его глаза — сверкающими.',
    icon: 'Leaf'
  }
};
