import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

interface DoseItem {
  id: string;
  srNo: string;
  product: string;
  quantity: string;
}

const DEFAULT_SCHEDULE: DoseItem[] = [
  { id: '1', srNo: '1', product: 'Jaggery (Gud)', quantity: '3 kg' },
  { id: '2', srNo: '2', product: 'Fulvic Acid', quantity: '500 g' },
  { id: '3', srNo: '3', product: 'DAP', quantity: '10 kg' },
  { id: '4', srNo: '4', product: 'MOP', quantity: '15 kg' },
  { id: '5', srNo: '5', product: 'Urea* (Apply only where growth is less)', quantity: '5 kg' },
  { id: '6', srNo: '6', product: 'Mustard Cake', quantity: '10 kg' },
  { id: '7', srNo: '7', product: 'Neem Cake', quantity: '5 kg' },
  { id: '8', srNo: '8', product: 'Sulphur', quantity: '2 kg' },
  { id: '9', srNo: '9', product: 'Magnesium Sulphate', quantity: '2 kg' },
  { id: '10', srNo: '10', product: 'Roko Fungicide', quantity: '250 g' },
  { id: '11', srNo: '11', product: 'Humic Acid', quantity: '2 kg' },
  { id: '12', srNo: '12', product: 'Boron 20%', quantity: '500 g' },
  { id: '13', srNo: '13', product: 'Biovita', quantity: '500 g' },
  { id: '14', srNo: '14', product: 'Amino Acid (Liquid 20%/50%)', quantity: '500 ml' },
  { id: '15', srNo: '15', product: 'Chelated Iron (Fe 12%)', quantity: '250 g' },
  { id: '16', srNo: '16', product: 'Chelated Zinc (Zn EDTA 12%)', quantity: '500 g' },
  { id: '17', srNo: '17', product: 'Chelated Calcium (10–12%)', quantity: '500 g' },
  { id: '18', srNo: '18', product: 'Sai power plus/multiplex kranti', quantity: '500 ml' },
  { id: '19', srNo: '19', product: 'Chelated Micronutrient', quantity: '500 g' },
  { id: '20', srNo: '20', product: '', quantity: '' },
  { id: '21', srNo: '21', product: '', quantity: '' },
];

