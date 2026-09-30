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

type Lang = 'pa' | 'hi' | 'en';

const TRANSLATIONS = {
  pa: {
    headerTitle: '🌼 ਗੇਂਦੇ ਦੀ ਡ੍ਰੈਂਚਿੰਗ ਸ਼ਡਿਊਲ',
    bannerTitle: 'MARIGOLD PRODUCTION',
    bannerSubtitle: '(ਗੇਂਦੇ ਦੀ ਡ੍ਰੈਂਚਿੰਗ ਸ਼ਡਿਊਲ)',
    cardHeaderTitle: '📌 ਕਿਸਾਨ ਅਤੇ ਖੇਤ ਦੇ ਵੇਰਵੇ',
    nameLabel: 'ਨਾਮ (Name)',
    namePlaceholder: 'ਨਾਮ ਦਰਜ ਕਰੋ',
    areaLabel: 'ਖੇਤਰਫਲ (Area)',
    areaPlaceholder: '1 ਏਕੜ',
    plantsLabel: 'ਪੌਦੇ (Plants)',
    plantsPlaceholder: '10,000',
    thSrNo: 'ਲੜੀ ਨੰ.',
    thProduct: 'ਉਤਪਾਦ (Product)',
    thQuantity: 'ਮਾਤਰਾ (Quantity)',
    pdfBtnText: '📥 PDF ਰਿਪੋਰਟ ਡਾਊਨਲੋਡ ਕਰੋ',
  },
  hi: {
    headerTitle: '🌼 गेंदे का ड्रेंचिंग शेड्यूल',
    bannerTitle: 'MARIGOLD PRODUCTION',
    bannerSubtitle: '(गेंदे का ड्रेंचिंग शेड्यूल)',
    cardHeaderTitle: '📌 किसान एवं खेत का विवरण',
    nameLabel: 'नाम (Name)',
    namePlaceholder: 'नाम दर्ज करें',
    areaLabel: 'क्षेत्रफल (Area)',
    areaPlaceholder: '1 एकड़',
    plantsLabel: 'पौधे (Plants)',
    plantsPlaceholder: '10,000',
    thSrNo: 'क्र. सं.',
    thProduct: 'उत्पाद (Product)',
    thQuantity: 'मात्रा (Quantity)',
    pdfBtnText: '📥 PDF रिपोर्ट डाउनलोड करें',
  },
  en: {
    headerTitle: '🌼 Marigold Drenching Schedule',
    bannerTitle: 'MARIGOLD PRODUCTION',
    bannerSubtitle: '(DRENCHING SCHEDULE)',
    cardHeaderTitle: '📌 Farmer & Field Details',
    nameLabel: 'Name',
    namePlaceholder: 'Enter Name',
    areaLabel: 'Area',
    areaPlaceholder: '1 Acre',
    plantsLabel: 'Plants',
    plantsPlaceholder: '10,000',
    thSrNo: 'Sr. No.',
    thProduct: 'Product',
    thQuantity: 'Quantity',
    pdfBtnText: '📥 DOWNLOAD PDF REPORT',
  },
};

interface DoseItem {
  srNo: number;
  product: string;
  quantity: string;
}

const DEFAULT_SCHEDULE: DoseItem[] = [
  { srNo: 1, product: 'Jaggery (Gud)', quantity: '3 kg' },
  { srNo: 2, product: 'Fulvic Acid', quantity: '500 g' },
  { srNo: 3, product: 'DAP', quantity: '10 kg' },
  { srNo: 4, product: 'MOP', quantity: '15 kg' },
  { srNo: 5, product: 'Urea* (Apply only where growth is less)', quantity: '5 kg' },
  { srNo: 6, product: 'Mustard Cake', quantity: '10 kg' },
  { srNo: 7, product: 'Neem Cake', quantity: '5 kg' },
  { srNo: 8, product: 'Sulphur', quantity: '2 kg' },
  { srNo: 9, product: 'Magnesium Sulphate', quantity: '2 kg' },
  { srNo: 10, product: 'Roko Fungicide', quantity: '250 g' },
  { srNo: 11, product: 'Humic Acid', quantity: '2 kg' },
  { srNo: 12, product: 'Boron 20%', quantity: '500 g' },
  { srNo: 13, product: 'Biovita', quantity: '500 g' },
  { srNo: 14, product: 'Amino Acid (Liquid 20%/50%)', quantity: '500 ml' },
  { srNo: 15, product: 'Chelated Iron (Fe 12%)', quantity: '250 g' },
  { srNo: 16, product: 'Chelated Zinc (Zn EDTA 12%)', quantity: '500 g' },
  { srNo: 17, product: 'Chelated Calcium (10–12%)', quantity: '500 g' },
  { srNo: 18, product: 'Sai power plus/multiplex kranti', quantity: '500 ml' },
];

