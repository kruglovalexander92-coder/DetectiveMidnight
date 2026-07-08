import React, { useState, useEffect } from 'react';
import detectiveIdle from '../img/detective_Idle.png';
import detectiveWalk from '../img/detective_Walk.png';

interface SmokeRing {
  id: number;
  scale: number;
  x: number;
  y: number;
}

interface DetectiveCharacterProps {
  detectiveX: number;
  detectiveState: 'idle' | 'walking';
  detectiveFacingLeft: boolean;
  detectiveTransition: string;
  smokeRings: SmokeRing[];
  detectiveRef: React.RefObject<HTMLDivElement | null>;
}

export const DetectiveCharacter: React.FC<DetectiveCharacterProps> = ({
  detectiveX,
  detectiveState,
  detectiveFacingLeft,
  detectiveTransition,
  smokeRings,
  detectiveRef,
}) => {
  const [frame, setFrame] = useState(0);

  // Constants for sprite grid
  const cols = 6;
  const rows = detectiveState === 'walking' ? 7 : 13;
  const totalFrames = detectiveState === 'walking' ? 42 : 78;

  // Track the animation loop
  useEffect(() => {
    setFrame(0); // Reset frame on state change

    // Standard 12 FPS for classic sprite animation
    const fps = detectiveState === 'walking' ? 12 : 12;
    const intervalTime = 1000 / fps;

    const timer = setInterval(() => {
      setFrame((prev) => (prev + 1) % totalFrames);
    }, intervalTime);

    return () => clearInterval(timer);
  }, [detectiveState, totalFrames]);

  // Calculate coordinates on the sheet
  const col = frame % cols;
  const row = Math.floor(frame / cols);

  // Position of the frame in percentages
  const pctX = cols > 1 ? (col / (cols - 1)) * 100 : 0;
  const pctY = rows > 1 ? (row / (rows - 1)) * 100 : 0;

  const bgImage = detectiveState === 'walking' ? `url(${detectiveWalk})` : `url(${detectiveIdle})`;
  const bgSize = `600% ${rows * 100}%`;

  // Coordinates of the pipe inside the character's container (scaled up 20% from 32px/162px)
  const PIPE_X = '38px';
  const PIPE_Y = '194px';

  return (
    <div
      ref={detectiveRef}
      className="absolute bottom-3 pointer-events-none z-40 flex flex-col items-center justify-end w-[134px] h-[269px]"
      style={{
        left: `${detectiveX}%`,
        transform: `translateX(-50%)`,
        transition: detectiveTransition,
      }}
    >
      {/* Hidden preloader container to prevent sprite sheet flash on state switches */}
      <div style={{ display: 'none' }} aria-hidden="true">
        <img src={detectiveIdle} alt="" />
        <img src={detectiveWalk} alt="" />
      </div>

      {/* Flipped Content Wrapper (Isolating scaleX flip from left position transition) */}
      <div
        className="w-full h-full relative"
        style={{
          transform: `scaleX(${detectiveFacingLeft ? 1 : -1})`,
        }}
      >
        {/* Smoke rings rising from the pipe */}
        {smokeRings.map((ring) => (
          <div
            key={ring.id}
            className="absolute border border-neutral-400/40 rounded-full animate-pulse pointer-events-none"
            style={{
              left: PIPE_X,
              bottom: PIPE_Y,
              width: '8px',
              height: '4px',
              transform: `scale(${ring.scale}) translateY(-${(Date.now() - ring.id) / 10}px)`,
              opacity: (2000 - (Date.now() - ring.id)) / 2000,
              transition: 'all 2s linear',
            }}
          />
        ))}

        {/* Frame Container */}
        <div
          className="w-full h-full drop-shadow-[0_8px_16px_rgba(0,0,0,0.95)]"
          style={{
            backgroundImage: bgImage,
            backgroundSize: bgSize,
            backgroundPosition: `${pctX}% ${pctY}%`,
            backgroundRepeat: 'no-repeat',
          }}
        />
      </div>
    </div>
  );
};
