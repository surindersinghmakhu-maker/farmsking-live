import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';

const theme = RoleThemes.FARMER;

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

type HireStatus = 'NONE' | 'PENDING' | 'ACTIVE';

const DEMO_ADVISOR = {
  name: 'Gurpreet Singh',
  specialization: 'Wheat & Cotton Specialist',
  avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
  visits: 3,
  consultations: 5,
  followUps: 1,
};

export default function MarketScreen() {
  const [hireStatus, setHireStatus] = useState<HireStatus>('NONE');
  const [requestedAt, setRequestedAt] = useState<string | null>(null);

  // Simulates the admin reviewing the hire request and assigning an advisor.
  useEffect(() => {
    if (hireStatus !== 'PENDING') return;
    const timer = setTimeout(() => {
      tap();
      setHireStatus('ACTIVE');
      if (Platform.OS === 'web') {
        alert(`✅ Admin ne aapki request approve kar di! ${DEMO_ADVISOR.name} ab aapke advisor hain.`);
      } else {
        Alert.alert('Advisor Assigned ✅', `Admin ne aapki request approve kar di! ${DEMO_ADVISOR.name} ab aapke advisor hain.`);
      }
    }, 4000);
    return () => clearTimeout(timer);
  }, [hireStatus]);

  const handleHire = () => {
    tap();
    setHireStatus('PENDING');
    setRequestedAt(new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }));
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.gradient} style={styles.hero}>
        <Text style={styles.heroTitle}>My Advisor</Text>
        <Text style={styles.heroSubtitle}>Expert guidance for your farm, on demand</Text>
      </LinearGradient>

      {hireStatus === 'NONE' && (
        <View style={styles.body}>
          <View style={styles.iconCircle}>
            <Ionicons name="school-outline" size={40} color={theme.primary} />
          </View>
          <Text style={styles.title}>No Advisor Hired Yet</Text>
          <Text style={styles.description}>
            Ek expert Farm Advisor hire karein jo aapki crops, spray schedule aur farm health me madad kare.
          </Text>

          <TouchableOpacity style={styles.hireBtnWrap} activeOpacity={0.85} onPress={handleHire}>
            <LinearGradient colors={theme.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.hireBtn}>
              <Ionicons name="person-add" size={18} color="#fff" />
              <Text style={styles.hireBtnText}>Hire an Advisor</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.previewRow}>
            {[
              { label: 'Farm Visits', icon: 'navigate-outline' },
              { label: 'Consultations', icon: 'chatbubbles-outline' },
              { label: 'Spray Plans', icon: 'flask-outline' },
            ].map((item) => (
              <View key={item.label} style={styles.previewCard}>
                <Ionicons name={item.icon as any} size={20} color={theme.primary} />
                <Text style={styles.previewLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {hireStatus === 'PENDING' && (
        <View style={styles.body}>
          <View style={[styles.iconCircle, { backgroundColor: '#fef3c7' }]}>
            <Ionicons name="hourglass-outline" size={40} color="#d97706" />
          </View>
          <Text style={styles.title}>Request Sent to Admin</Text>
          <Text style={styles.description}>
            Aapki hire request {requestedAt} ko admin ke paas bhej di gayi hai. Approve hote hi advisor assign ho jayega.
          </Text>

          <View style={styles.pendingChip}>
            <Ionicons name="time-outline" size={14} color="#b45309" />
            <Text style={styles.pendingChipText}>Awaiting Admin Approval...</Text>
          </View>
        </View>
      )}

      {hireStatus === 'ACTIVE' && (
        <ScrollView style={styles.activeScroll} contentContainerStyle={styles.activeContent} showsVerticalScrollIndicator={false}>
          {/* Advisor Profile Card */}
          <View style={[styles.advisorCard, premiumShadow(theme.primary, 'md')]}>
            <Image source={{ uri: DEMO_ADVISOR.avatarUrl }} style={styles.advisorAvatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.advisorName}>{DEMO_ADVISOR.name}</Text>
              <Text style={styles.advisorSpec}>{DEMO_ADVISOR.specialization}</Text>
              <View style={styles.activeBadge}>
                <Ionicons name="checkmark-circle" size={12} color="#16a34a" />
                <Text style={styles.activeBadgeText}>Active Since {requestedAt}</Text>
              </View>
            </View>
          </View>

          {/* Quick Stats */}
          <View style={[styles.statsRow, premiumShadow('#0f172a', 'sm')]}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{DEMO_ADVISOR.visits}</Text>
              <Text style={styles.statLabel}>Farm Visits</Text>
            </View>
            <View style={[styles.statItem, styles.statBorderLeft]}>
              <Text style={styles.statValue}>{DEMO_ADVISOR.consultations}</Text>
              <Text style={styles.statLabel}>Consultations</Text>
            </View>
            <View style={[styles.statItem, styles.statBorderLeft]}>
              <Text style={styles.statValue}>{DEMO_ADVISOR.followUps}</Text>
              <Text style={styles.statLabel}>Pending Follow-ups</Text>
            </View>
          </View>

          {/* Advisory Progress Timeline */}
          <View style={[styles.progressCard, premiumShadow('#0f172a', 'sm')]}>
            <Text style={styles.progressTitle}>Advisory Progress</Text>

            {[
              { label: 'Hire Request Sent', desc: `Sent to admin on ${requestedAt}`, done: true },
              { label: 'Admin Review', desc: 'Request reviewed & approved', done: true },
              { label: 'Advisor Assigned', desc: `${DEMO_ADVISOR.name} assigned to your farm`, done: true },
              { label: 'Ongoing Advisory', desc: 'Regular visits & consultations continue', done: false, current: true },
            ].map((step, idx, arr) => (
              <View key={step.label} style={styles.stepRow}>
                <View style={styles.stepMarkerCol}>
                  <View
                    style={[
                      styles.stepDot,
                      step.done ? { backgroundColor: '#16a34a' } : step.current ? { backgroundColor: theme.primary } : { backgroundColor: '#e2e8f0' },
                    ]}
                  >
                    {step.done ? <Ionicons name="checkmark" size={12} color="#fff" /> : null}
                  </View>
                  {idx < arr.length - 1 ? <View style={styles.stepLine} /> : null}
                </View>
                <View style={{ flex: 1, paddingBottom: 18 }}>
                  <Text style={[styles.stepLabel, step.current && { color: theme.primary }]}>{step.label}</Text>
                  <Text style={styles.stepDesc}>{step.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.messageBtn}
            activeOpacity={0.8}
            onPress={() => {
              tap();
              if (Platform.OS === 'web') alert('💬 Chat coming soon!');
              else Alert.alert('Coming Soon', 'Advisor chat is coming soon.');
            }}
          >
            <Ionicons name="chatbubbles-outline" size={18} color={theme.primary} />
            <Text style={[styles.messageBtnText, { color: theme.primary }]}>Message Advisor</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  hero: { paddingTop: 20, paddingBottom: 24, paddingHorizontal: SPACING.xxl },
  heroTitle: { color: '#fff', fontSize: 22, fontFamily: FONT.extraBold, letterSpacing: -0.2 },
  heroSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 13.5, fontFamily: FONT.medium, marginTop: 2 },
  body: { flex: 1, alignItems: 'center', padding: SPACING.xxl, paddingTop: 40 },
  iconCircle: {
    width: 84, height: 84, borderRadius: 42, backgroundColor: theme.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  title: { fontSize: 19, fontFamily: FONT.extraBold, color: '#0f172a' },
  description: {
    fontSize: 13.5, color: '#64748b', fontFamily: FONT.medium, textAlign: 'center',
    marginTop: 8, lineHeight: 20, maxWidth: 320,
  },
  hireBtnWrap: { width: '100%', maxWidth: 320, borderRadius: RADIUS.md, marginTop: 22, ...premiumShadow(theme.primary, 'sm') },
  hireBtn: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: RADIUS.md },
  hireBtnText: { color: '#fff', fontSize: 15, fontFamily: FONT.bold },
  previewRow: { flexDirection: 'row', gap: 10, marginTop: 28, width: '100%' },
  previewCard: {
    flex: 1, backgroundColor: '#ffffff', borderRadius: RADIUS.md, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#eef2f6',
  },
  previewLabel: { fontSize: 10.5, fontFamily: FONT.bold, color: '#334155', textAlign: 'center' },
  pendingChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a',
    borderRadius: RADIUS.pill, paddingHorizontal: 14, paddingVertical: 8, marginTop: 22,
  },
  pendingChipText: { fontSize: 12.5, fontFamily: FONT.bold, color: '#b45309' },
  activeScroll: { flex: 1 },
  activeContent: { padding: SPACING.lg, gap: SPACING.md, paddingBottom: SPACING.xxl },
  advisorCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.lg,
  },
  advisorAvatar: { width: 60, height: 60, borderRadius: 30 },
  advisorName: { fontSize: 16, fontFamily: FONT.extraBold, color: '#0f172a' },
  advisorSpec: { fontSize: 12.5, fontFamily: FONT.medium, color: '#64748b', marginTop: 2 },
  activeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  activeBadgeText: { fontSize: 11, fontFamily: FONT.bold, color: '#16a34a' },
  statsRow: { flexDirection: 'row', backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.lg },
  statItem: { flex: 1, alignItems: 'center' },
  statBorderLeft: { borderLeftWidth: 1, borderLeftColor: '#f1f5f9' },
  statValue: { fontSize: 18, fontFamily: FONT.extraBold, color: '#0f172a' },
  statLabel: { fontSize: 11, fontFamily: FONT.medium, color: '#64748b', marginTop: 4, textAlign: 'center' },
  progressCard: { backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.lg },
  progressTitle: { fontSize: 15.5, fontFamily: FONT.bold, color: '#0f172a', marginBottom: 14 },
  stepRow: { flexDirection: 'row', gap: 12 },
  stepMarkerCol: { alignItems: 'center' },
  stepDot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stepLine: { flex: 1, width: 2, backgroundColor: '#e2e8f0', marginVertical: 2 },
  stepLabel: { fontSize: 13.5, fontFamily: FONT.bold, color: '#0f172a' },
  stepDesc: { fontSize: 12, fontFamily: FONT.medium, color: '#64748b', marginTop: 2 },
  messageBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: theme.primary,
    borderRadius: RADIUS.md, paddingVertical: 13,
  },
  messageBtnText: { fontSize: 14, fontFamily: FONT.bold },
});
