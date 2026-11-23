export type CropUnit = 'KG' | 'Quintal' | 'Pieces' | 'Bunch' | 'Dozen' | 'Box / Crate' | 'Set';

export interface CropUnitInfo {
  unit: CropUnit;
  label: string;
  hindiLabel: string;
  icon: string;
}

export const CROP_UNITS: CropUnitInfo[] = [
  { unit: 'KG', label: 'KG (Kilogram)', hindiLabel: 'KG (Kilogram)', icon: 'scale' },
  { unit: 'Quintal', label: 'Quintal (100 KG)', hindiLabel: 'Quintal (100 KG)', icon: 'cube' },
  { unit: 'Pieces', label: 'Pieces (Pcs)', hindiLabel: 'Pieces (Pcs)', icon: 'apps' },
  { unit: 'Bunch', label: 'Bunch', hindiLabel: 'Bunch', icon: 'flower' },
  { unit: 'Dozen', label: 'Dozen (12 Pcs)', hindiLabel: 'Dozen (12 Pcs)', icon: 'grid' },
  { unit: 'Box / Crate', label: 'Box / Crate', hindiLabel: 'Box / Crate', icon: 'archive' },
  { unit: 'Set', label: 'Set (Kit / Pack)', hindiLabel: 'Set (Kit / Pack)', icon: 'briefcase' },
];

export type LandAreaUnit = 'Killa (Acre)' | 'Kanal' | 'Marla' | 'Bigha' | 'Biswa' | 'Hectare' | 'Sq Ft / Gaj';

export interface LandAreaUnitInfo {
  unit: LandAreaUnit;
  label: string;
  hindiLabel: string;
}

export const LAND_AREA_UNITS: LandAreaUnitInfo[] = [
  { unit: 'Killa (Acre)', label: 'Killa / Acre', hindiLabel: 'Killa / Acre' },
  { unit: 'Kanal', label: 'Kanal', hindiLabel: 'Kanal' },
  { unit: 'Marla', label: 'Marla', hindiLabel: 'Marla' },
  { unit: 'Bigha', label: 'Bigha', hindiLabel: 'Bigha' },
  { unit: 'Biswa', label: 'Biswa', hindiLabel: 'Biswa' },
  { unit: 'Hectare', label: 'Hectare', hindiLabel: 'Hectare' },
  { unit: 'Sq Ft / Gaj', label: 'Sq Ft / Gaj', hindiLabel: 'Sq Ft / Gaj' },
];

export type HarvestType = 'CONTINUOUS' | 'ONE_TIME';

export type IrrigationType =
  | 'Tube Well / Borewell'
  | 'Canal'
  | 'Drip Irrigation'
  | 'Sprinkler System'
  | 'Open Well'
  | 'Rainfed'
  | 'Pond / River';

export interface IrrigationTypeInfo {
  type: IrrigationType;
  label: string;
  hindiLabel: string;
  icon: string;
}

export const IRRIGATION_TYPES: IrrigationTypeInfo[] = [
  { type: 'Tube Well / Borewell', label: 'Tube Well / Borewell', hindiLabel: 'Tube Well / Submersible', icon: 'water-outline' },
  { type: 'Canal', label: 'Canal', hindiLabel: 'Canal', icon: 'boat-outline' },
  { type: 'Drip Irrigation', label: 'Drip Irrigation', hindiLabel: 'Drip Irrigation', icon: 'color-fill-outline' },
  { type: 'Sprinkler System', label: 'Sprinkler System', hindiLabel: 'Sprinkler System', icon: 'sparkles-outline' },
  { type: 'Open Well', label: 'Open Well', hindiLabel: 'Open Well', icon: 'disc-outline' },
  { type: 'Rainfed', label: 'Rainfed / Monsoon', hindiLabel: 'Rainfed / Monsoon', icon: 'cloud-rain-outline' },
  { type: 'Pond / River', label: 'Pond / River', hindiLabel: 'Pond / River', icon: 'fish-outline' },
];

export interface CropCategory {
  id: string;
  name: string;
  hindiName: string;
  icon: string;
  color: string;
  bg: string;
  examples?: string;
}

export interface CropItem {
  id: string;
  categoryId: string;
  name: string;
  hindiName: string;
  variety?: string;
  duration?: string;
  season?: string;
  defaultUnit?: CropUnit;
  defaultPrice?: number;
  harvestType?: HarvestType;
}

