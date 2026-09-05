import React, { ReactNode } from 'react';
import { View, StyleSheet, Platform, useWindowDimensions } from 'react-native';

interface MobileAppShellProps {
  children: ReactNode;
}

export const MobileAppShell: React.FC<MobileAppShellProps> = ({ children }) => {
  const { width, height } = useWindowDimensions();

  // On Native Mobile or compact web viewports (mobile web browser), render 100% full screen
  if (Platform.OS !== 'web' || width <= 500 || height <= 720) {
    return <View style={styles.nativeContainer}>{children}</View>;
  }

  // On Desktop/Laptop Web, wrap in a centered Smartphone Frame container
  return (
    <View style={styles.webOuterCanvas}>
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
    width: '100%',
    height: '100%',
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
    borderRadius: 32,
    borderWidth: 6,
    borderColor: '#1e293b',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000000',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 16,
  },
  notchBar: {
    height: 22,
    backgroundColor: '#0f172a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    zIndex: 999,
  },
  notchSpeaker: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#334155',
  },
  notchCamera: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
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

