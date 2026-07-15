/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TornNoteState, TornNotePiece } from '../types';

interface NoteTemplate {
  fullText: string;
  rows: string[]; // exactly 3 rows of 42 characters
}

const TEMPLATES: Record<string, NoteTemplate> = {
  room_antique: {
    fullText: "Сделка со Шляпником в силе. Спрячь вазу! Код от сейфа — за картиной. Жди покупателя. Ночью увозим все. Не оставляй тут улики!",
    rows: [
      "Сделка со Шляпником в силе. Спрячь вазу!",
      "Код от сейфа — за картиной. Жди покупателя",
      "Ночью увозим все. Не оставляй тут улики!"
    ]
  },
  room_ballerina: {
    fullText: "Прима больше не станцует. Спрячь пуанту. Пусть все подозревают уборщика. Твоя доля ждет тебя на пирсе у старого кабака ночью!",
    rows: [
      "Прима больше не станцует. Спрячь пуанту.",
      "Пусть все подозревают уборщика. Твоя доля",
      "ждет тебя на пирсе у старого кабака ночью!"
    ]
  },
  room_banker: {
    fullText: "Сверим счета. Пропавший вексель заперт тут. Код сейфа знают двое. Переведи все деньги. Избавься от этой дурацкой записки поскорее.",
    rows: [
      "Сверим счета. Пропавший вексель заперт тут",
      "Код сейфа знают двое. Переведи все деньги",
      "Избавься от этой дурацкой записки поскорее"
    ]
  },
  room_captain: {
    fullText: "Капитан слеп. Тайник в бочке у причала! Ром и золото сдать Барону к полуночи ровно. Не забудь запереть трюм на железный ключ!",
    rows: [
      "Капитан слеп. Тайник в бочке у причала!",
      "Ром и золото сдать Барону к полуночи ровно",
      "Не забудь запереть трюм на железный ключ!"
    ]
  },
  room_park: {
    fullText: "Встреча в парке у пруда в силе. Спрячь яд под скамьей. Старик не должен дожить до утра. Улики закопай в опавшей листве!",
    rows: [
      "Встреча в парке у пруда в силе. Спрячь яд",
      "Старик не должен дожить до утра. Опасно!",
      "Следы и улики закопай в опавшей листве!"
    ]
  },
  room_alleyway: {
    fullText: "Сделка в переулке. Оставь сумку в ящике у двери. Код от щитка в твоем кармане. Не свети фонарем и уходи через люк!",
    rows: [
      "Сделка в темном переулке. Оставь сумку!",
      "Код от щитка в твоем кармане. Не тупи!",
      "Не свети фонарем и уходи через люк тут!"
    ]
  },
  room_basement: {
    fullText: "Тайник в подвале за вентиляцией. Код от сундука — год основания дома. Лишние бутылки разбей, следы засыпь углем.",
    rows: [
      "Тайник в подвале за старой вентиляцией!",
      "Код от сундука — год основания дома тут.",
      "Лишнее разбей, а следы засыпь углем!"
    ]
  },
  room_attic: {
    fullText: "На чердаке среди коробок спрятана шкатулка. Код написан на зеркале. Письмо сожги в керосиновой лампе немедленно!",
    rows: [
      "На чердаке среди старых коробок шкатулка",
      "Код на зеркале. Письмо срочно сожги!",
      "Не забудь погасить керосиновую лампу!"
    ]
  },
  room_kitchen: {
    fullText: "Яд на кухне в шкафу со специями. Код от ледника — вес повара. Лишние кувшины разбей, следы смой соленой водой.",
    rows: [
      "Яд на кухне в шкафу со специями. Спеши!",
      "Код от ледника — вес повара. Не забудь!",
      "Лишние кувшины разбей, следы смой водой!"
    ]
  },
  room_garage: {
    fullText: "Детали в гараже. Сейф-инструментальщик заперт. Пропуск в ветоши. Бочку с маслом опрокинь, чтобы замести следы!",
    rows: [
      "Все детали в гараже. Сейф плотно заперт",
      "Пропуск спрятан в ветоши у бензобака!",
      "Масло опрокинь, чтобы замести все следы"
    ]
  },
  room_warehouse: {
    fullText: "Контрабанда на складе за коробками. Ключ-карта у смотрителя в столе. Документы в сейфе, код — номер накладной.",
    rows: [
      "Контрабанда на складе за коробками тут.",
      "Ключ-карта у смотрителя в столе. Спеши!",
      "Все бумаги в сейфе, код — номер накладной"
    ]
  },
  room_workshop: {
    fullText: "Чертежи в цеху за стеллажом деталей. Код от щитка на стене. Бочку с маслом пролей. Оборудование обесточь до утра!",
    rows: [
      "Чертежи в цеху за стеллажом деталей!",
      "Код от щитка на стене. Бочку пролей!",
      "Оборудование обесточь до утра! Быстрее!"
    ]
  },
  room_office: {
    fullText: "Досье в офисе в шкафу архива. Ключ в стакане с кофе. Код от сейфа — дата статьи. Доску расследований сожги!",
    rows: [
      "Досье в офисе в шкафу архива. Проверь!",
      "Ключ в стакане с кофе. Код — дата статьи",
      "Срочно сожги всю доску расследований!"
    ]
  },
  room_bar: {
    fullText: "Деньги в баре под кассой. Спрячь пиво. Ключ в пивном бокале. Код от кассы знает бармен. Голову оленя сними со стены.",
    rows: [
      "Все деньги в баре под кассой. Спрячь!",
      "Ключ в пивном бокале. Код знает бармен!",
      "Голову оленя срочно сними со стены!"
    ]
  },
  room_shop: {
    fullText: "Выручка в лавке в сейфе за прилавком. Ключ под ковриком в подсобке. Старую витрину разбей. Уходи через заднюю дверь!",
    rows: [
      "Выручка в лавке в сейфе за прилавком!",
      "Ключ под ковриком в подсобке у входа.",
      "Старую витрину разбей и беги поскорее!"
    ]
  },
  room_museum: {
    fullText: "Алмаз в музее в сейфе под картиной. Ключ у смотрителя в чаше с монетами. Сигнализацию отключи в щитке у ограждения.",
    rows: [
      "Алмаз в музее в сейфе под картиной!",
      "Ключ у смотрителя в чаше с монетами.",
      "Отключи сигнализацию в щитке поскорее!"
    ]
  },
  room_mansion: {
    fullText: "Завещание в особняке в стене за портретом. Шкатулка на столике заперта. Ключ под ковром. Люстры выключи, уходи!",
    rows: [
      "Завещание в особняке за портретом!",
      "Шкатулка на столике заперта. Ключ здесь",
      "Хрустальные люстры выключи и уходи!"
    ]
  },
  fallback: {
    fullText: "Миднайт перевернул корзину с мусором здесь. Среди хлама найдена старая заначка воров! Забери монеты и продолжай осмотр комнаты!",
    rows: [
      "Миднайт перевернул корзину с мусором здесь",
      "Среди хлама найдена старая заначка воров!",
      "Забери монеты и продолжай осмотр комнаты!"
    ]
  }
};

