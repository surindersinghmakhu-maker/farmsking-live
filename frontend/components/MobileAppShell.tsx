import React, { ReactNode } from 'react';
import { View, StyleSheet, Platform } from 'react-native';

interface MobileAppShellProps {
  children: ReactNode;
}

export const MobileAppShell: React.FC<MobileAppShellProps> = ({ children }) => {
  // On Native Mobile (iOS/Android), render 100% full screen directly
  if (Platform.OS !== 'web') {
    return <View style={styles.nativeContainer}>{children}</View>;
  }

  // On Web, wrap in a centered Smartphone Container
  return (
    <View style={styles.webOuterCanvas}>
      {/* Smartphone Device Frame */}
      <View style={styles.phoneFrame}>
        {/* Smartphone Speaker / Notch Bar */}
        <View style={styles.notchBar}>
          <View style={styles.notchSpeaker} />
          <View style={styles.notchCamera} />
        </View>

        {/* App Content viewport */}
        <View style={styles.phoneViewport}>{children}</View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  nativeContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  webOuterCanvas: {
    flex: 1,
    width: '100%',
    height: '100vh' as any,
    backgroundColor: '#0b0f19',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  phoneFrame: {
    width: '100%',
    maxWidth: 440,
    height: '92vh' as any,
    maxHeight: 900,
    backgroundColor: '#ffffff',
    borderRadius: 36,
    borderWidth: 8,
    borderColor: '#1e293b',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000000',
    shadowOpacity: 0.5,
    shadowRadius: 25,
    shadowOffset: { width: 0, height: 12 },
    elevation: 20,
  },
  notchBar: {
    height: 24,
    backgroundColor: '#0f172a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    zIndex: 999,
  },
  notchSpeaker: {
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#334155',
  },
  notchCamera: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#334155',
  },
  phoneViewport: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#ffffff',
    position: 'relative',
  },
});
