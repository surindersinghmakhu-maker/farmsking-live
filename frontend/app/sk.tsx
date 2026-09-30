import React, { useState } from 'react';
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
  { id: '18', srNo: '18', product: 'Kranti', quantity: '500 ml' },
];

export default function SKEditableSchedulePage() {
  const router = useRouter();

  // Top Form States - Name, Area, Plants
  const [name, setName] = useState('');
  const [area, setArea] = useState('1 Acre');
  const [plants, setPlants] = useState('10,000 Plants');

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

  const handleDownloadPDF = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow popups to download and print the PDF report.');
        return;
      }

      const rowsHtml = items
        .map(
          (item) => `
        <tr>
          <td style="border: 1px solid #15803d; padding: 10px; text-align: center; font-weight: bold; width: 12%;">${item.srNo}</td>
          <td style="border: 1px solid #15803d; padding: 10px; font-weight: 600; width: 58%;">${item.product}</td>
          <td style="border: 1px solid #15803d; padding: 10px; text-align: center; color: #15803d; font-weight: bold; width: 30%;">${item.quantity}</td>
        </tr>
      `
        )
        .join('');

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>MARIGOLD PRODUCTION - DRENCHING SCHEDULE REPORT</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 25px; color: #111827; background-color: #fff; }
            .header-banner { background: linear-gradient(135deg, #14532d 0%, #166534 100%); color: white; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 20px; }
            .header-banner h1 { margin: 0; font-size: 26px; letter-spacing: 1px; color: #facc15; text-transform: uppercase; }
            .header-banner h2 { margin: 6px 0 0 0; font-size: 18px; color: #fef08a; font-weight: 500; }
            .meta-card { display: flex; justify-content: space-between; background: #f0fdf4; border: 2px solid #16a34a; padding: 14px 20px; border-radius: 8px; margin-bottom: 20px; font-size: 14px; }
            .meta-card div { font-weight: bold; color: #14532d; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background-color: #15803d; color: white; padding: 12px; border: 1px solid #15803d; font-size: 14px; text-transform: uppercase; }
            td { font-size: 13.5px; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header-banner">
            <h1>🌼 MARIGOLD PRODUCTION 🌼</h1>
            <h2>(DRENCHING SCHEDULE)</h2>
            <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">FarmsKing Agriculture Portal</p>
          </div>

          <div class="meta-card">
            <div>👤 Name: <span style="color: #15803d;">${name || 'N/A'}</span></div>
            <div>📏 Area: <span style="color: #15803d;">${area || 'N/A'}</span></div>
            <div>🌱 Plants: <span style="color: #15803d;">${plants || 'N/A'}</span></div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 12%;">Sr. No.</th>
                <th style="width: 58%;">Product</th>
                <th style="width: 30%;">Quantity</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="footer">
            <p>Generated via FarmsKing Platform • www.farmsking.in</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
    } else {
      Alert.alert(
        'PDF Report Download',
        `PDF Report Generated!\n\nName: ${name || 'N/A'}\nArea: ${area}\nPlants: ${plants}\nTotal Products: ${items.length}`
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🌼 Marigold Production Form (/sk)</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Title Banner */}
        <View style={styles.bannerCard}>
          <Text style={styles.bannerTitle}>MARIGOLD PRODUCTION</Text>
          <Text style={styles.bannerSubtitle}>(DRENCHING SCHEDULE)</Text>
        </View>

        {/* Input Details Text Boxes: Name, Area, Plants */}
        <View style={styles.inputCard}>
          <Text style={styles.cardHeaderTitle}>✏️ Details (Editable Text Boxes)</Text>

          <View style={styles.inputStack}>
            {/* Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>👤 Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter Name"
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Area Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>📏 Area</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 1 Acre"
                placeholderTextColor="#9CA3AF"
                value={area}
                onChangeText={setArea}
              />
            </View>

            {/* Plants Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>🌱 Plants</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 10,000 Plants"
                placeholderTextColor="#9CA3AF"
                value={plants}
                onChangeText={setPlants}
              />
            </View>
          </View>
        </View>

        {/* Schedule Table (Price Removed) */}
        <View style={styles.tableCard}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.thText, { flex: 0.8, textAlign: 'center' }]}>Sr. No.</Text>
            <Text style={[styles.thText, { flex: 3.2 }]}>Product</Text>
            <Text style={[styles.thText, { flex: 1.8, textAlign: 'center' }]}>Quantity</Text>
            <Text style={[styles.thText, { flex: 0.6, textAlign: 'center' }]}>Action</Text>
          </View>

          {/* Table Rows */}
          {items.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.tableRow,
                { backgroundColor: index % 2 === 0 ? '#111827' : '#1F2937' },
              ]}
            >
              {/* Sr No */}
              <View style={{ flex: 0.8, paddingHorizontal: 2 }}>
                <TextInput
                  style={[styles.cellInput, { textAlign: 'center', fontWeight: '800' }]}
                  value={item.srNo}
                  onChangeText={(val) => updateItemField(index, 'srNo', val)}
                />
              </View>

              {/* Product Name */}
              <View style={{ flex: 3.2, paddingHorizontal: 4 }}>
                <TextInput
                  style={[styles.cellInput, { textAlign: 'left', fontWeight: '600' }]}
                  value={item.product}
                  onChangeText={(val) => updateItemField(index, 'product', val)}
                  placeholder="Product Name"
                  placeholderTextColor="#6B7280"
                />
              </View>

              {/* Quantity */}
              <View style={{ flex: 1.8, paddingHorizontal: 4 }}>
                <TextInput
                  style={styles.cellInput}
                  value={item.quantity}
                  onChangeText={(val) => updateItemField(index, 'quantity', val)}
                  placeholder="Quantity"
                  placeholderTextColor="#6B7280"
                />
              </View>

              {/* Remove Row */}
              <TouchableOpacity style={{ flex: 0.6, alignItems: 'center' }} onPress={() => removeRow(index)}>
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Action Buttons: Add Row & Download PDF Report */}
        <View style={{ gap: 12, marginBottom: 24 }}>
          <TouchableOpacity style={styles.addRowBtn} onPress={addNewRow}>
            <Ionicons name="add-circle-outline" size={20} color="#FFF" />
            <Text style={styles.addRowBtnText}>+ Add New Row</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.pdfBtn} onPress={handleDownloadPDF} activeOpacity={0.85}>
            <MaterialCommunityIcons name="file-pdf-box" size={24} color="#FFF" />
            <Text style={styles.pdfBtnText}>📥 PDF REPORT DOWNLOAD</Text>
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
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  bannerSubtitle: {
    color: '#A7F3D0',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
    textAlign: 'center',
  },
  inputCard: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#374151',
  },
  cardHeaderTitle: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 12,
  },
  inputStack: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 10,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFF',
    fontSize: 13.5,
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
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  thText: {
    color: '#FFF',
    fontSize: 13.5,
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
    fontSize: 12.5,
    fontWeight: '700',
  },
  addRowBtn: {
    backgroundColor: '#1E40AF',
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addRowBtnText: {
    color: '#FFF',
    fontSize: 14,
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
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
