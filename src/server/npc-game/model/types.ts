export interface Personality {
	temper: number;
	aggressiveness: number;
	romanticness: number;
	education: number;
}

export interface Desire {
	item: string;
	hint: string;
}

export interface Interest {
	topic: string;
	description: string;
}

export interface NPCData {
	name: string;
	description: string;
	greeting: string;
	personality: Personality;
	interest: Interest;
	desires: Desire[];
	secret: string;
	caseQuestions: CaseQuestion[];
	photoFeatures: PhotoCompositeFeatures;
	playerComposite: PhotoCompositeFeatures;
}

export interface TurnResult {
	reply: string;
	relationshipDelta: number;
	gaveDesiredItem: boolean;
	revealSecret: boolean;
	reason: string;
}

export interface GenerateResult {
	npc: NPCData;
	inventory: string[];
}

export interface HistoryEntry {
	role: 'player' | 'npc';
	text: string;
}

export type HairType = 'bald' | 'short' | 'curly' | 'tophat';
export type EyesType = 'glasses' | 'angry' | 'normal' | 'monocle';
export type MustacheType = 'none' | 'gentleman' | 'beard' | 'pirate';
export type SkinType = 'pale' | 'tanned' | 'fair';

export interface PhotoCompositeFeatures {
	hair: HairType;
	eyes: EyesType;
	mustache: MustacheType;
	skin: SkinType;
}

export type CaseQuestionType = 'hair' | 'eyes' | 'mustache' | 'skin' | 'compare';

export interface CaseQuestion {
	id: CaseQuestionType;
	text: string;
	answer: string;
	answered: boolean;
}

export type DeltaCategory =
	| 'slight_increase'
	| 'strong_increase'
	| 'slight_decrease'
	| 'strong_decrease'
	| 'catastrophic_decrease'
	| 'neutral';

export interface DialogueOption {
	text: string;
	expectedDelta: DeltaCategory;
	topicHint?: string;
}

export interface MenuState {
	options: DialogueOption[];
	generatedAtTurn: number;
	recentChoices: string[];
}
