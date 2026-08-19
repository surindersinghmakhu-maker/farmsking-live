export type CropUnit = 'KG' | 'Quintal' | 'Pieces' | 'Bunch' | 'Dozen' | 'Box / Crate';

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
  { id: 'flowers', name: 'Flowers & Floriculture', hindiName: 'Flowers & Floriculture', icon: 'flower', color: '#e11d48', bg: '#ffe4e6', examples: 'Rose, Marigold, Jasmine, Tuberose' },
  { id: 'vegetables', name: 'Vegetables', hindiName: 'Vegetables', icon: 'basket', color: '#047857', bg: '#ecfdf5', examples: 'Tomato, Potato, Onion, Cauliflower' },
  { id: 'fruits', name: 'Fruits & Orchards', hindiName: 'Fruits & Orchards', icon: 'restaurant', color: '#c2410c', bg: '#fff7ed', examples: 'Mango, Kinnow, Banana, Guava, Strawberry' },
  { id: 'medicinal', name: 'Medicinal & Aromatic Crops', hindiName: 'Medicinal & Aromatic Crops', icon: 'medkit', color: '#0d9488', bg: '#ccfbf1', examples: 'Ashwagandha, Aloe Vera, Mentha / Mint' },
  { id: 'spices', name: 'Spices & Condiments', hindiName: 'Spices & Condiments', icon: 'flame', color: '#ea580c', bg: '#ffedd5', examples: 'Turmeric, Ginger, Chilli' },
  { id: 'cereals', name: 'Cereals & Grains', hindiName: 'Cereals & Grains', icon: 'leaf', color: '#15803d', bg: '#f0fdf4', examples: 'Wheat, Paddy / Rice, Basmati, Maize' },
  { id: 'pulses', name: 'Pulses & Legumes', hindiName: 'Pulses & Legumes', icon: 'nutrition', color: '#b45309', bg: '#fffbeb', examples: 'Chickpea, Green Gram (Moong), Arhar / Tur, Masoor' },
  { id: 'oilseeds', name: 'Oilseeds', hindiName: 'Oilseeds', icon: 'water', color: '#a16207', bg: '#fefce8', examples: 'Mustard, Soybean, Groundnut' },
  { id: 'commercial', name: 'Commercial & Cash Crops', hindiName: 'Commercial & Cash Crops', icon: 'cash', color: '#7c3aed', bg: '#f5f3ff', examples: 'Cotton, Sugarcane, Jute' },
  { id: 'fodder', name: 'Fodder & Forage Crops', hindiName: 'Fodder & Forage Crops', icon: 'cut', color: '#4d7c0f', bg: '#ecfccb', examples: 'Berseem, Napier Grass, Sorghum Fodder' },
  { id: 'plantation', name: 'Plantation Crops', hindiName: 'Plantation Crops', icon: 'tree', color: '#15803d', bg: '#dcfce7', examples: 'Tea, Coffee, Coconut' },
  { id: 'other', name: 'Other Crops', hindiName: 'Other Crops', icon: 'add-circle-outline', color: '#64748b', bg: '#f1f5f9' },
];

