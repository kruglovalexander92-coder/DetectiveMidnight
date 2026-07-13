export type LLMProviderType = 'gemini' | 'litellm';

function numberEnv(key: string, fallback: number): number {
	const v = process.env[key];
	if (v === undefined || v === '') return fallback;
	const n = Number(v);
	return Number.isNaN(n) ? fallback : n;
}

function cleanEnv(key: string, fallback: string = ''): string {
	const v = process.env[key];
	if (v === undefined || v === '') return fallback;
	return v.replace(/^["']|["']$/g, '');
}

export const llmConfig = {
	provider: (process.env.LLM_PROVIDER as LLMProviderType) || 'litellm',
	
	gemini: {
		apiKey: cleanEnv('GEMINI_API_KEY'),
		model: cleanEnv('GEMINI_MODEL', 'gemini-3.5-flash'),
		fallbackModel: cleanEnv('GEMINI_FALLBACK_MODEL', 'gemini-2.5-flash'),
	},
	
	litellm: {
		baseURL: cleanEnv('OPENAI_BASE_URL', 'https://hcbifrost.herocraft.com/litellm/v1'),
		apiKey: cleanEnv('OPENAI_API_KEY'),
		model: cleanEnv('OPENAI_MODEL', 'GLM-5.2 (res)'),
		fallbackModel: cleanEnv('OPENAI_FALLBACK_MODEL', 'mimo-v2.5'),
		language: 'ru',
		turnCap: numberEnv('TURN_CAP', 15),
		startRelationship: 30,
		maxRelationship: 100,
		minRelationship: 0,
		desireReward: 30,
		deltaMin: -15,
		deltaMax: 20,
		relQ1: numberEnv('REL_Q1', 40),
		relQ2: numberEnv('REL_Q2', 65),
		relQ3: numberEnv('REL_Q3', 90),
		relQ4: numberEnv('REL_Q4', 95),
		relQDegradation: numberEnv('REL_Q_DEGRADATION', 10),
		relQDegradationWrongPic: numberEnv('REL_Q_DEGRADATION_WRONG_PIC', 20),
	},
} as const;

export type LLMConfig = typeof llmConfig;
