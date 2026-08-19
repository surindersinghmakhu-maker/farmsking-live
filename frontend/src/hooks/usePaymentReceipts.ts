import { useMutation, useQuery } from '@tanstack/react-query';
import * as paymentReceiptsApi from '../api/paymentReceipts.api';

export function useFetchPaymentReceipt() {
  return useMutation({
    mutationFn: paymentReceiptsApi.getPaymentReceipt,
  });
}

export function useMyPaymentReceiptCount() {
  return useQuery({
    queryKey: ['payment-receipts', 'count', 'mine'],
    queryFn: paymentReceiptsApi.getMyPaymentReceiptCount,
  });
}
