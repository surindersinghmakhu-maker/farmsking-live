import { CropCategory } from '../types/api';

export const CROP_CATEGORIES: { value: CropCategory; label: string; icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap; example: string }[] = [
  { value: 'FLOWERS', label: 'Flowers', icon: 'flower', example: 'e.g. Marigold, Rose' },
  { value: 'VEGETABLES', label: 'Vegetables', icon: 'nutrition', example: 'e.g. Tomato, Chilli' },
  { value: 'FRUITS', label: 'Fruits', icon: 'leaf', example: 'e.g. Mango, Banana' },
  { value: 'GRAINS', label: 'Grains', icon: 'nutrition-outline', example: 'e.g. Wheat, Rice' },
  { value: 'PULSES', label: 'Pulses', icon: 'ellipse-outline', example: 'e.g. Moong, Chana' },
  { value: 'SPICES', label: 'Spices', icon: 'flame-outline', example: 'e.g. Turmeric, Ginger' },
  { value: 'CASH_CROP', label: 'Cash Crop', icon: 'cash-outline', example: 'e.g. Cotton, Sugarcane' },
  { value: 'OTHER', label: 'Other', icon: 'apps-outline', example: 'Crop name' },
];
