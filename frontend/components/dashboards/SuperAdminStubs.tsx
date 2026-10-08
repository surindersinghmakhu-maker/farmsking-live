import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const WithdrawalCard = ({ request, onReview }: any) => (
  <TouchableOpacity style={styles.card} onPress={onReview}>
    <Text style={styles.title}>Withdrawal: {request?.id}</Text>
    <Text>Amount: {request?.requestedAmount}</Text>
  </TouchableOpacity>
);

export const PlanPaymentCard = ({ request, onReview }: any) => (
  <TouchableOpacity style={styles.card} onPress={onReview}>
    <Text style={styles.title}>Plan Payment: {request?.id}</Text>
  </TouchableOpacity>
);

export const FarmerPlanPaymentCard = ({ request, onReview }: any) => (
  <TouchableOpacity style={styles.card} onPress={onReview}>
    <Text style={styles.title}>Farmer Plan Payment: {request?.id}</Text>
  </TouchableOpacity>
);

export const ReviewModal = ({ request, onClose }: any) => (
  <Modal visible={!!request} transparent animationType="slide" onRequestClose={onClose}>
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Review Withdrawal</Text>
        <TouchableOpacity onPress={onClose}><Text>Close</Text></TouchableOpacity>
      </View>
    </View>
  </Modal>
);

export const PlanPaymentReviewModal = ({ request, onClose }: any) => (
  <Modal visible={!!request} transparent animationType="slide" onRequestClose={onClose}>
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Review Plan Payment</Text>
        <TouchableOpacity onPress={onClose}><Text>Close</Text></TouchableOpacity>
      </View>
    </View>
  </Modal>
);

export const FarmerPlanPaymentReviewModal = ({ request, onClose }: any) => (
  <Modal visible={!!request} transparent animationType="slide" onRequestClose={onClose}>
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Review Farmer Plan Payment</Text>
        <TouchableOpacity onPress={onClose}><Text>Close</Text></TouchableOpacity>
      </View>
    </View>
  </Modal>
);

export const UserGuidesModal = ({ visible, onClose }: any) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>User Guides</Text>
        <TouchableOpacity onPress={onClose}><Text>Close</Text></TouchableOpacity>
      </View>
    </View>
  </Modal>
);

export const SuperAdminWorkspaceModal = ({ visible, onClose }: any) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Workspace</Text>
        <TouchableOpacity onPress={onClose}><Text>Close</Text></TouchableOpacity>
      </View>
    </View>
  </Modal>
);

export const AdminInfoModal = ({ visible, onClose }: any) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Admin Info</Text>
        <TouchableOpacity onPress={onClose}><Text>Close</Text></TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  card: { padding: 12, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 8 },
  title: { fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', padding: 20, borderRadius: 12, width: '80%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 }
});
