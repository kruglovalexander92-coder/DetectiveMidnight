import { chatJSON } from './client.js';
import { generatePromptMessages } from '../prompts/generatePrompt.js';
import type { GenerateResult, NPCData, Personality, CaseQuestion, CaseQuestionType, PhotoCompositeFeatures, HairType, EyesType, MustacheType, SkinType } from '../model/types.js';
import type { ChatMessage } from '../../llm/types.js';

const CASE_QUESTIONS: { id: CaseQuestionType; text: string }[] = [
	{ id: 'hair', text: 'Опишите его причёску или головной убор' },
	{ id: 'eyes', text: 'Какие особые приметы в области глаз?' },
	{ id: 'mustache', text: 'Был ли у него ус или борода?' },
	{ id: 'skin', text: 'Какой у него был тон кожи?' },
	{ id: 'compare', text: 'Сравнить фоторобот' },
];

function clamp01(x: number): number {
	if (Number.isNaN(x)) return 0.5;
	return Math.max(0, Math.min(1, x));
}

function validatePersonality(raw: unknown): Personality {
	const p = (raw ?? {}) as Record<string, unknown>;
	return {
		temper: clamp01(Number(p.temper)),
		aggressiveness: clamp01(Number(p.aggressiveness)),
		romanticness: clamp01(Number(p.romanticness)),
		education: clamp01(Number(p.education)),
	};
}

function validateCaseQuestions(raw: unknown): CaseQuestion[] {
	const answers = (raw ?? {}) as Record<string, unknown>;
	return CASE_QUESTIONS.map((q) => ({
		id: q.id,
		text: q.text,
		answer: String(answers[q.id] ?? 'Не помню такого.'),
		answered: false,
	}));
}

function validatePhotoFeatures(raw: unknown): PhotoCompositeFeatures {
	const p = (raw ?? {}) as Record<string, unknown>;
	const validHair: HairType[] = ['bald', 'short', 'curly', 'tophat'];
	const validEyes: EyesType[] = ['glasses', 'angry', 'normal', 'monocle'];
	const validMustache: MustacheType[] = ['none', 'gentleman', 'beard', 'pirate'];
	const validSkin: SkinType[] = ['pale', 'tanned', 'fair'];
	
	return {
		hair: validHair.includes(p.hair as HairType) ? p.hair as HairType : 'short',
		eyes: validEyes.includes(p.eyes as EyesType) ? p.eyes as EyesType : 'normal',
		mustache: validMustache.includes(p.mustache as MustacheType) ? p.mustache as MustacheType : 'none',
		skin: validSkin.includes(p.skin as SkinType) ? p.skin as SkinType : 'fair',
	};
}

function validateNPC(raw: unknown): NPCData {
	const r = (raw ?? {}) as Record<string, unknown>;
	const interest = (r.interest ?? {}) as Record<string, unknown>;
	const desiresRaw = Array.isArray(r.desires) ? (r.desires as unknown[]) : [];
	const photoFeatures = validatePhotoFeatures(r.photoFeatures);
	return {
		name: String(r.name ?? 'Незнакомец'),
		description: String(r.description ?? 'Загадочный человек.'),
		greeting: String(r.greeting ?? 'Привет.'),
		personality: validatePersonality(r.personality),
		interest: {
			topic: String(interest.topic ?? 'что-то'),
			description: String(interest.description ?? ''),
		},
		desires: desiresRaw
			.map((d) => {
				const dd = (d ?? {}) as Record<string, unknown>;
				return { item: String(dd.item ?? ''), hint: String(dd.hint ?? '') };
			})
			.filter((d) => d.item.length > 0),
		secret: String(r.secret ?? 'У меня нет секретов.'),
		caseQuestions: validateCaseQuestions(r.caseAnswers),
		photoFeatures,
		playerComposite: { hair: 'short', eyes: 'normal', mustache: 'none', skin: 'fair' },
	};
}

export async function generateNPC(): Promise<GenerateResult> {
	const data = (await chatJSON(generatePromptMessages())) as Record<string, unknown>;
	const npc = validateNPC(data.npc ?? data);
	const invRaw = Array.isArray(data.inventory) ? (data.inventory as unknown[]) : ['Случайный предмет'];
	const inventory = invRaw.map((x) => String(x)).filter((s) => s.length > 0);
	return { npc, inventory: inventory.length > 0 ? inventory : ['Случайный предмет'] };
}
