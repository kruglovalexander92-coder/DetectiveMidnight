import { chatJSON } from './client.js';
import type { ChatMessage } from '../types.js';

function buildGeneratePrompt(idea: string, type: 'single' | 'campaign'): ChatMessage[] {
	if (type === 'single') {
		return [
			{
				role: 'system',
				content: `Ты — креативный соавтор в нуар-детективе про сыщика Барта Ванса и его кота Миднайта. 
Создай детективное задание на основе идеи пользователя. Ответ должен строго соответствовать заданной схеме JSON на русском языке. Используй классический нуарный слог с юмором.

Верни ТОЛЬКО валидный JSON (без markdown, без пояснений):
{
  "title": "Название дела на русском (например, 'Дело о похищенной сосиске')",
  "caseName": "Краткий префикс с номером дела (например, 'Дело №74: «...»')",
  "description": "Красочное, атмосферное описание дела (2-3 предложения), связывающее идею пользователя, кота Миднайта и сыщика Ванса.",
  "reward": 300,
  "risk": "low|medium|high",
  "roomTemplateId": "room_antique|room_ballerina|room_mansion|room_shop|room_museum"
}`,
			},
			{
				role: 'user',
				content: `Идея пользователя: "${idea}"
Развей эту идею в полноценное дело для кота и детектива.`,
			},
		];
	} else {
		return [
			{
				role: 'system',
				content: `Ты — креативный соавтор в нуар-детективе про сыщика Барта Ванса и его кота Миднайта.
Создай бульварный детективный роман, состоящий из 3, 4 или 5 последовательных связанных глав-расследований. Выбери наиболее подходящее количество глав в этом диапазоне (3, 4 или 5), чтобы полностью раскрыть сюжет. Ответ должен строго соответствовать заданной схеме JSON на русском языке. Используй классический нуарный слог.

Верни ТОЛЬКО валидный JSON (без markdown, без пояснений):
{
  "chapters": [
    {
      "title": "Название главы на русском",
      "caseName": "Название главы (например, 'Глава I: Подозрительный след')",
      "description": "Атмосферное описание главы (2-3 предложения), продвигающее сюжет романа вперед.",
      "reward": 250,
      "risk": "low|medium|high",
      "roomTemplateId": "room_antique|room_ballerina|room_mansion|room_shop|room_museum"
    }
  ]
}`,
			},
			{
				role: 'user',
				content: `Идея пользователя: "${idea}"
Развей идею в сквозную историю, состоящую из последовательных связанных глав-расследований.`,
			},
		];
	}
}

function fallbackSingle(idea: string): any {
	const rooms = ['room_antique', 'room_ballerina', 'room_mansion', 'room_shop', 'room_museum'];
	const randomRoom = rooms[Math.floor(Math.random() * rooms.length)];
	const randomReward = Math.floor(Math.random() * 250) + 200;
	const risks = ['low', 'medium', 'high'];
	const randomRisk = risks[Math.floor(Math.random() * risks.length)];
	const caseId = Math.floor(Math.random() * 90) + 10;
	
	return {
		title: `Дело о ${idea.slice(0, 30).toLowerCase()}`,
		caseName: `Дело №${caseId}: «Шорохи Лондона»`,
		description: `Сыщик Ванс и его верный напарник кот Миднайт приступают к расследованию. Поступили сведения: "${idea}". Следы уводят нас в тень лондонских закоулков...`,
		reward: randomReward,
		risk: randomRisk,
		roomTemplateId: randomRoom
	};
}

function fallbackCampaign(idea: string): any {
	const rooms = ['room_antique', 'room_ballerina', 'room_mansion', 'room_shop', 'room_museum'];
	return {
		chapters: [
			{
				title: 'Туманный след',
				caseName: 'Глава I: Странные слухи',
				description: `В лондонские доки приходят загадочные известия о "${idea}". Кот Миднайт навострил уши.`,
				reward: 220,
				risk: 'low',
				roomTemplateId: rooms[0]
			},
			{
				title: 'Опасная встреча',
				caseName: 'Глава II: В тени собора',
				description: `Расследование идеи "${idea}" принимает серьезный оборот. Вансу угрожает банда головорезов, но Миднайт всегда начеку.`,
				reward: 320,
				risk: 'medium',
				roomTemplateId: rooms[1 % rooms.length]
			},
			{
				title: 'Финальное разоблачение',
				caseName: 'Глава III: Лицо врага',
				description: `Завершающий аккорд нашей повести о "${idea}". Истина открыта, преступник пойман, лондонские газеты ликуют!`,
				reward: 500,
				risk: 'high',
				roomTemplateId: rooms[2 % rooms.length]
			}
		]
	};
}

export async function generateStory(idea: string, type: 'single' | 'campaign'): Promise<any> {
	const messages = buildGeneratePrompt(idea, type);
	
	try {
		const result = await chatJSON(messages);
		return result;
	} catch (err) {
		console.error('[LiteLLM] generateStory failed, using fallback:', err);
		return type === 'single' ? fallbackSingle(idea) : fallbackCampaign(idea);
	}
}
