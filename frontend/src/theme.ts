import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const COLORS = {
  light: {
    background: { primary: '#F9F7F2', secondary: '#FFFFFF', tertiary: '#F0EBE3' },
    text: { primary: '#2D3436', secondary: '#636E72', tertiary: '#B2BEC3', inverse: '#FFFFFF' },
    brand: { primary: '#2D6A4F', secondary: '#40916C', tertiary: '#D8F3DC' },
    status: { success: '#95D5B2', warning: '#F4A261', info: '#A8DADC', error: '#E76F51' },
    border: 'rgba(0,0,0,0.06)',
  },
  dark: {
    background: { primary: '#1A1C1E', secondary: '#262A2D', tertiary: '#323639' },
    text: { primary: '#E8E8E8', secondary: '#A0A0A0', tertiary: '#606060', inverse: '#1A1C1E' },
    brand: { primary: '#40916C', secondary: '#52B788', tertiary: '#1B4332' },
    status: { success: '#52B788', warning: '#E9C46A', info: '#457B9D', error: '#E76F51' },
    border: 'rgba(255,255,255,0.08)',
  },
};

export const SPACING = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };

export const RADIUS = { sm: 8, md: 16, lg: 24, xl: 32, pill: 999 };

export const SHADOWS = {
  soft: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  floating: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 24, elevation: 8 },
};

export const SCREEN = { width, height };

export const TAGS = ['Family', 'Friend', 'Mentor', 'Partner', 'Colleague', 'Other'];

export const TAG_COLORS: Record<string, string> = {
  Family: '#E76F51',
  Friend: '#40916C',
  Mentor: '#457B9D',
  Partner: '#E9C46A',
  Colleague: '#A8DADC',
  Other: '#B2BEC3',
};

export const FREQUENCY_PRESETS = [
  { label: 'Daily', days: 1 },
  { label: 'Every 3 days', days: 3 },
  { label: 'Weekly', days: 7 },
  { label: 'Bi-weekly', days: 14 },
  { label: 'Monthly', days: 30 },
  { label: 'Quarterly', days: 90 },
];

export function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export function getHealthColor(health: number, isDark: boolean = false): string {
  if (health >= 70) return isDark ? '#52B788' : '#95D5B2';
  if (health >= 40) return isDark ? '#E9C46A' : '#F4A261';
  return '#E76F51';
}

export function getTimeSince(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}
