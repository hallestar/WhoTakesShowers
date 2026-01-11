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

// Get alternating colors for wheel segments
const getSegmentColor = (index: number): string => {
  const colors = [
    '#FF1744', // Red
    '#FFD700', // Gold
    '#1E90FF', // Blue
    '#32CD32', // Green
    '#FF1493', // Pink
    '#FF8C00', // Orange
    '#9400D3', // Purple
    '#00CED1', // Cyan
  ];
  return colors[index % colors.length];
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

      return (
        <g key={candidate.id}>
          {/* Segment background */}
          <path
            d={pathData}
            fill={getSegmentColor(index)}
            stroke="#fcd34d"
            strokeWidth="0.5"
          />

          {/* Avatar Image or Emoji in Circle */}
          <g transform={`translate(${imgX - 3}, ${imgY - 3}) rotate(${rotateAngle - 90}, 3, 3)`}>
            <defs>
              <clipPath id={`clip-${candidate.id}`}>
                <circle cx="3" cy="3" r="3" />
              </clipPath>
            </defs>
            <circle cx="3" cy="3" r="3.2" fill="white" />
            {hasPhoto ? (
              <image
                href={getPhotoUrl(photoUrl)}
                x="0"
                y="0"
                height="6"
                width="6"
                clipPath={`url(#clip-${candidate.id})`}
                preserveAspectRatio="xMidYMid slice"
              />
            ) : (
              <text
                x="3"
                y="3.5"
                fontSize="3"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {avatarEmoji}
              </text>
            )}
          </g>

          {/* Candidate Name */}
          <text
            x={textX}
            y={textY}
            fill="white"
            fontSize="2.5"
            fontFamily="serif"
            fontWeight="bold"
            textAnchor="middle"
            alignmentBaseline="middle"
            transform={`rotate(${rotateAngle - 90}, ${textX}, ${textY})`}
            style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.5)' }}
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
        {/* Outer Decorative Ring */}
        <div
          className="absolute rounded-full shadow-2xl"
          style={{
            inset: 'clamp(8px, 2vw, 16px)',
            background: 'linear-gradient(to bottom, #ca8a04, #facc15, #b45309)',
            border: '4px solid #713f12',
          }}
        >
          {/* Lights on the rim */}
          {Array.from({ length: 24 }).map((_, i) => {
            const angle = (i * 360) / 24;
            const isEven = i % 2 === 0;
            const size = clamp(12, 3, 16);
            const radiusOffset = clamp(130, 48, 270);

            return (
              <div
                key={i}
                className={`absolute rounded-full shadow-lg transition-all duration-1000 ${
                  spinning ? (isEven ? 'animate-pulse' : 'animate-ping') : 'animate-pulse-fast'
                }`}
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `rotate(${angle}deg) translate(48%, -50%) translateX(${radiusOffset}px)`,
                  width: `${size}px`,
                  height: `${size}px`,
                  backgroundColor: isEven ? '#fffbeb' : '#fbbf24',
                  boxShadow: `0 0 ${size}px ${isEven ? '#fff' : '#fbbf24'}`,
                }}
              />
            );
          })}
        </div>

        {/* The Spinning Wheel Container */}
        <div
          className="absolute rounded-full overflow-hidden shadow-inner"
          style={{
            inset: 'clamp(32px, 8vw, 64px)',
            border: '6px solid #713f12',
            background: '#1a1a1a',
            transform: `rotate(${rotation - 90}deg)`,
            transitionDuration: spinning ? '5000ms' : '0s',
            transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
          }}
        >
          <svg viewBox="-50 -50 100 100" className="w-full h-full">
            {segments}
          </svg>
        </div>

        {/* Center Decorative Hub */}
        <div
          className="absolute rounded-full shadow-xl flex items-center justify-center z-10"
          style={{
            width: 'clamp(80px, 18vw, 128px)',
            height: 'clamp(80px, 18vw, 128px)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'linear-gradient(to bottom right, #fde047, #ca8a04)',
            border: '4px solid #713f12',
          }}
        >
          <div
            className="rounded-full border-2 shadow-inner flex items-center justify-center"
            style={{
              width: '75%',
              height: '75%',
              background: 'linear-gradient(to top left, #eab308, #fef08a)',
              borderColor: '#a16207',
            }}
          >
            <Star
              className="drop-shadow-md"
              style={{
                color: '#713f12',
                width: 'clamp(28px, 6vw, 44px)',
                height: 'clamp(28px, 6vw, 44px)',
              }}
              fill="currentColor"
            />
          </div>
        </div>

        {/* The Pointer (Top) */}
        <div
          className="z-20"
          style={{
            position: 'absolute',
            top: '-8px',
            left: '50%',
            transform: 'translateX(-50%)',
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))',
          }}
        >
          <div style={{ transform: 'scale(1.5)' }}>
            <ChevronDown fill="#fcd34d" stroke="#78350f" size={48} />
          </div>
        </div>
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
