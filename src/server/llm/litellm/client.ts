import { llmConfig } from '../config.js';
import type { ChatMessage } from '../types.js';

export async function chatJSON(messages: ChatMessage[]): Promise<unknown> {
	const modelsToTry = [llmConfig.litellm.model, llmConfig.litellm.fallbackModel];
	let lastError: Error | null = null;

	for (const currentModel of modelsToTry) {
		for (let attempt = 1; attempt <= 2; attempt++) {
			try {
				console.log(`[LiteLLM] Attempting ${currentModel} (attempt ${attempt})...`);
				const response = await fetch(`${llmConfig.litellm.baseURL}/chat/completions`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${llmConfig.litellm.apiKey}`,
					},
					body: JSON.stringify({
						model: currentModel,
						messages,
						response_format: { type: 'json_object' },
						temperature: 0.9,
					}),
				});

				if (!response.ok) {
					const errText = await response.text();
					throw new Error(`HTTP ${response.status}: ${errText}`);
				}

				const data: any = await response.json();
				const text: string | undefined = data?.choices?.[0]?.message?.content;
				if (text) {
					try {
						return JSON.parse(text);
					} catch (parseErr) {
						console.error('[LiteLLM] Parse error, trying to extract JSON codeblock...', parseErr);
						const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
						return JSON.parse(cleanText);
					}
				}
			} catch (err: any) {
				lastError = err;
				console.warn(`[LiteLLM] Error on ${currentModel} (attempt ${attempt}):`, err.message || err);
				await new Promise((resolve) => setTimeout(resolve, 800));
			}
		}
	}

	throw lastError ?? new Error('LiteLLM request failed after all retries.');
}
