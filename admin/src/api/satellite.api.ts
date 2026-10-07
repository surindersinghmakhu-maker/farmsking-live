import { apiClient } from './client';

export interface SatelliteScanResponse {
  id: string;
  plotId: string;
  scanDate: string;
  meanNdvi: number;
  healthStatus: string;
  tileLayerUrl: string;
  redZoneAlerts?: { lat: number; lng: number; message: string }[];
}

export async function getPlotSatelliteHealth(plotId: string): Promise<SatelliteScanResponse> {
  const { data } = await apiClient.get<SatelliteScanResponse>(`/satellite/plot/${plotId}/health`);
  return data;
}
