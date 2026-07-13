export interface ChatMessage {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

export interface LLMProvider {
	chatJSON(messages: ChatMessage[]): Promise<unknown>;
	generateStory(idea: string, type: 'single' | 'campaign'): Promise<any>;
	critiqueStory(
		idea: string,
		title: string,
		chapters: any[],
		ratingIdea: number,
		ratingExecution: number
	): Promise<any>;
}
