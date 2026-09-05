import { SoilType, SprayTankSizeL, WaterType } from '../types/api';

export const SOIL_TYPE_OPTIONS: { value: SoilType; label: string }[] = [
  { value: 'CLAY', label: 'Clay Soil' },
  { value: 'LOAMY', label: 'Loamy Soil' },
  { value: 'SANDY', label: 'Sandy Soil' },
  { value: 'BLACK', label: 'Black Cotton Soil' },
  { value: 'RED', label: 'Red Soil' },
  { value: 'ALLUVIAL', label: 'Alluvial Soil' },
  { value: 'LATERITE', label: 'Laterite Soil' },
  { value: 'SALINE_ALKALINE', label: 'Saline / Hard Soil' },
];

export const WATER_TYPE_OPTIONS: { value: WaterType; label: string }[] = [
  { value: 'BOREWELL_TUBEWELL', label: 'Borewell / Tubewell Water' },
  { value: 'CANAL', label: 'Canal Water' },
  { value: 'RAINFED', label: 'Rainwater' },
  { value: 'RIVER', label: 'River Water' },
  { value: 'POND_LAKE', label: 'Pond / Lake Water' },
  { value: 'TAP_MUNICIPAL', label: 'Tap / Hard Water' },
];

export const SPRAY_TANK_SIZE_OPTIONS: SprayTankSizeL[] = [15, 20, 25];
