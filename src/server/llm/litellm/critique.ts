import { chatJSON } from './client.js';
import type { ChatMessage } from '../types.js';

function buildCritiquePrompt(
	idea: string,
	title: string,
	chapters: any[],
	ratingIdea: number,
	ratingExecution: number
): ChatMessage[] {
	const campaignDetails = (chapters || []).map((ch: any, idx: number) => 
		`Глава ${idx + 1}: "${ch.title}" - ${ch.description}`
	).join('\n');

	return [
		{
			role: 'system',
			content: `Ты — строгий, но склонный к сарказму лондонский литературный критик из 1930-х годов, пишущий рецензии на дешевые детективные романы (pulp fiction).
Напиши колоритную саркастичную рецензию на дешевый детективный роман по предложенной схеме JSON на русском языке.

Верни ТОЛЬКО валидный JSON (без markdown, без пояснений):
{
  "title": "Смешное, интригующее название изданного бульварного романа на русском (например, 'Кот, который знал слишком мало')",
  "status": "flop|hit|bestseller",
  "profit": 200,
  "review": "Текст литературной рецензии на русском языке (4-5 атмосферных предложений), критикующий идею и реализацию с юмором."
}

Статусы:
- 'flop' (провал: мало продаж, рецензенты смеются, тираж пустили на растопку каминов)
- 'hit' (хит: неплохие продажи, усатый сыщик Midnight полюбился публике, роман обсуждают в пабах Сохо)
- 'bestseller' (бестселлер: феноменальный успех, у дверей издательства очереди, дамы падают в обморок от интриги)

Если средняя оценка автора высокая (4-5), книга должна стать 'hit' или 'bestseller'. Если низкая (1-3), сделай ее 'flop'.
Гонорар автора (profit) от продаж: провал 10-30$, хит 150-250$, бестселлер 350-500$.`,
		},
		{
			role: 'user',
			content: `Оцени новый бульварный детективный роман, основанный на идее автора: "${idea}".
Сюжет романа развивался по следующим главам:
${campaignDetails || `Дело: "${title}"`}

Автор романа оценил свою первоначальную идею на ${ratingIdea} из 5 звезд, а исполнение сюжета соавтором-ИИ на ${ratingExecution} из 5 звезд.`,
		},
	];
}

function fallbackCritique(
	idea: string,
	title: string,
	ratingIdea: number,
	ratingExecution: number
): any {
	const ratingI = ratingIdea !== undefined ? Number(ratingIdea) : 4;
	const ratingE = ratingExecution !== undefined ? Number(ratingExecution) : 4;
	const averageRating = (ratingI + ratingE) / 2;
	const isHigh = averageRating >= 3.5;
	const status = isHigh ? (averageRating >= 4.5 ? 'bestseller' : 'hit') : 'flop';
	const profit = status === 'flop' ? 25 : (status === 'hit' ? 210 : 450);
	const cleanTitle = title || `Загадка "${idea.slice(0, 30)}"`;

	return {
		title: cleanTitle,
		status,
		profit,
		review: `«${cleanTitle}» — весьма колоритное бульварное чтиво! Автор взял за основу интригующий концепт "${idea}". Профессиональный рецензент отметил превосходный юмор, потрясающую атмосферу туманного Альбиона и харизму пушистого сыщика.`
	};
}

export async function critiqueStory(
	idea: string,
	title: string,
	chapters: any[],
	ratingIdea: number,
	ratingExecution: number
): Promise<any> {
	const messages = buildCritiquePrompt(idea, title, chapters, ratingIdea, ratingExecution);
	
	try {
		const result = await chatJSON(messages);
		return result;
	} catch (err) {
		console.error('[LiteLLM] critiqueStory failed, using fallback:', err);
		return fallbackCritique(idea, title, ratingIdea, ratingExecution);
	}
}