export default function DosePage() {
  const router = useRouter();

  // Language state: 'pa' | 'hi' | 'en'
  const [lang, setLang] = useState<Lang>('pa');
  const t = TRANSLATIONS[lang];

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
            <h2>(DRENCHING SCHEDULE)</h2>
            <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">FarmsKing Enterprise Agri-Intelligence Platform</p>
          </div>

          <div class="farmer-meta">
            <div>👤 ${t.nameLabel}: <span style="color: #15803d;">${farmerName || 'FarmsKing Partner Farmer'}</span></div>
            <div>📏 ${t.areaLabel}: <span style="color: #15803d;">${area}</span></div>
            <div>🌱 ${t.plantsLabel}: <span style="color: #15803d;">${plantsCount}</span></div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 12%;">${t.thSrNo}</th>
                <th style="width: 58%;">${t.thProduct}</th>
                <th style="width: 30%;">${t.thQuantity}</th>
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
      {/* Header with Language Selector Pills */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {t.headerTitle}
        </Text>

        {/* Language Switcher Pills */}
        <View style={styles.langPillContainer}>
          <TouchableOpacity
            style={[styles.langPill, lang === 'pa' && styles.langPillActive]}
            onPress={() => setLang('pa')}
          >
            <Text style={[styles.langPillText, lang === 'pa' && styles.langPillTextActive]}>ਪੰਜਾਬੀ</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.langPill, lang === 'hi' && styles.langPillActive]}
            onPress={() => setLang('hi')}
          >
            <Text style={[styles.langPillText, lang === 'hi' && styles.langPillTextActive]}>हिंदी</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.langPill, lang === 'en' && styles.langPillActive]}
            onPress={() => setLang('en')}
          >
            <Text style={[styles.langPillText, lang === 'en' && styles.langPillTextActive]}>ENG</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Banner */}
        <View style={styles.bannerCard}>
          <Text style={styles.bannerTitle}>{t.bannerTitle}</Text>
          <Text style={styles.bannerSubtitle}>{t.bannerSubtitle}</Text>
        </View>

        {/* Input Details Header Card */}
        <View style={styles.inputCard}>
          <Text style={styles.cardHeaderTitle}>{t.cardHeaderTitle}</Text>

          <View style={styles.inputRow}>
            {/* Name */}
            <View style={{ flex: 1.2 }}>
              <Text style={styles.inputLabel}>{t.nameLabel}</Text>
              <TextInput
                style={styles.textInput}
                placeholder={t.namePlaceholder}
                placeholderTextColor="#9CA3AF"
                value={farmerName}
                onChangeText={setFarmerName}
              />
            </View>

            {/* Area */}
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>{t.areaLabel}</Text>
              <TextInput
                style={styles.textInput}
                placeholder={t.areaPlaceholder}
                placeholderTextColor="#9CA3AF"
                value={area}
                onChangeText={setArea}
              />
            </View>

            {/* Plants */}
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>{t.plantsLabel}</Text>
              <TextInput
                style={styles.textInput}
                placeholder={t.plantsPlaceholder}
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
            <Text style={[styles.thText, { flex: 0.8, textAlign: 'center' }]}>{t.thSrNo}</Text>
            <Text style={[styles.thText, { flex: 3.2 }]}>{t.thProduct}</Text>
            <Text style={[styles.thText, { flex: 1.8, textAlign: 'center' }]}>{t.thQuantity}</Text>
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
          <Text style={styles.pdfBtnText}>{t.pdfBtnText}</Text>
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
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
  },
  langPillContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 2,
    gap: 2,
  },
  langPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 14,
  },
  langPillActive: {
    backgroundColor: '#10B981',
  },
  langPillText: {
    color: '#D1D5DB',
    fontSize: 10,
    fontWeight: '700',
  },
  langPillTextActive: {
    color: '#FFF',
    fontWeight: '900',
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
    fontSize: 13,
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
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

