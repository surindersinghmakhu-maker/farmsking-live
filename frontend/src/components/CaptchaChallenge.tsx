import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT, RADIUS } from '@/constants/theme';

export interface CaptchaRef {
  validate: () => boolean;
  refresh: () => void;
}

interface CaptchaChallengeProps {
  onValueChange?: (value: string) => void;
  onSubmitEditing?: () => void;
}

function generateCaptchaCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const CaptchaChallenge = forwardRef<CaptchaRef, CaptchaChallengeProps>(({ onValueChange, onSubmitEditing }, ref) => {
  const [code, setCode] = useState(generateCaptchaCode);
  const [userInput, setUserInput] = useState('');

  const refreshCaptcha = () => {
    const next = generateCaptchaCode();
    setCode(next);
    setUserInput('');
    if (onValueChange) onValueChange('');
  };

  useImperativeHandle(ref, () => ({
    validate: () => userInput.trim().toUpperCase() === code.toUpperCase(),
    refresh: refreshCaptcha,
  }));

  const handleChange = (text: string) => {
    setUserInput(text);
    if (onValueChange) onValueChange(text);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>🛡️ Security Verification (Captcha)</Text>
      
      <View style={styles.captchaRow}>
        <View style={styles.captchaBadgeWrap}>
          {/* Visual Captcha Box */}
          <View style={styles.captchaBadge}>
            <Text style={styles.captchaText}>{code.split('').join(' ')}</Text>
          </View>

          {/* Refresh Button */}
          <TouchableOpacity style={styles.refreshBtn} onPress={refreshCaptcha} activeOpacity={0.7}>
            <Ionicons name="refresh" size={18} color="#16a34a" />
          </TouchableOpacity>
        </View>

        {/* Input Box */}
        <TextInput
          style={styles.input}
          placeholder="Code"
          placeholderTextColor="#94a3b8"
          autoCapitalize="characters"
          maxLength={4}
          value={userInput}
          onChangeText={handleChange}
          returnKeyType="go"
          onSubmitEditing={onSubmitEditing}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 12,
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    color: '#334155',
    fontFamily: FONT.bold,
    marginBottom: 6,
  },
  captchaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  captchaBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  captchaBadge: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 85,
  },
  captchaText: {
    fontSize: 15,
    fontFamily: FONT.extraBold,
    color: '#38bdf8',
    letterSpacing: 2,
    fontStyle: 'italic',
    textDecorationLine: 'line-through',
  },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: '#dcfce7',
    borderWidth: 1.5,
    borderColor: '#86efac',
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 38,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: RADIUS.md,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#0f172a',
    textAlign: 'center',
    letterSpacing: 1,
  },
});
