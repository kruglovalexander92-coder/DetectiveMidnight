/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Job, SuspectSketch } from '../types';

export function extractCaseTags(title: string, desc: string): string[] {
  const tags: string[] = [];
  const text = (title + ' ' + desc).toLowerCase();

  // Characters
  if (text.includes('бейкер') || text.includes('baker') || text.includes('пекар')) tags.push('мистер Бейкер');
  if (text.includes('балерин') || text.includes('лили') || text.includes('ballet') || text.includes('танец') || text.includes('гример')) tags.push('балерина Лили');
  if (text.includes('капитан') || text.includes('captain') || text.includes('морск') || text.includes('пират') || text.includes('якор')) tags.push('капитан Сильвер');
  if (text.includes('томас') || text.includes('проводник')) tags.push('проводник Томас');
  if (text.includes('кроу') || text.includes('барон')) tags.push('барон Кроу');
  if (text.includes('реми') || text.includes('крыс')) tags.push('крысенок Реми');

  // Locations
  if (text.includes('пекарн') || text.includes('bakery') || text.includes('булочн')) tags.push('пекарня Бэйкера');
  if (text.includes('порт') || text.includes('причал') || text.includes('доки') || text.includes('pier')) tags.push('лондонский порт');
  if (text.includes('склад') || text.includes('warehouse')) tags.push('заброшенный склад');
  if (text.includes('театр') || text.includes('опера')) tags.push('оперный театр');
  if (text.includes('особняк') || text.includes('mansion') || text.includes('кабинет')) tags.push('старый особняк');
  if (text.includes('сейф') || text.includes('банк') || text.includes('хранилищ')) tags.push('банк Ллойда');

  // Events / Items
  if (text.includes('крыс') || text.includes('рат') || text.includes('мышь') || text.includes('mouse')) tags.push('механические крысы');
  if (text.includes('мышелов') || text.includes('mousetrap')) tags.push('украденные мышеловок');
  if (text.includes('чертеж') || text.includes('план') || text.includes('blueprint')) tags.push('секретные чертежи');
  if (text.includes('рубин') || text.includes('драгоцен') || text.includes('камень') || text.includes('коготь')) tags.push('Рубиновый Коготь');
  if (text.includes('улик') || text.includes('зацепк') || text.includes('след')) tags.push('тайные улики');

  // Fallbacks if no tags matched
  if (tags.length === 0) {
    if (text.includes('краж') || text.includes('вор') || text.includes('украл')) {
      tags.push('дерзкая кража');
    } else if (text.includes('убийст') || text.includes('смерт') || text.includes('яд')) {
      tags.push('загадочное убийство');
    } else {
      tags.push('секретное расследование');
    }
  }

  // Max 3 unique tags
  return Array.from(new Set(tags)).slice(0, 3);
}

export interface FolderEvaluation {
  score: number;
  status: 'flop' | 'hit' | 'bestseller';
  rating: number;
  review: string;
  profit: number;
  allTags: string[];
}

export function evaluateCaseFolder(caseIds: string[], allJobs: Job[]): FolderEvaluation {
  const filedCases = allJobs.filter(j => caseIds.includes(j.id));
  
  // Collect all tags
  const tagCounts: Record<string, number> = {};
  filedCases.forEach(c => {
    const title = c.title || c.caseName || '';
    const desc = c.description || '';
    const tags = extractCaseTags(title, desc);
    tags.forEach(t => {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    });
  });

  const uniqueTags = Object.keys(tagCounts);
  const totalTagsCount = Object.values(tagCounts).reduce((a, b) => a + b, 0);

  // Calculate score
  let score = 30; // base score
  score += filedCases.length * 10; // +10 for each case

  let repeatingTagsCount = 0;
  uniqueTags.forEach(t => {
    if (tagCounts[t] > 1) {
      repeatingTagsCount++;
      score += (tagCounts[t] - 1) * 20; // +20 for each repetition
    }
  });

  score = Math.min(100, Math.max(0, score));

  // Determine status and rating
  let status: 'flop' | 'hit' | 'bestseller' = 'flop';
  let rating = 2;
  if (score >= 80) {
    status = 'bestseller';
    rating = 5;
  } else if (score >= 60) {
    status = 'hit';
    rating = 4;
  } else if (score >= 40) {
    status = 'hit';
    rating = 3;
  }

  // Generate review
  const repeatingTags = uniqueTags.filter(t => tagCounts[t] > 1);
  let review = '';
  if (repeatingTags.length > 0) {
    const mainTag = repeatingTags[0];
    review = `Критик Блайт пишет: «Сквозная сюжетная линия с участием темы "${mainTag}" связывает отдельные дела в единое полотно. Читатели сходят с ума, скупая тиражи этой удивительной папки!»`;
  } else {
    review = `Критик Блайт пожимает плечами: «Сюжеты в этой папке кажутся довольно разрозненными лоскутами. Мы не нашли общей интриги между делами, хотя слог автора хорош.»`;
  }

  const profit = rating * 60 + filedCases.length * 35;

  return {
    score,
    status,
    rating,
    review,
    profit,
    allTags: uniqueTags
  };
}

