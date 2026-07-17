/**
 * MehendiPattern — Intricate SVG mehendi/henna patterns
 * Used as decorative backgrounds on auth pages and splash screens.
 */

interface MehendiPatternProps {
  className?: string;
  variant?: "full" | "corner-tl" | "corner-br" | "border";
  color?: string;
  opacity?: number;
  animate?: boolean;
}

const MehendiPattern = ({
  className = "",
  variant = "full",
  color = "currentColor",
  opacity = 0.12,
  animate = true,
}: MehendiPatternProps) => {
  const strokeProps = {
    stroke: color,
    strokeWidth: 1,
    fill: "none",
    opacity,
    ...(animate
      ? {
          strokeDasharray: 1000,
          strokeDashoffset: 1000,
          className: "animate-mehendi-draw",
        }
      : {}),
  };

  if (variant === "corner-tl") {
    return (
      <svg
        viewBox="0 0 300 300"
        className={`absolute top-0 left-0 ${className}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Paisley cluster top-left */}
        <g transform="translate(30, 30)">
          {/* Main paisley */}
          <path
            d="M60 10 C90 10, 110 40, 100 70 C90 100, 50 110, 30 90 C10 70, 20 30, 60 10Z"
            {...strokeProps}
          />
          <path
            d="M55 25 C75 25, 90 45, 82 65 C75 85, 50 90, 38 78 C25 65, 32 38, 55 25Z"
            {...strokeProps}
            opacity={opacity * 0.8}
          />
          {/* Inner spiral */}
          <path
            d="M58 40 C68 38, 75 48, 72 58 C69 68, 55 72, 48 65 C41 58, 45 44, 58 40Z"
            {...strokeProps}
            opacity={opacity * 0.6}
          />
          {/* Teardrop details */}
          <path d="M65 15 Q72 5, 78 15 Q72 12, 65 15Z" fill={color} fillOpacity={opacity * 0.5} />
          <path d="M90 30 Q97 22, 102 32 Q96 28, 90 30Z" fill={color} fillOpacity={opacity * 0.5} />
        </g>

        {/* Decorative dots and petals */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <circle
            key={`dot-${i}`}
            cx={20 + i * 18}
            cy={160 + Math.sin(i * 0.8) * 15}
            r={2 + (i % 3)}
            fill={color}
            fillOpacity={opacity * 0.4}
            style={animate ? { animation: `sparkle 2s ease-in-out ${i * 0.3}s infinite` } : {}}
          />
        ))}

        {/* Floral mandala piece */}
        <g transform="translate(140, 50) rotate(-15)">
          {[0, 60, 120, 180, 240, 300].map((angle) => (
            <g key={angle} transform={`rotate(${angle})`}>
              <path
                d="M0 -8 Q6 -20, 0 -32 Q-6 -20, 0 -8Z"
                fill={color}
                fillOpacity={opacity * 0.25}
              />
              <line x1="0" y1="-8" x2="0" y2="-28" {...strokeProps} opacity={opacity * 0.5} />
            </g>
          ))}
          <circle cx="0" cy="0" r="5" {...strokeProps} opacity={opacity * 0.4} />
          <circle cx="0" cy="0" r="2" fill={color} fillOpacity={opacity * 0.3} />
        </g>

        {/* Vine border */}
        <path
          d="M0 200 Q30 190, 50 210 Q70 230, 100 215 Q130 200, 150 220 Q170 240, 200 225"
          {...strokeProps}
          opacity={opacity * 0.3}
        />
        {/* Leaves on vine */}
        {[50, 100, 150].map((x, i) => (
          <path
            key={`leaf-${i}`}
            d={`M${x} ${210 + (i % 2 === 0 ? 0 : 5)} Q${x + 8} ${200 + (i % 2 === 0 ? -5 : 0)}, ${x + 15} ${210 + (i % 2 === 0 ? 0 : 5)}`}
            fill={color}
            fillOpacity={opacity * 0.2}
          />
        ))}
      </svg>
    );
  }

  if (variant === "corner-br") {
    return (
      <svg
        viewBox="0 0 300 300"
        className={`absolute bottom-0 right-0 ${className}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Mirrored paisley cluster bottom-right */}
        <g transform="translate(180, 180) scale(-1, -1)">
          <path
            d="M60 10 C90 10, 110 40, 100 70 C90 100, 50 110, 30 90 C10 70, 20 30, 60 10Z"
            {...strokeProps}
          />
          <path
            d="M55 25 C75 25, 90 45, 82 65 C75 85, 50 90, 38 78 C25 65, 32 38, 55 25Z"
            {...strokeProps}
            opacity={opacity * 0.8}
          />
          <path
            d="M58 40 C68 38, 75 48, 72 58 C69 68, 55 72, 48 65 C41 58, 45 44, 58 40Z"
            {...strokeProps}
            opacity={opacity * 0.6}
          />
          <path d="M65 15 Q72 5, 78 15 Q72 12, 65 15Z" fill={color} fillOpacity={opacity * 0.5} />
        </g>

        {/* Lotus flower */}
        <g transform="translate(220, 220)">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <g key={angle} transform={`rotate(${angle})`}>
              <path
                d="M0 -6 Q5 -16, 0 -28 Q-5 -16, 0 -6Z"
                fill={color}
                fillOpacity={opacity * 0.2}
                stroke={color}
                strokeWidth={0.5}
                strokeOpacity={opacity * 0.5}
              />
            </g>
          ))}
          <circle cx="0" cy="0" r="4" fill={color} fillOpacity={opacity * 0.25} />
        </g>

        {/* Decorative dots trailing */}
        {[0, 1, 2, 3, 4].map((i) => (
          <circle
            key={`bdot-${i}`}
            cx={280 - i * 15}
            cy={140 + Math.cos(i * 0.7) * 12}
            r={1.5 + (i % 2)}
            fill={color}
            fillOpacity={opacity * 0.3}
          />
        ))}

        {/* Small mandala */}
        <g transform="translate(120, 250)">
          {[0, 72, 144, 216, 288].map((angle) => (
            <g key={angle} transform={`rotate(${angle})`}>
              <ellipse cx="0" cy="-12" rx="3" ry="8" fill={color} fillOpacity={opacity * 0.15} />
            </g>
          ))}
          <circle cx="0" cy="0" r="3" {...strokeProps} opacity={opacity * 0.4} />
        </g>
      </svg>
    );
  }

  if (variant === "border") {
    return (
      <svg
        viewBox="0 0 400 60"
        preserveAspectRatio="none"
        className={`w-full ${className}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Repeating mehendi border pattern */}
        <path
          d="M0 30 Q25 10, 50 30 Q75 50, 100 30 Q125 10, 150 30 Q175 50, 200 30 Q225 10, 250 30 Q275 50, 300 30 Q325 10, 350 30 Q375 50, 400 30"
          {...strokeProps}
          opacity={opacity * 0.5}
        />
        {/* Dots along the curve */}
        {[50, 100, 150, 200, 250, 300, 350].map((x, i) => (
          <circle
            key={`border-dot-${i}`}
            cx={x}
            cy={30}
            r={2}
            fill={color}
            fillOpacity={opacity * 0.4}
          />
        ))}
        {/* Teardrops */}
        {[25, 75, 125, 175, 225, 275, 325, 375].map((x, i) => (
          <path
            key={`teardrop-${i}`}
            d={`M${x} ${i % 2 === 0 ? 15 : 45} Q${x + 4} ${i % 2 === 0 ? 8 : 52}, ${x + 8} ${i % 2 === 0 ? 15 : 45}`}
            fill={color}
            fillOpacity={opacity * 0.2}
          />
        ))}
      </svg>
    );
  }

  // Full background pattern
  return (
    <svg
      viewBox="0 0 500 500"
      className={`absolute inset-0 w-full h-full ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
    >
      {/* Central mandala */}
      <g transform="translate(250, 250)">
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => (
          <g key={angle} transform={`rotate(${angle})`}>
            <path
              d="M0 -15 Q8 -35, 0 -55 Q-8 -35, 0 -15Z"
              fill={color}
              fillOpacity={opacity * 0.15}
              stroke={color}
              strokeWidth={0.5}
              strokeOpacity={opacity * 0.4}
            />
            <path
              d="M0 -55 Q4 -65, 0 -75 Q-4 -65, 0 -55Z"
              fill={color}
              fillOpacity={opacity * 0.1}
            />
          </g>
        ))}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <g key={`inner-${angle}`} transform={`rotate(${angle})`}>
            <circle cx="0" cy="-85" r="3" fill={color} fillOpacity={opacity * 0.2} />
          </g>
        ))}
        <circle cx="0" cy="0" r="12" {...strokeProps} opacity={opacity * 0.4} />
        <circle cx="0" cy="0" r="8" {...strokeProps} opacity={opacity * 0.3} />
        <circle cx="0" cy="0" r="4" fill={color} fillOpacity={opacity * 0.2} />
      </g>

      {/* Corner paisleys */}
      <g transform="translate(60, 60) scale(0.7)">
        <path
          d="M60 10 C90 10, 110 40, 100 70 C90 100, 50 110, 30 90 C10 70, 20 30, 60 10Z"
          {...strokeProps}
        />
        <path
          d="M55 25 C75 25, 90 45, 82 65 C75 85, 50 90, 38 78 C25 65, 32 38, 55 25Z"
          {...strokeProps}
          opacity={opacity * 0.7}
        />
      </g>

      <g transform="translate(360, 60) scale(0.7) rotate(90)">
        <path
          d="M60 10 C90 10, 110 40, 100 70 C90 100, 50 110, 30 90 C10 70, 20 30, 60 10Z"
          {...strokeProps}
        />
      </g>

      <g transform="translate(60, 370) scale(0.7) rotate(-90)">
        <path
          d="M60 10 C90 10, 110 40, 100 70 C90 100, 50 110, 30 90 C10 70, 20 30, 60 10Z"
          {...strokeProps}
        />
      </g>

      <g transform="translate(360, 370) scale(0.7) rotate(180)">
        <path
          d="M60 10 C90 10, 110 40, 100 70 C90 100, 50 110, 30 90 C10 70, 20 30, 60 10Z"
          {...strokeProps}
        />
      </g>

      {/* Scattered dots */}
      {Array.from({ length: 24 }, (_, i) => {
        const angle = (i / 24) * Math.PI * 2;
        const radius = 120 + (i % 3) * 20;
        const cx = 250 + Math.cos(angle) * radius;
        const cy = 250 + Math.sin(angle) * radius;
        return (
          <circle
            key={`scatter-${i}`}
            cx={cx}
            cy={cy}
            r={1.5 + (i % 3)}
            fill={color}
            fillOpacity={opacity * 0.25}
          />
        );
      })}
    </svg>
  );
};

export default MehendiPattern;
