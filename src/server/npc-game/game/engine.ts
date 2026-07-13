import { config } from '../config.js';
import { generateNPC } from '../llm/generate.js';
import { dialogue } from '../llm/dialogue.js';
import { generateDialogueOptions } from '../llm/options.js';
import { clampRelationship, isWin, isLose, isOutOfTurns, calculateAccuracy, type RoundOutcome } from './rules.js';
import type { HistoryEntry, NPCData, DialogueOption, TurnResult, CaseQuestion, CaseQuestionType, PhotoCompositeFeatures } from '../model/types.js';

export interface RoundState {
	npc: NPCData;
	inventory: string[];
	relationship: number;
	turn: number;
	history: HistoryEntry[];
	recentChoices: string[];
	options: DialogueOption[] | null;
	outcome: RoundOutcome | null;
	secret: string | null;
	caseQuestions: CaseQuestion[];
}

export interface StartRoundResult {
	npc: NPCData;
	inventory: string[];
	relationship: number;
	turn: number;
	caseQuestions: CaseQuestion[];
}

export interface ProcessTurnResult {
	reply: string;
	relationshipDelta: number;
	relationship: number;
	gaveDesiredItem: boolean;
	revealSecret: boolean;
	reason: string;
	outcome: RoundOutcome | null;
	secret: string | null;
	turn: number;
	inventory: string[];
}

export interface AskQuestionResult {
	answer: string;
	relationshipDelta: number;
	relationship: number;
	turn: number;
	outcome: RoundOutcome | null;
	secret: string | null;
	availableQuestions: CaseQuestionType[];
}

export interface CompareResult {
	accuracy: number;
	matches: Record<keyof PhotoCompositeFeatures, boolean>;
	relationshipDelta: number;
	relationship: number;
	turn: number;
	outcome: RoundOutcome | null;
	secret: string | null;
	feedback: string;
}

export function createEmptyState(): RoundState {
	return {
		npc: null as unknown as NPCData,
		inventory: [],
		relationship: config.startRelationship,
		turn: 0,
		history: [],
		recentChoices: [],
		options: null,
		outcome: null,
		secret: null,
		caseQuestions: [],
	};
}

export async function startRound(state: RoundState): Promise<StartRoundResult> {
	const { npc, inventory } = await generateNPC();

	state.npc = npc;
	state.inventory = [...inventory];
	state.relationship = config.startRelationship;
	state.turn = 0;
	state.history = [{ role: 'npc', text: npc.greeting }];
	state.recentChoices = [];
	state.options = null;
	state.outcome = null;
	state.secret = null;
	state.caseQuestions = npc.caseQuestions.map(q => ({ ...q }));

	return {
		npc,
		inventory: state.inventory,
		relationship: state.relationship,
		turn: state.turn,
		caseQuestions: state.caseQuestions,
	};
}

export function getCurrentThreshold(state: RoundState): number {
	const answeredInfoCount = state.caseQuestions
		.filter(q => q.id !== 'compare' && q.answered)
		.length;
	if (answeredInfoCount === 0) return config.relQ1;
	if (answeredInfoCount === 1) return config.relQ2;
	if (answeredInfoCount === 2) return config.relQ3;
	if (answeredInfoCount === 3) return config.relQ4;
	return Infinity;
}

export function getAvailableQuestions(state: RoundState): CaseQuestionType[] {
	const threshold = getCurrentThreshold(state);
	const infoQuestions = state.caseQuestions
		.filter(q => q.id !== 'compare' && !q.answered && state.relationship >= threshold)
		.map(q => q.id);
	
	return [...infoQuestions, 'compare'];
}

export function askQuestion(state: RoundState, questionId: CaseQuestionType): AskQuestionResult | CompareResult {
	if (state.outcome) {
		throw new Error('Round already ended.');
	}

	const question = state.caseQuestions.find(q => q.id === questionId);
	if (!question) {
		throw new Error(`Question ${questionId} not found.`);
	}
	if (question.answered) {
		throw new Error(`Question ${questionId} already answered.`);
	}

	if (questionId !== 'compare') {
		const threshold = getCurrentThreshold(state);
		if (state.relationship < threshold) {
			throw new Error(`Relationship ${state.relationship} below threshold ${threshold}.`);
		}
	}

	state.turn++;

	if (questionId === 'compare') {
		return comparePhotoComposite(state);
	}

	question.answered = true;

	const degradation = Math.round(config.relQDegradation * state.npc.personality.aggressiveness);
	state.relationship = clampRelationship(state.relationship - degradation);

	state.history.push({ role: 'player', text: `[Вопрос по делу]: ${question.text}` });
	state.history.push({ role: 'npc', text: question.answer });

	let outcome: RoundOutcome | null = null;
	let secret: string | null = null;

	if (isLose(state.relationship)) {
		outcome = 'lose';
	} else if (isOutOfTurns(state.turn)) {
		outcome = 'timeout';
	}

	state.outcome = outcome;
	state.options = null;

	return {
		answer: question.answer,
		relationshipDelta: -degradation,
		relationship: state.relationship,
		turn: state.turn,
		outcome,
		secret,
		availableQuestions: getAvailableQuestions(state),
	};
}

