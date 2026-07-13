import { chatJSON } from './client.js';
import { optionsPromptMessages, type OptionsContext } from '../prompts/optionsPrompt.js';
import type { DeltaCategory, DialogueOption } from '../model/types.js';
import type { ChatMessage } from '../../llm/types.js';

const VALID_CATEGORIES: DeltaCategory[] = [
	'slight_increase',
	'strong_increase',
	'slight_decrease',
	'strong_decrease',
	'catastrophic_decrease',
	'neutral',
];

function isValidCategory(s: unknown): s is DeltaCategory {
	return typeof s === 'string' && VALID_CATEGORIES.includes(s as DeltaCategory);
}

function validateOptions(raw: unknown): DialogueOption[] {
	const data = raw as { options?: unknown };
	if (!data || !Array.isArray(data.options)) {
		throw new Error('LLM did not return options array.');
	}

	const options: DialogueOption[] = [];
	for (const item of data.options) {
		const opt = item as Record<string, unknown>;
		const text = String(opt.text ?? '').trim();
		const category = opt.expectedDelta;
		if (text.length === 0 || !isValidCategory(category)) {
			continue;
		}
		options.push({
			text,
			expectedDelta: category,
			topicHint: opt.topicHint ? String(opt.topicHint) : undefined,
		});
	}

	if (options.length < 7) {
		throw new Error(`LLM returned only ${options.length} valid options (need 7).`);
	}

	return options.slice(0, 7);
}

export async function generateDialogueOptions(ctx: OptionsContext): Promise<DialogueOption[]> {
	const data = await chatJSON(optionsPromptMessages(ctx));
	return validateOptions(data);
}
