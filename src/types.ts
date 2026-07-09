/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ObjectId =
  | 'bookshelf'
  | 'desk'
  | 'rug'
  | 'safe'
  | 'lamp'
  | 'trashcan'
  | 'painting'
  | 'fishbowl';

export interface Clue {
  id: string;
  name: string;
  description: string;
  icon: string; // lucide icon name
  findingMessage: string; // Message when found
}

export interface PuzzleItem {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface ObjectState {
  id: ObjectId;
  name: string;
  icon: string;
  description: string;
  isInteractive: boolean;
  stateDescription: string;
  // Dynamic positioning properties
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  shape?: string;
  // Specific states
  toggled?: boolean; // e.g., lamp on, painting tilted, rug scratched
  locked?: boolean;  // e.g., safe, desk drawer
  tipped?: boolean;  // e.g., trash can, fishbowl
  booksFallen?: boolean; // bookshelf specific
  searchedCount?: number;
  // Contents
  heldClueId: string | null;
  heldItemId: string | null;
}

export interface DetectiveQuote {
  text: string;
  mood: 'serious' | 'silly' | 'thoughtful' | 'shocked' | 'proud';
}

export interface GameLog {
  id: string;
  sender: 'detective' | 'cat' | 'system';
  text: string;
  timestamp: string;
}

export interface RoomInfo {
  id: string;
  name: string;
  caseName: string;
  caseIntro: string;
  wallColor: string;
  accentBorder: string;
  tintStyle: string;
  objectNames: Record<ObjectId, string>;
  objectDescriptions: Record<ObjectId, string>;
}

export interface EconomyState {
  cash: number;
  recentExpenses: { name: string; amount: number; timestamp: string }[];
}

export interface Job {
  id: string;
  title?: string;
  caseName: string;
  description: string;
  reward: number;
  reputationRequired: number;
  infoCost: number;
  timeLimit: number | null;
  risk: 'low' | 'medium' | 'high';
  roomTemplateId: 'room_antique' | 'room_ballerina' | 'room_banker' | 'room_captain';
  completed: boolean;
  leadPurchased?: boolean;
}

export interface StoryState {
  mode: 'sandbox' | 'story';
  chapter: number; // 1, 2, 3
  currentLocationId: 'pier' | 'warehouse'; // for Chapter 2 multi-location transitions
  completedChapters: number[];
}

export interface GameState {
  currentClues: Clue[];
  foundClueIds: string[];
  inventory: string[]; // PuzzleItem IDs
  objects: Record<ObjectId, ObjectState>;
  safeCode: string;
  activeDialogue: {
    sender: 'detective' | 'cat' | 'system';
    text: string;
    mood?: string;
  } | null;
  catPosition: ObjectId | 'center';
  catAction: 'idle' | 'walking' | 'scratching' | 'jumping' | 'pushing' | 'meowing';
  isMuted: boolean;
  gameStatus: 'intro' | 'playing' | 'won' | 'lost' | 'sandbox_dashboard'; // added lost state and sandbox_dashboard
  logs: GameLog[];
  solvedSteps: string[]; // for tracking what was completed
  roomInfo: RoomInfo;
  economy: EconomyState;
  storyState: StoryState;
  customItems?: Record<string, PuzzleItem>;
  pendingVictory?: boolean;
  reputation?: number; // reputation level
  timerActive?: boolean; // ticking clock active for this case
  timeLeft?: number; // seconds left
  timerMax?: number; // initial time limit in seconds
  isInjured?: boolean; // cat is injured and moves slower or needs treatment
  hasCatnipSenses?: boolean; // active catnip effect
  revealedObjects?: ObjectId[]; // objects whose contents are highlighted/known
  // Calendar & Campaign Sandbox fields
  currentDay?: number;
  availableJobs?: Job[];
  activeJob?: Job | null;
  daysSurvived?: number;
  campaignChapters?: Job[];
}
