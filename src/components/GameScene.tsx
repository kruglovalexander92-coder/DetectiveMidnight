/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { ObjectId, ObjectState, GameState } from '../types';
import { gameAudio } from '../utils/AudioEngine';

interface GameSceneProps {
  gameState: GameState;
  onObjectInteraction: (id: ObjectId, action: string) => void;
  onEnterSafeCode: (code: string) => boolean;
  onChangeLocation?: (location: 'pier' | 'warehouse') => void;
}

export default function GameScene({
  gameState,
  onObjectInteraction,
  onEnterSafeCode,
  onChangeLocation
}: GameSceneProps) {
  const { objects, catPosition, catAction, safeCode, foundClueIds } = gameState;
  const [lightning, setLightning] = useState(false);

  // Dynamic Coordinates for cat placements (percentages from left and top of container)
  const getCatSpot = (spot: string) => {
    if (spot === 'center') return { x: 45, y: 84, height: 'h-16' };
    const obj = objects[spot as ObjectId];
    if (!obj) return { x: 45, y: 84, height: 'h-16' };
    
    const x = obj.x ? obj.x + (obj.w || 10) / 2 : 45;
    let y = 84;
    let height = 'h-14';
    
    if (spot === 'bookshelf') {
      y = obj.y ? obj.y + 16 : 44;
    } else if (spot === 'desk') {
      y = obj.y ? obj.y + 12 : 66.5;
    } else if (spot === 'safe') {
      y = obj.y ? obj.y + 10 : 66;
    } else if (spot === 'painting') {
      y = obj.y ? obj.y + 10 : 42;
    } else if (spot === 'fishbowl') {
      y = obj.y ? obj.y + 8 : 66.5;
      height = 'h-12';
    } else if (spot === 'rug') {
      height = 'h-16';
    }
    
    return { x, y, height };
  };

  // Multi-room visibility rules for Chapter 2
  const isChapter2 = gameState.storyState?.mode === 'story' && gameState.storyState?.chapter === 2;
  const currentLocation = gameState.storyState?.currentLocationId || 'pier';

  const isVisible = (id: ObjectId) => {
    if (!isChapter2) return true;
    if (currentLocation === 'pier') {
      return ['rug', 'trashcan', 'painting', 'fishbowl'].includes(id);
    } else {
      return ['bookshelf', 'desk', 'safe', 'lamp'].includes(id);
    }
  };
  
  // Safe combination lock state
  const [showSafeLock, setShowSafeLock] = useState(false);
  const [safeDigits, setSafeDigits] = useState<number[]>([1, 1, 1]);
  const [safeError, setSafeError] = useState(false);
  const [safeSuccess, setSafeSuccess] = useState(false);

  // Reset local safe dials when a new case begins (target safeCode shifts)
  useEffect(() => {
    setSafeDigits([1, 1, 1]);
  }, [safeCode]);

  // --- DETECTIVE INTERACTION & ANIMATION STATES ---
  const [detectiveX, setDetectiveX] = useState(24);
  const [detectiveState, setDetectiveState] = useState<'idle' | 'walking'>('idle');
  const [detectiveFacingLeft, setDetectiveFacingLeft] = useState(false);
  const [detectiveTransition, setDetectiveTransition] = useState('left 1000ms ease-in-out');
  const detectiveWalkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Map object to X coordinates for references
  const objectCoords: Record<ObjectId, number> = {
    bookshelf: objects.bookshelf.x ?? 4,
    painting: objects.painting.x ?? 25,
    rug: objects.rug.x ?? 28,
    desk: objects.desk.x ?? 43,
    fishbowl: objects.fishbowl.x ?? 48,
    lamp: objects.lamp.x ?? 74,
    trashcan: objects.trashcan.x ?? 80,
    safe: objects.safe.x ?? 87,
  };

  // Strategic positions for the detective to stand close to objects without overlapping
  const getDetectiveTargetX = (spot: string) => {
    if (spot === 'center') return 24;
    switch (spot) {
      case 'bookshelf': return 14;
      case 'painting': return 35;
      case 'rug': return 36;
      case 'desk': return 52;
      case 'fishbowl': return 56;
      case 'lamp': return 65;
      case 'trashcan': return 71;
      case 'safe': return 78;
      default: return 24;
    }
  };

  // Sync Detective position with active cat target
  useEffect(() => {
    if (catPosition === 'center') return;
    
    const targetX = getDetectiveTargetX(catPosition);
    
    if (detectiveWalkTimeoutRef.current) {
      clearTimeout(detectiveWalkTimeoutRef.current);
    }
    
    setDetectiveX(prev => {
      const distance = Math.abs(targetX - prev);
      if (distance < 1) {
        setDetectiveFacingLeft(targetX < prev);
        return prev;
      }
      
      const duration = Math.max(600, distance * 22); // dynamic walk duration
      setDetectiveTransition(`left ${duration}ms linear`);
      setDetectiveFacingLeft(targetX < prev);
      setDetectiveState('walking');
      
      detectiveWalkTimeoutRef.current = setTimeout(() => {
        setDetectiveState('idle');
      }, duration);
      
      return targetX;
    });
    
    return () => {
      if (detectiveWalkTimeoutRef.current) {
        clearTimeout(detectiveWalkTimeoutRef.current);
      }
    };
  }, [catPosition]);

  // Sync Detective room entry walk on transition
  useEffect(() => {
    if (!isChapter2) return;
    
    if (detectiveWalkTimeoutRef.current) {
      clearTimeout(detectiveWalkTimeoutRef.current);
    }
    
    if (currentLocation === 'warehouse') {
      // Walk in from the left door
      setDetectiveX(-10);
      setDetectiveFacingLeft(false);
      setDetectiveState('idle');
      
      const t1 = setTimeout(() => {
        setDetectiveTransition('left 1200ms linear');
        setDetectiveState('walking');
        setDetectiveX(18);
        
        detectiveWalkTimeoutRef.current = setTimeout(() => {
          setDetectiveState('idle');
        }, 1200);
      }, 100);
      
      return () => {
        clearTimeout(t1);
        if (detectiveWalkTimeoutRef.current) clearTimeout(detectiveWalkTimeoutRef.current);
      };
    } else {
      // Walk in from the right edge
      setDetectiveX(110);
      setDetectiveFacingLeft(true);
      setDetectiveState('idle');
      
      const t1 = setTimeout(() => {
        setDetectiveTransition('left 1200ms linear');
        setDetectiveState('walking');
        setDetectiveX(72);
        
        detectiveWalkTimeoutRef.current = setTimeout(() => {
          setDetectiveState('idle');
        }, 1200);
      }, 100);
      
      return () => {
        clearTimeout(t1);
        if (detectiveWalkTimeoutRef.current) clearTimeout(detectiveWalkTimeoutRef.current);
      };
    }
  }, [currentLocation, isChapter2]);

  // Dynamic Cat Animation Sequencer States
  const [currentSpot, setCurrentSpot] = useState<ObjectId | 'center'>(catPosition);
  const [visualCoords, setVisualCoords] = useState<{ x: number; y: number }>({
    x: getCatSpot(catPosition).x,
    y: getCatSpot(catPosition).y
  });
  const [visualAction, setVisualAction] = useState<string>(catAction);
  const [scales, setScales] = useState<{ x: number; y: number }>({ x: 1, y: 1 });
  const [isWandering, setIsWandering] = useState(false);
  const [wanderOffset, setWanderOffset] = useState<number>(0);

  // Transition style dynamic helper
  const getTransitionStyle = () => {
    if (visualAction === 'jumping') {
      return 'left 400ms ease-in-out, top 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    }
    if (visualAction === 'walking') {
      return 'left 400ms ease-in-out, top 400ms ease-in-out';
    }
    return 'left 200ms ease-out, top 200ms ease-out, transform 150ms ease-out';
  };

  // Sync positions & drive transition sequencer when catPosition updates
  useEffect(() => {
    if (catPosition === currentSpot) {
      setVisualAction(catAction);
      return;
    }

    const fromSpot = currentSpot;
    const toSpot = catPosition;
    const fromCoords = getCatSpot(fromSpot);
    const toCoords = getCatSpot(toSpot);

    setCurrentSpot(toSpot);

    const isFromFloor = fromCoords.y >= 80;
    const isToFloor = toCoords.y >= 80;

    let timeouts: NodeJS.Timeout[] = [];

    const clearAllTimeouts = () => {
      timeouts.forEach(clearTimeout);
    };

    if (isFromFloor && isToFloor) {
      // Floor to Floor: simple horizontal walk
      setVisualAction('walking');
      setVisualCoords({ x: fromCoords.x, y: 84 });
      setScales({ x: 1.05, y: 0.95 });

      const t1 = setTimeout(() => {
        setVisualCoords({ x: toCoords.x, y: 84 });
      }, 50);
      timeouts.push(t1);

      const t2 = setTimeout(() => {
        setVisualAction(catAction);
        setScales({ x: 1, y: 1 });
      }, 550);
      timeouts.push(t2);

    } else if (isFromFloor && !isToFloor) {
      // Floor to Elevated: Walk horizontally to base, crouch, jump up snappy!
      setVisualAction('walking');
      setVisualCoords({ x: fromCoords.x, y: 84 });
      
      // 1. Walk horizontally on the floor to the target's base column
      const t1 = setTimeout(() => {
        setVisualCoords({ x: toCoords.x, y: 84 });
      }, 50);
      timeouts.push(t1);

      // 2. Crouch and prepare to leap (squish body)
      const t2 = setTimeout(() => {
        setVisualAction('jumping');
        setScales({ x: 1.3, y: 0.65 });
      }, 450);
      timeouts.push(t2);

      // 3. Launch upwards! (stretch body)
      const t3 = setTimeout(() => {
        setScales({ x: 0.75, y: 1.35 });
        setVisualCoords({ x: toCoords.x, y: toCoords.y });
      }, 650);
      timeouts.push(t3);

      // 4. Land on surface (squish on impact)
      const t4 = setTimeout(() => {
        setVisualAction(catAction);
        setScales({ x: 1.15, y: 0.85 });
      }, 950);
      timeouts.push(t4);

      // 5. Normal settling
      const t5 = setTimeout(() => {
        setScales({ x: 1, y: 1 });
      }, 1100);
      timeouts.push(t5);

    } else if (!isFromFloor && isToFloor) {
      // Elevated to Floor: Crouch on surface, leap down, land, walk to target spot
      setVisualAction('jumping');
      setScales({ x: 1.3, y: 0.65 });

      // 1. Launch downwards to floor base of starting item
      const t1 = setTimeout(() => {
        setScales({ x: 0.8, y: 1.3 });
        setVisualCoords({ x: fromCoords.x, y: 84 });
      }, 200);
      timeouts.push(t1);

      // 2. Land on floor (squish)
      const t2 = setTimeout(() => {
        setScales({ x: 1.15, y: 0.85 });
      }, 500);
      timeouts.push(t2);

      // 3. Walk horizontally to target floor spot
      const t3 = setTimeout(() => {
        setVisualAction('walking');
        setScales({ x: 1, y: 1 });
        setVisualCoords({ x: toCoords.x, y: 84 });
      }, 650);
      timeouts.push(t3);

      // 4. Settle at floor target
      const t4 = setTimeout(() => {
        setVisualAction(catAction);
      }, 1100);
      timeouts.push(t4);

    } else {
      // Elevated to Elevated (different furniture heights): leap down to floor, walk, leap up!
      setVisualAction('jumping');
      setScales({ x: 1.3, y: 0.65 });

      // 1. Leap down to base of source
      const t1 = setTimeout(() => {
        setScales({ x: 0.8, y: 1.3 });
        setVisualCoords({ x: fromCoords.x, y: 84 });
      }, 200);
      timeouts.push(t1);

      // 2. Land & start walking to target base column
      const t2 = setTimeout(() => {
        setVisualAction('walking');
        setScales({ x: 1.05, y: 0.95 });
        setVisualCoords({ x: toCoords.x, y: 84 });
      }, 500);
      timeouts.push(t2);

      // 3. Crouch at target base column
      const t3 = setTimeout(() => {
        setVisualAction('jumping');
        setScales({ x: 1.3, y: 0.65 });
      }, 900);
      timeouts.push(t3);

      // 4. Leap up onto target
      const t4 = setTimeout(() => {
        setScales({ x: 0.75, y: 1.35 });
        setVisualCoords({ x: toCoords.x, y: toCoords.y });
      }, 1100);
      timeouts.push(t4);

      // 5. Land on target
      const t5 = setTimeout(() => {
        setVisualAction(catAction);
        setScales({ x: 1.15, y: 0.85 });
      }, 1400);
      timeouts.push(t5);

      // 6. Settle on target
      const t6 = setTimeout(() => {
        setScales({ x: 1, y: 1 });
      }, 1550);
      timeouts.push(t6);
    }

    return () => clearAllTimeouts();
  }, [catPosition]);

  // Synchronize non-moving actions
  useEffect(() => {
    if (catAction !== 'walking' && catAction !== 'jumping') {
      setVisualAction(catAction);
    }
  }, [catAction]);

  // Idle wandering logic
  useEffect(() => {
    const interval = setInterval(() => {
      if (
        gameState.gameStatus === 'playing' &&
        gameState.catPosition === 'center' &&
        gameState.catAction === 'idle' &&
        visualAction === 'idle' &&
        !isWandering
      ) {
        if (Math.random() > 0.4) {
          const originalX = getCatSpot(gameState.catPosition).x;
          const direction = Math.random() > 0.5 ? 1 : -1;
          const distance = 5 + Math.random() * 8; 
          const offset = direction * distance;
          
          setIsWandering(true);
          setVisualAction('walking');
          setWanderOffset(offset);
          
          // Arrive and sit down
          const tW1 = setTimeout(() => {
            setVisualAction('idle');
          }, 500);

          // Walk back after 3 seconds
          const tW2 = setTimeout(() => {
            setVisualAction('walking');
            setWanderOffset(0);
            
            const tW3 = setTimeout(() => {
              setIsWandering(false);
              setVisualAction('idle');
            }, 500);
          }, 3500);
        }
      }
    }, 12000);

    return () => clearInterval(interval);
  }, [gameState.gameStatus, gameState.catPosition, gameState.catAction, visualAction, isWandering]);

  // Random atmospheric lightning flash
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setLightning(true);
        // Play thunder rumbles if unmuted
        if (!gameState.isMuted) {
          try {
            // Short burst of filtered low rumble
            gameAudio.playPurr(); 
          } catch(e){}
        }
        setTimeout(() => setLightning(false), 150);
        setTimeout(() => {
          if (Math.random() > 0.5) {
            setLightning(true);
            setTimeout(() => setLightning(false), 100);
          }
        }, 250);
      }
    }, 7000);

    return () => clearInterval(interval);
  }, [gameState.isMuted]);

  const handleObjectClick = (id: ObjectId) => {
    if (gameState.gameStatus !== 'playing') return;
    if (catAction === 'walking') return;

    if (id === 'safe' && objects.safe.locked) {
      // If safe is clicked and still locked, show the padlock overlay
      onObjectInteraction('safe', 'walk');
      setTimeout(() => {
        setShowSafeLock(true);
      }, 700);
      return;
    }

    onObjectInteraction(id, 'interact');
  };

  const handleSafeCodeSubmit = () => {
    const code = safeDigits.join('');
    const isCorrect = onEnterSafeCode(code);
    if (isCorrect) {
      setSafeSuccess(true);
      setSafeError(false);
      setTimeout(() => {
        setShowSafeLock(false);
        setSafeSuccess(false);
      }, 1500);
    } else {
      setSafeError(true);
      gameAudio.playClick();
      setTimeout(() => setSafeError(false), 800);
    }
  };

  const incrementDigit = (index: number) => {
    gameAudio.playClick();
    setSafeDigits(prev => {
      const copy = [...prev];
      copy[index] = (copy[index] % 9) + 1;
      return copy;
    });
  };

  const decrementDigit = (index: number) => {
    gameAudio.playClick();
    setSafeDigits(prev => {
      const copy = [...prev];
      copy[index] = copy[index] === 1 ? 9 : copy[index] - 1;
      return copy;
    });
  };

  // Detective smoke rings animation
  const [smokeRings, setSmokeRings] = useState<{ id: number; scale: number; x: number; y: number }[]>([]);
  useEffect(() => {
    const interval = setInterval(() => {
      if (gameState.gameStatus === 'playing') {
        const id = Date.now();
        setSmokeRings(prev => [...prev, { id, scale: 0.1, x: 26, y: 56 }]);
        
        setTimeout(() => {
          setSmokeRings(prev => prev.filter(r => r.id !== id));
        }, 2000);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [gameState.gameStatus]);

  const wallBgClass = gameState.roomInfo?.wallColor || 'bg-[#050505]';
  const borderAccentClass = gameState.roomInfo?.accentBorder || 'border-white/10';

  return (
    <div 
      className={`relative w-full aspect-[16/10] ${wallBgClass} border-4 ${borderAccentClass} rounded-none overflow-hidden select-none transition-all duration-300 ${
        lightning ? 'bg-white/10' : wallBgClass
      }`}
      style={{ boxShadow: 'inset 0 0 100px rgba(0,0,0,0.98)' }}
    >
      {/* Dynamic Rain Window, Porthole, or Dressing Mirror */}
      {gameState.roomInfo?.id === 'room_ballerina' ? (
        /* Ballerina dressing room back wall decoration: Lit mirror with light bulbs! */
        <div className="absolute top-8 left-[37%] w-[26%] h-[35%] border-4 border-amber-900 bg-neutral-900 shadow-2xl p-2 flex flex-col justify-center items-center relative">
          <div className="absolute inset-1 border border-amber-800" />
          {/* Mirror reflection surface */}
          <div className="w-full h-full bg-neutral-950 flex items-center justify-center relative shadow-inner overflow-hidden border border-neutral-800">
            {/* Mirror glare */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent rotate-12 pointer-events-none" />
            <span className="font-serif text-[10px] text-neutral-600 tracking-wider">ГРИМЕРНОЕ ЗЕРКАЛО</span>
          </div>
          {/* Glowing lightbulbs around the frame */}
          {[
            'top-1 left-1', 'top-1 left-1/2 -translate-x-1/2', 'top-1 right-1',
            'bottom-1 left-1', 'bottom-1 left-1/2 -translate-x-1/2', 'bottom-1 right-1',
            'top-1/2 -translate-y-1/2 left-1', 'top-1/2 -translate-y-1/2 right-1'
          ].map((pos, index) => (
            <div key={index} className={`absolute ${pos} w-2 h-2 rounded-full bg-yellow-100 border border-yellow-200 shadow-[0_0_8px_#fef08a] animate-pulse`} />
          ))}
        </div>
      ) : (gameState.roomInfo?.id === 'story_chapter_3' || gameState.roomInfo?.id === 'room_captain' || gameState.roomInfo?.id === 'story_chapter_2') ? (
        /* Captain / Airship cabin porthole: circular window with rain and sky view! */
        <div className="absolute top-8 left-[40%] w-[20%] aspect-square border-4 border-yellow-600 bg-neutral-900 rounded-full overflow-hidden shadow-2xl flex items-center justify-center">
          <div className="absolute inset-0 bg-neutral-950/40 pointer-events-none z-10" />
          {/* Rivets on bronze frame */}
          <div className="absolute inset-1 border-2 border-dashed border-yellow-700 rounded-full z-10 pointer-events-none" />
          {/* Sky with clouds & rain */}
          <div className="w-full h-full relative opacity-50 bg-neutral-950">
            {/* Soft sky light */}
            <div className="absolute inset-0 bg-gradient-to-b from-blue-950/20 to-neutral-950" />
            {/* Porthole grid cross */}
            <div className="absolute inset-x-0 top-1/2 h-0.5 bg-neutral-800 opacity-40 z-10" />
            <div className="absolute inset-y-0 left-1/2 w-0.5 bg-neutral-800 opacity-40 z-10" />
            {/* Sliding rain overlay */}
            <div className="absolute inset-0 flex flex-col justify-around py-2">
              <div className="h-[2px] bg-white/25 w-1/2 rounded animate-pulse translate-x-2" />
              <div className="h-[2px] bg-white/20 w-2/3 rounded animate-pulse translate-x-4" />
              <div className="h-[2px] bg-white/15 w-1/3 rounded animate-pulse translate-x-1" />
            </div>
          </div>
        </div>
      ) : (
        /* Mansion/Banker/Antique/Default rectangular window */
        <div className="absolute top-8 left-[35%] w-[30%] h-[35%] border-2 border-neutral-700 bg-neutral-900 rounded overflow-hidden shadow-2xl flex">
          <div className="absolute inset-0 bg-neutral-950/40 pointer-events-none z-10" />
          {/* Window grid */}
          <div className="absolute inset-x-0 top-1/2 h-0.5 bg-neutral-800 z-10" />
          <div className="absolute inset-y-0 left-1/2 w-0.5 bg-neutral-800 z-10" />
          {/* Rain behind glass */}
          <div className="w-full h-full relative opacity-40">
            <div className="absolute inset-0 bg-gradient-to-b from-neutral-800/10 to-neutral-950/80" />
            {/* Distant dark skyline silhouettes */}
            <div className="absolute bottom-0 inset-x-0 flex items-end justify-around gap-1 opacity-20">
              <div className="w-8 h-20 bg-neutral-900 border-t border-neutral-700" />
              <div className="w-12 h-28 bg-neutral-900 border-t border-neutral-700" />
              <div className="w-10 h-16 bg-neutral-900 border-t border-neutral-700" />
              <div className="w-16 h-24 bg-neutral-900 border-t border-neutral-700" />
            </div>
          </div>
        </div>
      )}

      {/* Lighting effect - Vignette shadow overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-neutral-950/80 pointer-events-none z-0" />
      <div className="absolute inset-x-0 bottom-0 h-1/5 bg-neutral-950 pointer-events-none z-0" />

      {/* --- SCENE OBJECTS --- */}

      {/* 1. Bookshelf (Left) */}
      {isVisible('bookshelf') && (
      <div 
        id="bookshelf-obj"
        onClick={() => handleObjectClick('bookshelf')}
        className="absolute group cursor-pointer z-20 flex flex-col justify-end transition-all duration-300"
        style={{
          left: `${objects.bookshelf.x ?? 4}%`,
          top: `${objects.bookshelf.y ?? 16}%`,
          width: `${objects.bookshelf.w ?? 20}%`,
          height: `${objects.bookshelf.h ?? 70}%`
        }}
      >
        <div className="relative w-full h-full border-2 border-neutral-600 bg-neutral-900 rounded-md p-1.5 flex flex-col justify-between transition-colors duration-200 group-hover:border-neutral-400 group-hover:bg-neutral-900/90 shadow-2xl">
          {/* Shelf panels */}
          {[1, 2, 3, 4].map((shelf) => (
            <div key={shelf} className="w-full h-[22%] border-b border-neutral-700 flex items-end justify-around px-1 relative">
              {gameState.roomInfo?.id === 'room_ballerina' ? (
                /* Ballerina shelves containing slippers and flowers */
                shelf === 1 ? (
                  <div className="text-[12px] animate-bounce">🩰</div>
                ) : shelf === 2 ? (
                  <div className="text-[11px]">💄🌸</div>
                ) : shelf === 3 ? (
                  <div className="text-[12px] opacity-80">🎀</div>
                ) : (
                  <div className="w-full h-1 bg-pink-900/40 rounded-sm" />
                )
              ) : (
                /* Standard bookshelf content */
                shelf === 1 && (
                  <>
                    <div className="w-4 h-12 bg-neutral-700 border border-neutral-500 rounded-sm" />
                    <div className="w-3.5 h-10 bg-neutral-800 border border-neutral-600 rounded-sm" />
                    <div className="w-4.5 h-11 bg-neutral-700 border border-neutral-500 rounded-sm transform rotate-6 origin-bottom" />
                  </>
                )
              )}
              {gameState.roomInfo?.id !== 'room_ballerina' && shelf === 2 && (
                <>
                  {!objects.bookshelf.booksFallen ? (
                    <div className="flex gap-0.5 items-end justify-center w-full">
                      <div className="w-3 h-9 bg-neutral-800 border border-neutral-600 rounded-sm" />
                      <div className="w-3.5 h-11 bg-neutral-700 border border-neutral-500 rounded-sm" />
                      <div className="w-3.5 h-10 bg-neutral-800 border border-neutral-600 rounded-sm transform -rotate-12 origin-bottom" />
                      <div className="w-4 h-11 bg-neutral-600 border border-neutral-500 rounded-sm" />
                    </div>
                  ) : (
                    <div className="w-full text-center text-[10px] font-mono text-neutral-500 italic pb-1">
                      (Разбросано)
                    </div>
                  )}
                </>
              )}
              {gameState.roomInfo?.id !== 'room_ballerina' && shelf === 3 && (
                <div className="flex gap-1 items-end w-full pl-2">
                  <div className="w-4 h-10 bg-neutral-800 border border-neutral-600 rounded-sm" />
                  <div className="w-4 h-11 bg-neutral-700 border border-neutral-500 rounded-sm" />
                  <div className="w-4 h-9 bg-neutral-600 border border-neutral-400 rounded-sm" />
                </div>
              )}
              {gameState.roomInfo?.id !== 'room_ballerina' && shelf === 4 && (
                <div className="flex gap-0.5 items-end justify-around w-full">
                  <div className="w-5 h-8 bg-neutral-700 border border-neutral-600 rounded-sm" />
                  <div className="w-4 h-10 bg-neutral-800 border border-neutral-600 rounded-sm" />
                  <div className="w-4 h-9 bg-neutral-600 border border-neutral-500 rounded-sm" />
                </div>
              )}
            </div>
          ))}
          {/* Interactive Hover Glow */}
          <div className="absolute inset-0 border border-transparent group-hover:border-white/20 rounded-md pointer-events-none" />
        </div>
        <span className="text-center font-sans text-[9px] uppercase tracking-[0.2em] text-white/30 group-hover:text-white/80 transition-colors duration-200 mt-1 block truncate">
          {objects.bookshelf.name}
        </span>
      </div>
      )}

      {/* 2. Painting (Left Center Wall) */}
      {isVisible('painting') && (
      <div
        id="painting-obj"
        onClick={() => handleObjectClick('painting')}
        className="absolute group cursor-pointer z-10 flex flex-col items-center transition-all duration-300"
        style={{
          left: `${objects.painting.x ?? 25}%`,
          top: `${objects.painting.y ?? 15}%`,
          width: `${objects.painting.w ?? 12}%`,
          height: `${objects.painting.h ?? 12}%`
        }}
      >
        <div 
          className={`w-full h-full border-4 border-neutral-500 bg-neutral-900 transition-all duration-500 flex items-center justify-center relative shadow-xl ${
            objects.painting.toggled ? 'rotate-[15deg] translate-y-1' : ''
          }`}
        >
          {/* Custom painting graphic based on setting */}
          {gameState.roomInfo?.id === 'room_ballerina' ? (
            <div className="w-[80%] h-[80%] border-2 border-neutral-700 bg-neutral-950 flex items-center justify-center overflow-hidden relative">
              <span className="text-[16px] animate-pulse">🩰</span>
            </div>
          ) : (gameState.roomInfo?.id === 'room_captain' || gameState.roomInfo?.id === 'story_chapter_2') ? (
            <div className="w-[80%] h-[80%] border-2 border-neutral-700 bg-blue-950 flex items-center justify-center overflow-hidden relative">
              <span className="text-[16px]">⛵</span>
            </div>
          ) : (
            /* Classic Portrait */
            <div className="w-[80%] h-[80%] border-2 border-neutral-700 bg-neutral-950 flex flex-col justify-end items-center overflow-hidden">
              <div className="w-6 h-6 rounded-full bg-neutral-800 border border-neutral-600 mb-1" />
              <div className="w-10 h-10 rounded-t-full bg-neutral-700 border border-neutral-500" />
            </div>
          )}
          {/* Tiny paper sticking out */}
          {!objects.painting.toggled && (
            <div className="absolute -bottom-1 right-1 w-2 h-4 bg-neutral-400 transform rotate-12" />
          )}
        </div>
        <span className="text-center font-sans text-[9px] uppercase tracking-[0.2em] text-white/30 group-hover:text-white/80 transition-colors duration-200 mt-1 truncate w-full">
          {objects.painting.name}
        </span>
      </div>
      )}

      {/* 3. The Persian Rug (Center Floor) */}
      {isVisible('rug') && (
      <div
        id="rug-obj"
        onClick={() => handleObjectClick('rug')}
        className="absolute group cursor-pointer z-10 transition-all duration-300"
        style={{
          left: `${objects.rug.x ?? 28}%`,
          top: `${objects.rug.y ?? 82}%`,
          width: `${objects.rug.w ?? 38}%`,
          height: `${objects.rug.h ?? 16}%`
        }}
      >
        <div 
          className={`w-full h-full border-2 border-neutral-700 bg-neutral-900/80 rounded-full flex items-center justify-center transition-all duration-300 relative ${
            objects.rug.toggled ? 'skew-x-12 translate-x-3 scale-x-95 border-neutral-500' : 'group-hover:border-neutral-500'
          }`}
          style={{ 
            backgroundImage: gameState.roomInfo?.id === 'room_ballerina'
              ? 'repeating-linear-gradient(45deg, #2d1b22, #2d1b22 4px, #3d242f 4px, #3d242f 8px)' // pink accent
              : gameState.roomInfo?.id === 'room_captain'
              ? 'repeating-linear-gradient(45deg, #13222d, #13222d 4px, #1a2f3d 4px, #1a2f3d 8px)' // captain navy-themed
              : 'repeating-linear-gradient(45deg, #1c1c1c, #1c1c1c 4px, #262626 4px, #262626 8px)' 
          }}
        >
          {/* Folded edge indicating interaction */}
          {objects.rug.toggled && (
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-neutral-950 border-l-2 border-neutral-500 rounded-r-full shadow-inner flex items-center justify-center">
              <span className="text-[9px] font-mono text-neutral-400">ПОДНЯТ</span>
            </div>
          )}
          {/* Direct clue glow if revealed */}
          {objects.rug.toggled && objects.rug.heldClueId && !foundClueIds.includes(objects.rug.heldClueId) && (
            <div className="absolute left-8 top-1/2 -translate-y-1/2 w-4 h-4 bg-white/25 rounded-full animate-ping" />
          )}
        </div>
        <span className="text-center font-sans text-[9px] uppercase tracking-[0.2em] text-white/30 group-hover:text-white/80 transition-colors duration-200 block truncate">
          {objects.rug.name}
        </span>
      </div>
      )}

      {/* 4. Desk (Right Center) */}
      {isVisible('desk') && (
      <div
        id="desk-obj"
        onClick={() => handleObjectClick('desk')}
        className="absolute group cursor-pointer z-20 flex flex-col justify-end transition-all duration-300"
        style={{
          left: `${objects.desk.x ?? 43}%`,
          top: `${objects.desk.y ?? 58}%`,
          width: `${objects.desk.w ?? 32}%`,
          height: `${objects.desk.h ?? 32}%`
        }}
      >
        <div className="relative w-full h-[80%] border-2 border-neutral-600 bg-neutral-900 rounded p-1 group-hover:border-neutral-400 shadow-2xl flex flex-col justify-between">
          {/* Desk Surface items */}
          <div className="absolute -top-6 inset-x-2 h-6 flex justify-between items-end pointer-events-none px-4">
            {gameState.roomInfo?.id === 'room_ballerina' ? (
              <>
                <div className="text-[12px]">💄</div>
                <div className="text-[12px] transform rotate-12">🪞</div>
              </>
            ) : (
              <>
                {/* Ink bottle */}
                <div className="w-4 h-5 bg-neutral-950 border border-neutral-700 rounded-sm flex items-start justify-center">
                  <div className="w-1.5 h-1.5 bg-neutral-700 rounded-full -mt-1" />
                </div>
                
                {/* Papers pile */}
                <div className="relative w-10 h-3">
                  <div className="absolute bottom-0 right-0 w-8 h-1 bg-neutral-800 border border-neutral-600 transform rotate-1" />
                  <div className="absolute bottom-0.5 right-1 w-8 h-1 bg-neutral-700 border border-neutral-500 transform -rotate-2" />
                </div>
              </>
            )}
          </div>

          {/* Desk drawer details */}
          <div className="w-full h-[40%] border-b border-neutral-700 flex items-center justify-center px-4 relative">
            <div className="w-16 h-5 border border-neutral-700 bg-neutral-950 rounded flex items-center justify-center relative">
              {/* Lock hole */}
              <div className={`w-1.5 h-1.5 rounded-full ${objects.desk.locked ? 'bg-neutral-500' : 'bg-transparent'} border border-neutral-600`} />
              {/* Handle */}
              <div className="absolute bottom-0 w-8 h-0.5 bg-neutral-600" />
            </div>
          </div>

          {/* Desk Legs */}
          <div className="w-full h-[50%] flex justify-between px-6 items-end">
            <div className="w-4 h-full bg-neutral-950 border-r border-neutral-800" />
            <div className="w-4 h-full bg-neutral-950 border-l border-neutral-800" />
          </div>
        </div>
        <span className="text-center font-sans text-[9px] uppercase tracking-[0.2em] text-white/30 group-hover:text-white/80 transition-colors duration-200 mt-1 block truncate">
          {objects.desk.name}
        </span>
      </div>
      )}

      {/* 5. Fishbowl (On Desk Left) */}
      {isVisible('fishbowl') && (
      <div
        id="fishbowl-obj"
        onClick={() => handleObjectClick('fishbowl')}
        className="absolute group cursor-pointer z-30 transition-all duration-300"
        style={{
          left: `${objects.fishbowl.x ?? 48}%`,
          top: `${objects.fishbowl.y ?? 54}%`,
          width: `${objects.fishbowl.w ?? 8}%`,
          height: `${objects.fishbowl.h ?? 8}%`
        }}
      >
        <div className="relative w-full h-full flex flex-col items-center">
          {gameState.roomInfo?.id === 'room_ballerina' ? (
            /* Crystal dressing-room vase with rose */
            <div className={`w-[70%] h-full border-2 border-pink-400/30 rounded-t-full bg-pink-950/20 flex flex-col justify-between items-center relative transition-all ${objects.fishbowl.tipped ? 'rotate-90 translate-y-3' : ''}`}>
              <div className="absolute -top-3 text-[10px] animate-bounce">🌷</div>
              <div className="w-full h-1/2 bg-pink-800/20 absolute bottom-0" />
            </div>
          ) : gameState.roomInfo?.id === 'story_chapter_3' ? (
            /* Cocktail coupe martini glass with floating cherry */
            <div className={`w-full h-full flex flex-col items-center justify-end transition-all ${objects.fishbowl.tipped ? 'rotate-90 translate-y-3' : ''}`}>
              <div className="w-full h-[60%] border-t-2 border-x-2 border-neutral-500 rounded-b-full bg-neutral-800/40 relative flex items-center justify-center">
                <span className="text-[10px]">🍸</span>
              </div>
              <div className="w-0.5 h-[30%] bg-neutral-500" />
              <div className="w-6 h-0.5 bg-neutral-500" />
            </div>
          ) : (
            /* Classic fishbowl */
            <div className={`w-full h-full border-2 border-neutral-500 rounded-full bg-neutral-900/60 overflow-hidden flex items-center justify-center relative transition-all duration-300 ${
              objects.fishbowl.tipped ? 'rotate-90 translate-y-3 translate-x-2 border-neutral-700' : 'group-hover:border-neutral-300'
            }`}>
              {/* Water layer */}
              {!objects.fishbowl.tipped ? (
                <div className="absolute bottom-0 inset-x-0 h-[70%] bg-neutral-800/40 relative">
                  {/* Swim fish */}
                  <div className="absolute top-2 left-2 w-3 h-1.5 bg-neutral-500 rounded-full animate-bounce" />
                  {/* Shiny key on bottom if still there */}
                  {objects.fishbowl.heldItemId === 'key_brass' && (
                    <div className="absolute bottom-1 left-3 w-4 h-2 bg-yellow-200/50 rounded-sm transform rotate-12 border border-yellow-300/40 animate-pulse" />
                  )}
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[8px] font-mono text-neutral-500">(Сухо)</span>
                </div>
              )}
            </div>
          )}
          <span className="text-center font-sans text-[9px] uppercase tracking-[0.2em] text-white/30 group-hover:text-white/80 mt-1 truncate w-full">
            {objects.fishbowl.name}
          </span>
        </div>
      </div>
      )}

      {/* 6. Floor Lamp (Right Desk) */}
      {isVisible('lamp') && (
      <div
        id="lamp-obj"
        onClick={() => handleObjectClick('lamp')}
        className="absolute group cursor-pointer z-20 flex flex-col justify-end transition-all duration-300"
        style={{
          left: `${objects.lamp.x ?? 74}%`,
          top: `${objects.lamp.y ?? 45}%`,
          width: `${objects.lamp.w ?? 8}%`,
          height: `${objects.lamp.h ?? 55}%`
        }}
      >
        <div className="relative w-full h-full flex flex-col justify-between items-center">
          {gameState.roomInfo?.id === 'room_ballerina' ? (
            /* Golden stand-candelabra */
            <div className="relative w-full h-full flex flex-col justify-between items-center">
              <div className="flex justify-around w-full relative">
                <div className={`w-2 h-2 rounded-full ${objects.lamp.toggled ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24] animate-ping' : 'bg-neutral-800'}`} />
                <div className={`w-2 h-2 rounded-full ${objects.lamp.toggled ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24] animate-ping' : 'bg-neutral-800'}`} />
              </div>
              <div className="w-1 h-[75%] bg-amber-600" />
              <div className="w-6 h-1.5 bg-amber-700 rounded-t-sm" />
            </div>
          ) : (
            /* Classic Floor Lamp */
            <>
              {/* Lampshade */}
              <div className="relative w-full aspect-[4/3] flex flex-col items-center">
                <div 
                  className={`w-full h-[80%] rounded-t-lg bg-neutral-800 border-2 border-neutral-600 transition-colors duration-200 ${
                    objects.lamp.toggled ? 'bg-white border-white shadow-2xl' : 'group-hover:border-neutral-400'
                  }`}
                  style={{
                    clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)'
                  }}
                />
                {/* Glow projection */}
                {objects.lamp.toggled && (
                  <div className="absolute top-[80%] w-64 h-64 left-1/2 -translate-x-1/2 bg-gradient-to-b from-white/20 via-white/5 to-transparent pointer-events-none animate-lamp-beam-adjust" 
                       style={{ 
                         clipPath: 'polygon(35% 0%, 65% 0%, 100% 100%, 0% 100%)',
                         transformOrigin: 'top center'
                       }} />
                )}
              </div>

              {/* Stem & Stand */}
              <div className="w-1 h-[70%] bg-neutral-600 relative">
                {/* Tilting toggle base if tilted */}
                {objects.lamp.tipped && (
                  <div className="absolute bottom-4 -left-1 w-3 h-3 bg-neutral-400 rounded-full" />
                )}
              </div>
              <div className="w-8 h-2 bg-neutral-700 rounded-t-sm" />
            </>
          )}
        </div>
        <span className="text-center font-sans text-[9px] uppercase tracking-[0.2em] text-white/30 group-hover:text-white/80 transition-colors duration-200 mt-1 block truncate">
          {objects.lamp.name}
        </span>
      </div>
      )}

      {/* 7. Trash Can (Bottom Right) */}
      {isVisible('trashcan') && (
      <div
        id="trashcan-obj"
        onClick={() => handleObjectClick('trashcan')}
        className="absolute group cursor-pointer z-15 transition-all duration-300"
        style={{
          left: `${objects.trashcan.x ?? 80}%`,
          top: `${objects.trashcan.y ?? 82}%`,
          width: `${objects.trashcan.w ?? 10}%`,
          height: `${objects.trashcan.h ?? 16}%`
        }}
      >
        <div className="relative w-full h-full flex flex-col items-center">
          <div 
            className={`w-[80%] h-[90%] border-2 border-neutral-600 bg-neutral-900 transition-all duration-500 rounded-b relative ${
              objects.trashcan.tipped ? 'rotate-90 translate-y-3 translate-x-4 border-neutral-500' : 'group-hover:border-neutral-400'
            }`}
            style={{
              clipPath: 'polygon(0% 0%, 100% 0%, 85% 100%, 15% 100%)'
            }}
          >
            {gameState.roomInfo?.id === 'room_ballerina' ? (
              /* Rose petals overflowing */
              <div className="absolute inset-0 flex flex-col justify-start items-center">
                <div className="text-[10px] -mt-1">🌸🌹</div>
              </div>
            ) : gameState.roomInfo?.id === 'room_captain' ? (
              /* Wood texture bands */
              <div className="absolute inset-x-0 inset-y-1 flex justify-around opacity-40">
                <div className="w-0.5 h-full bg-neutral-700" />
                <div className="w-0.5 h-full bg-neutral-700" />
              </div>
            ) : (
              /* Trash mesh lines */
              <div className="absolute inset-0 flex justify-between px-2 opacity-30">
                <div className="w-0.5 h-full bg-neutral-600" />
                <div className="w-0.5 h-full bg-neutral-600" />
                <div className="w-0.5 h-full bg-neutral-600" />
              </div>
            )}
            {/* Paper balls sticking out */}
            {!objects.trashcan.tipped && gameState.roomInfo?.id !== 'room_ballerina' && (
              <div className="absolute -top-1 inset-x-1 h-2 flex justify-around">
                <div className="w-2.5 h-2.5 bg-neutral-400 rounded-full" />
                <div className="w-2.5 h-2.5 bg-neutral-500 rounded-full" />
              </div>
            )}
          </div>
          {objects.trashcan.tipped && (
            <div className="absolute -left-2 top-2 flex gap-0.5 pointer-events-none">
              <div className="w-2 h-2 bg-neutral-400 rounded-full rotate-12" />
              <div className="w-3 h-2 bg-neutral-500 transform rotate-45" />
            </div>
          )}
          <span className="text-center font-sans text-[9px] uppercase tracking-[0.2em] text-white/30 group-hover:text-white/80 mt-1 block truncate w-full">
            {objects.trashcan.name}
          </span>
        </div>
      </div>
      )}

      {/* 8. Steel Safe (Right Side Corner) */}
      {isVisible('safe') && (
      <div
        id="safe-obj"
        onClick={() => handleObjectClick('safe')}
        className="absolute group cursor-pointer z-10 flex flex-col justify-end transition-all duration-300"
        style={{
          left: `${objects.safe.x ?? 87}%`,
          top: `${objects.safe.y ?? 66}%`,
          width: `${objects.safe.w ?? 11}%`,
          height: `${objects.safe.h ?? 28}%`
        }}
      >
        <div className={`relative w-full h-full border-4 ${
          gameState.roomInfo?.id === 'room_ballerina'
            ? 'border-pink-900 bg-amber-950'
            : gameState.roomInfo?.id === 'room_captain'
            ? 'border-yellow-800 bg-amber-900'
            : 'border-neutral-600 bg-neutral-900'
        } rounded p-1 transition-colors duration-300 shadow-2xl`}>
          {/* Lock dial visual */}
          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 relative">
            <div className={`w-8 h-8 rounded-full border-2 ${objects.safe.locked ? 'border-neutral-700 bg-neutral-950' : 'border-neutral-500 bg-neutral-900'} flex items-center justify-center relative shadow-inner`}>
              <div className="w-2 h-2 rounded-full bg-neutral-500" />
              {/* Dial markings */}
              <div className="absolute top-0.5 w-0.5 h-1.5 bg-neutral-500" />
            </div>
            
            {/* Safe handle */}
            <div className="w-1.5 h-6 bg-neutral-600 rounded" />

            {/* Lock status led */}
            <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${objects.safe.locked ? 'bg-neutral-800' : 'bg-green-400 border border-green-300'} animate-pulse`} />
          </div>
        </div>
        <span className="text-center font-sans text-[9px] uppercase tracking-[0.2em] text-white/30 group-hover:text-white/80 transition-colors duration-200 mt-1 block truncate w-full">
          {objects.safe.name}
        </span>
      </div>
      )}

      {/* --- DOORS FOR CHAPTER 2 TRANSITIONS --- */}
      {isChapter2 && currentLocation === 'pier' && (
        <div 
          onClick={() => onChangeLocation?.('warehouse')}
          className="absolute bottom-16 right-[15%] w-[12%] h-[35%] group cursor-pointer z-20 flex flex-col justify-end items-center"
        >
          <div className="w-full h-full border-2 border-dashed border-neutral-600 hover:border-white bg-neutral-950/80 rounded p-3 flex flex-col justify-between items-center shadow-2xl transition-all hover:scale-105">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-ping" />
            <svg viewBox="0 0 24 24" className="w-10 h-10 text-neutral-400 group-hover:text-white transition-colors fill-none stroke-current stroke-1.5">
              <path d="M15 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8m-3-9 4 4m0 0-4 4m4-4H9" />
            </svg>
            <span className="text-[8px] font-sans text-center font-bold tracking-wider text-neutral-400 group-hover:text-white uppercase">Внутрь склада</span>
          </div>
        </div>
      )}

      {isChapter2 && currentLocation === 'warehouse' && (
        <div 
          onClick={() => onChangeLocation?.('pier')}
          className="absolute bottom-16 left-[25%] w-[12%] h-[35%] group cursor-pointer z-20 flex flex-col justify-end items-center"
        >
          <div className="w-full h-full border-2 border-dashed border-neutral-600 hover:border-white bg-neutral-950/80 rounded p-3 flex flex-col justify-between items-center shadow-2xl transition-all hover:scale-105">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-ping" />
            <svg viewBox="0 0 24 24" className="w-10 h-10 text-neutral-400 group-hover:text-white transition-colors fill-none stroke-current stroke-1.5">
              <path d="M10 3H20a2 2 0 0 1 2 2V19a2 2 0 0 1-2 2H10M14 8l-4 4m0 0 4 4m-4-4h10" />
            </svg>
            <span className="text-[8px] font-sans text-center font-bold tracking-wider text-neutral-400 group-hover:text-white uppercase">На причал</span>
          </div>
        </div>
      )}

      {/* --- DETECTIVE BARTH (Animated character) --- */}
      <div 
        className="absolute bottom-3 pointer-events-none z-40 flex flex-col items-center justify-end w-28 h-56"
        style={{
          left: `${detectiveX}%`,
          transform: `translateX(-50%) scaleX(${detectiveFacingLeft ? 1 : -1})`,
          transition: detectiveTransition
        }}
      >
        {/* Smoke rings adjusted to align with pipe profile */}
        {smokeRings.map(ring => (
          <div 
            key={ring.id}
            className="absolute border border-neutral-400/40 rounded-full animate-pulse pointer-events-none"
            style={{
              left: '26px',
              bottom: '156px',
              width: '8px',
              height: '4px',
              transform: `scale(${ring.scale}) translateY(-${(Date.now() - ring.id) / 10}px)`,
              opacity: (2000 - (Date.now() - ring.id)) / 2000,
              transition: 'all 2s linear'
            }}
          />
        ))}

        {/* Vector SVG Detective Profile Facing Left (3/4 view) */}
        <svg viewBox="0 0 100 180" className="w-full h-full stroke-neutral-700 stroke-[1.5] drop-shadow-[0_8px_16px_rgba(0,0,0,0.95)]">
          {/* Main skeleton */}
          <g>
            {/* 1. Background/Left Leg */}
            <g className={detectiveState === 'walking' ? 'animate-det-leg-l' : ''}>
              {/* Pant leg */}
              <path d="M 32,118 L 32,168 L 40,168 L 40,118 Z" fill="#171717" />
              {/* Ankle cuff */}
              <line x1="32" y1="168" x2="40" y2="168" stroke="#262626" strokeWidth="2" />
              {/* Leather shoe */}
              <path d="M 32,168 Q 22,168 20,174 L 40,174 Z" fill="#0a0a0a" />
              {/* Shoe sole */}
              <path d="M 18,174 L 40,174 L 40,176 L 18,176 Z" fill="#000000" />
            </g>

            {/* 2. Foreground/Right Leg */}
            <g className={detectiveState === 'walking' ? 'animate-det-leg-r' : ''}>
              {/* Pant leg */}
              <path d="M 44,118 L 44,168 L 52,168 L 52,118 Z" fill="#222222" />
              {/* Ankle cuff */}
              <line x1="44" y1="168" x2="52" y2="168" stroke="#333" strokeWidth="2" />
              {/* Leather shoe */}
              <path d="M 44,168 Q 54,168 56,174 L 40,174 Z" fill="#0c0c0c" />
              {/* Shoe sole */}
              <path d="M 40,174 L 58,174 L 58,176 L 40,176 Z" fill="#000000" />
            </g>

            {/* 3. Main Body Group (bobs when walking, breathes when idle) */}
            <g className={detectiveState === 'walking' ? 'animate-det-walk-bob' : 'animate-det-idle-body'}>
              
              {/* Coat tail (lower skirt of the trench coat) */}
              <path 
                d="M 28,118 C 25,130 22,145 20,154 L 62,154 C 60,140 56,130 54,118 Z" 
                fill="#262626" 
                className={detectiveState === 'walking' ? 'animate-det-walk-coat' : 'animate-det-idle-coat'} 
              />
              {/* Coat tail crease/folds */}
              <path d="M 41,118 L 41,154" stroke="#171717" strokeWidth="1.5" />
              <path d="M 33,122 C 31,132 29,142 27,152" stroke="#1c1c1c" strokeWidth="1" fill="none" />
              <path d="M 49,122 C 51,132 53,142 55,152" stroke="#1c1c1c" strokeWidth="1" fill="none" />

              {/* Belt & Waist belt line */}
              <rect x="29" y="114" width="24" height="6" rx="1.5" fill="#1a1a1a" />
              {/* Gold Belt Buckle */}
              <rect x="39" y="112" width="8" height="10" rx="1" fill="#eab308" stroke="#ca8a04" strokeWidth="1.5" />
              {/* Belt prong */}
              <line x1="43" y1="112" x2="43" y2="122" stroke="#451a03" strokeWidth="1.5" />

              {/* Upper Torso (Double-breasted trench coat chest) */}
              <path d="M 28,74 C 23,88 27,114 29,114 L 53,114 C 55,108 58,88 53,74 Z" fill="#2d2d2d" />
              
              {/* Coat shading highlight / trim */}
              <path d="M 28,74 C 26,86 28,114 29,114" stroke="#404040" strokeWidth="1.5" fill="none" />
              <path d="M 53,74 C 56,86 54,114 53,114" stroke="#404040" strokeWidth="1.5" fill="none" />

              {/* White Shirt Collar & Necktie */}
              <polygon points="37,70 41,75 45,70" fill="#ffffff" />
              <polygon points="39,72 41,88 43,72" fill="#0a0a0a" />

              {/* Double-breasted buttons */}
              <circle cx="34" cy="84" r="2" fill="#0f0f0f" stroke="#404040" strokeWidth="0.5" />
              <circle cx="34" cy="94" r="2" fill="#0f0f0f" stroke="#404040" strokeWidth="0.5" />
              <circle cx="35" cy="104" r="2" fill="#0f0f0f" stroke="#404040" strokeWidth="0.5" />
              <circle cx="48" cy="84" r="2" fill="#0f0f0f" stroke="#404040" strokeWidth="0.5" />
              <circle cx="48" cy="94" r="2" fill="#0f0f0f" stroke="#404040" strokeWidth="0.5" />
              <circle cx="47" cy="104" r="2" fill="#0f0f0f" stroke="#404040" strokeWidth="0.5" />

              {/* Popped Collar Left & Right */}
              <path d="M 33,74 L 20,68 L 36,65 Z" fill="#1c1c1c" />
              <path d="M 49,74 L 62,68 L 46,65 Z" fill="#1c1c1c" />

              {/* 4. Left Arm (Hand in pocket) */}
              <path d="M 53,74 Q 60,86 58,98 Q 56,104 50,110" fill="none" stroke="#262626" strokeWidth="8" strokeLinecap="round" />
              {/* Pocket opening and sleeve folds */}
              <path d="M 48,104 L 52,112" stroke="#171717" strokeWidth="2.5" />
              <path d="M 56,84 C 58,88 58,92 57,96" stroke="#404040" strokeWidth="1" fill="none" />

              {/* 5. Right Arm (Holding Pipe to mouth) */}
              <g className={detectiveState === 'walking' ? 'animate-det-walk-arm' : 'animate-det-idle-arm'}>
                {/* Shoulder and upper arm */}
                <path d="M 28,74 L 20,92 L 22,106" fill="none" stroke="#262626" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                {/* Forearm curving back up to hold pipe */}
                <path d="M 22,106 L 20,96 L 22,80" fill="none" stroke="#222222" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
                {/* Hand (skin-tone) */}
                <circle cx="23" cy="74" r="3" fill="#b0a498" />
                {/* Classic curved briar pipe */}
                <path d="M 23,74 C 23,70 30,68 31,64" stroke="#4a1d19" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                <path d="M 31,64 Q 31,60 33,60" stroke="#7c2d12" strokeWidth="2.5" fill="none" />
                {/* Pipe bowl */}
                <path d="M 32,60 L 35,60 L 35,56 L 31,56 Z" fill="#4a1d19" />
                {/* Ember inside bowl */}
                <circle cx="33" cy="57" r="1.5" className="fill-orange-500 animate-det-pipe" />
              </g>

              {/* 6. HEAD & HAT GROUP (gently bobs) */}
              <g className={detectiveState === 'walking' ? '' : 'animate-det-idle-head'}>
                {/* Neck */}
                <path d="M 37,74 L 37,64 L 45,64 L 45,74 Z" fill="#b0a498" />

                {/* Head profile (facing left / 3/4 view) */}
                <path d="M 36,64 C 33,64 32,54 34,48 C 36,40 44,40 47,44 C 48,46 47,48 49,49 C 50,50 51,52 50,55 C 49,56 47,57 48,59 L 45,60 L 46,63 C 44,65 42,65 39,64 Z" fill="#b0a498" />
                
                {/* Eye detail (determined gaze) */}
                <ellipse cx="38" cy="48" rx="1.5" ry="1" fill="#171717" />
                <path d="M 35,46 C 37,45 39,45 40,46" stroke="#0a0a0a" strokeWidth="1.2" fill="none" />

                {/* Shading/ear profile */}
                <path d="M 43,49 C 45,49 45,54 43,54 Z" fill="#948a7e" />

                {/* Fedora Hat */}
                {/* Hat crown back/side */}
                <path d="M 30,42 C 28,26 35,16 43,21 C 46,16 53,16 55,42 Z" fill="#1a1a1a" stroke="#0c0c0c" strokeWidth="1" />
                {/* Crease/dent line shadow */}
                <path d="M 38,20 Q 42,28 46,19" fill="none" stroke="#0c0c0c" strokeWidth="2.5" />
                {/* Black Ribbon/Hat band */}
                <path d="M 31,39 C 31,39 40,36 53,39 L 54,42 Q 40,39 31,42 Z" fill="#000" />
                {/* Fedora Hat Brim */}
                <path d="M 22,44 Q 40,33 60,44 L 59,41 Q 40,30 24,41 Z" fill="#262626" stroke="#121212" strokeWidth="0.8" />
              </g>

            </g>
          </g>
        </svg>
      </div>

      {/* --- CAT MIDNIGHT (Animated sprite) --- */}
      <div 
        className={`absolute pointer-events-none z-30 flex flex-col items-center justify-end ${getCatSpot(catPosition).height}`}
        style={{
          left: `${visualCoords.x + (isWandering ? wanderOffset : 0)}%`,
          top: `${visualCoords.y}%`,
          transform: `translate(-50%, -100%) scale(${scales.x}, ${scales.y})`,
          transition: getTransitionStyle()
        }}
      >
        <div className="relative w-12 h-12">
          {/* Inject inline retro noir CSS animations */}
          <style>{`
            @keyframes cat-tail-wag {
              0%, 100% { transform: rotate(0deg); }
              50% { transform: rotate(16deg); }
            }
            @keyframes cat-blink {
              0%, 90%, 94%, 98%, 100% { transform: scaleY(1); }
              92%, 96% { transform: scaleY(0.15); }
            }
            @keyframes cat-ears-twitch {
              0%, 94%, 100% { transform: rotate(0deg); }
              96% { transform: rotate(-3deg); }
              98% { transform: rotate(3deg); }
            }
            .animate-cat-tail {
              animation: cat-tail-wag 2.4s ease-in-out infinite;
            }
            .animate-cat-blink {
              animation: cat-blink 4.2s ease-in-out infinite;
            }
            .animate-cat-ears {
              animation: cat-ears-twitch 5.5s ease-in-out infinite;
            }

            /* New Detective idle and walk animations */
            @keyframes det-idle-head {
              0%, 100% { transform: translateY(0) rotate(0deg); }
              50% { transform: translateY(1.5px) rotate(-1deg); }
            }
            @keyframes det-idle-arm {
              0%, 100% { transform: translateY(0) rotate(0deg); }
              50% { transform: translateY(0.8px) rotate(-1.5deg); }
            }
            @keyframes det-idle-chest {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.01, 1.02); }
            }
            @keyframes det-idle-coat {
              0%, 100% { transform: rotate(0deg); }
              50% { transform: rotate(0.8deg); }
            }
            
            @keyframes det-walk-leg-l {
              0%, 100% { transform: rotate(-26deg); }
              50% { transform: rotate(26deg); }
            }
            @keyframes det-walk-leg-r {
              0%, 100% { transform: rotate(26deg); }
              50% { transform: rotate(-26deg); }
            }
            @keyframes det-walk-body-bob {
              0%, 50%, 100% { transform: translateY(0px); }
              25%, 75% { transform: translateY(-3.5px); }
            }
            @keyframes det-walk-coat {
              0%, 100% { transform: skewX(-4deg); }
              50% { transform: skewX(4deg); }
            }
            @keyframes det-walk-arm {
              0%, 100% { transform: rotate(-4deg); }
              50% { transform: rotate(4deg); }
            }
            @keyframes det-pipe-glow {
              0%, 100% { fill: #f97316; filter: drop-shadow(0 0 1px #ea580c); }
              50% { fill: #ef4444; filter: drop-shadow(0 0 4px #f97316); }
            }
            @keyframes det-glasses-glow {
              0%, 90%, 94%, 98%, 100% { transform: scaleY(1); opacity: 0.95; }
              92%, 96% { transform: scaleY(0.1); opacity: 0.1; }
            }

            .animate-det-leg-l {
              animation: det-walk-leg-l 0.8s linear infinite;
              transform-origin: 40px 118px;
            }
            .animate-det-leg-r {
              animation: det-walk-leg-r 0.8s linear infinite;
              transform-origin: 45px 118px;
            }
            .animate-det-walk-bob {
              animation: det-walk-body-bob 0.8s ease-in-out infinite;
              transform-origin: 45px 118px;
            }
            .animate-det-walk-arm {
              animation: det-walk-arm 0.8s ease-in-out infinite;
              transform-origin: 30px 76px;
            }
            .animate-det-walk-coat {
              animation: det-walk-coat 0.8s ease-in-out infinite;
              transform-origin: 45px 118px;
            }
            .animate-det-idle-body {
              animation: det-idle-chest 4s ease-in-out infinite;
              transform-origin: 45px 118px;
            }
            .animate-det-idle-coat {
              animation: det-idle-coat 4s ease-in-out infinite;
              transform-origin: 45px 118px;
            }
            .animate-det-idle-arm {
              animation: det-idle-arm 6s ease-in-out infinite;
              transform-origin: 30px 76px;
            }
            .animate-det-idle-head {
              animation: det-idle-head 4s ease-in-out infinite;
              transform-origin: 42px 70px;
            }
            .animate-det-pipe {
              animation: det-pipe-glow 2s ease-in-out infinite;
            }
            .animate-det-glasses {
              animation: det-glasses-glow 5s ease-in-out infinite;
            }
          `}</style>

          {/* Cat body silhouette */}
          <svg viewBox="0 0 100 100" className="w-full h-full text-neutral-950 drop-shadow-[0_4px_6px_rgba(0,0,0,0.8)] fill-neutral-950 stroke-neutral-700 stroke-2">
            {/* Tail */}
            <path 
              d="M 20 80 Q 5 60 10 35 Q 12 25 20 30 Q 18 45 28 75 Z" 
              className="animate-cat-tail"
              style={{ transformOrigin: '20px 80px' }}
            />
            {/* Feet */}
            <ellipse cx="40" cy="88" rx="8" ry="4" />
            <ellipse cx="60" cy="88" rx="8" ry="4" />
            {/* Body */}
            <ellipse cx="50" cy="65" rx="20" ry="25" />
            {/* Head */}
            <circle cx="50" cy="38" r="16" />
            {/* Ears */}
            <polygon points="34,30 30,10 44,25" className="animate-cat-ears" style={{ transformOrigin: '37px 23px' }} />
            <polygon points="66,30 70,10 56,25" className="animate-cat-ears" style={{ transformOrigin: '63px 23px' }} />
            {/* Glowing Eyes */}
            <ellipse cx="44" cy="36" rx="3.5" ry="2" className="fill-white stroke-none animate-cat-blink" style={{ transformOrigin: '44px 36px' }} />
            <ellipse cx="56" cy="36" rx="3.5" ry="2" className="fill-white stroke-none animate-cat-blink" style={{ transformOrigin: '56px 36px' }} />
          </svg>
          
          {/* Visual animation action overlays */}
          {visualAction === 'scratching' && (
            <div className="absolute inset-x-0 -bottom-2 flex justify-center gap-1">
              <span className="text-[10px] text-white font-bold tracking-widest animate-ping">ШКРЯБ!</span>
            </div>
          )}
          {visualAction === 'pushing' && (
            <div className="absolute inset-x-0 -bottom-2 flex justify-center gap-1">
              <span className="text-[10px] text-white font-bold tracking-widest animate-bounce">БРЯК!</span>
            </div>
          )}
          {visualAction === 'meowing' && (
            <div className="absolute -top-4 right-0 bg-neutral-900 border border-neutral-700 text-neutral-100 text-[9px] font-mono px-1 rounded shadow">
              Мяу!
            </div>
          )}
        </div>
      </div>

      {/* --- CODE DIAL LOCK OVERLAY (SAFE KEYPAD) --- */}
      {showSafeLock && (
        <div className="absolute inset-0 bg-black/95 flex items-center justify-center z-50 animate-fade-in">
          <div className="w-80 border border-white/10 bg-[#0a0a0a] p-6 rounded-none shadow-2xl flex flex-col items-center relative">
            
            {/* Close Button */}
            <button 
              onClick={() => {
                gameAudio.playClick();
                setShowSafeLock(false);
              }}
              className="absolute top-2 right-4 font-mono text-white/40 hover:text-white text-[11px] uppercase tracking-wider transition-colors"
            >
              [Закрыть]
            </button>

            <h3 className="font-serif text-base italic text-white/95 border-b border-white/10 pb-2 mb-4 w-full text-center">
              Сейф: Механический Шифр
            </h3>
            
            <p className="font-serif text-[11px] italic text-white/40 text-center mb-6 leading-relaxed">
              Крутите кодовые барабаны, чтобы выставить трехзначную комбинацию.
            </p>

            {/* Code Inputs */}
            <div className="flex gap-4 mb-6">
              {[0, 1, 2].map((idx) => (
                <div key={idx} className="flex flex-col items-center gap-2">
                  <button 
                    onClick={() => incrementDigit(idx)}
                    className="w-10 h-8 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-mono flex items-center justify-center font-bold text-xs"
                  >
                    ▲
                  </button>
                  <div className="w-12 h-16 bg-black border border-white/25 rounded-none flex items-center justify-center font-mono text-3xl text-white font-bold shadow-inner">
                    {safeDigits[idx]}
                  </div>
                  <button 
                    onClick={() => decrementDigit(idx)}
                    className="w-10 h-8 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-mono flex items-center justify-center font-bold text-xs"
                  >
                    ▼
                  </button>
                </div>
              ))}
            </div>

            {/* Error or Success message */}
            <div className="h-6 mb-4 font-mono text-[9px] uppercase tracking-wider text-center">
              {safeError && <span className="text-white/60 font-bold">ШИФР НЕВЕРЕН: ЗАСОВЫ НЕ ДВИГАЮТСЯ</span>}
              {safeSuccess && <span className="text-white tracking-widest animate-pulse font-bold">ОТКРЫТО! КЛИК-КЛАК!</span>}
            </div>

            {/* Crack safe button */}
            <button 
              onClick={handleSafeCodeSubmit}
              disabled={safeSuccess}
              className="w-full h-11 border border-white/10 hover:border-white hover:bg-white hover:text-black bg-black text-white text-xs font-sans font-bold tracking-[0.2em] transition-all rounded-none uppercase"
            >
              Повернуть рукоять
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
