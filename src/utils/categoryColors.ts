export interface CategoryTheme {
  name: string;
  badgeBg: string;
  badgeColor: string;
  borderColor: string;
  glowColor: string;
  dotColor: string;
  emoji: string;
}

export function getCategoryTheme(categoryName: string = ''): CategoryTheme {
  const norm = (categoryName || '').toLowerCase().trim();

  if (norm.includes('photo') || norm.includes('buku') || norm.includes('book') || norm.includes('card')) {
    return {
      name: 'Photobook',
      badgeBg: 'rgba(168, 85, 247, 0.18)',
      badgeColor: '#c084fc',
      borderColor: 'rgba(168, 85, 247, 0.5)',
      glowColor: 'rgba(168, 85, 247, 0.3)',
      dotColor: '#c084fc',
      emoji: '📸',
    };
  }

  if (norm.includes('keychain') || norm.includes('ganci') || norm.includes('gantungan') || norm.includes('charm')) {
    return {
      name: 'Keychain',
      badgeBg: 'rgba(236, 72, 153, 0.18)',
      badgeColor: '#f472b6',
      borderColor: 'rgba(236, 72, 153, 0.5)',
      glowColor: 'rgba(236, 72, 153, 0.3)',
      dotColor: '#f472b6',
      emoji: '🌸',
    };
  }

  if (norm.includes('poster') || norm.includes('art') || norm.includes('print') || norm.includes('cetak')) {
    return {
      name: 'Poster',
      badgeBg: 'rgba(245, 158, 11, 0.18)',
      badgeColor: '#fbbf24',
      borderColor: 'rgba(245, 158, 11, 0.5)',
      glowColor: 'rgba(245, 158, 11, 0.3)',
      dotColor: '#fbbf24',
      emoji: '🎨',
    };
  }

  if (norm.includes('sticker') || norm.includes('stiker')) {
    return {
      name: 'Sticker',
      badgeBg: 'rgba(16, 185, 129, 0.18)',
      badgeColor: '#34d399',
      borderColor: 'rgba(16, 185, 129, 0.5)',
      glowColor: 'rgba(16, 185, 129, 0.3)',
      dotColor: '#34d399',
      emoji: '✨',
    };
  }

  if (norm.includes('standee') || norm.includes('acrylic') || norm.includes('akrilik')) {
    return {
      name: 'Standee',
      badgeBg: 'rgba(6, 182, 212, 0.18)',
      badgeColor: '#22d3ee',
      borderColor: 'rgba(6, 182, 212, 0.5)',
      glowColor: 'rgba(6, 182, 212, 0.3)',
      dotColor: '#22d3ee',
      emoji: '💎',
    };
  }

  if (norm.includes('kaos') || norm.includes('baju') || norm.includes('apparel') || norm.includes('shirt')) {
    return {
      name: 'Apparel',
      badgeBg: 'rgba(99, 102, 241, 0.18)',
      badgeColor: '#818cf8',
      borderColor: 'rgba(99, 102, 241, 0.5)',
      glowColor: 'rgba(99, 102, 241, 0.3)',
      dotColor: '#818cf8',
      emoji: '👕',
    };
  }

  return {
    name: categoryName || 'Merch',
    badgeBg: 'rgba(148, 163, 184, 0.16)',
    badgeColor: '#cbd5e1',
    borderColor: 'rgba(148, 163, 184, 0.4)',
    glowColor: 'rgba(148, 163, 184, 0.2)',
    dotColor: '#94a3b8',
    emoji: '🏷️',
  };
}
