import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
  Image,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  formatMediaTimestamp,
  MAX_AUDIO_SECONDS,
  MAX_REMARK_CHARS,
  resolveCropMediaDisplayUri,
} from '@/src/utils/crop-media';

interface CropRemarksSectionProps {
  remarksText: string;
  onChangeRemarksText?: (text: string) => void;
  audioUri: string | null;
  onChangeAudioUri?: (uri: string | null) => void;
  audioRecordedAt?: Date | string | null;
  farmerName?: string;
  fieldName?: string;
  cropName?: string;
  readOnly?: boolean;
}

/**
 * Shared Farmer Crop Feedback / Remarks component:
 * - Voice Recording (Live Microphone, max 60 seconds / 1 minute) + Audio Player to check & replay
 * - Written Remarks (max 150 characters) with live counter
 * Supports both editable mode (CropMediaModal / FarmLocationPickerModal Setup) and read-only review mode.
 */
export const CropRemarksSection: React.FC<CropRemarksSectionProps> = ({
  remarksText,
  onChangeRemarksText,
  audioUri,
  onChangeAudioUri,
  audioRecordedAt,
  farmerName = 'Registered Farmer',
  fieldName = 'Field Plot',
  cropName = 'Field Crop',
  readOnly = false,
}) => {
  const [activeTab, setActiveTab] = useState<'VOICE' | 'TEXT'>(audioUri ? 'VOICE' : 'TEXT');
  const [isRecording, setIsRecording] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<any>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<any>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  const resolvedAudioUrl = audioUri ? resolveCropMediaDisplayUri(audioUri) || audioUri : null;
  const timestamp = formatMediaTimestamp(audioRecordedAt);

  useEffect(() => {
    if (audioUri && !remarksText && activeTab !== 'VOICE') {
      setActiveTab('VOICE');
    }
  }, [audioUri, remarksText]);

  const stopTracksAndTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        try {
          recorderRef.current.stop();
        } catch {
          // ignore cleanup stop failure
        }
      }
      stopTracksAndTimer();
    };
  }, []);

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      try {
        recorderRef.current.stop();
      } catch {
        // ignore stop failure
      }
    }
    setIsRecording(false);
  };

  const startVoiceRecording = async () => {
    setAudioError(null);
    if (Platform.OS !== 'web') {
      setAudioError('Live microphone recording works in the web browser. Please type your written remarks (max 150 characters).');
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setAudioError('Microphone recording is not supported in this browser. Please enter written remarks below.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeCandidates = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
        'audio/ogg',
      ];
      const supportedMime = mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m));
      const recorder = supportedMime
        ? new MediaRecorder(stream, { mimeType: supportedMime })
        : new MediaRecorder(stream);

      recorder.ondataavailable = (e: any) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        stopTracksAndTimer();
        if (chunksRef.current.length > 0 && onChangeAudioUri) {
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
          const blobUrl = URL.createObjectURL(blob);
          onChangeAudioUri(blobUrl);
        }
      };

      recorderRef.current = recorder;
      recorder.start(300);
      setSecondsElapsed(0);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setSecondsElapsed((prev) => {
          if (prev + 1 >= MAX_AUDIO_SECONDS) {
            stopRecording();
            return MAX_AUDIO_SECONDS;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      stopTracksAndTimer();
      setAudioError(
        err?.name === 'NotFoundError'
          ? 'No microphone detected on this device. You can type written remarks (up to 150 characters).'
          : 'Microphone permission denied. Allow mic access to record voice feedback.',
      );
    }
  };

  const toggleInlinePlay = () => {
    if (Platform.OS === 'web' && audioElRef.current) {
      if (isPlayingAudio) {
        audioElRef.current.pause();
      } else {
        audioElRef.current.play().catch(() => {});
      }
      return;
    }
    if (resolvedAudioUrl) {
      Linking.openURL(resolvedAudioUrl).catch(() => {});
    }
  };

  const formatTimer = (secs: number) =>
    `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;

  return (
    <View style={styles.sectionCard}>
      {/* HEADER */}
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
          <Ionicons name="mic-circle" size={20} color="#7c3aed" />
          <Text style={styles.sectionHeading}>Crop Remarks & Feedback</Text>
        </View>
        <View style={styles.statusBadgesRow}>
          {audioUri ? (
            <View style={styles.badgeActive}>
              <Text style={styles.badgeActiveText}>Voice ✓</Text>
            </View>
          ) : null}
          {remarksText.trim().length > 0 ? (
            <View style={styles.badgeActive}>
              <Text style={styles.badgeActiveText}>Text ✓</Text>
            </View>
          ) : null}
        </View>
      </View>

      <Text style={styles.sectionSub}>
        Share feedback about your crop by recording up to 1 minute of voice audio OR writing remarks (maximum 150 characters).
      </Text>

      {/* OPTION TABS (VOICE vs WRITTEN) IN EDIT MODE */}
      {!readOnly && (
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeBtn, activeTab === 'VOICE' && styles.modeBtnActive]}
            onPress={() => setActiveTab('VOICE')}
          >
            <Ionicons name="mic" size={15} color={activeTab === 'VOICE' ? '#ffffff' : '#475569'} />
            <Text style={[styles.modeBtnText, activeTab === 'VOICE' && styles.modeBtnTextActive]}>
              Voice Audio (Max 1 Min)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeBtn, activeTab === 'TEXT' && styles.modeBtnActive]}
            onPress={() => setActiveTab('TEXT')}
          >
            <Ionicons name="create-outline" size={15} color={activeTab === 'TEXT' ? '#ffffff' : '#475569'} />
            <Text style={[styles.modeBtnText, activeTab === 'TEXT' && styles.modeBtnTextActive]}>
              Write Remarks (Max 150)
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* VOICE RECORDING & PLAYBACK SECTION */}
      {(readOnly || activeTab === 'VOICE') && (
        <View style={styles.subBox}>
          {!readOnly && (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <Text style={styles.subLabel}>Voice Feedback (Live Microphone · Max 01:00)</Text>
                {isRecording && (
                  <View style={styles.recPill}>
                    <View style={styles.recDot} />
                    <Text style={styles.recTimeText}>
                      {formatTimer(secondsElapsed)} / 01:00
                    </Text>
                  </View>
                )}
              </View>

              {isRecording && (
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.min(100, (secondsElapsed / MAX_AUDIO_SECONDS) * 100)}%` },
                    ]}
                  />
                </View>
              )}

              <TouchableOpacity
                style={[styles.recordAudioBtn, isRecording && { backgroundColor: '#dc2626' }]}
                activeOpacity={0.85}
                onPress={isRecording ? stopRecording : startVoiceRecording}
              >
                <Ionicons name={isRecording ? 'stop-circle' : 'mic'} size={17} color="#ffffff" />
                <Text style={styles.recordAudioBtnText}>
                  {isRecording
                    ? 'Stop Audio Recording'
                    : audioUri
                      ? 'Re-record Voice Remarks'
                      : 'Record Voice Remarks (Max 1 Min)'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {audioError ? (
            <View style={styles.audioErrorBox}>
              <Ionicons name="alert-circle" size={15} color="#b91c1c" />
              <Text style={styles.audioErrorText}>{audioError}</Text>
            </View>
          ) : null}

          {resolvedAudioUrl ? (
            <View style={styles.audioPlayerCard}>
              {/* TOP HEADER WITH LIVE AUDIO + FAVICON */}
              <View style={styles.audioPlayerHeader}>
                <View style={styles.audioLivePill}>
                  <View style={styles.recDotWhite} />
                  <Text style={styles.audioLiveText}>VOICE REMARKS</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <TouchableOpacity style={styles.playToggleBtn} onPress={toggleInlinePlay}>
                    <Ionicons name={isPlayingAudio ? 'pause' : 'play'} size={13} color="#ffffff" />
                    <Text style={styles.playToggleText}>{isPlayingAudio ? 'Pause' : 'Play'}</Text>
                  </TouchableOpacity>
                  {!readOnly && onChangeAudioUri && (
                    <TouchableOpacity
                      style={styles.audioDeleteBtn}
                      onPress={() => onChangeAudioUri(null)}
                      accessibilityLabel="Remove audio remarks"
                    >
                      <Ionicons name="trash-outline" size={13} color="#fecaca" />
                    </TouchableOpacity>
                  )}
                  <Image
                    source={require('@/assets/images/favicon.png')}
                    style={{ width: 20, height: 20, borderRadius: 5 }}
                    resizeMode="contain"
                  />
                </View>
              </View>

              {/* REAL HTML5 AUDIO CONTROLS ON WEB */}
              {Platform.OS === 'web' ? (
                <View style={styles.htmlAudioWrap}>
                  {React.createElement('audio', {
                    key: resolvedAudioUrl,
                    ref: (el: any) => {
                      audioElRef.current = el;
                    },
                    src: resolvedAudioUrl,
                    controls: true,
                    preload: 'metadata',
                    onPlay: () => setIsPlayingAudio(true),
                    onPause: () => setIsPlayingAudio(false),
                    onEnded: () => setIsPlayingAudio(false),
                    style: {
                      width: '100%',
                      height: '38px',
                    },
                  })}
                </View>
              ) : (
                <TouchableOpacity style={styles.mobileAudioPlayRow} onPress={toggleInlinePlay}>
                  <Ionicons name="volume-high" size={18} color="#4ade80" />
                  <Text style={styles.mobileAudioPlayText}>Tap to Play Saved Voice Feedback</Text>
                </TouchableOpacity>
              )}

              <View style={styles.audioFooter}>
                <Text style={styles.audioMetaTime} numberOfLines={1}>
                  Date: {timestamp.dateStr} · Time: {timestamp.timeStr}
                </Text>
                <Text style={styles.audioMetaWho} numberOfLines={1}>
                  Farmer: {farmerName} | Plot: {fieldName} ({cropName})
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.emptyRemarkBox}>
              <Ionicons name="mic-off-outline" size={18} color="#94a3b8" />
              <Text style={styles.emptyRemarkText}>No Audio Recorded</Text>
            </View>
          )}
        </View>
      )}

      {/* WRITTEN REMARKS SECTION (MAX 150 CHARACTERS) */}
      {(readOnly || activeTab === 'TEXT') && (
        <View style={styles.subBox}>
          <View style={styles.headerRow}>
            <Text style={styles.subLabel}>Written Remarks</Text>
            <Text
              style={[
                styles.charCounter,
                remarksText.length >= 135 && { color: '#d97706' },
                remarksText.length >= MAX_REMARK_CHARS && { color: '#dc2626' },
              ]}
            >
              {remarksText.length} / {MAX_REMARK_CHARS} chars
            </Text>
          </View>

          {readOnly ? (
            remarksText.trim() ? (
              <View style={styles.readOnlyTextCard}>
                <Text style={styles.readOnlyTextBody}>{remarksText}</Text>
              </View>
            ) : (
              <View style={styles.emptyRemarkBox}>
                <Ionicons name="document-text-outline" size={18} color="#94a3b8" />
                <Text style={styles.emptyRemarkText}>No Written Remarks</Text>
              </View>
            )
          ) : (
            <TextInput
              style={styles.remarksInput}
              placeholder="Write crop remarks or feedback here (maximum 150 characters)..."
              placeholderTextColor="#94a3b8"
              multiline
              maxLength={MAX_REMARK_CHARS}
              value={remarksText}
              onChangeText={(txt) => onChangeRemarksText?.(txt.slice(0, MAX_REMARK_CHARS))}
            />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sectionHeading: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  sectionSub: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 15,
  },
  statusBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  badgeActive: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeActiveText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#15803d',
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  modeBtnActive: {
    backgroundColor: '#6d28d9',
    borderColor: '#6d28d9',
  },
  modeBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  modeBtnTextActive: {
    color: '#ffffff',
  },
  subBox: {
    gap: 8,
  },
  subLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#334155',
  },
  recPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  recDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#dc2626',
  },
  recDotWhite: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
  },
  recTimeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#b91c1c',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  progressTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: '#e2e8f0',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#dc2626',
  },
  recordAudioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: '#6d28d9',
    paddingVertical: 10,
    borderRadius: 8,
  },
  recordAudioBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '800',
  },
  audioErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  audioErrorText: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: '600',
    color: '#b91c1c',
  },
  audioPlayerCard: {
    backgroundColor: '#090e17',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  audioPlayerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  audioLivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#7c3aed',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 5,
  },
  audioLiveText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  playToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#16a34a',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
  },
  playToggleText: {
    color: '#ffffff',
    fontSize: 10.5,
    fontWeight: '800',
  },
  audioDeleteBtn: {
    backgroundColor: 'rgba(185, 28, 28, 0.5)',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
  },
  htmlAudioWrap: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#0f172a',
  },
  mobileAudioPlayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  mobileAudioPlayText: {
    color: '#4ade80',
    fontSize: 12,
    fontWeight: '700',
  },
  audioFooter: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#090e17',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    gap: 2,
  },
  audioMetaTime: {
    fontSize: 9.5,
    color: '#fde047',
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  audioMetaWho: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '700',
  },
  emptyRemarkBox: {
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyRemarkText: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '700',
  },
  charCounter: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
  },
  remarksInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1.2,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 78,
    fontSize: 12.5,
    color: '#0f172a',
    textAlignVertical: 'top',
  },
  readOnlyTextCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    padding: 10,
  },
  readOnlyTextBody: {
    fontSize: 12,
    color: '#0f172a',
    lineHeight: 17,
    fontWeight: '600',
  },
});

