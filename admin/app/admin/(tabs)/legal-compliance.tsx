import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FONT, RADIUS } from '@/constants/theme';
import { useExecutiveTheme } from '@/src/store/theme-context';
import { AdvocateComplianceDesk } from '@/components/compliance/AdvocateComplianceDesk';

export default function LegalComplianceScreen() {
  const router = useRouter();
  const { colors, cardBg, cardBorder, textColor, subTextColor } = useExecutiveTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.topBar, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={textColor} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: textColor }]}>Advocate &amp; Legal Compliance Desk</Text>
          <Text style={[styles.sub, { color: subTextColor }]}>
            FARMSKING TECHNOLOGIES PRIVATE LIMITED · Corporate Law, Gateway &amp; License Governance
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <AdvocateComplianceDesk mode="STANDALONE" />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 6,
    borderRadius: RADIUS.md,
  },
  title: { fontSize: 16, fontFamily: FONT.extraBold },
  sub: { fontSize: 11.5, fontFamily: FONT.medium },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
});
