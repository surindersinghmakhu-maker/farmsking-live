import { useQuery } from '@tanstack/react-query';
import { getPlotSatelliteHealth } from '../api/satellite.api';

export function usePlotSatelliteHealth(plotId?: string) {
  return useQuery({
    queryKey: ['satellite-health', plotId],
    queryFn: () => (plotId ? getPlotSatelliteHealth(plotId) : Promise.reject('No plotId')),
    enabled: !!plotId,
  });
}
