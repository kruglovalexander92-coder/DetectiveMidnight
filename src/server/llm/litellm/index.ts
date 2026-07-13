import type { LLMProvider, ChatMessage } from '../types.js';
import { chatJSON as litellmChatJSON } from './client.js';
import { generateStory } from './generate.js';
import { critiqueStory } from './critique.js';

export class LiteLLMProvider implements LLMProvider {
	async chatJSON(messages: ChatMessage[]): Promise<unknown> {
		return litellmChatJSON(messages);
	}

	async generateStory(idea: string, type: 'single' | 'campaign'): Promise<any> {
		return generateStory(idea, type);
	}

	async critiqueStory(
		idea: string,
		title: string,
		chapters: any[],
		ratingIdea: number,
		ratingExecution: number
	): Promise<any> {
		return critiqueStory(idea, title, chapters, ratingIdea, ratingExecution);
	}
}
