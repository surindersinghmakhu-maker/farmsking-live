export type CropUnit = 'KG' | 'Quintal' | 'Pieces' | 'Bunch' | 'Dozen' | 'Box / Crate';

export interface CropUnitInfo {
  unit: CropUnit;
  label: string;
  hindiLabel: string;
  icon: string;
}

export const CROP_UNITS: CropUnitInfo[] = [
  { unit: 'KG', label: 'KG (Kilogram)', hindiLabel: 'किलोग्राम (KG)', icon: 'scale' },
  { unit: 'Quintal', label: 'Quintal (100 KG)', hindiLabel: 'क्विंटल (Quintal)', icon: 'cube' },
  { unit: 'Pieces', label: 'Pieces (Pcs)', hindiLabel: 'पीस / नग (Pieces)', icon: 'apps' },
  { unit: 'Bunch', label: 'Bunch (Gaddi)', hindiLabel: 'गुच्छा / गड्डी (Bunch)', icon: 'flower' },
  { unit: 'Dozen', label: 'Dozen (12 Pcs)', hindiLabel: 'दर्ज़न (Dozen)', icon: 'grid' },
  { unit: 'Box / Crate', label: 'Box / Crate', hindiLabel: 'पेटी / क्रेट (Box)', icon: 'archive' },
];

export type LandAreaUnit = 'Killa (Acre)' | 'Kanal' | 'Marla' | 'Bigha' | 'Biswa' | 'Hectare' | 'Sq Ft / Gaj';

export interface LandAreaUnitInfo {
  unit: LandAreaUnit;
  label: string;
  hindiLabel: string;
}

export const LAND_AREA_UNITS: LandAreaUnitInfo[] = [
  { unit: 'Killa (Acre)', label: 'Killa / Acre', hindiLabel: 'किल्ला / एकड़' },
  { unit: 'Kanal', label: 'Kanal', hindiLabel: 'कनाल' },
  { unit: 'Marla', label: 'Marla', hindiLabel: 'मरला' },
  { unit: 'Bigha', label: 'Bigha', hindiLabel: 'बीघा' },
  { unit: 'Biswa', label: 'Biswa', hindiLabel: 'बिस्वा' },
  { unit: 'Hectare', label: 'Hectare', hindiLabel: 'हेक्टेयर' },
  { unit: 'Sq Ft / Gaj', label: 'Sq Ft / Gaj', hindiLabel: 'स्क्वायर फीट / गज' },
];

export type HarvestType = 'CONTINUOUS' | 'ONE_TIME';

export type IrrigationType =
  | 'Tube Well / Borewell'
  | 'Canal (नहर)'
  | 'Drip Irrigation (ड्रिप)'
  | 'Sprinkler (फव्वारा)'
  | 'Open Well (कुआँ)'
  | 'Rainfed (बारिश)'
  | 'Pond / River (तालाब/नदी)';

export interface IrrigationTypeInfo {
  type: IrrigationType;
  label: string;
  hindiLabel: string;
  icon: string;
}

