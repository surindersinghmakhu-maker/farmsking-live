import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';

export interface ToastAlert {
  id: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  title: string;
  message: string;
}

/**
 * Universal helper to dispatch executive non-blocking live toast alerts
 */
export function showAdminToast(
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT',
  title: string,
  message: string
) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('admin-live-toast', {
        detail: { type, title, message },
      })
    );
  } else {
    // For Native or fallback
    if (typeof (globalThis as any).adminToastListener === 'function') {
      (globalThis as any).adminToastListener({ type, title, message });
    }
  }
}

export function AdminLiveToastNotification() {
  const [toasts, setToasts] = useState<ToastAlert[]>([]);
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  useEffect(() => {
    // Listen for custom live audit alerts
    const handleToastPayload = (payload: any) => {
      if (payload) {
        const newToast: ToastAlert = {
          id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
          ...payload,
        };
        setToasts((prev) => [newToast, ...prev.slice(0, 2)]);

        // Auto dismiss after 4.5 seconds
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
        }, 4500);
      }
    };

    const handleCustomToast = (event: any) => {
      if (event && event.detail) {
        handleToastPayload(event.detail);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('admin-live-toast', handleCustomToast);
    }
    (globalThis as any).adminToastListener = handleToastPayload;

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('admin-live-toast', handleCustomToast);
      }
      delete (globalThis as any).adminToastListener;
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <View
      style={[
        styles.toastContainer,
        isMobile
          ? { top: 12, left: 12, right: 12, width: 'auto', maxWidth: 440, alignSelf: 'center' }
          : { top: 16, right: 20, width: 360 },
      ]}
      pointerEvents="box-none"
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'SUCCESS';
        const isWarning = toast.type === 'WARNING';
        const isAlert = toast.type === 'ALERT';

        const borderColor = isSuccess
          ? '#10b981'
          : isWarning
          ? '#f59e0b'
          : isAlert
          ? '#ef4444'
          : '#3b82f6';

        const iconBg = isSuccess
          ? '#ecfdf5'
          : isWarning
          ? '#fffbeb'
          : isAlert
          ? '#fef2f2'
          : '#eff6ff';

        const iconColor = isSuccess
          ? '#059669'
          : isWarning
          ? '#d97706'
          : isAlert
          ? '#dc2626'
          : '#2563eb';

        return (
          <View
            key={toast.id}
            style={[
              styles.toastCard,
              { borderLeftColor: borderColor, borderLeftWidth: 4 },
              premiumShadow('#000000', 'md') as any,
            ]}
          >
            <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
              <Ionicons
                name={
                  isSuccess
                    ? 'checkmark-circle'
                    : isWarning
                    ? 'warning'
                    : isAlert
                    ? 'alert-circle'
                    : 'notifications'
                }
                size={18}
                color={iconColor}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.toastTitle} numberOfLines={1}>
                {toast.title}
              </Text>
              <Text style={styles.toastMessage} numberOfLines={2}>
                {toast.message}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.closeBtn}
            >
              <Ionicons name="close" size={16} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    zIndex: 99999,
    gap: 8,
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    ...premiumShadow('#0f172a', 'sm') as any,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastTitle: {
    fontSize: 12.5,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  toastMessage: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#475569',
    marginTop: 2,
    lineHeight: 15,
  },
  closeBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
});

