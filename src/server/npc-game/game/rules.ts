import { config } from '../config.js';
import type { PhotoCompositeFeatures } from '../model/types.js';

export function clampRelationship(v: number): number {
	return Math.max(config.minRelationship, Math.min(config.maxRelationship, Math.round(v)));
}

export function isWin(relationship: number): boolean {
	return relationship >= config.maxRelationship;
}

export function isLose(relationship: number): boolean {
	return relationship <= config.minRelationship;
}

export function isOutOfTurns(turn: number): boolean {
	return turn >= config.turnCap;
}

export type RoundOutcome = 'win' | 'lose' | 'timeout' | 'composite_match';

export function calculateAccuracy(
	player: PhotoCompositeFeatures,
	target: PhotoCompositeFeatures,
): { accuracy: number; matches: Record<keyof PhotoCompositeFeatures, boolean> } {
	const matches = {
		hair: player.hair === target.hair,
		eyes: player.eyes === target.eyes,
		mustache: player.mustache === target.mustache,
		skin: player.skin === target.skin,
	};
	const matchCount = Object.values(matches).filter(Boolean).length;
	return { accuracy: Math.round((matchCount / 4) * 100), matches };
}
