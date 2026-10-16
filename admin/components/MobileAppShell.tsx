import React, { ReactNode } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useExecutiveTheme } from '@/src/store/theme-context';

interface MobileAppShellProps {
  children: ReactNode;
}

export const MobileAppShell: React.FC<MobileAppShellProps> = ({ children }) => {
  const { colors } = useExecutiveTheme();

  return (
    <View
      style={[
        styles.fullScreenContainer,
        { backgroundColor: colors.bg },
        Platform.OS === 'web' && ({ minHeight: '100vh', height: '100dvh', overflow: 'hidden' } as any),
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
});

