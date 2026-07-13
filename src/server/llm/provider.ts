import { llmConfig, type LLMProviderType } from './config.js';
import type { LLMProvider } from './types.js';

export async function createLLMProvider(): Promise<LLMProvider> {
	const provider = llmConfig.provider;
	
	if (provider === 'gemini') {
		try {
			// @ts-ignore - dynamic import for optional dependency
			await import('@google/genai');
		} catch (e) {
			throw new Error(
				'Gemini provider requires @google/genai package. Run: npm install @google/genai'
			);
		}
		const { GeminiProvider } = await import('./gemini/index.js');
		return new GeminiProvider();
	} else if (provider === 'litellm') {
		const { LiteLLMProvider } = await import('./litellm/index.js');
		return new LiteLLMProvider();
	} else {
		throw new Error(`Unknown LLM provider: ${provider}`);
	}
}

let providerInstance: LLMProvider | null = null;

export async function getLLMProvider(): Promise<LLMProvider> {
	if (!providerInstance) {
		providerInstance = await createLLMProvider();
		console.log(`[LLM] Initialized provider: ${llmConfig.provider}`);
	}
	return providerInstance;
}

export async function checkDependencies(provider: LLMProviderType): Promise<void> {
	if (provider === 'gemini') {
		try {
			// @ts-ignore - dynamic import for optional dependency
			await import('@google/genai');
			console.log('[LLM] ✓ @google/genai is available');
		} catch (e) {
			throw new Error(
				'[LLM] ✗ @google/genai is not installed. Run: npm install @google/genai'
			);
		}
	} else if (provider === 'litellm') {
		console.log('[LLM] ✓ LiteLLM provider requires no additional dependencies');
	}
}