/**
 * Wraps text into lines of a given width
 */
function wrapTextToLines(text: string, numLines: number, lineWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if (currentLine.length === 0) {
      currentLine = word;
    } else if (currentLine.length + 1 + word.length <= lineWidth) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
      if (lines.length === numLines - 1) {
        break;
      }
    }
  }
  if (lines.length < numLines) {
    lines.push(currentLine);
  }

  // If there are remaining words, append them to the last line
  const lastIndex = lines.length - 1;
  if (lastIndex >= 0) {
    const remainingWordsIndex = words.indexOf(lines[lastIndex].split(" ")[0]);
    if (remainingWordsIndex !== -1) {
      const remainingText = words.slice(remainingWordsIndex).join(" ");
      lines[lastIndex] = remainingText;
    }
  }

  // Pad or truncate each line to exactly `lineWidth`
  const result: string[] = [];
  for (let i = 0; i < numLines; i++) {
    let line = lines[i] || "";
    if (line.length > lineWidth) {
      line = line.substring(0, lineWidth);
    } else {
      line = line.padEnd(lineWidth, " ");
    }
    result.push(line);
  }

  return result;
}

/**
 * Shuffles an array in place
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Initializes a torn note puzzle state for a given room
 */
export function initializeTornNote(roomTemplateId: string, heldClueId: string | null): TornNoteState {
  const template = TEMPLATES[roomTemplateId] || TEMPLATES.fallback;
  
  // Random configurations: 4, 6, 8, 9, 12 pieces
  const options = [
    { cols: 2, rows: 2, numPieces: 4, linesPerPiece: 3, charsPerPiece: 14 },
    { cols: 3, rows: 2, numPieces: 6, linesPerPiece: 3, charsPerPiece: 10 },
    { cols: 4, rows: 2, numPieces: 8, linesPerPiece: 3, charsPerPiece: 8 },
    { cols: 3, rows: 3, numPieces: 9, linesPerPiece: 2, charsPerPiece: 10 },
    { cols: 4, rows: 3, numPieces: 12, linesPerPiece: 2, charsPerPiece: 8 }
  ];
  const config = options[Math.floor(Math.random() * options.length)];
  const { cols, rows, linesPerPiece, charsPerPiece } = config;

  const totalLines = rows * linesPerPiece;
  const totalWidth = cols * charsPerPiece;

  const fullTextLines = wrapTextToLines(template.fullText, totalLines, totalWidth);

  const pieces: TornNotePiece[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const originalIndex = r * cols + c;
      const textLines: string[] = [];

      for (let l = 0; l < linesPerPiece; l++) {
        const lineIndex = r * linesPerPiece + l;
        const lineText = fullTextLines[lineIndex] || "";
        const start = c * charsPerPiece;
        const end = start + charsPerPiece;
        textLines.push(lineText.substring(start, end));
      }

      // Generate a random initial rotation (0, 90, 180, 270 degrees)
      const rotations = [0, 90, 180, 270];
      const randomRotation = rotations[Math.floor(Math.random() * rotations.length)];

      pieces.push({
        id: `piece_${originalIndex}`,
        originalIndex,
        textLines,
        rotation: randomRotation,
        currentSlot: null // Starts in the tray
      });
    }
  }

  // Shuffle the pieces before presenting them in the tray
  const shuffledPieces = shuffleArray(pieces);
  const fontStyle = Math.random() < 0.5 ? 'handwritten' : 'typewriter';

  return {
    id: roomTemplateId,
    fullText: template.fullText,
    pieces: shuffledPieces,
    completed: false,
    rewardClaimed: false,
    clueIdToUnlock: heldClueId,
    cols,
    rows,
    fontStyle
  };
}
