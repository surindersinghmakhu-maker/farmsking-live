import { SoilType, SprayTankSizeL, WaterType } from '../types/api';

export const SOIL_TYPE_OPTIONS: { value: SoilType; label: string }[] = [
  { value: 'CLAY', label: 'Clay Soil (चिकनी मिट्टी)' },
  { value: 'LOAMY', label: 'Loamy Soil (दोमट मिट्टी)' },
  { value: 'SANDY', label: 'Sandy Soil (रेतीली मिट्टी)' },
  { value: 'BLACK', label: 'Black Cotton Soil (काली मिट्टी)' },
  { value: 'RED', label: 'Red Soil (लाल मिट्टी)' },
  { value: 'ALLUVIAL', label: 'Alluvial Soil (जलोढ़ मिट्टी)' },
  { value: 'LATERITE', label: 'Laterite Soil (लेटराइट)' },
  { value: 'SALINE_ALKALINE', label: 'Saline / Hard Soil (क्षारीय/कठोर)' },
];

export const WATER_TYPE_OPTIONS: { value: WaterType; label: string }[] = [
  { value: 'BOREWELL_TUBEWELL', label: 'Borewell / Tubewell Water' },
  { value: 'CANAL', label: 'Canal Water (नहर का पानी)' },
  { value: 'RAINFED', label: 'Rainwater (वर्षा का जल)' },
  { value: 'RIVER', label: 'River Water (नदी का पानी)' },
  { value: 'POND_LAKE', label: 'Pond / Lake Water' },
  { value: 'TAP_MUNICIPAL', label: 'Tap / Hard Water' },
];

export const SPRAY_TANK_SIZE_OPTIONS: SprayTankSizeL[] = [15, 20, 25];
