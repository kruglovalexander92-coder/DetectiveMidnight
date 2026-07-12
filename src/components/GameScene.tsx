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
  onDetectiveInteraction: () => void;
  onEnterSafeCode: (code: string) => boolean;
  onChangeLocation?: (location: 'pier' | 'warehouse' | 'hall' | 'study' | 'attic' | 'basement') => void;
}

export default function GameScene({
  gameState,
  onObjectInteraction,
  onDetectiveInteraction,
  onEnterSafeCode,
  onChangeLocation
}: GameSceneProps) {
  const { objects, catPosition, catAction, safeCode, foundClueIds } = gameState;
  const [lightning, setLightning] = useState(false);

  const getRoomBackground = (roomId: string | undefined, currentLocation: string) => {
    if (!roomId) return null;
    
    // For 4-room building layout
    if (currentLocation === 'hall') {
      return '/src/img/Office_02.png'; // Cozy vintage hall
    }
    if (currentLocation === 'study') {
      return '/src/img/Office_01.png'; // Writer's/detective's private office
    }
    if (currentLocation === 'attic') {
      return '/src/img/Cabin_03.png'; // Dust-filled attic with skylight
    }
    if (currentLocation === 'basement') {
      return '/src/img/Industrial_.png'; // Industrial wet basement
    }

    if (currentLocation === 'pier') {
      if (roomId === 'room_shop') return '/src/img/Grocery_.png';
      if (roomId === 'room_mansion') return '/src/img/Office_01.png';
      if (roomId === 'room_museum') return '/src/img/Office_02.png';
      return '/src/img/Industrial_.png';
    }
    switch (roomId) {
      case 'room_antique':
      case 'story_chapter_1':
        return '/src/img/Cabin_03.png';
      case 'room_ballerina':
        return '/src/img/Dressingr_.png';
      case 'room_banker':
        return '/src/img/Office_01.png';
      case 'room_captain':
      case 'story_chapter_2':
        return '/src/img/Office_02.png';
      case 'room_shop':
        return '/src/img/Grocery_.png';
      case 'room_mansion':
        return '/src/img/Office_01.png';
      case 'room_museum':
        return '/src/img/Office_01.png';
      case 'room_basement':
      case 'room_alleyway':
      case 'story_chapter_3':
        return '/src/img/Industrial_.png';
      case 'room_attic':
        return '/src/img/Cabin_03.png';
      default:
        const idLower = roomId.toLowerCase();
        if (idLower.includes('cabin') || idLower.includes('antique') || idLower.includes('attic') || idLower.includes('basement')) {
          return '/src/img/Cabin_03.png';
        }
        if (idLower.includes('ballerina') || idLower.includes('dress')) {
          return '/src/img/Dressingr_.png';
        }
        if (idLower.includes('grocer') || idLower.includes('shop')) {
          return '/src/img/Grocery_.png';
        }
        if (idLower.includes('industr') || idLower.includes('ware') || idLower.includes('pier')) {
          return '/src/img/Industrial_.png';
        }
        if (idLower.includes('office') || idLower.includes('bank') || idLower.includes('mansion')) {
          return '/src/img/Office_01.png';
        }
        return '/src/img/Cabin_03.png';
    }
  };

  const getRugImg = () => {
    const roomId = gameState.roomInfo?.id || '';
    const idLower = roomId.toLowerCase();

    // Grocery/Shop theme rooms
    if (idLower.includes('shop') || idLower.includes('grocery')) {
      return '/src/img/Grocery_Rug01.png';
    }
    if (idLower.includes('bar')) {
      return '/src/img/Grocery_Rug02.png';
    }
    if (idLower.includes('garage') || idLower.includes('warehouse')) {
      return '/src/img/Grocery_Rug03.png';
    }

    // Office theme rooms
    if (idLower.includes('office') || idLower.includes('banker')) {
      return '/src/img/Office_Rug01.png';
    }
    if (idLower.includes('mansion') || idLower.includes('museum')) {
      return '/src/img/Office_Rug02.png';
    }
    if (idLower.includes('captain') || idLower.includes('chapter_2')) {
      return '/src/img/Office_Rug03.png';
    }

    // Cabin/Antique theme rooms
    if (idLower.includes('antique') || idLower.includes('chapter_1')) {
      return '/src/img/Cabin_Rug01.png';
    }
    if (idLower.includes('attic')) {
      return '/src/img/Cabin_Rug02.png';
    }
    if (idLower.includes('kitchen') || idLower.includes('cabin') || idLower.includes('basement')) {
      return '/src/img/Cabin_Rug03.png';
    }

    // Fallbacks
    if (idLower.includes('ballerina') || idLower.includes('dress')) {
      return '/src/img/Cabin_Rug01.png';
    }
    if (idLower.includes('industrial') || idLower.includes('park') || idLower.includes('alleyway') || idLower.includes('chapter_3')) {
      return '/src/img/Grocery_Rug03.png';
    }

    return '/src/img/Cabin_Rug01.png';
  };

  const getWallPictureImg = () => {
    const roomId = gameState.roomInfo?.id || '';
    const idLower = roomId.toLowerCase();

    // Cabin-themed rooms
    if (idLower.includes('antique') || idLower.includes('chapter_1')) {
      return '/src/img/Cabin_WallPicture01.png';
    }
    if (idLower.includes('attic')) {
      return '/src/img/Cabin_WallPicture02.png';
    }
    if (idLower.includes('kitchen')) {
      return '/src/img/Cabin_WallPicture03.png';
    }
    if (idLower.includes('cabin') || idLower.includes('basement')) {
      return '/src/img/Cabin_WallPicture04.png';
    }

    // Grocery/Shop-themed rooms
    if (idLower.includes('shop') || idLower.includes('grocery')) {
      return '/src/img/Grocery_WallPicture01.png';
    }
    if (idLower.includes('bar')) {
      return '/src/img/Grocery_WallPicture02.png';
    }
    if (idLower.includes('garage') || idLower.includes('workshop')) {
      return '/src/img/Grocery_WallPicture03.png';
    }

    // Office-themed rooms
    if (idLower.includes('office') || idLower.includes('banker')) {
      return '/src/img/Office_WallPicture01.png';
    }
    if (idLower.includes('mansion') || idLower.includes('museum')) {
      return '/src/img/Office_WallPicture02.png';
    }
    if (idLower.includes('captain') || idLower.includes('chapter_2')) {
      return '/src/img/Office_WallPicture03.png';
    }

    // Default fallbacks based on background/theme
    if (idLower.includes('ballerina') || idLower.includes('dress')) {
      return '/src/img/Cabin_WallPicture01.png';
    }
    if (idLower.includes('warehouse') || idLower.includes('industrial') || idLower.includes('park') || idLower.includes('alleyway') || idLower.includes('chapter_3')) {
      return '/src/img/Grocery_WallPicture03.png';
    }

    return '/src/img/Cabin_WallPicture01.png';
  };

  const getSafeImg = () => {
    const roomId = gameState.roomInfo?.id || '';
    const idLower = roomId.toLowerCase();
    const isLocked = !!objects.safe.locked;

    // Сейфы темы Cabin
    if (idLower.includes('captain') || idLower.includes('chapter_2')) {
      return isLocked ? '/src/img/Cabin_Safe01.png' : '/src/img/Cabin_Safe01_open.png';
    }
    if (idLower.includes('attic') || idLower.includes('basement')) {
      return isLocked ? '/src/img/Cabin_Safe02.png' : '/src/img/Cabin_Safe02_open.png';
    }

    // Сейфы темы Grocery
    if (idLower.includes('shop') || idLower.includes('grocery') || idLower.includes('workshop')) {
      return isLocked ? '/src/img/Grocery_Safe01.png' : '/src/img/Grocery_Safe01_open.png';
    }
    if (idLower.includes('bar') || idLower.includes('kitchen') || idLower.includes('garage') || idLower.includes('alleyway') || idLower.includes('park')) {
      return isLocked ? '/src/img/Grocery_Safe02.png' : '/src/img/Grocery_Safe02_open.png';
    }

    // Сейфы темы Office (все остальные, включая офисы, банкиров, антикваров, особняки, музеи, а также дефолтные)
    return isLocked ? '/src/img/Office_Safe.png' : '/src/img/Office_Safe_open.png';
  };

  const getSafeStandImg = () => {
    const roomId = gameState.roomInfo?.id || '';
    const idLower = roomId.toLowerCase();

    if (idLower.includes('ballerina') || idLower.includes('dress')) return '/src/img/Dressingr_Safe_Shelf1.png';
    if (idLower.includes('shop') || idLower.includes('grocery') || idLower.includes('bar')) return '/src/img/Grocery_Safe_Shelf1.png';
    if (idLower.includes('captain') || idLower.includes('chapter_2')) return '/src/img/Cabin_Safe_Shelf1.png';
    if (idLower.includes('office') || idLower.includes('banker')) return '/src/img/Office_Safe_Shelf1.png';

    return '/src/img/Mansion_Safe_Shelf1.png';
  };

  const getFishbowlImg = () => {
    const roomId = gameState.roomInfo?.id || '';
    const idLower = roomId.toLowerCase();
    const isBroken = !!objects.fishbowl.broken || !!objects.fishbowl.tipped;

    if (isBroken) {
      if (idLower.includes('mansion') || idLower.includes('ballerina')) return '/src/img/Aquarium/Mansion_Aquarium_Broken.png';
      if (idLower.includes('cabin') || idLower.includes('attic') || idLower.includes('basement') || idLower.includes('captain')) return '/src/img/Aquarium/Cabin_Aquarium_01_break.png';
      if (idLower.includes('shop') || idLower.includes('grocery') || idLower.includes('bar')) return '/src/img/Aquarium/Grocery_Aquarium_01_break.png';
      if (idLower.includes('industr')) return '/src/img/Aquarium/Industrial_Aquarium_01_break.png';
      if (idLower.includes('office') || idLower.includes('banker')) return '/src/img/Aquarium/Office_Aquarium_01_break.png';
      return '/src/img/Aquarium/Mansion_Aquarium_Broken.png';
    }

    if (idLower.includes('mansion') || idLower.includes('ballerina')) return '/src/img/Aquarium/Mansion_Aquarium_Empty.png';
    if (idLower.includes('cabin') || idLower.includes('attic') || idLower.includes('basement') || idLower.includes('captain')) return '/src/img/Aquarium/Cabin_Aquarium_01_empty.png';
    if (idLower.includes('shop') || idLower.includes('grocery') || idLower.includes('bar')) return '/src/img/Aquarium/Grocery_Aquarium_01_empty.png';
    if (idLower.includes('industr')) return '/src/img/Aquarium/Industrial_Aquarium_01_empty.png';
    if (idLower.includes('office') || idLower.includes('banker')) return '/src/img/Aquarium/Office_Aquarium_01_empty.png';
    return '/src/img/Aquarium/Mansion_Aquarium_Empty.png';
  };

  const getFishbowlStandImg = () => {
    const roomId = gameState.roomInfo?.id || '';
    const idLower = roomId.toLowerCase();

    if (idLower.includes('ballerina') || idLower.includes('dress')) return '/src/img/Dressingr_Safe_Shelf1.png';
    if (idLower.includes('shop') || idLower.includes('grocery') || idLower.includes('bar')) return '/src/img/Grocery_Safe_Shelf1.png';
    if (idLower.includes('captain') || idLower.includes('chapter_2') || idLower.includes('basement') || idLower.includes('cabin') || idLower.includes('attic')) return '/src/img/Cabin_Safe_Shelf1.png';
    if (idLower.includes('office') || idLower.includes('banker')) return '/src/img/Office_Safe_Shelf1.png';

    return '/src/img/Mansion_Safe_Shelf1.png';
  };

  const renderFishes = () => {
    const roomId = gameState.roomInfo?.id || '';
    const idHash = roomId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // Choose big fish: 11 or 12
    const bigFishNum = 11 + (idHash % 2);
    
    // Choose 2 small fishes (between 02 and 10)
    const sf1Num = 2 + (idHash % 9);
    let sf2Num = 2 + ((idHash + 4) % 9);
    if (sf1Num === sf2Num) sf2Num = (sf2Num % 9) + 2;

    const getFishPath = (num: number) => {
      const numStr = num < 10 ? `0${num}` : `${num}`;
      return `/src/img/Aquarium_fish/Aquarium_fish_${numStr}.png`;
    };

    const sf1Img = getFishPath(sf1Num);
    const sf2Img = getFishPath(sf2Num);
    const bfImg = getFishPath(bigFishNum);

    const isBroken = !!objects.fishbowl.broken || !!objects.fishbowl.tipped;

    if (isBroken) {
      return (
        <div className="absolute inset-0 w-full h-full flex items-end justify-around pb-1 px-2">
          {/* Big Fish lying at bottom, twitching */}
          <div className="relative w-[30%] h-[22%] flex items-center justify-center animate-fish-twitch">
            <img
              src={bfImg}
              alt="Рыба"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          {/* Small fish 1 */}
          <div className="relative w-[18%] h-[15%] flex items-center justify-center animate-fish-twitch" style={{ animationDelay: '0.6s' }}>
            <img
              src={sf1Img}
              alt="Рыбка"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          {/* Small fish 2 */}
          <div className="relative w-[16%] h-[14%] flex items-center justify-center animate-fish-twitch" style={{ animationDelay: '1.3s' }}>
            <img
              src={sf2Img}
              alt="Рыбка"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      );
    }

    return (
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        {/* Big fish swimming */}
        <div className="absolute left-[12%] top-[35%] w-[34%] h-[28%] animate-swim-slow">
          <img
            src={bfImg}
            alt="Рыба"
            className="w-full h-full object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
        {/* Small fish 1 swimming */}
        <div className="absolute left-[38%] top-[20%] w-[20%] h-[18%] animate-swim-medium">
          <img
            src={sf1Img}
            alt="Рыбка"
            className="w-full h-full object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
        {/* Small fish 2 swimming */}
        <div className="absolute left-[18%] top-[55%] w-[18%] h-[16%] animate-swim-fast">
          <img
            src={sf2Img}
            alt="Рыбка"
            className="w-full h-full object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    );
  };

  const getDeskImg = () => {
    const roomId = gameState.roomInfo?.id || '';
    const idLower = roomId.toLowerCase();

    // Dressing room (Ballerina / etc)
    if (idLower.includes('ballerina') || idLower.includes('dress')) {
      if (idLower.includes('2')) {
        return '/src/img/Dressingr_Console02.png';
      }
      if (idLower.includes('drawer')) {
        return '/src/img/Dressingr_Drawer.png';
      }
      return '/src/img/Dressingr_Console01.png';
    }

    // Grocery / Shop
    if (idLower.includes('shop') || idLower.includes('grocery') || idLower.includes('bar')) {
      return '/src/img/Grocery_Table.png';
    }

    // Cabin / Antique / Attic / Basement
    if (idLower.includes('cabin') || idLower.includes('antique') || idLower.includes('attic') || idLower.includes('basement') || idLower.includes('chapter_1') || idLower.includes('chapter_3')) {
      return '/src/img/Cabin_Table.png';
    }

    // Office / Banker / Mansion / Museum / Default
    return '/src/img/Office_Table.png';
  };

  const getBookshelfImg = () => {
    const roomId = gameState.roomInfo?.id || '';
    const idLower = roomId.toLowerCase();

    // Cabin / Antique / Attic / Basement
    if (idLower.includes('cabin') || idLower.includes('antique') || idLower.includes('attic') || idLower.includes('basement') || idLower.includes('chapter_1') || idLower.includes('chapter_3')) {
      if (idLower.includes('attic') || idLower.includes('basement')) {
        return '/src/img/Cabin_Shelf02.png';
      }
      return '/src/img/Cabin_Shelf01.png';
    }

    // Grocery / Shop
    if (idLower.includes('shop') || idLower.includes('grocery') || idLower.includes('bar')) {
      if (idLower.includes('bar')) {
        return '/src/img/Grocery_Shelf02.png';
      }
      return '/src/img/Grocery_Shelf01.png';
    }

    // Office / Banker / Mansion / Museum / Default
    if (idLower.includes('mansion') || idLower.includes('museum')) {
      return '/src/img/Office_Shelf02.png';
    }
    return '/src/img/Office_Shelf01.png';
  };

  const renderRugSVG = (roomId: string, isToggled: boolean) => {
    // Return null to completely remove the blue/slate rectangular background around the rug.
    return null;
  };

  // Create refs to track physical positions for responsive, frame-exact movement
  const detectiveRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Multi-room visibility rules for Chapter 2 and custom multi-room sandbox locations
  const isFourRoomBuilding = (gameState.storyState?.mode === 'story' && (gameState.storyState?.chapter === 1 || gameState.storyState?.chapter === 3)) || 
                             (gameState.roomInfo?.id || '').startsWith('custom_campaign_ch_');
  const isChapter2 = gameState.storyState?.mode === 'story' && gameState.storyState?.chapter === 2;
  const isMultiRoom = gameState.roomInfo?.id === 'room_mansion' || gameState.roomInfo?.id === 'room_shop' || gameState.roomInfo?.id === 'room_museum';
  const hasMultipleRooms = isChapter2 || isMultiRoom || isFourRoomBuilding;
  const currentLocation = gameState.storyState?.currentLocationId || (isFourRoomBuilding ? 'hall' : 'pier');

  const isVisible = (id: ObjectId) => {
    if (!hasMultipleRooms) return true;
    if (isFourRoomBuilding) {
      if (currentLocation === 'hall') {
        return ['rug', 'trashcan'].includes(id);
      } else if (currentLocation === 'study') {
        return ['desk', 'lamp'].includes(id);
      } else if (currentLocation === 'attic') {
        return ['bookshelf', 'painting'].includes(id);
      } else if (currentLocation === 'basement') {
        return ['safe', 'fishbowl', 'safeStand'].includes(id);
      }
      return false;
    }
    if (currentLocation === 'pier') {
      return ['rug', 'trashcan', 'painting', 'fishbowl'].includes(id);
    } else {
      return ['bookshelf', 'desk', 'safe', 'lamp', 'safeStand'].includes(id);
    }
  };
  
  const deskScale = 1.75;
  const deskX = (objects.desk?.x ?? 43) - ((objects.desk?.w ?? 32) * (deskScale - 1)) / 2;
  const deskW = (objects.desk?.w ?? 32) * deskScale;
  const deskY = (objects.desk?.y ?? 58) - ((objects.desk?.h ?? 32) * (deskScale - 1));
  const deskH = (objects.desk?.h ?? 32) * deskScale;

  const deskScreenLeft = deskX + deskW * 0.1;
  const deskScreenWidth = deskW * 0.8;
  const deskScreenTop = deskY + deskH * 0.2;
  const deskScreenHeight = deskH * 0.8;
  const deskTabletopY = deskScreenTop + deskScreenHeight * 0.2;

  const isDeskVisible = isVisible('desk');

  // Dynamic Positioning of SafeStand
  let safeStandLeft = objects.safeStand?.x ?? 58;
  let safeStandTop = objects.safeStand?.y ?? 84;
  let safeStandWidth = objects.safeStand?.w ?? 16;
  let safeStandHeight = objects.safeStand?.h ?? 18;

  if (isVisible('safeStand')) {
    // If visible, place it on the left side instead of near the desk
    safeStandLeft = 10;
    safeStandWidth = 25; // 20 * 1.25 = 25
    safeStandHeight = 25; // 20 * 1.25 = 25
    safeStandTop = 84 - safeStandHeight + 1.0;
  }

  // Dynamic Positioning of Fishbowl & its Stand (Cabinet)
  // Let's place it opposite to the safe stand!
  const isSafeStandOnLeft = safeStandLeft < 50;

  let fishbowlStandLeft = isSafeStandOnLeft ? 74 : 14;
  let fishbowlStandWidth = 20;
  let fishbowlStandHeight = 20;
  let fishbowlStandTop = 84 - fishbowlStandHeight + 1.0;

  const roomId = gameState.roomInfo?.id || '';
  const idLower = roomId.toLowerCase();
  const isRoundAquarium = idLower.includes('shop') || idLower.includes('grocery') || idLower.includes('bar');

  let fishbowlWidth = isRoundAquarium ? 24 : 20;
  let fishbowlHeight = isRoundAquarium ? 22 : 18;
  let fishbowlLeft = fishbowlStandLeft + (fishbowlStandWidth - fishbowlWidth) / 2;
  let fishbowlTop = fishbowlStandTop - fishbowlHeight + 12.8;

  // Dynamic Positioning of Lamp
  let lampLeft = objects.lamp?.x ?? 74;
  if (isVisible('safeStand')) {
    lampLeft = isSafeStandOnLeft ? 86 : 5;
  }

  // Dynamic Positioning of Safe
  let safeLeft = objects.safe?.x ?? 87;
  let safeTop = objects.safe?.y ?? 66;
  let safeWidth = objects.safe?.w ?? 11;
  let safeHeight = objects.safe?.h ?? 28;

  if (isVisible('safeStand')) {
    safeWidth = safeStandWidth * 0.68; // (0.8 * 0.85) = 0.68 approx 15% reduction
    safeHeight = safeStandHeight * 1.0; // Adjusted for better fit
    safeLeft = safeStandLeft + (safeStandWidth - safeWidth) / 2;
    safeTop = safeStandTop - safeHeight + 11.0; // Adjusted to sit on top of stand
  } else if (isDeskVisible) {
    safeWidth = deskScreenWidth * 0.52;
    safeHeight = safeWidth * 1.125;
    safeLeft = deskScreenLeft + deskScreenWidth * 0.43;
    safeTop = deskTabletopY - safeHeight + 3.5;
  } else {
    safeLeft = 58;
    safeWidth = 16;
    safeHeight = 18;
    safeTop = 84 - safeHeight + 1.0;
  }

  // Dynamic Coordinates for cat placements (percentages from left and top of container)
  const getCatSpot = (spot: string) => {
    if (spot === 'center') return { x: 45, y: 84, height: 'h-16' };
    const obj = objects[spot as ObjectId];
    if (!obj) return { x: 45, y: 84, height: 'h-16' };
    
    if (spot === 'safe') {
      return { x: safeLeft + safeWidth / 2, y: safeTop + 2, height: 'h-14' };
    }
    if (spot === 'fishbowl') {
      return { x: fishbowlLeft + fishbowlWidth / 2, y: fishbowlTop + 1, height: 'h-12' };
    }
    
    const x = obj.x ? obj.x + (obj.w || 10) / 2 : 45;
    let y = 84;
    let height = 'h-14';
    
    if (spot === 'bookshelf') {
      // Pushed up by 2% for depth, scaled to 0.75
      const topNew = (obj.y ?? 16) + (obj.h ?? 70) * 0.2 - 2;
      y = topNew + (12.8 * 0.75);
    } else if (spot === 'desk') {
      const topNew = (obj.y ?? 58) + (obj.h ?? 32) * 0.2;
      y = topNew + 9.6;
    } else if (spot === 'painting') {
      const topNew = (obj.y ?? 15) + (obj.h ?? 12) * 0.1;
      y = topNew + 8.0;
    } else if (spot === 'lamp') {
      // Pushed up by 2% for depth, scaled to 0.75
      const topNew = (obj.y ?? 45) + (obj.h ?? 55) * 0.2 - 2;
      y = topNew + (4.0 * 0.75);
    } else if (spot === 'rug') {
      height = 'h-16';
    }
    
    return { x, y, height };
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
  const [detectiveTransition, setDetectiveTransition] = useState('none');

  // Place the detective in a static random position facing the larger part of the room upon entering a room or changing location.
  useEffect(() => {
    // Elegant positions that don't block critical interactive items
    const STAND_POSITIONS = [18, 32, 72, 78];
    const randomPos = STAND_POSITIONS[Math.floor(Math.random() * STAND_POSITIONS.length)];
    
    setDetectiveX(randomPos);
    setDetectiveFacingLeft(randomPos >= 50); // Face left if on the right side of the screen, face right if on the left side
    setDetectiveState('idle');
    setDetectiveTransition('none');
  }, [gameState.roomInfo?.id, currentLocation]);

  const handleDetectiveInteraction = () => {
    onDetectiveInteraction();
    
    // Move detective
    const STAND_POSITIONS = [18, 32, 50, 72, 78];
    const availablePositions = STAND_POSITIONS.filter(pos => Math.abs(pos - detectiveX) > 10);
    if (availablePositions.length > 0) {
      const nextX = availablePositions[Math.floor(Math.random() * availablePositions.length)];
      const distance = Math.abs(nextX - detectiveX);
      const duration = Math.max(2.0, distance * 0.06); // seconds

      setDetectiveFacingLeft(nextX < detectiveX);
      setDetectiveTransition(`left ${duration}s ease-in-out`);
      setDetectiveState('walking');
      setDetectiveX(nextX);

      // Stop walk animation upon arrival
      setTimeout(() => {
        setDetectiveState('idle');
        setDetectiveTransition('none');
      }, duration * 1000);
    }
  };

  // --- DETECTIVE AUTONOMOUS WANDERING LOOP ---
  useEffect(() => {
    if (gameState.gameStatus !== 'playing') return;
    if (detectiveState === 'walking') return;

    const wanderTimeout = setTimeout(() => {
      const STAND_POSITIONS = [18, 32, 50, 72, 78];
      const availablePositions = STAND_POSITIONS.filter(pos => Math.abs(pos - detectiveX) > 10);
      if (availablePositions.length === 0) return;

      const nextX = availablePositions[Math.floor(Math.random() * availablePositions.length)];
      const distance = Math.abs(nextX - detectiveX);
      const duration = Math.max(2.0, distance * 0.06); // seconds

      // Walk!
      setDetectiveFacingLeft(nextX < detectiveX);
      setDetectiveTransition(`left ${duration}s ease-in-out`);
      setDetectiveState('walking');
      setDetectiveX(nextX);

      // Stop walk animation upon arrival
      const arrivalTimeout = setTimeout(() => {
        setDetectiveState('idle');
        setDetectiveTransition('none');
      }, duration * 1000);

      return () => clearTimeout(arrivalTimeout);
    }, 8000 + Math.random() * 8000); // Wait between 8 to 16 seconds

    return () => clearTimeout(wanderTimeout);
  }, [gameState.gameStatus, detectiveX, detectiveState]);

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
      if (spot === 'bookshelf') return (objects.bookshelf?.x ?? 4) + (objects.bookshelf?.w ?? 20) / 2;
      if (spot === 'painting') return (objects.painting?.x ?? 25) + (objects.painting?.w ?? 12) / 2;
      if (spot === 'desk') return (objects.desk?.x ?? 43) + (objects.desk?.w ?? 32) / 2;
      if (spot === 'fishbowl') return fishbowlLeft + fishbowlWidth / 2;
      if (spot === 'lamp') return (objects.lamp?.x ?? 74) + (objects.lamp?.w ?? 8) / 2;
      if (spot === 'safe') return safeLeft + safeWidth / 2;
      if (spot === 'trashcan') return (objects.trashcan?.x ?? 85) + (objects.trashcan?.w ?? 10) / 2;
      if (spot === 'rug') return (objects.rug?.x ?? 47) + (objects.rug?.w ?? 30) / 2;
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

  const borderAccentClass = gameState.roomInfo?.accentBorder || 'border-white/10';
  const backgroundUrl = getRoomBackground(gameState.roomInfo?.id, currentLocation);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full max-h-[420px] aspect-[16/10] mx-auto border-4 ${borderAccentClass} rounded-none overflow-hidden select-none transition-all duration-300`}
      style={{ 
        boxShadow: 'inset 0 0 120px rgba(0,0,0,0.98)',
        backgroundColor: lightning ? '#e5e5e5' : '#050505',
        backgroundImage: backgroundUrl ? `linear-gradient(to bottom, rgba(0,0,0,0.35), rgba(0,0,0,0.7)), url(${backgroundUrl})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Dynamic Rain Window, Porthole, or Dressing Mirror */}
      {gameState.roomInfo?.id === 'room_ballerina' ? (
        /* Ballerina dressing room back wall decoration: Lit mirror with light bulbs! */
        <div className="absolute top-[16%] left-[37%] w-[26%] h-[35%] border-4 border-amber-900 bg-neutral-900 shadow-2xl p-2 flex flex-col justify-center items-center relative z-[2]">
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
        <div className="absolute top-[16%] left-[40%] w-[20%] aspect-square border-4 border-yellow-600 bg-neutral-900 rounded-full overflow-hidden shadow-2xl flex items-center justify-center relative z-[2]">
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
        <div className="absolute inset-y-0 inset-x-4 pointer-events-none z-[2]">
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
        <div className="absolute top-[26%] left-[35%] w-[30%] h-[35%] border-2 border-neutral-700 bg-neutral-900 rounded overflow-hidden shadow-2xl flex relative z-[2]">
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
        className="absolute group cursor-pointer z-10 flex flex-col justify-end brightness-[0.82] saturate-[90%] contrast-[95%] transition-all duration-300 hover:brightness-100 hover:saturate-100 hover:contrast-100"
        style={{
          left: `${(objects.bookshelf.x ?? 4) + (objects.bookshelf.w ?? 20) * 0.1}%`,
          top: `${(objects.bookshelf.y ?? 16) + (objects.bookshelf.h ?? 70) * 0.2 - 2}%`,
          width: `${(objects.bookshelf.w ?? 20) * 0.75}%`,
          height: `${(objects.bookshelf.h ?? 70) * 0.75}%`,
          zIndex: objects.bookshelf.zIndex
        }}
      >
        <div className="relative w-full h-full group-hover:scale-[1.01] transition-transform duration-200">
          <div className="relative w-full h-full border-2 border-neutral-750 bg-neutral-900 rounded-md p-1.5 flex flex-col justify-between transition-colors duration-200 group-hover:border-neutral-500 group-hover:bg-neutral-900/90 shadow-2xl">
            {/* Shelf panels */}
            {[1, 2, 3, 4].map((shelf) => (
              <div key={shelf} className="w-full h-[22%] border-b border-neutral-800 flex items-end justify-around px-1 relative">
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
        className="absolute group cursor-pointer z-10 flex flex-col items-center"
        style={{
          left: `${(objects.painting.x ?? 25) + (objects.painting.w ?? 12) * 0.1}%`,
          top: `${(objects.painting.y ?? 15) + (objects.painting.h ?? 12) * 0.1}%`,
          width: `${(objects.painting.w ?? 12) * 0.8}%`,
          height: `${(objects.painting.w ?? 12) * 0.8 * 1.6}%`, // Perfect 1:1 physical aspect ratio on 16:10 screen!
          zIndex: objects.painting.zIndex
        }}
      >
        <div 
          className={`w-full h-full transition-all duration-500 flex items-center justify-center relative ${
            objects.painting.toggled ? 'rotate-[15deg] translate-y-1' : 'group-hover:scale-[1.03]'
          }`}
        >
          {/* Custom painting graphic based on setting */}
          <div className="w-full h-full relative flex items-center justify-center">
            <img 
              src={getWallPictureImg()} 
              alt={objects.painting.name}
              className="w-full h-full object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)] z-10"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).style.opacity = '0';
              }}
            />
            {/* Fallback emoji / vector styling if the image fails to load */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 border-2 border-neutral-700 bg-neutral-900 rounded shadow-md opacity-25">
              {gameState.roomInfo?.id === 'room_ballerina' ? (
                <span className="text-[16px] animate-pulse">🩰</span>
              ) : (gameState.roomInfo?.id === 'room_captain' || gameState.roomInfo?.id === 'story_chapter_2') ? (
                <span className="text-[16px]">⛵</span>
              ) : (
                <div className="w-full h-full flex flex-col justify-end items-center p-1 opacity-20">
                  <div className="w-4 h-4 rounded-full bg-neutral-800 border border-neutral-600 mb-1" />
                  <div className="w-8 h-8 rounded-t-full bg-neutral-700 border border-neutral-500" />
                </div>
              )}
            </div>
          </div>
          {/* Tiny paper sticking out */}
          {!objects.painting.toggled && (
            <div className="absolute -bottom-1 right-1 w-2.5 h-4 bg-neutral-400 transform rotate-12 shadow-md border border-neutral-500" />
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
        className="absolute group cursor-pointer z-10"
        style={{
          left: `${(objects.rug.x ?? 28) + (objects.rug.w ?? 38) * 0.1}%`,
          top: `${(objects.rug.y ?? 82) + 2}%`, // Centered on floor line
          width: `${(objects.rug.w ?? 38) * 0.8}%`,
          height: `${(objects.rug.w ?? 38) * 0.8 * 0.45}%`, // Flat 3D perspective floor aspect ratio
          zIndex: objects.rug.zIndex
        }}
      >
        <div 
          className={`w-full h-full flex items-center justify-center transition-all duration-300 relative ${
            objects.rug.toggled ? 'skew-x-12 translate-x-3 scale-x-95 opacity-80' : 'group-hover:scale-[1.01]'
          }`}
        >
          {/* Render the incredibly detailed, vector-perfect SVG Rug based on Room settings */}
          {renderRugSVG(gameState.roomInfo?.id || '', !!objects.rug.toggled)}

          {/* PNG image loaded on top, which hides itself if it fails to load (fallback overlay) */}
          <img 
            src={getRugImg()} 
            alt={objects.rug.name}
            className="absolute inset-0 w-full h-full object-fill drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] transition-opacity duration-300 z-10"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />

          {/* Folded edge indicating interaction */}
          {objects.rug.toggled && (
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-neutral-950/95 border-l border-neutral-500 rounded-r shadow-inner flex items-center justify-center z-20">
              <span className="text-[9px] font-mono text-neutral-400">ПОДНЯТ</span>
            </div>
          )}
          {/* Direct clue glow if revealed */}
          {objects.rug.toggled && objects.rug.heldClueId && !foundClueIds.includes(objects.rug.heldClueId) && (
            <div className="absolute left-8 top-1/2 -translate-y-1/2 w-4 h-4 bg-white/25 rounded-full animate-ping pointer-events-none z-20" />
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
        className="absolute group cursor-pointer z-20 flex flex-col justify-end"
        style={{
          left: `${deskScreenLeft}%`,
          top: `${deskScreenTop}%`,
          width: `${deskScreenWidth}%`,
          height: `${deskScreenHeight}%`,
          zIndex: objects.desk.zIndex
        }}
      >
        <div className="relative w-full h-full flex flex-col justify-end group-hover:scale-[1.01] transition-transform duration-200">
          {/* Dressing Room Mirror Option */}
          {gameState.roomInfo?.id === 'room_ballerina' && (
            <img 
              src="/src/img/Dressingr_Tablemirror.png" 
              alt="Dressing mirror" 
              className="absolute top-[-70%] left-[20%] w-[60%] h-[80%] object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.6)] z-20"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}

          {/* Desk PNG Graphic (Primary overlay) */}
          <img 
            src={getDeskImg()} 
            alt={objects.desk.name}
            className="absolute inset-x-0 bottom-0 w-full h-full object-contain object-bottom drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] z-10"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />

          {/* Lock/Unlock status overlay */}
          {objects.desk.locked && (
            <div className="absolute bottom-[40%] left-1/2 -translate-x-1/2 bg-neutral-950/80 px-1.5 py-0.5 rounded border border-neutral-700 text-[8px] tracking-wider font-sans text-neutral-400 z-20 pointer-events-none uppercase">
              🔒 заперто
            </div>
          )}

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
            <div className="hidden">
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
            <div className="hidden">
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

      {/* 5. Fishbowl & its Cabinet Stand */}
      {isVisible('fishbowl') && (
        <>
          {/* Render Stand/Cabinet for Fishbowl */}
          <div
            id="fishbowl-stand-obj"
            className="absolute z-10 flex flex-col justify-end"
            style={{
              left: `${fishbowlStandLeft}%`,
              top: `${fishbowlStandTop}%`,
              width: `${fishbowlStandWidth}%`,
              height: `${fishbowlStandHeight}%`,
              zIndex: objects.safeStand?.zIndex
            }}
          >
            <div className="relative w-full h-full">
              <img
                src={getFishbowlStandImg()}
                alt="Подставка"
                className="w-full h-full object-contain drop-shadow-md brightness-95"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          </div>

          {/* Actual Fishbowl */}
          <div
            id="fishbowl-obj"
            onClick={() => handleObjectClick('fishbowl')}
            className="absolute group cursor-pointer z-30 flex flex-col justify-end"
            style={{
              left: `${fishbowlLeft}%`,
              top: `${fishbowlTop}%`,
              width: `${fishbowlWidth}%`,
              height: `${fishbowlHeight}%`,
              zIndex: objects.fishbowl.zIndex
            }}
          >
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={getFishbowlImg()}
                alt={objects.fishbowl.name}
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              
              {/* Dynamic Fishes rendering inside/on top of the aquarium */}
              <div
                className="absolute pointer-events-none"
                style={
                  isRoundAquarium
                    ? { left: '35%', right: '35%', top: '25%', bottom: '38%' }
                    : { left: '18%', right: '18%', top: '18%', bottom: '18%' }
                }
              >
                {renderFishes()}
              </div>
            </div>
            <span className="text-center font-sans text-[9px] uppercase tracking-[0.2em] text-white/30 group-hover:text-white/80 mt-1 block truncate w-full">
              {objects.fishbowl.name}
            </span>
          </div>
        </>
      )}

      {/* 6. Floor Lamp (Right Desk) */}
      {isVisible('lamp') && (
      <div
        id="lamp-obj"
        onClick={() => handleObjectClick('lamp')}
        className="absolute group cursor-pointer z-[12] flex flex-col justify-end brightness-[0.82] saturate-[85%] transition-all duration-300 hover:brightness-100 hover:saturate-100"
        style={{
          left: `${lampLeft + (objects.lamp.w ?? 8) * 0.1}%`,
          top: `${(objects.lamp.y ?? 45) + (objects.lamp.h ?? 55) * 0.2 - 2}%`,
          width: `${(objects.lamp.w ?? 8) * 0.75}%`,
          height: `${(objects.lamp.h ?? 55) * 0.75}%`,
          zIndex: objects.lamp.zIndex
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
                         clipPath: 'polygon(39% 0%, 61% 0%, 100% 100%, 0% 100%)',
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
        className="absolute group cursor-pointer z-15"
        style={{
          left: `${(objects.trashcan.x ?? 80) + (objects.trashcan.w ?? 10) * 0.1}%`,
          top: `${(objects.trashcan.y ?? 82) + (objects.trashcan.h ?? 16) * 0.2}%`,
          width: `${(objects.trashcan.w ?? 10) * 0.8}%`,
          height: `${(objects.trashcan.h ?? 16) * 0.8}%`,
          zIndex: objects.trashcan.zIndex
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

      {/* 7.5. Safe Stand */}
      {isVisible('safeStand') && (
      <div
        id="safe-stand-obj"
        className="absolute z-0 flex flex-col justify-end"
        style={{
          left: `${safeStandLeft}%`,
          top: `${safeStandTop}%`,
          width: `${safeStandWidth}%`,
          height: `${safeStandHeight}%`,
          zIndex: objects.safeStand?.zIndex
        }}
      >
        <div className="relative w-full h-full">
          <img
            src={getSafeStandImg()}
            alt={objects.safeStand?.name || 'Подставка'}
            className="w-full h-full object-contain drop-shadow-lg"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      </div>
      )}
 
      {/* 8. Steel Safe (Right Side Corner) */}
      {isVisible('safe') && (
      <div
        id="safe-obj"
        onClick={() => handleObjectClick('safe')}
        className="absolute group cursor-pointer z-0 flex flex-col justify-end"
        style={{
          left: `${safeLeft}%`,
          top: `${safeTop}%`,
          width: `${safeWidth}%`,
          height: `${safeHeight}%`,
          zIndex: objects.safe.zIndex
        }}
      >
        <div className="relative w-full h-full transition-all duration-300 hover:scale-105">
          <img
            src={getSafeImg()}
            alt={objects.safe.name}
            className="w-full h-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]"
            referrerPolicy="no-referrer"
          />
          {/* Lock status LED indicator */}
          <div className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full ${objects.safe.locked ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,1)]' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,1)]'} animate-pulse pointer-events-none`} />
        </div>
        <span className="text-center font-sans text-[9px] uppercase tracking-[0.2em] text-white/30 group-hover:text-white/80 transition-colors duration-200 mt-1 block truncate w-full">
          {objects.safe.name}
        </span>
      </div>
      )}

      {/* --- DOORS FOR MULTI-ROOM TRANSITIONS (CHAPTER 2 / SANDBOX) --- */}
      {hasMultipleRooms && !isFourRoomBuilding && currentLocation === 'pier' && (() => {
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
            className="absolute bottom-[16%] right-[0.5%] w-[3.5%] h-[52%] group cursor-pointer z-20 flex flex-col justify-end items-center animate-fade-in opacity-25 hover:opacity-90 transition-all duration-300"
          >
            <div className="w-full h-full border border-dashed border-amber-500/40 hover:border-amber-400 bg-black/95 rounded p-1 flex flex-col justify-between items-center shadow-2xl transition-all hover:scale-105">
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
              {isStairs ? (
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-amber-500/70 group-hover:text-amber-400 transition-colors fill-none stroke-current stroke-1.5">
                  <path d="M6 20h4v-4h4v-4h4v-4h4V4" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-amber-500/70 group-hover:text-amber-400 transition-colors fill-none stroke-current stroke-1.5">
                  <path d="M15 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8m-3-9 4 4m0 0-4 4m4-4H9" />
                </svg>
              )}
              <span className="text-[5px] font-sans text-center font-semibold tracking-tighter text-amber-500/70 group-hover:text-amber-400 uppercase leading-none truncate w-full">{doorText}</span>
            </div>
          </div>
        );
      })()}

      {hasMultipleRooms && !isFourRoomBuilding && currentLocation === 'warehouse' && (() => {
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
            className="absolute bottom-[16%] left-[0.5%] w-[3.5%] h-[52%] group cursor-pointer z-20 flex flex-col justify-end items-center animate-fade-in opacity-25 hover:opacity-90 transition-all duration-300"
          >
            <div className="w-full h-full border border-dashed border-amber-500/40 hover:border-amber-400 bg-black/95 rounded p-1 flex flex-col justify-between items-center shadow-2xl transition-all hover:scale-105">
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
              {isStairs ? (
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-amber-500/70 group-hover:text-amber-400 transition-colors fill-none stroke-current stroke-1.5">
                  <path d="M18 4h-4v4h-4v4h-4v4H2v4" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-amber-500/70 group-hover:text-amber-400 transition-colors fill-none stroke-current stroke-1.5">
                  <path d="M10 3H20a2 2 0 0 1 2 2V19a2 2 0 0 1-2 2H10M14 8l-4 4m0 0 4 4m-4-4h10" />
                </svg>
              )}
              <span className="text-[5px] font-sans text-center font-semibold tracking-tighter text-amber-500/70 group-hover:text-amber-400 uppercase leading-none truncate w-full">{doorText}</span>
            </div>
          </div>
        );
      })()}

      {/* --- INTERACTIVE BLUEPRINT MAP (4-ROOM LAYOUTS) --- */}
      {isFourRoomBuilding && (
        <div className="absolute top-3 right-3 z-30 bg-slate-950/95 border border-cyan-500/40 p-2 font-mono flex flex-col gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.2)] rounded w-[140px] animate-fade-in backdrop-blur-md">
          <span className="text-[7px] text-cyan-400 font-bold uppercase tracking-[0.15em] text-center border-b border-cyan-500/20 pb-1 mb-0.5 block">
            🗺️ СХЕМА ЗДАНИЯ
          </span>
          <div className="flex flex-col gap-1 text-[8px] uppercase tracking-wider text-center">
            {/* Attic */}
            <button
              onClick={() => onChangeLocation?.('attic')}
              className={`p-1 border rounded transition-all duration-200 ${
                currentLocation === 'attic'
                  ? 'bg-cyan-950/80 text-cyan-400 border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.4)] font-bold'
                  : 'bg-slate-900/60 text-slate-500 border-slate-800 hover:border-cyan-500/40 hover:text-cyan-400'
              }`}
            >
              <div className="flex items-center justify-center gap-1">
                {currentLocation === 'attic' && <div className="w-1 h-1 bg-cyan-400 rounded-full animate-ping" />}
                ▲ ЧЕРДАК
              </div>
            </button>

            {/* Study & Hall */}
            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={() => onChangeLocation?.('hall')}
                className={`p-1 border rounded transition-all duration-200 ${
                  currentLocation === 'hall'
                    ? 'bg-cyan-950/80 text-cyan-400 border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.4)] font-bold'
                    : 'bg-slate-900/60 text-slate-500 border-slate-800 hover:border-cyan-500/40 hover:text-cyan-400'
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  {currentLocation === 'hall' && <div className="w-1 h-1 bg-cyan-400 rounded-full animate-ping" />}
                  ▤ ХОЛЛ
                </div>
              </button>
              <button
                onClick={() => onChangeLocation?.('study')}
                className={`p-1 border rounded transition-all duration-200 ${
                  currentLocation === 'study'
                    ? 'bg-cyan-950/80 text-cyan-400 border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.4)] font-bold'
                    : 'bg-slate-900/60 text-slate-500 border-slate-800 hover:border-cyan-500/40 hover:text-cyan-400'
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  {currentLocation === 'study' && <div className="w-1 h-1 bg-cyan-400 rounded-full animate-ping" />}
                  ✍ КАБИНЕТ
                </div>
              </button>
            </div>

            {/* Basement */}
            <button
              onClick={() => onChangeLocation?.('basement')}
              className={`p-1 border rounded transition-all duration-200 ${
                currentLocation === 'basement'
                  ? 'bg-cyan-950/80 text-cyan-400 border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.4)] font-bold'
                  : 'bg-slate-900/60 text-slate-500 border-slate-800 hover:border-cyan-500/40 hover:text-cyan-400'
              }`}
            >
              <div className="flex items-center justify-center gap-1">
                {currentLocation === 'basement' && <div className="w-1 h-1 bg-cyan-400 rounded-full animate-ping" />}
                ▼ ПОДВАЛ
              </div>
            </button>
          </div>
        </div>
      )}

      {/* --- DOORS FOR FOUR-ROOM BUILDING --- */}
      {isFourRoomBuilding && currentLocation === 'hall' && (
        <>
          {/* Staircase to Attic (Left side) */}
          <div 
            onClick={() => onChangeLocation?.('attic')}
            className="absolute bottom-[20%] left-[0.5%] w-[3.5%] h-[48%] group cursor-pointer z-20 flex flex-col justify-end items-center opacity-25 hover:opacity-90 transition-all duration-300"
          >
            <div className="w-full h-full border border-cyan-500/30 hover:border-cyan-400 bg-slate-950/95 rounded p-1 flex flex-col justify-between items-center shadow-2xl transition-all hover:scale-105">
              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-cyan-500/70 group-hover:text-cyan-400 transition-colors fill-none stroke-current stroke-1.5">
                <path d="M6 20h4v-4h4v-4h4v-4h4V4" />
              </svg>
              <span className="text-[5px] font-mono text-center font-bold tracking-tight text-cyan-500/70 group-hover:text-cyan-400 uppercase leading-none truncate w-full">Чердак</span>
            </div>
          </div>

          {/* Door to Study (Right side) */}
          <div 
            onClick={() => onChangeLocation?.('study')}
            className="absolute bottom-[20%] right-[0.5%] w-[3.5%] h-[48%] group cursor-pointer z-20 flex flex-col justify-end items-center opacity-25 hover:opacity-90 transition-all duration-300"
          >
            <div className="w-full h-full border border-cyan-500/30 hover:border-cyan-400 bg-slate-950/95 rounded p-1 flex flex-col justify-between items-center shadow-2xl transition-all hover:scale-105">
              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-cyan-500/70 group-hover:text-cyan-400 transition-colors fill-none stroke-current stroke-1.5">
                <path d="M15 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8m-3-9 4 4m0 0-4 4m4-4H9" />
              </svg>
              <span className="text-[5px] font-mono text-center font-bold tracking-tight text-cyan-500/70 group-hover:text-cyan-400 uppercase leading-none truncate w-full">Кабинет</span>
            </div>
          </div>

          {/* Trapdoor hatch to Basement (Middle floor) */}
          <div 
            onClick={() => onChangeLocation?.('basement')}
            className="absolute bottom-[0.5%] left-[47%] w-[6%] h-[11%] group cursor-pointer z-20 flex flex-col justify-end items-center opacity-25 hover:opacity-90 transition-all duration-300"
          >
            <div className="w-full h-full border border-amber-500/30 hover:border-amber-400 bg-slate-950/95 rounded p-1 flex flex-col justify-between items-center shadow-2xl transition-all hover:scale-105">
              <span className="text-[5px] font-mono text-center font-bold tracking-tight text-amber-500/70 group-hover:text-amber-400 uppercase leading-none truncate w-full">Люк</span>
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-amber-500/70 group-hover:text-amber-400 transition-colors fill-none stroke-current stroke-1.5">
                <rect x="3" y="14" width="18" height="7" rx="1" />
                <path d="M12 14v-4m0 0 3 3m-3-3-3 3" />
              </svg>
            </div>
          </div>
        </>
      )}

      {isFourRoomBuilding && currentLocation === 'study' && (
        <div 
          onClick={() => onChangeLocation?.('hall')}
          className="absolute bottom-[20%] left-[0.5%] w-[3.5%] h-[48%] group cursor-pointer z-20 flex flex-col justify-end items-center opacity-25 hover:opacity-90 transition-all duration-300"
        >
          <div className="w-full h-full border border-cyan-500/30 hover:border-cyan-400 bg-slate-950/95 rounded p-1 flex flex-col justify-between items-center shadow-2xl transition-all hover:scale-105">
            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-cyan-500/70 group-hover:text-cyan-400 transition-colors fill-none stroke-current stroke-1.5">
              <path d="M10 3H20a2 2 0 0 1 2 2V19a2 2 0 0 1-2 2H10M14 8l-4 4m0 0 4 4m-4-4h10" />
            </svg>
            <span className="text-[5px] font-mono text-center font-bold tracking-tight text-cyan-500/70 group-hover:text-cyan-400 uppercase leading-none truncate w-full">В холл</span>
          </div>
        </div>
      )}

      {isFourRoomBuilding && currentLocation === 'attic' && (
        <div 
          onClick={() => onChangeLocation?.('hall')}
          className="absolute bottom-[20%] left-[0.5%] w-[3.5%] h-[48%] group cursor-pointer z-20 flex flex-col justify-end items-center opacity-25 hover:opacity-90 transition-all duration-300"
        >
          <div className="w-full h-full border border-cyan-500/30 hover:border-cyan-400 bg-slate-950/95 rounded p-1 flex flex-col justify-between items-center shadow-2xl transition-all hover:scale-105">
            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-cyan-500/70 group-hover:text-cyan-400 transition-colors fill-none stroke-current stroke-1.5">
              <path d="M18 4h-4v4h-4v4h-4v4H2v4" />
            </svg>
            <span className="text-[5px] font-mono text-center font-bold tracking-tight text-cyan-500/70 group-hover:text-cyan-400 uppercase leading-none truncate w-full">Спуск</span>
          </div>
        </div>
      )}

      {isFourRoomBuilding && currentLocation === 'basement' && (
        <div 
          onClick={() => onChangeLocation?.('hall')}
          className="absolute bottom-[20%] left-[0.5%] w-[3.5%] h-[48%] group cursor-pointer z-20 flex flex-col justify-end items-center opacity-25 hover:opacity-90 transition-all duration-300"
        >
          <div className="w-full h-full border border-cyan-500/30 hover:border-cyan-400 bg-slate-950/95 rounded p-1 flex flex-col justify-between items-center shadow-2xl transition-all hover:scale-105">
            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-cyan-500/70 group-hover:text-cyan-400 transition-colors fill-none stroke-current stroke-1.5">
              <path d="M12 4v16M8 8h8M8 12h8M8 16h8" />
            </svg>
            <span className="text-[5px] font-mono text-center font-bold tracking-tight text-cyan-500/70 group-hover:text-cyan-400 uppercase leading-none truncate w-full">Подъем</span>
          </div>
        </div>
      )}

      {/* --- DETECTIVE BARTH (Animated character) --- */}
      <DetectiveCharacter
        detectiveX={detectiveX}
        detectiveState={detectiveState}
        detectiveFacingLeft={detectiveFacingLeft}
        detectiveTransition={detectiveTransition}
        smokeRings={smokeRings}
        detectiveRef={detectiveRef}
        onClick={handleDetectiveInteraction}
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
