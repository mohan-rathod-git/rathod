/**
 * PhoneMockup — Vector-only phone frame mockup for hero landing page.
 *
 * No external/hotlinked image bezels. Uses CSS geometry and inline SVGs.
 * Dynamic scaling of content width based on container width.
 */

import React, { useEffect, useRef, useState } from 'react';

interface PhoneMockupProps {
  children: React.ReactNode;
  className?: string;
  badgeText?: string;
}

export const PhoneMockup: React.FC<PhoneMockupProps> = ({ children, className = '', badgeText }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        // 390px base design width
        setScale(width / 390);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {badgeText && (
        <span className="mb-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[11px] font-bold text-primary tracking-wide">
          {badgeText}
        </span>
      )}
      <div
        ref={containerRef}
        className="phone-frame relative rounded-[clamp(30px,4vw,54px)] bg-black p-[clamp(6px,1vw,12px)] shadow-2xl shadow-black/80 ring-1 ring-white/15 overflow-hidden"
        style={{
          aspectRatio: '390/844',
          width: 'clamp(220px, 75vw, 340px)',
        }}
      >
        {/* Side button accents */}
        <div className="absolute -left-[3px] top-[18%] h-[6%] w-[3px] bg-neutral-700 rounded-l" />
        <div className="absolute -left-[3px] top-[26%] h-[9%] w-[3px] bg-neutral-700 rounded-l" />
        <div className="absolute -left-[3px] top-[37%] h-[9%] w-[3px] bg-neutral-700 rounded-l" />
        <div className="absolute -right-[3px] top-[28%] h-[12%] w-[3px] bg-neutral-700 rounded-r" />

        {/* Dynamic island / Notch */}
        <div className="absolute top-[2.5%] left-1/2 -translate-x-1/2 w-[28%] h-[3.8%] bg-black rounded-full z-50 flex items-center justify-between px-2">
          <div className="w-2.5 h-2.5 rounded-full bg-neutral-900 ring-1 ring-white/10" />
          <div className="w-1.5 h-1.5 rounded-full bg-blue-950/80" />
        </div>

        {/* Screen container */}
        <div className="relative w-full h-full rounded-[clamp(24px,3.2vw,44px)] overflow-hidden bg-[#FBF6EC] text-foreground flex flex-col">
          <div
            className="w-[390px] h-[844px] origin-top-left flex flex-col justify-between"
            style={{ transform: `scale(${scale})` }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhoneMockup;
