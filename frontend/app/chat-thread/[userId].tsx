import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING } from '@/constants/theme';
import { useAuth } from '@/src/store/auth-context';
import { useChatThread, useOnlineStatus } from '@/src/hooks/useChat';
import { useUserWeather } from '@/src/hooks/useWeather';
import { ChatMessage } from '@/src/types/api';

const CONDITION_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  Clear: 'sunny',
  Clouds: 'cloudy',
  Rain: 'rainy',
  Drizzle: 'rainy',
  Thunderstorm: 'thunderstorm',
  Snow: 'snow',
  Fog: 'cloud-outline',
};

const theme = RoleThemes.FARMER;

type ThreadRow = { type: 'date'; key: string; label: string } | { type: 'message'; key: string; item: ChatMessage };

function dateLabelFor(iso: string): string {
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function buildThreadRows(messages: ChatMessage[]): ThreadRow[] {
  const rows: ThreadRow[] = [];
  let lastDateKey = '';
  messages.forEach((item) => {
    const dateKey = new Date(item.createdAt).toDateString();
    if (dateKey !== lastDateKey) {
      rows.push({ type: 'date', key: `date-${dateKey}`, label: dateLabelFor(item.createdAt) });
      lastDateKey = dateKey;
    }
    rows.push({ type: 'message', key: item.id, item });
  });
  return rows;
}

export default function ChatThreadScreen() {
  const { userId, name } = useLocalSearchParams<{ userId: string; name?: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { data: messages, isLoading, sendMessage } = useChatThread(userId);
  const isPartnerOnline = useOnlineStatus(userId);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const listRef = useRef<FlatList>(null);
  const threadRows = useMemo(() => buildThreadRows(messages ?? []), [messages]);

  // An advisor gets a peek at their farmer's/gardener's local weather right in the chat header.
  const isAdvisorViewer = user?.role === 'ADVISOR';
  const { data: partnerWeather } = useUserWeather(isAdvisorViewer ? userId : undefined);

  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [messages?.length]);

  const handleSend = async () => {
    if (!draft.trim() || isSending) return;
    const content = draft;
    setDraft('');
    setIsSending(true);
    try {
      await sendMessage(content);
    } catch (err: any) {
      setDraft(content);
      const message = err?.message ?? 'Could not send message.';
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Message not sent', message);
      }
    } finally {
      setIsSending(false);
    }
  };

  const renderItem = ({ item: row }: { item: ThreadRow }) => {
    if (row.type === 'date') {
      return (
        <View style={styles.dateSeparatorRow}>
          <Text style={styles.dateSeparatorText}>{row.label}</Text>
        </View>
      );
    }
    const item = row.item;
    const isMine = item.senderId === user?.id;
    return (
      <View style={[styles.bubbleRow, isMine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
          <Text style={[styles.bubbleText, isMine && { color: '#ffffff' }]}>{item.content}</Text>
          <Text style={[styles.bubbleTime, isMine && { color: 'rgba(255,255,255,0.7)' }]}>
            {new Date(item.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.75}>
          <Ionicons name="arrow-back" size={18} color="#0f172a" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle} numberOfLines={1}>{name ?? 'Chat'}</Text>
          <View style={styles.headerStatusRow}>
            <View style={[styles.headerPresenceDot, { backgroundColor: isPartnerOnline ? '#22c55e' : '#cbd5e1' }]} />
            <Text style={styles.headerStatusText}>{isPartnerOnline ? 'Online' : 'Offline'}</Text>
          </View>
        </View>
        <View style={{ width: 34 }} />
      </View>

      {isAdvisorViewer && partnerWeather ? (
        <View style={styles.weatherStrip}>
          <Ionicons name={CONDITION_ICON[partnerWeather.condition] ?? 'partly-sunny'} size={16} color={theme.primary} />
          <Text style={styles.weatherText}>
            {partnerWeather.temperatureC}°C · {partnerWeather.condition} · 📍 {partnerWeather.locationLabel}
          </Text>
        </View>
      ) : null}

      {isLoading ? (
        <ActivityIndicator color={theme.primary} style={{ marginTop: 30 }} />
      ) : (
        <FlatList
          ref={listRef}
          data={threadRows}
          keyExtractor={(row) => row.key}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.emptyCenter}>
              <Ionicons name="chatbubble-ellipses-outline" size={36} color="#cbd5e1" />
              <Text style={styles.emptyText}>Say hello 👋</Text>
            </View>
          }
        />
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor="#94a3b8"
          value={draft}
          onChangeText={setDraft}
          multiline
        />
        <TouchableOpacity style={styles.sendButton} activeOpacity={0.85} onPress={handleSend} disabled={isSending}>
          {isSending ? <ActivityIndicator color="#ffffff" size="small" /> : <Ionicons name="send" size={18} color="#ffffff" />}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.OS === 'web' ? 18 : 50,
    paddingBottom: SPACING.md,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  headerTitleWrap: { flex: 1, alignItems: 'center' },
  headerTitle: { textAlign: 'center', fontSize: 15, fontFamily: FONT.extraBold, color: '#0f172a' },
  headerStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  headerPresenceDot: { width: 7, height: 7, borderRadius: 3.5 },
  headerStatusText: { fontSize: 10.5, fontFamily: FONT.semiBold, color: '#94a3b8' },
  dateSeparatorRow: { alignItems: 'center', marginVertical: 6 },
  dateSeparatorText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#94a3b8',
    backgroundColor: '#eef2f6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  weatherStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 7,
    backgroundColor: '#f0fdf4',
    borderBottomWidth: 1,
    borderBottomColor: '#dcfce7',
  },
  weatherText: { fontSize: 11.5, fontFamily: FONT.semiBold, color: '#166534' },
  list: { padding: SPACING.lg, gap: 8, flexGrow: 1 },
  emptyCenter: { alignItems: 'center', justifyContent: 'center', padding: 60, gap: 8 },
  emptyText: { fontSize: 13.5, fontFamily: FONT.medium, color: '#94a3b8' },
  bubbleRow: { flexDirection: 'row' },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubbleRowTheirs: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '78%', borderRadius: RADIUS.lg, paddingHorizontal: 12, paddingVertical: 9 },
  bubbleMine: { backgroundColor: theme.primary, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, fontFamily: FONT.medium, color: '#0f172a' },
  bubbleTime: { fontSize: 9.5, fontFamily: FONT.medium, color: '#94a3b8', marginTop: 3, textAlign: 'right' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: SPACING.md,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  input: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: RADIUS.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: FONT.medium,
    backgroundColor: '#f8fafc',
    color: '#0f172a',
    maxHeight: 100,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
