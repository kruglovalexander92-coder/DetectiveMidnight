import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState } from '../types';
import * as Lucide from 'lucide-react';
import { gameAudio } from '../utils/AudioEngine';
import PhotoCompositeViewer from './PhotoCompositeViewer';

interface NeuroInterrogationProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  initialActiveSketchId?: string;
}

interface Personality {
  temper: number;
  aggressiveness: number;
  romanticness: number;
  education: number;
}

interface Desire {
  item: string;
  hint: string;
}

interface CaseQuestion {
  id: 'hair' | 'eyes' | 'mustache' | 'skin' | 'compare';
  text: string;
  answer: string;
  answered: boolean;
}

interface PhotoCompositeFeatures {
  hair: 'bald' | 'short' | 'curly' | 'tophat';
  eyes: 'glasses' | 'angry' | 'normal' | 'monocle';
  mustache: 'none' | 'gentleman' | 'beard' | 'pirate';
  skin: 'pale' | 'tanned' | 'fair';
}

interface NPCData {
  name: string;
  description: string;
  greeting: string;
  personality: Personality;
  interest: { topic: string; description: string };
  desires: Desire[];
  secret: string;
  caseQuestions: CaseQuestion[];
  photoFeatures: PhotoCompositeFeatures;
  playerComposite: PhotoCompositeFeatures;
}

interface DialogueOption {
  text: string;
  expectedDelta: string;
  topicHint?: string;
}

interface HistoryEntry {
  role: 'player' | 'npc';
  text: string;
}

type GamePhase = 'idle' | 'playing' | 'ended';
type Outcome = 'win' | 'lose' | 'timeout' | 'composite_match' | null;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const FEATURE_KEYWORDS: Record<string, Record<string, RegExp[]>> = {
  hair: {
    bald: [/лыс[^\s,.!?:;—–\-«»()]*/gi, /лысин[^\s,.!?:;—–\-«»()]*/gi],
    short: [/коротк[^\s,.!?:;—–\-«»()]*/gi, /стрижк[^\s,.!?:;—–\-«»()]*/gi],
    curly: [/кудр[^\s,.!?:;—–\-«»()]*/gi, /завит[^\s,.!?:;—–\-«»()]*/gi],
    tophat: [/цилиндр[^\s,.!?:;—–\-«»()]*/gi, /шляп[^\s,.!?:;—–\-«»()]*/gi, /котелок[^\s,.!?:;—–\-«»()]*/gi, /котелк[^\s,.!?:;—–\-«»()]*/gi],
  },
  eyes: {
    glasses: [/очк[^\s,.!?:;—–\-«»()]*/gi, /стекл[^\s,.!?:;—–\-«»()]*/gi, /оправ[^\s,.!?:;—–\-«»()]*/gi],
    angry: [/зл[^\s,.!?:;—–\-«»()]+/gi, /сердит[^\s,.!?:;—–\-«»()]*/gi, /нахмур[^\s,.!?:;—–\-«»()]*/gi, /гневн[^\s,.!?:;—–\-«»()]*/gi],
    normal: [/обычн[^\s,.!?:;—–\-«»()]*/gi, /нормальн[^\s,.!?:;—–\-«»()]*/gi],
    monocle: [/монокл[^\s,.!?:;—–\-«»()]*/gi],
  },
  mustache: {
    none: [/чист[^\s,.!?:;—–\-«»()]*/gi, /гладк[^\s,.!?:;—–\-«»()]*/gi, /без усов/gi, /без растительност[^\s,.!?:;—–\-«»()]*/gi],
    gentleman: [/ус[^\s,.!?:;—–\-«»()]+/gi, /аккуратн[^\s,.!?:;—–\-«»()]*/gi],
    beard: [/бород[^\s,.!?:;—–\-«»()]*/gi],
    pirate: [/пиратск[^\s,.!?:;—–\-«»()]*/gi, /длинн[^\s,.!?:;—–\-«»()]+/gi, /растрепанн[^\s,.!?:;—–\-«»()]*/gi],
  },
  skin: {
    pale: [/бледн[^\s,.!?:;—–\-«»()]*/gi, /бел[^\s,.!?:;—–\-«»()]+\s+как/gi],
    tanned: [/загорел[^\s,.!?:;—–\-«»()]*/gi, /бронзов[^\s,.!?:;—–\-«»()]*/gi, /смугл[^\s,.!?:;—–\-«»()]*/gi],
    fair: [/светл[^\s,.!?:;—–\-«»()]*/gi, /румян[^\s,.!?:;—–\-«»()]*/gi],
  },
};