export const INITIAL_CROPS_LIST: CropItem[] = [
  // Flowers & Floriculture (Continuous / Daily Harvest)
  { id: 'fl1', categoryId: 'flowers', name: 'Rose', hindiName: 'Rose', variety: 'Dutch Rose / Desi Rose', duration: 'Perennial', season: 'All Seasons', defaultUnit: 'Bunch', defaultPrice: 40, harvestType: 'CONTINUOUS' },
  { id: 'fl2', categoryId: 'flowers', name: 'Marigold', hindiName: 'Marigold', variety: 'African Yellow / Pusa Narangi', duration: '90-100 Days', season: 'All Seasons', defaultUnit: 'KG', defaultPrice: 60, harvestType: 'CONTINUOUS' },
  { id: 'fl3', categoryId: 'flowers', name: 'Jasmine / Mogra', hindiName: 'Jasmine', variety: 'Madurai Malligai', duration: 'Perennial', season: 'Summer', defaultUnit: 'KG', defaultPrice: 180, harvestType: 'CONTINUOUS' },
  { id: 'fl4', categoryId: 'flowers', name: 'Gladiolus', hindiName: 'Gladiolus', variety: 'American Beauty', duration: '90 Days', season: 'Winter', defaultUnit: 'Pieces', defaultPrice: 15, harvestType: 'CONTINUOUS' },
  { id: 'fl5', categoryId: 'flowers', name: 'Tuberose / Rajnigandha', hindiName: 'Tuberose', variety: 'Single / Double', duration: 'Perennial', season: 'Kharif', defaultUnit: 'Bunch', defaultPrice: 50, harvestType: 'CONTINUOUS' },

  // Vegetables (Mixed)
  { id: 'v1', categoryId: 'vegetables', name: 'Tomato', hindiName: 'Tomato', variety: 'Abhilash / Himsohna', duration: '120 Days', season: 'All Seasons', defaultUnit: 'KG', defaultPrice: 30, harvestType: 'CONTINUOUS' },
  { id: 'v2', categoryId: 'vegetables', name: 'Potato', hindiName: 'Potato', variety: 'Kufri Jyoti / Pukhraj', duration: '90-100 Days', season: 'Rabi', defaultUnit: 'Quintal', defaultPrice: 1800, harvestType: 'ONE_TIME' },
  { id: 'v3', categoryId: 'vegetables', name: 'Onion', hindiName: 'Onion', variety: 'N-53 / Agri Found Dark Red', duration: '130-150 Days', season: 'Rabi / Kharif', defaultUnit: 'KG', defaultPrice: 35, harvestType: 'ONE_TIME' },
  { id: 'v4', categoryId: 'vegetables', name: 'Cauliflower', hindiName: 'Cauliflower', variety: 'Pusa Snowball', duration: '85-90 Days', season: 'Rabi', defaultUnit: 'Pieces', defaultPrice: 25, harvestType: 'ONE_TIME' },
  { id: 'v5', categoryId: 'vegetables', name: 'Coriander Leaves', hindiName: 'Coriander Leaves', variety: 'Green Leaves', duration: '40 Days', season: 'All Seasons', defaultUnit: 'Bunch', defaultPrice: 15, harvestType: 'CONTINUOUS' },

  // Fruits & Orchards
  { id: 'f1', categoryId: 'fruits', name: 'Mango', hindiName: 'Mango', variety: 'Dasheri / Langra / Alphonso', duration: 'Perennial', season: 'Summer', defaultUnit: 'Box / Crate', defaultPrice: 850, harvestType: 'ONE_TIME' },
  { id: 'f2', categoryId: 'fruits', name: 'Kinnow / Orange', hindiName: 'Kinnow', variety: 'Punjab Citrus Kinnow', duration: 'Perennial', season: 'Winter', defaultUnit: 'KG', defaultPrice: 45, harvestType: 'ONE_TIME' },
  { id: 'f3', categoryId: 'fruits', name: 'Banana', hindiName: 'Banana', variety: 'Grand Naine (G9)', duration: '12 Months', season: 'All Seasons', defaultUnit: 'Dozen', defaultPrice: 50, harvestType: 'CONTINUOUS' },
  { id: 'f4', categoryId: 'fruits', name: 'Guava', hindiName: 'Guava', variety: 'L-49 / Taiwan Pink', duration: 'Perennial', season: 'Winter / Summer', defaultUnit: 'KG', defaultPrice: 40, harvestType: 'CONTINUOUS' },
  { id: 'f5', categoryId: 'fruits', name: 'Strawberry', hindiName: 'Strawberry', variety: 'Sweet Charlie', duration: '6 Months', season: 'Winter', defaultUnit: 'Box / Crate', defaultPrice: 250, harvestType: 'CONTINUOUS' },

  // Medicinal & Aromatic Crops
  { id: 'm1', categoryId: 'medicinal', name: 'Ashwagandha', hindiName: 'Ashwagandha', variety: 'Jawahar 20', duration: '150-180 Days', season: 'Kharif', defaultUnit: 'KG', defaultPrice: 240, harvestType: 'ONE_TIME' },
  { id: 'm2', categoryId: 'medicinal', name: 'Aloe Vera', hindiName: 'Aloe Vera', variety: 'Barbadensis', duration: 'Perennial', season: 'All Seasons', defaultUnit: 'KG', defaultPrice: 12, harvestType: 'CONTINUOUS' },
  { id: 'm3', categoryId: 'medicinal', name: 'Mentha / Mint', hindiName: 'Mentha / Mint', variety: 'Kosi', duration: '90-100 Days', season: 'Summer', defaultUnit: 'Bunch', defaultPrice: 20, harvestType: 'CONTINUOUS' },

  // Spices & Condiments
  { id: 's1', categoryId: 'spices', name: 'Turmeric', hindiName: 'Turmeric', variety: 'Pratibha', duration: '200-240 Days', season: 'Kharif', defaultUnit: 'Quintal', defaultPrice: 7500, harvestType: 'ONE_TIME' },
  { id: 's2', categoryId: 'spices', name: 'Ginger', hindiName: 'Ginger', variety: 'Varada', duration: '210-240 Days', season: 'Kharif', defaultUnit: 'KG', defaultPrice: 90, harvestType: 'ONE_TIME' },

  // Cereals & Grains (One-Time Harvest)
  { id: 'c1', categoryId: 'cereals', name: 'Wheat', hindiName: 'Wheat', variety: 'HD-2967 / DBW-187', duration: '120-140 Days', season: 'Rabi', defaultUnit: 'Quintal', defaultPrice: 2275, harvestType: 'ONE_TIME' },
  { id: 'c2', categoryId: 'cereals', name: 'Paddy / Rice', hindiName: 'Paddy / Rice', variety: 'PR-126 / Pusa 44', duration: '110-130 Days', season: 'Kharif', defaultUnit: 'Quintal', defaultPrice: 2183, harvestType: 'ONE_TIME' },
  { id: 'c3', categoryId: 'cereals', name: 'Basmati Rice', hindiName: 'Basmati Rice', variety: 'Pusa 1121', duration: '140 Days', season: 'Kharif', defaultUnit: 'Quintal', defaultPrice: 4200, harvestType: 'ONE_TIME' },

  // Pulses & Legumes (One-Time Harvest)
  { id: 'p1', categoryId: 'pulses', name: 'Chickpea / Gram', hindiName: 'Chickpea / Gram', variety: 'Desi / Kabuli', duration: '110-120 Days', season: 'Rabi', defaultUnit: 'Quintal', defaultPrice: 5440, harvestType: 'ONE_TIME' },
  { id: 'p2', categoryId: 'pulses', name: 'Green Gram / Moong', hindiName: 'Green Gram / Moong', variety: 'SML 668', duration: '60-70 Days', season: 'Zaid / Kharif', defaultUnit: 'Quintal', defaultPrice: 8558, harvestType: 'ONE_TIME' },

  // Oilseeds (One-Time Harvest)
  { id: 'o1', categoryId: 'oilseeds', name: 'Mustard', hindiName: 'Mustard', variety: 'Pusa Bold / Giriraj', duration: '110-125 Days', season: 'Rabi', defaultUnit: 'Quintal', defaultPrice: 5650, harvestType: 'ONE_TIME' },
  { id: 'o2', categoryId: 'oilseeds', name: 'Soybean', hindiName: 'Soybean', variety: 'JS 335', duration: '90-100 Days', season: 'Kharif', defaultUnit: 'Quintal', defaultPrice: 4600, harvestType: 'ONE_TIME' },

  // Commercial Crops (One-Time Harvest)
  { id: 'cm1', categoryId: 'commercial', name: 'Cotton', hindiName: 'Cotton', variety: 'Bt Cotton', duration: '160-180 Days', season: 'Kharif', defaultUnit: 'Quintal', defaultPrice: 7020, harvestType: 'ONE_TIME' },
  { id: 'cm2', categoryId: 'commercial', name: 'Sugarcane', hindiName: 'Sugarcane', variety: 'Co 0238', duration: '12-14 Months', season: 'Annual', defaultUnit: 'Quintal', defaultPrice: 380, harvestType: 'ONE_TIME' },
];
