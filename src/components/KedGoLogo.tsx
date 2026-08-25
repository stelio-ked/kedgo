import React, { useState } from 'react';

interface KedGoLogoProps {
  variant?: 'full' | 'mark' | 'stamp' | 'image';
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
  showSlogan?: boolean;
  inverse?: boolean;
}

export const KedGoLogo: React.FC<KedGoLogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
  showSlogan = true,
  inverse = false,
}) => {
  const [imgError, setImgError] = useState(false);

  const getDimension = () => {
    if (typeof size === 'number') return size;
    switch (size) {
      case 'sm': return 28;
      case 'md': return 40;
      case 'lg': return 56;
      case 'xl': return 80;
      default: return 40;
    }
  };

  const dim = getDimension();

  // Vector SVG Emblem Fallback
  const VectorEmblem = ({ width, height }: { width: number; height: number }) => (
    <div 
      className="relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#1E3A5F] via-[#2A4D7A] to-[#D95D39] p-0.5 shadow-md shrink-0 select-none overflow-hidden"
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <div className="w-full h-full bg-[#1E3A5F] rounded-[14px] flex items-center justify-center relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-1 -right-1 w-1/2 h-1/2 bg-[#D95D39]/40 rounded-full blur-sm" />
        <svg 
          viewBox="0 0 48 48" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg" 
          className="w-3/4 h-3/4 transform -rotate-12 transition-transform duration-300 hover:rotate-0"
        >
          {/* Globe grid lines */}
          <circle cx="24" cy="24" r="18" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.25" />
          <ellipse cx="24" cy="24" rx="9" ry="18" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.2" />
          <line x1="6" y1="24" x2="42" y2="24" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.2" />
          
          {/* Airplane Silhouette */}
          <path 
            d="M24 10L27.5 20.5L38 23L27.5 25.5L24 36L20.5 25.5L10 23L20.5 20.5L24 10Z" 
            fill="url(#kedgo-plane-grad)" 
            filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.3))"
          />
          <defs>
            <linearGradient id="kedgo-plane-grad" x1="10" y1="10" x2="38" y2="36" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FBBF24" />
              <stop offset="0.5" stopColor="#F59E0B" />
              <stop offset="1" stopColor="#D95D39" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );

  // Real Authentic 3D Emblem Medallion Image Component with automatic fallback
  const EmblemImage = ({ width, height }: { width: number; height: number }) => {
    if (imgError) {
      return <VectorEmblem width={width} height={height} />;
    }

    return (
      <img
        src="/logo.png"
        alt="KedGo"
        width={width}
        height={height}
        onError={() => setImgError(true)}
        className="shrink-0 select-none object-contain drop-shadow-md transition-transform duration-200 hover:scale-105"
        style={{ width: `${width}px`, height: `${height}px` }}
        loading="eager"
        decoding="async"
      />
    );
  };

  // Variant === 'image'
  if (variant === 'image') {
    return (
      <div className={`relative inline-flex items-center justify-center select-none ${className}`} style={{ width: dim, height: dim }}>
        <EmblemImage width={dim} height={dim} />
      </div>
    );
  }

  // Variant === 'mark' (circular badge only)
  if (variant === 'mark') {
    return (
      <div className={`inline-flex items-center justify-center shrink-0 ${className}`}>
        <EmblemImage width={dim} height={dim} />
      </div>
    );
  }

  // Variant === 'stamp' (detailed stamp badge)
  if (variant === 'stamp') {
    const stampDim = typeof size === 'number' ? size : dim * 1.5;
    return (
      <div className={`inline-flex items-center justify-center shrink-0 ${className}`}>
        <EmblemImage width={stampDim} height={stampDim} />
      </div>
    );
  }

  // Variant === 'full' (Stamp mark + refined branding typography)
  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 select-none shrink-0 ${className}`}>
      {/* Icon Stamp Badge - Pure Transparent 3D Badge */}
      <div className="relative shrink-0 flex items-center justify-center">
        <EmblemImage width={dim} height={dim} />
      </div>

      {/* Typography without @kedpelomundo label */}
      <div className="flex flex-col text-left">
        <div className="flex items-baseline tracking-tight font-black">
          <span className={`text-xl sm:text-2xl font-extrabold tracking-tight ${inverse ? 'text-white' : 'text-[#1E3A5F]'}`}>
            Ked
          </span>
          <span className="text-[#D95D39] text-xl sm:text-2xl font-black italic tracking-normal ml-0.5">
            Go!
          </span>
        </div>
        {showSlogan && (
          <span className={`text-[10px] sm:text-[11px] font-semibold tracking-wide uppercase leading-tight mt-0.5 ${inverse ? 'text-white/85' : 'text-[#1E3A5F]/85'}`}>
            Seu Roteiro Personalizado
          </span>
        )}
      </div>
    </div>
  );
};

export default KedGoLogo;
