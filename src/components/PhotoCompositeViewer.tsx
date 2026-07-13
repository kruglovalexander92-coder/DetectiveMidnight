import * as Lucide from 'lucide-react';

interface PhotoCompositeFeatures {
	hair: 'bald' | 'short' | 'curly' | 'tophat';
	eyes: 'glasses' | 'angry' | 'normal' | 'monocle';
	mustache: 'none' | 'gentleman' | 'beard' | 'pirate';
	skin: 'pale' | 'tanned' | 'fair';
}

interface PhotoCompositeViewerProps {
	composite: PhotoCompositeFeatures;
	onUpdate: (feature: keyof PhotoCompositeFeatures, value: string) => void;
	disabled?: boolean;
}

const HAIR_OPTIONS: PhotoCompositeFeatures['hair'][] = ['bald', 'short', 'curly', 'tophat'];
const EYES_OPTIONS: PhotoCompositeFeatures['eyes'][] = ['normal', 'angry', 'glasses', 'monocle'];
const MUSTACHE_OPTIONS: PhotoCompositeFeatures['mustache'][] = ['none', 'gentleman', 'beard', 'pirate'];
const SKIN_OPTIONS: PhotoCompositeFeatures['skin'][] = ['fair', 'pale', 'tanned'];

const HAIR_LABELS: Record<PhotoCompositeFeatures['hair'], string> = {
	bald: 'Лысый',
	short: 'Короткая',
	curly: 'Кудри',
	tophat: 'Цилиндр',
};

const EYES_LABELS: Record<PhotoCompositeFeatures['eyes'], string> = {
	normal: 'Обычные',
	angry: 'Злые',
	glasses: 'Очки',
	monocle: 'Монокль',
};

const MUSTACHE_LABELS: Record<PhotoCompositeFeatures['mustache'], string> = {
	none: 'Нет',
	gentleman: 'Усы',
	beard: 'Борода',
	pirate: 'Пиратская',
};

const SKIN_LABELS: Record<PhotoCompositeFeatures['skin'], string> = {
	fair: 'Светлая',
	pale: 'Бледная',
	tanned: 'Загорелая',
};

function getSkinColorHex(skin: PhotoCompositeFeatures['skin']): string {
	switch (skin) {
		case 'pale': return '#f5deb3';
		case 'tanned': return '#d2691e';
		case 'fair': return '#ffe4c4';
	}
}

function cyclePrev<T>(options: T[], current: T): T {
	const idx = options.indexOf(current);
	return options[(idx - 1 + options.length) % options.length];
}

function cycleNext<T>(options: T[], current: T): T {
	const idx = options.indexOf(current);
	return options[(idx + 1) % options.length];
}

