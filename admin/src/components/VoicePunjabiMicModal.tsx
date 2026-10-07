import React, { useState } from 'react';
import { ActivityIndicator, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { RoleThemes } from '@/constants/Colors';
import { useProcessVoiceCommand } from '@/src/hooks/useVoiceAI';

const theme = RoleThemes.FARMER;

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
};

export function VoicePunjabiMicModal() {
  const [visible, setVisible] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  const processVoice = useProcessVoiceCommand();

  const handleSimulateVoice = async () => {
    tap();
    setIsRecording(true);
    setAiResponse(null);

    // Default sample voice command if empty
    const sampleText = transcript.trim() || 'Today I bought 2 bags of DAP for 2700, record in Arhtiya account';
    setTranscript(sampleText);

    setTimeout(async () => {
      setIsRecording(false);
      try {
        const res = await processVoice.mutateAsync(sampleText);
        setAiResponse(res.spokenResponse);
      } catch (err: any) {
        setAiResponse('Technical issue occurred, please try again.');
      }
    }, 1200);
  };

  return (
    <>
      {/* Floating Mic Button */}
      <TouchableOpacity
        style={[styles.floatingMicBtn, premiumShadow('#15803d', 'md')]}
        activeOpacity={0.85}
        onPress={() => {
          tap();
          setVisible(true);
        }}
      >
        <Ionicons name="mic" size={24} color="#ffffff" />
      </TouchableOpacity>

      {/* Voice Assistant Modal */}
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="mic-circle" size={24} color="#15803d" />
                <Text style={styles.modalTitle}>Voice Assistant (Voice AI)</Text>
              </View>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.micBox}>
              <TouchableOpacity
                style={[styles.micBigCircle, isRecording && styles.micRecording]}
                activeOpacity={0.8}
                onPress={handleSimulateVoice}
              >
                <Ionicons name={isRecording ? 'radio' : 'mic'} size={42} color="#ffffff" />
              </TouchableOpacity>
              <Text style={styles.micHint}>
                {isRecording ? 'Listening...' : 'Tap mic and speak'}
              </Text>
            </View>

            <Text style={styles.inputLabel}>Speech Transcript:</Text>
            <TextInput
              style={styles.transcriptInput}
              value={transcript}
              onChangeText={setTranscript}
              placeholder="e.g. Bought 2 bags DAP for 2700 today"
              multiline
            />

            {processVoice.isPending || isRecording ? (
              <ActivityIndicator color="#15803d" style={{ marginVertical: 15 }} />
            ) : aiResponse ? (
              <View style={styles.responseBox}>
                <Ionicons name="volume-high" size={20} color="#15803d" />
                <Text style={styles.responseText}>{aiResponse}</Text>
              </View>
            ) : null}

            <TouchableOpacity style={styles.speakBtn} onPress={handleSimulateVoice}>
              <Text style={styles.speakBtnText}>Process Voice Command</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingMicBtn: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#15803d',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.65)', justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
  modalCard: { width: '100%', maxWidth: 440, backgroundColor: '#ffffff', borderRadius: RADIUS.xl, padding: SPACING.lg, ...premiumShadow('#000000', 'lg') },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalTitle: { fontSize: 16, fontFamily: FONT.extraBold, color: '#0f172a' },
  micBox: { alignItems: 'center', marginVertical: 16, gap: 10 },
  micBigCircle: { width: 84, height: 84, borderRadius: 42, backgroundColor: '#15803d', alignItems: 'center', justifyContent: 'center', ...premiumShadow('#15803d', 'md') },
  micRecording: { backgroundColor: '#dc2626' },
  micHint: { fontSize: 13, fontFamily: FONT.bold, color: '#475569' },
  inputLabel: { fontSize: 11.5, fontFamily: FONT.bold, color: '#64748b', marginBottom: 4 },
  transcriptInput: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: RADIUS.md, padding: 10, fontSize: 13, fontFamily: FONT.medium, backgroundColor: '#f8fafc', color: '#0f172a', minHeight: 60 },
  responseBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f0fdf4', padding: 12, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#bbf7d0', marginTop: 10 },
  responseText: { fontSize: 13, fontFamily: FONT.bold, color: '#15803d', flex: 1 },
  speakBtn: { backgroundColor: '#15803d', borderRadius: RADIUS.md, paddingVertical: 12, alignItems: 'center', marginTop: 14 },
  speakBtnText: { color: '#ffffff', fontFamily: FONT.bold, fontSize: 14 },
});
