import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';

const theme = RoleThemes.FARM_ADVISOR;

const THREADS = [
  { name: 'Kisan Veer', message: 'Sir, kab tak spray karna hai?', time: '2m', unread: true },
  { name: 'Gurpreet Singh', message: 'Thank you for the advice', time: '1h', unread: false },
  { name: 'Baljeet Kaur', message: 'Leaf yellowing photo sent', time: '3h', unread: true },
  { name: 'Harjeet Singh', message: 'Ok, will do tomorrow', time: 'Yesterday', unread: false },
];

export default function ChatScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Chat</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {THREADS.map((t) => (
          <TouchableOpacity key={t.name} style={styles.row} activeOpacity={0.7}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={18} color={theme.primary} />
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{t.name}</Text>
              <Text style={[styles.message, t.unread && styles.messageUnread]} numberOfLines={1}>{t.message}</Text>
            </View>
            <View style={styles.right}>
              <Text style={styles.time}>{t.time}</Text>
              {t.unread && <View style={styles.unreadDot} />}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  hero: { paddingTop: 20, paddingBottom: 16, paddingHorizontal: SPACING.xxl, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  heroTitle: { fontSize: 19, fontFamily: FONT.extraBold, color: '#0f172a' },
  list: { paddingHorizontal: SPACING.xxl },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.primaryLight, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  name: { fontSize: 14.5, fontFamily: FONT.bold, color: '#0f172a' },
  message: { fontSize: 12.5, color: '#64748b', fontFamily: FONT.medium, marginTop: 2 },
  messageUnread: { color: '#0f172a', fontFamily: FONT.semiBold },
  right: { alignItems: 'flex-end', gap: 6 },
  time: { fontSize: 11, color: '#94a3b8', fontFamily: FONT.medium },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.primary },
});
