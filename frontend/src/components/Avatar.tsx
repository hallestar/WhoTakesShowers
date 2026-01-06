import { useMemo } from 'react';
import { getPhotoUrl } from '../api';

interface AvatarProps {
  photoUrl?: string;
  size?: number;
  className?: string;
}

const EMOJIS = ['😀', '😎', '🥳', '😊', '🤩', '😄'];
const COLORS = ['var(--soft-lilac)', 'var(--minty-fresh)', 'var(--peachy)', 'var(--electric-blue)', 'var(--neon-pink)'];

export default function Avatar({ photoUrl, size = 100, className = '' }: AvatarProps) {
  const settings = useMemo(() => {
    const randomAvatar = localStorage.getItem('randomAvatar') === 'true';
    const defaultColor = localStorage.getItem('defaultColor') || 'var(--soft-lilac)';
    const defaultEmoji = localStorage.getItem('defaultEmoji') || '😀';
    return { randomAvatar, defaultColor, defaultEmoji };
  }, []);

  const avatarConfig = useMemo(() => {
    if (photoUrl && photoUrl.trim() !== '') {
      return { type: 'photo', url: getPhotoUrl(photoUrl) };
    }

    if (settings.randomAvatar) {
      const randomEmoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
      const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
      return { type: 'default', emoji: randomEmoji, color: randomColor };
    }

    return { type: 'default', emoji: settings.defaultEmoji, color: settings.defaultColor };
  }, [photoUrl, settings]);

  if (avatarConfig.type === 'photo') {
    return (
      <img
        src={avatarConfig.url}
        alt="avatar"
        className={className}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          objectFit: 'cover',
          border: '4px solid var(--electric-blue)',
          boxShadow: '3px 3px 0 var(--deep-purple)',
        }}
      />
    );
  }

  return (
    <div
      className={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        background: avatarConfig.color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: `${size * 0.48}px`,
        border: '4px solid var(--electric-blue)',
        boxShadow: '3px 3px 0 var(--deep-purple)',
      }}
    >
      {avatarConfig.emoji}
    </div>
  );
}
