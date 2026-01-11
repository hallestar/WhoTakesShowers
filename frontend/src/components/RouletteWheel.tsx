import { useState, useImperativeHandle, forwardRef, useEffect } from 'react';
import type { Candidate } from '../api';
import { getPhotoUrl } from '../api';
import { ChevronDown, Star } from 'lucide-react';

interface RouletteWheelProps {
  candidates: Candidate[];
  isSpinning: boolean;
  onSpinComplete: (candidate: Candidate) => void;
  selectedIndex?: number;
}

export interface RouletteHandle {
  spin: () => void;
  reset: () => void;
}

// Helper to calculate point on a circle
const getCoordinatesForPercent = (percent: number, radius: number) => {
  const x = Math.cos(2 * Math.PI * percent) * radius;
  const y = Math.sin(2 * Math.PI * percent) * radius;
  return [x, y];
};

// Get alternating colors for wheel segments - using arcade style colors
const getSegmentColor = (index: number): string => {
  const colors = [
    'var(--neon-pink)',    // #FF2E93
    'var(--electric-blue)', // #00D4FF
    'var(--lime-green)',    // #CCFF00
    'var(--sunset-orange)', // #FF6B00
    'var(--soft-lilac)',   // #E8E4FF
    'var(--minty-fresh)',  // #D4FFEA
    'var(--peachy)',       // #FFE8D4
    '#FF1493',             // Deep Pink
  ];
  return colors[index % colors.length];
};

// Get gradient for segment
const getSegmentGradient = (index: number): string => {
  const gradients = [
    'linear-gradient(135deg, var(--neon-pink) 0%, #FF1493 100%)',
    'linear-gradient(135deg, var(--electric-blue) 0%, #0099CC 100%)',
    'linear-gradient(135deg, var(--lime-green) 0%, #99CC00 100%)',
    'linear-gradient(135deg, var(--sunset-orange) 0%, #CC5500 100%)',
    'linear-gradient(135deg, var(--soft-lilac) 0%, #C4B5FD 100%)',
    'linear-gradient(135deg, var(--minty-fresh) 0%, #A7F3D0 100%)',
    'linear-gradient(135deg, var(--peachy) 0%, #FED7AA 100%)',
    'linear-gradient(135deg, #FF1493 0%, #CC1177 100%)',
  ];
  return gradients[index % gradients.length];
};