export const INITIAL_CROP_CATEGORIES: CropCategory[] = [
  { id: 'flowers', name: 'Flowers & Floriculture', hindiName: 'Flowers & Floriculture', icon: 'flower', color: '#e11d48', bg: '#ffe4e6', examples: 'Rose, Marigold, Jasmine, Gladiolus, Gerbera' },
  { id: 'vegetables', name: 'Vegetables', hindiName: 'Vegetables', icon: 'basket', color: '#047857', bg: '#ecfdf5', examples: 'Tomato, Potato, Onion, Peas, Cauliflower, Chilli' },
  { id: 'fruits', name: 'Fruits & Orchards', hindiName: 'Fruits & Orchards', icon: 'restaurant', color: '#c2410c', bg: '#fff7ed', examples: 'Mango, Kinnow, Apple, Banana, Guava, Papaya' },
  { id: 'medicinal', name: 'Medicinal & Aromatic Crops', hindiName: 'Medicinal & Aromatic Crops', icon: 'medkit', color: '#0d9488', bg: '#ccfbf1', examples: 'Ashwagandha, Aloe Vera, Mentha, Tulsi, Isabgol' },
  { id: 'spices', name: 'Spices & Condiments', hindiName: 'Spices & Condiments', icon: 'flame', color: '#ea580c', bg: '#ffedd5', examples: 'Turmeric, Ginger, Chilli, Cumin, Coriander' },
  { id: 'cereals', name: 'Cereals & Grains', hindiName: 'Cereals & Grains', icon: 'leaf', color: '#15803d', bg: '#f0fdf4', examples: 'Wheat, Paddy / Rice, Basmati, Maize, Bajra' },
  { id: 'pulses', name: 'Pulses & Legumes', hindiName: 'Pulses & Legumes', icon: 'nutrition', color: '#b45309', bg: '#fffbeb', examples: 'Chickpea, Moong, Urad, Arhar, Masoor' },
  { id: 'oilseeds', name: 'Oilseeds', hindiName: 'Oilseeds', icon: 'water', color: '#a16207', bg: '#fefce8', examples: 'Mustard, Soybean, Groundnut, Sunflower' },
  { id: 'commercial', name: 'Commercial & Cash Crops', hindiName: 'Commercial & Cash Crops', icon: 'cash', color: '#7c3aed', bg: '#f5f3ff', examples: 'Cotton, Sugarcane, Guar, Jute' },
  { id: 'fodder', name: 'Fodder & Forage Crops', hindiName: 'Fodder & Forage Crops', icon: 'cut', color: '#4d7c0f', bg: '#ecfccb', examples: 'Berseem, Lucerne, Napier Grass, Chari, Maize' },
  { id: 'plantation', name: 'Plantation Crops', hindiName: 'Plantation Crops', icon: 'tree', color: '#15803d', bg: '#dcfce7', examples: 'Tea, Coffee, Coconut, Rubber, Cashew' },
  { id: 'other', name: 'Other Crops', hindiName: 'Other Crops', icon: 'add-circle-outline', color: '#64748b', bg: '#f1f5f9' },
];

