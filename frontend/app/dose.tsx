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
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface DoseItem {
  srNo: number;
  product: string;
  quantity: string;
}

const DEFAULT_SCHEDULE: DoseItem[] = [
  { srNo: 1, product: 'Jaggery (Gud) / गुड़', quantity: '3 kg' },
  { srNo: 2, product: 'Fulvic Acid / फुलविक एसिड', quantity: '500 g' },
  { srNo: 3, product: 'DAP Fertilizer / डी.ए.पी. खाद', quantity: '10 kg' },
  { srNo: 4, product: 'MOP / एम.ਓ.ਪੀ. ਪੋਟਾਸ਼ (Potash)', quantity: '15 kg' },
  { srNo: 5, product: 'Urea* (Apply where growth is less) / यूरिया*', quantity: '5 kg' },
  { srNo: 6, product: 'Mustard Cake / सरसों खली', quantity: '10 kg' },
  { srNo: 7, product: 'Neem Cake / नीम खली', quantity: '5 kg' },
  { srNo: 8, product: 'Sulphur (80% WDG) / सल्फर', quantity: '2 kg' },
  { srNo: 9, product: 'Magnesium Sulphate / मैग्नीशियम सल्फेट', quantity: '2 kg' },
  { srNo: 10, product: 'Roko Fungicide / रोको फफूंदनाशक', quantity: '250 g' },
  { srNo: 11, product: 'Humic Acid (98%) / ह्यूमिक एसिड', quantity: '2 kg' },
  { srNo: 12, product: 'Boron 20% / बोरोन 20%', quantity: '500 g' },
  { srNo: 13, product: 'Biovita / बायोविटा', quantity: '500 g' },
  { srNo: 14, product: 'Amino Acid (Liquid 20%/50%) / अमीनो एसिड', quantity: '500 ml' },
  { srNo: 15, product: 'Chelated Iron (Fe 12%) / चिलेटेड आयरन', quantity: '250 g' },
  { srNo: 16, product: 'Chelated Zinc (Zn EDTA 12%) / चिलेटेड जिंक', quantity: '500 g' },
  { srNo: 17, product: 'Chelated Calcium (10–12%) / चिलेटेड कैल्शियम', quantity: '500 g' },
  { srNo: 18, product: 'Sai power plus / Multiplex Kranti / साईं पावर प्लस - क्रांति', quantity: '500 ml' },
];

