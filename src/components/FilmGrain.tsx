/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export default function FilmGrain() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10 opacity-[0.06] mix-blend-overlay">
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <filter id="noiseFilter">
          <feTurbulence 
            type="fractalNoise" 
            baseFrequency="0.65" 
            numOctaves="3" 
            stitchTiles="stitch" 
          />
        </filter>
        <rect width="100%" h="100%" filter="url(#noiseFilter)" />
      </svg>
      <style>{`
        @keyframes grain {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-1%, -1%); }
          20% { transform: translate(-2%, 1%); }
          30% { transform: translate(1%, -2%); }
          40% { transform: translate(-1%, 3%); }
          50% { transform: translate(-2%, 1%); }
          60% { transform: translate(1%, 2%); }
          70% { transform: translate(2%, 1%); }
          80% { transform: translate(-1%, -1%); }
          90% { transform: translate(2%, -2%); }
        }
        .grain-animate {
          animation: grain 1s steps(10) infinite;
        }
      `}</style>
      <div className="absolute -inset-[200%] grain-animate bg-transparent" />
    </div>
  );
}
