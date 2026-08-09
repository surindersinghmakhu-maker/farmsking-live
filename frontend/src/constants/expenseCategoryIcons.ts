import { Ionicons } from '@expo/vector-icons';

export const EXPENSE_CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  // 5 Combined Essential Expense Categories
  seeds_fertilizer: 'leaf-outline',      // 🌾 Seeds, Fertilizers & Pesticides (खाद, बीज व दवाई)
  labour_machinery: 'people-outline',    // 🚜 Labor, Tractor & Machinery (मजदूरी, ट्रैक्टर व उपकरण)
  irrigation_power: 'water-outline',     // 💧 Irrigation, Diesel & Power (सिंचाई, डीजल व बिजली)
  transport_packing: 'bus-outline',      // 🚛 Transport, Mandi & Packing (परिवहन, मंडी व पैकिंग)
  other: 'ellipsis-horizontal-outline', // 🛠️ Other Farm Expenses (अन्य कृषि खर्च)

  // Fallbacks for legacy keys
  seed: 'leaf-outline',
  fertilizer: 'flask-outline',
  pesticide: 'bug-outline',
  labour: 'people-outline',
  diesel: 'car-outline',
  electricity: 'flash-outline',
  irrigation: 'water-outline',
  machinery: 'construct-outline',
  transport: 'bus-outline',
  packing: 'cube-outline',
};

export function getExpenseCategoryIcon(key: string): keyof typeof Ionicons.glyphMap {
  return EXPENSE_CATEGORY_ICONS[key] ?? 'pricetag-outline';
}
