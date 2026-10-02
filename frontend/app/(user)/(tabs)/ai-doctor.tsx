import React from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar, Text } from 'react-native';
import { AgriAiChatbot } from '@/src/components/AgriAiChatbot';
import { useExecutiveTheme } from '@/src/store/theme-context';
import { FONT, RADIUS } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function AiDoctorScreen() {
  const { colors } = useExecutiveTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <StatusBar
        barStyle={colors.statusBarStyle === 'light' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.headerBg}
      />
      {/* ISO Header Bar */}
      <View style={[styles.headerBar, { backgroundColor: colors.headerBg, borderBottomColor: colors.cardBorder }]}>
        <View style={styles.headerLeft}>
          <View style={styles.aiBadgeIcon}>
            <Ionicons name="sparkles" size={18} color="#ffffff" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Farmsking Kisan AI Doctor 🌾</Text>
            <Text style={styles.headerSubtitle}>Google Gemini 2.5 Flash Grounded · All India Farmers</Text>
          </View>
        </View>
      </View>

      {/* Main Chat View */}
      <View style={styles.container}>
        <AgriAiChatbot isModal={false} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiBadgeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#16a34a',
  },
  container: {
    flex: 1,
  },
});
