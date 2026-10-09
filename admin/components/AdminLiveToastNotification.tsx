import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';

export interface ToastAlert {
  id: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  title: string;
  message: string;
}

export function AdminLiveToastNotification() {
  const [toasts, setToasts] = useState<ToastAlert[]>([]);

  useEffect(() => {
    // Listen for custom live audit alerts
    const handleCustomToast = (event: any) => {
      if (event.detail) {
        const newToast: ToastAlert = {
          id: Date.now().toString(),
          ...event.detail,
        };
        setToasts((prev) => [newToast, ...prev.slice(0, 3)]);

        // Auto dismiss after 5 seconds
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
        }, 5000);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('admin-live-toast', handleCustomToast);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('admin-live-toast', handleCustomToast);
      }
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <View style={styles.toastContainer}>
      {toasts.map((toast) => (
        <View key={toast.id} style={[styles.toastCard, premiumShadow('#000000', 'md') as any]}>
          <View style={styles.iconWrap}>
            <Ionicons
              name={
                toast.type === 'SUCCESS' ? 'checkmark-circle' :
                toast.type === 'WARNING' ? 'warning' :
                toast.type === 'ALERT' ? 'alert-circle' : 'notifications'
              }
              size={18}
              color={
                toast.type === 'SUCCESS' ? '#10b981' :
                toast.type === 'WARNING' ? '#f59e0b' :
                toast.type === 'ALERT' ? '#ef4444' : '#00ff87'
              }
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.toastTitle}>{toast.title}</Text>
            <Text style={styles.toastMessage}>{toast.message}</Text>
          </View>
          <TouchableOpacity
            onPress={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
          >
            <Ionicons name="close" size={14} color="#64748b" />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 9999,
    width: 340,
    gap: 8,
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#04180d',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.3)',
    borderRadius: RADIUS.lg,
    padding: 12,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 255, 135, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastTitle: {
    fontSize: 12.5,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  toastMessage: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    marginTop: 2,
  },
});
