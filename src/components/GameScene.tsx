/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { ObjectId, ObjectState, GameState } from '../types';
import { gameAudio } from '../utils/AudioEngine';
import { DetectiveCharacter } from './DetectiveCharacter';

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

  // Create refs to track physical positions for responsive, frame-exact movement
  const detectiveRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Dynamic Coordinates for cat placements (percentages from left and top of container)
  const getCatSpot = (spot: string) => {
    if (spot === 'center') return { x: 45, y: 84, height: 'h-16' };
    const obj = objects[spot as ObjectId];
    if (!obj) return { x: 45, y: 84, height: 'h-16' };
    
    const x = obj.x ? obj.x + (obj.w || 10) / 2 : 45;
    let y = 84;
    let height = 'h-14';
    
    if (spot === 'bookshelf') {
      const topNew = (obj.y ?? 16) + (obj.h ?? 70) * 0.2;
      y = topNew + 12.8;
    } else if (spot === 'desk') {
      const topNew = (obj.y ?? 58) + (obj.h ?? 32) * 0.2;
      y = topNew + 9.6;
    } else if (spot === 'safe') {
      const topNew = (obj.y ?? 66) + (obj.h ?? 28) * 0.2;
      y = topNew + 8.0;
    } else if (spot === 'painting') {
      const topNew = (obj.y ?? 15) + (obj.h ?? 12) * 0.1;
      y = topNew + 8.0;
    } else if (spot === 'fishbowl') {
      const deskH = objects.desk.h ?? 32;
      const topNew = (obj.y ?? 54) + (obj.h ?? 8) * 0.2 + deskH * 0.2;
      y = topNew + 6.4;
      height = 'h-12';
    } else if (spot === 'lamp') {
      const topNew = (obj.y ?? 45) + (obj.h ?? 55) * 0.2;
      y = topNew + 4.0;
    } else if (spot === 'rug') {
      height = 'h-16';
    }
    
    return { x, y, height };
  };

  // Multi-room visibility rules for Chapter 2 and custom multi-room sandbox locations
  const isChapter2 = gameState.storyState?.mode === 'story' && gameState.storyState?.chapter === 2;
  const isMultiRoom = gameState.roomInfo?.id === 'room_mansion' || gameState.roomInfo?.id === 'room_shop' || gameState.roomInfo?.id === 'room_museum';
  const hasMultipleRooms = isChapter2 || isMultiRoom;
  const currentLocation = gameState.storyState?.currentLocationId || 'pier';

  const isVisible = (id: ObjectId) => {
    if (!hasMultipleRooms) return true;
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

  // Helper to get the exact real-time physical X percentage of the detective inside the game scene
  const getPhysicalDetectiveX = () => {
    if (!detectiveRef.current || !containerRef.current) return detectiveX;
    const detRect = detectiveRef.current.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    const relativeLeft = detRect.left + detRect.width / 2 - containerRect.left;
    const pct = (relativeLeft / containerRect.width) * 100;
    return Math.max(0, Math.min(100, pct));
  };

  // Sync Detective position with active cat target. 
  // Detective stays still most of the time except when cat is at the desk, safe, or if he is stepping off the rug.
  useEffect(() => {
    if (catPosition === 'center') return;
    
    let shouldMove = false;
    let targetX = detectiveX;
    
    if (catPosition === 'desk') {
      shouldMove = true;
      targetX = getDetectiveTargetX('desk'); // 52
    } else if (catPosition === 'safe') {
      shouldMove = true;
      targetX = getDetectiveTargetX('safe'); // 78
    } else if (catPosition === 'rug') {
      const isStandingOnRug = (detectiveX >= 15 && detectiveX <= 70);
      if (isStandingOnRug) {
        shouldMove = true;
        targetX = detectiveX < 45 ? 12 : 78; // Step off the rug to the closer side
      }
    }
    
    if (detectiveWalkTimeoutRef.current) {
      clearTimeout(detectiveWalkTimeoutRef.current);
    }
    
    if (!shouldMove) {
      setDetectiveTransition('none');
      setDetectiveState('idle');
      return;
    }
    
    // Stop ongoing transition
    setDetectiveTransition('none');
    setDetectiveState('idle');
    
    // Start walk in next tick (30ms) after CSS has processed the snap
    const walkTimer = setTimeout(() => {
      const distance = Math.abs(targetX - detectiveX);
      if (distance < 1) {
        setDetectiveFacingLeft(targetX < detectiveX);
        return;
      }
      
      const duration = Math.max(600, distance * 22);
      setDetectiveTransition(`left ${duration}ms linear`);
      setDetectiveFacingLeft(targetX < detectiveX);
      setDetectiveState('walking');
      setDetectiveX(targetX);
      
      detectiveWalkTimeoutRef.current = setTimeout(() => {
        setDetectiveState('idle');
      }, duration);
    }, 30);
    
    return () => {
      clearTimeout(walkTimer);
      if (detectiveWalkTimeoutRef.current) {
        clearTimeout(detectiveWalkTimeoutRef.current);
      }
    };
  }, [catPosition]);

  // Sync Detective room entry walk on transition
  useEffect(() => {
    if (!hasMultipleRooms) return;
    
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
  }, [currentLocation, hasMultipleRooms]);

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
      return 'left 440ms ease-in-out, top 330ms cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    }
    if (visualAction === 'walking') {
      return 'left 650ms ease-in-out, top 650ms ease-in-out';
    }
    return 'left 200ms ease-out, top 200ms ease-out, transform 150ms ease-out';
  };

  const getClimbSteps = (from: string, to: string): (ObjectId | 'center')[] => {
    if (from === to) return [];
    const visible = (id: ObjectId) => isVisible(id);
    
    const getX = (spot: string): number => {
      if (spot === 'bookshelf') return 14;
      if (spot === 'painting') return 31;
      if (spot === 'desk') return 59;
      if (spot === 'fishbowl') return 52;
      if (spot === 'lamp') return 78;
      if (spot === 'safe') return 92.5;
      if (spot === 'trashcan') return 85;
      if (spot === 'rug') return 47;
      return 45; // 'center'
    };

    const getHeightClass = (spot: string): 'floor' | 'medium' | 'high' => {
      if (spot === 'center' || spot === 'rug' || spot === 'trashcan') return 'floor';
      if (spot === 'bookshelf' || spot === 'painting' || spot === 'lamp') return 'high';
      return 'medium'; // desk, safe, fishbowl
    };

    const fromX = getX(from);
    const toX = getX(to);
    const toHeight = getHeightClass(to);
    const fromHeight = getHeightClass(from);

    // If jumping to a high item (bookshelf, painting, lamp) and starting from floor
    if (toHeight === 'high' && fromHeight === 'floor') {
      // Only medium-height objects (desk, safe) are valid stepping stones
      const possibleHelpers: ObjectId[] = ['desk', 'safe'];
      const bestHelper = possibleHelpers.find(helper => {
        if (helper === to) return false;
        if (!visible(helper)) return false;
        const helperX = getX(helper);
        const distToTarget = Math.abs(helperX - toX);
        
        // Stepping stone must be close enough (physically nearby) to the target
        if (distToTarget <= 30) {
          return true;
        }
        return false;
      });

      if (bestHelper) {
        return [bestHelper, to as ObjectId];
      }
    }
    
    return [to as ObjectId];
  };

  const [climbQueue, setClimbQueue] = useState<(ObjectId | 'center')[]>([]);
  const [activeHopTarget, setActiveHopTarget] = useState<ObjectId | 'center' | null>(null);

  // Sync positions and queue up climb steps when catPosition updates from parent
  useEffect(() => {
    if (catPosition === currentSpot) {
      setVisualAction(catAction);
      return;
    }
    const steps = getClimbSteps(currentSpot, catPosition);
    if (steps.length > 0) {
      setClimbQueue(steps);
    }
  }, [catPosition]);

  // Process the climbing steps queue
  useEffect(() => {
    if (climbQueue.length > 0 && !activeHopTarget) {
      const nextHop = climbQueue[0];
      setClimbQueue(prev => prev.slice(1));
      setActiveHopTarget(nextHop);
    }
  }, [climbQueue, activeHopTarget]);

  // Run the current hop transition
  useEffect(() => {
    if (!activeHopTarget) return;

    const fromSpot = currentSpot;
    const toSpot = activeHopTarget;
    const fromCoords = getCatSpot(fromSpot);
    const toCoords = getCatSpot(toSpot);

    const isFromFloor = fromCoords.y >= 80;
    const isToFloor = toCoords.y >= 80;

    let timeouts: NodeJS.Timeout[] = [];

    const clearAllTimeouts = () => {
      timeouts.forEach(clearTimeout);
    };

    const onHopComplete = () => {
      setCurrentSpot(toSpot);
      setActiveHopTarget(null);
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
        onHopComplete();
      }, 700);
      timeouts.push(t2);

    } else if (isFromFloor && !isToFloor) {
      // Floor to Elevated: Walk horizontally to base, crouch, jump up snappy!
      setVisualAction('walking');
      setVisualCoords({ x: fromCoords.x, y: 84 });
      
      const t1 = setTimeout(() => {
        setVisualCoords({ x: toCoords.x, y: 84 });
      }, 50);
      timeouts.push(t1);

      const t2 = setTimeout(() => {
        setVisualAction('jumping');
        setScales({ x: 1.3, y: 0.65 });
      }, 700);
      timeouts.push(t2);

      const t3 = setTimeout(() => {
        setScales({ x: 0.75, y: 1.35 });
        setVisualCoords({ x: toCoords.x, y: toCoords.y });
      }, 920);
      timeouts.push(t3);

      const t4 = setTimeout(() => {
        setVisualAction(catAction);
        setScales({ x: 1.15, y: 0.85 });
      }, 1350);
      timeouts.push(t4);

      const t5 = setTimeout(() => {
        setScales({ x: 1, y: 1 });
        onHopComplete();
      }, 1515);
      timeouts.push(t5);

    } else if (!isFromFloor && isToFloor) {
      // Elevated to Floor: Crouch on surface, leap down, land, walk to target spot
      setVisualAction('jumping');
      setScales({ x: 1.3, y: 0.65 });

      const t1 = setTimeout(() => {
        setScales({ x: 0.8, y: 1.3 });
        setVisualCoords({ x: fromCoords.x, y: 84 });
      }, 220);
      timeouts.push(t1);

      const t2 = setTimeout(() => {
        setScales({ x: 1.15, y: 0.85 });
      }, 550);
      timeouts.push(t2);

      const t3 = setTimeout(() => {
        setVisualAction('walking');
        setScales({ x: 1, y: 1 });
        setVisualCoords({ x: toCoords.x, y: 84 });
      }, 715);
      timeouts.push(t3);

      const t4 = setTimeout(() => {
        setVisualAction(catAction);
        onHopComplete();
      }, 1365);
      timeouts.push(t4);

    } else {
      // Elevated to Elevated (different furniture heights)
      const dist = Math.abs(fromCoords.x - toCoords.x);
      if (dist < 25) {
        // Direct jump between nearby elevated items!
        setVisualAction('jumping');
        setScales({ x: 1.3, y: 0.65 });

        const t1 = setTimeout(() => {
          setScales({ x: 0.75, y: 1.35 });
          setVisualCoords({ x: toCoords.x, y: toCoords.y });
        }, 300);
        timeouts.push(t1);

        const t2 = setTimeout(() => {
          setVisualAction(catAction);
          setScales({ x: 1.15, y: 0.85 });
        }, 700);
        timeouts.push(t2);

        const t3 = setTimeout(() => {
          setScales({ x: 1, y: 1 });
          onHopComplete();
        }, 900);
        timeouts.push(t3);

      } else {
        // Far jump: Leap down to floor base, walk across, leap up onto target!
        setVisualAction('jumping');
        setScales({ x: 1.3, y: 0.65 });

        const t1 = setTimeout(() => {
          setScales({ x: 0.8, y: 1.3 });
          setVisualCoords({ x: fromCoords.x, y: 84 });
        }, 220);
        timeouts.push(t1);

        const t2 = setTimeout(() => {
          setVisualAction('walking');
          setScales({ x: 1.05, y: 0.95 });
          setVisualCoords({ x: toCoords.x, y: 84 });
        }, 550);
        timeouts.push(t2);

        const t3 = setTimeout(() => {
          setVisualAction('jumping');
          setScales({ x: 1.3, y: 0.65 });
        }, 1200);
        timeouts.push(t3);

        const t4 = setTimeout(() => {
          setScales({ x: 0.75, y: 1.35 });
          setVisualCoords({ x: toCoords.x, y: toCoords.y });
        }, 1420);
        timeouts.push(t4);

        const t5 = setTimeout(() => {
          setVisualAction(catAction);
          setScales({ x: 1.15, y: 0.85 });
        }, 1750);
        timeouts.push(t5);

        const t6 = setTimeout(() => {
          setScales({ x: 1, y: 1 });
          onHopComplete();
        }, 1915);
        timeouts.push(t6);
      }
    }

    return () => clearAllTimeouts();
  }, [activeHopTarget]);

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
      ref={containerRef}
      className={`relative w-full max-h-[420px] aspect-[16/10] mx-auto ${wallBgClass} border-4 ${borderAccentClass} rounded-none overflow-hidden select-none transition-all duration-300 ${
        lightning ? 'bg-white/10' : wallBgClass
      }`}
      style={{ boxShadow: 'inset 0 0 100px rgba(0,0,0,0.98)' }}
    >
      {/* Dynamic Rain Window, Porthole, or Dressing Mirror */}
      {gameState.roomInfo?.id === 'room_ballerina' ? (
        /* Ballerina dressing room back wall decoration: Lit mirror with light bulbs! */
        <div className="absolute top-[16%] left-[37%] w-[26%] h-[35%] border-4 border-amber-900 bg-neutral-900 shadow-2xl p-2 flex flex-col justify-center items-center relative">
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
        <div className="absolute top-[16%] left-[40%] w-[20%] aspect-square border-4 border-yellow-600 bg-neutral-900 rounded-full overflow-hidden shadow-2xl flex items-center justify-center relative">
          <div className="absolute inset-0 bg-neutral-950/40 pointer-events-none z-10" />
          {/* Rivets on bronze frame */}
          <div className="absolute inset-1 border-2 border-dashed border-yellow-700 rounded-full z-10 pointer-events-none" />
          {/* Sky with clouds & rain */}
          <div className="w-full h-full relative bg-neutral-950 overflow-hidden">
            {/* Soft sky light */}
            <div className="absolute inset-0 bg-gradient-to-b from-blue-950/20 to-neutral-950" />
            {/* Porthole grid cross */}
            <div className="absolute inset-x-0 top-1/2 h-0.5 bg-neutral-800 opacity-40 z-10" />
            <div className="absolute inset-y-0 left-1/2 w-0.5 bg-neutral-800 opacity-40 z-10" />
            
            {/* Sliding rain overlay */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
              <div className="absolute inset-0 flex justify-around">
                <div className="w-[1px] h-[150%] bg-white animate-rain" />
                <div className="w-[1.2px] h-[150%] bg-white animate-rain-delayed" />
                <div className="w-[1px] h-[150%] bg-white animate-rain-fast" />
              </div>
            </div>
            
            {/* Lightning flash overlay */}
            <div className={`absolute inset-0 bg-white/70 z-20 pointer-events-none transition-opacity duration-100 ${lightning ? 'opacity-100' : 'opacity-0'}`} />
          </div>
        </div>
      ) : (gameState.roomInfo?.id === 'room_antique' || gameState.roomInfo?.id === 'room_banker') ? (
        /* Antique/Banker double smaller windows layout */
        <div className="absolute inset-y-0 inset-x-4 pointer-events-none z-0">
          {/* Left window */}
          <div className="absolute top-[16%] left-[28%] w-[13%] h-[28%] border-2 border-neutral-700 bg-neutral-900 rounded overflow-hidden shadow-2xl flex relative">
            <div className="absolute inset-0 bg-neutral-950/40 pointer-events-none z-10" />
            <div className="absolute inset-x-0 top-1/2 h-0.5 bg-neutral-800 z-10" />
            <div className="absolute inset-y-0 left-1/2 w-0.5 bg-neutral-800 z-10" />
            
            <div className="w-full h-full relative opacity-40 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-neutral-800/10 to-neutral-950/80" />
              <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40">
                <div className="absolute inset-0 flex justify-around">
                  <div className="w-[1px] h-[150%] bg-white animate-rain" />
                  <div className="w-[1px] h-[150%] bg-white animate-rain-fast" />
                </div>
              </div>
            </div>
            <div className={`absolute inset-0 bg-white/90 z-20 pointer-events-none transition-opacity duration-100 ${lightning ? 'opacity-100' : 'opacity-0'}`} />
          </div>

          {/* Right window */}
          <div className="absolute top-[16%] left-[59%] w-[13%] h-[28%] border-2 border-neutral-700 bg-neutral-900 rounded overflow-hidden shadow-2xl flex relative">
            <div className="absolute inset-0 bg-neutral-950/40 pointer-events-none z-10" />
            <div className="absolute inset-x-0 top-1/2 h-0.5 bg-neutral-800 z-10" />
            <div className="absolute inset-y-0 left-1/2 w-0.5 bg-neutral-800 z-10" />
            
            <div className="w-full h-full relative opacity-40 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-neutral-800/10 to-neutral-950/80" />
              <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40">
                <div className="absolute inset-0 flex justify-around">
                  <div className="w-[1px] h-[150%] bg-white animate-rain-delayed" />
                  <div className="w-[1px] h-[150%] bg-white animate-rain-fast" />
                </div>
              </div>
            </div>
            <div className={`absolute inset-0 bg-white/90 z-20 pointer-events-none transition-opacity duration-100 ${lightning ? 'opacity-100' : 'opacity-0'}`} />
          </div>
        </div>
      ) : (
        /* Mansion/Default rectangular window */
        <div className="absolute top-[16%] left-[35%] w-[30%] h-[35%] border-2 border-neutral-700 bg-neutral-900 rounded overflow-hidden shadow-2xl flex relative">
          <div className="absolute inset-0 bg-neutral-950/40 pointer-events-none z-10" />
          {/* Window grid */}
          <div className="absolute inset-x-0 top-1/2 h-0.5 bg-neutral-800 z-10" />
          <div className="absolute inset-y-0 left-1/2 w-0.5 bg-neutral-800 z-10" />
          {/* Rain behind glass */}
          <div className="w-full h-full relative opacity-40 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-neutral-800/10 to-neutral-950/80" />
            {/* Distant dark skyline silhouettes */}
            <div className="absolute bottom-0 inset-x-0 flex items-end justify-around gap-1 opacity-20">
              <div className="w-8 h-20 bg-neutral-900 border-t border-neutral-700" />
              <div className="w-12 h-28 bg-neutral-900 border-t border-neutral-700" />
              <div className="w-10 h-16 bg-neutral-900 border-t border-neutral-700" />
              <div className="w-16 h-24 bg-neutral-900 border-t border-neutral-700" />
            </div>
            
            {/* Sliding rain lines */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40">
              <div className="absolute inset-0 flex justify-around">
                <div className="w-[1px] h-[150%] bg-white animate-rain" />
                <div className="w-[1px] h-[150%] bg-white animate-rain-delayed" />
                <div className="w-[1px] h-[150%] bg-white animate-rain-fast" />
              </div>
            </div>
          </div>
          
          {/* Lightning flash overlay */}
          <div className={`absolute inset-0 bg-white/95 z-20 pointer-events-none transition-opacity duration-100 ${lightning ? 'opacity-100' : 'opacity-0'}`} />
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
          left: `${(objects.bookshelf.x ?? 4) + (objects.bookshelf.w ?? 20) * 0.1}%`,
          top: `${(objects.bookshelf.y ?? 16) + (objects.bookshelf.h ?? 70) * 0.2}%`,
          width: `${(objects.bookshelf.w ?? 20) * 0.8}%`,
          height: `${(objects.bookshelf.h ?? 70) * 0.8}%`
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
          left: `${(objects.painting.x ?? 25) + (objects.painting.w ?? 12) * 0.1}%`,
          top: `${(objects.painting.y ?? 15) + (objects.painting.h ?? 12) * 0.1}%`,
          width: `${(objects.painting.w ?? 12) * 0.8}%`,
          height: `${(objects.painting.h ?? 12) * 0.8}%`
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
          left: `${(objects.rug.x ?? 28) + (objects.rug.w ?? 38) * 0.1}%`,
          top: `${(objects.rug.y ?? 82) + (objects.rug.h ?? 16) * 0.2}%`,
          width: `${(objects.rug.w ?? 38) * 0.8}%`,
          height: `${(objects.rug.h ?? 16) * 0.8}%`
        }}
      >
        <div 
          className={`w-full h-full bg-neutral-900/80 flex items-center justify-center transition-all duration-300 relative ${
            objects.rug.toggled ? 'skew-x-12 translate-x-3 scale-x-95 border-neutral-500' : 'group-hover:scale-[1.01]'
          }`}
          style={{ 
            clipPath: 'polygon(12% 0%, 88% 0%, 100% 100%, 0% 100%)',
            backgroundImage: gameState.roomInfo?.id === 'room_ballerina'
              ? 'repeating-linear-gradient(45deg, #2d1b22, #2d1b22 4px, #3d242f 4px, #3d242f 8px)' // pink accent
              : gameState.roomInfo?.id === 'room_captain'
              ? 'repeating-linear-gradient(45deg, #13222d, #13222d 4px, #1a2f3d 4px, #1a2f3d 8px)' // captain navy-themed
              : 'repeating-linear-gradient(45deg, #1c1c1c, #1c1c1c 4px, #262626 4px, #262626 8px)' 
          }}
        >
          {/* Folded edge indicating interaction */}
          {objects.rug.toggled && (
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-neutral-950 border-l border-neutral-500 rounded-r shadow-inner flex items-center justify-center">
              <span className="text-[9px] font-mono text-neutral-400">ПОДНЯТ</span>
            </div>
          )}
          {/* Direct clue glow if revealed */}
          {objects.rug.toggled && objects.rug.heldClueId && !foundClueIds.includes(objects.rug.heldClueId) && (
            <div className="absolute left-8 top-1/2 -translate-y-1/2 w-4 h-4 bg-white/25 rounded-full animate-ping" />
          )}
        </div>
        <span className="text-center font-sans text-[9px] uppercase tracking-[0.2em] text-white/30 group-hover:text-white/80 transition-colors duration-200 block truncate mt-1">
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
          left: `${(objects.desk.x ?? 43) + (objects.desk.w ?? 32) * 0.1}%`,
          top: `${(objects.desk.y ?? 58) + (objects.desk.h ?? 32) * 0.2}%`,
          width: `${(objects.desk.w ?? 32) * 0.8}%`,
          height: `${(objects.desk.h ?? 32) * 0.8}%`
        }}
      >
        <div className="relative w-full h-full flex flex-col justify-end group-hover:scale-[1.01] transition-transform duration-200">
          {/* Desk Surface items */}
          <div className="absolute -top-5 inset-x-2 h-6 flex justify-between items-end pointer-events-none px-3 z-10">
            {gameState.roomInfo?.id === 'room_ballerina' ? (
              <>
                <div className="text-[12px]">💄</div>
                <div className="text-[12px] transform rotate-12">🪞</div>
              </>
            ) : (
              <>
                {/* Ink bottle */}
                <div className="w-3.5 h-4 bg-neutral-950 border border-neutral-700 rounded-sm flex items-start justify-center">
                  <div className="w-1 h-1 bg-neutral-700 rounded-full -mt-0.5" />
                </div>
                
                {/* Papers pile */}
                <div className="relative w-8 h-2.5">
                  <div className="absolute bottom-0 right-0 w-6 h-0.5 bg-neutral-200 border border-neutral-400 transform rotate-1" />
                  <div className="absolute bottom-0.5 right-0.5 w-6 h-0.5 bg-neutral-100 border border-neutral-300 transform -rotate-2" />
                </div>
              </>
            )}
          </div>

          {gameState.roomInfo?.id === 'room_ballerina' || gameState.roomInfo?.id === 'room_antique' ? (
            /* Chest of Drawers / Dresser (Комод) */
            <div className="w-full h-[80%] border-2 border-neutral-700 bg-neutral-900 rounded p-1 group-hover:border-neutral-500 shadow-2xl flex flex-col gap-1 justify-between">
              {/* Drawer 1 */}
              <div className="w-full h-[28%] border border-neutral-800 bg-neutral-950/40 rounded flex items-center justify-center relative">
                {/* Brass knob */}
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-600 border border-yellow-500" />
                {/* Lock hole */}
                <div className={`absolute right-3 w-1 h-1 rounded-full ${objects.desk.locked ? 'bg-neutral-500' : 'bg-transparent'} border border-neutral-700`} />
              </div>
              {/* Drawer 2 */}
              <div className="w-full h-[28%] border border-neutral-800 bg-neutral-950/40 rounded flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-600 border border-yellow-500" />
              </div>
              {/* Drawer 3 */}
              <div className="w-full h-[28%] border border-neutral-800 bg-neutral-950/40 rounded flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-600 border border-yellow-500" />
              </div>
            </div>
          ) : (
            /* Table with Legs (Стол на ножках) */
            <div className="w-full h-[80%] flex flex-col justify-between">
              {/* Tabletop & Drawer box */}
              <div className="w-full h-[45%] border-2 border-neutral-700 bg-neutral-900 rounded-t p-1 shadow-md flex items-center justify-center relative group-hover:border-neutral-500">
                <div className="w-12 h-3.5 border border-neutral-800 bg-neutral-950/80 rounded flex items-center justify-center relative">
                  {/* Lock hole */}
                  <div className={`w-1 h-1 rounded-full ${objects.desk.locked ? 'bg-neutral-500' : 'bg-transparent'} border border-neutral-700`} />
                  <div className="absolute bottom-0 w-6 h-0.5 bg-neutral-700" />
                </div>
              </div>
              {/* Transparent space with two legs */}
              <div className="w-full h-[55%] flex justify-between px-5">
                <div className="w-1.5 h-full bg-neutral-700 border-r border-neutral-800" />
                <div className="w-1.5 h-full bg-neutral-700 border-l border-neutral-800" />
              </div>
            </div>
          )}
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
          left: `${(objects.fishbowl.x ?? 48) + (objects.fishbowl.w ?? 8) * 0.1}%`,
          top: `${(objects.fishbowl.y ?? 54) + (objects.fishbowl.h ?? 8) * 0.2 + (objects.desk.h ?? 32) * 0.36}%`,
          width: `${(objects.fishbowl.w ?? 8) * 0.8}%`,
          height: `${(objects.fishbowl.h ?? 8) * 0.8}%`
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
          left: `${(objects.lamp.x ?? 74) + (objects.lamp.w ?? 8) * 0.1}%`,
          top: `${(objects.lamp.y ?? 45) + (objects.lamp.h ?? 55) * 0.2}%`,
          width: `${(objects.lamp.w ?? 8) * 0.8}%`,
          height: `${(objects.lamp.h ?? 55) * 0.8}%`
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
                  <div className="absolute top-[80%] w-[450%] h-[550%] left-1/2 -translate-x-1/2 bg-gradient-to-b from-white/20 via-white/5 to-transparent pointer-events-none" 
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
          left: `${(objects.trashcan.x ?? 80) + (objects.trashcan.w ?? 10) * 0.1}%`,
          top: `${(objects.trashcan.y ?? 82) + (objects.trashcan.h ?? 16) * 0.2}%`,
          width: `${(objects.trashcan.w ?? 10) * 0.8}%`,
          height: `${(objects.trashcan.h ?? 16) * 0.8}%`
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
          left: `${(objects.safe.x ?? 87) + (objects.safe.w ?? 11) * 0.1}%`,
          top: `${(objects.safe.y ?? 66) + (objects.safe.h ?? 28) * 0.2}%`,
          width: `${(objects.safe.w ?? 11) * 0.8}%`,
          height: `${(objects.safe.h ?? 28) * 0.8}%`
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

      {/* --- DOORS FOR MULTI-ROOM TRANSITIONS --- */}
      {hasMultipleRooms && currentLocation === 'pier' && (() => {
        const roomId = gameState.roomInfo?.id;
        let doorText = 'Внутрь склада';
        let isStairs = false;
        if (roomId === 'room_mansion') {
          doorText = 'На 2-й этаж';
          isStairs = true;
        } else if (roomId === 'room_shop') {
          doorText = 'В подсобку';
        } else if (roomId === 'room_museum') {
          doorText = 'В зал скульптур';
        }
        return (
          <div 
            onClick={() => onChangeLocation?.('warehouse')}
            className="absolute bottom-16 right-[15%] w-[12%] h-[35%] group cursor-pointer z-20 flex flex-col justify-end items-center animate-fade-in"
          >
            <div className="w-full h-full border-2 border-dashed border-amber-500/40 hover:border-amber-400 bg-black/80 rounded p-3 flex flex-col justify-between items-center shadow-2xl transition-all hover:scale-105">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />
              {isStairs ? (
                <svg viewBox="0 0 24 24" className="w-10 h-10 text-amber-500/70 group-hover:text-amber-400 transition-colors fill-none stroke-current stroke-1.5">
                  <path d="M6 20h4v-4h4v-4h4v-4h4V4" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="w-10 h-10 text-amber-500/70 group-hover:text-amber-400 transition-colors fill-none stroke-current stroke-1.5">
                  <path d="M15 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8m-3-9 4 4m0 0-4 4m4-4H9" />
                </svg>
              )}
              <span className="text-[8px] font-sans text-center font-bold tracking-wider text-amber-500/70 group-hover:text-amber-400 uppercase leading-tight">{doorText}</span>
            </div>
          </div>
        );
      })()}

      {hasMultipleRooms && currentLocation === 'warehouse' && (() => {
        const roomId = gameState.roomInfo?.id;
        let doorText = 'На причал';
        let isStairs = false;
        if (roomId === 'room_mansion') {
          doorText = 'На 1-й этаж';
          isStairs = true;
        } else if (roomId === 'room_shop') {
          doorText = 'В торговый зал';
        } else if (roomId === 'room_museum') {
          doorText = 'В зал картин';
        }
        return (
          <div 
            onClick={() => onChangeLocation?.('pier')}
            className="absolute bottom-16 left-[25%] w-[12%] h-[35%] group cursor-pointer z-20 flex flex-col justify-end items-center animate-fade-in"
          >
            <div className="w-full h-full border-2 border-dashed border-amber-500/40 hover:border-amber-400 bg-black/80 rounded p-3 flex flex-col justify-between items-center shadow-2xl transition-all hover:scale-105">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />
              {isStairs ? (
                <svg viewBox="0 0 24 24" className="w-10 h-10 text-amber-500/70 group-hover:text-amber-400 transition-colors fill-none stroke-current stroke-1.5">
                  <path d="M18 4h-4v4h-4v4h-4v4H2v4" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="w-10 h-10 text-amber-500/70 group-hover:text-amber-400 transition-colors fill-none stroke-current stroke-1.5">
                  <path d="M10 3H20a2 2 0 0 1 2 2V19a2 2 0 0 1-2 2H10M14 8l-4 4m0 0 4 4m-4-4h10" />
                </svg>
              )}
              <span className="text-[8px] font-sans text-center font-bold tracking-wider text-amber-500/70 group-hover:text-amber-400 uppercase leading-tight">{doorText}</span>
            </div>
          </div>
        );
      })()}

      {/* --- DETECTIVE BARTH (Animated character) --- */}
      <DetectiveCharacter
        detectiveX={detectiveX}
        detectiveState={detectiveState}
        detectiveFacingLeft={detectiveFacingLeft}
        detectiveTransition={detectiveTransition}
        smokeRings={smokeRings}
        detectiveRef={detectiveRef}
      />

      {/* --- CAT MIDNIGHT (Animated sprite) --- */}
      <div 
        className={`absolute pointer-events-none z-30 flex flex-col items-center justify-end ${getCatSpot(currentSpot).height}`}
        style={{
          left: `${visualCoords.x + (isWandering ? wanderOffset : 0)}%`,
          top: `${visualCoords.y}%`,
          transform: `translate(-50%, -100%) scale(${scales.x}, ${scales.y})`,
          transition: getTransitionStyle()
        }}
      >
        <div className="relative w-14 h-14">
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

      {/* Senses heightening overlays & purchased rumors */}
      {(() => {
        const highlights: React.ReactNode[] = [];
        if (gameState.hasCatnipSenses) {
          Object.values(gameState.objects).forEach(obj => {
            const isVisibleObj = isVisible(obj.id);
            const hasContent = obj.heldClueId !== null || obj.heldItemId !== null;
            if (isVisibleObj && hasContent) {
              highlights.push(
                <div 
                  key={`catnip_${obj.id}`}
                  className="absolute pointer-events-none z-40 flex items-center justify-center"
                  style={{
                    left: `${(obj.x ?? 10) + (obj.w ?? 10) / 2 - 2}%`,
                    top: `${(obj.y ?? 10) + 10}%`,
                    width: '16px',
                    height: '16px'
                  }}
                >
                  <div className="w-3 h-3 bg-emerald-400 border border-emerald-300 rounded-full animate-ping absolute" />
                  <div className="w-2 h-2 bg-emerald-500 rounded-full border border-white/50" />
                </div>
              );
            }
          });
        }
        if (gameState.revealedObjects) {
          gameState.revealedObjects.forEach(objId => {
            const obj = gameState.objects[objId];
            const isVisibleObj = isVisible(objId);
            if (obj && isVisibleObj) {
              highlights.push(
                <div 
                  key={`rumor_${objId}`}
                  className="absolute pointer-events-none z-40 flex items-center justify-center animate-bounce"
                  style={{
                    left: `${(obj.x ?? 10) + (obj.w ?? 10) / 2 - 4}%`,
                    top: `${(obj.y ?? 10) - 8}%`,
                    width: '32px',
                    height: '32px'
                  }}
                >
                  <div className="px-1.5 py-0.5 bg-amber-950 border border-amber-400 text-amber-300 text-[8px] font-mono font-bold tracking-wider rounded uppercase">
                    ★ ТУТ!
                  </div>
                </div>
              );
            }
          });
        }
        return highlights;
      })()}

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
