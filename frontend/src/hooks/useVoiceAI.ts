import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getVoiceHistory, processVoiceCommand } from '../api/voice-ai.api';

export function useVoiceAIHistory() {
  return useQuery({
    queryKey: ['voice-ai-history'],
    queryFn: getVoiceHistory,
  });
}

export function useProcessVoiceCommand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (transcript: string) => processVoiceCommand(transcript),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voice-ai-history'] });
    },
  });
}
