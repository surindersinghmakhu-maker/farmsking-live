/**
 * FarmsKing Category Attribute Schema Engine
 * Hybrid Architecture: Provides smart default attribute profiles per category
 * with support for Admin overrides and custom category creation.
 */

export interface CategoryFieldConfig {
  id: string;
  name: string;
  slug: string;
  type: 'FARM' | 'FOOD' | 'GENERAL';
  icon: string;
  badge: string;
  description: string;
  // Field toggles
  isLiquidOptionAllowed: boolean;
  isFertilizer: boolean;
  isPesticideOrProtection: boolean;
  isSeed: boolean;
  isLivePlantOrNursery: boolean;
  isFoodProduct: boolean;
  // Regulatory enforcement
  requiresAgriLicense: boolean;
  requiresFssaiLicense: boolean;
  isCustom?: boolean;
}

export const DEFAULT_CATEGORY_CONFIGS: CategoryFieldConfig[] = [
  // 1. FERTILIZERS
  {
    id: 'cat-fertilizers',
    name: 'Fertilizers',
    slug: 'fertilizers',
    type: 'FARM',
    icon: 'flask-outline',
    badge: 'NPK & Plant Nutrition',
    description: 'Chemical, water-soluble, micronutrient and soil-fertility inputs',
    isLiquidOptionAllowed: true,
    isFertilizer: true,
    isPesticideOrProtection: false,
    isSeed: false,
    isLivePlantOrNursery: false,
    isFoodProduct: false,
    requiresAgriLicense: true,
    requiresFssaiLicense: false,
  },
  // 2. BIO & ORGANICS
  {
    id: 'cat-bio-organics',
    name: 'Bio & Organics',
    slug: 'bio-fertilizers',
    type: 'FARM',
    icon: 'leaf-outline',
    badge: '100% Eco-Friendly',
    description: 'Bio-stimulants, mycorrhiza, organic vermicompost, seaweeds & bacterial cultures',
    isLiquidOptionAllowed: true,
    isFertilizer: true,
    isPesticideOrProtection: false,
    isSeed: false,
    isLivePlantOrNursery: false,
    isFoodProduct: false,
    requiresAgriLicense: false,
    requiresFssaiLicense: false,
  },
  // 3. CROP PROTECTION (Pesticides, Fungicides, Weedicides)
  {
    id: 'cat-crop-protection',
    name: 'Crop Protection',
    slug: 'pesticides',
    type: 'FARM',
    icon: 'shield-checkmark-outline',
    badge: 'CIBRC Regulated',
    description: 'Insecticides, fungicides, herbicides, acaricides & pest control solutions',
    isLiquidOptionAllowed: true,
    isFertilizer: false,
    isPesticideOrProtection: true,
    isSeed: false,
    isLivePlantOrNursery: false,
    isFoodProduct: false,
    requiresAgriLicense: true,
    requiresFssaiLicense: false,
  },
  // 4. SEEDS
  {
    id: 'cat-seeds',
    name: 'Seeds',
    slug: 'seeds',
    type: 'FARM',
    icon: 'radio-button-on-outline',
    badge: 'Certified & Hybrid',
    description: 'Field crops, certified grain seeds, hybrid vegetables, pulses & oilseeds',
    isLiquidOptionAllowed: false,
    isFertilizer: false,
    isPesticideOrProtection: false,
    isSeed: true,
    isLivePlantOrNursery: false,
    isFoodProduct: false,
    requiresAgriLicense: true,
    requiresFssaiLicense: false,
  },
  // 5. LIVE PLANTS & NURSERY
  {
    id: 'cat-plants-nursery',
    name: 'Live Plants & Nursery',
    slug: 'plants-nursery',
    type: 'FARM',
    icon: 'flower-outline',
    badge: 'Live Horticulture',
    description: 'Fruit saplings, grafted orchard trees, agro-forestry plants & live plugs',
    isLiquidOptionAllowed: false,
    isFertilizer: false,
    isPesticideOrProtection: false,
    isSeed: false,
    isLivePlantOrNursery: true,
    isFoodProduct: false,
    requiresAgriLicense: false,
    requiresFssaiLicense: false,
  },
  // 6. FARM MACHINERY & TOOLS
  {
    id: 'cat-machinery-tools',
    name: 'Machinery & Tools',
    slug: 'tools-machinery',
    type: 'FARM',
    icon: 'construct-outline',
    badge: 'Farm Equipment',
    description: 'Battery sprayers, pruning secateurs, mulching film, tarpaulins & micro-tools',
    isLiquidOptionAllowed: false,
    isFertilizer: false,
    isPesticideOrProtection: false,
    isSeed: false,
    isLivePlantOrNursery: false,
    isFoodProduct: false,
    requiresAgriLicense: false,
    requiresFssaiLicense: false,
  },
  // 7. FOOD CATEGORIES
  {
    id: 'cat-farmer-made-foods',
    name: 'Farmer Made Foods',
    slug: 'farmer-made-foods',
    type: 'FOOD',
    icon: 'restaurant-outline',
    badge: 'Farmer Direct Produce',
    description: 'Authentic handmade jaggery, pure mustard oils, flours, pickles & deshi sweets',
    isLiquidOptionAllowed: false,
    isFertilizer: false,
    isPesticideOrProtection: false,
    isSeed: false,
    isLivePlantOrNursery: false,
    isFoodProduct: true,
    requiresAgriLicense: false,
    requiresFssaiLicense: true,
  },
  {
    id: 'cat-natural-farmer-foods',
    name: 'Natural Farmer Foods',
    slug: 'natural-farmer-foods',
    type: 'FOOD',
    icon: 'nutrition-outline',
    badge: '100% Pure Chemical Free',
    description: 'Natural pulses, pesticide-free rice, farm honey and cold-pressed edibles',
    isLiquidOptionAllowed: false,
    isFertilizer: false,
    isPesticideOrProtection: false,
    isSeed: false,
    isLivePlantOrNursery: false,
    isFoodProduct: true,
    requiresAgriLicense: false,
    requiresFssaiLicense: true,
  },
  {
    id: 'cat-organic-staples',
    name: 'Organic Staples & Grocery',
    slug: 'organic-staples',
    type: 'FOOD',
    icon: 'basket-outline',
    badge: 'Jaivik Bharat / Organic',
    description: 'Certified organic grains, spices, millets, cold-pressed ghee and staples',
    isLiquidOptionAllowed: false,
    isFertilizer: false,
    isPesticideOrProtection: false,
    isSeed: false,
    isLivePlantOrNursery: false,
    isFoodProduct: true,
    requiresAgriLicense: false,
    requiresFssaiLicense: true,
  },
  {
    id: 'cat-fresh-produce',
    name: 'Fresh Fruits & Vegetables',
    slug: 'fresh-fruits-vegetables',
    type: 'FOOD',
    icon: 'leaf-outline',
    badge: 'Daily Farm Fresh',
    description: 'Direct orchard harvests, fresh farm vegetables and seasonal harvests',
    isLiquidOptionAllowed: false,
    isFertilizer: false,
    isPesticideOrProtection: false,
    isSeed: false,
    isLivePlantOrNursery: false,
    isFoodProduct: true,
    requiresAgriLicense: false,
    requiresFssaiLicense: false,
  },
  {
    id: 'cat-dairy-edibles',
    name: 'Dairy & Edibles',
    slug: 'dairy-edibles',
    type: 'FOOD',
    icon: 'water-outline',
    badge: 'Desi A2 & Dairy Direct',
    description: 'Desi Cow A2 Bilona Ghee, curd, paneer, and traditional dairy delicacies',
    isLiquidOptionAllowed: false,
    isFertilizer: false,
    isPesticideOrProtection: false,
    isSeed: false,
    isLivePlantOrNursery: false,
    isFoodProduct: true,
    requiresAgriLicense: false,
    requiresFssaiLicense: true,
  },
  {
    id: 'cat-handmade-delicacies',
    name: 'Handmade Delicacies',
    slug: 'handmade-delicacies',
    type: 'FOOD',
    icon: 'heart-outline',
    badge: 'Gramin SHG Special',
    description: 'Village-crafted vadis, papads, sun-dried spices and home-made treats',
    isLiquidOptionAllowed: false,
    isFertilizer: false,
    isPesticideOrProtection: false,
    isSeed: false,
    isLivePlantOrNursery: false,
    isFoodProduct: true,
    requiresAgriLicense: false,
    requiresFssaiLicense: true,
  },
];