export default function PhotoCompositeViewer({ composite, onUpdate, disabled }: PhotoCompositeViewerProps) {
	const renderHair = () => {
		switch (composite.hair) {
			case 'bald':
				return null;
			case 'short':
				return (
					<path
						d="M 60 80 Q 100 50 140 80 L 140 90 Q 100 70 60 90 Z"
						fill="#4a3728"
						stroke="#2d1f14"
						strokeWidth="1"
					/>
				);
			case 'curly':
				return (
					<g>
						<circle cx="70" cy="75" r="12" fill="#4a3728" stroke="#2d1f14" strokeWidth="1" />
						<circle cx="90" cy="65" r="12" fill="#4a3728" stroke="#2d1f14" strokeWidth="1" />
						<circle cx="110" cy="65" r="12" fill="#4a3728" stroke="#2d1f14" strokeWidth="1" />
						<circle cx="130" cy="75" r="12" fill="#4a3728" stroke="#2d1f14" strokeWidth="1" />
					</g>
				);
			case 'tophat':
				return (
					<g>
						<rect x="70" y="40" width="60" height="50" fill="#1a1a1a" stroke="#000" strokeWidth="1" />
						<rect x="60" y="85" width="80" height="8" fill="#1a1a1a" stroke="#000" strokeWidth="1" />
					</g>
				);
		}
	};

	const renderEyes = () => {
		switch (composite.eyes) {
			case 'normal':
				return (
					<g>
						<ellipse cx="85" cy="110" rx="8" ry="6" fill="white" stroke="#333" strokeWidth="1" />
						<ellipse cx="115" cy="110" rx="8" ry="6" fill="white" stroke="#333" strokeWidth="1" />
						<circle cx="85" cy="110" r="3" fill="#4a3728" />
						<circle cx="115" cy="110" r="3" fill="#4a3728" />
					</g>
				);
			case 'angry':
				return (
					<g>
						<ellipse cx="85" cy="110" rx="8" ry="5" fill="white" stroke="#333" strokeWidth="1" />
						<ellipse cx="115" cy="110" rx="8" ry="5" fill="white" stroke="#333" strokeWidth="1" />
						<circle cx="85" cy="110" r="3" fill="#8b0000" />
						<circle cx="115" cy="110" r="3" fill="#8b0000" />
						<line x1="75" y1="100" x2="95" y2="105" stroke="#333" strokeWidth="2" />
						<line x1="125" y1="100" x2="105" y2="105" stroke="#333" strokeWidth="2" />
					</g>
				);
			case 'glasses':
				return (
					<g>
						<ellipse cx="85" cy="110" rx="8" ry="6" fill="white" stroke="#333" strokeWidth="1" />
						<ellipse cx="115" cy="110" rx="8" ry="6" fill="white" stroke="#333" strokeWidth="1" />
						<circle cx="85" cy="110" r="3" fill="#4a3728" />
						<circle cx="115" cy="110" r="3" fill="#4a3728" />
						<circle cx="85" cy="110" r="12" fill="none" stroke="#333" strokeWidth="2" />
						<circle cx="115" cy="110" r="12" fill="none" stroke="#333" strokeWidth="2" />
						<line x1="97" y1="110" x2="103" y2="110" stroke="#333" strokeWidth="2" />
					</g>
				);
			case 'monocle':
				return (
					<g>
						<ellipse cx="85" cy="110" rx="8" ry="6" fill="white" stroke="#333" strokeWidth="1" />
						<ellipse cx="115" cy="110" rx="8" ry="6" fill="white" stroke="#333" strokeWidth="1" />
						<circle cx="85" cy="110" r="3" fill="#4a3728" />
						<circle cx="115" cy="110" r="3" fill="#4a3728" />
						<circle cx="115" cy="110" r="12" fill="none" stroke="#c0a060" strokeWidth="2" />
						<line x1="127" y1="110" x2="135" y2="140" stroke="#c0a060" strokeWidth="1" />
					</g>
				);
		}
	};

	const renderMustache = () => {
		switch (composite.mustache) {
			case 'none':
				return null;
			case 'gentleman':
				return (
					<path
						d="M 85 135 Q 100 130 115 135 Q 110 140 100 140 Q 90 140 85 135"
						fill="#4a3728"
						stroke="#2d1f14"
						strokeWidth="1"
					/>
				);
			case 'beard':
				return (
					<g>
						<path
							d="M 75 130 Q 100 125 125 130 L 125 155 Q 100 165 75 155 Z"
							fill="#4a3728"
							stroke="#2d1f14"
							strokeWidth="1"
						/>
						<path
							d="M 85 135 Q 100 130 115 135 Q 110 140 100 140 Q 90 140 85 135"
							fill="#4a3728"
							stroke="#2d1f14"
							strokeWidth="1"
						/>
					</g>
				);
			case 'pirate':
				return (
					<g>
						<path
							d="M 70 130 Q 100 120 130 130 L 135 170 Q 100 185 65 170 Z"
							fill="#4a3728"
							stroke="#2d1f14"
							strokeWidth="1"
						/>
						<path
							d="M 80 135 Q 100 128 120 135 Q 115 145 100 145 Q 85 145 80 135"
							fill="#4a3728"
							stroke="#2d1f14"
							strokeWidth="1"
						/>
					</g>
				);
		}
	};

	return (
		<div className="flex flex-col items-center gap-3">
			<span className="font-mono text-[7px] text-amber-500/80 uppercase tracking-widest">
				ФОТОРОБОТ ПОДОЗРЕВАЕМОГО
			</span>
			
			<svg viewBox="0 0 200 200" className="w-40 h-40 border border-white/10 bg-black/40">
				<ellipse
					cx="100"
					cy="120"
					rx="45"
					ry="55"
					fill={getSkinColorHex(composite.skin)}
					stroke="#333"
					strokeWidth="1"
				/>
				
				{renderHair()}
				
				{renderEyes()}
				
				<path
					d="M 100 115 L 95 130 L 105 130 Z"
					fill={getSkinColorHex(composite.skin)}
					stroke="#333"
					strokeWidth="1"
				/>
				
				<path
					d="M 90 145 Q 100 150 110 145"
					fill="none"
					stroke="#8b4513"
					strokeWidth="2"
				/>
				
				{renderMustache()}
			</svg>

			<div className="w-full space-y-2">
				<div className="flex items-center gap-2">
					<button
						onClick={() => onUpdate('hair', cyclePrev(HAIR_OPTIONS, composite.hair))}
						disabled={disabled}
						className="w-6 h-6 flex items-center justify-center border border-white/10 bg-black/30 hover:border-amber-500/40 text-white/40 hover:text-white/80 text-xs disabled:opacity-30"
					>
						<Lucide.ChevronLeft className="w-3 h-3" />
					</button>
					<span className="flex-1 text-center font-mono text-[9px] text-amber-100/80">
						Волосы: {HAIR_LABELS[composite.hair]}
					</span>
					<button
						onClick={() => onUpdate('hair', cycleNext(HAIR_OPTIONS, composite.hair))}
						disabled={disabled}
						className="w-6 h-6 flex items-center justify-center border border-white/10 bg-black/30 hover:border-amber-500/40 text-white/40 hover:text-white/80 text-xs disabled:opacity-30"
					>
						<Lucide.ChevronRight className="w-3 h-3" />
					</button>
				</div>

				<div className="flex items-center gap-2">
					<button
						onClick={() => onUpdate('eyes', cyclePrev(EYES_OPTIONS, composite.eyes))}
						disabled={disabled}
						className="w-6 h-6 flex items-center justify-center border border-white/10 bg-black/30 hover:border-amber-500/40 text-white/40 hover:text-white/80 text-xs disabled:opacity-30"
					>
						<Lucide.ChevronLeft className="w-3 h-3" />
					</button>
					<span className="flex-1 text-center font-mono text-[9px] text-amber-100/80">
						Глаза: {EYES_LABELS[composite.eyes]}
					</span>
					<button
						onClick={() => onUpdate('eyes', cycleNext(EYES_OPTIONS, composite.eyes))}
						disabled={disabled}
						className="w-6 h-6 flex items-center justify-center border border-white/10 bg-black/30 hover:border-amber-500/40 text-white/40 hover:text-white/80 text-xs disabled:opacity-30"
					>
						<Lucide.ChevronRight className="w-3 h-3" />
					</button>
				</div>

				<div className="flex items-center gap-2">
					<button
						onClick={() => onUpdate('mustache', cyclePrev(MUSTACHE_OPTIONS, composite.mustache))}
						disabled={disabled}
						className="w-6 h-6 flex items-center justify-center border border-white/10 bg-black/30 hover:border-amber-500/40 text-white/40 hover:text-white/80 text-xs disabled:opacity-30"
					>
						<Lucide.ChevronLeft className="w-3 h-3" />
					</button>
					<span className="flex-1 text-center font-mono text-[9px] text-amber-100/80">
						Усы/Борода: {MUSTACHE_LABELS[composite.mustache]}
					</span>
					<button
						onClick={() => onUpdate('mustache', cycleNext(MUSTACHE_OPTIONS, composite.mustache))}
						disabled={disabled}
						className="w-6 h-6 flex items-center justify-center border border-white/10 bg-black/30 hover:border-amber-500/40 text-white/40 hover:text-white/80 text-xs disabled:opacity-30"
					>
						<Lucide.ChevronRight className="w-3 h-3" />
					</button>
				</div>

				<div className="flex items-center gap-2">
					<button
						onClick={() => onUpdate('skin', cyclePrev(SKIN_OPTIONS, composite.skin))}
						disabled={disabled}
						className="w-6 h-6 flex items-center justify-center border border-white/10 bg-black/30 hover:border-amber-500/40 text-white/40 hover:text-white/80 text-xs disabled:opacity-30"
					>
						<Lucide.ChevronLeft className="w-3 h-3" />
					</button>
					<span className="flex-1 text-center font-mono text-[9px] text-amber-100/80">
						Кожа: {SKIN_LABELS[composite.skin]}
					</span>
					<button
						onClick={() => onUpdate('skin', cycleNext(SKIN_OPTIONS, composite.skin))}
						disabled={disabled}
						className="w-6 h-6 flex items-center justify-center border border-white/10 bg-black/30 hover:border-amber-500/40 text-white/40 hover:text-white/80 text-xs disabled:opacity-30"
					>
						<Lucide.ChevronRight className="w-3 h-3" />
					</button>
				</div>
			</div>
		</div>
	);
}
