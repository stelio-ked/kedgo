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

  // Real Authentic 3D Emblem Medallion Image Component
  const EmblemImage = ({ width, height }: { width: number; height: number }) => (
    <img
      src="/logo.png"
      alt="KedGo Logo"
      width={width}
      height={height}
      className="shrink-0 select-none object-contain drop-shadow-md transition-transform duration-200 hover:scale-105"
      style={{ width: `${width}px`, height: `${height}px` }}
      loading="eager"
      decoding="async"
    />
  );

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
