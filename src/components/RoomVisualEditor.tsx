/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { GameState, ObjectId, ObjectState, RoomInfo } from "../types";
import * as Lucide from "lucide-react";
import { gameAudio } from "../utils/AudioEngine";

interface RoomVisualEditorProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  onClose: () => void;
}

interface SavedPrefab {
  id: string;
  name: string;
  timestamp: string;
  roomBackground: string;
  roomInfo: Partial<RoomInfo>;
  objects: Record<ObjectId, Partial<ObjectState>>;
}

const PRESET_SPRITES: Record<ObjectId, string[]> = {
  bookshelf: [
    '/src/img/Cabin_Shelf01.png',
    '/src/img/Cabin_Shelf02.png',
    '/src/img/Grocery_Shelf01.png',
    '/src/img/Grocery_Shelf02.png',
    '/src/img/Office_Shelf01.png',
    '/src/img/Office_Shelf02.png'
  ],
  desk: [
    '/src/img/Cabin_Table.png',
    '/src/img/Grocery_Table.png',
    '/src/img/Office_Table.png',
    '/src/img/Dressingr_Console01.png',
    '/src/img/Dressingr_Console02.png',
    '/src/img/Dressingr_Drawer.png'
  ],
  rug: [
    '/src/img/Cabin_Rug01.png',
    '/src/img/Cabin_Rug02.png',
    '/src/img/Cabin_Rug03.png',
    '/src/img/Grocery_Rug01.png',
    '/src/img/Grocery_Rug02.png',
    '/src/img/Grocery_Rug03.png',
    '/src/img/Office_Rug01.png',
    '/src/img/Office_Rug02.png',
    '/src/img/Office_Rug03.png'
  ],
  safe: [
    '/src/img/Office_Safe.png',
    '/src/img/Office_Safe_open.png',
    '/src/img/Cabin_Safe01.png',
    '/src/img/Cabin_Safe01_open.png',
    '/src/img/Cabin_Safe02.png',
    '/src/img/Cabin_Safe02_open.png',
    '/src/img/Grocery_Safe01.png',
    '/src/img/Grocery_Safe01_open.png',
    '/src/img/Grocery_Safe02.png',
    '/src/img/Grocery_Safe02_open.png'
  ],
  safeStand: [
    '/src/img/Mansion_Safe_Shelf1.png',
    '/src/img/Cabin_Safe_Shelf1.png',
    '/src/img/Grocery_Safe_Shelf1.png',
    '/src/img/Office_Safe_Shelf1.png',
    '/src/img/Dressingr_Safe_Shelf1.png'
  ],
  fishbowl: [
    '/src/img/Aquarium/Mansion_Aquarium_Empty.png',
    '/src/img/Aquarium/Mansion_Aquarium_Broken.png',
    '/src/img/Aquarium/Cabin_Aquarium_01_empty.png',
    '/src/img/Aquarium/Cabin_Aquarium_01_break.png',
    '/src/img/Aquarium/Grocery_Aquarium_01_empty.png',
    '/src/img/Aquarium/Grocery_Aquarium_01_break.png',
    '/src/img/Aquarium/Industrial_Aquarium_01_empty.png',
    '/src/img/Aquarium/Industrial_Aquarium_01_break.png',
    '/src/img/Aquarium/Office_Aquarium_01_empty.png',
    '/src/img/Aquarium/Office_Aquarium_01_break.png'
  ],
  lamp: [],
  trashcan: [],
  painting: [
    '/src/img/Cabin_WallPicture01.png',
    '/src/img/Cabin_WallPicture02.png',
    '/src/img/Cabin_WallPicture03.png',
    '/src/img/Cabin_WallPicture04.png',
    '/src/img/Grocery_WallPicture01.png',
    '/src/img/Grocery_WallPicture02.png',
    '/src/img/Grocery_WallPicture03.png',
    '/src/img/Office_WallPicture01.png',
    '/src/img/Office_WallPicture02.png',
    '/src/img/Office_WallPicture03.png'
  ]
};

const ROOM_BACKGROUNDS = [
  { id: 'cabin', name: 'Хижина (Cabin_03)', path: '/src/img/Cabin_03.png' },
  { id: 'office_01', name: 'Кабинет 1 (Office_01)', path: '/src/img/Office_01.png' },
  { id: 'office_02', name: 'Кабинет 2 (Office_02)', path: '/src/img/Office_02.png' },
  { id: 'industrial', name: 'Подвал (Industrial_)', path: '/src/img/Industrial_.png' },
  { id: 'dressing', name: 'Гримерка (Dressingr_)', path: '/src/img/Dressingr_.png' },
  { id: 'grocery', name: 'Магазин (Grocery_)', path: '/src/img/Grocery_.png' }
];

