import React from 'react';

interface DivaLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export default function DivaLogo({ className = '', size = 'md', showText = true }: DivaLogoProps) {
  // Dimensions based on size
  const iconDimensions = {
    sm: { width: 34, height: 34, fontLogo: 'text-xs' },
    md: { width: 44, height: 44, fontLogo: 'text-sm' },
    lg: { width: 68, height: 68, fontLogo: 'text-lg' }
  };

  const { width, height } = iconDimensions[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Circle Icon */}
      <svg
        width={width}
        height={height}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Outer dark-green crescent/accent */}
        <path
          d="M 50 10 A 40 40 0 0 0 50 90 L 50 100 A 50 50 0 0 1 50 0 Z"
          fill="#446340"
        />
        {/* Main green circle */}
        <circle cx="50" cy="50" r="44" fill="#557A51" />
        
        {/* Inner white circle rim */}
        <circle cx="50" cy="50" r="37" stroke="white" strokeWidth="4" fill="none" />
        
        {/* Main white capital letter 'D' */}
        <text
          x="50"
          y="68"
          fill="white"
          fontSize="48"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="800"
          textAnchor="middle"
        >
          D
        </text>
      </svg>

      {/* Stacked Wordmark (diva kencana borneo) */}
      {showText && (
        <div className="flex flex-col select-none leading-none items-start text-left">
          <span className="font-sans font-bold text-[#557A51] tracking-normal text-[15px] sm:text-[16px] lowercase leading-[1.1]">
            diva
          </span>
          <span className="font-sans font-bold text-[#557A51] tracking-normal text-[15px] sm:text-[16px] lowercase leading-[1.1]">
            kencana
          </span>
          <span className="font-sans font-bold text-[#557A51] tracking-normal text-[15px] sm:text-[16px] lowercase leading-[1.1]">
            borneo
          </span>
        </div>
      )}
    </div>
  );
}
