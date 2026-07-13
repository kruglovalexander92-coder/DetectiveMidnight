import { generateContentWithFallback, getClient, loadGemini } from './client.js';

export async function generateStory(idea: string, type: 'single' | 'campaign'): Promise<any> {
	const { Type } = await loadGemini();
	const ai = getClient();

	if (type === 'single') {
		const prompt = `Ты — креативный соавтор в нуар-детективе про сыщика Барта Ванса и его кота Миднайта. 
Напиши увлекательное детективное задание на основе идеи пользователя. 
Идея пользователя: "${idea}"
Развей эту идею в полноценное дело для кота и детектива. Текст должен быть на русском языке, в атмосферном, слегка ироничном нуарном стиле.`;

		return generateContentWithFallback(
			ai,
			'gemini-3.5-flash',
			prompt,
			{
				systemInstruction: 'Ты создаешь детективные дела для игры. Ответ должен строго соответствовать заданной схеме JSON на русском языке. Используй классический нуарный слог с юмором.',
				responseMimeType: 'application/json',
				responseSchema: {
					type: Type.OBJECT,
					properties: {
						title: { type: Type.STRING, description: "Название дела на русском (например, 'Дело о похищенной сосиске')" },
						caseName: { type: Type.STRING, description: "Краткий префикс с номером дела (например, 'Дело №74: «...»')" },
						description: { type: Type.STRING, description: "Красочное, атмосферное описание дела (2-3 предложения), связывающее идею пользователя, кота Миднайта и сыщика Ванса." },
						reward: { type: Type.INTEGER, description: "Награда в долларах за раскрытие (от 200 до 450)" },
						risk: { type: Type.STRING, description: "Уровень риска: 'low', 'medium' или 'high'" },
						roomTemplateId: { type: Type.STRING, description: "Одна из комнат для расследования. Выбери наиболее подходящую по контексту из списка: 'room_antique', 'room_ballerina', 'room_mansion', 'room_shop', 'room_museum'." }
					},
					required: ['title', 'caseName', 'description', 'reward', 'risk', 'roomTemplateId']
				}
			},
			() => {
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
		);
	} else {
		const prompt = `Ты — креативный соавтор в нуар-детективе про сыщика Барта Ванса и его кота Миднайта.
Напиши захватывающий бульварный детективный роман, состоящий из 3, 4 или 5 последовательных связанных глав-расследований на основе идеи пользователя. Выбери наиболее подходящее количество глав в этом диапазоне (3, 4 или 5), чтобы полностью раскрыть сюжет.
Идея пользователя: "${idea}"
Развей идею в сквозную историю, состоящую из последовательных связанных глав-расследований. Текст должен быть на русском языке в атмосферном нуарном стиле.`;

		const result = await generateContentWithFallback(
			ai,
			'gemini-3.5-flash',
			prompt,
			{
				systemInstruction: "Ты создаешь детективный бульварный роман, состоящий из 3-5 связанных глав-дел. Каждая глава — это полноценное дело. Ответ должен строго соответствовать заданной схеме JSON на русском языке (массив из 3-5 объектов). Используй классический нуарный слог.",
				responseMimeType: 'application/json',
				responseSchema: {
					type: Type.ARRAY,
					description: 'Массив из 3-5 связанных глав детективного бульварного романа',
					items: {
						type: Type.OBJECT,
						properties: {
							title: { type: Type.STRING, description: 'Название главы на русском' },
							caseName: { type: Type.STRING, description: "Название главы (например, 'Глава I: Подозрительный след')" },
							description: { type: Type.STRING, description: 'Атмосферное описание главы (2-3 предложения), продвигающее сюжет романа вперед.' },
							reward: { type: Type.INTEGER, description: 'Награда в долларах. Глава 1: 200-250, последующие главы: 250-400, финальная глава: 450-550' },
							risk: { type: Type.STRING, description: "Уровень риска: 'low', 'medium' или 'high'" },
							roomTemplateId: { type: Type.STRING, description: "Подходящая комната из списка: 'room_antique', 'room_ballerina', 'room_mansion', 'room_shop', 'room_museum'." }
						},
						required: ['title', 'caseName', 'description', 'reward', 'risk', 'roomTemplateId']
					}
				}
			},
			() => {
				const rooms = ['room_antique', 'room_ballerina', 'room_mansion', 'room_shop', 'room_museum'];
				return [
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
				];
			}
		);

		return { chapters: result };
	}
}
