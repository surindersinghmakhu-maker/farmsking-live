import React from 'react';
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { FONT, RADIUS } from '@/constants/theme';

export interface FarmerFoodBatchLabelProps {
  visible: boolean;
  onClose: () => void;
  productName: string;
  farmerName: string;
  farmLocation: string;
  batchNumber: string;
  harvestDate: string;
  netWeight: string;
  purityCertification?: string;
  fssaiNumber?: string;
}

export function FarmerFoodBatchLabelModal({
  visible,
  onClose,
  productName,
  farmerName,
  farmLocation,
  batchNumber,
  harvestDate,
  netWeight,
  purityCertification = '100% Residue-Free • Cold-Processed',
  fssaiNumber = 'FSSAI Reg: 22126000000000',
}: FarmerFoodBatchLabelProps) {
  const qrPayload = `https://farmsking.com/verify-batch?batch=${encodeURIComponent(
    batchNumber
  )}&crop=${encodeURIComponent(productName)}&farmer=${encodeURIComponent(farmerName)}`;

  const handlePrintA4 = async () => {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <style>
            @page {
              size: A4;
              margin: 12mm 15mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              color: #0f172a;
              margin: 0;
              padding: 0;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 15mm;
            }
            .label-card {
              border: 2px solid #00ff87;
              border-radius: 12px;
              padding: 16px;
              box-sizing: border-box;
              background: #ffffff;
              page-break-inside: avoid;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 1.5px solid #e2e8f0;
              padding-bottom: 8px;
              margin-bottom: 10px;
            }
            .brand-name {
              font-size: 14px;
              font-weight: 800;
              color: #065f46;
              letter-spacing: 0.5px;
            }
            .badge {
              font-size: 10px;
              font-weight: 700;
              background: #ecfdf5;
              color: #047857;
              padding: 3px 8px;
              border-radius: 4px;
              border: 1px solid #a7f3d0;
            }
            .title {
              font-size: 18px;
              font-weight: 800;
              color: #0f172a;
              margin: 4px 0;
            }
            .sub {
              font-size: 12px;
              color: #64748b;
              margin-bottom: 12px;
            }
            .details {
              display: flex;
              justify-content: space-between;
              font-size: 11px;
              line-height: 1.6;
              margin-bottom: 10px;
            }
            .detail-col {
              flex: 1;
            }
            .footer {
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-top: 1px dashed #cbd5e1;
              padding-top: 8px;
              margin-top: 6px;
              font-size: 9px;
              color: #94a3b8;
            }
          </style>
        </head>
        <body>
          <div class="grid">
            ${Array.from({ length: 4 })
              .map(
                () => `
              <div class="label-card">
                <div class="header">
                  <span class="brand-name">FARMSKING ARTISAN PANTRY</span>
                  <span class="badge">FARMGROWN DIRECT</span>
                </div>
                <div class="title">${productName}</div>
                <div class="sub">${purityCertification}</div>
                <div class="details">
                  <div class="detail-col">
                    <div><strong>Producer:</strong> ${farmerName}</div>
                    <div><strong>Origin:</strong> ${farmLocation}</div>
                    <div><strong>Harvest/Packed:</strong> ${harvestDate}</div>
                    <div><strong>Net Weight:</strong> ${netWeight}</div>
                  </div>
                  <div style="text-align: right;">
                    <div style="font-size: 11px; font-weight: 700; color: #0284c7;">Batch #${batchNumber}</div>
                    <div style="font-size: 9px; color: #64748b; margin-top: 4px;">Scan on FarmsKing to Verify</div>
                  </div>
                </div>
                <div class="footer">
                  <span>${fssaiNumber}</span>
                  <span>CIN: U01100PB2026PTC063294 • ICAR Quality Protocol</span>
                </div>
              </div>
            `
              )
              .join('')}
          </div>
        </body>
        </html>
      `;

      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          printWindow.focus();
          printWindow.print();
        }
      } else {
        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      }
    } catch (e) {
      console.error('Failed to generate A4 food batch label:', e);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.iconCircle}>
                <Ionicons name="qr-code" size={18} color="#00ff87" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Print Batch Traceability Label</Text>
                <Text style={styles.headerSub}>Standard A4 4-Up Packaging Label Layout</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={24} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Label Card Preview */}
          <View style={styles.previewBox}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardBrand}>FARMSKING ARTISAN PANTRY</Text>
              <View style={styles.verifiedBadge}>
                <Ionicons name="shield-checkmark" size={12} color="#00ff87" />
                <Text style={styles.verifiedText}>Farm Direct</Text>
              </View>
            </View>

            <Text style={styles.productTitle}>{productName}</Text>
            <Text style={styles.puritySub}>{purityCertification}</Text>

            <View style={styles.infoRow}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.infoText}>
                  <Text style={styles.bold}>Farmer:</Text> {farmerName}
                </Text>
                <Text style={styles.infoText}>
                  <Text style={styles.bold}>Origin:</Text> {farmLocation}
                </Text>
                <Text style={styles.infoText}>
                  <Text style={styles.bold}>Harvested:</Text> {harvestDate}
                </Text>
                <Text style={styles.infoText}>
                  <Text style={styles.bold}>Net Wt:</Text> {netWeight}
                </Text>
                <Text style={styles.infoText}>
                  <Text style={styles.bold}>Batch #:</Text> {batchNumber}
                </Text>
              </View>

              <View style={styles.qrContainer}>
                <QRCode value={qrPayload} size={84} />
                <Text style={styles.scanNotice}>Scan to Verify</Text>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.footerNote}>{fssaiNumber}</Text>
              <Text style={styles.footerNote}>ISO 9001 • ICAR Protocol</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={onClose}>
              <Text style={styles.secondaryBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryBtn} onPress={handlePrintA4}>
              <Ionicons name="print-outline" size={16} color="#020d06" />
              <Text style={styles.primaryBtnText}>Print A4 Labels (PDF)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  dialog: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#090e17',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 20,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 255, 135, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: FONT.extraBold,
    color: '#f8fafc',
  },
  headerSub: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  previewBox: {
    backgroundColor: '#0f172a',
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: '#00ff87',
    padding: 16,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardBrand: {
    fontSize: 12,
    fontFamily: FONT.extraBold,
    color: '#00ff87',
    letterSpacing: 0.6,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 255, 135, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.3)',
  },
  verifiedText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#00ff87',
  },
  productTitle: {
    fontSize: 18,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  puritySub: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#38bdf8',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    paddingVertical: 6,
  },
  infoText: {
    fontSize: 12,
    fontFamily: FONT.regular,
    color: '#cbd5e1',
  },
  bold: {
    fontFamily: FONT.bold,
    color: '#f8fafc',
  },
  qrContainer: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 8,
    borderRadius: 8,
  },
  scanNotice: {
    fontSize: 9,
    fontFamily: FONT.bold,
    color: '#0f172a',
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 8,
  },
  footerNote: {
    fontSize: 10,
    fontFamily: FONT.regular,
    color: '#64748b',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
  },
  secondaryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  secondaryBtnText: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#cbd5e1',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#00ff87',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  primaryBtnText: {
    fontSize: 13,
    fontFamily: FONT.extraBold,
    color: '#020d06',
  },
});
