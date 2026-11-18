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
          <Ionicons name="chatbox-ellipses" size={17} color="#7c3aed" />
          <Text style={styles.sectionHeading}>Remarks & Voice Note</Text>
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

      {/* ── 1. VOICE RECORDING SECTION (UPPER, COMPACT) ── */}
      <View style={styles.compactBlock}>
        <View style={styles.subHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Ionicons name="mic" size={13} color="#7c3aed" />
            <Text style={styles.subLabel}>Voice Note (Max 60s)</Text>
          </View>
          {isRecording ? (
            <View style={styles.recPill}>
              <View style={styles.recDot} />
              <Text style={styles.recTimeText}>
                {formatTimer(secondsElapsed)} / 01:00
              </Text>
            </View>
          ) : null}
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

        {/* IF NOT RECORDED YET (OR CURRENTLY RECORDING): SHOW SINGLE COMPACT RECORD BUTTON */}
        {!readOnly && !resolvedAudioUrl ? (
          <TouchableOpacity
            style={[styles.compactRecordBtn, isRecording && { backgroundColor: '#dc2626' }]}
            activeOpacity={0.85}
            onPress={isRecording ? stopRecording : startVoiceRecording}
          >
            <Ionicons name={isRecording ? 'stop-circle' : 'mic'} size={15} color="#ffffff" />
            <Text style={styles.compactRecordBtnText}>
              {isRecording ? 'Stop Recording' : 'Record Voice Note (Max 60s)'}
            </Text>
          </TouchableOpacity>
        ) : null}

        {/* IF RECORDED: RECORD BUTTON IS REMOVED! SHOW ONLY COMPACT SLEEK AUDIO PLAYER ROW */}
        {resolvedAudioUrl ? (
          <View style={styles.compactAudioBar}>
            <TouchableOpacity style={styles.compactPlayBtn} onPress={toggleInlinePlay}>
              <Ionicons name={isPlayingAudio ? 'pause' : 'play'} size={13} color="#ffffff" />
              <Text style={styles.compactPlayText}>{isPlayingAudio ? 'Pause' : 'Play Audio'}</Text>
            </TouchableOpacity>

            {Platform.OS === 'web' ? (
              <View style={styles.inlineAudioElementWrap}>
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
                    height: '28px',
                  },
                })}
              </View>
            ) : (
              <TouchableOpacity style={{ flex: 1 }} onPress={toggleInlinePlay}>
                <Text style={styles.compactMobilePlayText}>Recorded Voice Note · {timestamp.timeStr}</Text>
              </TouchableOpacity>
            )}

            {!readOnly && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <TouchableOpacity
                  style={styles.compactReRecordIconBtn}
                  onPress={startVoiceRecording}
                  accessibilityLabel="Re-record voice note"
                >
                  <Ionicons name="refresh" size={13} color="#475569" />
                </TouchableOpacity>

                {onChangeAudioUri && (
                  <TouchableOpacity
                    style={styles.compactDeleteIconBtn}
                    onPress={() => onChangeAudioUri(null)}
                    accessibilityLabel="Delete voice note"
                  >
                    <Ionicons name="trash" size={13} color="#dc2626" />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        ) : (
          readOnly && !resolvedAudioUrl ? (
            <View style={styles.compactEmptyRemarkBox}>
              <Ionicons name="mic-off-outline" size={14} color="#94a3b8" />
              <Text style={styles.compactEmptyRemarkText}>No Voice Recording</Text>
            </View>
          ) : null
        )}

        {audioError ? (
          <View style={styles.audioErrorBox}>
            <Ionicons name="alert-circle" size={13} color="#b91c1c" />
            <Text style={styles.audioErrorText}>{audioError}</Text>
          </View>
        ) : null}
      </View>

      {/* ── 2. WRITTEN REMARKS SECTION (LOWER, COMPACT) ── */}
      <View style={styles.compactBlock}>
        <View style={styles.subHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Ionicons name="create-outline" size={13} color="#0284c7" />
            <Text style={styles.subLabel}>Written Remarks</Text>
          </View>
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
            <View style={styles.compactEmptyRemarkBox}>
              <Ionicons name="document-text-outline" size={14} color="#94a3b8" />
              <Text style={styles.compactEmptyRemarkText}>No Written Remarks</Text>
            </View>
          )
        ) : (
          <TextInput
            style={styles.compactRemarksInput}
            placeholder="Type brief crop remarks or doctor instructions (max 150 chars)..."
            placeholderTextColor="#94a3b8"
            multiline
            maxLength={MAX_REMARK_CHARS}
            value={remarksText}
            onChangeText={(txt) => onChangeRemarksText?.(txt.slice(0, MAX_REMARK_CHARS))}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sectionHeading: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  statusBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeActive: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  badgeActiveText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#15803d',
  },
  compactBlock: {
    gap: 5,
  },
  subHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  recPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fee2e2',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  recDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#dc2626',
  },
  recTimeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#b91c1c',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: '#e2e8f0',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#dc2626',
  },
  compactRecordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#6d28d9',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 7,
  },
  compactRecordBtnText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '800',
  },
  compactAudioBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  compactPlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#16a34a',
    paddingHorizontal: 8,
    paddingVertical: 4.5,
    borderRadius: 6,
  },
  compactPlayText: {
    color: '#ffffff',
    fontSize: 10.5,
    fontWeight: '800',
  },
  inlineAudioElementWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  compactMobilePlayText: {
    color: '#16a34a',
    fontSize: 11,
    fontWeight: '700',
  },
  compactReRecordIconBtn: {
    padding: 4.5,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  compactDeleteIconBtn: {
    padding: 4.5,
    borderRadius: 6,
    backgroundColor: '#fee2e2',
  },
  audioErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  audioErrorText: {
    flex: 1,
    fontSize: 10.5,
    fontWeight: '600',
    color: '#b91c1c',
  },
  charCounter: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
  },
  compactRemarksInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
    minHeight: 46,
    fontSize: 11.5,
    color: '#0f172a',
    textAlignVertical: 'top',
  },
  readOnlyTextCard: {
    backgroundColor: '#ffffff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 8,
  },
  readOnlyTextBody: {
    fontSize: 11.5,
    color: '#0f172a',
    lineHeight: 16,
    fontWeight: '600',
  },
  compactEmptyRemarkBox: {
    borderRadius: 6,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  compactEmptyRemarkText: {
    fontSize: 10.5,
    color: '#94a3b8',
    fontWeight: '600',
  },
});

