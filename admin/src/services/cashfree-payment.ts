import { apiClient } from '../api/client';
import { Platform, Linking } from 'react-native';

export interface CashfreeOrderParams {
  orderId: string;
  amount: number;
  purpose: 'PLAN_PURCHASE' | 'GARDEN_CARD' | 'PRODUCT_SHOPPING' | 'DOCTOR_CONSULTATION' | 'WALLET_TOPUP';
  customerName?: string;
  customerPhone?: string;
}

export interface CashfreeOrderResult {
  orderId: string;
  paymentSessionId: string;
  orderStatus: string;
}

/**
 * Initialize Cashfree payment order session from backend
 */
export const createCashfreePaymentOrder = async (
  params: CashfreeOrderParams,
): Promise<CashfreeOrderResult> => {
  const res = await apiClient.post<CashfreeOrderResult>('/cashfree/orders/create', {
    orderId: params.orderId,
    amount: params.amount,
    purpose: params.purpose,
    customerName: params.customerName,
    customerPhone: params.customerPhone,
  });
  return res.data;
};

/**
 * Verify Cashfree payment status after checkout return
 */
export const verifyCashfreePayment = async (orderId: string) => {
  const res = await apiClient.get(`/cashfree/orders/${orderId}/verify`);
  return res.data;
};

/**
 * Open Cashfree Checkout Web Gateway
 */
export const launchCashfreeCheckout = async (sessionId: string, orderId: string) => {
  const env = 'sandbox'; // or 'production' depending on configuration
  const checkoutUrl = `https://${env}.cashfree.com/pg/orders/${orderId}/payment-session/${sessionId}`;
  
  if (Platform.OS === 'web') {
    window.location.href = checkoutUrl;
  } else {
    await Linking.openURL(checkoutUrl);
  }
};