const RouletteWheel = forwardRef<RouletteHandle, RouletteWheelProps>(
  ({ candidates, isSpinning, onSpinComplete, selectedIndex = -1 }, ref) => {
    const [rotation, setRotation] = useState(0);
    const [spinning, setSpinning] = useState(false);

    const numSegments = candidates.length;
    const segmentAngle = 360 / numSegments;
    const radius = 50; // SVG coordinate units

    useImperativeHandle(ref, () => ({
      spin: () => {
        if (spinning) return;

        setSpinning(true);

        // Calculate rotation to land on the selected candidate
        const targetAngle = 360 - (selectedIndex * segmentAngle + segmentAngle / 2);
        const spinCount = 5 + Math.floor(Math.random() * 3); // 5 to 8 full spins
        const newRotation = rotation + (spinCount * 360) + targetAngle - (rotation % 360);

        setRotation(newRotation);

        // Calculate winner based on final rotation
        setTimeout(() => {
          setSpinning(false);
          const safeIndex = ((selectedIndex % numSegments) + numSegments) % numSegments;
          onSpinComplete(candidates[safeIndex]);
        }, 5000); // Must match transition duration
      },
      reset: () => {
        setRotation(0);
        setSpinning(false);
      }
    }));

    // Handle external spin trigger
    useEffect(() => {
      if (isSpinning && selectedIndex >= 0 && !spinning) {
        // Trigger spin via ref
        const targetAngle = 360 - (selectedIndex * segmentAngle + segmentAngle / 2);
        const spinCount = 5 + Math.floor(Math.random() * 3);
        const newRotation = rotation + (spinCount * 360) + targetAngle - (rotation % 360);

        setSpinning(true);
        setRotation(newRotation);

        setTimeout(() => {
          setSpinning(false);
          const safeIndex = ((selectedIndex % numSegments) + numSegments) % numSegments;
          onSpinComplete(candidates[safeIndex]);
        }, 5000);
      }
    }, [isSpinning, selectedIndex]);

    // Create segments
    const segments = candidates.map((candidate, index) => {
      // Start and end angles in range [0, 1]
      const startPercent = index / numSegments;
      const endPercent = (index + 1) / numSegments;

      const [startX, startY] = getCoordinatesForPercent(startPercent, radius);
      const [endX, endY] = getCoordinatesForPercent(endPercent, radius);

      // Large arc flag
      const largeArcFlag = segmentAngle > 180 ? 1 : 0;

      // Path command
      const pathData = [
        `M 0 0`,
        `L ${startX} ${startY}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
        `Z`
      ].join(' ');

      // Calculate center of the slice for text/image placement
      const midAngle = startPercent + (1 / numSegments) / 2;
      const [textX, textY] = getCoordinatesForPercent(midAngle, radius * 0.72);
      const [imgX, imgY] = getCoordinatesForPercent(midAngle, radius * 0.5);

      // Rotation for text (to face inward)
      const rotateAngle = (midAngle * 360) + 90;

      const photoUrl = candidate.photo_url || '';
      const hasPhoto = photoUrl.trim() !== '';
      const avatarEmoji = ['😀', '😎', '🥳', '😊', '🤩', '😄'][index % 6];

      const isSelected = selectedIndex === index && spinning;
      const segmentColor = getSegmentColor(index);

      return (
        <g key={candidate.id}>
          <defs>
            {/* Gradient definition for segment */}
            <linearGradient id={`gradient-${candidate.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={segmentColor} stopOpacity="1" />
              <stop offset="100%" stopColor={segmentColor} stopOpacity="0.7" />
            </linearGradient>
            {/* Glow filter for selected segment */}
            <filter id={`glow-${candidate.id}`}>
              <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Segment background with gradient */}
          <path
            d={pathData}
            fill={`url(#gradient-${candidate.id})`}
            stroke={isSelected ? '#FFD700' : 'var(--deep-purple)'}
            strokeWidth={isSelected ? '1.5' : '0.8'}
            filter={isSelected ? `url(#glow-${candidate.id})` : undefined}
            opacity={isSelected ? 1 : 0.95}
            style={{
              transition: 'all 0.3s ease',
            }}
          />

          {/* Inner highlight for depth */}
          <path
            d={pathData}
            fill="none"
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth="0.3"
            opacity="0.5"
          />

          {/* Avatar Image or Emoji in Circle with enhanced styling */}
          <g transform={`translate(${imgX - 3}, ${imgY - 3}) rotate(${rotateAngle - 90}, 3, 3)`}>
            <defs>
              <clipPath id={`clip-${candidate.id}`}>
                <circle cx="3" cy="3" r="3" />
              </clipPath>
              <filter id={`avatar-glow-${candidate.id}`}>
                <feGaussianBlur stdDeviation="0.5" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            {/* Outer ring */}
            <circle 
              cx="3" 
              cy="3" 
              r="3.5" 
              fill="white" 
              stroke={isSelected ? '#FFD700' : 'var(--deep-purple)'}
              strokeWidth={isSelected ? '0.4' : '0.2'}
              filter={isSelected ? `url(#avatar-glow-${candidate.id})` : undefined}
            />
            {/* Inner circle */}
            <circle cx="3" cy="3" r="3" fill="white" />
            {hasPhoto ? (
              <image
                href={getPhotoUrl(photoUrl)}
                x="0"
                y="0"
                height="6"
                width="6"
                clipPath={`url(#clip-${candidate.id})`}
                preserveAspectRatio="xMidYMid slice"
                filter={isSelected ? `url(#avatar-glow-${candidate.id})` : undefined}
              />
            ) : (
              <text
                x="3"
                y="3.5"
                fontSize="3.5"
                textAnchor="middle"
                dominantBaseline="middle"
                filter={isSelected ? `url(#avatar-glow-${candidate.id})` : undefined}
              >
                {avatarEmoji}
              </text>
            )}
          </g>

          {/* Candidate Name with enhanced styling */}
          <text
            x={textX}
            y={textY}
            fill="white"
            fontSize="2.8"
            fontFamily="'Fredoka One', cursive"
            fontWeight="bold"
            textAnchor="middle"
            alignmentBaseline="middle"
            transform={`rotate(${rotateAngle - 90}, ${textX}, ${textY})`}
            style={{
              textShadow: isSelected 
                ? '0 0 8px #FFD700, 2px 2px 4px rgba(0,0,0,0.8), 0 0 12px rgba(255,215,0,0.6)'
                : '2px 2px 4px rgba(0,0,0,0.8), 1px 1px 2px rgba(0,0,0,0.5)',
              filter: isSelected ? `url(#glow-${candidate.id})` : undefined,
              fontWeight: isSelected ? '900' : 'bold',
            }}
          >
            {candidate.name}
          </text>
        </g>
      );
    });

    return (
      <div
        className="relative w-full max-w-[600px] aspect-square mx-auto flex items-center justify-center"
        style={{
          maxWidth: 'min(600px, 80vw)',
          width: '100%',
          aspectRatio: '1/1',
        }}
      >
        {/* Outer Decorative Ring with Arcade Style */}
        <div
          className="absolute rounded-full"
          style={{
            inset: 'clamp(8px, 2vw, 16px)',
            background: 'linear-gradient(135deg, var(--neon-pink) 0%, var(--electric-blue) 50%, var(--lime-green) 100%)',
            border: '5px solid var(--deep-purple)',
            boxShadow: `
              0 0 20px rgba(255, 46, 147, 0.5),
              0 0 40px rgba(0, 212, 255, 0.3),
              inset 0 0 20px rgba(0, 0, 0, 0.2),
              4px 4px 0 var(--deep-purple)
            `,
            animation: spinning ? 'ringPulse 2s ease-in-out infinite' : 'none',
          }}
        >
          {/* Enhanced Lights on the rim */}
          {Array.from({ length: 32 }).map((_, i) => {
            const angle = (i * 360) / 32;
            const isEven = i % 2 === 0;
            const size = 12;
            const radiusOffset = 48;

            return (
              <div
                key={i}
                className={`absolute rounded-full transition-all duration-1000 ${
                  spinning ? (isEven ? 'animate-pulse' : 'animate-ping') : 'animate-pulse-fast'
                }`}
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `rotate(${angle}deg) translate(48%, -50%) translateX(${radiusOffset}px)`,
                  width: `${size}px`,
                  height: `${size}px`,
                  backgroundColor: isEven ? 'var(--electric-blue)' : 'var(--neon-pink)',
                  boxShadow: spinning
                    ? `0 0 ${size * 2}px ${isEven ? 'var(--electric-blue)' : 'var(--neon-pink)'}, 0 0 ${size}px white`
                    : `0 0 ${size}px ${isEven ? 'var(--electric-blue)' : 'var(--neon-pink)'}`,
                  border: `2px solid ${isEven ? 'white' : 'var(--deep-purple)'}`,
                }}
              />
            );
          })}
        </div>

        {/* The Spinning Wheel Container with Enhanced Styling */}
        <div
          className="absolute rounded-full overflow-hidden"
          style={{
            inset: 'clamp(32px, 8vw, 64px)',
            border: '6px solid var(--deep-purple)',
            background: 'radial-gradient(circle, rgba(26, 26, 46, 0.95) 0%, rgba(0, 0, 0, 0.8) 100%)',
            boxShadow: `
              inset 0 0 40px rgba(0, 0, 0, 0.5),
              0 0 30px rgba(255, 46, 147, 0.3),
              0 0 60px rgba(0, 212, 255, 0.2),
              4px 4px 0 var(--deep-purple)
            `,
            transform: `rotate(${rotation - 90}deg)`,
            transitionDuration: spinning ? '5000ms' : '0s',
            transitionTimingFunction: 'cubic-bezier(0.17, 0.67, 0.12, 0.99)',
          }}
        >
          <svg viewBox="-50 -50 100 100" className="w-full h-full" style={{ filter: spinning ? 'blur(0.5px)' : 'none' }}>
            {segments}
          </svg>
        </div>

        {/* Center Decorative Hub with Arcade Style */}
        <div
          className="absolute rounded-full flex items-center justify-center z-10"
          style={{
            width: 'clamp(80px, 18vw, 128px)',
            height: 'clamp(80px, 18vw, 128px)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'linear-gradient(135deg, var(--neon-pink) 0%, var(--electric-blue) 50%, var(--lime-green) 100%)',
            border: '5px solid var(--deep-purple)',
            boxShadow: `
              0 0 30px rgba(255, 46, 147, 0.6),
              0 0 60px rgba(0, 212, 255, 0.4),
              inset 0 0 20px rgba(0, 0, 0, 0.3),
              4px 4px 0 var(--deep-purple)
            `,
            animation: spinning ? 'centerPulse 1.5s ease-in-out infinite' : 'none',
          }}
        >
          <div
            className="rounded-full border-2 flex items-center justify-center"
            style={{
              width: '75%',
              height: '75%',
              background: 'radial-gradient(circle, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.6) 100%)',
              borderColor: 'var(--deep-purple)',
              boxShadow: 'inset 0 0 15px rgba(0, 0, 0, 0.2)',
            }}
          >
            <Star
              className="drop-shadow-lg"
              style={{
                color: 'var(--deep-purple)',
                width: 'clamp(28px, 6vw, 44px)',
                height: 'clamp(28px, 6vw, 44px)',
                filter: spinning ? 'drop-shadow(0 0 8px var(--neon-pink))' : 'none',
                animation: spinning ? 'starRotate 2s linear infinite' : 'none',
              }}
              fill="currentColor"
            />
          </div>
        </div>

        {/* The Pointer (Top) with Enhanced Styling */}
        <div
          className="z-20"
          style={{
            position: 'absolute',
            top: '-12px',
            left: '50%',
            transform: 'translateX(-50%)',
            filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.6)) drop-shadow(0 0 15px var(--neon-pink))',
            animation: spinning ? 'pointerBounce 0.5s ease-in-out infinite' : 'none',
          }}
        >
          <div style={{ 
            transform: 'scale(1.8)',
            filter: spinning ? 'drop-shadow(0 0 10px var(--electric-blue))' : 'none',
          }}>
            <ChevronDown 
              fill="var(--lime-green)" 
              stroke="var(--deep-purple)" 
              strokeWidth={3}
              size={48} 
            />
          </div>
          {/* Pointer glow effect */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '60px',
              height: '60px',
              background: 'radial-gradient(circle, var(--lime-green) 0%, transparent 70%)',
              opacity: spinning ? 0.6 : 0.3,
              borderRadius: '50%',
              filter: 'blur(8px)',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* CSS Animations */}
        <style>{`
          @keyframes ringPulse {
            0%, 100% {
              box-shadow: 
                0 0 20px rgba(255, 46, 147, 0.5),
                0 0 40px rgba(0, 212, 255, 0.3),
                inset 0 0 20px rgba(0, 0, 0, 0.2),
                4px 4px 0 var(--deep-purple);
            }
            50% {
              box-shadow: 
                0 0 40px rgba(255, 46, 147, 0.8),
                0 0 80px rgba(0, 212, 255, 0.6),
                inset 0 0 20px rgba(0, 0, 0, 0.2),
                4px 4px 0 var(--deep-purple);
            }
          }

          @keyframes centerPulse {
            0%, 100% {
              transform: translate(-50%, -50%) scale(1);
              box-shadow: 
                0 0 30px rgba(255, 46, 147, 0.6),
                0 0 60px rgba(0, 212, 255, 0.4),
                inset 0 0 20px rgba(0, 0, 0, 0.3),
                4px 4px 0 var(--deep-purple);
            }
            50% {
              transform: translate(-50%, -50%) scale(1.05);
              box-shadow: 
                0 0 50px rgba(255, 46, 147, 0.9),
                0 0 100px rgba(0, 212, 255, 0.7),
                inset 0 0 20px rgba(0, 0, 0, 0.3),
                4px 4px 0 var(--deep-purple);
            }
          }

          @keyframes starRotate {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          @keyframes pointerBounce {
            0%, 100% { transform: translateX(-50%) translateY(0); }
            50% { transform: translateX(-50%) translateY(-5px); }
          }
        `}</style>
      </div>
    );
  }
);

RouletteWheel.displayName = 'RouletteWheel';

// Helper function for responsive values
function clamp(min: number, vw: number, max: number): string {
  return `clamp(${min}px, ${vw}vw, ${max}px)`;
}

export default RouletteWheel;