export function comparePhotoComposite(state: RoundState): CompareResult {
	const { accuracy, matches } = calculateAccuracy(
		state.npc.playerComposite,
		state.npc.photoFeatures,
	);

	if (accuracy === 100) {
		if (state.relationship >= 100) {
			state.outcome = 'win';
			state.secret = state.npc.secret;
		} else {
			state.outcome = 'composite_match';
			state.secret = null;
		}
		state.options = null;
		return {
			accuracy,
			matches,
			relationshipDelta: 0,
			relationship: state.relationship,
			turn: state.turn,
			outcome: state.outcome,
			secret: state.secret,
			feedback: 'Фоторобот составлен верно!',
		};
	}

	const degradation = Math.round(config.relQDegradationWrongPic * state.npc.personality.temper);
	state.relationship = clampRelationship(state.relationship - degradation);

	const firstMismatch = Object.entries(matches).find(([_, v]) => !v)?.[0];
	const feedbackMap: Record<string, string> = {
		hair: '«Хм, на его голове определенно было что-то другое...»',
		skin: '«Что-то не так с цветом его лица...»',
		eyes: '«Его взгляд или аксессуары выглядели иначе...»',
		mustache: '«Растительность на лице не совпадает...»',
	};
	const feedback = feedbackMap[firstMismatch || 'hair'] || '«Это не совсем он...»';

	let outcome: RoundOutcome | null = null;
	if (isLose(state.relationship)) {
		outcome = 'lose';
	} else if (isOutOfTurns(state.turn)) {
		outcome = 'timeout';
	}

	state.outcome = outcome;
	state.options = null;

	return {
		accuracy,
		matches,
		relationshipDelta: -degradation,
		relationship: state.relationship,
		turn: state.turn,
		outcome,
		secret: null,
		feedback,
	};
}

export function updatePlayerComposite(
	state: RoundState,
	feature: keyof PhotoCompositeFeatures,
	value: string,
): void {
	(state.npc.playerComposite[feature] as string) = value;
}

export async function processTurn(
	state: RoundState,
	playerText: string,
	gaveItem: string | null,
): Promise<ProcessTurnResult> {
	if (state.outcome) {
		throw new Error('Round already ended.');
	}

	state.turn++;

	if (gaveItem) {
		const idx = state.inventory.findIndex((it) => it.toLowerCase() === gaveItem.toLowerCase());
		if (idx >= 0) {
			state.inventory.splice(idx, 1);
		}
		state.recentChoices.push(`/give ${gaveItem}`);
		if (state.recentChoices.length > 3) state.recentChoices.shift();
	} else {
		state.recentChoices.push(playerText);
		if (state.recentChoices.length > 3) state.recentChoices.shift();
	}

	const fullPlayerText = gaveItem ? `*передаёт ${gaveItem}*` : playerText;
	state.history.push({ role: 'player', text: fullPlayerText });

	const result: TurnResult = await dialogue({
		npc: state.npc,
		relationship: state.relationship,
		turn: state.turn,
		turnCap: config.turnCap,
		history: state.history,
		playerInput: fullPlayerText,
		inventory: state.inventory,
		gaveItem,
	});

	state.relationship = clampRelationship(state.relationship + result.relationshipDelta);
	state.history.push({ role: 'npc', text: result.reply });

	let outcome: RoundOutcome | null = null;
	let secret: string | null = null;

	if (result.revealSecret || isWin(state.relationship)) {
		outcome = 'win';
		secret = state.npc.secret;
		state.secret = secret;
	} else if (isLose(state.relationship)) {
		outcome = 'lose';
	} else if (isOutOfTurns(state.turn)) {
		outcome = 'timeout';
	}

	state.outcome = outcome;
	state.options = null;

	return {
		reply: result.reply,
		relationshipDelta: result.relationshipDelta,
		relationship: state.relationship,
		gaveDesiredItem: result.gaveDesiredItem,
		revealSecret: result.revealSecret,
		reason: result.reason,
		outcome,
		secret,
		turn: state.turn,
		inventory: [...state.inventory],
	};
}

export async function generateOptions(state: RoundState): Promise<DialogueOption[]> {
	if (state.outcome) {
		throw new Error('Round already ended.');
	}

	const options = await generateDialogueOptions({
		npc: state.npc,
		relationship: state.relationship,
		history: state.history,
		recentChoices: state.recentChoices,
	});

	state.options = options;
	return options;
}