export default function DosePage() {
  const router = useRouter();

  // Top Form States
  const [farmerName, setFarmerName] = useState('');
  const [area, setArea] = useState('1 Acre');
  const [plantsCount, setPlantsCount] = useState('10,000');

  // Table Schedule Items State
  const [items, setItems] = useState<DoseItem[]>(DEFAULT_SCHEDULE);

  const updateItemQuantity = (index: number, value: string) => {
    const updated = [...items];
    updated[index].quantity = value;
    setItems(updated);
  };

  const handleMakePDF = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow popups to view and print the PDF report.');
        return;
      }

      const rowsHtml = items
        .map(
          (item) => `
        <tr>
          <td style="border: 1px solid #10b981; padding: 10px; text-align: center; font-weight: bold; width: 12%;">${item.srNo}</td>
          <td style="border: 1px solid #10b981; padding: 10px; font-weight: 600; width: 58%;">${item.product}</td>
          <td style="border: 1px solid #10b981; padding: 10px; text-align: center; color: #15803d; font-weight: bold; width: 30%;">${item.quantity}</td>
        </tr>
      `
        )
        .join('');

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>MARIGOLD PRODUCTION DRENCHING SCHEDULE REPORT - FarmsKing</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 25px; color: #111827; background-color: #fff; }
            .header-banner { background: linear-gradient(135deg, #14532d 0%, #166534 100%); color: white; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 20px; }
            .header-banner h1 { margin: 0; font-size: 26px; letter-spacing: 1px; color: #facc15; text-transform: uppercase; }
            .header-banner h2 { margin: 6px 0 0 0; font-size: 18px; color: #fef08a; font-weight: 500; }
            .farmer-meta { display: flex; justify-content: space-between; background: #f0fdf4; border: 2px solid #16a34a; padding: 14px 20px; border-radius: 8px; margin-bottom: 20px; font-size: 14px; }
            .farmer-meta div { font-weight: bold; color: #14532d; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background-color: #15803d; color: white; padding: 12px; border: 1px solid #15803d; font-size: 14px; text-transform: uppercase; }
            td { font-size: 13.5px; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header-banner">
            <h1>🌼 MARIGOLD PRODUCTION 🌼</h1>
            <h2>(DRENCHING SCHEDULE / गेंदे का ड्रेंचिंग शेड्यूल)</h2>
            <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">FarmsKing Enterprise Agri-Intelligence Platform</p>
          </div>

          <div class="farmer-meta">
            <div>👤 Name / नाम: <span style="color: #15803d;">${farmerName || 'FarmsKing Partner Farmer'}</span></div>
            <div>📏 Area / क्षेत्रफल: <span style="color: #15803d;">${area}</span></div>
            <div>🌱 Plants / पौधे: <span style="color: #15803d;">${plantsCount}</span></div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 12%;">Sr. No. / क्र. सं.</th>
                <th style="width: 58%;">Product / उत्पाद</th>
                <th style="width: 30%;">Quantity / मात्रा</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="footer">
            <p>Generated via FarmsKing National Seller & Farmer Portal • www.farmsking.in</p>
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
      alert(`PDF Report Ready!\n\nName: ${farmerName || 'N/A'}\nArea: ${area}\nPlants: ${plantsCount}\nTotal Items: ${items.length}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          🌼 Marigold Schedule / गेंदे का ड्रेंचिंग शेड्यूल
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Banner */}
        <View style={styles.bannerCard}>
          <Text style={styles.bannerTitle}>MARIGOLD PRODUCTION</Text>
          <Text style={styles.bannerSubtitle}>(DRENCHING SCHEDULE / गेंदे का ड्रेंचिंग शेड्यूल)</Text>
        </View>

        {/* Input Details Header Card */}
        <View style={styles.inputCard}>
          <Text style={styles.cardHeaderTitle}>📌 Farmer & Field Details / किसान एवं खेत का विवरण</Text>

          <View style={styles.inputRow}>
            {/* Name */}
            <View style={{ flex: 1.2 }}>
              <Text style={styles.inputLabel}>Name / नाम</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter Name / नाम दर्ज करें"
                placeholderTextColor="#9CA3AF"
                value={farmerName}
                onChangeText={setFarmerName}
              />
            </View>

            {/* Area */}
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Area / क्षेत्रफल</Text>
              <TextInput
                style={styles.textInput}
                placeholder="1 Acre / 1 एकड़"
                placeholderTextColor="#9CA3AF"
                value={area}
                onChangeText={setArea}
              />
            </View>

            {/* Plants */}
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Plants / पौधे</Text>
              <TextInput
                style={styles.textInput}
                placeholder="10,000"
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
            <Text style={[styles.thText, { flex: 0.8, textAlign: 'center' }]}>Sr. No. / क्र. सं.</Text>
            <Text style={[styles.thText, { flex: 3.2 }]}>Product / उत्पाद</Text>
            <Text style={[styles.thText, { flex: 1.8, textAlign: 'center' }]}>Quantity / मात्रा</Text>
          </View>

          {/* Table Data Rows */}
          {items.map((item, index) => (
            <View
              key={item.srNo}
              style={[
                styles.tableRow,
                { backgroundColor: index % 2 === 0 ? '#111827' : '#1F2937' },
              ]}
            >
              <Text style={styles.srNoText}>{item.srNo}</Text>
              
              <Text style={styles.productText} numberOfLines={2}>
                {item.product}
              </Text>

              {/* Quantity Input Box */}
              <View style={{ flex: 1.8, paddingHorizontal: 4 }}>
                <TextInput
                  style={styles.cellInput}
                  value={item.quantity}
                  onChangeText={(val) => updateItemQuantity(index, val)}
                  placeholder="Qty"
                  placeholderTextColor="#6B7280"
                />
              </View>
            </View>
          ))}
        </View>

        {/* Make / Download PDF Button */}
        <TouchableOpacity style={styles.pdfBtn} onPress={handleMakePDF} activeOpacity={0.85}>
          <MaterialCommunityIcons name="file-pdf-box" size={24} color="#FFF" />
          <Text style={styles.pdfBtnText}>📥 DOWNLOAD PDF REPORT / PDF रिपोर्ट डाउनलोड करें</Text>
        </TouchableOpacity>
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
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 15.5,
    fontWeight: '800',
    flex: 1,
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
    fontSize: 11.5,
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
    fontSize: 12,
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
    fontSize: 12.5,
    fontWeight: '800',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  srNoText: {
    flex: 0.8,
    color: '#F9FAFB',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  productText: {
    flex: 3.2,
    color: '#F3F4F6',
    fontSize: 12.5,
    fontWeight: '600',
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
    textAlign: 'center',
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
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