const LOCAL_STORAGE_KEY = 'farmsking_custom_category_configs_v1';

/**
 * Get all available categories (merging defaults with admin customized categories).
 */
export const getAllCategoryConfigs = (): CategoryFieldConfig[] => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const customList: CategoryFieldConfig[] = JSON.parse(stored);
        if (Array.isArray(customList) && customList.length > 0) {
          // Merge custom with default (custom overrides matching names/slugs)
          const merged = [...DEFAULT_CATEGORY_CONFIGS];
          customList.forEach((custom) => {
            const idx = merged.findIndex((c) => c.name.toLowerCase() === custom.name.toLowerCase() || c.slug === custom.slug);
            if (idx >= 0) {
              merged[idx] = { ...merged[idx], ...custom };
            } else {
              merged.push(custom);
            }
          });
          return merged;
        }
      }
    } catch (e) {
      // Fallback to defaults
    }
  }
  return DEFAULT_CATEGORY_CONFIGS;
};

/**
 * Save updated category configuration list (used by Admin Category Attribute Manager).
 */
export const saveAllCategoryConfigs = (configs: CategoryFieldConfig[]): void => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(configs));
    } catch (e) {
      console.error('Failed to save category configs to localStorage:', e);
    }
  }
};

/**
 * Retrieve field configuration for a specific category name or slug.
 */
