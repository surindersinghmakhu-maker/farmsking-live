import React, { useState } from 'react';
import { Platform, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';

/** Small icon button that copies `value` to the clipboard, e.g. next to a coupon code. */
export function CopyButton({ value, color = '#64748b', size = 15 }: { value: string; color?: string; size?: number }) {
  const [copied, setCopied] = useState(false);

  const handlePress = async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Clipboard.setStringAsync(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <TouchableOpacity style={styles.btn} activeOpacity={0.7} onPress={handlePress}>
      <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={size} color={copied ? '#16a34a' : color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
});
