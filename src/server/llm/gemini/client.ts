import { llmConfig } from '../config.js';
import type { ChatMessage } from '../types.js';

let GoogleGenAI: any;
let Type: any;

async function loadGemini() {
	if (!GoogleGenAI) {
		// @ts-ignore - dynamic import for optional dependency
		const mod = await import('@google/genai');
		GoogleGenAI = mod.GoogleGenAI;
		Type = mod.Type;
	}
	return { GoogleGenAI, Type };
}

let aiClient: any = null;

function getClient(): any {
	if (!aiClient) {
		const apiKey = llmConfig.gemini.apiKey;
		if (!apiKey) {
			throw new Error('GEMINI_API_KEY is not defined in environment variables');
		}
		aiClient = new GoogleGenAI({
			apiKey,
			httpOptions: {
				headers: {
					'User-Agent': 'aistudio-build',
				},
			},
		});
	}
	return aiClient;
}

async function generateContentWithFallback(
	ai: any,
	model: string,
	contents: any,
	config: any,
	fallbackGenerator: () => any
): Promise<any> {
	const modelsToTry = [model, llmConfig.gemini.fallbackModel];
	let lastError: any = null;

	for (const currentModel of modelsToTry) {
		for (let attempt = 1; attempt <= 2; attempt++) {
			try {
				console.log(`[Gemini] Attempting ${currentModel} (attempt ${attempt})...`);
				const response = await ai.models.generateContent({
					model: currentModel,
					contents,
					config,
				});
				const text = response.text;
				if (text) {
					try {
						return JSON.parse(text);
					} catch (parseErr) {
						console.error('[Gemini] Parse error, trying to extract JSON codeblock...', parseErr);
						const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
						return JSON.parse(cleanText);
					}
				}
			} catch (err: any) {
				lastError = err;
				console.warn(`[Gemini] Error on ${currentModel} (attempt ${attempt}):`, err.message || err);
				await new Promise((resolve) => setTimeout(resolve, 800));
			}
		}
	}

	console.error('[Gemini] All models and retries exhausted. Using local fallback. Last error:', lastError);
	return fallbackGenerator();
}

export async function chatJSON(messages: ChatMessage[]): Promise<unknown> {
	const { GoogleGenAI } = await loadGemini();
	const ai = getClient();
	const systemMsg = messages.find(m => m.role === 'system');
	const userMsg = messages.find(m => m.role === 'user');
	
	if (!userMsg) {
		throw new Error('No user message found');
	}

	return generateContentWithFallback(
		ai,
		llmConfig.gemini.model,
		userMsg.content,
		{
			systemInstruction: systemMsg?.content,
			responseMimeType: 'application/json',
		},
		() => {
			throw new Error('Gemini chatJSON requires a fallback generator');
		}
	);
}

export { generateContentWithFallback, getClient, loadGemini };
