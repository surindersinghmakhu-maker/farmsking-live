import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Image, Modal, FlatList } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

const theme = RoleThemes.FARM_ADVISOR;

const DUMMY_PRODUCTS = [
  { id: 'p1', name: 'Premium Neem Oil Extract (1L)', price: 350, seller: 'Kisan Organics', image: 'https://cdn-icons-png.flaticon.com/512/824/824239.png' },
  { id: 'p2', name: 'NPK 19-19-19 Water Soluble Fertilizer', price: 120, seller: 'AgriCare India', image: 'https://cdn-icons-png.flaticon.com/512/7634/7634863.png' },
  { id: 'p3', name: 'Trichoderma Viride Bio-Fungicide', price: 180, seller: 'BioSafe', image: 'https://cdn-icons-png.flaticon.com/512/7634/7634863.png' },
  { id: 'p4', name: 'Bone Meal Powder for Roots (1Kg)', price: 150, seller: 'Garden Essentials', image: 'https://cdn-icons-png.flaticon.com/512/824/824239.png' },
];

export default function WritePrescriptionScreen() {
  const router = useRouter();
  const { ticketId, gardenName, plantName, issue } = useLocalSearchParams();
  
  const [diagnosis, setDiagnosis] = useState('');
  const [medicine, setMedicine] = useState('');
  const [instructions, setInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [attachedProduct, setAttachedProduct] = useState<typeof DUMMY_PRODUCTS[0] | null>(null);

  const handleSubmit = () => {
    if (!diagnosis || !medicine || !instructions) return alert('Please fill all fields');
    
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      alert('Prescription sent to the Gardener successfully!');
      router.back();
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[theme.primary, '#0f172a']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Write Prescription</Text>
          <View style={{ width: 40 }} />
        </View>
        <Text style={styles.headerSubtitle}>For: {gardenName} - {plantName}</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        
        {/* Ticket Info Card */}
        <View style={[styles.ticketCard, premiumShadow('#0f172a', 'sm')]}>
          <View style={styles.ticketHeader}>
            <Ionicons name="warning" size={20} color="#ef4444" />
            <Text style={styles.ticketTitle}>Problem Reported</Text>
          </View>
          <Text style={styles.ticketIssue}>{issue || 'Leaves turning yellow and falling off.'}</Text>
          {/* Mock uploaded image from Gardener */}
          <View style={styles.photoPreviewContainer}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1622383563227-04401ab4e5ea?auto=format&fit=crop&q=80&w=800' }} 
              style={styles.photoPreview} 
            />
          </View>
        </View>

        {/* Prescription Form */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>1. Diagnosis (ਬਿਮਾਰੀ ਦੀ ਪਛਾਣ) *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Nutrient deficiency or fungal infection..."
            placeholderTextColor="#94a3b8"
            value={diagnosis}
            onChangeText={setDiagnosis}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>2. Recommended Product / Medicine *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Neem Oil 5% / NPK Fertilizer"
            placeholderTextColor="#94a3b8"
            value={medicine}
            onChangeText={setMedicine}
          />
          
          {attachedProduct ? (
            <View style={styles.attachedProductCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Image source={{ uri: attachedProduct.image }} style={{ width: 40, height: 40 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.attachedProductName}>{attachedProduct.name}</Text>
                  <Text style={styles.attachedProductSeller}>By {attachedProduct.seller} • ₹{attachedProduct.price}</Text>
                </View>
                <TouchableOpacity onPress={() => setAttachedProduct(null)}>
                  <Ionicons name="close-circle" size={20} color="#64748b" />
                </TouchableOpacity>
              </View>
              <View style={styles.commissionBadge}>
                <Text style={styles.commissionText}>You will earn 10% commission on this sale</Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.attachProductBtn} onPress={() => setShowProductModal(true)}>
              <Ionicons name="cart" size={16} color={theme.primary} />
              <Text style={styles.attachProductBtnText}>Attach product from FarmsKing Store</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>3. Usage Instructions (ਵਰਤਣ ਦਾ ਤਰੀਕਾ) *</Text>
          <TextInput
            style={[styles.textInput, { minHeight: 100 }]}
            placeholder="e.g. Mix 5ml in 1 litre water and spray on leaves twice a week."
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={instructions}
            onChangeText={setInstructions}
          />
        </View>

      </ScrollView>

      {/* Footer Submit */}
      <View style={[styles.footer, premiumShadow('#0f172a', 'md')]}>
        <TouchableOpacity 
          style={styles.submitBtn} 
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Ionicons name="medkit" size={18} color="#ffffff" />
              <Text style={styles.submitBtnText}>Send Digital Prescription</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Product Selection Modal */}
      <Modal visible={showProductModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Store Product</Text>
              <TouchableOpacity onPress={() => setShowProductModal(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={DUMMY_PRODUCTS}
              keyExtractor={item => item.id}
              contentContainerStyle={{ gap: 12 }}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.productItemRow} 
                  onPress={() => {
                    setAttachedProduct(item);
                    setMedicine(item.name);
                    setShowProductModal(false);
                  }}
                >
                  <Image source={{ uri: item.image }} style={styles.productItemImg} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productItemName}>{item.name}</Text>
                    <Text style={styles.productItemSeller}>Sold by {item.seller}</Text>
                    <Text style={styles.productItemPrice}>₹{item.price}</Text>
                  </View>
                  <Ionicons name="add-circle" size={24} color={theme.primary} />
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingTop: SPACING.xxl, paddingBottom: SPACING.xl, paddingHorizontal: SPACING.lg, borderBottomLeftRadius: RADIUS.xl, borderBottomRightRadius: RADIUS.xl },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { padding: SPACING.xs },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontFamily: FONT.extraBold, color: '#ffffff' },
  headerSubtitle: { textAlign: 'center', fontSize: 13, fontFamily: FONT.medium, color: '#cbd5e1', marginTop: 8 },
  
  scrollBody: { padding: SPACING.lg, paddingBottom: 100 },
  
  ticketCard: { backgroundColor: '#fef2f2', padding: SPACING.md, borderRadius: RADIUS.lg, marginBottom: SPACING.xl, borderWidth: 1, borderColor: '#fecaca' },
  ticketHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  ticketTitle: { fontSize: 14, fontFamily: FONT.bold, color: '#b91c1c' },
  ticketIssue: { fontSize: 13, fontFamily: FONT.medium, color: '#7f1d1d', marginBottom: 12 },
  photoPreviewContainer: { width: '100%', height: 150, borderRadius: RADIUS.md, overflow: 'hidden' },
  photoPreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  
  section: { marginBottom: SPACING.xl },
  sectionLabel: { fontSize: 13, fontFamily: FONT.bold, color: '#0f172a', marginBottom: 8 },
  textInput: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: RADIUS.lg, padding: SPACING.md, fontSize: 14, fontFamily: FONT.medium, color: '#0f172a' },
  
  attachProductBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#f0fdf4', paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.pill, marginTop: 12, gap: 6, borderWidth: 1, borderColor: '#bbf7d0' },
  attachProductBtnText: { fontSize: 12, fontFamily: FONT.bold, color: theme.primary },
  
  attachedProductCard: { marginTop: 12, padding: 12, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: RADIUS.md },
  attachedProductName: { fontSize: 13, fontFamily: FONT.bold, color: '#0f172a' },
  attachedProductSeller: { fontSize: 11, fontFamily: FONT.medium, color: '#64748b' },
  commissionBadge: { backgroundColor: '#f0fdf4', paddingVertical: 4, paddingHorizontal: 8, borderRadius: RADIUS.sm, alignSelf: 'flex-start', marginTop: 8 },
  commissionText: { fontSize: 10, fontFamily: FONT.bold, color: '#15803d' },
  
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#ffffff', padding: SPACING.lg, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.primary, paddingVertical: 14, borderRadius: RADIUS.lg, gap: 8 },
  submitBtnText: { fontSize: 15, fontFamily: FONT.bold, color: '#ffffff' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#ffffff', borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACING.lg, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  modalTitle: { fontSize: 16, fontFamily: FONT.extraBold, color: '#0f172a' },
  productItemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: '#f8fafc', borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#e2e8f0' },
  productItemImg: { width: 50, height: 50, borderRadius: RADIUS.sm, backgroundColor: '#e2e8f0' },
  productItemName: { fontSize: 13, fontFamily: FONT.bold, color: '#0f172a' },
  productItemSeller: { fontSize: 11, fontFamily: FONT.medium, color: '#64748b' },
  productItemPrice: { fontSize: 13, fontFamily: FONT.extraBold, color: '#059669', marginTop: 4 }
});
