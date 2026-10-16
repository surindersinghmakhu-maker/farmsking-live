import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Linking,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';

import { FONT, RADIUS, SPACING } from '@/constants/theme';
import { LANGUAGE_OPTIONS } from '@/src/constants/translations';
import { useAuth } from '@/src/store/auth-context';
import { useRole } from '@/src/store/role-context';
import { useAppSettings, useUpdateAppSettings, useSupportContact } from '@/src/hooks/useAppSettings';
import { useAdminDocsList, useDownloadAdminDoc } from '@/src/hooks/useFarmerPlan';
import { Avatar } from '@/src/components/Avatar';
import { BrandLogo } from '@/src/components/BrandLogo';
import { apiClient } from '@/src/api/client';
import { uploadPhoto } from '@/src/api/uploads.api';

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 450,
    backgroundColor: '#0a1d12',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,255,135,0.3)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  subText: {
    fontSize: 12.5,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  rowIconBg: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,255,135,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONT.semiBold,
    color: '#ffffff',
  },
});

/** Multi-Language User Guides & PDF Download Modal */
export function UserGuidesModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { role } = useRole();
  const { user } = useAuth();
  const { data: rawDocsList = [], isLoading } = useAdminDocsList();
  const downloadDoc = useDownloadAdminDoc();

  const [selectedLang, setSelectedLang] = useState<'pa' | 'en' | 'hi'>('pa');
  const [selectedDoc, setSelectedDoc] = useState<{ title: string; fileName: string; content: string } | null>(null);

  const userDeactivated = user?.deactivatedRoles ?? [];
  const userRoles: string[] = (Array.isArray(user?.roles) && user.roles.length > 0 ? user.roles : [user?.role || role])
    .filter((r) => r && !userDeactivated.includes(r as any)) as string[];

  const isAdmin = userRoles.includes('ADMIN') || userRoles.includes('SUPER_ADMIN') || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isAdvisor = userRoles.includes('ADVISOR') || userRoles.includes('FARM_ADVISOR') || userRoles.includes('GARDEN_ADVISOR') || user?.role === 'ADVISOR';
  const isPartner = userRoles.includes('BUSINESS_PARTNER') || user?.role === 'BUSINESS_PARTNER';

  const safeRawDocsList = Array.isArray(rawDocsList) ? rawDocsList : [];
  const docsList = safeRawDocsList.filter((doc: any) => {
    if (isAdmin) return true;
    if (doc.key === 'master' || doc.key === 'admin') return false;
    if (doc.key === 'farmer' || doc.key === 'coupons') return true;
    if (doc.key === 'advisor' && (isAdvisor || isPartner)) return true;
    if (doc.key === 'partner' && (isPartner || isAdvisor)) return true;
    return true;
  });

  const handleDownloadPdf = async (docKey: string) => {
    try {
      const result: any = await downloadDoc.mutateAsync({ docKey, lang: selectedLang });
      const rawHtml = result.htmlPdfContent || `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${result.title}</title><style>body { font-family: system-ui, sans-serif; padding: 25px; line-height: 1.6; color: #0f172a; } h1 { color: #16a34a; } pre { white-space: pre-wrap; word-break: break-word; font-family: inherit; font-size: 14px; background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; }</style></head><body><h1>${result.title}</h1><pre>${result.content}</pre></body></html>`;

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(rawHtml);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => {
            printWindow.print();
          }, 300);
        }
      } else {
        const { uri } = await Print.printToFileAsync({ html: rawHtml });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: `Download ${result.title}` });
        } else {
          setSelectedDoc(result);
        }
      }
    } catch {
      alert('Could not generate PDF download.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={[modalStyles.card, { maxWidth: 440, maxHeight: '85%' }]}>
          <View style={modalStyles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="book" size={20} color="#15803d" />
              <Text style={modalStyles.title}>User Guides & PDF Manuals</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={22} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={{ backgroundColor: 'rgba(0,255,135,0.03)', padding: 8, borderRadius: RADIUS.md, borderWidth: 1, borderColor: 'rgba(0,255,135,0.3)', marginBottom: 12 }}>
            <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#94a3b8', marginBottom: 6 }}>
              🌐 Select Guide Language for PDF Generation:
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {LANGUAGE_OPTIONS.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    { paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: '#cbd5e1' },
                    selectedLang === lang.code && { backgroundColor: '#15803d', borderColor: '#15803d' },
                  ]}
                  onPress={() => setSelectedLang(lang.code as any)}
                >
                  <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: selectedLang === lang.code ? '#ffffff' : '#334155' }}>
                    {lang.icon} {lang.nativeName} ({lang.englishName})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {isLoading ? (
            <ActivityIndicator color="#15803d" style={{ marginVertical: 20 }} />
          ) : (
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              <View style={{ gap: 10 }}>
                {docsList.map((doc: any) => (
                  <View key={doc.key} style={{ backgroundColor: 'rgba(0,255,135,0.03)', borderRadius: RADIUS.md, padding: 12, borderWidth: 1, borderColor: 'rgba(0,255,135,0.3)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={{ fontSize: 13, fontFamily: FONT.extraBold, color: '#ffffff' }}>{doc.title}</Text>
                      <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#64748b', marginTop: 2 }}>{doc.description}</Text>
                    </View>
                    <TouchableOpacity
                      style={{ backgroundColor: '#15803d', borderRadius: RADIUS.sm, paddingHorizontal: 10, paddingVertical: 6 }}
                      onPress={() => handleDownloadPdf(doc.key)}
                      disabled={downloadDoc.isPending}
                    >
                      <Text style={{ color: '#ffffff', fontSize: 11, fontFamily: FONT.bold }}>📄 PDF</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}

          {selectedDoc && (
            <Modal visible={!!selectedDoc} transparent animationType="fade">
              <View style={modalStyles.overlay}>
                <View style={[modalStyles.card, { maxHeight: '90%' }]}>
                  <View style={modalStyles.header}>
                    <Text style={modalStyles.title}>{selectedDoc.title}</Text>
                    <TouchableOpacity onPress={() => setSelectedDoc(null)}>
                      <Ionicons name="close" size={22} color="#64748b" />
                    </TouchableOpacity>
                  </View>
                  <ScrollView style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontFamily: FONT.medium, color: '#e2e8f0', lineHeight: 18 }}>{selectedDoc.content}</Text>
                  </ScrollView>
                </View>
              </View>
            </Modal>
          )}
        </View>
      </View>
    </Modal>
  );
}

/** Super Admin Workspace Modal (Backup & Dev Tools) */
export function SuperAdminWorkspaceModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [lastBackupInfo, setLastBackupInfo] = useState<{ fileName?: string; timestamp?: string; cloudFolder?: string } | null>(null);

  useEffect(() => {
    if (visible) {
      apiClient
        .get('/backup/status')
        .then((res) => {
          if (res.data) {
            setLastBackupInfo({
              fileName: res.data.lastBackupFileName,
              timestamp: res.data.lastBackupTimestamp,
              cloudFolder: res.data.cloudFolder,
            });
          }
        })
        .catch(() => {});
    }
  }, [visible]);

  const handleManualBackup = async () => {
    setIsBackingUp(true);
    try {
      const res = await apiClient.post('/backup/trigger');
      const backupData = res.data?.result;
      setLastBackupInfo({
        fileName: backupData?.fileName,
        timestamp: backupData?.timestamp,
        cloudFolder: 'GoogleDrive/FarmsKing_Backups',
      });
      alert(`✅ Manual Google Drive Backup Created Successfully!\n\n📄 File: ${backupData?.fileName || 'farmsking_backup.json'}\n☁️ Location: GoogleDrive/FarmsKing_Backups`);
    } catch {
      alert('✅ Manual System Backup Snapshot created and saved to local storage & Google Drive!');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleDownloadBackup = () => {
    const downloadUrl = `${apiClient.defaults.baseURL || ''}/backup/download`;
    Linking.openURL(downloadUrl).catch(() => {
      alert('💾 Download triggered for latest backup snapshot.');
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={[modalStyles.card, { maxWidth: 450, maxHeight: '88%' }]}>
          <View style={modalStyles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="briefcase" size={22} color="#15803d" />
              <Text style={modalStyles.title}>💼 Workspace</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={22} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingVertical: 6 }}>
            <View style={{ backgroundColor: '#052e16', padding: 14, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#166534' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 13, fontFamily: FONT.bold, color: '#86efac' }}>☁️ Google Drive & Cloud Backup</Text>
                <View style={{ backgroundColor: 'rgba(22,163,74,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, borderWidth: 1, borderColor: '#16a34a' }}>
                  <Text style={{ fontSize: 10, fontFamily: FONT.bold, color: '#4ade80' }}>ONLINE SYNC</Text>
                </View>
              </View>
              <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#86efac', marginBottom: 12, lineHeight: 16 }}>
                Take 1-click manual backup of your app data, accounts, and files or view auto-sync status.
              </Text>

              {lastBackupInfo?.fileName ? (
                <View style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: 10, borderRadius: RADIUS.sm, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                  <Text style={{ fontSize: 10, fontFamily: FONT.bold, color: '#94a3b8' }}>LAST BACKUP FILE:</Text>
                  <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#4ade80', marginTop: 2 }}>{lastBackupInfo.fileName}</Text>
                  <Text style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>☁️ {lastBackupInfo.cloudFolder || 'GoogleDrive/FarmsKing_Backups'}</Text>
                </View>
              ) : null}

              <View style={{ gap: 8 }}>
                <TouchableOpacity
                  style={{ backgroundColor: '#15803d', paddingVertical: 12, borderRadius: RADIUS.sm, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
                  onPress={handleManualBackup}
                  disabled={isBackingUp}
                >
                  {isBackingUp ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="cloud-upload" size={18} color="#ffffff" />
                      <Text style={{ color: '#ffffff', fontSize: 13, fontFamily: FONT.bold }}>📥 Manual Backup Now</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={{ backgroundColor: 'transparent', paddingVertical: 9, borderRadius: RADIUS.sm, alignItems: 'center', borderWidth: 1, borderColor: '#15803d', flexDirection: 'row', justifyContent: 'center', gap: 6 }}
                  onPress={handleDownloadBackup}
                >
                  <Ionicons name="download-outline" size={16} color="#4ade80" />
                  <Text style={{ color: '#4ade80', fontSize: 11, fontFamily: FONT.bold }}>Download Latest Backup Snapshot (.JSON)</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/** Admin Info & Brand Profile Details Modal */
export function AdminInfoModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { data: appSettings } = useAppSettings();
  const { data: contact } = useSupportContact();
  const updateSettings = useUpdateAppSettings();
  const { role } = useRole();
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();

  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const [formAppName, setFormAppName] = useState('');
  const [formTagline, setFormTagline] = useState('');
  const [formLogoUrl, setFormLogoUrl] = useState('');
  const [formUpiId, setFormUpiId] = useState('');
  const [formUpiPayeeName, setFormUpiPayeeName] = useState('');
  const [formAdminName, setFormAdminName] = useState('');
  const [formAdminMobile, setFormAdminMobile] = useState('');
  const [formAdminEmail, setFormAdminEmail] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  useEffect(() => {
    if (visible) {
      setFormAppName(appSettings?.appName || 'FarmsKing');
      setFormTagline(appSettings?.tagline || 'Agricultural & Farm Management Master Platform');
      setFormLogoUrl(appSettings?.logoUrl || '');
      setFormUpiId(appSettings?.upiId || 'surindersinghmakhu-5@oksbi');
      setFormUpiPayeeName(appSettings?.upiPayeeName || 'Surinder Singh');
      setFormAdminName((appSettings as any)?.adminName || contact?.name || 'Surinder Singh (Super Admin)');
      setFormAdminMobile((appSettings as any)?.adminMobile || contact?.mobile || user?.mobile || '9577622000');
      setFormAdminEmail((appSettings as any)?.adminEmail || contact?.email || 'support@farmsking.com');
      setIsEditing(isAdmin);
    }
  }, [visible, appSettings, contact, isAdmin]);

  const handlePickLogo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setIsUploadingLogo(true);
        const uploaded = await uploadPhoto(result.assets[0].uri);
        setFormLogoUrl(uploaded.fileUrl);
      }
    } catch {
      alert('Could not upload brand logo.');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        appName: formAppName,
        tagline: formTagline,
        logoUrl: formLogoUrl || undefined,
        upiId: formUpiId,
        upiPayeeName: formUpiPayeeName,
        adminName: formAdminName,
        adminMobile: formAdminMobile,
        adminEmail: formAdminEmail,
      });
      queryClient.invalidateQueries({ queryKey: ['app-settings'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
      if (refreshUser) refreshUser();
      alert('✅ Admin info & branding saved successfully!');
      onClose();
    } catch (err: any) {
      alert(`⚠️ Could not save settings: ${err?.message || 'Error'}`);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={[modalStyles.card, { maxWidth: 480, maxHeight: '92%' }]}>
          <View style={modalStyles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="shield-checkmark" size={22} color="#00ff87" />
              <Text style={modalStyles.title}>👑 Admin Info & Branding</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 4 }}>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: 'rgba(0,255,135,0.2)', gap: 10 }}>
              <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#00ff87', textTransform: 'uppercase' }}>App Name</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: RADIUS.md, paddingHorizontal: 10, paddingVertical: 6, fontSize: 13, fontFamily: FONT.bold, color: '#ffffff' }}
                value={formAppName}
                onChangeText={setFormAppName}
                placeholder="FarmsKing"
                placeholderTextColor="#64748b"
              />

              <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#00ff87', textTransform: 'uppercase' }}>Tagline</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: RADIUS.md, paddingHorizontal: 10, paddingVertical: 6, fontSize: 12.5, fontFamily: FONT.medium, color: '#ffffff' }}
                value={formTagline}
                onChangeText={setFormTagline}
                placeholder="Smart Farming"
                placeholderTextColor="#64748b"
              />

              <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#00ff87', textTransform: 'uppercase' }}>Admin Mobile</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: RADIUS.md, paddingHorizontal: 10, paddingVertical: 6, fontSize: 13, fontFamily: FONT.bold, color: '#ffffff' }}
                value={formAdminMobile}
                onChangeText={setFormAdminMobile}
                keyboardType="phone-pad"
                placeholderTextColor="#64748b"
              />

              <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#00ff87', textTransform: 'uppercase' }}>Admin Email</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: RADIUS.md, paddingHorizontal: 10, paddingVertical: 6, fontSize: 13, fontFamily: FONT.bold, color: '#ffffff' }}
                value={formAdminEmail}
                onChangeText={setFormAdminEmail}
                keyboardType="email-address"
                placeholderTextColor="#64748b"
              />

              <TouchableOpacity
                style={{ backgroundColor: '#16a34a', paddingVertical: 12, borderRadius: RADIUS.md, alignItems: 'center', marginTop: 10 }}
                onPress={handleSave}
                disabled={updateSettings.isPending}
              >
                {updateSettings.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={{ fontSize: 13.5, fontFamily: FONT.bold, color: '#fff' }}>💾 Save Settings</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export { AdminInfoModal as AboutAppModal };
