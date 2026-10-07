export type AvatarCategory = 'MALE' | 'FEMALE' | 'FARMER' | 'GARDENER' | 'BUSINESS';

export interface AvatarPreset {
  url: string;
  category: AvatarCategory;
  label: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', category: 'FARMER', label: 'Farmer' },
  { url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', category: 'GARDENER', label: 'Gardener' },
  { url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', category: 'BUSINESS', label: 'Business' },
  { url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', category: 'MALE', label: 'Male' },
  { url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', category: 'FEMALE', label: 'Female' },
];

export const AVATAR_PRESET_URLS = AVATAR_PRESETS.map((p) => p.url);