export const INITIAL_CROPS_LIST: CropItem[] = [
  // ── 1. Flowers & Floriculture (Continuous / Daily Harvest) ──────────────────
  { id: 'fl1', categoryId: 'flowers', name: 'Rose', hindiName: 'Rose', duration: 'Perennial', season: 'All Seasons', defaultUnit: 'Bunch', defaultPrice: 40, harvestType: 'CONTINUOUS' },
  { id: 'fl2', categoryId: 'flowers', name: 'Marigold', hindiName: 'Marigold', duration: '90-100 Days', season: 'All Seasons', defaultUnit: 'KG', defaultPrice: 60, harvestType: 'CONTINUOUS' },
  { id: 'fl3', categoryId: 'flowers', name: 'Jasmine / Mogra', hindiName: 'Jasmine', duration: 'Perennial', season: 'Summer', defaultUnit: 'KG', defaultPrice: 180, harvestType: 'CONTINUOUS' },
  { id: 'fl4', categoryId: 'flowers', name: 'Gladiolus', hindiName: 'Gladiolus', duration: '90 Days', season: 'Winter', defaultUnit: 'Pieces', defaultPrice: 15, harvestType: 'CONTINUOUS' },
  { id: 'fl5', categoryId: 'flowers', name: 'Tuberose / Rajnigandha', hindiName: 'Tuberose', duration: 'Perennial', season: 'Kharif', defaultUnit: 'Bunch', defaultPrice: 50, harvestType: 'CONTINUOUS' },
  { id: 'fl6', categoryId: 'flowers', name: 'Chrysanthemum / Guldaudi', hindiName: 'Chrysanthemum', duration: '100-120 Days', season: 'Winter', defaultUnit: 'Bunch', defaultPrice: 45, harvestType: 'CONTINUOUS' },
  { id: 'fl7', categoryId: 'flowers', name: 'Carnation', hindiName: 'Carnation', duration: 'Perennial', season: 'All Seasons', defaultUnit: 'Pieces', defaultPrice: 12, harvestType: 'CONTINUOUS' },
  { id: 'fl8', categoryId: 'flowers', name: 'Gerbera', hindiName: 'Gerbera', duration: 'Perennial', season: 'All Seasons', defaultUnit: 'Pieces', defaultPrice: 10, harvestType: 'CONTINUOUS' },
  { id: 'fl9', categoryId: 'flowers', name: 'Lotus / Kamal', hindiName: 'Lotus', duration: 'Perennial', season: 'Summer', defaultUnit: 'Pieces', defaultPrice: 15, harvestType: 'CONTINUOUS' },
  { id: 'fl10', categoryId: 'flowers', name: 'Lily / Asiatic Lily', hindiName: 'Lily', duration: '90-100 Days', season: 'Winter', defaultUnit: 'Pieces', defaultPrice: 25, harvestType: 'CONTINUOUS' },
  { id: 'fl11', categoryId: 'flowers', name: 'Orchid', hindiName: 'Orchid', duration: 'Perennial', season: 'All Seasons', defaultUnit: 'Pieces', defaultPrice: 35, harvestType: 'CONTINUOUS' },
  { id: 'fl12', categoryId: 'flowers', name: 'Tulip', hindiName: 'Tulip', duration: '75-90 Days', season: 'Winter', defaultUnit: 'Pieces', defaultPrice: 30, harvestType: 'CONTINUOUS' },
  { id: 'fl13', categoryId: 'flowers', name: 'Dahlia', hindiName: 'Dahlia', duration: '90-110 Days', season: 'Winter', defaultUnit: 'Bunch', defaultPrice: 35, harvestType: 'CONTINUOUS' },
  { id: 'fl14', categoryId: 'flowers', name: 'Sunflower (Floriculture)', hindiName: 'Sunflower', duration: '70-85 Days', season: 'Summer / Spring', defaultUnit: 'Pieces', defaultPrice: 15, harvestType: 'CONTINUOUS' },

  // ── 2. Vegetables ─────────────────────────────────────────────────────────
  { id: 'v1', categoryId: 'vegetables', name: 'Tomato', hindiName: 'Tomato', duration: '120 Days', season: 'All Seasons', defaultUnit: 'KG', defaultPrice: 30, harvestType: 'CONTINUOUS' },
  { id: 'v2', categoryId: 'vegetables', name: 'Potato', hindiName: 'Potato', duration: '90-100 Days', season: 'Rabi', defaultUnit: 'Quintal', defaultPrice: 1800, harvestType: 'ONE_TIME' },
  { id: 'v3', categoryId: 'vegetables', name: 'Onion', hindiName: 'Onion', duration: '130-150 Days', season: 'Rabi / Kharif', defaultUnit: 'KG', defaultPrice: 35, harvestType: 'ONE_TIME' },
  { id: 'v4', categoryId: 'vegetables', name: 'Cauliflower', hindiName: 'Cauliflower', duration: '85-90 Days', season: 'Rabi', defaultUnit: 'Pieces', defaultPrice: 25, harvestType: 'ONE_TIME' },
  { id: 'v5', categoryId: 'vegetables', name: 'Coriander Leaves', hindiName: 'Coriander Leaves', duration: '40 Days', season: 'All Seasons', defaultUnit: 'Bunch', defaultPrice: 15, harvestType: 'CONTINUOUS' },
  { id: 'v6', categoryId: 'vegetables', name: 'Green Peas', hindiName: 'Green Peas', duration: '60-80 Days', season: 'Rabi', defaultUnit: 'KG', defaultPrice: 40, harvestType: 'CONTINUOUS' },
  { id: 'v7', categoryId: 'vegetables', name: 'Cabbage', hindiName: 'Cabbage', duration: '75-90 Days', season: 'Rabi / Winter', defaultUnit: 'Pieces', defaultPrice: 20, harvestType: 'ONE_TIME' },
  { id: 'v8', categoryId: 'vegetables', name: 'Carrot', hindiName: 'Carrot', duration: '80-100 Days', season: 'Rabi', defaultUnit: 'Quintal', defaultPrice: 1500, harvestType: 'ONE_TIME' },
  { id: 'v9', categoryId: 'vegetables', name: 'Radish', hindiName: 'Radish', duration: '40-50 Days', season: 'All Seasons', defaultUnit: 'Quintal', defaultPrice: 1000, harvestType: 'ONE_TIME' },
  { id: 'v10', categoryId: 'vegetables', name: 'Garlic', hindiName: 'Garlic', duration: '130-150 Days', season: 'Rabi', defaultUnit: 'Quintal', defaultPrice: 8500, harvestType: 'ONE_TIME' },
  { id: 'v11', categoryId: 'vegetables', name: 'Green Chilli', hindiName: 'Green Chilli', duration: '120-150 Days', season: 'All Seasons', defaultUnit: 'KG', defaultPrice: 45, harvestType: 'CONTINUOUS' },
  { id: 'v12', categoryId: 'vegetables', name: 'Capsicum / Shimla Mirch', hindiName: 'Capsicum', duration: '90-120 Days', season: 'All Seasons', defaultUnit: 'KG', defaultPrice: 50, harvestType: 'CONTINUOUS' },
  { id: 'v13', categoryId: 'vegetables', name: 'Brinjal / Eggplant', hindiName: 'Brinjal', duration: '110-140 Days', season: 'All Seasons', defaultUnit: 'KG', defaultPrice: 25, harvestType: 'CONTINUOUS' },
  { id: 'v14', categoryId: 'vegetables', name: 'Okra / Ladyfinger', hindiName: 'Okra', duration: '90-100 Days', season: 'Summer / Kharif', defaultUnit: 'KG', defaultPrice: 35, harvestType: 'CONTINUOUS' },
  { id: 'v15', categoryId: 'vegetables', name: 'Bottle Gourd / Lauki', hindiName: 'Bottle Gourd', duration: '70-90 Days', season: 'Summer / Kharif', defaultUnit: 'KG', defaultPrice: 20, harvestType: 'CONTINUOUS' },
  { id: 'v16', categoryId: 'vegetables', name: 'Bitter Gourd / Karela', hindiName: 'Bitter Gourd', duration: '80-100 Days', season: 'Summer / Kharif', defaultUnit: 'KG', defaultPrice: 40, harvestType: 'CONTINUOUS' },
  { id: 'v17', categoryId: 'vegetables', name: 'Ridge Gourd / Turai', hindiName: 'Ridge Gourd', duration: '70-85 Days', season: 'Summer / Kharif', defaultUnit: 'KG', defaultPrice: 30, harvestType: 'CONTINUOUS' },
  { id: 'v18', categoryId: 'vegetables', name: 'Cucumber / Kheera', hindiName: 'Cucumber', duration: '60-70 Days', season: 'Summer / Zaid', defaultUnit: 'KG', defaultPrice: 25, harvestType: 'CONTINUOUS' },
  { id: 'v19', categoryId: 'vegetables', name: 'Spinach / Palak', hindiName: 'Spinach', duration: '35-45 Days', season: 'All Seasons', defaultUnit: 'Bunch', defaultPrice: 15, harvestType: 'CONTINUOUS' },
  { id: 'v20', categoryId: 'vegetables', name: 'Fenugreek Leaves / Methi', hindiName: 'Fenugreek Leaves', duration: '40-50 Days', season: 'Winter', defaultUnit: 'Bunch', defaultPrice: 15, harvestType: 'CONTINUOUS' },
  { id: 'v21', categoryId: 'vegetables', name: 'Mustard Greens / Sarson', hindiName: 'Mustard Greens', duration: '45-60 Days', season: 'Winter', defaultUnit: 'Bunch', defaultPrice: 15, harvestType: 'CONTINUOUS' },
  { id: 'v22', categoryId: 'vegetables', name: 'Pumpkin / Kaddu', hindiName: 'Pumpkin', duration: '90-110 Days', season: 'Kharif / Summer', defaultUnit: 'KG', defaultPrice: 15, harvestType: 'ONE_TIME' },
  { id: 'v23', categoryId: 'vegetables', name: 'Round Gourd / Tinda', hindiName: 'Round Gourd', duration: '60-75 Days', season: 'Summer', defaultUnit: 'KG', defaultPrice: 30, harvestType: 'CONTINUOUS' },
  { id: 'v24', categoryId: 'vegetables', name: 'Beetroot / Chukandar', hindiName: 'Beetroot', duration: '60-75 Days', season: 'Winter', defaultUnit: 'KG', defaultPrice: 30, harvestType: 'ONE_TIME' },
  { id: 'v25', categoryId: 'vegetables', name: 'Sweet Potato / Shakarkandi', hindiName: 'Sweet Potato', duration: '110-130 Days', season: 'Kharif', defaultUnit: 'Quintal', defaultPrice: 2200, harvestType: 'ONE_TIME' },
  { id: 'v26', categoryId: 'vegetables', name: 'Colocasia / Arbi', hindiName: 'Colocasia', duration: '150-180 Days', season: 'Kharif', defaultUnit: 'Quintal', defaultPrice: 2800, harvestType: 'ONE_TIME' },
  { id: 'v27', categoryId: 'vegetables', name: 'Turnip / Shalgam', hindiName: 'Turnip', duration: '50-65 Days', season: 'Winter', defaultUnit: 'KG', defaultPrice: 18, harvestType: 'ONE_TIME' },

  // ── 3. Fruits & Orchards ──────────────────────────────────────────────────
  { id: 'f1', categoryId: 'fruits', name: 'Mango', hindiName: 'Mango', duration: 'Perennial', season: 'Summer', defaultUnit: 'Box / Crate', defaultPrice: 850, harvestType: 'ONE_TIME' },
  { id: 'f2', categoryId: 'fruits', name: 'Kinnow / Orange', hindiName: 'Kinnow', duration: 'Perennial', season: 'Winter', defaultUnit: 'KG', defaultPrice: 45, harvestType: 'ONE_TIME' },
  { id: 'f3', categoryId: 'fruits', name: 'Banana', hindiName: 'Banana', duration: '12 Months', season: 'All Seasons', defaultUnit: 'Dozen', defaultPrice: 50, harvestType: 'CONTINUOUS' },
  { id: 'f4', categoryId: 'fruits', name: 'Guava', hindiName: 'Guava', duration: 'Perennial', season: 'Winter / Summer', defaultUnit: 'KG', defaultPrice: 40, harvestType: 'CONTINUOUS' },
  { id: 'f5', categoryId: 'fruits', name: 'Strawberry', hindiName: 'Strawberry', duration: '6 Months', season: 'Winter', defaultUnit: 'Box / Crate', defaultPrice: 250, harvestType: 'CONTINUOUS' },
  { id: 'f6', categoryId: 'fruits', name: 'Apple', hindiName: 'Apple', duration: 'Perennial', season: 'Autumn', defaultUnit: 'Box / Crate', defaultPrice: 1200, harvestType: 'ONE_TIME' },
  { id: 'f7', categoryId: 'fruits', name: 'Pomegranate / Anar', hindiName: 'Pomegranate', duration: 'Perennial', season: 'All Seasons', defaultUnit: 'KG', defaultPrice: 80, harvestType: 'CONTINUOUS' },
  { id: 'f8', categoryId: 'fruits', name: 'Papaya', hindiName: 'Papaya', duration: '9-12 Months', season: 'All Seasons', defaultUnit: 'KG', defaultPrice: 25, harvestType: 'CONTINUOUS' },
  { id: 'f9', categoryId: 'fruits', name: 'Grapes', hindiName: 'Grapes', duration: 'Perennial', season: 'Spring / Summer', defaultUnit: 'KG', defaultPrice: 60, harvestType: 'ONE_TIME' },
  { id: 'f10', categoryId: 'fruits', name: 'Lemon / Lime', hindiName: 'Lemon', duration: 'Perennial', season: 'All Seasons', defaultUnit: 'KG', defaultPrice: 50, harvestType: 'CONTINUOUS' },
  { id: 'f11', categoryId: 'fruits', name: 'Sweet Orange / Mousambi', hindiName: 'Sweet Orange', duration: 'Perennial', season: 'Winter', defaultUnit: 'KG', defaultPrice: 40, harvestType: 'ONE_TIME' },
  { id: 'f12', categoryId: 'fruits', name: 'Watermelon', hindiName: 'Watermelon', duration: '85-100 Days', season: 'Summer / Zaid', defaultUnit: 'Quintal', defaultPrice: 1200, harvestType: 'ONE_TIME' },
  { id: 'f13', categoryId: 'fruits', name: 'Muskmelon', hindiName: 'Muskmelon', duration: '75-90 Days', season: 'Summer / Zaid', defaultUnit: 'Quintal', defaultPrice: 1500, harvestType: 'ONE_TIME' },
  { id: 'f14', categoryId: 'fruits', name: 'Ber / Jujube', hindiName: 'Ber', duration: 'Perennial', season: 'Winter', defaultUnit: 'KG', defaultPrice: 35, harvestType: 'CONTINUOUS' },
  { id: 'f15', categoryId: 'fruits', name: 'Pear / Nashpati', hindiName: 'Pear', duration: 'Perennial', season: 'Monsoon', defaultUnit: 'Box / Crate', defaultPrice: 700, harvestType: 'ONE_TIME' },
  { id: 'f16', categoryId: 'fruits', name: 'Peach / Aadu', hindiName: 'Peach', duration: 'Perennial', season: 'Summer', defaultUnit: 'Box / Crate', defaultPrice: 600, harvestType: 'ONE_TIME' },
  { id: 'f17', categoryId: 'fruits', name: 'Plum / Aloo Bukhara', hindiName: 'Plum', duration: 'Perennial', season: 'Summer', defaultUnit: 'Box / Crate', defaultPrice: 650, harvestType: 'ONE_TIME' },
  { id: 'f18', categoryId: 'fruits', name: 'Litchi', hindiName: 'Litchi', duration: 'Perennial', season: 'Summer', defaultUnit: 'KG', defaultPrice: 90, harvestType: 'ONE_TIME' },
  { id: 'f19', categoryId: 'fruits', name: 'Dragon Fruit', hindiName: 'Dragon Fruit', duration: 'Perennial', season: 'Monsoon', defaultUnit: 'KG', defaultPrice: 120, harvestType: 'CONTINUOUS' },
  { id: 'f20', categoryId: 'fruits', name: 'Amla', hindiName: 'Amla', duration: 'Perennial', season: 'Winter', defaultUnit: 'KG', defaultPrice: 35, harvestType: 'ONE_TIME' },
  { id: 'f21', categoryId: 'fruits', name: 'Fig / Anjeer', hindiName: 'Fig', duration: 'Perennial', season: 'Summer', defaultUnit: 'KG', defaultPrice: 110, harvestType: 'CONTINUOUS' },
  { id: 'f22', categoryId: 'fruits', name: 'Date Palm / Khajoor', hindiName: 'Date Palm', duration: 'Perennial', season: 'Summer', defaultUnit: 'KG', defaultPrice: 85, harvestType: 'ONE_TIME' },
  { id: 'f23', categoryId: 'fruits', name: 'Custard Apple / Sharifa', hindiName: 'Custard Apple', duration: 'Perennial', season: 'Autumn', defaultUnit: 'KG', defaultPrice: 60, harvestType: 'ONE_TIME' },

  // ── 4. Medicinal & Aromatic Crops ─────────────────────────────────────────
  { id: 'm1', categoryId: 'medicinal', name: 'Ashwagandha', hindiName: 'Ashwagandha', duration: '150-180 Days', season: 'Kharif', defaultUnit: 'KG', defaultPrice: 240, harvestType: 'ONE_TIME' },
  { id: 'm2', categoryId: 'medicinal', name: 'Aloe Vera', hindiName: 'Aloe Vera', duration: 'Perennial', season: 'All Seasons', defaultUnit: 'KG', defaultPrice: 12, harvestType: 'CONTINUOUS' },
  { id: 'm3', categoryId: 'medicinal', name: 'Mentha / Mint', hindiName: 'Mentha / Mint', duration: '90-100 Days', season: 'Summer', defaultUnit: 'Bunch', defaultPrice: 20, harvestType: 'CONTINUOUS' },
  { id: 'm4', categoryId: 'medicinal', name: 'Isabgol / Psyllium', hindiName: 'Isabgol', duration: '110-125 Days', season: 'Rabi', defaultUnit: 'Quintal', defaultPrice: 16500, harvestType: 'ONE_TIME' },
  { id: 'm5', categoryId: 'medicinal', name: 'Tulsi / Holy Basil', hindiName: 'Tulsi', duration: '90-110 Days', season: 'All Seasons', defaultUnit: 'KG', defaultPrice: 65, harvestType: 'CONTINUOUS' },
  { id: 'm6', categoryId: 'medicinal', name: 'Lemongrass', hindiName: 'Lemongrass', duration: 'Perennial', season: 'All Seasons', defaultUnit: 'Quintal', defaultPrice: 1200, harvestType: 'CONTINUOUS' },
  { id: 'm7', categoryId: 'medicinal', name: 'Stevia / Sugar Plant', hindiName: 'Stevia', duration: 'Perennial', season: 'All Seasons', defaultUnit: 'KG', defaultPrice: 220, harvestType: 'CONTINUOUS' },
  { id: 'm8', categoryId: 'medicinal', name: 'Safed Musli', hindiName: 'Safed Musli', duration: '100-115 Days', season: 'Kharif', defaultUnit: 'KG', defaultPrice: 850, harvestType: 'ONE_TIME' },
  { id: 'm9', categoryId: 'medicinal', name: 'Kalmegh', hindiName: 'Kalmegh', duration: '120-135 Days', season: 'Kharif', defaultUnit: 'Quintal', defaultPrice: 4200, harvestType: 'ONE_TIME' },
  { id: 'm10', categoryId: 'medicinal', name: 'Giloy', hindiName: 'Giloy', duration: 'Perennial', season: 'All Seasons', defaultUnit: 'KG', defaultPrice: 40, harvestType: 'CONTINUOUS' },
  { id: 'm11', categoryId: 'medicinal', name: 'Shatavari', hindiName: 'Shatavari', duration: '18-24 Months', season: 'Perennial', defaultUnit: 'KG', defaultPrice: 260, harvestType: 'ONE_TIME' },

  // ── 5. Spices & Condiments ────────────────────────────────────────────────
  { id: 's1', categoryId: 'spices', name: 'Turmeric', hindiName: 'Turmeric', duration: '200-240 Days', season: 'Kharif', defaultUnit: 'Quintal', defaultPrice: 7500, harvestType: 'ONE_TIME' },
  { id: 's2', categoryId: 'spices', name: 'Ginger', hindiName: 'Ginger', duration: '210-240 Days', season: 'Kharif', defaultUnit: 'KG', defaultPrice: 90, harvestType: 'ONE_TIME' },
  { id: 's3', categoryId: 'spices', name: 'Red Chilli / Dry Chilli', hindiName: 'Red Chilli', duration: '150-180 Days', season: 'Kharif', defaultUnit: 'Quintal', defaultPrice: 18000, harvestType: 'ONE_TIME' },
  { id: 's4', categoryId: 'spices', name: 'Cumin / Jeera', hindiName: 'Cumin', duration: '100-115 Days', season: 'Rabi', defaultUnit: 'Quintal', defaultPrice: 26000, harvestType: 'ONE_TIME' },
  { id: 's5', categoryId: 'spices', name: 'Coriander Seeds / Dhaniya', hindiName: 'Coriander Seeds', duration: '90-110 Days', season: 'Rabi', defaultUnit: 'Quintal', defaultPrice: 7500, harvestType: 'ONE_TIME' },
  { id: 's6', categoryId: 'spices', name: 'Fennel Seeds / Saunf', hindiName: 'Fennel Seeds', duration: '140-160 Days', season: 'Rabi', defaultUnit: 'Quintal', defaultPrice: 12000, harvestType: 'ONE_TIME' },
  { id: 's7', categoryId: 'spices', name: 'Fenugreek Seeds / Methi Dana', hindiName: 'Fenugreek Seeds', duration: '100-120 Days', season: 'Rabi', defaultUnit: 'Quintal', defaultPrice: 6500, harvestType: 'ONE_TIME' },
  { id: 's8', categoryId: 'spices', name: 'Ajwain / Carom Seeds', hindiName: 'Ajwain', duration: '120-140 Days', season: 'Rabi', defaultUnit: 'Quintal', defaultPrice: 14000, harvestType: 'ONE_TIME' },
  { id: 's9', categoryId: 'spices', name: 'Black Pepper / Kali Mirch', hindiName: 'Black Pepper', duration: 'Perennial', season: 'Winter', defaultUnit: 'KG', defaultPrice: 520, harvestType: 'ONE_TIME' },
  { id: 's10', categoryId: 'spices', name: 'Cardamom / Green Elaichi', hindiName: 'Cardamom', duration: 'Perennial', season: 'Winter', defaultUnit: 'KG', defaultPrice: 1800, harvestType: 'CONTINUOUS' },
  { id: 's11', categoryId: 'spices', name: 'Mustard Seeds / Rai', hindiName: 'Mustard Seeds', duration: '110-125 Days', season: 'Rabi', defaultUnit: 'Quintal', defaultPrice: 6000, harvestType: 'ONE_TIME' },
  { id: 's12', categoryId: 'spices', name: 'Clove / Laung', hindiName: 'Clove', duration: 'Perennial', season: 'Winter', defaultUnit: 'KG', defaultPrice: 750, harvestType: 'ONE_TIME' },
  { id: 's13', categoryId: 'spices', name: 'Cinnamon / Dalchini', hindiName: 'Cinnamon', duration: 'Perennial', season: 'All Seasons', defaultUnit: 'KG', defaultPrice: 280, harvestType: 'ONE_TIME' },

  // ── 6. Cereals & Grains (One-Time Harvest) ─────────────────────────────────
  { id: 'c1', categoryId: 'cereals', name: 'Wheat', hindiName: 'Wheat', duration: '120-140 Days', season: 'Rabi', defaultUnit: 'Quintal', defaultPrice: 2275, harvestType: 'ONE_TIME' },
  { id: 'c2', categoryId: 'cereals', name: 'Paddy / Rice', hindiName: 'Paddy / Rice', duration: '110-130 Days', season: 'Kharif', defaultUnit: 'Quintal', defaultPrice: 2183, harvestType: 'ONE_TIME' },
  { id: 'c3', categoryId: 'cereals', name: 'Basmati Rice', hindiName: 'Basmati Rice', duration: '140 Days', season: 'Kharif', defaultUnit: 'Quintal', defaultPrice: 4200, harvestType: 'ONE_TIME' },
  { id: 'c4', categoryId: 'cereals', name: 'Maize / Corn', hindiName: 'Maize', duration: '90-105 Days', season: 'Kharif / Spring', defaultUnit: 'Quintal', defaultPrice: 2090, harvestType: 'ONE_TIME' },
  { id: 'c5', categoryId: 'cereals', name: 'Pearl Millet / Bajra', hindiName: 'Pearl Millet', duration: '80-90 Days', season: 'Kharif', defaultUnit: 'Quintal', defaultPrice: 2500, harvestType: 'ONE_TIME' },
  { id: 'c6', categoryId: 'cereals', name: 'Sorghum / Jowar', hindiName: 'Sorghum', duration: '100-115 Days', season: 'Kharif', defaultUnit: 'Quintal', defaultPrice: 3180, harvestType: 'ONE_TIME' },
  { id: 'c7', categoryId: 'cereals', name: 'Barley / Jau', hindiName: 'Barley', duration: '110-125 Days', season: 'Rabi', defaultUnit: 'Quintal', defaultPrice: 1850, harvestType: 'ONE_TIME' },
  { id: 'c8', categoryId: 'cereals', name: 'Oats / Javi', hindiName: 'Oats', duration: '115-130 Days', season: 'Rabi', defaultUnit: 'Quintal', defaultPrice: 2400, harvestType: 'ONE_TIME' },
  { id: 'c9', categoryId: 'cereals', name: 'Finger Millet / Ragi', hindiName: 'Finger Millet', duration: '110-125 Days', season: 'Kharif', defaultUnit: 'Quintal', defaultPrice: 3846, harvestType: 'ONE_TIME' },
  { id: 'c10', categoryId: 'cereals', name: 'Foxtail Millet / Kangni', hindiName: 'Foxtail Millet', duration: '75-90 Days', season: 'Kharif', defaultUnit: 'Quintal', defaultPrice: 3500, harvestType: 'ONE_TIME' },
  { id: 'c11', categoryId: 'cereals', name: 'Barnyard Millet / Swank', hindiName: 'Barnyard Millet', duration: '60-75 Days', season: 'Kharif', defaultUnit: 'Quintal', defaultPrice: 3200, harvestType: 'ONE_TIME' },

  // ── 7. Pulses & Legumes (One-Time Harvest) ─────────────────────────────────
  { id: 'p1', categoryId: 'pulses', name: 'Chickpea / Gram', hindiName: 'Chickpea / Gram', duration: '110-120 Days', season: 'Rabi', defaultUnit: 'Quintal', defaultPrice: 5440, harvestType: 'ONE_TIME' },
  { id: 'p2', categoryId: 'pulses', name: 'Green Gram / Moong', hindiName: 'Green Gram / Moong', duration: '60-70 Days', season: 'Zaid / Kharif', defaultUnit: 'Quintal', defaultPrice: 8558, harvestType: 'ONE_TIME' },
  { id: 'p3', categoryId: 'pulses', name: 'Black Gram / Urad', hindiName: 'Black Gram', duration: '75-90 Days', season: 'Kharif / Summer', defaultUnit: 'Quintal', defaultPrice: 7400, harvestType: 'ONE_TIME' },
  { id: 'p4', categoryId: 'pulses', name: 'Pigeon Pea / Arhar / Tur', hindiName: 'Pigeon Pea', duration: '150-180 Days', season: 'Kharif', defaultUnit: 'Quintal', defaultPrice: 7000, harvestType: 'ONE_TIME' },
  { id: 'p5', categoryId: 'pulses', name: 'Lentil / Masoor', hindiName: 'Lentil', duration: '110-120 Days', season: 'Rabi', defaultUnit: 'Quintal', defaultPrice: 6425, harvestType: 'ONE_TIME' },
  { id: 'p6', categoryId: 'pulses', name: 'Cowpea / Lobia', hindiName: 'Cowpea', duration: '70-85 Days', season: 'Zaid / Kharif', defaultUnit: 'Quintal', defaultPrice: 6500, harvestType: 'ONE_TIME' },
  { id: 'p7', categoryId: 'pulses', name: 'Kidney Beans / Rajma', hindiName: 'Kidney Beans', duration: '100-120 Days', season: 'Rabi / Kharif', defaultUnit: 'Quintal', defaultPrice: 9500, harvestType: 'ONE_TIME' },
  { id: 'p8', categoryId: 'pulses', name: 'Field Pea / Dry Matar', hindiName: 'Field Pea', duration: '90-110 Days', season: 'Rabi', defaultUnit: 'Quintal', defaultPrice: 4800, harvestType: 'ONE_TIME' },
  { id: 'p9', categoryId: 'pulses', name: 'Moth Bean', hindiName: 'Moth Bean', duration: '65-75 Days', season: 'Kharif', defaultUnit: 'Quintal', defaultPrice: 6200, harvestType: 'ONE_TIME' },
  { id: 'p10', categoryId: 'pulses', name: 'Horse Gram / Kulthi', hindiName: 'Horse Gram', duration: '120-140 Days', season: 'Kharif', defaultUnit: 'Quintal', defaultPrice: 5000, harvestType: 'ONE_TIME' },

  // ── 8. Oilseeds (One-Time Harvest) ─────────────────────────────────────────
  { id: 'o1', categoryId: 'oilseeds', name: 'Mustard', hindiName: 'Mustard', duration: '110-125 Days', season: 'Rabi', defaultUnit: 'Quintal', defaultPrice: 5650, harvestType: 'ONE_TIME' },
  { id: 'o2', categoryId: 'oilseeds', name: 'Soybean', hindiName: 'Soybean', duration: '90-100 Days', season: 'Kharif', defaultUnit: 'Quintal', defaultPrice: 4600, harvestType: 'ONE_TIME' },
  { id: 'o3', categoryId: 'oilseeds', name: 'Groundnut / Peanut', hindiName: 'Groundnut', duration: '105-120 Days', season: 'Kharif', defaultUnit: 'Quintal', defaultPrice: 6780, harvestType: 'ONE_TIME' },
  { id: 'o4', categoryId: 'oilseeds', name: 'Sunflower', hindiName: 'Sunflower', duration: '90-105 Days', season: 'Spring / Zaid', defaultUnit: 'Quintal', defaultPrice: 6760, harvestType: 'ONE_TIME' },
  { id: 'o5', categoryId: 'oilseeds', name: 'Sesame / Til', hindiName: 'Sesame', duration: '80-95 Days', season: 'Kharif', defaultUnit: 'Quintal', defaultPrice: 8600, harvestType: 'ONE_TIME' },
  { id: 'o6', categoryId: 'oilseeds', name: 'Castor / Arandi', hindiName: 'Castor', duration: '140-180 Days', season: 'Kharif', defaultUnit: 'Quintal', defaultPrice: 5800, harvestType: 'ONE_TIME' },
  { id: 'o7', categoryId: 'oilseeds', name: 'Linseed / Flaxseed', hindiName: 'Linseed', duration: '120-130 Days', season: 'Rabi', defaultUnit: 'Quintal', defaultPrice: 6200, harvestType: 'ONE_TIME' },
  { id: 'o8', categoryId: 'oilseeds', name: 'Safflower / Kusum', hindiName: 'Safflower', duration: '120-135 Days', season: 'Rabi', defaultUnit: 'Quintal', defaultPrice: 5800, harvestType: 'ONE_TIME' },
  { id: 'o9', categoryId: 'oilseeds', name: 'Taramira', hindiName: 'Taramira', duration: '100-115 Days', season: 'Rabi', defaultUnit: 'Quintal', defaultPrice: 5100, harvestType: 'ONE_TIME' },

  // ── 9. Commercial & Cash Crops (One-Time Harvest) ──────────────────────────
  { id: 'cm1', categoryId: 'commercial', name: 'Cotton', hindiName: 'Cotton', duration: '160-180 Days', season: 'Kharif', defaultUnit: 'Quintal', defaultPrice: 7020, harvestType: 'ONE_TIME' },
  { id: 'cm2', categoryId: 'commercial', name: 'Sugarcane', hindiName: 'Sugarcane', duration: '12-14 Months', season: 'Annual', defaultUnit: 'Quintal', defaultPrice: 380, harvestType: 'ONE_TIME' },
  { id: 'cm3', categoryId: 'commercial', name: 'Guar / Cluster Bean', hindiName: 'Guar', duration: '90-110 Days', season: 'Kharif', defaultUnit: 'Quintal', defaultPrice: 5200, harvestType: 'ONE_TIME' },
  { id: 'cm4', categoryId: 'commercial', name: 'Jute / Patson', hindiName: 'Jute', duration: '120-140 Days', season: 'Kharif', defaultUnit: 'Quintal', defaultPrice: 5050, harvestType: 'ONE_TIME' },
  { id: 'cm5', categoryId: 'commercial', name: 'Tobacco', hindiName: 'Tobacco', duration: '110-130 Days', season: 'Rabi', defaultUnit: 'Quintal', defaultPrice: 6500, harvestType: 'ONE_TIME' },
  { id: 'cm6', categoryId: 'commercial', name: 'Mentha / Peppermint Oil', hindiName: 'Mentha Oil', duration: '90-100 Days', season: 'Summer', defaultUnit: 'KG', defaultPrice: 1100, harvestType: 'ONE_TIME' },

  // ── 10. Fodder & Forage Crops ─────────────────────────────────────────────
  { id: 'fod1', categoryId: 'fodder', name: 'Berseem', hindiName: 'Berseem', duration: '180-210 Days', season: 'Rabi', defaultUnit: 'Quintal', defaultPrice: 250, harvestType: 'CONTINUOUS' },
  { id: 'fod2', categoryId: 'fodder', name: 'Lucerne / Alfalfa', hindiName: 'Lucerne', duration: 'Perennial', season: 'All Seasons', defaultUnit: 'Quintal', defaultPrice: 300, harvestType: 'CONTINUOUS' },
  { id: 'fod3', categoryId: 'fodder', name: 'Hybrid Napier Grass', hindiName: 'Napier Grass', duration: 'Perennial', season: 'All Seasons', defaultUnit: 'Quintal', defaultPrice: 180, harvestType: 'CONTINUOUS' },
  { id: 'fod4', categoryId: 'fodder', name: 'Fodder Sorghum / Chari', hindiName: 'Fodder Sorghum', duration: '60-75 Days', season: 'Kharif / Summer', defaultUnit: 'Quintal', defaultPrice: 200, harvestType: 'CONTINUOUS' },
  { id: 'fod5', categoryId: 'fodder', name: 'Fodder Maize', hindiName: 'Fodder Maize', duration: '60-70 Days', season: 'Kharif', defaultUnit: 'Quintal', defaultPrice: 220, harvestType: 'ONE_TIME' },
  { id: 'fod6', categoryId: 'fodder', name: 'Fodder Oats / Javi', hindiName: 'Fodder Oats', duration: '90-110 Days', season: 'Rabi', defaultUnit: 'Quintal', defaultPrice: 240, harvestType: 'CONTINUOUS' },
  { id: 'fod7', categoryId: 'fodder', name: 'Fodder Cowpea / Lobia', hindiName: 'Fodder Cowpea', duration: '55-65 Days', season: 'Summer', defaultUnit: 'Quintal', defaultPrice: 260, harvestType: 'CONTINUOUS' },
  { id: 'fod8', categoryId: 'fodder', name: 'Rye Grass', hindiName: 'Rye Grass', duration: '120-150 Days', season: 'Winter', defaultUnit: 'Quintal', defaultPrice: 280, harvestType: 'CONTINUOUS' },
  { id: 'fod9', categoryId: 'fodder', name: 'Sudan Grass', hindiName: 'Sudan Grass', duration: '70-90 Days', season: 'Summer', defaultUnit: 'Quintal', defaultPrice: 190, harvestType: 'CONTINUOUS' },

  // ── 11. Plantation Crops ──────────────────────────────────────────────────
  { id: 'pl1', categoryId: 'plantation', name: 'Tea', hindiName: 'Tea', duration: 'Perennial', season: 'All Seasons', defaultUnit: 'KG', defaultPrice: 160, harvestType: 'CONTINUOUS' },
  { id: 'pl2', categoryId: 'plantation', name: 'Coffee', hindiName: 'Coffee', duration: 'Perennial', season: 'Winter', defaultUnit: 'KG', defaultPrice: 220, harvestType: 'ONE_TIME' },
  { id: 'pl3', categoryId: 'plantation', name: 'Coconut', hindiName: 'Coconut', duration: 'Perennial', season: 'All Seasons', defaultUnit: 'Pieces', defaultPrice: 25, harvestType: 'CONTINUOUS' },
  { id: 'pl4', categoryId: 'plantation', name: 'Arecanut / Supari', hindiName: 'Arecanut', duration: 'Perennial', season: 'All Seasons', defaultUnit: 'Quintal', defaultPrice: 38000, harvestType: 'ONE_TIME' },
  { id: 'pl5', categoryId: 'plantation', name: 'Cashewnut / Kaju', hindiName: 'Cashewnut', duration: 'Perennial', season: 'Summer', defaultUnit: 'KG', defaultPrice: 140, harvestType: 'ONE_TIME' },
  { id: 'pl6', categoryId: 'plantation', name: 'Rubber', hindiName: 'Rubber', duration: 'Perennial', season: 'All Seasons', defaultUnit: 'KG', defaultPrice: 180, harvestType: 'CONTINUOUS' },
  { id: 'pl7', categoryId: 'plantation', name: 'Oil Palm', hindiName: 'Oil Palm', duration: 'Perennial', season: 'All Seasons', defaultUnit: 'Quintal', defaultPrice: 1100, harvestType: 'CONTINUOUS' },
  { id: 'pl8', categoryId: 'plantation', name: 'Betel Vine / Paan', hindiName: 'Betel Vine', duration: 'Perennial', season: 'All Seasons', defaultUnit: 'Pieces', defaultPrice: 2, harvestType: 'CONTINUOUS' },
];
