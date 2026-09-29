import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, SafeAreaView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AgriAiChatbot } from '@/src/components/AgriAiChatbot';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';

export function FloatingAgriAiChatbot() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.floatingBtn, premiumShadow('#15803d', 'lg')]}
        activeOpacity={0.88}
        onPress={() => setIsOpen(true)}
      >
        <View style={styles.badgePulse}>
          <Ionicons name="sparkles" size={18} color="#ffffff" />
          <Text style={styles.floatingBtnText}>AI Doctor</Text>
        </View>
        <View style={styles.freeBadge}>
          <Text style={styles.freeBadgeText}>FREE 🌾</Text>
        </View>
      </TouchableOpacity>

      {/* AI Chatbot Full Screen Modal */}
      <Modal visible={isOpen} animationType="slide" transparent={false} onRequestClose={() => setIsOpen(false)}>
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.botIconCircle}>
                <Ionicons name="sparkles" size={20} color="#ffffff" />
              </View>
              <View>
                <Text style={styles.modalTitle}>🤖 FarmsKing Kheti Mitra AI</Text>
                <Text style={styles.modalSub}>100% Free Agri AI Assistant · PAU & ICAR Advisory</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setIsOpen(false)} activeOpacity={0.8}>
              <Ionicons name="close" size={22} color="#0f172a" />
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
            <AgriAiChatbot isModal={true} />
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingBtn: {
    position: 'absolute',
    bottom: 80,
    right: 16,
    zIndex: 9999,
    backgroundColor: '#15803d',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#86efac',
  },
  badgePulse: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  floatingBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: FONT.extraBold,
  },
  freeBadge: {
    backgroundColor: '#fef08a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  freeBadgeText: {
    color: '#854d0e',
    fontSize: 9.5,
    fontFamily: FONT.extraBold,
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  botIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#15803d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
  },
  modalSub: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#16a34a',
  },
  closeBtn: {
    padding: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
  },
});