export const getCategoryFieldConfig = (categoryNameOrSlug: string, productTypeHint?: 'FARM' | 'FOOD'): CategoryFieldConfig => {
  const all = getAllCategoryConfigs();
  const search = (categoryNameOrSlug || '').trim().toLowerCase();

  const found = all.find(
    (c) =>
      c.name.toLowerCase() === search ||
      c.slug.toLowerCase() === search ||
      search.includes(c.name.toLowerCase()) ||
      c.name.toLowerCase().includes(search)
  );

  if (found) return found;

  // Smart heuristic fallback based on name tokens
  const isSeed = search.includes('seed') || search.includes('beej');
  const isPesticide = search.includes('pesticide') || search.includes('protection') || search.includes('keetnashak');
  const isNursery = search.includes('plant') || search.includes('nursery') || search.includes('sapling');
  const isFood = productTypeHint === 'FOOD' || search.includes('food') || search.includes('staple') || search.includes('organic') || search.includes('grocery');
  const isFertilizer = !isSeed && !isPesticide && !isNursery && !isFood;

  return {
    id: `custom-${Date.now()}`,
    name: categoryNameOrSlug || 'Custom Category',
    slug: (categoryNameOrSlug || 'custom').toLowerCase().replace(/\s+/g, '-'),
    type: isFood ? 'FOOD' : 'FARM',
    icon: isSeed ? 'radio-button-on-outline' : isPesticide ? 'shield-checkmark-outline' : isFertilizer ? 'flask-outline' : 'leaf-outline',
    badge: isFood ? 'Packaged Food' : 'Agri Inputs',
    description: 'Custom category specification profile',
    isLiquidOptionAllowed: isFertilizer || isPesticide,
    isFertilizer,
    isPesticideOrProtection: isPesticide,
    isSeed,
    isLivePlantOrNursery: isNursery,
    isFoodProduct: isFood,
    requiresAgriLicense: isSeed || isPesticide || isFertilizer,
    requiresFssaiLicense: isFood,
  };
};
