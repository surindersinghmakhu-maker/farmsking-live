import React, { ReactNode } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useExecutiveTheme } from '@/src/store/theme-context';

interface MobileAppShellProps {
  children: ReactNode;
}

/**
 * MobileAppShell
 * Provides root styling and theme canvas.
 * - On Web: 100% full-width responsive canvas that scales naturally across laptop/PC and mobile screens.
 * - On Native Mobile: full screen container.
 */
export const MobileAppShell: React.FC<MobileAppShellProps> = ({ children }) => {
  const { colors } = useExecutiveTheme();

  return (
    <View style={[styles.canvas, { backgroundColor: colors.bg }]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
    width: '100%',
    minHeight: '100%',
    ...(Platform.OS === 'web'
      ? ({
          minHeight: '100vh',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
        } as any)
      : {}),
  },
});
