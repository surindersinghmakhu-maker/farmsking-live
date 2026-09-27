import { apiClient } from './client';

export interface AssignedFarmerLog {
  id: string;
  farmerId: string;
  trainerId: string;
  state: string;
  district: string | null;
  status: 'PENDING_CALL' | 'IN_PROGRESS' | 'WAITING_VERIFICATION' | 'VERIFIED_AND_PAID' | 'UNREACHABLE';
  rating: number | null;
  payoutAmount: number;
  createdAt: string;
  farmer: {
    id: string;
    name: string;
    mobile: string;
    kingId: string | null;
    village: string | null;
    district: string | null;
    state: string | null;
    upiId: string | null;
    sprayTankSizeL: number | null;
    createdAt: string;
  };
}

export async function getMyAssignedFarmers(): Promise<AssignedFarmerLog[]> {
  const { data } = await apiClient.get<AssignedFarmerLog[]>('/trainers/my-assigned-farmers');
  return data;
}

export async function getFarmerPendingBanner(): Promise<{
  hasPending: boolean;
  training: {
    id: string;
    trainerName: string;
    trainerMobile: string;
    status: string;
  } | null;
}> {
  const { data } = await apiClient.get('/trainers/farmer-pending-banner');
  return data;
}

export async function submitFarmerTrainingRating(rating: number, notes?: string): Promise<{ success: boolean; message: string }> {
  const { data } = await apiClient.post('/trainers/farmer-verify', { rating, notes });
  return data;
}
