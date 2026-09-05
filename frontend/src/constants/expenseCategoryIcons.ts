import { Ionicons } from '@expo/vector-icons';

export const EXPENSE_CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  // Individual Farming Work & Agricultural Expense Categories
  cultivation: 'build-outline',           // 🚜 Cultivation & Tillage (ਵਾਹੀ / ਜੁਤਾਈ)
  sowing_seeds: 'leaf-outline',          // 🌾 Seeds & Sowing (ਬੀਜ / ਬਿਜਾਈ)
  fertilizer: 'flask-outline',           // 🧪 Fertilizers & FYM (ਖਾਦ / ਰੂੜੀ)
  crop_care: 'medkit-outline',            // 🌿 Crop Care & Protection (ਫਸਲ ਦੀ ਦੇਖਭਾਲ)
  irrigation_power: 'water-outline',     // 💧 Irrigation, Diesel & Electricity (ਸਿੰਚਾਈ / ਡੀਜ਼ਲ)
  spray_pesticide: 'shield-checkmark-outline', // 💨 Spray & Pesticides (ਕੀਟਨਾਸ਼ਕ ਸਪ੍ਰੇ)
  labour: 'people-outline',              // 👨‍🌾 Labour & Dihadi (ਮਜ਼ਦੂਰੀ / ਦਿਹਾੜੀ)
  machinery_equipment: 'construct-outline', // 🚜 Machinery & Tractor Rent (ਟਰੈਕਟਰ / ਮਸ਼ੀਨਰੀ)
  harvesting: 'cut-outline',             // 🌾 Harvesting & Threshing (ਵਾਢੀ / ਗਹਾਈ)
  transport: 'bus-outline',              // 🚛 Transport & Freight (ਟ੍ਰਾਂਸਪੋਰਟ / ਭਾੜਾ)
  mandi_packing: 'cube-outline',         // 📦 Packing & Mandi Fee (ਮੰਡੀ / ਪੈਕਿੰਗ)
  other: 'ellipsis-horizontal-outline', // 🧾 Other Farm Expenses (ਹੋਰ ਖਰਚੇ)

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