export default function YouPage() {
  const router = useRouter();
  const scheduleShotRef = useRef<any>(null);

  // Top Form States
  const [farmerName, setFarmerName] = useState('');
  const [area, setArea] = useState('1 Acre');
  const [plantsCount, setPlantsCount] = useState('10,000 Plants');

  // Table Schedule Items State
  const [items, setItems] = useState<DoseItem[]>(DEFAULT_SCHEDULE);

  const updateItemField = (index: number, field: keyof DoseItem, value: string) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const addNewRow = () => {
    const nextSrNo = (items.length + 1).toString();
    const newItem: DoseItem = {
      id: Date.now().toString(),
      srNo: nextSrNo,
      product: '',
      quantity: '',
    };
    setItems([...items, newItem]);
  };

  const removeRow = (index: number) => {
    const updated = items.filter((_, idx) => idx !== index);
    setItems(updated);
  };

  const handleDownloadJPG = async () => {
    if (!scheduleShotRef.current) return;
    try {
      const uri = await captureRef(scheduleShotRef, {
        format: 'jpg',
        quality: 1.0,
        result: Platform.OS === 'web' ? 'data-uri' : 'tmpfile',
      });

      const fileName = `Marigold_Drenching_Schedule_${(farmerName || 'Report').replace(/\s+/g, '_')}.jpg`;

      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = uri;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, { mimeType: 'image/jpeg', dialogTitle: 'Download Marigold Schedule' });
        } else {
          Alert.alert('JPG Image Download', `Marigold Schedule image captured! File: ${fileName}`);
        }
      }
    } catch (err: any) {
      console.error('JPG capture error:', err);
      Alert.alert('Download Failed', 'Could not generate JPG image report. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🌼 Marigold Schedule (/you)</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Capturable Card Section */}
        <View ref={scheduleShotRef} collapsable={false} style={{ backgroundColor: '#0B0F17', padding: 4, borderRadius: 12 }}>
          {/* Banner */}
          <View style={styles.bannerCard}>
            <Text style={styles.bannerTitle}>MARIGOLD PRODUCTION</Text>
            <Text style={styles.bannerSubtitle}>(DRENCHING SCHEDULE - EDITABLE)</Text>
          </View>

          {/* Input Details Header Card */}
          <View style={styles.inputCard}>
            <Text style={styles.cardHeaderTitle}>📌 Farmer & Field Information (Editable)</Text>

            <View style={styles.inputRow}>
              {/* Farmer Name */}
              <View style={{ flex: 1.2 }}>
                <Text style={styles.inputLabel}>👤 Farmer / Customer Name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter Farmer Name"
                  placeholderTextColor="#9CA3AF"
                  value={farmerName}
                  onChangeText={setFarmerName}
                />
              </View>

              {/* Area */}
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>📏 Area (Acres/Bigha)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="1 Acre"
                  placeholderTextColor="#9CA3AF"
                  value={area}
                  onChangeText={setArea}
                />
              </View>

              {/* Plants Heading & Count */}
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>🌱 Total Plants Heading</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="10,000 Plants"
                  placeholderTextColor="#9CA3AF"
                  value={plantsCount}
                  onChangeText={setPlantsCount}
                />
              </View>
            </View>
          </View>

          {/* Table Schedule Section */}
          <View style={styles.tableCard}>
            {/* Table Header Row */}
            <View style={styles.tableHeader}>
              <Text style={[styles.thText, { flex: 0.8, textAlign: 'center' }]}>Sr. No.</Text>
              <Text style={[styles.thText, { flex: 3.2 }]}>Product Name (Editable)</Text>
              <Text style={[styles.thText, { flex: 1.8, textAlign: 'center' }]}>Quantity</Text>
              <Text style={[styles.thText, { flex: 0.6, textAlign: 'center' }]}>Action</Text>
            </View>

            {/* Table Data Rows */}
            {items.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.tableRow,
                  { backgroundColor: index % 2 === 0 ? '#111827' : '#1F2937' },
                ]}
              >
                {/* Sr. No. Input Box */}
                <View style={{ flex: 0.8, paddingHorizontal: 2 }}>
                  <TextInput
                    style={[styles.cellInput, { textAlign: 'center', fontWeight: '800' }]}
                    value={item.srNo}
                    onChangeText={(val) => updateItemField(index, 'srNo', val)}
                  />
                </View>

                {/* Product Name Input Box */}
                <View style={{ flex: 3.2, paddingHorizontal: 4 }}>
                  <TextInput
                    style={[styles.cellInput, { textAlign: 'left', fontWeight: '600' }]}
                    value={item.product}
                    onChangeText={(val) => updateItemField(index, 'product', val)}
                    placeholder="Product Name"
                    placeholderTextColor="#6B7280"
                  />
                </View>

                {/* Quantity Input Box */}
                <View style={{ flex: 1.8, paddingHorizontal: 4 }}>
                  <TextInput
                    style={styles.cellInput}
                    value={item.quantity}
                    onChangeText={(val) => updateItemField(index, 'quantity', val)}
                    placeholder="Qty"
                    placeholderTextColor="#6B7280"
                  />
                </View>

                {/* Delete Row Button */}
                <TouchableOpacity style={{ flex: 0.6, alignItems: 'center' }} onPress={() => removeRow(index)}>
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Action Buttons: Add Row & Make JPG */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16, marginTop: 12 }}>
          <TouchableOpacity style={styles.addRowBtn} onPress={addNewRow}>
            <Ionicons name="add-circle-outline" size={20} color="#FFF" />
            <Text style={styles.addRowBtnText}>+ Add Product Row</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.jpgBtn, { flex: 1.5 }]} onPress={handleDownloadJPG} activeOpacity={0.85}>
            <Ionicons name="image-outline" size={22} color="#FFF" />
            <Text style={styles.jpgBtnText}>🖼️ DOWNLOAD JPG SCHEDULE</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F17',
  },
  header: {
    backgroundColor: '#064E3B',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 40,
  },
  bannerCard: {
    backgroundColor: '#064E3B',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#10B981',
  },
  bannerTitle: {
    color: '#FBBF24',
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  bannerSubtitle: {
    color: '#A7F3D0',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4,
    textAlign: 'center',
  },
  inputCard: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#374151',
  },
  cardHeaderTitle: {
    color: '#10B981',
    fontSize: 13.5,
    fontWeight: '800',
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  inputLabel: {
    color: '#D1D5DB',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#FFF',
    fontSize: 12.5,
    fontWeight: '600',
  },
  tableCard: {
    backgroundColor: '#111827',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#10B981',
    marginBottom: 16,
  },
  tableHeader: {
    backgroundColor: '#065F46',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  thText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  cellInput: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    color: '#34D399',
    fontSize: 12,
    fontWeight: '700',
  },
  addRowBtn: {
    flex: 1,
    backgroundColor: '#1E40AF',
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addRowBtnText: {
    color: '#FFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  pdfBtn: {
    backgroundColor: '#059669',
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  pdfBtnText: {
    color: '#FFF',
    fontSize: 14.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