export const IRRIGATION_TYPES: IrrigationTypeInfo[] = [
  { type: 'Tube Well / Borewell', label: 'Tube Well / Borewell', hindiLabel: 'ट्यूबवेल / सबमर्सिबल', icon: 'water-outline' },
  { type: 'Canal (नहर)', label: 'Canal / Rajbaha', hindiLabel: 'नहर / सूआ', icon: 'boat-outline' },
  { type: 'Drip Irrigation (ड्रिप)', label: 'Drip Irrigation', hindiLabel: 'ड्रिप / टपक सिंचाई', icon: 'color-fill-outline' },
  { type: 'Sprinkler (फव्वारा)', label: 'Sprinkler System', hindiLabel: 'फव्वारा / स्प्रिंकलर', icon: 'sparkles-outline' },
  { type: 'Open Well (कुआँ)', label: 'Open Well', hindiLabel: 'कुआँ / बावड़ी', icon: 'disc-outline' },
  { type: 'Rainfed (बारिश)', label: 'Rainfed / Monsoon', hindiLabel: 'वर्षा आधारित (बारिश)', icon: 'cloud-rain-outline' },
  { type: 'Pond / River (तालाब/नदी)', label: 'Pond / River', hindiLabel: 'तालाब / नदी / पोखरा', icon: 'fish-outline' },
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
  { id: 'flowers', name: 'Flowers & Floriculture', hindiName: 'फूल एवं पुष्प कृषि', icon: 'flower', color: '#e11d48', bg: '#ffe4e6', examples: 'गुलाब (Rose), गेंदा (Marigold), मोगरा (Jasmine), रजनीगंधा' },
  { id: 'vegetables', name: 'Vegetables', hindiName: 'सबज़ियाँ', icon: 'basket', color: '#047857', bg: '#ecfdf5', examples: 'टमाटर (Tomato), आलू (Potato), प्याज़ (Onion), फूलगोभी' },
  { id: 'fruits', name: 'Fruits & Orchards', hindiName: 'फल एवं बाग़', icon: 'restaurant', color: '#c2410c', bg: '#fff7ed', examples: 'आम (Mango), किन्नू (Kinnow), केला (Banana), अमरूद, स्ट्रॉबेरी' },
  { id: 'medicinal', name: 'Medicinal & Aromatic Crops', hindiName: 'औषधीय एवं सुगंधित फसलें', icon: 'medkit', color: '#0d9488', bg: '#ccfbf1', examples: 'अश्वगंधा (Ashwagandha), एलोवेरा (Aloe Vera), पुदीना / मेंथा' },
  { id: 'spices', name: 'Spices & Condiments', hindiName: 'मसाले एवं मिर्च', icon: 'flame', color: '#ea580c', bg: '#ffedd5', examples: 'हल्दी (Turmeric), अदरक (Ginger), मिर्च (Chilli)' },
  { id: 'cereals', name: 'Cereals & Grains', hindiName: 'अनाज एवं अन्न', icon: 'leaf', color: '#15803d', bg: '#f0fdf4', examples: 'गेहूँ (Wheat), धान (Paddy/Rice), बासमती (Basmati), मक्का' },
  { id: 'pulses', name: 'Pulses & Legumes', hindiName: 'दालें एवं दलहन', icon: 'nutrition', color: '#b45309', bg: '#fffbeb', examples: 'चना (Chickpea), मूंग (Moong), अरहर / तूर (Tur), मसूर' },
  { id: 'oilseeds', name: 'Oilseeds', hindiName: 'तिलहन', icon: 'water', color: '#a16207', bg: '#fefce8', examples: 'सरसों (Mustard), सोयाबीन (Soybean), मूंगफली (Groundnut)' },
  { id: 'commercial', name: 'Commercial & Cash Crops', hindiName: 'नकदी फसलें', icon: 'cash', color: '#7c3aed', bg: '#f5f3ff', examples: 'कपास (Cotton), गन्ना (Sugarcane), जूट (Jute)' },
  { id: 'fodder', name: 'Fodder & Forage Crops', hindiName: 'चारा फसलें', icon: 'cut', color: '#4d7c0f', bg: '#ecfccb', examples: 'बरसीम (Berseem), नेपियर घास, ज्वार चारा' },
  { id: 'plantation', name: 'Plantation Crops', hindiName: 'रोपण एवं बागवानी', icon: 'tree', color: '#15803d', bg: '#dcfce7', examples: 'चाय (Tea), कॉफी (Coffee), नारियल (Coconut)' },
  { id: 'other', name: 'Other Crops', hindiName: 'अन्य फसलें', icon: 'add-circle-outline', color: '#64748b', bg: '#f1f5f9' },
];

