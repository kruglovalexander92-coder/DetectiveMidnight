import { llmConfig } from '../llm/config.js';

export const config = {
	baseURL: llmConfig.litellm.baseURL,
	apiKey: llmConfig.litellm.apiKey,
	model: llmConfig.litellm.model,
	fallbackModel: llmConfig.litellm.fallbackModel,
	language: llmConfig.litellm.language,
	turnCap: llmConfig.litellm.turnCap,
	startRelationship: llmConfig.litellm.startRelationship,
	maxRelationship: llmConfig.litellm.maxRelationship,
	minRelationship: llmConfig.litellm.minRelationship,
	desireReward: llmConfig.litellm.desireReward,
	deltaMin: llmConfig.litellm.deltaMin,
	deltaMax: llmConfig.litellm.deltaMax,
	relQ1: llmConfig.litellm.relQ1,
	relQ2: llmConfig.litellm.relQ2,
	relQ3: llmConfig.litellm.relQ3,
	relQ4: llmConfig.litellm.relQ4,
	relQDegradation: llmConfig.litellm.relQDegradation,
	relQDegradationWrongPic: llmConfig.litellm.relQDegradationWrongPic,
} as const;

export type AppConfig = typeof config;
