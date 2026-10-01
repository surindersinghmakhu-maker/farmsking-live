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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

interface DoseItem {
  srNo: number;
  product: string;
  quantity: string;
}

const FARMSKING_LOGO = require('../assets/images/farmsking_logo_transparent_bg.png');
const FARMSKING_ICON = require('../assets/images/farmsking_logo_icon.png');

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
  { srNo: 19, product: 'Chelated Micronutrient / चिलेटेड माइक्रोन्यूट्रिएंट', quantity: '500 g' },
  { srNo: 20, product: '', quantity: '' },
  { srNo: 21, product: '', quantity: '' },
];

export default function DosePage() {
  const router = useRouter();
  const scheduleShotRef = useRef<any>(null);

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

  const updateItemProduct = (index: number, value: string) => {
    const updated = [...items];
    updated[index].product = value;
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
          await Sharing.shareAsync(uri, { mimeType: 'image/jpeg', dialogTitle: 'Download Marigold Schedule Report' });
        } else {
          Alert.alert('JPG Report Download', `Marigold Schedule image captured! File: ${fileName}`);
        }
      }
    } catch (err: any) {
      console.error('JPG capture error:', err);
      Alert.alert('Download Failed', 'Could not generate JPG image report. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          🌼 Marigold Schedule / गेंदे का ड्रेंचिंग शेड्यूल
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Capturable Master Unified Report Card */}
        <View ref={scheduleShotRef} collapsable={false} style={styles.masterReportCard}>
          {/* Official Report Title Header with Official Logo */}
          <View style={styles.reportHeaderBox}>
            <Image source={FARMSKING_ICON} style={styles.logoIcon} resizeMode="contain" />
            <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 4 }}>
              <Text style={styles.reportMainTitle}>FARMSKING OFFICIAL DRENCHING REPORT</Text>
              <Text style={styles.reportSubTitle}>MARIGOLD PRODUCTION (गेंदे का ड्रेंचिंग शेड्यूल)</Text>
            </View>
            <Image source={FARMSKING_LOGO} style={styles.logoBrand} resizeMode="contain" />
          </View>

          {/* Farmer & Field Details Metadata Table */}
          <View style={styles.metaTable}>
            <View style={styles.metaRow}>
              <View style={[styles.metaCell, { flex: 1.3 }]}>
                <Text style={styles.metaLabel}>FARMER NAME / किसान</Text>
                <TextInput
                  style={styles.metaInput}
                  placeholder="Enter Farmer Name"
                  placeholderTextColor="#94A3B8"
                  value={farmerName}
                  onChangeText={setFarmerName}
                />
              </View>
              <View style={[styles.metaCell, { flex: 0.9, borderLeftWidth: 1, borderColor: '#CBD5E1' }]}>
                <Text style={styles.metaLabel}>AREA / क्षेत्रफल</Text>
                <TextInput
                  style={styles.metaInput}
                  placeholder="1 Acre"
                  placeholderTextColor="#94A3B8"
                  value={area}
                  onChangeText={setArea}
                />
              </View>
              <View style={[styles.metaCell, { flex: 0.9, borderLeftWidth: 1, borderColor: '#CBD5E1' }]}>
                <Text style={styles.metaLabel}>PLANTS / पौधे</Text>
                <TextInput
                  style={styles.metaInput}
                  placeholder="10,000"
                  placeholderTextColor="#94A3B8"
                  value={plantsCount}
                  onChangeText={setPlantsCount}
                />
              </View>
            </View>
          </View>

          {/* Main Drenching Schedule Grid Table */}
          <View style={styles.scheduleGridTable}>
            {/* Table Header Row */}
            <View style={styles.gridHeaderRow}>
              <Text style={[styles.gridTh, { flex: 0.7, textAlign: 'center' }]}>SR.</Text>
              <Text style={[styles.gridTh, { flex: 3.3, borderLeftWidth: 1, borderColor: '#166534', paddingLeft: 8 }]}>PRODUCT NAME / उत्पाद</Text>
              <Text style={[styles.gridTh, { flex: 1.5, textAlign: 'center', borderLeftWidth: 1, borderColor: '#166534' }]}>QTY / मात्रा</Text>
            </View>

            {/* Table Data Rows */}
            {items.map((item, index) => (
              <View
                key={item.srNo}
                style={[
                  styles.gridDataRow,
                  { backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#F0FDF4' },
                ]}
              >
                {/* Sr. No */}
                <Text style={styles.srCellText}>{item.srNo}</Text>

                {/* Product Name Input */}
                <View style={styles.productCellContainer}>
                  <TextInput
                    style={styles.productInputText}
                    value={item.product}
                    onChangeText={(val) => updateItemProduct(index, val)}
                    placeholder="Enter Product / उत्पाद नाम"
                    placeholderTextColor="#A1A1AA"
                    multiline={true}
                    scrollEnabled={false}
                  />
                </View>

                {/* Quantity Input */}
                <View style={styles.qtyCellContainer}>
                  <TextInput
                    style={styles.qtyInputText}
                    value={item.quantity}
                    onChangeText={(val) => updateItemQuantity(index, val)}
                    placeholder="Qty"
                    placeholderTextColor="#A1A1AA"
                  />
                </View>
              </View>
            ))}
          </View>

          {/* Report Stamp & Footer Badge */}
          <View style={styles.reportFooter}>
            <Image source={FARMSKING_ICON} style={{ width: 14, height: 14, marginRight: 6 }} resizeMode="contain" />
            <Text style={styles.footerText}>FARMSKING AGRICULTURAL ADVISORY • OFFICIAL REPORT</Text>
          </View>
        </View>

        {/* Download JPG Report Button */}
        <TouchableOpacity style={styles.jpgBtn} onPress={handleDownloadJPG} activeOpacity={0.85}>
          <Ionicons name="image-outline" size={22} color="#FFF" />
          <Text style={styles.jpgBtnText}>🖼️ DOWNLOAD REPORT JPG / ਡਾਊਨਲੋਡ ਕਰੋ</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  header: {
    backgroundColor: '#15803D',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    elevation: 3,
  },
  backBtn: {
    padding: 2,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
  },
  scrollContent: {
    padding: 8,
    paddingBottom: 28,
  },
  masterReportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#15803D',
    padding: 8,
    elevation: 3,
  },
  reportHeaderBox: {
    backgroundColor: '#15803D',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  logoIcon: {
    width: 28,
    height: 28,
    borderRadius: 4,
  },
  logoBrand: {
    width: 60,
    height: 28,
  },
  reportMainTitle: {
    color: '#FEF08A',
    fontSize: 13.5,
    fontWeight: '900',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  reportSubTitle: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
    marginTop: 2,
    textAlign: 'center',
  },
  metaTable: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    marginBottom: 8,
    overflow: 'hidden',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaCell: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  metaLabel: {
    color: '#15803D',
    fontSize: 9.5,
    fontWeight: '800',
    marginBottom: 2,
  },
  metaInput: {
    color: '#0F172A',
    fontSize: 11.5,
    fontWeight: '700',
    padding: 0,
    margin: 0,
  },
  scheduleGridTable: {
    borderWidth: 1.5,
    borderColor: '#15803D',
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  gridHeaderRow: {
    backgroundColor: '#15803D',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  gridTh: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },
  gridDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    minHeight: 28,
  },
  srCellText: {
    flex: 0.7,
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  productCellContainer: {
    flex: 3.3,
    borderLeftWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 3,
    justifyContent: 'center',
  },
  productInputText: {
    color: '#0F172A',
    fontSize: 11.5,
    fontWeight: '600',
    padding: 0,
    margin: 0,
  },
  qtyCellContainer: {
    flex: 1.5,
    borderLeftWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 4,
    paddingVertical: 3,
    justifyContent: 'center',
  },
  qtyInputText: {
    color: '#15803D',
    fontSize: 11.5,
    fontWeight: '800',
    textAlign: 'center',
    padding: 0,
    margin: 0,
  },
  reportFooter: {
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#F0FDF4',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    color: '#166534',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  jpgBtn: {
    backgroundColor: '#16A34A',
    borderRadius: 8,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    elevation: 3,
  },
  jpgBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
