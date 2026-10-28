import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/store/auth-context';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';
import { PortalId, PORTALS, isRoleAllowedInPortal, getPortalForRole, saveActivePortal } from './portalConfig';

interface PortalGuardProps {
  portalId: PortalId;
  children: React.ReactNode;
}

export function PortalGuard({ portalId, children }: PortalGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const portal = PORTALS[portalId];

  useEffect(() => {
    if (isLoading || !user) return;

    // Check authorization
    const allowed = isRoleAllowedInPortal(user.role, portalId);
    if (!allowed) {
      // Smart redirect to their authorized portal
      const targetPortalId = getPortalForRole(user.role);
      const targetPortal = PORTALS[targetPortalId];
      console.warn(`[PortalGuard] User role ${user.role} unauthorized for ${portalId}. Smart redirecting to ${targetPortal.urlPrefix}`);
      router.replace(targetPortal.urlPrefix as any);
      return;
    }

    // Save active portal in session
    saveActivePortal(portalId);
  }, [user, isLoading, portalId]);

  if (isLoading || !user) {
    return (
      <View style={[styles.centerLoading, { backgroundColor: portal.sidebarBg }]}>
        <Ionicons name={portal.icon as any} size={36} color={portal.primaryColor} />
        <Text style={[styles.loadingText, { color: portal.primaryColor }]}>
          Loading {portal.name}...
        </Text>
      </View>
    );
  }

  const isSuperAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(user.role);
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768 && (Platform.OS !== 'web' || (typeof window !== 'undefined' && window.innerWidth >= 768));

  return (
    <View
      style={[
        styles.container,
        Platform.OS === 'web' && ({ height: '100dvh', maxHeight: '100dvh', maxWidth: '100vw', overflowX: 'hidden' } as any),
      ]}
    >
      <View style={styles.contentWrap}>
        {children}
      </View>
    </View>
  );
}

/**
 * Top floating / header switcher for SUPER_ADMIN to effortlessly pivot between portals
 */
export function PortalSwitcherBar({ currentPortalId }: { currentPortalId?: PortalId }) {
  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    maxWidth: '100%',
    height: '100%',
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? ({ maxWidth: '100vw', overflowX: 'hidden' } as any) : {}),
  },
  contentWrap: {
    flex: 1,
    width: '100%',
    maxWidth: '100%',
    height: '100%',
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? ({ maxWidth: '100vw', overflowX: 'hidden' } as any) : {}),
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: FONT.bold,
  },
  switcherBar: {
    height: 42,
    maxWidth: '100%',
    backgroundColor: '#070f1e',
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 99,
    overflow: 'hidden',
    flexShrink: 0,
  },
  switcherLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
  },
  portalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    flexShrink: 0,
  },
  portalBadgeText: {
    fontSize: 9.5,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  portalTitleText: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#f8fafc',
    flexShrink: 1,
  },
  portalTaglineText: {
    fontSize: 11,
    fontFamily: FONT.regular,
    color: '#94a3b8',
  },
  switchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    flexShrink: 0,
  },
  switchBtnText: {
    fontSize: 11,
    fontFamily: FONT.bold,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 50,
    paddingRight: 20,
  },
  dropdownCard: {
    width: 330,
    backgroundColor: '#0f172a',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 8,
    ...premiumShadow('#000000', 'lg'),
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    marginBottom: 4,
  },
  dropdownHeaderText: {
    fontSize: 12,
    fontFamily: FONT.extraBold,
    color: '#f8fafc',
    letterSpacing: 0.2,
  },
  portalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: RADIUS.md,
  },
  optionIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  optionSub: {
    fontSize: 10,
    fontFamily: FONT.regular,
    color: '#94a3b8',
    marginTop: 1,
  },
  activePill: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: RADIUS.pill,
  },
  activePillText: {
    fontSize: 8.5,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
});