export default function RoomVisualEditor({
  gameState,
  setGameState,
  onClose
}: RoomVisualEditorProps) {
  // Local state for objects being edited
  const [editorObjects, setEditorObjects] = useState<Record<ObjectId, ObjectState>>(() => {
    // Deep clone of objects
    return JSON.parse(JSON.stringify(gameState.objects));
  });

  const [roomBg, setRoomBg] = useState<string>(() => {
    const roomId = gameState.roomInfo?.id || '';
    const idLower = roomId.toLowerCase();
    if (idLower.includes('office_02')) return '/src/img/Office_02.png';
    if (idLower.includes('office_01') || idLower.includes('mansion') || idLower.includes('museum') || idLower.includes('banker')) return '/src/img/Office_01.png';
    if (idLower.includes('grocery') || idLower.includes('shop')) return '/src/img/Grocery_.png';
    if (idLower.includes('industrial') || idLower.includes('basement') || idLower.includes('alleyway')) return '/src/img/Industrial_.png';
    if (idLower.includes('dressing') || idLower.includes('ballerina')) return '/src/img/Dressingr_.png';
    return '/src/img/Cabin_03.png';
  });

  const [selectedId, setSelectedId] = useState<ObjectId>('desk');
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(false);
  const [snapSize, setSnapSize] = useState<number>(5); // 5% snap
  const [customSpriteUrls, setCustomSpriteUrls] = useState<Record<string, string>>({});

  // Prefabs states
  const [prefabs, setPrefabs] = useState<SavedPrefab[]>([]);
  const [prefabName, setPrefabName] = useState<string>("");
  const [jsonInput, setJsonInput] = useState<string>("");
  const [activeTab, setActiveTab] = useState<'properties' | 'prefabs' | 'code' | 'help'>('properties');
  const [showNotification, setShowNotification] = useState<string | null>(null);

  // Dragging interaction state
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dragState, setDragState] = useState<{
    id: ObjectId;
    mode: 'move' | 'resize';
    startX: number;
    startY: number;
    startValX: number;
    startValY: number;
    startValW: number;
    startValH: number;
  } | null>(null);

  // Load prefabs from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("detective_room_prefabs");
      if (stored) {
        setPrefabs(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load prefabs from localStorage", e);
    }
  }, []);

  const triggerToast = (msg: string) => {
    setShowNotification(msg);
    setTimeout(() => {
      setShowNotification(null);
    }, 2500);
  };

  // Keyboard navigation for fine tuning coordinates of selected object
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      const obj = editorObjects[selectedId];
      if (!obj) return;

      const step = e.shiftKey ? 5 : 1;
      let dx = 0;
      let dy = 0;
      let dw = 0;
      let dh = 0;

      const isResize = e.altKey;

      if (e.key === 'ArrowLeft') dx = -step;
      else if (e.key === 'ArrowRight') dx = step;
      else if (e.key === 'ArrowUp') dy = -step;
      else if (e.key === 'ArrowDown') dy = step;
      else return; // Ignore other keys

      e.preventDefault();

      const currentX = obj.x ?? 50;
      const currentY = obj.y ?? 50;
      const currentW = obj.w ?? 15;
      const currentH = obj.h ?? 15;

      if (isResize) {
        dw = dx;
        dh = dy;
        const nextW = Math.max(2, Math.min(100 - currentX, currentW + dw));
        const nextH = Math.max(2, Math.min(100 - currentY, currentH + dh));
        updateObject(selectedId, { w: nextW, h: nextH });
      } else {
        const nextX = Math.max(0, Math.min(100 - currentW, currentX + dx));
        const nextY = Math.max(0, Math.min(100 - currentH, currentY + dy));
        updateObject(selectedId, { x: nextX, y: nextY });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, editorObjects]);

  const updateObject = (id: ObjectId, fields: Partial<ObjectState>) => {
    setEditorObjects(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        ...fields
      }
    }));
  };

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent, id: ObjectId, mode: 'move' | 'resize') => {
    e.stopPropagation();
    e.preventDefault();
    try { gameAudio.playClick(); } catch (err) {}
    setSelectedId(id);

    const obj = editorObjects[id];
    if (!obj) return;

    setDragState({
      id,
      mode,
      startX: e.clientX,
      startY: e.clientY,
      startValX: obj.x ?? 50,
      startValY: obj.y ?? 50,
      startValW: obj.w ?? 15,
      startValH: obj.h ?? 15
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const rawDeltaX = ((e.clientX - dragState.startX) / rect.width) * 100;
    const rawDeltaY = ((e.clientY - dragState.startY) / rect.height) * 100;

    const id = dragState.id;
    const obj = editorObjects[id];
    if (!obj) return;

    if (dragState.mode === 'move') {
      let nextX = dragState.startValX + rawDeltaX;
      let nextY = dragState.startValY + rawDeltaY;

      if (snapToGrid) {
        nextX = Math.round(nextX / snapSize) * snapSize;
        nextY = Math.round(nextY / snapSize) * snapSize;
      }

      nextX = Math.round(Math.max(0, Math.min(100 - (obj.w ?? 10), nextX)));
      nextY = Math.round(Math.max(0, Math.min(100 - (obj.h ?? 10), nextY)));

      updateObject(id, { x: nextX, y: nextY });
    } else {
      let nextW = dragState.startValW + rawDeltaX;
      let nextH = dragState.startValH + rawDeltaY;

      if (snapToGrid) {
        nextW = Math.round(nextW / snapSize) * snapSize;
        nextH = Math.round(nextH / snapSize) * snapSize;
      }

      nextW = Math.round(Math.max(2, Math.min(100 - (obj.x ?? 0), nextW)));
      nextH = Math.round(Math.max(2, Math.min(100 - (obj.y ?? 0), nextH)));

      updateObject(id, { w: nextW, h: nextH });
    }
  };

  const handleMouseUp = () => {
    if (dragState) {
      setDragState(null);
    }
  };

  // Apply visual editor changes to active play state
  const applyToGameState = () => {
    try {
      gameAudio.playClick();
      gameAudio.playClueFound();
    } catch (e) {}

    setGameState(prev => {
      // Deep merge customized objects
      const updatedObjects = { ...prev.objects };
      (Object.keys(editorObjects) as ObjectId[]).forEach(id => {
        updatedObjects[id] = {
          ...updatedObjects[id],
          x: editorObjects[id].x,
          y: editorObjects[id].y,
          w: editorObjects[id].w,
          h: editorObjects[id].h,
          zIndex: editorObjects[id].zIndex,
          toggled: editorObjects[id].toggled,
          tipped: editorObjects[id].tipped,
          locked: editorObjects[id].locked,
          broken: editorObjects[id].broken,
          booksFallen: editorObjects[id].booksFallen,
          name: editorObjects[id].name,
          description: editorObjects[id].description
        };
      });

      return {
        ...prev,
        objects: updatedObjects
      };
    });

    triggerToast("Конфигурация успешно применена к активной игровой сессии!");
  };

  // Prefabs functionality
  const savePrefab = () => {
    if (!prefabName.trim()) {
      triggerToast("Пожалуйста, введите название префаба");
      return;
    }
    try { gameAudio.playClick(); } catch (err) {}

    // Extract raw positions and metadata to store
    const objectPositions: Record<ObjectId, Partial<ObjectState>> = {} as any;
    (Object.keys(editorObjects) as ObjectId[]).forEach(id => {
      objectPositions[id] = {
        x: editorObjects[id].x,
        y: editorObjects[id].y,
        w: editorObjects[id].w,
        h: editorObjects[id].h,
        zIndex: editorObjects[id].zIndex,
        toggled: editorObjects[id].toggled,
        tipped: editorObjects[id].tipped,
        locked: editorObjects[id].locked,
        broken: editorObjects[id].broken,
        name: editorObjects[id].name,
        description: editorObjects[id].description
      };
    });

    const newPrefab: SavedPrefab = {
      id: `prefab_${Date.now()}`,
      name: prefabName.trim(),
      timestamp: new Date().toLocaleDateString('ru-RU') + " " + new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      roomBackground: roomBg,
      roomInfo: {
        id: gameState.roomInfo?.id || 'room_custom',
        name: gameState.roomInfo?.name || 'Пользовательская комната'
      },
      objects: objectPositions
    };

    const updated = [newPrefab, ...prefabs];
    setPrefabs(updated);
    localStorage.setItem("detective_room_prefabs", JSON.stringify(updated));
    setPrefabName("");
    triggerToast(`Префаб "${newPrefab.name}" успешно сохранен!`);
  };

  const loadPrefab = (p: SavedPrefab) => {
    try { gameAudio.playClick(); } catch (err) {}
    setRoomBg(p.roomBackground);
    
    setEditorObjects(prev => {
      const copy = { ...prev };
      (Object.keys(p.objects) as ObjectId[]).forEach(id => {
        if (copy[id]) {
          copy[id] = {
            ...copy[id],
            ...p.objects[id]
          };
        }
      });
      return copy;
    });

    triggerToast(`Префаб "${p.name}" успешно загружен в редактор!`);
  };

  const deletePrefab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try { gameAudio.playClick(); } catch (err) {}
    const updated = prefabs.filter(p => p.id !== id);
    setPrefabs(updated);
    localStorage.setItem("detective_room_prefabs", JSON.stringify(updated));
    triggerToast("Префаб удален");
  };

  // Import JSON Config
  const handleImportJson = () => {
    if (!jsonInput.trim()) return;
    try {
      const parsed = JSON.parse(jsonInput);
      if (parsed && typeof parsed === 'object') {
        setEditorObjects(prev => {
          const copy = { ...prev };
          (Object.keys(parsed) as ObjectId[]).forEach(id => {
            if (copy[id]) {
              copy[id] = {
                ...copy[id],
                ...parsed[id]
              };
            }
          });
          return copy;
        });
        triggerToast("JSON конфигурация успешно импортирована!");
        setJsonInput("");
      }
    } catch (e) {
      triggerToast("Ошибка разбора JSON. Проверьте правильность формата.");
    }
  };

  // Generate exported code
  const getGeneratedJSON = () => {
    const minified: Record<string, any> = {};
    (Object.keys(editorObjects) as ObjectId[]).forEach(id => {
      minified[id] = {
        x: editorObjects[id].x ?? 50,
        y: editorObjects[id].y ?? 50,
        w: editorObjects[id].w ?? 15,
        h: editorObjects[id].h ?? 15
      };
      if (editorObjects[id].zIndex !== undefined) minified[id].zIndex = editorObjects[id].zIndex;
      if (editorObjects[id].toggled) minified[id].toggled = true;
      if (editorObjects[id].tipped) minified[id].tipped = true;
      if (editorObjects[id].locked) minified[id].locked = true;
      if (editorObjects[id].broken) minified[id].broken = true;
    });
    return JSON.stringify(minified, null, 2);
  };

  const getGeneratedTSCode = () => {
    let code = `// Вставьте в src/utils/puzzleGenerator.ts при инициализации комнаты:\n`;
    code += `const customLayout: Record<ObjectId, Partial<ObjectState>> = {\n`;
    (Object.keys(editorObjects) as ObjectId[]).forEach(id => {
      const o = editorObjects[id];
      code += `  ${id}: {\n`;
      code += `    x: ${o.x ?? 50},\n`;
      code += `    y: ${o.y ?? 50},\n`;
      code += `    w: ${o.w ?? 15},\n`;
      code += `    h: ${o.h ?? 15}`;
      if (o.zIndex !== undefined) code += `,\n    zIndex: ${o.zIndex}`;
      if (o.locked) code += `,\n    locked: true`;
      if (o.tipped) code += `,\n    tipped: true`;
      if (o.toggled) code += `,\n    toggled: true`;
      if (o.broken) code += `,\n    broken: true`;
      code += `\n  },\n`;
    });
    code += `};`;
    return code;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    try { gameAudio.playClueFound(); } catch (err) {}
    triggerToast("Скопировано в буфер обмена!");
  };

  // Helper to resolve preview sprite
  const getObjectPreviewSprite = (id: ObjectId) => {
    const custom = customSpriteUrls[id];
    if (custom) return custom;

    const obj = editorObjects[id];
    const isLocked = !!obj.locked;
    const isBroken = !!obj.broken || !!obj.tipped;

    // Resolve by background/theme selected in editor for high-fidelity mockups
    const bgLower = roomBg.toLowerCase();

    switch (id) {
      case 'rug':
        if (bgLower.includes('grocery')) return '/src/img/Grocery_Rug01.png';
        if (bgLower.includes('industrial')) return '/src/img/Grocery_Rug03.png';
        if (bgLower.includes('office_01') || bgLower.includes('office_02')) return '/src/img/Office_Rug01.png';
        return '/src/img/Cabin_Rug01.png';

      case 'painting':
        if (bgLower.includes('office')) return '/src/img/Office_WallPicture01.png';
        if (bgLower.includes('grocery')) return '/src/img/Grocery_WallPicture01.png';
        return '/src/img/Cabin_WallPicture01.png';

      case 'safe':
        if (bgLower.includes('grocery') || bgLower.includes('industrial')) {
          return isLocked ? '/src/img/Grocery_Safe01.png' : '/src/img/Grocery_Safe01_open.png';
        }
        if (bgLower.includes('cabin')) {
          return isLocked ? '/src/img/Cabin_Safe01.png' : '/src/img/Cabin_Safe01_open.png';
        }
        return isLocked ? '/src/img/Office_Safe.png' : '/src/img/Office_Safe_open.png';

      case 'safeStand':
        if (bgLower.includes('dressing')) return '/src/img/Dressingr_Safe_Shelf1.png';
        if (bgLower.includes('grocery')) return '/src/img/Grocery_Safe_Shelf1.png';
        if (bgLower.includes('office')) return '/src/img/Office_Safe_Shelf1.png';
        return '/src/img/Mansion_Safe_Shelf1.png';

      case 'fishbowl':
        if (isBroken) {
          if (bgLower.includes('grocery')) return '/src/img/Aquarium/Grocery_Aquarium_01_break.png';
          if (bgLower.includes('office')) return '/src/img/Aquarium/Office_Aquarium_01_break.png';
          if (bgLower.includes('industrial')) return '/src/img/Aquarium/Industrial_Aquarium_01_break.png';
          return '/src/img/Aquarium/Cabin_Aquarium_01_break.png';
        } else {
          if (bgLower.includes('grocery')) return '/src/img/Aquarium/Grocery_Aquarium_01_empty.png';
          if (bgLower.includes('office')) return '/src/img/Aquarium/Office_Aquarium_01_empty.png';
          if (bgLower.includes('industrial')) return '/src/img/Aquarium/Industrial_Aquarium_01_empty.png';
          return '/src/img/Aquarium/Cabin_Aquarium_01_empty.png';
        }

      case 'desk':
        if (bgLower.includes('dressing')) return '/src/img/Dressingr_Tablemirror.png';
        if (bgLower.includes('grocery')) return '/src/img/Grocery_Table.png';
        if (bgLower.includes('office')) return '/src/img/Office_Table.png';
        return '/src/img/Cabin_Table.png';

      case 'bookshelf':
        if (bgLower.includes('grocery')) return '/src/img/Grocery_Shelf01.png';
        if (bgLower.includes('office')) return '/src/img/Office_Shelf01.png';
        return '/src/img/Cabin_Shelf01.png';

      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-[#060607]/98 z-[60] flex flex-col p-4 select-none overflow-hidden text-neutral-200 font-sans">
      
      {/* TOAST NOTIFICATION */}
      {showNotification && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 bg-amber-500 text-neutral-950 font-mono text-[10px] uppercase tracking-wider px-4 py-2 border border-amber-400 rounded shadow-2xl z-[70] animate-bounce flex items-center gap-2">
          <Lucide.CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{showNotification}</span>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex justify-between items-center border-b border-neutral-800 pb-3 mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500/10 p-1.5 border border-amber-500/20 rounded">
            <Lucide.Sliders className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h2 className="font-serif text-base font-bold text-white tracking-wide uppercase italic">
              Визуальный Конструктор Интерьеров
            </h2>
            <p className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest">
              ROOM LAYOUT ENGINE v1.2 // PERSISTENT PREFABS
            </p>
          </div>
        </div>

        {/* TOP STATUS CONTROL */}
        <div className="flex items-center gap-3">
          <button
            onClick={applyToGameState}
            className="h-8.5 px-4 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-[10px] font-bold uppercase tracking-wider rounded transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.2)]"
          >
            <Lucide.Play className="w-3.5 h-3.5" />
            Применить к игре
          </button>

          <button
            onClick={() => {
              try { gameAudio.playClick(); } catch (e) {}
              onClose();
            }}
            className="h-8.5 px-4 border border-neutral-800 hover:border-neutral-600 bg-neutral-950 text-neutral-400 hover:text-white font-mono text-[10px] uppercase tracking-widest transition-all cursor-pointer rounded"
          >
            Закрыть Редактор ✕
          </button>
        </div>
      </div>

      {/* TWO-PANEL WORKSPACE */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-0 overflow-hidden">
        
        {/* LEFT COLUMN: THE BLUEPRINT CANVAS */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-3 min-h-0">
          
          {/* CANVAS BAR CONTROLS */}
          <div className="flex justify-between items-center bg-[#0d0e11] px-3 py-2 border border-neutral-800 rounded font-mono text-[10px] tracking-wider text-neutral-400 shrink-0">
            <div className="flex items-center gap-4">
              <span className="text-neutral-500 uppercase">БЭКГРАУНД:</span>
              <div className="flex gap-1.5">
                {ROOM_BACKGROUNDS.map(bg => (
                  <button
                    key={bg.id}
                    onClick={() => {
                      try { gameAudio.playClick(); } catch (err) {}
                      setRoomBg(bg.path);
                    }}
                    className={`px-2 py-1 rounded text-[9px] uppercase border transition-all cursor-pointer ${
                      roomBg === bg.path
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 font-bold'
                        : 'bg-neutral-900 text-neutral-500 border-neutral-800 hover:text-neutral-300'
                    }`}
                  >
                    {bg.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={(e) => {
                    try { gameAudio.playClick(); } catch (err) {}
                    setShowGrid(e.target.checked);
                  }}
                  className="rounded border-neutral-800 text-amber-500 focus:ring-0 cursor-pointer"
                />
                <span className="uppercase text-[9px]">Сетка (10%)</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer select-none border-l border-neutral-800 pl-4">
                <input
                  type="checkbox"
                  checked={snapToGrid}
                  onChange={(e) => {
                    try { gameAudio.playClick(); } catch (err) {}
                    setSnapToGrid(e.target.checked);
                  }}
                  className="rounded border-neutral-800 text-amber-500 focus:ring-0 cursor-pointer"
                />
                <span className="uppercase text-[9px]">Привязка</span>
              </label>

              {snapToGrid && (
                <select
                  value={snapSize}
                  onChange={(e) => {
                    try { gameAudio.playClick(); } catch (err) {}
                    setSnapSize(Number(e.target.value));
                  }}
                  className="bg-neutral-900 border border-neutral-800 text-[9px] rounded px-1.5 py-0.5 text-amber-400 font-mono outline-none"
                >
                  <option value={2}>2%</option>
                  <option value={5}>5%</option>
                  <option value={10}>10%</option>
                </select>
              )}
            </div>
          </div>

          {/* ACTIVE CANVAS VIEWPORT */}
          <div 
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="flex-1 relative aspect-[16/10] bg-neutral-950 border border-neutral-800 rounded overflow-hidden shadow-2xl select-none"
            style={{
              backgroundImage: `url(${roomBg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            {/* Dark vignette tint style overlay similar to game */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.4)_100%)] pointer-events-none z-[5]" />

            {/* BLUEPRINT GRID OVERLAY */}
            {showGrid && (
              <div className="absolute inset-0 pointer-events-none z-[8] opacity-20">
                {/* Visual lines for 10% grids */}
                <div className="absolute inset-0 grid grid-cols-10 grid-rows-10">
                  {Array.from({ length: 100 }).map((_, i) => (
                    <div key={i} className="border-t border-l border-cyan-500/40 text-[7px] text-cyan-400/30 p-0.5 font-mono">
                      {i % 10 === 0 || Math.floor(i / 10) === 0 ? `${(i % 10) * 10},${Math.floor(i / 10) * 10}` : ''}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DRAGGABLE OBJECTS LAYER */}
            {(Object.keys(editorObjects) as ObjectId[]).map(id => {
              const obj = editorObjects[id];
              if (!obj) return null;

              const isSelected = selectedId === id;
              const x = obj.x ?? 30;
              const y = obj.y ?? 40;
              const w = obj.w ?? 15;
              const h = obj.h ?? 15;

              const sprite = getObjectPreviewSprite(id);

              return (
                <div
                  key={id}
                  className={`absolute group transition-shadow duration-150 flex flex-col justify-end ${
                    isSelected 
                      ? 'ring-2 ring-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]' 
                      : 'hover:ring-1 hover:ring-cyan-500/50'
                  }`}
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    width: `${w}%`,
                    height: `${h}%`,
                    cursor: dragState ? (dragState.mode === 'move' ? 'grabbing' : 'se-resize') : 'grab',
                    zIndex: obj.zIndex ?? 20
                  }}
                  onMouseDown={(e) => handleMouseDown(e, id, 'move')}
                >
                  {/* Object render container */}
                  <div className="relative w-full h-full flex items-center justify-center">
                    {sprite ? (
                      <img
                        src={sprite}
                        alt={obj.name}
                        className={`w-full h-full object-contain pointer-events-none ${
                          obj.tipped && id !== 'fishbowl' ? 'rotate-90 origin-bottom' : ''
                        }`}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.opacity = '0.3';
                        }}
                      />
                    ) : (
                      /* Fallback visual shape when no sprite is set */
                      <div className="w-full h-full border border-dashed border-cyan-500/50 bg-cyan-500/10 flex flex-col items-center justify-center p-1 rounded pointer-events-none">
                        <Lucide.Box className="w-5 h-5 text-cyan-400 mb-1 opacity-70" />
                        <span className="text-[7px] text-center uppercase tracking-widest truncate max-w-full text-cyan-300">
                          {obj.name}
                        </span>
                      </div>
                    )}

                    {/* Element selection bounding details overlay */}
                    {isSelected && (
                      <div className="absolute inset-0 border border-amber-500 pointer-events-none z-[25] bg-amber-500/5">
                        {/* Selected ID name tag */}
                        <div className="absolute -top-5 left-0 bg-amber-500 text-neutral-950 text-[7px] font-mono uppercase tracking-widest px-1 py-0.5 rounded shadow whitespace-nowrap">
                          {id} ({x}%, {y}%) {w}x{h}% [Z:{obj.zIndex ?? 10}]
                        </div>
                      </div>
                    )}

                    {/* RESIZE DRAG HANDLE */}
                    {isSelected && (
                      <div
                        className="absolute bottom-0 right-0 w-4 h-4 bg-amber-500 hover:bg-amber-400 border border-neutral-950 shadow cursor-se-resize z-[30] flex items-center justify-center rounded-tl"
                        onMouseDown={(e) => handleMouseDown(e, id, 'resize')}
                      >
                        <Lucide.Maximize2 className="w-2.5 h-2.5 text-neutral-950 pointer-events-none" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* AQUARIUM FISHLIST SPECIAL PREVIEW (if aquarium is selected/visible) */}
            {editorObjects.fishbowl && (
              <div 
                className="absolute pointer-events-none z-30"
                style={{
                  left: `${(editorObjects.fishbowl.x ?? 30) + ((editorObjects.fishbowl.w ?? 15) * 0.35)}%`,
                  top: `${(editorObjects.fishbowl.y ?? 40) + ((editorObjects.fishbowl.h ?? 15) * 0.25)}%`,
                  width: `${(editorObjects.fishbowl.w ?? 15) * 0.3}%`,
                  height: `${(editorObjects.fishbowl.h ?? 15) * 0.37}%`,
                  opacity: editorObjects.fishbowl.broken ? 0.2 : 0.8
                }}
              >
                {/* Tiny fishes swimming animation mock */}
                <div className="relative w-full h-full flex items-center justify-around overflow-hidden">
                  <div className="w-1.5 h-1 rounded-full bg-cyan-400 animate-pulse" />
                  <div className="w-2 h-1 rounded-full bg-orange-400 animate-bounce" />
                </div>
              </div>
            )}

            {/* STAGE FOOTER INFO */}
            <div className="absolute bottom-2 left-2 bg-neutral-950/85 px-2 py-1 rounded border border-neutral-800 font-mono text-[8px] uppercase tracking-wider text-neutral-400 z-10">
              {gameState.roomInfo?.name || 'Комната писателя'} • {selectedId ? `Выбран: [${selectedId.toUpperCase()}]` : 'Выберите объект для перетаскивания'}
            </div>
            <div className="absolute bottom-2 right-2 bg-neutral-950/85 px-2 py-1 rounded border border-neutral-800 font-mono text-[8px] uppercase tracking-wider text-amber-400 z-10 animate-pulse">
              [ALT + СТРЕЛКИ] - Размер • [SHIFT + СТРЕЛКИ] - Быстро
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: SIDEBAR CONTROLS */}
        <div className="lg:col-span-5 xl:col-span-4 border border-neutral-800 bg-[#0d0e11] rounded flex flex-col min-h-0 overflow-hidden">
          
          {/* TAB BAR */}
          <div className="flex border-b border-neutral-800 shrink-0">
            <button
              onClick={() => { try { gameAudio.playClick(); } catch (e) {} setActiveTab('properties'); }}
              className={`flex-1 py-2 text-center font-mono text-[9px] uppercase tracking-widest transition-all cursor-pointer ${
                activeTab === 'properties'
                  ? 'bg-neutral-900 border-b-2 border-amber-500 text-white font-bold'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              Свойства
            </button>
            <button
              onClick={() => { try { gameAudio.playClick(); } catch (e) {} setActiveTab('prefabs'); }}
              className={`flex-1 py-2 text-center font-mono text-[9px] uppercase tracking-widest transition-all cursor-pointer ${
                activeTab === 'prefabs'
                  ? 'bg-neutral-900 border-b-2 border-amber-500 text-white font-bold'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              Префабы ({prefabs.length})
            </button>
            <button
              onClick={() => { try { gameAudio.playClick(); } catch (e) {} setActiveTab('code'); }}
              className={`flex-1 py-2 text-center font-mono text-[9px] uppercase tracking-widest transition-all cursor-pointer ${
                activeTab === 'code'
                  ? 'bg-neutral-900 border-b-2 border-amber-500 text-white font-bold'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              Экспорт / Код
            </button>
            <button
              onClick={() => { try { gameAudio.playClick(); } catch (e) {} setActiveTab('help'); }}
              className={`flex-1 py-2 text-center font-mono text-[9px] uppercase tracking-widest transition-all cursor-pointer ${
                activeTab === 'help'
                  ? 'bg-neutral-900 border-b-2 border-amber-500 text-white font-bold'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              Справка
            </button>
          </div>

          {/* ACTIVE TAB DETAILS */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 min-h-0 text-[11px]">
            
            {/* PROPERTIES TAB */}
            {activeTab === 'properties' && (
              <div className="space-y-4">
                
                {/* 1. SELECT OBJECT */}
                <div>
                  <label className="block font-mono text-[8px] uppercase tracking-widest text-neutral-500 mb-1.5">
                    1. Выбор объекта
                  </label>
                  <select
                    value={selectedId}
                    onChange={(e) => {
                      try { gameAudio.playClick(); } catch (err) {}
                      setSelectedId(e.target.value as ObjectId);
                    }}
                    className="w-full bg-neutral-900 border border-neutral-800 text-neutral-200 rounded p-2 text-xs font-mono outline-none focus:border-amber-500"
                  >
                    {(Object.keys(editorObjects) as ObjectId[]).map(id => (
                      <option key={id} value={id}>
                        {id.toUpperCase()} — {editorObjects[id].name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. POSITION INPUTS */}
                {editorObjects[selectedId] && (
                  <div className="space-y-3.5 bg-neutral-900/50 p-3 border border-neutral-800/80 rounded">
                    <div className="flex justify-between items-center border-b border-neutral-800 pb-1.5">
                      <span className="font-mono text-[9px] text-amber-500 uppercase font-bold tracking-wider">
                        {selectedId.toUpperCase()} • Координаты (%)
                      </span>
                      <span className="text-[8px] font-mono text-neutral-500">
                        РЕГУЛИРОВКА СЛАЙДЕРАМИ
                      </span>
                    </div>

                    {/* Coordinates & sizes */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex justify-between text-[10px] font-mono text-neutral-400 mb-1">
                          <span>X (влево)</span>
                          <span className="text-amber-400 font-bold">{editorObjects[selectedId].x ?? 0}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max={100 - (editorObjects[selectedId].w ?? 5)}
                          value={editorObjects[selectedId].x ?? 0}
                          onChange={(e) => updateObject(selectedId, { x: Number(e.target.value) })}
                          className="w-full accent-amber-500 h-1 bg-neutral-800 rounded outline-none"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[10px] font-mono text-neutral-400 mb-1">
                          <span>Y (верх)</span>
                          <span className="text-amber-400 font-bold">{editorObjects[selectedId].y ?? 0}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max={100 - (editorObjects[selectedId].h ?? 5)}
                          value={editorObjects[selectedId].y ?? 0}
                          onChange={(e) => updateObject(selectedId, { y: Number(e.target.value) })}
                          className="w-full accent-amber-500 h-1 bg-neutral-800 rounded outline-none"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[10px] font-mono text-neutral-400 mb-1">
                          <span>Ширина (W)</span>
                          <span className="text-amber-400 font-bold">{editorObjects[selectedId].w ?? 0}%</span>
                        </div>
                        <input
                          type="range"
                          min="2"
                          max={100 - (editorObjects[selectedId].x ?? 0)}
                          value={editorObjects[selectedId].w ?? 0}
                          onChange={(e) => updateObject(selectedId, { w: Number(e.target.value) })}
                          className="w-full accent-amber-500 h-1 bg-neutral-800 rounded outline-none"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[10px] font-mono text-neutral-400 mb-1">
                          <span>Высота (H)</span>
                          <span className="text-amber-400 font-bold">{editorObjects[selectedId].h ?? 0}%</span>
                        </div>
                        <input
                          type="range"
                          min="2"
                          max={100 - (editorObjects[selectedId].y ?? 0)}
                          value={editorObjects[selectedId].h ?? 0}
                          onChange={(e) => updateObject(selectedId, { h: Number(e.target.value) })}
                          className="w-full accent-amber-500 h-1 bg-neutral-800 rounded outline-none"
                        />
                      </div>

                      {/* Z-index Slider */}
                      <div className="col-span-2 pt-2 border-t border-neutral-800/40">
                        <div className="flex justify-between text-[10px] font-mono text-neutral-400 mb-1">
                          <span>Глубина (Z-index)</span>
                          <span className="text-amber-400 font-bold">{editorObjects[selectedId].zIndex ?? 10}</span>
                        </div>
                        <div className="flex gap-2 items-center">
                          <input
                            type="range"
                            min="0"
                            max="50"
                            value={editorObjects[selectedId].zIndex ?? 10}
                            onChange={(e) => updateObject(selectedId, { zIndex: Number(e.target.value) })}
                            className="flex-1 accent-amber-500 h-1 bg-neutral-800 rounded outline-none"
                          />
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={editorObjects[selectedId].zIndex ?? 10}
                            onChange={(e) => updateObject(selectedId, { zIndex: Number(e.target.value) })}
                            className="w-12 bg-neutral-950 border border-neutral-800 text-center rounded p-0.5 text-white font-mono text-[9px] outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Numeric explicit inputs for fine grain control */}
                    <div className="grid grid-cols-4 gap-1.5 font-mono text-[9px] text-center text-neutral-400">
                      <div>
                        <span className="block mb-0.5 text-neutral-600">X-VAL</span>
                        <input
                          type="number"
                          value={editorObjects[selectedId].x ?? 0}
                          onChange={(e) => updateObject(selectedId, { x: Number(e.target.value) })}
                          className="w-full bg-neutral-950 border border-neutral-800 text-center rounded p-1 text-white outline-none"
                        />
                      </div>
                      <div>
                        <span className="block mb-0.5 text-neutral-600">Y-VAL</span>
                        <input
                          type="number"
                          value={editorObjects[selectedId].y ?? 0}
                          onChange={(e) => updateObject(selectedId, { y: Number(e.target.value) })}
                          className="w-full bg-neutral-950 border border-neutral-800 text-center rounded p-1 text-white outline-none"
                        />
                      </div>
                      <div>
                        <span className="block mb-0.5 text-neutral-600">W-VAL</span>
                        <input
                          type="number"
                          value={editorObjects[selectedId].w ?? 0}
                          onChange={(e) => updateObject(selectedId, { w: Number(e.target.value) })}
                          className="w-full bg-neutral-950 border border-neutral-800 text-center rounded p-1 text-white outline-none"
                        />
                      </div>
                      <div>
                        <span className="block mb-0.5 text-neutral-600">H-VAL</span>
                        <input
                          type="number"
                          value={editorObjects[selectedId].h ?? 0}
                          onChange={(e) => updateObject(selectedId, { h: Number(e.target.value) })}
                          className="w-full bg-neutral-950 border border-neutral-800 text-center rounded p-1 text-white outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. METADATA & TEXTS */}
                {editorObjects[selectedId] && (
                  <div className="space-y-2 bg-neutral-900/40 p-3 border border-neutral-800 rounded">
                    <span className="block font-mono text-[8px] uppercase tracking-widest text-neutral-500 mb-1">
                      3. Тексты и Свойства
                    </span>
                    
                    <div className="space-y-2">
                      <div>
                        <label className="text-[9px] text-neutral-400 font-mono uppercase block mb-1">Отображаемое Имя</label>
                        <input
                          type="text"
                          value={editorObjects[selectedId].name}
                          onChange={(e) => updateObject(selectedId, { name: e.target.value })}
                          className="w-full bg-neutral-900 border border-neutral-800 text-neutral-200 rounded px-2.5 py-1.5 text-xs outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] text-neutral-400 font-mono uppercase block mb-1">Описание Осмотра</label>
                        <textarea
                          rows={2}
                          value={editorObjects[selectedId].description}
                          onChange={(e) => updateObject(selectedId, { description: e.target.value })}
                          className="w-full bg-neutral-900 border border-neutral-800 text-neutral-200 rounded px-2.5 py-1.5 text-[10px] outline-none focus:border-amber-500 resize-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. OBJECT TOGGLES */}
                {editorObjects[selectedId] && (
                  <div className="bg-neutral-900/40 p-3 border border-neutral-800 rounded space-y-2">
                    <span className="block font-mono text-[8px] uppercase tracking-widest text-neutral-500 mb-1">
                      4. Физические состояния
                    </span>

                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      {editorObjects[selectedId].locked !== undefined && (
                        <label className="flex items-center gap-2 cursor-pointer bg-neutral-950/40 px-2 py-1.5 rounded border border-neutral-800/50 hover:bg-neutral-900 transition-all select-none">
                          <input
                            type="checkbox"
                            checked={!!editorObjects[selectedId].locked}
                            onChange={(e) => {
                              try { gameAudio.playClick(); } catch (err) {}
                              updateObject(selectedId, { locked: e.target.checked });
                            }}
                            className="rounded border-neutral-800 text-amber-500 focus:ring-0 cursor-pointer"
                          />
                          <span className="font-mono">ЗАПЕРТ</span>
                        </label>
                      )}

                      {editorObjects[selectedId].toggled !== undefined && (
                        <label className="flex items-center gap-2 cursor-pointer bg-neutral-950/40 px-2 py-1.5 rounded border border-neutral-800/50 hover:bg-neutral-900 transition-all select-none">
                          <input
                            type="checkbox"
                            checked={!!editorObjects[selectedId].toggled}
                            onChange={(e) => {
                              try { gameAudio.playClick(); } catch (err) {}
                              updateObject(selectedId, { toggled: e.target.checked });
                            }}
                            className="rounded border-neutral-800 text-amber-500 focus:ring-0 cursor-pointer"
                          />
                          <span className="font-mono">ВКЛЮЧЕН / СДВИНУТ</span>
                        </label>
                      )}

                      {editorObjects[selectedId].tipped !== undefined && selectedId !== 'fishbowl' && (
                        <label className="flex items-center gap-2 cursor-pointer bg-neutral-950/40 px-2 py-1.5 rounded border border-neutral-800/50 hover:bg-neutral-900 transition-all select-none">
                          <input
                            type="checkbox"
                            checked={!!editorObjects[selectedId].tipped}
                            onChange={(e) => {
                              try { gameAudio.playClick(); } catch (err) {}
                              updateObject(selectedId, { tipped: e.target.checked });
                            }}
                            className="rounded border-neutral-800 text-amber-500 focus:ring-0 cursor-pointer"
                          />
                          <span className="font-mono">ОПРОКИНУТ</span>
                        </label>
                      )}

                      {editorObjects[selectedId].broken !== undefined && (
                        <label className="flex items-center gap-2 cursor-pointer bg-neutral-950/40 px-2 py-1.5 rounded border border-neutral-800/50 hover:bg-neutral-900 transition-all select-none">
                          <input
                            type="checkbox"
                            checked={!!editorObjects[selectedId].broken}
                            onChange={(e) => {
                              try { gameAudio.playClick(); } catch (err) {}
                              updateObject(selectedId, { broken: e.target.checked });
                            }}
                            className="rounded border-neutral-800 text-amber-500 focus:ring-0 cursor-pointer"
                          />
                          <span className="font-mono">РАЗБИТ</span>
                        </label>
                      )}
                    </div>
                  </div>
                )}

                {/* 5. SPRITE SELECTOR */}
                {PRESET_SPRITES[selectedId] && PRESET_SPRITES[selectedId].length > 0 && (
                  <div className="bg-neutral-900/40 p-3 border border-neutral-800 rounded space-y-2">
                    <span className="block font-mono text-[8px] uppercase tracking-widest text-neutral-500">
                      5. Предустановленные спрайты
                    </span>
                    <div className="grid grid-cols-2 gap-1.5 max-h-[100px] overflow-y-auto">
                      {PRESET_SPRITES[selectedId].map((sprite, idx) => {
                        const isSelected = getObjectPreviewSprite(selectedId) === sprite;
                        const filename = sprite.split('/').pop() || '';
                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              try { gameAudio.playClick(); } catch (err) {}
                              setCustomSpriteUrls(prev => ({
                                ...prev,
                                [selectedId]: sprite
                              }));
                            }}
                            className={`p-1 text-[8px] font-mono rounded truncate text-left border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-amber-500/15 border-amber-500/50 text-amber-400 font-bold'
                                : 'bg-neutral-950 text-neutral-500 border-neutral-800 hover:text-neutral-300'
                            }`}
                          >
                            📁 {filename}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PREFABS TAB */}
            {activeTab === 'prefabs' && (
              <div className="space-y-4">
                <div className="bg-neutral-900/40 p-3 border border-neutral-800 rounded space-y-2">
                  <span className="block font-mono text-[8px] uppercase tracking-widest text-neutral-500">
                    Сохранить текущую расстановку
                  </span>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Название префаба (например: Уютный чердак)"
                      value={prefabName}
                      onChange={(e) => setPrefabName(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 text-neutral-200 rounded px-2.5 py-1.5 text-xs outline-none focus:border-amber-500"
                    />
                    <button
                      onClick={savePrefab}
                      className="w-full bg-neutral-900 hover:bg-neutral-800 text-amber-400 hover:text-amber-300 border border-amber-500/30 hover:border-amber-500/60 font-mono text-[9px] uppercase tracking-widest py-2 rounded transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Lucide.Save className="w-3.5 h-3.5" />
                      Сохранить префаб
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <span className="block font-mono text-[8px] uppercase tracking-widest text-neutral-500">
                    Библиотека Префабов ({prefabs.length})
                  </span>

                  {prefabs.length === 0 ? (
                    <div className="text-center py-8 text-neutral-600 border border-dashed border-neutral-800 rounded">
                      Нет сохраненных префабов в локальной базе.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {prefabs.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => loadPrefab(p)}
                          className="p-2.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-600 rounded flex justify-between items-center cursor-pointer transition-all hover:bg-neutral-900/80 group"
                        >
                          <div>
                            <div className="font-bold text-white group-hover:text-amber-400 transition-colors">
                              {p.name}
                            </div>
                            <div className="text-[8px] font-mono text-neutral-500 uppercase mt-0.5">
                              {p.timestamp} • {p.roomBackground.split('/').pop()}
                            </div>
                          </div>
                          <button
                            onClick={(e) => deletePrefab(p.id, e)}
                            className="p-1 text-neutral-600 hover:text-red-400 hover:bg-neutral-950 rounded transition-all cursor-pointer"
                            title="Удалить префаб"
                          >
                            <Lucide.Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* EXPORT / CODE TAB */}
            {activeTab === 'code' && (
              <div className="space-y-4">
                
                {/* Export code */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="block font-mono text-[8px] uppercase tracking-widest text-neutral-500">
                      Экспортируемый TypeScript код
                    </span>
                    <button
                      onClick={() => copyToClipboard(getGeneratedTSCode())}
                      className="text-amber-500 hover:text-amber-400 font-mono text-[8px] uppercase flex items-center gap-1 cursor-pointer"
                    >
                      <Lucide.Copy className="w-3 h-3" /> Копировать код
                    </button>
                  </div>
                  <pre className="p-2.5 bg-neutral-950 border border-neutral-800 rounded text-[9px] font-mono text-cyan-400/90 overflow-x-auto max-h-[140px] whitespace-pre select-text">
                    {getGeneratedTSCode()}
                  </pre>
                </div>

                {/* JSON export */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="block font-mono text-[8px] uppercase tracking-widest text-neutral-500">
                      JSON представление (пресет)
                    </span>
                    <button
                      onClick={() => copyToClipboard(getGeneratedJSON())}
                      className="text-amber-500 hover:text-amber-400 font-mono text-[8px] uppercase flex items-center gap-1 cursor-pointer"
                    >
                      <Lucide.Copy className="w-3 h-3" /> Копировать JSON
                    </button>
                  </div>
                  <pre className="p-2.5 bg-neutral-950 border border-neutral-800 rounded text-[9px] font-mono text-amber-400/90 overflow-x-auto max-h-[120px] whitespace-pre select-text">
                    {getGeneratedJSON()}
                  </pre>
                </div>

                {/* Manual Import Box */}
                <div className="bg-neutral-900/40 p-3 border border-neutral-800 rounded space-y-2">
                  <span className="block font-mono text-[8px] uppercase tracking-widest text-neutral-500">
                    Импортировать пресет (Вставить JSON)
                  </span>
                  <textarea
                    rows={3}
                    placeholder='{"desk": {"x": 40, "y": 50, "w": 20, "h": 20}}'
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 text-cyan-400 rounded p-2 text-[10px] font-mono outline-none focus:border-amber-500 resize-none"
                  />
                  <button
                    onClick={handleImportJson}
                    className="w-full bg-neutral-900 hover:bg-neutral-800 text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 hover:border-cyan-500/60 font-mono text-[9px] uppercase tracking-widest py-2 rounded transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Lucide.Upload className="w-3.5 h-3.5" />
                    Импортировать JSON
                  </button>
                </div>
              </div>
            )}

            {/* HELP TAB */}
            {activeTab === 'help' && (
              <div className="space-y-3.5 text-neutral-400 text-[10.5px] leading-relaxed">
                <div className="border-b border-neutral-800 pb-1.5">
                  <span className="font-mono text-[9px] text-amber-500 uppercase font-bold tracking-wider">
                    Управление и Быстрые клавиши
                  </span>
                </div>
                
                <ul className="space-y-2 list-disc list-inside">
                  <li>
                    <strong className="text-white">Мышь (Драг-н-дроп):</strong> Нажмите и тащите любой предмет по комнате, чтобы изменить его координаты <code className="text-cyan-400">X, Y</code>.
                  </li>
                  <li>
                    <strong className="text-white">Изменение размеров:</strong> Зажмите маленькую стрелочку в нижнем правом углу выделенного предмета и тяните для настройки <code className="text-cyan-400">W, H</code>.
                  </li>
                  <li>
                    <strong className="text-white">Клавиатура (Стрелки):</strong> Выберите объект и используйте стрелки влево/вправо/вверх/вниз для точной сдвижки по <code className="text-amber-400">1%</code>.
                  </li>
                  <li>
                    <strong className="text-white">Стрелки + Shift:</strong> Сдвиг по <code className="text-amber-400">5%</code> для быстрой расстановки.
                  </li>
                  <li>
                    <strong className="text-white">Стрелки + Alt:</strong> Изменяет размеры выделенного предмета прямо с клавиатуры!
                  </li>
                  <li>
                    <strong className="text-white">Привязка (Snap):</strong> Включение привязки автоматически выравнивает предметы по сетке 2%, 5% или 10%.
                  </li>
                </ul>

                <div className="bg-neutral-900 p-2.5 rounded border border-neutral-800 text-[10px]">
                  <span className="text-amber-500 font-bold block mb-1">💡 Как применять в кодовой базе?</span>
                  Расставьте предметы, скопируйте сгенерированный код на вкладке <strong className="text-white">"Экспорт"</strong> и вставьте его в <code className="text-cyan-400">src/utils/puzzleGenerator.ts</code>. Либо нажмите <strong className="text-amber-500">"Применить к игре"</strong> для мгновенного теста прямо в текущей запущенной сессии!
                </div>
              </div>
            )}

          </div>

          {/* SIDEBAR FOOTER ACTION */}
          <div className="p-3 border-t border-neutral-800 bg-neutral-950 flex gap-2">
            <button
              onClick={() => {
                // Reset positions to initial gameState.objects values
                try { gameAudio.playClick(); } catch (err) {}
                setEditorObjects(JSON.parse(JSON.stringify(gameState.objects)));
                setCustomSpriteUrls({});
                triggerToast("Координаты сброшены до начальных");
              }}
              className="flex-1 py-2 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900 text-neutral-500 hover:text-neutral-300 font-mono text-[9px] uppercase tracking-widest rounded transition-all cursor-pointer text-center"
            >
              Сбросить
            </button>
            <button
              onClick={applyToGameState}
              className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono text-[9px] font-bold uppercase tracking-widest rounded transition-all cursor-pointer text-center"
            >
              Сохранить
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
