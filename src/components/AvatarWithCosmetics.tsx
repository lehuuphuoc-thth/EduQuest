import React from 'react';

interface AvatarWithCosmeticsProps {
  avatarPath: string;
  framePath: string | null;
  effectPath: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  level?: number;
}

export const AvatarWithCosmetics: React.FC<AvatarWithCosmeticsProps> = ({
  avatarPath,
  framePath,
  effectPath,
  size = 'md',
  level
}) => {
  // Size classes mapping with much larger, perfectly proportional emoji font sizes!
  const sizeClasses = {
    sm: { container: 'w-11 h-11', border: 'border-2', text: 'text-[25px]', label: 'w-4 h-4 text-[9px]' },
    md: { container: 'w-16 h-16', border: 'border-2', text: 'text-[36px]', label: 'w-5 h-5 text-[10px]' },
    lg: { container: 'w-26 h-26', border: 'border-4', text: 'text-[62px]', label: 'w-6 h-6 text-xs' },
    xl: { container: 'w-36 h-36', border: 'border-4', text: 'text-[92px]', label: 'w-8 h-8 text-sm' },
  };

  const selectedSize = sizeClasses[size] || sizeClasses.md;

  // 1. Get avatar graphics representation
  const getAvatarStyle = () => {
    if (avatarPath.startsWith('data:') || avatarPath.startsWith('http') || avatarPath.startsWith('/') || avatarPath.includes('.')) {
      if (avatarPath === 'avatar_cyberpunk.png') {
        return {
          bg: 'bg-gradient-to-tr from-pink-600 via-purple-600 to-indigo-600',
          emoji: '🧙',
          label: 'Cyberpunk',
          isImg: false,
          imgSrc: undefined
        };
      }
      if (avatarPath === 'avatar_wizard.png') {
        return {
          bg: 'bg-gradient-to-tr from-violet-700 via-indigo-900 to-amber-500',
          emoji: '🔮',
          label: 'Wizard',
          isImg: false,
          imgSrc: undefined
        };
      }
      if (avatarPath === 'avatar_scholar.png') {
        return {
          bg: 'bg-gradient-to-tr from-amber-500 to-yellow-600',
          emoji: '🦉',
          label: 'Scholar',
          isImg: false,
          imgSrc: undefined
        };
      }
      if (avatarPath === 'default_nu.png') {
        return {
          bg: 'bg-gradient-to-tr from-teal-400 to-emerald-600',
          emoji: '👧',
          label: 'Nữ',
          isImg: false,
          imgSrc: undefined
        };
      }
      if (avatarPath === 'default_nam.png') {
        return {
          bg: 'bg-gradient-to-tr from-blue-400 to-indigo-600',
          emoji: '👦',
          label: 'Nam',
          isImg: false,
          imgSrc: undefined
        };
      }

      // If it is custom uploaded or web image (bản mẫu upload)
      return {
        bg: 'bg-gradient-to-tr from-slate-850 via-slate-900 to-slate-950',
        emoji: '',
        label: 'Tùy biến',
        isImg: true,
        imgSrc: avatarPath
      };
    }

    return {
      bg: 'bg-gradient-to-tr from-blue-400 to-indigo-600',
      emoji: avatarPath || '👦',
      label: 'Học viên',
      isImg: false,
      imgSrc: undefined
    };
  };

  const avatarInfo = getAvatarStyle();

  // Custom frame geometry border radius classes to match outer edges nicely!
  const getInnerContainerRadius = () => {
    if (!framePath) return 'rounded-full';
    switch (framePath) {
      case 'frame_wood.png':
        return 'rounded-[16%]';
      case 'frame_bronze.png':
        return 'rounded-[24%]';
      case 'frame_silver.png':
        return 'rounded-[32%]';
      case 'frame_gold.png':
        return 'rounded-[14%]';
      default:
        return 'rounded-full';
    }
  };

  // 2. Custom Render of Angular, Edgy and Thick gaming frames
  const renderFrameOverlay = () => {
    if (!framePath) return null;

    switch (framePath) {
      case 'frame_wood.png':
        // Wooden Shield Frame: Heavy rough thick structure with metal studs
        return (
          <div className="absolute inset-0 pointer-events-none rounded-[16%] border-[5px] border-[#5C3A21] shadow-[0_4px_10px_rgba(0,0,0,0.35)] z-20">
            {/* Dark wood structural details */}
            <div className="absolute inset-px border-2 border-[#8B5A2B] rounded-[14%]" />
            {/* 4 Corner heavy bronze rivets */}
            <span className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-[#CD7F32] border border-[#5C3A21] rotate-45 shadow-sm" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#CD7F32] border border-[#5C3A21] rotate-45 shadow-sm" />
            <span className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-[#CD7F32] border border-[#5C3A21] rotate-45 shadow-sm" />
            <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-[#CD7F32] border border-[#5C3A21] rotate-45 shadow-sm" />
          </div>
        );
      case 'frame_bronze.png':
        // Bronze Warrior Badge: Angular octagonal thick layout with spiked teeth
        return (
          <div className="absolute inset-0 pointer-events-none rounded-[24%] border-[6px] border-[#A85A18] shadow-[0_5px_15px_rgba(168,90,24,0.4)] z-20 ring-2 ring-[#7F4614] ring-offset-0">
            {/* Solid metal inner bevel */}
            <div className="absolute inset-px border border-amber-300/40 rounded-[22%]" />
            {/* Spiked military crest teeth */}
            <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-2 bg-[#7F4614] border-x border-b border-[#D97706] rounded-b-md" />
            <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-2 bg-[#7F4614] border-x border-t border-[#D97706] rounded-t-md" />
            {/* Shiny diamond corner decorations */}
            <span className="absolute top-1 left-1 w-2 h-2 bg-amber-400 rotate-45 shadow-sm" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-amber-400 rotate-45 shadow-sm" />
            <span className="absolute bottom-1 left-1 w-2 h-2 bg-amber-400 rotate-45 shadow-sm" />
            <span className="absolute bottom-1 right-1 w-2 h-2 bg-amber-400 rotate-45 shadow-sm" />
          </div>
        );
      case 'frame_silver.png':
        // Silver Cyber Runic Shield: Edgy chrome hex layout with glowing cyber side wing horns
        return (
          <div className="absolute inset-0 pointer-events-none rounded-[32%] border-[7px] border-slate-300 shadow-[0_6px_22px_rgba(148,163,184,0.5)] z-20 ring-2 ring-[#708090] ring-offset-0">
            {/* Tech wing brackets for a sci-fi look */}
            <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-2.5 h-8 bg-slate-400 border border-white rounded shadow-md flex flex-col justify-between items-center py-0.5">
              <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-ping" />
            </div>
            <div className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-2.5 h-8 bg-slate-400 border border-white rounded shadow-md flex flex-col justify-between items-center py-0.5">
              <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-ping" />
            </div>
            {/* Cyber neon runic accent lines */}
            <span className="absolute -top-2 left-1/4 w-3.5 h-2 bg-sky-300 rounded skew-x-12" />
            <span className="absolute -top-2 right-1/4 w-3.5 h-2 bg-sky-300 rounded -skew-x-12" />
          </div>
        );
      case 'frame_gold.png':
        // Gold Heavy Overlord Crown-Hexagon: Thick golden plates with a crowning diamond and active halo
        return (
          <div className="absolute -inset-1.5 pointer-events-none rounded-[14%] border-[8px] border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.65)] z-20 ring-2 ring-yellow-600 bg-yellow-400/5">
            {/* Radiant runic outline */}
            <div className="absolute inset-px border-2 border-yellow-250 rounded-[12%] animate-pulse" />
            {/* Glowing peak crown element at the top */}
            <div className="absolute -top-4.5 left-1/2 -translate-x-1/2 flex items-end gap-0.5 z-30">
              <span className="w-2.5 h-3.5 bg-amber-500 border border-yellow-200 rotate-[20deg]" />
              <span className="w-3.5 h-5 bg-gradient-to-t from-amber-600 to-yellow-300 border-2 border-white -translate-y-0.5 flex items-center justify-center relative">
                <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping absolute" />
                <span className="w-1.5 h-1.5 bg-rose-650 rounded-full relative z-10" />
              </span>
              <span className="w-2.5 h-3.5 bg-amber-500 border border-yellow-200 -rotate-[20deg]" />
            </div>
            {/* Heavy-milled gaming shield metal corner protections */}
            <span className="absolute top-0 left-0 w-4 h-4 bg-yellow-250 border-r-2 border-b-2 border-yellow-600 opacity-95" />
            <span className="absolute top-0 right-0 w-4 h-4 bg-yellow-250 border-l-2 border-b-2 border-yellow-600 opacity-95" />
            <span className="absolute bottom-0 left-0 w-4 h-4 bg-yellow-250 border-r-2 border-t-2 border-yellow-600 opacity-95" />
            <span className="absolute bottom-0 right-0 w-4 h-4 bg-yellow-250 border-l-2 border-t-2 border-yellow-600 opacity-95" />
          </div>
        );
      default:
        return null;
    }
  };

  // 3. Dynamic Visual Effect Layers
  const renderEffectOverlay = () => {
    if (!effectPath) return null;

    switch (effectPath) {
      case 'effect_fire_aura.json':
        // Lửa Cháy (Burning Fire Aura effect)
        return (
          <div className="absolute inset-0 pointer-events-none overflow-visible z-0 bg-red-600/10 rounded-full animate-pulse border border-red-500/30">
            {/* Pulsing Outer Aurora Ring */}
            <div className="absolute -inset-4 rounded-full border-2 border-orange-500 opacity-40 animate-ping" />
            {/* Flame particles rising and flickering */}
            <span className="absolute bottom-1 left-[15%] w-3 h-3 bg-red-500 rounded-full filter blur-[1px] animate-fire-particle opacity-80" style={{ animationDelay: '0s' }} />
            <span className="absolute bottom-0 left-[35%] w-2.5 h-2.5 bg-amber-500 rounded-full filter blur-[1px] animate-fire-particle opacity-90" style={{ animationDelay: '0.4s' }} />
            <span className="absolute bottom-1.5 right-[15%] w-3.5 h-3.5 bg-yellow-500 rounded-full filter blur-[1.5px] animate-fire-particle opacity-85" style={{ animationDelay: '0.8s' }} />
            <span className="absolute bottom-1 left-[55%] w-2 h-2 bg-rose-500 rounded-full filter blur-[0.5px] animate-fire-particle opacity-95" style={{ animationDelay: '1.2s' }} />
            <span className="absolute bottom-0 right-[35%] w-3 h-3 bg-amber-400 rounded-full filter blur-[1px] animate-fire-particle opacity-90" style={{ animationDelay: '1.6s' }} />
          </div>
        );
      case 'effect_sparkle.gif':
        // Sao Rơi / Hào Quang Sao Lấp Lánh
        return (
          <div className="absolute inset-0 pointer-events-none overflow-visible z-0 bg-yellow-400/5 rounded-full border border-yellow-300/30">
            {/* Spinning starry glow bounds */}
            <div className="absolute -inset-3 rounded-full border border-yellow-400/40 opacity-50 animate-pulse" />
            {/* Active star falling sparkles */}
            <span className="absolute -top-1 left-[15%] text-[13px] animate-star-fall" style={{ animationDelay: '0s' }}>⭐</span>
            <span className="absolute -top-1 left-[45%] text-xs animate-star-fall" style={{ animationDelay: '0.6s' }}>✨</span>
            <span className="absolute -top-2 right-[15%] text-[11px] animate-star-fall" style={{ animationDelay: '1.2s' }}>★</span>
            <span className="absolute -top-2 left-[70%] text-[10px] animate-star-fall" style={{ animationDelay: '1.8s' }}>✨</span>
            <span className="absolute -top-1 right-[40%] text-xs animate-star-fall" style={{ animationDelay: '2.4s' }}>⭐</span>
          </div>
        );
      case 'effect_neon_glow.mp4':
        // Viền Neon Cực Quang / Cầu Vồng Ẩn Hiện
        return (
          <div className="absolute inset-0 pointer-events-none overflow-visible z-0 rounded-full">
            {/* Color-spinning background blur */}
            <div className="absolute -inset-3.5 rounded-full opacity-60 filter blur-[4px] animate-aurora-spin bg-[gradient-to-tr] bg-[linear-gradient(45deg,#ff007f,#7e22ce,#3b82f6,#10b981,#eab308,#ff007f)]" />
            {/* Pulse border ring */}
            <div className="absolute -inset-1.5 rounded-full border-[3.5px] border-indigo-400/45 animate-pulse" />
          </div>
        );
      default:
        // Optional dynamic fallback snow effect if specified under custom title
        return null;
    }
  };

  // High levels optionally get automatic majestic Falling Snow/Flame backdrops
  const renderLevelUpBackdrop = () => {
    if (level && level >= 10 && !effectPath) {
      // Default majestic snow falling backdrop for experts!
      return (
        <div className="absolute inset-0 pointer-events-none overflow-visible z-0">
          <span className="absolute -top-1.5 left-[10%] text-[11px] text-sky-200 animate-snow-fall" style={{ animationDelay: '0s' }}>❄️</span>
          <span className="absolute -top-1 left-[40%] text-[9px] text-blue-100 animate-snow-fall" style={{ animationDelay: '0.9s' }}>❄</span>
          <span className="absolute -top-2 right-[20%] text-[11px] text-sky-100 animate-snow-fall" style={{ animationDelay: '1.8s' }}>❄️</span>
          <span className="absolute -top-1.5 right-[50%] text-[12px] text-white animate-snow-fall" style={{ animationDelay: '2.7s' }}>❅</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`relative flex items-center justify-center ${selectedSize.container}`}>
      {/* Dynamic Keyframes Styles Injected safely */}
      <style>{`
        @keyframes fireParticleUp {
          0% { transform: translateY(0) scale(0.4); opacity: 0; }
          25% { opacity: 1; }
          100% { transform: translateY(-38px) scale(0.1); opacity: 0; }
        }
        .animate-fire-particle {
          animation: fireParticleUp 1.8s cubic-bezier(0.25, 1, 0.5, 1) infinite;
        }

        @keyframes starFallDown {
          0% { transform: translateY(-6px) scale(0.2) rotate(0deg); opacity: 0; }
          30% { opacity: 1; }
          100% { transform: translateY(42px) scale(1.1) rotate(180deg); opacity: 0; }
        }
        .animate-star-fall {
          animation: starFallDown 2.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
        }

        @keyframes snowFallDown {
          0% { transform: translateY(-8px) translateX(0) scale(0.4); opacity: 0; }
          25% { opacity: 0.9; }
          100% { transform: translateY(44px) translateX(5px) scale(1); opacity: 0; }
        }
        .animate-snow-fall {
          animation: snowFallDown 3.2s linear infinite;
        }

        @keyframes auroraSpin {
          0% { transform: rotate(0deg) scale(1); filter: hue-rotate(0deg); }
          50% { transform: rotate(180deg) scale(1.05); filter: hue-rotate(180deg); }
          100% { transform: rotate(360deg) scale(1); filter: hue-rotate(360deg); }
        }
        .animate-aurora-spin {
          animation: auroraSpin 6s linear infinite;
        }
      `}</style>

      {/* 1. Cosmetic Effect Backdrops (flames, snow, sparkles) */}
      {renderEffectOverlay()}
      {renderLevelUpBackdrop()}

      {/* 2. Main Avatar Outer Frame Bevel Layer Container */}
      <div className={`w-full h-full ${getInnerContainerRadius()} flex items-center justify-center overflow-hidden border-2 ${avatarInfo.bg} shadow-md transition-all duration-350 relative z-10`}>
        {avatarInfo.isImg ? (
          <img
            src={avatarInfo.imgSrc}
            alt="Custom Avatar"
            className="w-full h-full object-cover transition hover:scale-110 duration-250 select-none"
            referrerPolicy="no-referrer"
          />
        ) : (
          /* Large vector emoji rendering that fills up the visual area fully! */
          <span className={`${selectedSize.text} filter drop-shadow select-none transform transition hover:scale-110 active:scale-95 duration-250 flex items-center justify-center`}>
            {avatarInfo.emoji}
          </span>
        )}
        
        {/* Hover cosmetic label */}
        <span className="absolute bottom-1 bg-black/60 text-[7px] text-white/95 px-1 rounded uppercase hidden group-hover:block transition-all text-center leading-none tracking-wider font-mono">
          {avatarInfo.label}
        </span>
      </div>

      {/* 3. Heavy Angular 3D Frame Plate Overlays */}
      {renderFrameOverlay()}

      {/* 4. Level Badge overlay */}
      {level !== undefined && (
        <div className={`absolute -bottom-1 -right-1 rounded-full ${selectedSize.label} bg-gradient-to-tr from-indigo-700 to-violet-600 text-white font-extrabold flex items-center justify-center border-2 border-white shadow-lg z-30 font-mono`}>
          {level}
        </div>
      )}
    </div>
  );
};
