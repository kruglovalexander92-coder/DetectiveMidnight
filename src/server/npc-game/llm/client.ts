import { getLLMProvider } from '../../llm/provider.js';
import type { ChatMessage } from '../../llm/types.js';

export async function chatJSON(messages: ChatMessage[]): Promise<unknown> {
	const provider = await getLLMProvider();
	return provider.chatJSON(messages);
}