export const INITIAL_CROPS_LIST: CropItem[] = [
  // Flowers & Floriculture (Continuous / Daily Harvest)
  { id: 'fl1', categoryId: 'flowers', name: 'Rose (गुलाब)', hindiName: 'गुलाब', variety: 'Dutch Rose / Desi Rose', duration: 'Perennial', season: 'All Seasons', defaultUnit: 'Bunch', defaultPrice: 40, harvestType: 'CONTINUOUS' },
  { id: 'fl2', categoryId: 'flowers', name: 'Marigold (गेंदा)', hindiName: 'गेंदा', variety: 'African Yellow / Pusa Narangi', duration: '90-100 Days', season: 'All Seasons', defaultUnit: 'KG', defaultPrice: 60, harvestType: 'CONTINUOUS' },
  { id: 'fl3', categoryId: 'flowers', name: 'Jasmine / Mogra (मोगरा / चमेली)', hindiName: 'मोगरा', variety: 'Madurai Malligai', duration: 'Perennial', season: 'Summer', defaultUnit: 'KG', defaultPrice: 180, harvestType: 'CONTINUOUS' },
  { id: 'fl4', categoryId: 'flowers', name: 'Gladiolus (ग्लेडियोलस)', hindiName: 'ग्लेडियोलस', variety: 'American Beauty', duration: '90 Days', season: 'Winter', defaultUnit: 'Pieces', defaultPrice: 15, harvestType: 'CONTINUOUS' },
  { id: 'fl5', categoryId: 'flowers', name: 'Tuberose / Rajnigandha (रजनीगंधा)', hindiName: 'रजनीगंधा', variety: 'Single / Double', duration: 'Perennial', season: 'Kharif', defaultUnit: 'Bunch', defaultPrice: 50, harvestType: 'CONTINUOUS' },

  // Vegetables (Mixed)
  { id: 'v1', categoryId: 'vegetables', name: 'Tomato (टमाटर)', hindiName: 'टमाटर', variety: 'Abhilash / Himsohna', duration: '120 Days', season: 'All Seasons', defaultUnit: 'KG', defaultPrice: 30, harvestType: 'CONTINUOUS' },
  { id: 'v2', categoryId: 'vegetables', name: 'Potato (आलू)', hindiName: 'आलू', variety: 'Kufri Jyoti / Pukhraj', duration: '90-100 Days', season: 'Rabi', defaultUnit: 'Quintal', defaultPrice: 1800, harvestType: 'ONE_TIME' },
  { id: 'v3', categoryId: 'vegetables', name: 'Onion (प्याज़)', hindiName: 'प्याज़', variety: 'N-53 / Agri Found Dark Red', duration: '130-150 Days', season: 'Rabi / Kharif', defaultUnit: 'KG', defaultPrice: 35, harvestType: 'ONE_TIME' },
  { id: 'v4', categoryId: 'vegetables', name: 'Cauliflower (फूलगोभी)', hindiName: 'फूलगोभी', variety: 'Pusa Snowball', duration: '85-90 Days', season: 'Rabi', defaultUnit: 'Pieces', defaultPrice: 25, harvestType: 'ONE_TIME' },
  { id: 'v5', categoryId: 'vegetables', name: 'Coriander Leaves (धनिया पत्ती)', hindiName: 'धनिया', variety: 'Green Leaves', duration: '40 Days', season: 'All Seasons', defaultUnit: 'Bunch', defaultPrice: 15, harvestType: 'CONTINUOUS' },

  // Fruits & Orchards
  { id: 'f1', categoryId: 'fruits', name: 'Mango (आम)', hindiName: 'आम', variety: 'Dasheri / Langra / Alphonso', duration: 'Perennial', season: 'Summer', defaultUnit: 'Box / Crate', defaultPrice: 850, harvestType: 'ONE_TIME' },
  { id: 'f2', categoryId: 'fruits', name: 'Kinnow / Orange (किन्नू)', hindiName: 'किन्नू', variety: 'Punjab Citrus Kinnow', duration: 'Perennial', season: 'Winter', defaultUnit: 'KG', defaultPrice: 45, harvestType: 'ONE_TIME' },
  { id: 'f3', categoryId: 'fruits', name: 'Banana (केला)', hindiName: 'केला', variety: 'Grand Naine (G9)', duration: '12 Months', season: 'All Seasons', defaultUnit: 'Dozen', defaultPrice: 50, harvestType: 'CONTINUOUS' },
  { id: 'f4', categoryId: 'fruits', name: 'Guava (अमरूद)', hindiName: 'अमरूद', variety: 'L-49 / Taiwan Pink', duration: 'Perennial', season: 'Winter / Summer', defaultUnit: 'KG', defaultPrice: 40, harvestType: 'CONTINUOUS' },
  { id: 'f5', categoryId: 'fruits', name: 'Strawberry (स्ट्रॉबेरी)', hindiName: 'स्ट्रॉबेरी', variety: 'Sweet Charlie', duration: '6 Months', season: 'Winter', defaultUnit: 'Box / Crate', defaultPrice: 250, harvestType: 'CONTINUOUS' },

  // Medicinal & Aromatic Crops
  { id: 'm1', categoryId: 'medicinal', name: 'Ashwagandha (अश्वगंधा)', hindiName: 'अश्वगंधा', variety: 'Jawahar 20', duration: '150-180 Days', season: 'Kharif', defaultUnit: 'KG', defaultPrice: 240, harvestType: 'ONE_TIME' },
  { id: 'm2', categoryId: 'medicinal', name: 'Aloe Vera (घृतकुमारी)', hindiName: 'एलोवेरा', variety: 'Barbadensis', duration: 'Perennial', season: 'All Seasons', defaultUnit: 'KG', defaultPrice: 12, harvestType: 'CONTINUOUS' },
  { id: 'm3', categoryId: 'medicinal', name: 'Mentha / Mint (पुदीना / मेंथा)', hindiName: 'मेंथा', variety: 'Kosi', duration: '90-100 Days', season: 'Summer', defaultUnit: 'Bunch', defaultPrice: 20, harvestType: 'CONTINUOUS' },

  // Spices & Condiments
  { id: 's1', categoryId: 'spices', name: 'Turmeric (हल्दी)', hindiName: 'हल्दी', variety: 'Pratibha', duration: '200-240 Days', season: 'Kharif', defaultUnit: 'Quintal', defaultPrice: 7500, harvestType: 'ONE_TIME' },
  { id: 's2', categoryId: 'spices', name: 'Ginger (अदरक)', hindiName: 'अदरक', variety: 'Varada', duration: '210-240 Days', season: 'Kharif', defaultUnit: 'KG', defaultPrice: 90, harvestType: 'ONE_TIME' },

  // Cereals & Grains (One-Time Harvest)
  { id: 'c1', categoryId: 'cereals', name: 'Wheat (गेहूँ)', hindiName: 'गेहूँ', variety: 'HD-2967 / DBW-187', duration: '120-140 Days', season: 'Rabi', defaultUnit: 'Quintal', defaultPrice: 2275, harvestType: 'ONE_TIME' },
  { id: 'c2', categoryId: 'cereals', name: 'Paddy / Rice (धान)', hindiName: 'धान', variety: 'PR-126 / Pusa 44', duration: '110-130 Days', season: 'Kharif', defaultUnit: 'Quintal', defaultPrice: 2183, harvestType: 'ONE_TIME' },
  { id: 'c3', categoryId: 'cereals', name: 'Basmati Rice (बासमती)', hindiName: 'बासमती', variety: 'Pusa 1121', duration: '140 Days', season: 'Kharif', defaultUnit: 'Quintal', defaultPrice: 4200, harvestType: 'ONE_TIME' },

  // Pulses & Legumes (One-Time Harvest)
  { id: 'p1', categoryId: 'pulses', name: 'Chickpea / Gram (चना)', hindiName: 'चना', variety: 'Desi / Kabuli', duration: '110-120 Days', season: 'Rabi', defaultUnit: 'Quintal', defaultPrice: 5440, harvestType: 'ONE_TIME' },
  { id: 'p2', categoryId: 'pulses', name: 'Green Gram / Moong (मूंग)', hindiName: 'मूंग', variety: 'SML 668', duration: '60-70 Days', season: 'Zaid / Kharif', defaultUnit: 'Quintal', defaultPrice: 8558, harvestType: 'ONE_TIME' },

  // Oilseeds (One-Time Harvest)
  { id: 'o1', categoryId: 'oilseeds', name: 'Mustard / Sarson (सरसों)', hindiName: 'सरसों', variety: 'Pusa Bold / Giriraj', duration: '110-125 Days', season: 'Rabi', defaultUnit: 'Quintal', defaultPrice: 5650, harvestType: 'ONE_TIME' },
  { id: 'o2', categoryId: 'oilseeds', name: 'Soybean (सोयाबीन)', hindiName: 'सोयाबीन', variety: 'JS 335', duration: '90-100 Days', season: 'Kharif', defaultUnit: 'Quintal', defaultPrice: 4600, harvestType: 'ONE_TIME' },

  // Commercial Crops (One-Time Harvest)
  { id: 'cm1', categoryId: 'commercial', name: 'Cotton (कपास)', hindiName: 'कपास', variety: 'Bt Cotton', duration: '160-180 Days', season: 'Kharif', defaultUnit: 'Quintal', defaultPrice: 7020, harvestType: 'ONE_TIME' },
  { id: 'cm2', categoryId: 'commercial', name: 'Sugarcane (गन्ना)', hindiName: 'गन्ना', variety: 'Co 0238', duration: '12-14 Months', season: 'Annual', defaultUnit: 'Quintal', defaultPrice: 380, harvestType: 'ONE_TIME' },
];
