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
      "Сделка со Шляпником в силе. Спрячь вазу!  ",
      "Код от сейфа — за картиной. Жди покупателя",
      "Ночью увозим все. Не оставляй тут улики!  "
    ]
  },
  room_ballerina: {
    fullText: "Прима больше не станцует. Спрячь пуанту. Пусть все подозревают уборщика. Твоя доля ждет тебя на пирсе у старого кабака ночью!",
    rows: [
      "Прима больше не станцует. Спрячь пуанту.  ",
      "Пусть все подозревают уборщика. Твоя доля ",
      "ждет тебя на пирсе у старого кабака ночью!"
    ]
  },
  room_banker: {
    fullText: "Сверим счета. Пропавший вексель заперт тут. Код сейфа знают двое. Переведи все деньги. Избавься от этой дурацкой записки поскорее.",
    rows: [
      "Сверим счета. Пропавший вексель заперт тут",
      "Код сейфа знают двое. Переведи все деньги ",
      "Избавься от этой дурацкой записки поскорее"
    ]
  },
  room_captain: {
    fullText: "Капитан слеп. Тайник в бочке у причала! Ром и золото сдать Барону к полуночи ровно. Не забудь запереть трюм на железный ключ!",
    rows: [
      "Капитан слеп. Тайник в бочке у причала!   ",
      "Ром и золото сдать Барону к полуночи ровно",
      "Не забудь запереть трюм на железный ключ! "
    ]
  },
  fallback: {
    fullText: "Миднайт перевернул корзину с мусором здесь. Среди хлама найдена старая заначка воров! Забери монеты и продолжай осмотр комнаты!",
    rows: [
      "Миднайт перевернул корзину с мусором здесь",
      "Среди хлама найдена старая заначка воров! ",
      "Забери монеты и продолжай осмотр комнаты! "
    ]
  }
};

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
  const numStrips = 6;
  const charPerStrip = 7; // 42 / 6 = 7

  const pieces: TornNotePiece[] = [];

  for (let i = 0; i < numStrips; i++) {
    const textLines: string[] = [];
    for (let r = 0; r < 3; r++) {
      const rowText = template.rows[r];
      const start = i * charPerStrip;
      const end = start + charPerStrip;
      textLines.push(rowText.substring(start, end));
    }

    // Generate a random initial rotation (0, 90, 180, 270 degrees)
    // Avoid making it too frustrating, let's use 0, 90, 180, 270
    const rotations = [0, 90, 180, 270];
    const randomRotation = rotations[Math.floor(Math.random() * rotations.length)];

    pieces.push({
      id: `strip_${i}`,
      originalIndex: i,
      textLines,
      rotation: randomRotation,
      currentSlot: null // Starts in the tray
    });
  }

  // Shuffle the pieces before presenting them in the tray
  const shuffledPieces = shuffleArray(pieces);

  return {
    id: roomTemplateId,
    fullText: template.fullText,
    pieces: shuffledPieces,
    completed: false,
    rewardClaimed: false,
    clueIdToUnlock: heldClueId
  };
}
