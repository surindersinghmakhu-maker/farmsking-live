import { apiClient } from './client';

export type GardenType = 'BALCONY' | 'TERRACE' | 'INDOOR' | 'OUTDOOR' | 'BACKYARD' | 'COMMERCIAL_NURSERY';
export type PlantCareType = 'WATERING' | 'FERTILIZER' | 'PRUNING' | 'REPOTTING' | 'PEST_INSPECTION' | 'MISTING' | 'SUNLIGHT_ROTATION';

export interface PlantCareSchedule {
  id: string;
  plantId: string;
  gardenId?: string | null;
  gardenerId: string;
  careType: PlantCareType;
  title: string;
  instructions?: string | null;
  intervalDays: number;
  nextDueDate: string;
  lastCompletedDate?: string | null;
  isReminderActive: boolean;
  plant?: { id: string; name: string; photoUrl?: string | null };
  garden?: { id: string; name: string };
}

export interface PlantHealthLog {
  id: string;
  plantId: string;
  photoUrl: string;
  conditionStatus: string;
  notes?: string | null;
  loggedAt: string;
}

export interface Plant {
  id: string;
  gardenId?: string | null;
  gardenerId?: string | null;
  name: string;
  customName?: string | null;
  species?: string | null;
  variety?: string | null;
  photoUrl?: string | null;
  locationType?: string | null;
  potSizeInches?: number | null;
  potType?: string | null;
  healthStatus?: string;
  plantedDate?: string | null;
  healthNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  garden?: { id: string; name: string; gardenType: GardenType } | null;
  schedules?: PlantCareSchedule[];
  healthLogs?: PlantHealthLog[];
}

export interface Garden {
  id: string;
  gardenerId: string;
  name: string;
  gardenType: GardenType;
  location?: string | null;
  area?: number | null;
  sunlightExposure?: string | null;
  wateringSource?: string | null;
  healthScore: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  plants?: Plant[];
  schedules?: PlantCareSchedule[];
}

export interface CreateGardenPayload {
  name: string;
  gardenType?: GardenType;
  location?: string;
  area?: number;
  sunlightExposure?: string;
  wateringSource?: string;
}

export interface CreatePlantPayload {
  name: string;
  customName?: string;
  species?: string;
  variety?: string;
  gardenId?: string;
  photoUrl?: string;
  locationType?: string;
  potSizeInches?: number;
  potType?: string;
  healthStatus?: string;
  plantedDate?: string;
  healthNotes?: string;
}

export interface CreatePlantCareSchedulePayload {
  plantId: string;
  careType: PlantCareType;
  title: string;
  instructions?: string;
  intervalDays: number;
  nextDueDate: string;
}

export interface LogPlantHealthPayload {
  plantId: string;
  photoUrl: string;
  conditionStatus: string;
  notes?: string;
}

export interface AiCreditStatus {
  monthlyQuota: number;
  usedThisMonth: number;
  bonusCredits: number;
  remainingCredits: number;
  resetDate: string;
  isUnlimited: boolean;
}

// ── API Functions ──

export async function listMyGardens(): Promise<Garden[]> {
  const { data } = await apiClient.get<Garden[]>('/gardens/mine');
  return data;
}

export async function createGarden(payload: CreateGardenPayload): Promise<Garden> {
  const { data } = await apiClient.post<Garden>('/gardens', payload);
  return data;
}

export async function getGarden(id: string): Promise<Garden> {
  const { data } = await apiClient.get<Garden>(`/gardens/${id}`);
  return data;
}

export async function listAllPlants(): Promise<Plant[]> {
  const { data } = await apiClient.get<Plant[]>('/gardens/plants');
  return data;
}

export async function addPlant(gardenId: string, payload: CreatePlantPayload): Promise<Plant> {
  const { data } = await apiClient.post<Plant>(`/gardens/${gardenId}/plants`, payload);
  return data;
}

export async function addStandalonePlant(payload: CreatePlantPayload): Promise<Plant> {
  const { data } = await apiClient.post<Plant>('/gardens/plants', payload);
  return data;
}

export async function getPlantDetails(id: string): Promise<Plant> {
  const { data } = await apiClient.get<Plant>(`/gardens/plants/${id}`);
  return data;
}

export async function listCareTasks(dueToday?: boolean): Promise<PlantCareSchedule[]> {
  const { data } = await apiClient.get<PlantCareSchedule[]>('/gardens/care-tasks', {
    params: { dueToday: dueToday ? 'true' : undefined },
  });
  return data;
}

export async function addCareSchedule(payload: CreatePlantCareSchedulePayload): Promise<PlantCareSchedule> {
  const { data } = await apiClient.post<PlantCareSchedule>('/gardens/care-tasks', payload);
  return data;
}

export async function completeCareTask(scheduleId: string): Promise<PlantCareSchedule> {
  const { data } = await apiClient.patch<PlantCareSchedule>(`/gardens/care-tasks/${scheduleId}/complete`);
  return data;
}

export async function logPlantHealth(payload: LogPlantHealthPayload): Promise<PlantHealthLog> {
  const { data } = await apiClient.post<PlantHealthLog>('/gardens/plants/health-log', payload);
  return data;
}

export async function getAiCreditStatus(): Promise<AiCreditStatus> {
  const { data } = await apiClient.get<AiCreditStatus>('/gardens/ai-credits');
  return data;
}

export async function listGardenPlants(id: string): Promise<Plant[]> {
  const { data } = await apiClient.get<Plant[]>(`/gardens/${id}/plants`);
  return data;
}

export interface PlantDiagnosisRecord {
  id: string;
  gardenerId: string;
  plantId?: string | null;
  leafPhotoUrl: string;
  detectedIssue: string;
  category: string;
  confidence: string;
  organicRemedy: string;
  chemicalRemedy?: string | null;
  preventiveCare?: string | null;
  expertConsultationId?: string | null;
  createdAt: string;
  plant?: { id: string; name: string; locationType?: string | null };
}

export interface DiagnosePlantLeafResponse {
  aiResult: any;
  diagnosis: PlantDiagnosisRecord;
  creditStatus: AiCreditStatus;
}

export async function diagnosePlantLeaf(payload: {
  leafPhotoUrl: string;
  plantId?: string;
  leafDescription?: string;
}): Promise<DiagnosePlantLeafResponse> {
  const { data } = await apiClient.post<DiagnosePlantLeafResponse>('/gardens/diagnose', payload);
  return data;
}

export async function listPlantDiagnoses(plantId?: string): Promise<PlantDiagnosisRecord[]> {
  const { data } = await apiClient.get<PlantDiagnosisRecord[]>('/gardens/diagnoses', {
    params: { plantId: plantId || undefined },
  });
  return data;
}
