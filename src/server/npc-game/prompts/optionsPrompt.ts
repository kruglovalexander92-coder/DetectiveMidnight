import { config } from '../config.js';
import type { HistoryEntry, NPCData } from '../model/types.js';
import type { ChatMessage } from '../../llm/types.js';

export interface OptionsContext {
	npc: NPCData;
	relationship: number;
	history: HistoryEntry[];
	recentChoices: string[];
}

export function optionsPromptMessages(ctx: OptionsContext): ChatMessage[] {
	const { npc } = ctx;
	const p = npc.personality;
	const historyStr =
		ctx.history.length > 0
			? ctx.history.map((h) => `${h.role === 'player' ? 'Игрок' : npc.name}: ${h.text}`).join('\n')
			: '(пока тишина)';

	const recentStr =
		ctx.recentChoices.length > 0
			? ctx.recentChoices.map((c, i) => `${i + 1}. ${c}`).join('\n')
			: '(пока нет)';

	return [
		{
			role: 'system',
			content: `Ты — генератор вариантов реплик для игры-симулятора общения с NPC по имени ${npc.name}.
Описание NPC: ${npc.description}
Тема интереса: ${npc.interest.topic} — ${npc.interest.description}
Личностные черты (0..1):
- вспыльчивость (temper): ${p.temper}
- агрессивность (aggressiveness): ${p.aggressiveness}
- романтичность (romanticness): ${p.romanticness}
- образованность (education): ${p.education}

Текущий уровень отношений: ${ctx.relationship}/100.

ЗАДАЧА: Сгенерируй ровно 7 вариантов реплик игрока на языке "${config.language}". Каждая реплика должна приводить к РАЗНОМУ эффекту на отношения:
- slight_increase (небольшое увеличение, +1 до +5)
- strong_increase (сильное увеличение, +6 до +20)
- slight_decrease (небольшое уменьшение, -1 до -5)
- strong_decrease (сильное уменьшение, -6 до -15)
- catastrophic_decrease (катастрофическое уменьшение, -16 до -50)
- neutral (без изменений, 0)

ВАЖНО: Эффект от каждой реплики НЕ ДОЛЖЕН быть очевидным. Например:
- Вежливая фраза может оказаться катастрофической (если NPC обидчив)
- Шутка может дать сильное увеличение (если NPC ценит юмор)
- Невинный вопрос может привести к сильному уменьшению (если NPC вспыльчив)
- Комплимент может быть нейтральным (если NPC не ценит лесть)

КОНТЕКСТУАЛЬНАЯ СВЯЗЬ: Минимум 2-3 варианта должны быть тематически связаны с последними выборами игрока:
${recentStr}

Это означает, что хотя бы 2-3 реплики должны продолжать тему, которую игрок выбирал ранее.

ПРАВИЛА ФОРМИРОВАНИЯ РЕПЛИК:
- Каждая реплика — одна короткая фраза (1-2 предложения)
- Все реплики на языке "${config.language}"
- Реалистичные, естественные, соответствуют ситуации в диалоге
- topicHint — короткое описание темы реплики (для внутренней логики игры)

Верни ТОЛЬКО валидный JSON (без markdown, без пояснений):
{
  "options": [
    { "text": "...", "expectedDelta": "slight_increase", "topicHint": "..." },
    { "text": "...", "expectedDelta": "strong_increase", "topicHint": "..." },
    { "text": "...", "expectedDelta": "slight_decrease", "topicHint": "..." },
    { "text": "...", "expectedDelta": "strong_decrease", "topicHint": "..." },
    { "text": "...", "expectedDelta": "catastrophic_decrease", "topicHint": "..." },
    { "text": "...", "expectedDelta": "neutral", "topicHint": "..." },
    { "text": "...", "expectedDelta": "slight_increase", "topicHint": "..." }
  ]
}

Убедись, что все 6 категорий представлены (одна категория может повториться).`,
		},
		{
			role: 'user',
			content: `История диалога:
${historyStr}

Последние выборы игрока:
${recentStr}

Сгенерируй 7 вариантов реплик для текущего момента.`,
		},
	];
}
