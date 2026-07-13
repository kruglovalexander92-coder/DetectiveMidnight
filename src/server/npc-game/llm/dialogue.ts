import { chatJSON } from './client.js';
import { dialoguePromptMessages, type DialogueContext } from '../prompts/dialoguePrompt.js';
import type { TurnResult } from '../model/types.js';
import type { ChatMessage } from '../../llm/types.js';

function clampDelta(x: number): number {
	if (Number.isNaN(x)) return 0;
	return Math.max(-50, Math.min(50, Math.round(x)));
}

function asBool(v: unknown): boolean {
	return Boolean(v);
}

export async function dialogue(ctx: DialogueContext): Promise<TurnResult> {
	const data = (await chatJSON(dialoguePromptMessages(ctx))) as Record<string, unknown>;
	return {
		reply: String(data.reply ?? '...'),
		relationshipDelta: clampDelta(Number(data.relationshipDelta ?? 0)),
		gaveDesiredItem: asBool(data.gaveDesiredItem),
		revealSecret: asBool(data.revealSecret),
		reason: String(data.reason ?? ''),
	};
}
