import { useQuery } from '@tanstack/react-query';
import { getMyWallet } from '../api/wallet.api';

export function useMyWallet() {
  return useQuery({ queryKey: ['wallet', 'mine'], queryFn: getMyWallet });
}
