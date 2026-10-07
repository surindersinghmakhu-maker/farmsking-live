import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useAuth } from '@/src/store/auth-context';
import { useChatThread, useOnlineStatus } from '@/src/hooks/useChat';
import { useUserWeather } from '@/src/hooks/useWeather';
import { ChatMessage } from '@/src/types/api';
import { Avatar } from '@/src/components/Avatar';

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

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

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
  const { userId, name, mobile, photoUrl } = useLocalSearchParams<{
    userId: string;
    name?: string;
    mobile?: string;
    photoUrl?: string;
  }>();
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
    tap();
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

  const handleCall = () => {
    tap();
    if (mobile) {
      Linking.openURL(`tel:${mobile}`);
    } else {
      Alert.alert('Contact Number', 'Mobile number is not available for direct call.');
    }
  };

  const renderItem = ({ item: row }: { item: ThreadRow }) => {
    if (row.type === 'date') {
      return (
        <View style={styles.dateSeparatorRow}>
          <View style={styles.dateBadge}>
            <Text style={styles.dateSeparatorText}>{row.label}</Text>
          </View>
        </View>
      );
    }
    const item = row.item;
    const isMine = item.senderId === user?.id;
    return (
      <View style={[styles.bubbleRow, isMine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
        <View
          style={[
            styles.bubble,
            isMine ? styles.bubbleMine : styles.bubbleTheirs,
            premiumShadow('#0f172a', 'sm'),
          ]}
        >
          <Text style={[styles.bubbleText, isMine && { color: '#ffffff' }]}>{item.content}</Text>
          <View style={styles.bubbleFooter}>
            <Text style={[styles.bubbleTime, isMine && { color: 'rgba(255,255,255,0.75)' }]}>
              {new Date(item.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </Text>
            {isMine && (
              <Ionicons
                name={item.isRead ? 'checkmark-done' : 'checkmark'}
                size={14}
                color={item.isRead ? '#38bdf8' : 'rgba(255,255,255,0.75)'}
                style={{ marginLeft: 3 }}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Hide Expo Router's default raw route header ("chat-thread/[userId]") */}
      <Stack.Screen options={{ headerShown: false }} />

      {/* Professional Custom Header Bar */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            tap();
            router.back();
          }}
          activeOpacity={0.75}
        >
          <Ionicons name="arrow-back" size={20} color="#0f172a" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerProfileWrap} activeOpacity={0.85}>
          <View style={styles.avatarWrapper}>
            <Avatar uri={photoUrl} size={38} />
            <View style={[styles.presenceDot, { backgroundColor: isPartnerOnline ? '#22c55e' : '#cbd5e1' }]} />
          </View>
          <View style={styles.headerTextGroup}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {name ?? 'Chat'}
            </Text>
            <View style={styles.statusRow}>
              <Text style={[styles.headerStatusText, isPartnerOnline && { color: '#16a34a', fontFamily: FONT.bold }]}>
                {isPartnerOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {mobile ? (
          <TouchableOpacity style={styles.callButton} activeOpacity={0.8} onPress={handleCall}>
            <Ionicons name="call" size={17} color={theme.primary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>

      {/* Advisor Weather Strip */}
      {isAdvisorViewer && partnerWeather ? (
        <View style={styles.weatherStrip}>
          <Ionicons name={CONDITION_ICON[partnerWeather.condition] ?? 'partly-sunny'} size={16} color={theme.primary} />
          <Text style={styles.weatherText}>
            {partnerWeather.temperatureC}°C · {partnerWeather.condition} · 📍 {partnerWeather.locationLabel}
          </Text>
        </View>
      ) : null}

      {/* Chat Thread Messages */}
      {isLoading ? (
        <ActivityIndicator color={theme.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          ref={listRef}
          data={threadRows}
          keyExtractor={(row) => row.key}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.emptyCenter}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="chatbubbles-outline" size={32} color={theme.primary} />
              </View>
              <Text style={styles.emptyTitle}>Start a Conversation</Text>
              <Text style={styles.emptySub}>Send a message to consult on crops, schedules, or queries 👋</Text>
            </View>
          }
        />
      )}

      {/* Floating Bottom Input Bar */}
      <View style={styles.inputContainer}>
        <View style={styles.inputCard}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor="#94a3b8"
            value={draft}
            onChangeText={setDraft}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, !draft.trim() && styles.sendButtonDisabled]}
            activeOpacity={0.85}
            onPress={handleSend}
            disabled={!draft.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Ionicons name="send" size={17} color="#ffffff" style={{ marginLeft: 2 }} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: Platform.OS === 'web' ? 14 : 46,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    ...premiumShadow('#0f172a', 'sm'),
    zIndex: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerProfileWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 8,
  },
  avatarWrapper: {
    position: 'relative',
  },
  presenceDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  headerTextGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  headerStatusText: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  callButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weatherStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 7,
    backgroundColor: '#e0f2fe',
    borderBottomWidth: 1,
    borderBottomColor: '#bae6fd',
  },
  weatherText: {
    fontSize: 11.5,
    fontFamily: FONT.semiBold,
    color: '#0369a1',
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 20,
    gap: 10,
    flexGrow: 1,
  },
  dateSeparatorRow: {
    alignItems: 'center',
    marginVertical: 8,
  },
  dateBadge: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  dateSeparatorText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#475569',
  },
  emptyCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
    gap: 8,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  emptySub: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#64748b',
    textAlign: 'center',
  },
  bubbleRow: {
    flexDirection: 'row',
    marginVertical: 2,
  },
  bubbleRowMine: {
    justifyContent: 'flex-end',
  },
  bubbleRowTheirs: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMine: {
    backgroundColor: theme.primary,
    borderBottomRightRadius: 3,
  },
  bubbleTheirs: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderBottomLeftRadius: 3,
  },
  bubbleText: {
    fontSize: 14,
    fontFamily: FONT.medium,
    color: '#0f172a',
    lineHeight: 19,
  },
  bubbleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  bubbleTime: {
    fontSize: 9.5,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  inputContainer: {
    padding: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8fafc',
    borderRadius: RADIUS.pill,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    paddingLeft: 14,
    paddingRight: 4,
    paddingVertical: Platform.OS === 'ios' ? 4 : 2,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONT.medium,
    color: '#0f172a',
    maxHeight: 90,
    paddingVertical: 8,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});

