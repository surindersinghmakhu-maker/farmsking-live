/**
 * @file ResponsiveContentWrapper.tsx
 * @description Reusable layout wrapper that:
 *   - On mobile  (< 768 px): fills 100% width with proper bottom padding for the floating tab bar.
 *   - On desktop (≥ 768 px): constrains content to a comfortable maxWidth, centres it, and
 *     removes the bottom tab-bar padding (sidebar navigation is used instead).
 *
 * Usage:
 *   Wrap the root `<View>` / `<ScrollView>` of any admin page with this component so the page
 *   content is always "fit to screen" without horizontal overflow or dead-space on large displays.
 *
 * @author FarmsKing Admin Team
 */

import React from 'react';
import { View, StyleSheet, useWindowDimensions, ViewStyle } from 'react-native';
import { useExecutiveTheme } from '@/src/store/theme-context';

// ─── Breakpoints (must match _layout.tsx) ──────────────────────────────────────
const DESKTOP_BP = 768;   // px — sidebar kicks in at this width
const MAX_CONTENT_W = 1400; // px — cap content width on ultra-wide monitors

interface ResponsiveContentWrapperProps {
  children: React.ReactNode;
  /** Extra style applied to the outer wrapper (useful for background colour). */
  style?: ViewStyle;
  /** When true the inner container will NOT have horizontal padding — useful for
   *  full-bleed hero sections / table pages that manage their own padding. */
  noPadding?: boolean;
}

/**
 * Responsive layout shell for every admin page.
 *
 * @param children     — Page content.
 * @param style        — Optional extra styles on the outer `<View>`.
 * @param noPadding    — Suppress default horizontal padding on desktop.
 */
export function ResponsiveContentWrapper({
  children,
  style,
  noPadding = false,
}: ResponsiveContentWrapperProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_BP;
  const { colors } = useExecutiveTheme();

  return (
    <View
      style={[
        styles.outer,
        { backgroundColor: colors.bg },
        style,
      ]}
    >
      <View
        style={[
          styles.inner,
          isDesktop && styles.innerDesktop,
          isDesktop && !noPadding && styles.innerDesktopPadding,
          // Mobile: add bottom padding so content clears the floating tab bar
          !isDesktop && styles.innerMobile,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

// ─── Convenience hook ──────────────────────────────────────────────────────────
/**
 * Returns layout helpers so individual pages can adapt their own internals
 * without depending on the wrapper component directly.
 *
 * @returns `{ isDesktop, isMobile, screenWidth, contentMaxWidth }`
 */
export function useResponsiveLayout() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_BP;
  return {
    isDesktop,
    isMobile: !isDesktop,
    screenWidth: width,
    contentMaxWidth: MAX_CONTENT_W,
  };
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    // Clip any accidental horizontal overflow (e.g. wide tables on narrow viewports)
    overflow: 'hidden' as any,
  },
  inner: {
    flex: 1,
  },
  innerMobile: {
    // Reserve space for the absolute-positioned floating bottom tab bar (height 64 + safe area)
    paddingBottom: 72,
  },
  innerDesktop: {
    // Centre the content column and constrain it so it doesn't stretch across 4K monitors
    alignSelf: 'stretch' as any,
    width: '100%',
    maxWidth: MAX_CONTENT_W,
    // Centre within the content canvas when screen is wider than maxWidth
    marginHorizontal: 'auto' as any,
  },
  innerDesktopPadding: {
    // Comfortable side-padding on desktop when pages don't manage their own
    paddingHorizontal: 0, // pages already have their own padding — keep 0 to avoid double-padding
  },
});
