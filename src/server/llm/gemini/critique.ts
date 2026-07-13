import { generateContentWithFallback, getClient, loadGemini } from './client.js';

export async function critiqueStory(
	idea: string,
	title: string,
	chapters: any[],
	ratingIdea: number,
	ratingExecution: number
): Promise<any> {
	const { Type } = await loadGemini();
	const ai = getClient();
	const campaignDetails = (chapters || []).map((ch: any, idx: number) => 
		`Глава ${idx + 1}: "${ch.title}" - ${ch.description}`
	).join('\n');

	const prompt = `Ты — строгий, но склонный к сарказму лондонский литературный критик из 1930-х годов, пишущий рецензии на дешевые детективные романы (pulp fiction).
Оцени новый бульварный детективный роман, основанный на идее автора: "${idea}".
Сюжет романа развивался по следующим главам:
${campaignDetails || `Дело: "${title}"`}

Автор романа оценил свою первоначальную идею на ${ratingIdea} из 5 звезд, а исполнение сюжета соавтором-ИИ на ${ratingExecution} из 5 звезд.
Напиши рецензию в стиле критической колонки в лондонском литературном вестнике, наполненную нуарным сарказмом, забавными метафорами и профессиональной оценкой. Рецензия должна быть строго на русском языке.
Определи статус книги на книжном рынке Лондона:
- 'flop' (провал: мало продаж, рецензенты смеются, тираж пустили на растопку каминов)
- 'hit' (хит: неплохие продажи, усатый сыщик Midnight полюбился публике, роман обсуждают в пабах Сохо)
- 'bestseller' (бестселлер: феноменальный успех, у дверей издательства очереди, дамы падают в обморок от интриги)
Если средняя оценка автора высокая (4-5), книга должна стать 'hit' или 'bestseller'. Если низкая (1-3), сделай ее 'flop'.
Также определи гонорар автора (profit) от продаж: провал приносит от 10$ до 30$, хит от 150$ до 250$, бестселлер от 350$ до 500$.`;

	return generateContentWithFallback(
		ai,
		'gemini-3.5-flash',
		prompt,
		{
			systemInstruction: 'Ты литературный критик 1930-х годов. Напиши колоритную саркастичную рецензию на дешевый детективный роман по предложенной схеме JSON на русском языке.',
			responseMimeType: 'application/json',
			responseSchema: {
				type: Type.OBJECT,
				properties: {
					title: { type: Type.STRING, description: "Смешное, интригующее название изданного бульварного романа на русском (например, 'Кот, который знал слишком мало')" },
					status: { type: Type.STRING, description: "Статус книги: 'flop', 'hit' или 'bestseller'" },
					profit: { type: Type.INTEGER, description: 'Полученный гонорар писателя в долларах ($)' },
					review: { type: Type.STRING, description: 'Текст литературной рецензии на русском языке (4-5 атмосферных предложений), критикующий идею и реализацию с юмором.' }
				},
				required: ['title', 'status', 'profit', 'review']
			}
		},
		() => {
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
	);
}
