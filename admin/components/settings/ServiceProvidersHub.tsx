/**
 * ServiceProvidersHub.tsx
 *
 * 🏗️ FarmsKing — Super Admin Service Providers Control Center
 *
 * Shows every third-party integration used in the project:
 *   • Payment Gateway  (PhonePe → Razorpay / Cashfree / Stripe / Paytm)
 *   • Split Payout     (Cashfree Marketplace → Razorpay Route / Stripe Connect)
 *   • SMS / OTP        (MSG91 → Fast2SMS / Textlocal / Twilio / 2Factor)
 *   • Email / SMTP     (Gmail → SendGrid / Mailgun / AWS SES / Postmark)
 *   • WhatsApp Notif   (Meta Cloud API → Twilio WA / Wati / Interakt / AiSensy)
 *   • Voice / Video    (Agora → Twilio Video / Daily.co / Vonage / Jitsi)
 *   • AI / LLM         (Gemini → OpenAI / Anthropic Claude / Mistral)
 *   • Logistics        (Shiprocket → Delhivery / EcomExpress / XpressBees)
 *   • Auth Provider    (Firebase → AWS Cognito / Auth0 / Supabase)
 *   • Database         (Neon PostgreSQL → Supabase / PlanetScale / Railway)
 *   • UPI / Payee      (Direct UPI VPA configuration)
 *
 * Admin can: switch active provider → fill API keys → save.
 * Keys are stored in DB via /api/v1/app-settings/service-config.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT, RADIUS, SPACING } from '@/constants/theme';
import { useExecutiveTheme } from '@/src/store/theme-context';
import { apiClient } from '@/src/api/client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProviderField {
  key: string;
  label: string;
  placeholder: string;
  secret?: boolean;
  hint?: string;
}

interface Provider {
  id: string;
  name: string;
  logo: string;          // emoji fallback
  description: string;
  docsUrl?: string;
  fields: ProviderField[];
}

interface ServiceCategory {
  id: string;
  title: string;
  icon: any;
  accentColor: string;
  description: string;
  envPrefix: string;     // used to group related env keys
  activeProvider: string;
  providers: Provider[];
}

// ─── Service Definitions ──────────────────────────────────────────────────────

const SERVICES: ServiceCategory[] = [
  // ── 1. PAYMENT GATEWAY ────────────────────────────────────────────────────
  {
    id: 'payment_gateway',
    title: 'Payment Gateway',
    icon: 'card-outline',
    accentColor: '#6366f1',
    description: 'Primary checkout gateway for orders, subscriptions & wallet top-ups',
    envPrefix: 'GATEWAY',
    activeProvider: 'phonepe',
    providers: [
      {
        id: 'phonepe',
        name: 'PhonePe',
        logo: '📱',
        description: 'Standard Checkout v2 — RBI-approved. Currently active.',
        fields: [
          { key: 'PHONEPE_ENV', label: 'Environment', placeholder: 'SANDBOX or PRODUCTION' },
          { key: 'PHONEPE_CLIENT_ID', label: 'Client ID', placeholder: 'M22KMYDXXX...' },
          { key: 'PHONEPE_CLIENT_SECRET', label: 'Client Secret', placeholder: 'NTE0...(base64)', secret: true },
          { key: 'PHONEPE_CLIENT_VERSION', label: 'Client Version', placeholder: '1' },
          { key: 'PHONEPE_WEBHOOK_USERNAME', label: 'Webhook Username', placeholder: 'farmsking_webhook' },
          { key: 'PHONEPE_WEBHOOK_PASSWORD', label: 'Webhook Password', placeholder: '••••••••', secret: true },
        ],
      },
      {
        id: 'razorpay',
        name: 'Razorpay',
        logo: '⚡',
        description: 'Popular Indian gateway. Supports UPI, Cards, Netbanking, EMI.',
        fields: [
          { key: 'RAZORPAY_KEY_ID', label: 'Key ID', placeholder: 'rzp_live_XXXX' },
          { key: 'RAZORPAY_KEY_SECRET', label: 'Key Secret', placeholder: '••••••••', secret: true },
          { key: 'RAZORPAY_WEBHOOK_SECRET', label: 'Webhook Secret', placeholder: '••••••••', secret: true },
        ],
      },
      {
        id: 'cashfree_pg',
        name: 'Cashfree PG',
        logo: '💳',
        description: 'Also used for Split Payouts. Can run both simultaneously.',
        fields: [
          { key: 'CASHFREE_ENV', label: 'Environment', placeholder: 'SANDBOX or PRODUCTION' },
          { key: 'CASHFREE_APP_ID', label: 'App ID', placeholder: 'TEST111XXX...' },
          { key: 'CASHFREE_SECRET_KEY', label: 'Secret Key', placeholder: 'cfsk_ma_test_XXX', secret: true },
        ],
      },
      {
        id: 'stripe',
        name: 'Stripe',
        logo: '🌐',
        description: 'Best for international payments. Supports 135+ currencies.',
        fields: [
          { key: 'STRIPE_PUBLISHABLE_KEY', label: 'Publishable Key', placeholder: 'pk_live_XXXX' },
          { key: 'STRIPE_SECRET_KEY', label: 'Secret Key', placeholder: 'sk_live_XXXX', secret: true },
          { key: 'STRIPE_WEBHOOK_SECRET', label: 'Webhook Secret', placeholder: 'whsec_XXXX', secret: true },
        ],
      },
      {
        id: 'paytm',
        name: 'Paytm',
        logo: '💰',
        description: 'Paytm Payment Gateway with UPI & Wallet support.',
        fields: [
          { key: 'PAYTM_MID', label: 'Merchant ID (MID)', placeholder: 'FarmsK000000000' },
          { key: 'PAYTM_MERCHANT_KEY', label: 'Merchant Key', placeholder: '••••••••', secret: true },
          { key: 'PAYTM_WEBSITE', label: 'Website', placeholder: 'WEBPROD' },
          { key: 'PAYTM_ENV', label: 'Environment', placeholder: 'PROD or STAGING' },
        ],
      },
    ],
  },

  // ── 2. SPLIT PAYOUT / MARKETPLACE ─────────────────────────────────────────
  {
    id: 'split_payout',
    title: 'Split Payout (Marketplace)',
    icon: 'git-branch-outline',
    accentColor: '#10b981',
    description: 'Multi-vendor settlements — auto-split order payment to sellers',
    envPrefix: 'SPLIT',
    activeProvider: 'cashfree',
    providers: [
      {
        id: 'cashfree',
        name: 'Cashfree Easy Split',
        logo: '💳',
        description: 'Current active. Supports instant vendor settlements.',
        fields: [
          { key: 'CASHFREE_APP_ID', label: 'App ID', placeholder: 'TEST111XXX...' },
          { key: 'CASHFREE_SECRET_KEY', label: 'Secret Key', placeholder: '••••••••', secret: true },
          { key: 'CASHFREE_ENV', label: 'Environment', placeholder: 'SANDBOX or PRODUCTION' },
        ],
      },
      {
        id: 'razorpay_route',
        name: 'Razorpay Route',
        logo: '⚡',
        description: 'Razorpay Route for multi-seller marketplace payouts.',
        fields: [
          { key: 'RAZORPAY_KEY_ID', label: 'Key ID', placeholder: 'rzp_live_XXXX' },
          { key: 'RAZORPAY_KEY_SECRET', label: 'Key Secret', placeholder: '••••••••', secret: true },
          { key: 'RAZORPAY_ROUTE_ACCOUNT', label: 'Route Account ID', placeholder: 'acc_XXXX' },
        ],
      },
      {
        id: 'stripe_connect',
        name: 'Stripe Connect',
        logo: '🌐',
        description: 'Stripe Connect for international seller payouts.',
        fields: [
          { key: 'STRIPE_SECRET_KEY', label: 'Secret Key', placeholder: 'sk_live_XXXX', secret: true },
          { key: 'STRIPE_CONNECT_CLIENT_ID', label: 'Connect Client ID', placeholder: 'ca_XXXX' },
        ],
      },
    ],
  },

  // ── 3. UPI / PAYEE ────────────────────────────────────────────────────────
  {
    id: 'upi_payee',
    title: 'UPI Direct Payee',
    icon: 'qr-code-outline',
    accentColor: '#f59e0b',
    description: 'UPI VPA used for direct QR-based order payments',
    envPrefix: 'UPI',
    activeProvider: 'upi_direct',
    providers: [
      {
        id: 'upi_direct',
        name: 'Direct UPI VPA',
        logo: '🔷',
        description: 'Simple UPI collect/QR payment. No gateway fees.',
        fields: [
          { key: 'UPI_PAYEE_VPA', label: 'UPI VPA / ID', placeholder: 'yourname@okicici', hint: 'e.g. surindersinghmakhu-8@okicici' },
          { key: 'UPI_PAYEE_NAME', label: 'Payee Display Name', placeholder: 'FarmsKing' },
        ],
      },
    ],
  },

  // ── 4. SMS / OTP SERVICE ──────────────────────────────────────────────────
  {
    id: 'sms_otp',
    title: 'SMS / OTP Service',
    icon: 'chatbubble-outline',
    accentColor: '#ec4899',
    description: 'Send OTP, alerts & notifications via SMS to farmers',
    envPrefix: 'SMS',
    activeProvider: 'msg91',
    providers: [
      {
        id: 'msg91',
        name: 'MSG91',
        logo: '📨',
        description: 'Most popular Indian SMS provider. DLT-compliant.',
        fields: [
          { key: 'MSG91_AUTH_KEY', label: 'Auth Key', placeholder: '424344XXXXXXXX', secret: true },
          { key: 'MSG91_SENDER_ID', label: 'Sender ID (DLT)', placeholder: 'FRMKNG' },
          { key: 'MSG91_OTP_TEMPLATE_ID', label: 'OTP Template ID', placeholder: '6XXXXXXXXXXXXXXXX' },
          { key: 'MSG91_FLOW_ID', label: 'Flow ID (Optional)', placeholder: '6XXXXXXXXXXXXXXXX' },
        ],
      },
      {
        id: 'fast2sms',
        name: 'Fast2SMS',
        logo: '⚡',
        description: 'Budget-friendly. Quick setup, DLT route available.',
        fields: [
          { key: 'FAST2SMS_API_KEY', label: 'API Key', placeholder: 'XXXXXXXXXXXXXXXXXXXXXXXX', secret: true },
          { key: 'FAST2SMS_SENDER_ID', label: 'Sender ID', placeholder: 'FRMKNG' },
          { key: 'FAST2SMS_ROUTE', label: 'Route', placeholder: 'dlt or q' },
        ],
      },
      {
        id: 'twilio_sms',
        name: 'Twilio SMS',
        logo: '🔴',
        description: 'International + India SMS. High reliability.',
        fields: [
          { key: 'TWILIO_ACCOUNT_SID', label: 'Account SID', placeholder: 'ACxxxxxx' },
          { key: 'TWILIO_AUTH_TOKEN', label: 'Auth Token', placeholder: '••••••••', secret: true },
          { key: 'TWILIO_PHONE_NUMBER', label: 'From Number', placeholder: '+1XXXXXXXXXX' },
        ],
      },
      {
        id: 'textlocal',
        name: 'Textlocal',
        logo: '📩',
        description: 'UK-origin SMS. Supports India DLT routes.',
        fields: [
          { key: 'TEXTLOCAL_API_KEY', label: 'API Key', placeholder: 'XXXXXXXXXXXXXXXXXXXXXXXX', secret: true },
          { key: 'TEXTLOCAL_SENDER', label: 'Sender', placeholder: 'FRMKNG' },
        ],
      },
      {
        id: 'two_factor',
        name: '2Factor.in',
        logo: '🔐',
        description: 'India-specific OTP service. Simple integration.',
        fields: [
          { key: 'TWO_FACTOR_API_KEY', label: 'API Key', placeholder: 'XXXXXXXX-XXXX-XXXX-XXXX', secret: true },
          { key: 'TWO_FACTOR_TEMPLATE', label: 'OTP Template Name', placeholder: 'OTPTEMPLATE1' },
        ],
      },
    ],
  },

  // ── 5. EMAIL / SMTP ───────────────────────────────────────────────────────
  {
    id: 'email_smtp',
    title: 'Email / SMTP Service',
    icon: 'mail-outline',
    accentColor: '#3b82f6',
    description: 'Transactional emails — OTP, order confirmations, receipts',
    envPrefix: 'SMTP',
    activeProvider: 'gmail_smtp',
    providers: [
      {
        id: 'gmail_smtp',
        name: 'Gmail SMTP',
        logo: '📧',
        description: 'Current active. Gmail App Password required.',
        fields: [
          { key: 'SMTP_HOST', label: 'SMTP Host', placeholder: 'smtp.gmail.com' },
          { key: 'SMTP_PORT', label: 'SMTP Port', placeholder: '587' },
          { key: 'SMTP_USER', label: 'Gmail Address', placeholder: 'farmskingindia@gmail.com' },
          { key: 'SMTP_PASS', label: 'App Password', placeholder: 'xxxx xxxx xxxx xxxx', secret: true, hint: 'Google Account → Security → 2FA → App Passwords' },
          { key: 'SMTP_FROM_NAME', label: 'Sender Name', placeholder: 'FarmsKing' },
        ],
      },
      {
        id: 'sendgrid',
        name: 'SendGrid',
        logo: '🌊',
        description: 'Twilio SendGrid — best deliverability at scale.',
        fields: [
          { key: 'SENDGRID_API_KEY', label: 'API Key', placeholder: 'SG.XXXXXXXXXXXXXXXXXXXX', secret: true },
          { key: 'SENDGRID_FROM_EMAIL', label: 'From Email', placeholder: 'noreply@farmsking.in' },
          { key: 'SENDGRID_FROM_NAME', label: 'From Name', placeholder: 'FarmsKing' },
        ],
      },
      {
        id: 'mailgun',
        name: 'Mailgun',
        logo: '🔫',
        description: 'Developer-friendly transactional email API.',
        fields: [
          { key: 'MAILGUN_API_KEY', label: 'API Key', placeholder: 'key-XXXXXXXXXXXXXXXX', secret: true },
          { key: 'MAILGUN_DOMAIN', label: 'Domain', placeholder: 'mg.farmsking.in' },
          { key: 'MAILGUN_FROM_EMAIL', label: 'From Email', placeholder: 'noreply@farmsking.in' },
        ],
      },
      {
        id: 'aws_ses',
        name: 'AWS SES',
        logo: '☁️',
        description: 'Amazon Simple Email Service — cheapest at volume.',
        fields: [
          { key: 'AWS_SES_ACCESS_KEY', label: 'Access Key ID', placeholder: 'AKIA...', secret: true },
          { key: 'AWS_SES_SECRET_KEY', label: 'Secret Access Key', placeholder: '••••••••', secret: true },
          { key: 'AWS_SES_REGION', label: 'Region', placeholder: 'ap-south-1' },
          { key: 'AWS_SES_FROM_EMAIL', label: 'Verified From Email', placeholder: 'noreply@farmsking.in' },
        ],
      },
      {
        id: 'postmark',
        name: 'Postmark',
        logo: '📬',
        description: 'Excellent for transactional emails. Fast delivery.',
        fields: [
          { key: 'POSTMARK_SERVER_TOKEN', label: 'Server Token', placeholder: 'XXXXXXXX-XXXX-XXXX-XXXX', secret: true },
          { key: 'POSTMARK_FROM_EMAIL', label: 'From Email', placeholder: 'noreply@farmsking.in' },
        ],
      },
    ],
  },

  // ── 6. WHATSAPP NOTIFICATIONS ─────────────────────────────────────────────
  {
    id: 'whatsapp_notif',
    title: 'WhatsApp Notifications',
    icon: 'logo-whatsapp',
    accentColor: '#25d366',
    description: 'Send order updates, OTPs & alerts via WhatsApp API',
    envPrefix: 'META_WA',
    activeProvider: 'meta_cloud',
    providers: [
      {
        id: 'meta_cloud',
        name: 'Meta Cloud API',
        logo: '🔵',
        description: 'Official WhatsApp Business Cloud API. Currently active.',
        fields: [
          { key: 'META_WA_TOKEN', label: 'Permanent Access Token', placeholder: 'EAAZAP...', secret: true, hint: 'From Meta Business → System Users' },
          { key: 'META_WA_PHONE_ID', label: 'Phone Number ID', placeholder: '9577622000' },
          { key: 'META_WA_WABA_ID', label: 'WhatsApp Business Account ID', placeholder: '1234567890' },
          { key: 'META_WA_VERIFY_TOKEN', label: 'Webhook Verify Token', placeholder: 'farmsking_verify_123' },
        ],
      },
      {
        id: 'wati',
        name: 'WATI',
        logo: '🤖',
        description: 'WATI — WhatsApp Team Inbox + API. Popular in India.',
        fields: [
          { key: 'WATI_API_ENDPOINT', label: 'API Endpoint', placeholder: 'https://live-mt-server.wati.io/XXXXX' },
          { key: 'WATI_ACCESS_TOKEN', label: 'Access Token', placeholder: 'eyJhbGc...', secret: true },
        ],
      },
      {
        id: 'interakt',
        name: 'Interakt',
        logo: '💬',
        description: 'Interakt by Jio — good for India with CRM features.',
        fields: [
          { key: 'INTERAKT_API_KEY', label: 'API Key', placeholder: 'XXXXXXXXXXXXXXXXXXXXXXXX', secret: true },
          { key: 'INTERAKT_PHONE_ID', label: 'Phone Number ID', placeholder: '91XXXXXXXXXX' },
        ],
      },
      {
        id: 'aisensy',
        name: 'AiSensy',
        logo: '🧠',
        description: 'AiSensy — WhatsApp marketing + transactional.',
        fields: [
          { key: 'AISENSY_API_KEY', label: 'Project API Key', placeholder: 'xxxxxxxxxxxxxxxx', secret: true },
          { key: 'AISENSY_PHONE_ID', label: 'Phone Number', placeholder: '91XXXXXXXXXX' },
        ],
      },
      {
        id: 'twilio_wa',
        name: 'Twilio WhatsApp',
        logo: '🔴',
        description: 'Twilio WhatsApp Sandbox / Business API.',
        fields: [
          { key: 'TWILIO_ACCOUNT_SID', label: 'Account SID', placeholder: 'ACxxxxxx' },
          { key: 'TWILIO_AUTH_TOKEN', label: 'Auth Token', placeholder: '••••••••', secret: true },
          { key: 'TWILIO_WA_NUMBER', label: 'WhatsApp Number', placeholder: 'whatsapp:+14155238886' },
        ],
      },
    ],
  },

  // ── 7. VOICE / VIDEO CALLS ────────────────────────────────────────────────
  {
    id: 'voice_video',
    title: 'Voice & Video Calls',
    icon: 'videocam-outline',
    accentColor: '#8b5cf6',
    description: 'Real-time farmer ↔ advisor audio/video consultation calls',
    envPrefix: 'AGORA',
    activeProvider: 'agora',
    providers: [
      {
        id: 'agora',
        name: 'Agora.io',
        logo: '🎙️',
        description: 'Current active. Ultra-low latency RTC for India.',
        fields: [
          { key: 'AGORA_APP_ID', label: 'App ID', placeholder: '3a0f6aee857c4c...' },
          { key: 'AGORA_APP_CERTIFICATE', label: 'App Certificate', placeholder: '82dac728be6c4cc3...', secret: true },
          { key: 'AGORA_CUSTOMER_ID', label: 'Customer ID (REST)', placeholder: 'XXXXXXXXXXXXXXXX' },
          { key: 'AGORA_CUSTOMER_SECRET', label: 'Customer Secret (REST)', placeholder: '••••••••', secret: true },
        ],
      },
      {
        id: 'twilio_video',
        name: 'Twilio Video',
        logo: '🔴',
        description: 'Twilio Programmable Video — high quality, global.',
        fields: [
          { key: 'TWILIO_ACCOUNT_SID', label: 'Account SID', placeholder: 'ACxxxxxx' },
          { key: 'TWILIO_AUTH_TOKEN', label: 'Auth Token', placeholder: '••••••••', secret: true },
          { key: 'TWILIO_VIDEO_API_KEY', label: 'Video API Key SID', placeholder: 'SKxxxxxx' },
          { key: 'TWILIO_VIDEO_API_SECRET', label: 'Video API Secret', placeholder: '••••••••', secret: true },
        ],
      },
      {
        id: 'daily_co',
        name: 'Daily.co',
        logo: '📹',
        description: 'Simple video embed API. Easy integration.',
        fields: [
          { key: 'DAILY_API_KEY', label: 'API Key', placeholder: 'XXXXXXXXXXXXXXXXXXXXXXXX', secret: true },
          { key: 'DAILY_DOMAIN', label: 'Domain', placeholder: 'farmsking.daily.co' },
        ],
      },
      {
        id: 'vonage',
        name: 'Vonage (Nexmo)',
        logo: '📞',
        description: 'Vonage Video & Voice API — global CDN.',
        fields: [
          { key: 'VONAGE_API_KEY', label: 'API Key', placeholder: 'xxxxxxxx' },
          { key: 'VONAGE_API_SECRET', label: 'API Secret', placeholder: '••••••••', secret: true },
          { key: 'VONAGE_APP_ID', label: 'Application ID', placeholder: 'XXXXXXXX-XXXX-XXXX-XXXX' },
          { key: 'VONAGE_PRIVATE_KEY', label: 'Private Key Path', placeholder: '/path/to/private.key' },
        ],
      },
    ],
  },

  // ── 8. AI / LLM SERVICE ───────────────────────────────────────────────────
  {
    id: 'ai_llm',
    title: 'AI / LLM Service',
    icon: 'hardware-chip-outline',
    accentColor: '#06b6d4',
    description: 'Crop AI advisor, disease diagnosis & smart recommendations',
    envPrefix: 'AI',
    activeProvider: 'gemini',
    providers: [
      {
        id: 'gemini',
        name: 'Google Gemini',
        logo: '🌟',
        description: 'Current active. Gemini Pro for crop advisory AI.',
        fields: [
          { key: 'GEMINI_API_KEY', label: 'Gemini API Key', placeholder: 'AQ.Ab8RN6L...', secret: true, hint: 'From Google AI Studio (aistudio.google.com)' },
          { key: 'GEMINI_MODEL', label: 'Model Name', placeholder: 'gemini-1.5-pro' },
        ],
      },
      {
        id: 'openai',
        name: 'OpenAI (GPT)',
        logo: '🤖',
        description: 'GPT-4o / GPT-4-turbo for advanced crop diagnosis.',
        fields: [
          { key: 'OPENAI_API_KEY', label: 'OpenAI API Key', placeholder: 'sk-proj-XXXXXXXX', secret: true, hint: 'From platform.openai.com/api-keys' },
          { key: 'OPENAI_MODEL', label: 'Model Name', placeholder: 'gpt-4o' },
          { key: 'OPENAI_ORG_ID', label: 'Org ID (Optional)', placeholder: 'org-XXXXXXXX' },
        ],
      },
      {
        id: 'anthropic',
        name: 'Anthropic Claude',
        logo: '🧠',
        description: 'Claude 3.5 Sonnet — excellent reasoning for agriculture.',
        fields: [
          { key: 'ANTHROPIC_API_KEY', label: 'API Key', placeholder: 'sk-ant-XXXXXXXX', secret: true, hint: 'From console.anthropic.com' },
          { key: 'ANTHROPIC_MODEL', label: 'Model Name', placeholder: 'claude-3-5-sonnet-20241022' },
        ],
      },
      {
        id: 'mistral',
        name: 'Mistral AI',
        logo: '🌬️',
        description: 'Mistral Large — open-weight, cost-efficient LLM.',
        fields: [
          { key: 'MISTRAL_API_KEY', label: 'API Key', placeholder: 'XXXXXXXXXXXXXXXXXXXXXXXX', secret: true },
          { key: 'MISTRAL_MODEL', label: 'Model Name', placeholder: 'mistral-large-latest' },
        ],
      },
    ],
  },

  // ── 9. LOGISTICS ──────────────────────────────────────────────────────────
  {
    id: 'logistics',
    title: 'Logistics / Shipping',
    icon: 'cube-outline',
    accentColor: '#f97316',
    description: 'Multi-vendor order shipping, tracking & courier management',
    envPrefix: 'SHIPROCKET',
    activeProvider: 'shiprocket',
    providers: [
      {
        id: 'shiprocket',
        name: 'Shiprocket',
        logo: '🚀',
        description: 'Current active. 25+ courier partners, auto-allocation.',
        fields: [
          { key: 'SHIPROCKET_EMAIL', label: 'Login Email', placeholder: 'contact@farmsking.com' },
          { key: 'SHIPROCKET_PASSWORD', label: 'Password', placeholder: '••••••••', secret: true },
          { key: 'SHIPROCKET_PICKUP_LOCATION', label: 'Default Pickup Location', placeholder: 'FarmsKing_Makhu' },
        ],
      },
      {
        id: 'delhivery',
        name: 'Delhivery',
        logo: '🚚',
        description: 'Direct Delhivery API — strong in Tier 2/3 cities.',
        fields: [
          { key: 'DELHIVERY_API_TOKEN', label: 'API Token', placeholder: 'XXXXXXXXXXXXXXXXXXXXXXXX', secret: true, hint: 'From Delhivery Partner Dashboard' },
          { key: 'DELHIVERY_ENV', label: 'Environment', placeholder: 'STAGING or PRODUCTION' },
          { key: 'DELHIVERY_PICKUP_LOCATION', label: 'Pickup Location Name', placeholder: 'FarmsKing_Makhu' },
        ],
      },
      {
        id: 'ecom_express',
        name: 'Ecom Express',
        logo: '📦',
        description: 'EcomExpress — specializes in ecommerce logistics.',
        fields: [
          { key: 'ECOM_USERNAME', label: 'API Username', placeholder: 'farmsking_ecom' },
          { key: 'ECOM_PASSWORD', label: 'API Password', placeholder: '••••••••', secret: true },
        ],
      },
      {
        id: 'xpressbees',
        name: 'XpressBees',
        logo: '🐝',
        description: 'XpressBees — fast delivery, competitive rates.',
        fields: [
          { key: 'XPRESSBEES_SECRET_KEY', label: 'Secret Key', placeholder: 'XXXXXXXXXXXXXXXX', secret: true },
          { key: 'XPRESSBEES_DISPATCH_PIN', label: 'Dispatch Pincode', placeholder: '142038' },
        ],
      },
    ],
  },

  // ── 10. AUTH PROVIDER ─────────────────────────────────────────────────────
  {
    id: 'auth_provider',
    title: 'Authentication Provider',
    icon: 'shield-checkmark-outline',
    accentColor: '#ef4444',
    description: 'Social login, phone OTP auth & user identity management',
    envPrefix: 'FIREBASE',
    activeProvider: 'firebase',
    providers: [
      {
        id: 'firebase',
        name: 'Firebase Auth',
        logo: '🔥',
        description: 'Current active. Phone OTP + Google Sign-in.',
        fields: [
          { key: 'FIREBASE_PROJECT_ID', label: 'Project ID', placeholder: 'farmsking-prod' },
          { key: 'FIREBASE_CLIENT_EMAIL', label: 'Service Account Email', placeholder: 'firebase-adminsdk@farmsking.iam.gserviceaccount.com' },
          { key: 'FIREBASE_PRIVATE_KEY', label: 'Private Key', placeholder: '-----BEGIN RSA PRIVATE KEY-----', secret: true, hint: 'From Firebase Console → Project Settings → Service Accounts' },
          { key: 'FIREBASE_API_KEY', label: 'Web API Key', placeholder: 'AIzaSy...' },
        ],
      },
      {
        id: 'aws_cognito',
        name: 'AWS Cognito',
        logo: '☁️',
        description: 'AWS managed auth — scalable, enterprise-grade.',
        fields: [
          { key: 'COGNITO_USER_POOL_ID', label: 'User Pool ID', placeholder: 'ap-south-1_XXXXXXX' },
          { key: 'COGNITO_CLIENT_ID', label: 'App Client ID', placeholder: 'XXXXXXXXXXXXXXXXXXXXXXXX' },
          { key: 'AWS_REGION', label: 'AWS Region', placeholder: 'ap-south-1' },
          { key: 'AWS_ACCESS_KEY', label: 'Access Key ID', placeholder: 'AKIA...', secret: true },
          { key: 'AWS_SECRET_KEY', label: 'Secret Access Key', placeholder: '••••••••', secret: true },
        ],
      },
      {
        id: 'supabase_auth',
        name: 'Supabase Auth',
        logo: '⚡',
        description: 'Supabase open-source auth with RLS support.',
        fields: [
          { key: 'SUPABASE_URL', label: 'Project URL', placeholder: 'https://XXXX.supabase.co' },
          { key: 'SUPABASE_SERVICE_KEY', label: 'Service Role Key', placeholder: 'eyJhbGc...', secret: true },
        ],
      },
    ],
  },

  // ── 11. DATABASE ──────────────────────────────────────────────────────────
  {
    id: 'database',
    title: 'Database Connection',
    icon: 'server-outline',
    accentColor: '#64748b',
    description: 'Primary PostgreSQL database connection string (Prisma)',
    envPrefix: 'DATABASE',
    activeProvider: 'neon',
    providers: [
      {
        id: 'neon',
        name: 'Neon PostgreSQL',
        logo: '💚',
        description: 'Current active. Serverless Postgres on Neon.',
        fields: [
          { key: 'DATABASE_URL', label: 'Database URL (Prisma)', placeholder: 'postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require', secret: true },
        ],
      },
      {
        id: 'supabase_db',
        name: 'Supabase DB',
        logo: '⚡',
        description: 'Supabase hosted Postgres with realtime.',
        fields: [
          { key: 'DATABASE_URL', label: 'Database URL', placeholder: 'postgresql://postgres:pass@db.XXXX.supabase.co:5432/postgres', secret: true },
        ],
      },
      {
        id: 'railway',
        name: 'Railway PostgreSQL',
        logo: '🚂',
        description: 'Railway managed Postgres — simple & fast.',
        fields: [
          { key: 'DATABASE_URL', label: 'Database URL', placeholder: 'postgresql://postgres:pass@containers-us-west.railway.app:XXXX/railway', secret: true },
        ],
      },
      {
        id: 'aws_rds',
        name: 'AWS RDS',
        logo: '☁️',
        description: 'Amazon RDS PostgreSQL — production-grade with HA.',
        fields: [
          { key: 'DATABASE_URL', label: 'Database URL', placeholder: 'postgresql://admin:pass@farmsking.XXXX.rds.amazonaws.com:5432/farmsking', secret: true },
        ],
      },
    ],
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export function ServiceProvidersHub() {
  const { isLight, isDarkTheme, colors } = useExecutiveTheme();

  // ── State ──────────────────────────────────────────────────────────────────
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [activeProviders, setActiveProviders] = useState<Record<string, string>>(() =>
    SERVICES.reduce((acc, s) => ({ ...acc, [s.id]: s.activeProvider }), {})
  );
  const [fieldValues, setFieldValues] = useState<Record<string, Record<string, string>>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [savedOk, setSavedOk] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getFieldValue = (serviceId: string, fieldKey: string) =>
    fieldValues[serviceId]?.[fieldKey] ?? '';

  const setFieldValue = (serviceId: string, fieldKey: string, value: string) => {
    setFieldValues((prev) => ({
      ...prev,
      [serviceId]: { ...(prev[serviceId] ?? {}), [fieldKey]: value },
    }));
  };

  const toggleSecret = (uniqueKey: string) =>
    setShowSecrets((prev) => ({ ...prev, [uniqueKey]: !prev[uniqueKey] }));

  const handleSave = useCallback(async (service: ServiceCategory) => {
    const providerId = activeProviders[service.id];
    const provider = service.providers.find((p) => p.id === providerId);
    if (!provider) return;

    setSaving((prev) => ({ ...prev, [service.id]: true }));
    setSavedOk((prev) => ({ ...prev, [service.id]: false }));
    setErrors((prev) => ({ ...prev, [service.id]: '' }));

    try {
      const payload = {
        serviceId: service.id,
        activeProvider: providerId,
        config: fieldValues[service.id] ?? {},
      };
      await apiClient.post('/app-settings/service-config', payload);
      setSavedOk((prev) => ({ ...prev, [service.id]: true }));
      setTimeout(() => setSavedOk((prev) => ({ ...prev, [service.id]: false })), 3000);
    } catch (err: any) {
      setErrors((prev) => ({
        ...prev,
        [service.id]: err?.response?.data?.message || 'Save failed. Check connection.',
      }));
    } finally {
      setSaving((prev) => ({ ...prev, [service.id]: false }));
    }
  }, [activeProviders, fieldValues]);

  // ── Color helpers ──────────────────────────────────────────────────────────
  const cardBg = isLight ? '#ffffff' : isDarkTheme ? '#0f172a' : '#03140a';
  const cardBorder = isLight ? '#e2e8f0' : isDarkTheme ? '#1e293b' : 'rgba(0,255,135,0.15)';
  const textPrimary = isLight ? '#0f172a' : '#f1f5f9';
  const textMuted = isLight ? '#64748b' : '#94a3b8';
  const inputBg = isLight ? '#f8fafc' : isDarkTheme ? '#1e293b' : 'rgba(0,255,135,0.04)';
  const inputBorder = isLight ? '#cbd5e1' : isDarkTheme ? '#334155' : 'rgba(0,255,135,0.2)';

  return (
    <View style={[sp.wrapper, { backgroundColor: isLight ? '#f8fafc' : isDarkTheme ? '#020617' : '#020d06' }]}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={[sp.headerCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <View style={[sp.headerIconBg, { backgroundColor: 'rgba(99,102,241,0.12)' }]}>
          <Ionicons name="git-network-outline" size={22} color="#6366f1" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[sp.headerTitle, { color: textPrimary }]}>Service Providers Hub</Text>
          <Text style={[sp.headerSub, { color: textMuted }]}>
            {SERVICES.length} integrations · Switch provider or update API keys instantly
          </Text>
        </View>
        <View style={[sp.liveChip, { backgroundColor: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.3)' }]}>
          <View style={sp.liveDot} />
          <Text style={sp.liveText}>Live</Text>
        </View>
      </View>

      {/* ── Service Cards ───────────────────────────────────────────────────── */}
      {SERVICES.map((service) => {
        const isExpanded = expandedService === service.id;
        const currentProviderId = activeProviders[service.id];
        const currentProvider = service.providers.find((p) => p.id === currentProviderId);
        const isSaving = saving[service.id];
        const isOk = savedOk[service.id];
        const errorMsg = errors[service.id];

        return (
          <View
            key={service.id}
            style={[sp.card, { backgroundColor: cardBg, borderColor: isExpanded ? service.accentColor + '55' : cardBorder }]}
          >
            {/* ── Card Header (always visible) ─────────────────────────────── */}
            <TouchableOpacity
              style={sp.cardHeader}
              onPress={() => setExpandedService(isExpanded ? null : service.id)}
              activeOpacity={0.8}
            >
              {/* Left icon */}
              <View style={[sp.serviceIconBg, { backgroundColor: service.accentColor + '18', borderColor: service.accentColor + '40' }]}>
                <Ionicons name={service.icon} size={18} color={service.accentColor} />
              </View>

              {/* Title + current provider */}
              <View style={{ flex: 1 }}>
                <Text style={[sp.serviceTitle, { color: textPrimary }]}>{service.title}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <Text style={sp.providerEmoji}>{currentProvider?.logo ?? '⚙️'}</Text>
                  <Text style={[sp.activeProviderName, { color: service.accentColor }]}>
                    {currentProvider?.name ?? '—'}
                  </Text>
                  <View style={[sp.activeBadge, { backgroundColor: service.accentColor + '18', borderColor: service.accentColor + '50' }]}>
                    <Text style={[sp.activeBadgeText, { color: service.accentColor }]}>ACTIVE</Text>
                  </View>
                </View>
              </View>

              {/* Alternatives count + chevron */}
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={[sp.altCount, { color: textMuted }]}>
                  {service.providers.length - 1} alt{service.providers.length !== 2 ? 's' : ''}
                </Text>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={textMuted}
                />
              </View>
            </TouchableOpacity>

            {/* ── Expanded Panel ─────────────────────────────────────────────── */}
            {isExpanded && (
              <View style={[sp.expandPanel, { borderTopColor: service.accentColor + '30' }]}>

                {/* Service description */}
                <Text style={[sp.serviceDesc, { color: textMuted }]}>{service.description}</Text>

                {/* Provider Selector Pills */}
                <Text style={[sp.sectionLabel, { color: textMuted }]}>SELECT PROVIDER</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
                  {service.providers.map((p) => {
                    const isActive = currentProviderId === p.id;
                    return (
                      <TouchableOpacity
                        key={p.id}
                        style={[
                          sp.providerPill,
                          {
                            backgroundColor: isActive ? service.accentColor : (isLight ? '#f1f5f9' : 'rgba(255,255,255,0.06)'),
                            borderColor: isActive ? service.accentColor : (isLight ? '#cbd5e1' : 'rgba(255,255,255,0.12)'),
                          },
                        ]}
                        onPress={() => setActiveProviders((prev) => ({ ...prev, [service.id]: p.id }))}
                        activeOpacity={0.8}
                      >
                        <Text style={sp.pillEmoji}>{p.logo}</Text>
                        <Text style={[sp.pillText, { color: isActive ? '#ffffff' : textPrimary }]}>{p.name}</Text>
                        {isActive && <Ionicons name="checkmark-circle" size={13} color="#ffffff" />}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Selected provider info */}
                {currentProvider && (
                  <View style={[sp.providerInfoBox, { backgroundColor: service.accentColor + '0D', borderColor: service.accentColor + '30' }]}>
                    <Text style={[sp.providerInfoDesc, { color: textMuted }]}>
                      ℹ️  {currentProvider.description}
                    </Text>
                  </View>
                )}

                {/* API Fields */}
                {currentProvider && (
                  <>
                    <Text style={[sp.sectionLabel, { color: textMuted }]}>API CREDENTIALS</Text>
                    <View style={{ gap: 10 }}>
                      {currentProvider.fields.map((field) => {
                        const uniqueKey = `${service.id}_${field.key}`;
                        const isVisible = !field.secret || showSecrets[uniqueKey];
                        return (
                          <View key={field.key}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                              <Text style={[sp.fieldLabel, { color: textPrimary }]}>{field.label}</Text>
                              {field.secret && (
                                <TouchableOpacity onPress={() => toggleSecret(uniqueKey)}>
                                  <Text style={[sp.toggleSecretText, { color: service.accentColor }]}>
                                    {isVisible ? '🙈 Hide' : '👁️ Show'}
                                  </Text>
                                </TouchableOpacity>
                              )}
                            </View>
                            {field.hint && (
                              <Text style={[sp.fieldHint, { color: textMuted }]}>💡 {field.hint}</Text>
                            )}
                            <View style={[sp.inputWrap, { backgroundColor: inputBg, borderColor: inputBorder }]}>
                              <TextInput
                                style={[sp.input, { color: textPrimary }]}
                                value={getFieldValue(service.id, field.key)}
                                onChangeText={(v) => setFieldValue(service.id, field.key, v)}
                                placeholder={field.placeholder}
                                placeholderTextColor={textMuted}
                                secureTextEntry={!isVisible}
                                autoCapitalize="none"
                                autoCorrect={false}
                              />
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </>
                )}

                {/* Error message */}
                {errorMsg ? (
                  <View style={sp.errorBox}>
                    <Ionicons name="alert-circle-outline" size={14} color="#dc2626" />
                    <Text style={sp.errorText}>{errorMsg}</Text>
                  </View>
                ) : null}

                {/* Save Button */}
                <TouchableOpacity
                  style={[
                    sp.saveBtn,
                    {
                      backgroundColor: isOk ? '#10b981' : isSaving ? (service.accentColor + 'aa') : service.accentColor,
                    },
                  ]}
                  onPress={() => handleSave(service)}
                  disabled={isSaving}
                  activeOpacity={0.85}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : isOk ? (
                    <>
                      <Ionicons name="checkmark-circle" size={16} color="#ffffff" />
                      <Text style={sp.saveBtnText}>Saved Successfully!</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="save-outline" size={16} color="#ffffff" />
                      <Text style={sp.saveBtnText}>
                        Save {currentProvider?.name} Config
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Warning note */}
                <View style={sp.warningBox}>
                  <Ionicons name="warning-outline" size={12} color="#b45309" />
                  <Text style={sp.warningText}>
                    Switching providers requires backend restart for env changes to take effect. API keys saved here are stored encrypted in DB.
                  </Text>
                </View>
              </View>
            )}
          </View>
        );
      })}

      <View style={{ height: 32 }} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const sp = StyleSheet.create({
  wrapper: { gap: 10, padding: SPACING.md },

  // Header card
  headerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: SPACING.md, borderRadius: RADIUS.xl,
    borderWidth: 1, marginBottom: 4,
  },
  headerIconBg: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontFamily: FONT.extraBold, letterSpacing: -0.2 },
  headerSub: { fontSize: 11.5, fontFamily: FONT.medium, marginTop: 2 },
  liveChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 9, paddingVertical: 4,
    borderRadius: RADIUS.pill, borderWidth: 1,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981' },
  liveText: { fontSize: 10, fontFamily: FONT.extraBold, color: '#10b981' },

  // Service card
  card: {
    borderRadius: RADIUS.xl, borderWidth: 1,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: SPACING.md,
  },
  serviceIconBg: {
    width: 40, height: 40, borderRadius: 12,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  serviceTitle: { fontSize: 13.5, fontFamily: FONT.extraBold },
  providerEmoji: { fontSize: 13 },
  activeProviderName: { fontSize: 12, fontFamily: FONT.bold },
  activeBadge: {
    paddingHorizontal: 5, paddingVertical: 1.5,
    borderRadius: RADIUS.pill, borderWidth: 1,
  },
  activeBadgeText: { fontSize: 8.5, fontFamily: FONT.extraBold },
  altCount: { fontSize: 10.5, fontFamily: FONT.medium },

  // Expanded panel
  expandPanel: {
    padding: SPACING.md, gap: 12,
    borderTopWidth: 1,
  },
  serviceDesc: { fontSize: 12, fontFamily: FONT.medium, lineHeight: 17 },
  sectionLabel: { fontSize: 9.5, fontFamily: FONT.extraBold, letterSpacing: 1.1 },

  // Provider pills
  providerPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: RADIUS.pill, borderWidth: 1.5,
  },
  pillEmoji: { fontSize: 14 },
  pillText: { fontSize: 12, fontFamily: FONT.bold },

  // Provider info box
  providerInfoBox: {
    borderRadius: RADIUS.md, borderWidth: 1,
    padding: 10,
  },
  providerInfoDesc: { fontSize: 11.5, fontFamily: FONT.medium, lineHeight: 17 },

  // Fields
  fieldLabel: { fontSize: 12, fontFamily: FONT.bold },
  fieldHint: { fontSize: 10.5, fontFamily: FONT.medium, marginBottom: 4, lineHeight: 15 },
  toggleSecretText: { fontSize: 11, fontFamily: FONT.bold },
  inputWrap: {
    borderRadius: RADIUS.md, borderWidth: 1.5,
    flexDirection: 'row', alignItems: 'center',
  },
  input: {
    flex: 1, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 12.5, fontFamily: FONT.medium,
  },

  // Error
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fee2e2', borderRadius: RADIUS.md,
    padding: 10, borderWidth: 1, borderColor: '#fecaca',
  },
  errorText: { flex: 1, fontSize: 12, fontFamily: FONT.medium, color: '#dc2626' },

  // Save button
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12, borderRadius: RADIUS.lg,
  },
  saveBtnText: { fontSize: 13.5, fontFamily: FONT.extraBold, color: '#ffffff' },

  // Warning
  warningBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    backgroundColor: '#fffbeb', borderRadius: RADIUS.md,
    padding: 9, borderWidth: 1, borderColor: '#fde68a',
  },
  warningText: { flex: 1, fontSize: 10.5, fontFamily: FONT.medium, color: '#92400e', lineHeight: 16 },
});
