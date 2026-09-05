import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Linking,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';

interface WhatsAppMessageModalProps {
  visible: boolean;
  onClose: () => void;
  advisorName?: string;
  advisorMobile?: string;
  advisorAvatarUrl?: string;
  advisorSpec?: string;
  farmerName?: string;
  farmerKingId?: string;
}

const TEMPLATES = [
  '🌾 Need advice regarding crop growth.',
  '🐛 Crop is attacked by pest/disease, need advice.',
  '🧪 Need information regarding spray schedule and dose.',
  '🚜 Requesting a farm visit.',
];

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export const WhatsAppMessageModal: React.FC<WhatsAppMessageModalProps> = ({
  visible,
  onClose,
  advisorName = 'Advisor',
  advisorMobile,
  advisorAvatarUrl,
  advisorSpec = 'Farm Advisor',
  farmerName = 'Farmer',
  farmerKingId,
}) => {
  const [customMsg, setCustomMsg] = useState('');

  useEffect(() => {
    if (visible) {
      setCustomMsg('');
    }
  }, [visible]);

  const handleSend = () => {
    if (!advisorMobile) return;
    tap();

    const digits = advisorMobile.replace(/\D/g, '');
    const withCountryCode = digits.length === 10 ? `91${digits}` : digits;

    const fullMessage = `Hello ${advisorName},\nI am ${farmerName}${farmerKingId ? ` (King ID: ${farmerKingId})` : ''}.\n\n${customMsg.trim() || 'I need guidance regarding my farm.'}`;

    const url = `https://wa.me/${withCountryCode}?text=${encodeURIComponent(fullMessage)}`;
    Linking.openURL(url).catch(() => {});
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, premiumShadow('#000000', 'lg')]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.waIconCircle}>
                <Ionicons name="logo-whatsapp" size={22} color="#ffffff" />
              </View>
              <Text style={styles.headerTitle}>Send WhatsApp Message</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={26} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Advisor info strip */}
          <View style={styles.advisorBox}>
            {advisorAvatarUrl ? (
              <Image source={{ uri: advisorAvatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={20} color="#16a34a" />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.advisorName} numberOfLines={1}>{advisorName}</Text>
              <Text style={styles.advisorSpec}>{advisorSpec}</Text>
              {advisorMobile ? <Text style={styles.advisorMobile}>📞 +91 {advisorMobile}</Text> : null}
            </View>
          </View>

          {/* Quick template suggestions */}
          <Text style={styles.label}>Quick Templates:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templateScroll}>
            <View style={styles.templateRow}>
              {TEMPLATES.map((tmpl, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.templateChip}
                  onPress={() => {
                    tap();
                    setCustomMsg(tmpl);
                  }}
                >
                  <Text style={styles.templateChipText}>{tmpl}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Message TextInput */}
          <Text style={styles.label}>Message Box:</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              multiline
              numberOfLines={4}
              value={customMsg}
              onChangeText={setCustomMsg}
              placeholder="Write your message here..."
              placeholderTextColor="#94a3b8"
              textAlignVertical="top"
            />
          </View>

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sendBtn} activeOpacity={0.85} onPress={handleSend}>
              <Ionicons name="logo-whatsapp" size={18} color="#ffffff" />
              <Text style={styles.sendBtnText}>Send via WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    padding: SPACING.md,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  waIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  advisorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: 12,
    marginBottom: 14,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  advisorName: {
    fontSize: 15,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  advisorSpec: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#16a34a',
  },
  advisorMobile: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginTop: 2,
  },
  label: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#334155',
    marginBottom: 6,
  },
  templateScroll: {
    marginBottom: 14,
  },
  templateRow: {
    flexDirection: 'row',
    gap: 8,
  },
  templateChip: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  templateChipText: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#334155',
  },
  inputWrap: {
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: RADIUS.lg,
    backgroundColor: '#f8fafc',
    padding: 10,
    marginBottom: 16,
  },
  input: {
    fontSize: 14,
    fontFamily: FONT.medium,
    color: '#0f172a',
    minHeight: 90,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontFamily: FONT.bold,
    color: '#64748b',
  },
  sendBtn: {
    flex: 1.6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#25D366',
    borderRadius: RADIUS.md,
    paddingVertical: 12,
  },
  sendBtnText: {
    fontSize: 14,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
});