function highlightKeywords(
  text: string,
  featureCategory: string,
  featureValue: string
): React.ReactNode {
  if (!text || !featureCategory || !featureValue) return text;

  const patterns = FEATURE_KEYWORDS[featureCategory]?.[featureValue];
  if (!patterns || patterns.length === 0) return text;

  const matches: Array<{ start: number; end: number }> = [];

  for (const pattern of patterns) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push({ start: match.index, end: match.index + match[0].length });
    }
  }

  if (matches.length === 0) return text;

  matches.sort((a, b) => a.start - b.start);

  const merged: Array<{ start: number; end: number }> = [];
  for (const m of matches) {
    if (merged.length === 0 || merged[merged.length - 1].end < m.start) {
      merged.push(m);
    } else {
      merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, m.end);
    }
  }

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  for (let i = 0; i < merged.length; i++) {
    const { start, end } = merged[i];
    if (start > lastIndex) {
      parts.push(text.slice(lastIndex, start));
    }
    parts.push(
      <span key={i} className="uppercase font-bold text-amber-300">
        {text.slice(start, end)}
      </span>
    );
    lastIndex = end;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

export default function NeuroInterrogation({
  gameState,
  setGameState,
  initialActiveSketchId
}: NeuroInterrogationProps) {
  const sketches = gameState.sketches ?? [];
  const [activeSketchId, setActiveSketchId] = useState<string>(initialActiveSketchId || (sketches[0]?.id || 'sketch_1'));

  useEffect(() => {
    if (initialActiveSketchId) {
      setActiveSketchId(initialActiveSketchId);
    }
  }, [initialActiveSketchId]);

  const [message, setMessage] = useState<{ text: string; type: 'info' | 'success' | 'error' } | null>(null);

  const [phase, setPhase] = useState<GamePhase>('idle');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [npc, setNpc] = useState<NPCData | null>(null);
  const [inventory, setInventory] = useState<string[]>([]);
  const [relationship, setRelationship] = useState(30);
  const [turn, setTurn] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [options, setOptions] = useState<DialogueOption[]>([]);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showCaseQuestions, setShowCaseQuestions] = useState(false);
  const [showComposite, setShowComposite] = useState(false);
  const [caseQuestions, setCaseQuestions] = useState<CaseQuestion[]>([]);
  const [thresholds, setThresholds] = useState({ q1: 40, q2: 65, q3: 90, q4: 95 });
  const [playerComposite, setPlayerComposite] = useState<PhotoCompositeFeatures>({
    hair: 'short',
    eyes: 'normal',
    mustache: 'none',
    skin: 'fair',
  });
  const [freeText, setFreeText] = useState('');
  const [lastDelta, setLastDelta] = useState<number | null>(null);
  const [lastReason, setLastReason] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sketchOutcomes, setSketchOutcomes] = useState<Record<string, Outcome>>({});

  const historyScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (historyScrollRef.current) {
      historyScrollRef.current.scrollTo({ 
        top: historyScrollRef.current.scrollHeight, 
        behavior: 'smooth' 
      });
    }
  }, [history.length]);

  const TURN_CAP = 15;

  const playClick = () => {
    try { gameAudio.playClick(); } catch (e) {}
  };

  const apiCall = useCallback(async (url: string, body: Record<string, unknown>) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || 'API error');
    }
    return res.json();
  }, []);

  const handleStartRound = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiCall('/api/npc/round/start', {});
      setSessionId(data.sessionId);
      setNpc(data.npc);
      setInventory(data.inventory);
      setRelationship(data.relationship);
      setTurn(0);
      setHistory([{ role: 'npc', text: data.npc.greeting }]);
      setOptions([]);
      setOutcome(null);
      setSecret(null);
      setCaseQuestions(data.caseQuestions || []);
      setThresholds(data.thresholds || { q1: 40, q2: 65, q3: 90, q4: 95 });
      setPlayerComposite(data.npc.playerComposite || { hair: 'short', eyes: 'normal', mustache: 'none', skin: 'fair' });
      setPhase('playing');
      setLastDelta(null);
      setLastReason(null);
      setShowInventory(false);
      setShowCaseQuestions(false);
      setFreeText('');
    } catch (err: any) {
      setError(err.message || 'Failed to start round');
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  const fetchOptions = useCallback(async () => {
    if (!sessionId) return;
    setLoadingOptions(true);
    try {
      const data = await apiCall('/api/npc/options', { sessionId });
      setOptions(shuffle(data.options));
    } catch (err: any) {
      setError(err.message || 'Failed to generate options');
    } finally {
      setLoadingOptions(false);
    }
  }, [sessionId, apiCall]);

  useEffect(() => {
    if (phase === 'playing' && sessionId && options.length === 0 && !loadingOptions) {
      fetchOptions();
    }
  }, [phase, sessionId, options.length, loadingOptions, fetchOptions]);

  const applyRoundOutcome = useCallback((finalOutcome: Outcome, finalNpc: NPCData | null, finalSecret: string | null, finalPlayerComposite: PhotoCompositeFeatures) => {
    if (!finalNpc) return;
    const currentSketch = sketches.find(s => s.id === activeSketchId);
    if (!currentSketch) return;

    if (finalOutcome === 'win' || finalOutcome === 'composite_match') {
      setGameState(prev => {
        const updatedSketches = (prev.sketches ?? []).map(s => {
          if (s.id === activeSketchId) {
            return {
              ...s,
              targetHair: finalNpc.photoFeatures.hair,
              targetEyes: finalNpc.photoFeatures.eyes,
              targetMustache: finalNpc.photoFeatures.mustache,
              targetSkin: finalNpc.photoFeatures.skin,
              currentHair: finalPlayerComposite.hair,
              currentEyes: finalPlayerComposite.eyes,
              currentMustache: finalPlayerComposite.mustache,
              currentSkin: finalPlayerComposite.skin,
              completed: true,
              accuracy: 100,
              rewardClaimed: false,
            };
          }
          return s;
        });

        return {
          ...prev,
          sketches: updatedSketches,
        };
      });
      setSketchOutcomes(prev => ({ ...prev, [activeSketchId]: finalOutcome }));
      try { gameAudio.playMeow(); } catch (e) {}
    }
  }, [activeSketchId, sketches, setGameState]);

  const handleTurn = useCallback(async (playerText: string, gaveItem: string | null) => {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiCall('/api/npc/turn', {
        sessionId,
        playerText,
        gaveItem,
      });

      setRelationship(data.relationship);
      setTurn(data.turn);
      setInventory(data.inventory);
      setHistory((prev) => [
        ...prev,
        { role: 'player', text: gaveItem ? `*передаёт ${gaveItem}*` : playerText },
        { role: 'npc', text: data.reply },
      ]);
      setLastDelta(data.relationshipDelta);
      setLastReason(data.reason);
      setOptions([]);
      setShowInventory(false);
      setShowCaseQuestions(false);
      setFreeText('');

      if (data.outcome) {
        setOutcome(data.outcome);
        setSecret(data.secret);
        setPhase('ended');
        applyRoundOutcome(data.outcome, npc, data.secret, playerComposite);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process turn');
    } finally {
      setLoading(false);
    }
  }, [sessionId, apiCall, npc, playerComposite, applyRoundOutcome]);

  const handleOptionClick = (index: number) => {
    if (loading || phase !== 'playing') return;
    const option = options[index];
    if (!option) return;
    handleTurn(option.text, null);
  };

  const handleGiveClick = () => {
    if (loading || phase !== 'playing') return;
    if (inventory.length === 0) return;
    setShowInventory(true);
    setShowCaseQuestions(false);
  };

  const handleInventorySelect = (itemIndex: number) => {
    if (itemIndex < 0 || itemIndex >= inventory.length) return;
    const item = inventory[itemIndex];
    setShowInventory(false);
    handleTurn('', item);
  };

  const handleFreeTextSubmit = () => {
    if (loading || phase !== 'playing' || freeText.trim().length === 0) return;
    handleTurn(freeText.trim(), null);
  };

  const handleAskQuestion = async (questionId: 'hair' | 'eyes' | 'mustache' | 'skin' | 'compare') => {
    if (!sessionId || loading || phase !== 'playing') return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiCall('/api/npc/ask', { sessionId, questionId });
      
      if (questionId === 'compare') {
        setRelationship(data.relationship);
        setTurn(data.turn);
        if (data.relationshipDelta === 0) {
          setLastDelta(null);
          setLastReason(null);
        } else {
          setLastDelta(data.relationshipDelta);
          setLastReason(`Фоторобот: точность ${data.accuracy}%`);
        }
        setShowCaseQuestions(false);
        setShowInventory(false);
        
        setHistory(prev => [
          ...prev,
          { role: 'player', text: '[Сравнение фоторобота]' },
          { role: 'npc', text: data.feedback }
        ]);
        
        if (data.outcome) {
          setOutcome(data.outcome);
          setSecret(data.secret);
          setPhase('ended');
          applyRoundOutcome(data.outcome, npc, data.secret, playerComposite);
        }
        return;
      }
      
      setCaseQuestions(prev => prev.map(q => 
        q.id === questionId ? { ...q, answered: true } : q
      ));
      
      setRelationship(data.relationship);
      setTurn(data.turn);
      if (data.relationshipDelta === 0) {
        setLastDelta(null);
        setLastReason(null);
      } else {
        setLastDelta(data.relationshipDelta);
        setLastReason(`Вопрос по делу: -${Math.abs(data.relationshipDelta)}`);
      }
      setShowCaseQuestions(false);
      setShowInventory(false);
      
      const question = caseQuestions.find(q => q.id === questionId);
      if (question) {
        setHistory(prev => [
          ...prev,
          { role: 'player', text: `[Вопрос по делу]: ${question.text}` },
          { role: 'npc', text: data.answer }
        ]);
      }
      
      if (data.outcome) {
        setOutcome(data.outcome);
        setSecret(data.secret);
        setPhase('ended');
        applyRoundOutcome(data.outcome, npc, data.secret, playerComposite);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to ask question');
      setShowCaseQuestions(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCompositeUpdate = async (feature: keyof PhotoCompositeFeatures, value: string) => {
    if (!sessionId || loading || phase !== 'playing') return;
    const prevComposite = { ...playerComposite };
    setPlayerComposite(prev => ({ ...prev, [feature]: value }));
    try {
      await apiCall('/api/npc/composite/update', { sessionId, feature, value });
    } catch (err: any) {
      setError(err.message || 'Failed to update composite');
      setPlayerComposite(prevComposite);
    }
  };

  const handleCaseQuestionsClick = () => {
    if (loading || phase !== 'playing') return;
    setShowCaseQuestions(true);
    setShowInventory(false);
  };

  const pct = (x: number) => `${Math.round(x * 100)}%`;
  const deltaColor = (d: number) => {
    if (d > 0) return 'text-emerald-400';
    if (d < 0) return 'text-red-400';
    return 'text-white/40';
  };
  const deltaSign = (d: number) => (d >= 0 ? '+' : '');

  const currentSketch = sketches.find(s => s.id === activeSketchId) || sketches[0];
  if (!currentSketch) return null;

  const claimReward = () => {
    playClick();
    if (!currentSketch.completed || currentSketch.rewardClaimed) return;
    const sketchOutcome = sketchOutcomes[activeSketchId];

    setGameState(prev => {
      let currentCash = prev.economy?.cash ?? 150;
      let currentRep = prev.reputation ?? 0;
      const logs = [...prev.logs];

      if (sketchOutcome === 'win') {
        if (activeSketchId === 'sketch_1') {
          currentCash += 50;
          currentRep += 10;
          logs.push({
            id: `log_sketch_reward_1_${Date.now()}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sender: 'system',
            text: `Фоторобот «Шляпника» завершен! Получено 50$ и +10★ репутации за раскрытие сообщника!`
          });
        } else if (activeSketchId === 'sketch_2') {
          currentCash += 70;
          currentRep += 15;
          logs.push({
            id: `log_sketch_reward_2_${Date.now()}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sender: 'system',
            text: `Фоторобот «Якоря» завершен! Получено 70$ и +15★ репутации. Стоимость улик в делах снижена!`
          });
        } else {
          currentCash += 150;
          currentRep += 25;
          logs.push({
            id: `log_sketch_reward_3_${Date.now()}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sender: 'system',
            text: `Фоторобот Барона Сен-Клера завершен! Выплачена госпремия 150$ и орден почета Скотленд-Ярда (+25★)!`
          });
        }
      } else if (sketchOutcome === 'composite_match') {
        if (activeSketchId === 'sketch_1') {
          currentCash += 25;
          logs.push({
            id: `log_sketch_partial_1_${Date.now()}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sender: 'system',
            text: `Фоторобот «Шляпника» составлен! Получено 25$. Свидетель не раскрыл всех деталей...`
          });
        } else if (activeSketchId === 'sketch_2') {
          currentCash += 35;
          logs.push({
            id: `log_sketch_partial_2_${Date.now()}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sender: 'system',
            text: `Фоторобот «Якоря» составлен! Получено 35$. Свидетель не раскрыл всех деталей...`
          });
        } else {
          currentCash += 75;
          logs.push({
            id: `log_sketch_partial_3_${Date.now()}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sender: 'system',
            text: `Фоторобот Барона Сен-Клера составлен! Получено 75$. Свидетель не раскрыл всех деталей...`
          });
        }
      }

      const updatedSketches = (prev.sketches ?? []).map(s => {
        if (s.id === activeSketchId) {
          return { ...s, rewardClaimed: true };
        }
        return s;
      });

      return {
        ...prev,
        reputation: currentRep,
        economy: {
          ...(prev.economy ?? { cash: 150, leadPrice: 40 }),
          cash: currentCash
        },
        sketches: updatedSketches,
        logs
      };
    });

    setMessage({
      text: `Награда за поимку сообщника успешно начислена на счет вашего бюро! Преступный синдикат несет тяжелые потери!`,
      type: 'success'
    });
  };

  return (
    <div className="w-full flex flex-col gap-4 animate-fade-in text-white/90">
      
      {/* Upper Navigation of Suspects */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 shrink-0 select-none">
        {sketches.map((sketch) => {
          const isActive = sketch.id === activeSketchId;
          return (
            <button
              key={sketch.id}
              onClick={() => {
                playClick();
                setActiveSketchId(sketch.id);
                setMessage(null);
                setPhase('idle');
                setSessionId(null);
                setNpc(null);
                setOutcome(null);
              }}
              className={`py-2 px-1.5 border text-center transition-all cursor-pointer flex flex-col justify-center items-center relative ${
                isActive
                  ? 'border-amber-500 bg-amber-950/20 text-white'
                  : 'border-white/5 bg-black/40 text-white/55 hover:border-white/10 hover:bg-black/60'
              }`}
            >
              <div className="absolute top-1 right-1">
                {sketch.completed ? (
                  <Lucide.CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 fill-black/60" />
                ) : (
                  <Lucide.HelpCircle className="w-3.5 h-3.5 text-white/25" />
                )}
              </div>
              <span className="font-serif text-[10px] font-black tracking-wide truncate max-w-full">
                {sketch.name}
              </span>
              <span className="font-mono text-[6.5px] text-white/40 uppercase mt-0.5 tracking-wider">
                Свидетель: {sketch.witnessName.split(' ')[1] || sketch.witnessName}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main interrogation area */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch">
        {/* LEFT: NPC Info + Dialogue */}
        <div className="md:col-span-7 border border-amber-950/40 bg-[#0d0907] p-4 flex flex-col relative shadow-xl">
          <div className="absolute inset-1 border border-white/5 pointer-events-none" />

          <div className="relative z-10 flex flex-col h-full">
            <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-3">
              <span className="font-mono text-[7.5px] text-amber-500 font-bold uppercase tracking-widest">
                🗣️ КОМНАТА ДОПРОСА СВИДЕТЕЛЕЙ
              </span>
              <span className="font-sans text-[8px] text-white/30 uppercase">
                Дело синдиката
              </span>
            </div>

            {phase === 'idle' ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center py-8">
                <div className="w-16 h-16 border border-amber-500/20 bg-amber-950/20 flex items-center justify-center">
                  <Lucide.MessageCircle className="w-8 h-8 text-amber-500/80" />
                </div>
                <div>
                  <h3 className="font-serif text-sm font-black text-amber-100 uppercase tracking-wide">
                    ДОПРОС СВИДЕТЕЛЯ
                  </h3>
                  <p className="font-serif italic text-[10px] text-white/50 mt-2 max-w-sm">
                    Свидетель: {currentSketch.witnessName}
                  </p>
                  <p className="font-serif italic text-[10px] text-white/40 mt-1 max-w-sm">
                    Поговорите со свидетелем, повысьте уровень отношений до 100 и составьте фоторобот на 100%, чтобы раскрыть личность преступника.
                  </p>
                </div>
                <button
                  onClick={() => {
                    playClick();
                    handleStartRound();
                  }}
                  disabled={loading}
                  className="w-full max-w-xs h-10 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-sans text-[10px] font-bold uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-2 cursor-pointer shadow"
                >
                  {loading ? (
                    <Lucide.Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Lucide.Play className="w-4 h-4" />
                  )}
                  {loading ? (
                    <>Генерация<span className="loading-dots"><span className="loading-dot">.</span><span className="loading-dot">.</span><span className="loading-dot">.</span></span></>
                  ) : 'Начать допрос'}
                </button>
                {error && (
                  <div className="border border-red-500/20 bg-red-950/15 p-3 text-red-200 font-serif text-[10px]">
                    {error}
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* NPC Info */}
                {npc && (
                  <div className="border border-white/5 bg-black/40 p-3 mb-3 flex gap-3 items-start">
                    <div className="w-10 h-10 border border-amber-500/10 bg-amber-950/20 flex items-center justify-center shrink-0">
                      <Lucide.UserCircle className="w-6 h-6 text-amber-500/80" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-mono text-[7px] text-white/40 block leading-none">СВИДЕТЕЛЬ:</span>
                      <div className="font-serif text-xs font-bold text-amber-100 mt-1">{npc.name}</div>
                      <p className="font-serif italic text-[10px] text-white/50 mt-0.5 leading-relaxed">
                        {npc.description}
                      </p>
                      <div className="flex gap-2 mt-1.5 flex-wrap">
                        <span className="font-mono text-[7px] text-white/30">Вспыльчивость: {pct(npc.personality.temper)}</span>
                        <span className="font-mono text-[7px] text-white/30">Агрессия: {pct(npc.personality.aggressiveness)}</span>
                        <span className="font-mono text-[7px] text-white/30">Романтика: {pct(npc.personality.romanticness)}</span>
                        <span className="font-mono text-[7px] text-white/30">Образование: {pct(npc.personality.education)}</span>
                      </div>
                      <div className="mt-1">
                        <span className="font-mono text-[7px] text-amber-500/60">Интерес: {npc.interest.topic}</span>
                      </div>
                      {npc.desires.length > 0 && (
                        <div className="mt-0.5">
                          <span className="font-mono text-[7px] text-white/30">Намёки: {npc.desires.map((d) => d.hint).join('; ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Relationship bar */}
                <div className="flex items-center gap-2 mb-3">
                  <Lucide.Heart className="w-3.5 h-3.5 text-red-400" />
                  <div className="flex-1 h-2 bg-black/60 border border-white/10 relative">
                    <div
                      className="h-full bg-gradient-to-r from-red-600 to-emerald-500 transition-all duration-500"
                      style={{ width: `${Math.max(0, Math.min(100, relationship))}%` }}
                    />
                  </div>
                  <span className="font-mono text-[9px] text-white/60 w-8 text-right">{relationship}</span>
                  <span className="font-mono text-[8px] text-white/40">Ход {turn}/{TURN_CAP}</span>
                </div>

                {/* Dialogue History */}
                <div className="flex-1 overflow-y-auto custom-scrollbar mb-3">
                  <span className="font-mono text-[7px] text-white/30 uppercase tracking-widest block mb-1.5">
                    ПРОТОКОЛ ДИАЛОГА:
                  </span>
                  <div className="relative">
                    <div ref={historyScrollRef} className="bg-black/30 border border-white/5 p-2 space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar">
                      {history.map((h, idx) => (
                        <div key={idx} className={`text-[10.5px] leading-relaxed ${h.role === 'npc' ? 'text-amber-100/80' : 'text-white/60'}`}>
                          <span className={`font-mono text-[8px] mr-1 ${h.role === 'npc' ? 'text-amber-500/70' : 'text-emerald-400/70'}`}>
                            [{h.role === 'npc' ? npc?.name : 'Ты'}]:
                          </span>
                          <span className="font-serif italic">{h.text}</span>
                        </div>
                      ))}
                    </div>
                    {loading && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                        <Lucide.Loader2 className="w-5 h-5 text-amber-500/50 animate-spin" />
                        <span className="font-mono text-[8px] text-white/30 mt-1">
                          Генерация ответа<span className="loading-dots"><span className="loading-dot">.</span><span className="loading-dot">.</span><span className="loading-dot">.</span></span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Last delta indicator */}
                {lastDelta !== null && (
                  <div className="border-t border-white/5 pt-2 mb-3 flex items-center gap-2">
                    <span className={`font-mono text-[9px] font-bold ${deltaColor(lastDelta)}`}>
                      {deltaSign(lastDelta)}{lastDelta}
                    </span>
                    {lastReason && (
                      <span className="font-mono text-[8px] text-white/30 italic">({lastReason})</span>
                    )}
                  </div>
                )}

                {/* Case Answers Panel */}
                {caseQuestions.some(q => q.answered) && (
                  <div className="border-t border-purple-500/20 pt-3 mt-3">
                    <span className="font-mono text-[7px] text-purple-400 uppercase tracking-widest block mb-1.5">
                      УЛИКИ ПО ДЕЛУ:
                    </span>
                    <div className="bg-purple-950/10 border border-purple-500/10 p-2 space-y-1.5">
                      {caseQuestions.filter(q => q.answered).map((q) => (
                        <div key={q.id} className="text-[10px] leading-relaxed">
                          <span className="font-mono text-[8px] text-purple-400/70 block">{q.text}:</span>
                          <span className="font-serif italic text-purple-100/80">
                            {highlightKeywords(q.answer, q.id, npc?.photoFeatures?.[q.id as keyof PhotoCompositeFeatures] || '')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* RIGHT: Actions */}
        <div className="md:col-span-5 border border-amber-950/40 bg-[#070708] p-4 flex flex-col relative shadow-xl">
          <div className="absolute inset-1 border border-white/5 pointer-events-none" />

          <div className="relative z-10 flex flex-col h-full">
            <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-3">
              <span className="font-mono text-[7.5px] text-amber-500 font-bold uppercase tracking-widest">
                ВАРИАНТЫ ДЕЙСТВИЙ
              </span>
            </div>

            {phase === 'ended' ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
                {outcome === 'win' && (
                  <>
                    <Lucide.Trophy className="w-10 h-10 text-emerald-400" />
                    <div className="font-serif text-sm font-bold text-emerald-200">
                      Секрет раскрыт!
                    </div>
                    <div className="bg-[#120e0c] border-l-2 border-emerald-500 p-3 w-full">
                      <p className="font-serif italic text-[11px] leading-relaxed text-white/80">
                        {secret}
                      </p>
                    </div>
                    {npc && (
                      <div className="w-full border border-white/5 bg-black/30 p-3">
                        <PhotoCompositeViewer
                          composite={npc.photoFeatures}
                          onUpdate={() => {}}
                          disabled={true}
                        />
                      </div>
                    )}
                  </>
                )}
                {outcome === 'lose' && (
                  <>
                    <Lucide.XCircle className="w-10 h-10 text-red-400" />
                    <div className="font-serif text-sm font-bold text-red-200">
                      Отношения обнулены...
                    </div>
                    <p className="font-serif italic text-[10px] text-white/50">
                      {npc?.name} больше не желает с тобой говорить.
                    </p>
                  </>
                )}
                {outcome === 'timeout' && (
                  <>
                    <Lucide.Clock className="w-10 h-10 text-amber-400" />
                    <div className="font-serif text-sm font-bold text-amber-200">
                      Время вышло
                    </div>
                    <p className="font-serif italic text-[10px] text-white/50">
                      Финальный уровень отношений: {relationship}/100
                    </p>
                  </>
                )}
                {outcome === 'composite_match' && (
                  <>
                    <Lucide.ScanEye className="w-10 h-10 text-cyan-400" />
                    <div className="font-serif text-sm font-bold text-cyan-200">
                      Фоторобот составлен!
                    </div>
                    <p className="font-serif italic text-[10px] text-white/50">
                      Вы правильно опознали подозреваемого, но не заслужили его доверия. Получена уменьшенная награда.
                    </p>
                  </>
                )}
                <button
                  onClick={() => {
                    playClick();
                    setPhase('idle');
                    setSessionId(null);
                    setNpc(null);
                    setOutcome(null);
                  }}
                  className="w-full h-9 bg-amber-600 hover:bg-amber-500 text-white font-sans text-[10px] font-bold uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow mt-2"
                >
                  <Lucide.RotateCcw className="w-3.5 h-3.5" />
                  Вернуться
                </button>
              </div>
            ) : phase === 'playing' ? (
              <>
                {error && (
                  <div className="border border-red-500/20 bg-red-950/15 p-2 text-red-200 font-serif text-[10px] mb-2">
                    {error}
                  </div>
                )}

                {showInventory ? (
                  <div className="flex-1 flex flex-col gap-2">
                    <span className="font-mono text-[8px] text-white/30 uppercase block">
                      Выбери предмет для подарка:
                    </span>
                    {inventory.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleInventorySelect(idx)}
                        disabled={loading}
                        className="p-2 border border-white/5 bg-black/30 hover:border-amber-500/40 hover:bg-amber-950/15 text-left font-serif text-[10.5px] text-amber-100/80 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Lucide.Gift className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        {item}
                      </button>
                    ))}
                    <button
                      onClick={() => setShowInventory(false)}
                      className="p-2 border border-white/5 bg-black/30 hover:border-white/20 text-left font-serif text-[10.5px] text-white/40 flex items-center gap-2 transition-all cursor-pointer mt-1"
                    >
                      <Lucide.ArrowLeft className="w-3.5 h-3.5" />
                      Назад
                    </button>
                  </div>
                ) : showCaseQuestions ? (
                  <div className="flex-1 flex flex-col gap-2">
                    <span className="font-mono text-[8px] text-white/30 uppercase block">
                      Вопросы по делу:
                    </span>
                    {(() => {
                      const answeredInfoCount = caseQuestions.filter(cq => cq.id !== 'compare' && cq.answered).length;
                      return caseQuestions.map((q) => {
                        if (q.id === 'compare') {
                          return (
                            <button
                              key={q.id}
                              onClick={() => handleAskQuestion('compare')}
                              disabled={loading}
                              className="p-2 border border-cyan-500/20 bg-cyan-950/10 hover:border-cyan-500/40 hover:bg-cyan-950/20 text-left font-serif text-[10.5px] text-cyan-200/80 flex items-start gap-2 transition-all cursor-pointer disabled:opacity-50"
                            >
                              <Lucide.ScanEye className="w-3.5 h-3.5 shrink-0 mt-0.5 text-cyan-400" />
                              <span className="flex-1">
                                {q.text}
                                <span className="block text-[8px] text-white/30 mt-0.5">
                                  Сравнить текущий фоторобот с подозреваемым
                                </span>
                              </span>
                            </button>
                          );
                        }
                        
                        const threshold = answeredInfoCount === 0 ? thresholds.q1 
                          : answeredInfoCount === 1 ? thresholds.q2 
                          : answeredInfoCount === 2 ? thresholds.q3 
                          : answeredInfoCount === 3 ? thresholds.q4 
                          : Infinity;
                        const isAvailable = !q.answered && relationship >= threshold;
                        const isLocked = !q.answered && relationship < threshold;
                        
                        return (
                          <button
                            key={q.id}
                            onClick={() => isAvailable && handleAskQuestion(q.id)}
                            disabled={loading || !isAvailable}
                            className={`p-2 border text-left font-serif text-[10.5px] flex items-start gap-2 transition-all ${
                              q.answered
                                ? 'border-white/5 bg-black/20 text-white/30 line-through cursor-not-allowed'
                                : isLocked
                                ? 'border-white/5 bg-black/20 text-white/20 cursor-not-allowed'
                                : 'border-purple-500/20 bg-purple-950/10 hover:border-purple-500/40 hover:bg-purple-950/20 text-purple-200/80 cursor-pointer disabled:opacity-50'
                            }`}
                          >
                            <Lucide.FileQuestion className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                              q.answered ? 'text-white/20' : isLocked ? 'text-white/15' : 'text-purple-400'
                            }`} />
                            <span className="flex-1">
                              {q.text}
                              {isLocked && (
                                <span className="block text-[8px] text-white/30 mt-0.5">
                                  Требуется отношений: {threshold}
                                </span>
                              )}
                            </span>
                          </button>
                        );
                      });
                    })()}
                    
                    <button
                      onClick={() => setShowComposite(!showComposite)}
                      className="p-2 border border-amber-500/20 bg-amber-950/10 hover:border-amber-500/40 hover:bg-amber-950/20 text-left font-serif text-[10.5px] text-amber-200/80 flex items-center gap-2 transition-all cursor-pointer mt-1"
                    >
                      <Lucide.UserCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      {showComposite ? 'Скрыть фоторобот' : 'Показать фоторобот'}
                    </button>
                    
                    {showComposite && (
                      <div className="border border-white/5 bg-black/30 p-3">
                        <PhotoCompositeViewer
                          composite={playerComposite}
                          onUpdate={handleCompositeUpdate}
                          disabled={loading}
                        />
                      </div>
                    )}
                    
                    <button
                      onClick={() => setShowCaseQuestions(false)}
                      className="p-2 border border-white/5 bg-black/30 hover:border-white/20 text-left font-serif text-[10.5px] text-white/40 flex items-center gap-2 transition-all cursor-pointer mt-1"
                    >
                      <Lucide.ArrowLeft className="w-3.5 h-3.5" />
                      Назад
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="space-y-1">
                      {loadingOptions ? (
                        <div className="text-center py-4">
                          <Lucide.Loader2 className="w-5 h-5 text-amber-500/50 animate-spin mx-auto" />
                          <span className="font-mono text-[8px] text-white/30 block mt-1">
                            Генерация вариантов<span className="loading-dots"><span className="loading-dot">.</span><span className="loading-dot">.</span><span className="loading-dot">.</span></span>
                          </span>
                        </div>
                      ) : (
                        options.map((opt, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleOptionClick(idx)}
                            disabled={loading}
                            className="w-full p-2 border border-white/5 bg-black/30 hover:border-amber-500/40 hover:bg-amber-950/15 text-left font-serif text-[10.5px] text-amber-100/80 flex items-start gap-2 transition-all cursor-pointer disabled:opacity-50"
                          >
                            <span className="font-mono text-[8px] text-amber-500/60 shrink-0 mt-0.5">
                              /{idx + 1}
                            </span>
                            <span>{opt.text}</span>
                          </button>
                        ))
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <button
                        onClick={handleGiveClick}
                        disabled={loading || inventory.length === 0}
                        className="p-2 border border-cyan-500/20 bg-cyan-950/10 hover:border-cyan-500/40 hover:bg-cyan-950/20 text-left font-serif text-[10px] text-cyan-200/80 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-30"
                      >
                        <Lucide.Gift className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        /8 Подарить
                      </button>
                      <button
                        onClick={handleCaseQuestionsClick}
                        disabled={loading}
                        className="p-2 border border-purple-500/20 bg-purple-950/10 hover:border-purple-500/40 hover:bg-purple-950/20 text-left font-serif text-[10px] text-purple-200/80 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-30"
                      >
                        <Lucide.HelpCircle className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        /9 По делу
                      </button>
                    </div>

                    <div className="mt-auto pt-2 border-t border-white/5">
                      <span className="font-mono text-[7px] text-white/30 uppercase block mb-1">
                        Или введи свой текст:
                      </span>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={freeText}
                          onChange={(e) => setFreeText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleFreeTextSubmit()}
                          disabled={loading}
                          placeholder="Скажи что-нибудь..."
                          className="flex-1 bg-black/40 border border-white/10 px-2 py-1.5 font-serif text-[10px] text-white/80 placeholder:text-white/20 focus:outline-none focus:border-amber-500/40 disabled:opacity-50"
                        />
                        <button
                          onClick={handleFreeTextSubmit}
                          disabled={loading || freeText.trim().length === 0}
                          className="px-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-30 text-white font-sans text-[8px] font-bold uppercase tracking-wider cursor-pointer transition-all"
                        >
                          <Lucide.Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Message panel */}
      {message && (
        <div className={`p-3 border text-xs leading-relaxed font-serif relative ${
          message.type === 'success'
            ? 'border-emerald-500/20 bg-emerald-950/15 text-emerald-200'
            : message.type === 'error'
              ? 'border-red-500/20 bg-red-950/15 text-red-200'
              : 'border-blue-500/20 bg-blue-950/15 text-blue-200'
        }`}>
          <p>{message.text}</p>
        </div>
      )}

      {/* Dossier profile & Unlocked benefits */}
      <div className="border border-white/10 bg-[#090807] p-4 flex flex-col md:flex-row justify-between items-stretch gap-4 select-none">
        <div className="flex-1">
          <span className="font-mono text-[7px] text-white/30 uppercase tracking-[0.25em] block mb-1">
            РАССЛЕДОВАНИЕ СГОВОРЩИКОВ СИНДИКАТА
          </span>
          <h4 className="font-serif text-sm font-black text-amber-100 flex items-center gap-1.5 uppercase">
            <Lucide.FolderClosed className="w-4 h-4 text-amber-500" />
            {currentSketch.completed ? currentSketch.name : 'ФИГУРАНТ НЕ ИДЕНТИФИЦИРОВАН'}
          </h4>
          <p className="font-serif italic text-[11px] leading-relaxed text-stone-400 mt-1 max-w-2xl">
            {currentSketch.completed 
              ? `«Данный преступник был успешно опознан по зарисовке. Под прессингом доказательств он дал показания детективу Барту, снижая оперативные издержки!»` 
              : `«Поговорите со свидетелем, составьте фоторобот и раскройте личность преступника!»`
            }
          </p>
        </div>

        <div className="w-full md:w-64 border-l border-white/5 pl-0 md:pl-4 flex flex-col justify-between">
          <div>
            <span className="font-mono text-[7px] text-white/30 uppercase block mb-1">ГРАНТ И ПРЕФЕРЕНЦИЯ:</span>
            <div className="font-sans text-[10px] text-amber-400/90 leading-tight font-bold">
              • {currentSketch.unlockedHint}
            </div>
          </div>

          <div className="mt-3">
            {currentSketch.completed ? (
              <button
                disabled={currentSketch.rewardClaimed}
                onClick={claimReward}
                className={`w-full h-8 font-sans text-[9px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  currentSketch.rewardClaimed
                    ? 'border border-white/5 bg-black/40 text-white/20 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow'
                }`}
              >
                <Lucide.Gift className="w-3.5 h-3.5" />
                {currentSketch.rewardClaimed ? 'Награда получена' : 'Забрать награду'}
              </button>
            ) : (
              <div className="w-full h-8 border border-white/5 bg-black/40 text-white/25 text-[8.5px] uppercase font-mono tracking-widest flex items-center justify-center gap-1">
                <Lucide.Lock className="w-3 h-3" /> Требуется 100% точности
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