export function generateContextualSketchForJob(job: Job): SuspectSketch {
  const hairs: ('bald' | 'short' | 'curly' | 'tophat')[] = ['bald', 'short', 'curly', 'tophat'];
  const eyes: ('glasses' | 'angry' | 'normal' | 'monocle')[] = ['glasses', 'angry', 'normal', 'monocle'];
  const mustaches: ('none' | 'gentleman' | 'beard' | 'pirate')[] = ['none', 'gentleman', 'beard', 'pirate'];
  const skins: ('pale' | 'tanned' | 'fair')[] = ['pale', 'tanned', 'fair'];

  const targetHair = hairs[Math.floor(Math.random() * hairs.length)];
  const targetEyes = eyes[Math.floor(Math.random() * eyes.length)];
  const targetMustache = mustaches[Math.floor(Math.random() * mustaches.length)];
  const targetSkin = skins[Math.floor(Math.random() * skins.length)];

  const hairDesc = {
    bald: 'абсолютно ЛЫСЫЙ',
    short: 'с КОРОТКОЙ стрижкой',
    curly: 'с КУДРЯВЫМИ волосами',
    tophat: 'в высоком фетровом ЦИЛИНДРЕ'
  }[targetHair];

  const eyesDesc = {
    glasses: 'в круглых ОЧКАХ',
    angry: 'с СЕРДИТЫМ взглядом без очков',
    normal: 'с ОБЫЧНЫМИ глазами',
    monocle: 'с блестящим МОНОКЛЕМ'
  }[targetEyes];

  const mustacheDesc = {
    none: 'ГЛАДКО ВЫБРИТЫЙ',
    gentleman: 'с тонкими ДЖЕНТЛЬМЕНСКИМИ усами',
    beard: 'со здоровенной ПИРАТСКОЙ бородой',
    pirate: 'с лихими закрученными ПИРАТСКИМИ усами'
  }[targetMustache];

  const skinDesc = {
    pale: 'смертельно БЛЕДНОЕ лицо',
    tanned: 'темно-бронзовое ЗАГОРЕЛОЕ лицо',
    fair: 'здоровый СВЕТЛЫЙ тон кожи'
  }[targetSkin];

  const witnessNames = ['Стряпчий Кокс', 'Портье Альфред', 'Пекарь Тоби', 'Мисс Марпл', 'Миссис Хадсон', 'Доктор Ватсон', 'Газетчик Бобби'];
  const witnessName = witnessNames[Math.floor(Math.random() * witnessNames.length)];

  const caseTitle = job.title || job.caseName || 'загадочном происшествии';
  const witnessStatement = `«О, господин детектив! Я находился неподалеку, когда случилось это происшествие с "${caseTitle}". Я отчетливо запомнил этого подозрительного типа: у него было ${skinDesc}, он был ${hairDesc}, на лице красовались ${mustacheDesc}, а глаза были ${eyesDesc}!»`;

  const currentHair = hairs.find(h => h !== targetHair) || 'short';
  const currentEyes = eyes.find(e => e !== targetEyes) || 'normal';
  const currentMustache = mustaches.find(m => m !== targetMustache) || 'none';
  const currentSkin = skins.find(s => s !== targetSkin) || 'fair';

  return {
    id: job.id,
    name: `Подозреваемый по делу "${job.caseName}"`,
    witnessName,
    witnessStatement,
    targetHair,
    targetEyes,
    targetMustache,
    targetSkin,
    currentHair,
    currentEyes,
    currentMustache,
    currentSkin,
    completed: false,
    accuracy: 0,
    rewardClaimed: false,
    unlockedHint: `Свидетель подсказал приметы! Зацепки на месте расследования по делу "${job.caseName}" искать гораздо легче!`
  };
}
