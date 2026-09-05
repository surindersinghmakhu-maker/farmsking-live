import React, { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGroupVoiceCall } from '../../hooks/useGroupVoiceCall';

interface GroupVoiceCallModalProps {
  visible: boolean;
  onClose: () => void;
  voiceCallHook: ReturnType<typeof useGroupVoiceCall>;
  currentUserId?: string;
  isHostOrAdmin?: boolean;
}

export const GroupVoiceCallModal: React.FC<GroupVoiceCallModalProps> = ({
  visible,
  onClose,
  voiceCallHook,
  currentUserId,
  isHostOrAdmin,
}) => {
  const {
    activeCall,
    isMuted,
    isHandRaised,
    isSpeakerOn,
    duration,
    isLoading,
    errorMsg,
    micVolume,
    isSelfLoopback,
    toggleSelfLoopback,
    endCall,
    toggleMute,
    raiseHand,
    grantMic,
    toggleSpeaker,
  } = voiceCallHook;

  const handleEndCall = async () => {
    try {
      await endCall();
    } catch (err) {
      console.warn('End call error:', err);
    } finally {
      onClose();
    }
  };

  useEffect(() => {
    if (visible && !activeCall && !isLoading) {
      onClose();
    }
  }, [visible, activeCall, isLoading, onClose]);

  if (!visible) return null;

  if (!activeCall) {
    if (!isLoading) return null;
    return (
      <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
        <View style={styles.overlayContainer}>
          <View style={{ backgroundColor: '#1e293b', padding: 24, borderRadius: 16, alignItems: 'center', gap: 12, maxWidth: 340, width: '90%' }}>
            <ActivityIndicator size="large" color="#10b981" />
            <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '800' }}>
              🎙️ Starting Group Voice Call...
            </Text>
            <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '500', textAlign: 'center' }}>
              Connecting to Agora live server & inviting active farmers
            </Text>
            {errorMsg ? (
              <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: '700', textAlign: 'center', marginTop: 4 }}>
                {errorMsg}
              </Text>
            ) : null}
            <TouchableOpacity
              style={{ marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#334155', borderRadius: 8 }}
              onPress={onClose}
            >
              <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainderSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainderSecs.toString().padStart(2, '0')}`;
  };

  const speakers = activeCall.participants.filter(
    (p) => p.role === 'HOST' || p.role === 'SPEAKER' || !p.isMuted,
  );
  const listeners = activeCall.participants.filter(
    (p) => p.role !== 'HOST' && p.role !== 'SPEAKER' && p.isMuted,
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlayContainer}>
        {/* Header Bar */}
        <View style={styles.header}>
          <View style={styles.liveTag}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>🔴 LIVE</Text>
          </View>

          <View style={styles.titleContainer}>
            <Text style={styles.callTitle} numberOfLines={1}>
              {activeCall.title}
            </Text>
            <View style={styles.subHeaderInfo}>
              <Ionicons name="time-outline" size={13} color="#94a3b8" />
              <Text style={styles.timerText}>{formatTime(duration)}</Text>
              <Text style={styles.dotDivider}>•</Text>
              <Ionicons name="people-outline" size={13} color="#10b981" />
              <Text style={styles.countText}>{activeCall.participants.length} Active Farmers</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="chevron-down" size={24} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {errorMsg ? (
          <View style={styles.errorBanner}>
            <Ionicons name="warning-outline" size={16} color="#ef4444" />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* Live Mic Status, Sound Level Meter & Self-Audio Test Banner */}
        <View
          style={{
            backgroundColor: isMuted ? '#1e293b' : 'rgba(16, 185, 129, 0.15)',
            borderWidth: 1,
            borderColor: isMuted ? '#334155' : '#10b981',
            paddingHorizontal: 16,
            paddingVertical: 10,
            marginHorizontal: 16,
            marginTop: 10,
            borderRadius: 10,
            gap: 8,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <Ionicons
                name={isMuted ? 'mic-off-circle' : 'mic-circle'}
                size={22}
                color={isMuted ? '#94a3b8' : '#10b981'}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: isMuted ? '#cbd5e1' : '#10b981' }}>
                  {isMuted
                    ? '🎤 Your Mic is MUTED (Mic Off)'
                    : '🎙️ Your Mic is LIVE & Recording (Mic On)'}
                </Text>
                <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
                  {isMuted
                    ? 'Tap "Unmute" at the bottom bar to speak into the call.'
                    : 'Your voice is broadcasting live to all connected farmers.'}
                </Text>
              </View>
            </View>

            {isMuted ? (
              <TouchableOpacity
                style={{
                  backgroundColor: '#059669',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                }}
                onPress={toggleMute}
              >
                <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '700' }}>Unmute Now</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Real-time Mic Input Sound Level Bar & Self Audio Loopback Test */}
          {!isMuted ? (
            <View style={{ marginTop: 4, gap: 6, backgroundColor: 'rgba(0,0,0,0.3)', padding: 10, borderRadius: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#10b981' }}>
                  📊 Mic Input Volume Meter: {micVolume ?? 0}%
                </Text>
                <TouchableOpacity
                  style={{
                    backgroundColor: isSelfLoopback ? '#d97706' : '#334155',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                  }}
                  onPress={toggleSelfLoopback}
                >
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#ffffff' }}>
                    {isSelfLoopback ? '🔊 Hearing Self Voice (ON)' : '🎧 Hear Self Voice (Test)'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Dynamic Sound Volume Bar */}
              <View style={{ height: 8, backgroundColor: '#334155', borderRadius: 4, overflow: 'hidden' }}>
                <View
                  style={{
                    height: '100%',
                    width: `${Math.max(5, micVolume ?? 0)}%`,
                    backgroundColor: (micVolume ?? 0) > 70 ? '#ef4444' : (micVolume ?? 0) > 30 ? '#f59e0b' : '#10b981',
                    borderRadius: 4,
                  }}
                />
              </View>
            </View>
          ) : null}
        </View>

        <ScrollView style={styles.contentScroll} contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Speakers Stage Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🎙️ Speakers & Experts</Text>
            <Text style={styles.sectionBadge}>{speakers.length}</Text>
          </View>

          <View style={styles.speakersGrid}>
            {speakers.map((item) => {
              const isCurrentUser = item.userId === currentUserId;
              return (
                <View key={item.id || item.userId} style={styles.speakerCard}>
                  <View style={[styles.avatarWrapper, !item.isMuted && styles.avatarGlowing]}>
                    {item.user?.photoUrl ? (
                      <Image source={{ uri: item.user.photoUrl }} style={styles.avatarImg} />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarLetter}>
                          {item.user?.name?.charAt(0) || 'F'}
                        </Text>
                      </View>
                    )}
                    <View style={[styles.micBadge, item.isMuted ? styles.micMuted : styles.micActive]}>
                      <Ionicons
                        name={item.isMuted ? 'mic-off' : 'mic'}
                        size={12}
                        color="#ffffff"
                      />
                    </View>
                    {item.role === 'HOST' || item.role === 'SPEAKER' ? (
                      <View style={{ position: 'absolute', top: -2, right: -2, backgroundColor: '#ffffff', borderRadius: 8, padding: 1 }}>
                        <Ionicons name="checkmark-circle" size={14} color="#10b981" />
                      </View>
                    ) : null}
                  </View>

                  <Text style={styles.speakerName} numberOfLines={1}>
                    {item.user?.name} {isCurrentUser ? '(You)' : ''}
                  </Text>
                  <Text style={styles.speakerRole}>
                    {item.role === 'HOST' ? '👑 Host' : '🔊 Speaker'}
                  </Text>
                  {item.role === 'HOST' || item.role === 'SPEAKER' ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 }}>
                      <Ionicons name="star" size={10} color="#fde047" />
                      <Text style={{ fontSize: 10, color: '#94a3b8', fontWeight: '700' }}>4.9 ★ (52)</Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>

          {/* Listeners Grid Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>👥 Subscribed Farmers</Text>
            <Text style={styles.sectionBadge}>{listeners.length}</Text>
          </View>

          <View style={styles.listenersGrid}>
            {listeners.map((item) => {
              const isCurrentUser = item.userId === currentUserId;
              return (
                <View key={item.id || item.userId} style={styles.listenerCard}>
                  <View style={styles.listenerAvatarWrapper}>
                    {item.user?.photoUrl ? (
                      <Image source={{ uri: item.user.photoUrl }} style={styles.listenerAvatarImg} />
                    ) : (
                      <View style={styles.listenerAvatarPlaceholder}>
                        <Text style={styles.listenerAvatarLetter}>
                          {item.user?.name?.charAt(0) || 'K'}
                        </Text>
                      </View>
                    )}

                    {item.isHandRaised ? (
                      <View style={styles.handBadge}>
                        <Text style={{ fontSize: 12 }}>✋</Text>
                      </View>
                    ) : (
                      <View style={styles.listenerMicBadge}>
                        <Ionicons name="mic-off" size={10} color="#94a3b8" />
                      </View>
                    )}
                  </View>

                  <Text style={styles.listenerName} numberOfLines={1}>
                    {item.user?.name}
                  </Text>

                  {isHostOrAdmin && item.isHandRaised ? (
                    <TouchableOpacity
                      style={styles.grantMicBtn}
                      onPress={() => grantMic(item.userId)}
                    >
                      <Text style={styles.grantMicText}>Grant Mic</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.listenerLocation} numberOfLines={1}>
                      {item.user?.village || 'Farmer'}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* Bottom Floating Control Bar */}
        <View style={styles.bottomBar}>
          {/* Mute/Unmute Mic Button */}
          <TouchableOpacity
            style={[styles.controlBtn, isMuted ? styles.controlBtnInactive : styles.controlBtnActive]}
            onPress={toggleMute}
          >
            <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={22} color="#ffffff" />
            <Text style={styles.btnLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
          </TouchableOpacity>

          {/* Raise Hand Button */}
          <TouchableOpacity
            style={[styles.controlBtn, isHandRaised ? styles.handBtnActive : styles.controlBtnInactive]}
            onPress={raiseHand}
          >
            <Text style={{ fontSize: 20 }}>✋</Text>
            <Text style={styles.btnLabel}>Raise Hand</Text>
          </TouchableOpacity>

          {/* Speaker Toggle */}
          <TouchableOpacity
            style={[styles.controlBtn, isSpeakerOn ? styles.controlBtnActive : styles.controlBtnInactive]}
            onPress={toggleSpeaker}
          >
            <Ionicons name={isSpeakerOn ? 'volume-high' : 'volume-mute'} size={22} color="#ffffff" />
            <Text style={styles.btnLabel}>Speaker</Text>
          </TouchableOpacity>

          {/* End / Leave Call */}
          <TouchableOpacity style={styles.endCallBtn} onPress={handleEndCall} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <Ionicons name="call" size={22} color="#ffffff" style={{ transform: [{ rotate: '135deg' }] }} />
                <Text style={styles.endCallLabel}>{isHostOrAdmin ? 'End Call' : 'Leave'}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingTop: 45,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 10,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
    marginRight: 4,
  },
  liveText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '700',
  },
  titleContainer: {
    flex: 1,
  },
  callTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
  subHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  timerText: {
    color: '#94A3B8',
    fontSize: 12,
    marginLeft: 4,
  },
  dotDivider: {
    color: '#475569',
    marginHorizontal: 6,
  },
  countText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  closeBtn: {
    padding: 6,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    padding: 10,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 8,
  },
  errorText: {
    color: '#f87171',
    fontSize: 13,
    marginLeft: 6,
  },
  contentScroll: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionBadge: {
    color: '#94A3B8',
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    fontSize: 12,
    overflow: 'hidden',
  },
  speakersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 20,
  },
  speakerCard: {
    alignItems: 'center',
    width: 90,
  },
  avatarWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarGlowing: {
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarImg: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  avatarPlaceholder: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#064E3B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    color: '#10B981',
    fontSize: 22,
    fontWeight: '700',
  },
  micBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#0F172A',
  },
  micActive: {
    backgroundColor: '#10B981',
  },
  micMuted: {
    backgroundColor: '#ef4444',
  },
  speakerName: {
    color: '#F1F5F9',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  speakerRole: {
    color: '#94A3B8',
    fontSize: 10,
    textAlign: 'center',
  },
  listenersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  listenerCard: {
    alignItems: 'center',
    width: 72,
    marginBottom: 10,
  },
  listenerAvatarWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    position: 'relative',
  },
  listenerAvatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  listenerAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listenerAvatarLetter: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '600',
  },
  handBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#F59E0B',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listenerMicBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#334155',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listenerName: {
    color: '#CBD5E1',
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  listenerLocation: {
    color: '#64748B',
    fontSize: 9,
    textAlign: 'center',
  },
  grantMicBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  grantMicText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1E293B',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  controlBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 54,
    borderRadius: 12,
  },
  controlBtnActive: {
    backgroundColor: '#059669',
  },
  controlBtnInactive: {
    backgroundColor: '#334155',
  },
  handBtnActive: {
    backgroundColor: '#D97706',
  },
  btnLabel: {
    color: '#F8FAFC',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 3,
  },
  endCallBtn: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    height: 54,
    borderRadius: 12,
  },
  endCallLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
});
