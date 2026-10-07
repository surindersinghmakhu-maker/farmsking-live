import { Ionicons } from '@expo/vector-icons';

export const EXPENSE_CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  // Individual Farming Work & Agricultural Expense Categories
  cultivation: 'build-outline',           // 🚜 Cultivation & Tillage
  sowing_seeds: 'leaf-outline',          // 🌾 Seeds & Sowing
  fertilizer: 'flask-outline',           // 🧪 Fertilizers & FYM
  crop_care: 'medkit-outline',            // 🌿 Crop Care & Protection
  irrigation_power: 'water-outline',     // 💧 Irrigation, Diesel & Electricity
  spray_pesticide: 'shield-checkmark-outline', // 💨 Spray & Pesticides
  labour: 'people-outline',              // 👨‍🌾 Labour & Daily Wage
  machinery_equipment: 'construct-outline', // 🚜 Machinery & Tractor Rent
  harvesting: 'cut-outline',             // 🌾 Harvesting & Threshing
  transport: 'bus-outline',              // 🚛 Transport & Freight
  mandi_packing: 'cube-outline',         // 📦 Packing & Mandi Fee
  other: 'ellipsis-horizontal-outline', // 🧾 Other Farm Expenses

  // Fallbacks & legacy keys
  seeds_fertilizer: 'leaf-outline',
  labour_machinery: 'people-outline',
  transport_packing: 'bus-outline',
  seed: 'leaf-outline',
  pesticide: 'shield-checkmark-outline',
  diesel: 'car-outline',
  electricity: 'flash-outline',
  irrigation: 'water-outline',
  machinery: 'construct-outline',
  packing: 'cube-outline',
};

export function getExpenseCategoryIcon(key: string): keyof typeof Ionicons.glyphMap {
  return EXPENSE_CATEGORY_ICONS[key] ?? 'pricetag-outline';
}
