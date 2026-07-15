import React from 'react';
import { GameState } from '../types';
import * as Lucide from 'lucide-react';

interface AlleywayShopProps {
  gameState: GameState;
  onBuyItem: (itemId: 'catnip' | 'rumor' | 'safe_code' | 'writer_reset') => void;
}

export default function AlleywayShop({ gameState, onBuyItem }: AlleywayShopProps) {
  const cash = gameState.economy?.cash ?? 150;
  const isInjured = gameState.isInjured ?? false;
  const hasCatnipSenses = gameState.hasCatnipSenses ?? false;

  const hasLimitsToReset = 
    (gameState.writerCasesToday ?? 0) > 0 || 
    (gameState.writerNovelLastDay !== undefined && 
      ((gameState.currentDay ?? 1) - gameState.writerNovelLastDay) < 3);

  const items = [
    {
      id: 'catnip' as const,
      name: 'Кошачья мята богов',
      description: 'Излечивает травмы Миднайта и пробуждает шестое чувство (на ковриках, шкафах и полках подсветится скрытое содержимое).',
      cost: 30,
      icon: 'Leaf' as const,
      color: 'text-emerald-400',
      borderColor: 'border-emerald-500/20',
      bgColor: 'bg-emerald-950/10',
      active: hasCatnipSenses
    },
    {
      id: 'rumor' as const,
      name: 'Слухи у крысы Реми',
      description: 'Раскрывает содержимое одного случайного неизученного тайника в комнате (добавляет пометку «Здесь что-то есть»).',
      cost: 45,
      icon: 'HelpCircle' as const,
      color: 'text-amber-400',
      borderColor: 'border-amber-500/20',
      bgColor: 'bg-amber-950/10',
      active: false
    },
    {
      id: 'safe_code' as const,
      name: 'Шифр от пса Барни',
      description: 'Бездомный пес Барни подслушал разговор преступника и продает трехзначный код от сейфа напрямую.',
      cost: 60,
      icon: 'KeyRound' as const,
      color: 'text-blue-400',
      borderColor: 'border-blue-500/20',
      bgColor: 'bg-blue-950/10',
      active: gameState.inventory.includes('safe_code_note')
    },
    {
      id: 'writer_reset' as const,
      name: 'Кофе и сигареты писателя',
      description: 'Крепкий двойной эспрессо и пачка сигарет писателя. Полностью сбрасывает суточный лимит дел и 3-дневный кулдаун Большого дела.',
      cost: 25,
      icon: 'Coffee' as const,
      color: 'text-rose-400',
      borderColor: 'border-rose-500/20',
      bgColor: 'bg-rose-950/10',
      active: false,
      disabled: !hasLimitsToReset
    }
  ];

  const renderIcon = (iconName: string, className: string) => {
    switch (iconName) {
      case 'Leaf': return <Lucide.Leaf className={className} />;
      case 'HelpCircle': return <Lucide.HelpCircle className={className} />;
      case 'KeyRound': return <Lucide.KeyRound className={className} />;
      case 'Coffee': return <Lucide.Coffee className={className} />;
      default: return <Lucide.ShoppingBag className={className} />;
    }
  };

  return (
    <div className="border border-white/10 bg-[#0a0a0a] rounded-none p-4 flex flex-col shadow-2xl">
      <div className="flex justify-between items-center border-b border-white/10 pb-2.5 mb-3">
        <h3 className="font-sans text-[11px] font-bold text-white/80 uppercase tracking-[0.25em] flex items-center gap-1.5">
          <Lucide.Store className="w-3.5 h-3.5 text-white/60" />
          Кошачья лавка подворотни
        </h3>
        <span className="font-mono text-[9px] text-white/40">
          Ваш бюджет: <span className="text-emerald-400 font-bold">{cash}$</span>
        </span>
      </div>

      {isInjured && (
        <div className="mb-3 px-3 py-1.5 border border-red-500/30 bg-red-950/20 text-red-400 font-mono text-[9px] flex items-center gap-2 animate-pulse">
          <Lucide.AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>Миднайт прихрамывает! Излечите его кошачьей мятой.</span>
        </div>
      )}

      <div className="space-y-2.5">
        {items.map((item) => {
          const canAfford = cash >= item.cost;
          const isDisabled = item.active || 
            (item.id === 'safe_code' && gameState.inventory.includes('safe_code_note')) ||
            ('disabled' in item && item.disabled);

          return (
            <div 
              key={item.id} 
              className={`border p-2.5 transition-all flex justify-between items-center gap-3 ${
                isDisabled ? 'border-white/5 opacity-50 bg-black/40' : `${item.borderColor} ${item.bgColor} hover:border-white/25`
              }`}
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div className={`p-1.5 bg-black/40 border border-white/5 shrink-0 ${item.color}`}>
                  {renderIcon(item.icon, "w-4 h-4")}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-serif text-xs font-bold text-white/90 italic leading-none block">
                      {item.name}
                    </span>
                    {item.active && (
                      <span className="text-[7px] font-mono uppercase tracking-widest bg-emerald-500/10 text-emerald-400 px-1 py-0.2 border border-emerald-500/20 rounded-none">
                        Куплено
                      </span>
                    )}
                  </div>
                  <p className="font-sans text-[9px] text-white/50 leading-relaxed mt-1">
                    {item.description}
                  </p>
                </div>
              </div>

              <button
                disabled={isDisabled || !canAfford}
                onClick={() => onBuyItem(item.id)}
                className={`px-2.5 py-1.5 font-mono text-[9px] font-bold uppercase shrink-0 transition-all border ${
                  isDisabled
                    ? 'border-white/5 text-white/30 bg-transparent cursor-not-allowed'
                    : canAfford
                      ? 'border-emerald-500/40 text-emerald-400 bg-emerald-950/20 hover:bg-emerald-400 hover:text-black hover:border-emerald-400'
                      : 'border-red-500/30 text-red-400 bg-transparent cursor-not-allowed'
                }`}
              >
                {isDisabled ? '✔' : `${item.cost}$`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
