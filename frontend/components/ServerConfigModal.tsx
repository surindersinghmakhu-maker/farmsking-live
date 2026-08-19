import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { setApiBaseUrl, testServerConnection } from '../src/api/client';
import {
  getActiveApiUrl,
  getAutoDetectedHostIp,
  getDefaultApiUrl,
  normalizeApiUrl,
  resetCustomApiUrl,
  saveCustomApiUrl,
} from '../src/constants/config';
import { FONT, RADIUS, SPACING } from '../constants/theme';

interface ServerConfigModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved?: (newUrl: string) => void;
}

export function ServerConfigModal({ visible, onClose, onSaved }: ServerConfigModalProps) {
  const [ipInput, setIpInput] = useState('');
  const [activeUrl, setActiveUrl] = useState('');
  const [autoHostIp, setAutoHostIp] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (visible) {
      loadCurrentConfig();
    }
  }, [visible]);

  const loadCurrentConfig = async () => {
    const current = await getActiveApiUrl();
    setActiveUrl(current);
    setIpInput(current);
    setAutoHostIp(getAutoDetectedHostIp());
    setTestResult(null);
  };

  const handleTestConnection = async (targetUrl?: string) => {
    const urlToTest = normalizeApiUrl(targetUrl || ipInput);
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testServerConnection(urlToTest);
      setTestResult({ success: res.success, message: res.message });
    } catch (err: any) {
      setTestResult({ success: false, message: err?.message || 'Connection failed' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const normalized = await saveCustomApiUrl(ipInput);
      setApiBaseUrl(normalized);
      setActiveUrl(normalized);
      if (onSaved) onSaved(normalized);
      onClose();
    } catch (err) {
      setTestResult({ success: false, message: 'Failed to save settings' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setIsSaving(true);
    try {
      const defaultUrl = await resetCustomApiUrl();
      setApiBaseUrl(defaultUrl);
      setActiveUrl(defaultUrl);
      setIpInput(defaultUrl);
      if (onSaved) onSaved(defaultUrl);
      setTestResult({ success: true, message: 'Reset to default configuration' });
    } finally {
      setIsSaving(false);
    }
  };

  const applyPreset = (rawUrl: string) => {
    const normalized = normalizeApiUrl(rawUrl);
    setIpInput(normalized);
    handleTestConnection(normalized);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="hardware-chip-outline" size={24} color="#16a34a" />
              <Text style={styles.headerTitle}>Backend Server Config</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={26} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Connect mobile app to backend server on local network. Enter PC IP address or select preset.
          </Text>

          <View style={styles.activeUrlBox}>
            <Text style={styles.activeUrlLabel}>Current Active API URL:</Text>
            <Text style={styles.activeUrlText} numberOfLines={1}>{activeUrl || 'Loading...'}</Text>
          </View>

          <Text style={styles.label}>Quick Presets:</Text>
          <View style={styles.presetsRow}>
            {autoHostIp ? (
              <TouchableOpacity style={styles.presetChipAuto} onPress={() => applyPreset(`http://${autoHostIp}:4100/api/v1`)}>
                <Ionicons name="wifi" size={14} color="#15803d" />
                <Text style={styles.presetChipAutoText}>Auto PC IP ({autoHostIp})</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity style={styles.presetChip} onPress={() => applyPreset('http://10.0.2.2:4100/api/v1')}>
              <Text style={styles.presetChipText}>Android Emulator (10.0.2.2)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.presetChip} onPress={() => applyPreset('http://localhost:4100/api/v1')}>
              <Text style={styles.presetChipText}>Localhost</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Server IP / URL Input:</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="globe-outline" size={18} color="#64748b" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.input}
              value={ipInput}
              onChangeText={(text) => {
                setIpInput(text);
                setTestResult(null);
              }}
              placeholder="e.g. 192.168.1.15:4100 or http://192.168.1.15:4100/api/v1"
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <Text style={styles.hint}>Tip: Enter PC Wi-Fi IP (e.g. 192.168.1.5 or 192.168.1.5:4100)</Text>

          {testResult ? (
            <View style={[styles.testBox, testResult.success ? styles.testSuccess : styles.testError]}>
              <Ionicons
                name={testResult.success ? 'checkmark-circle' : 'alert-circle'}
                size={18}
                color={testResult.success ? '#15803d' : '#b91c1c'}
              />
              <Text style={[styles.testText, testResult.success ? styles.testSuccessText : styles.testErrorText]}>
                {testResult.message}
              </Text>
            </View>
          ) : null}

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.testBtn}
              onPress={() => handleTestConnection()}
              disabled={isTesting}
            >
              {isTesting ? (
                <ActivityIndicator size="small" color="#16a34a" />
              ) : (
                <>
                  <Ionicons name="pulse" size={16} color="#16a34a" />
                  <Text style={styles.testBtnText}>Test IP</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Save & Apply</Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
            <Text style={styles.resetBtnText}>Reset to Default</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    fontFamily: FONT.medium,
    marginBottom: 14,
    lineHeight: 18,
  },
  activeUrlBox: {
    backgroundColor: '#f8fafc',
    borderRadius: RADIUS.md,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
  },
  activeUrlLabel: {
    fontSize: 11,
    color: '#64748b',
    fontFamily: FONT.bold,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  activeUrlText: {
    fontSize: 13.5,
    color: '#16a34a',
    fontFamily: FONT.bold,
  },
  label: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#334155',
    marginBottom: 6,
    marginTop: 4,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  presetChipAuto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#dcfce7',
    borderColor: '#86efac',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  presetChipAutoText: {
    color: '#15803d',
    fontSize: 12,
    fontFamily: FONT.bold,
  },
  presetChip: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  presetChipText: {
    color: '#475569',
    fontSize: 12,
    fontFamily: FONT.medium,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: RADIUS.md,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: FONT.medium,
    color: '#0f172a',
  },
  hint: {
    fontSize: 11.5,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 12,
  },
  testBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: RADIUS.md,
    marginBottom: 14,
  },
  testSuccess: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  testError: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  testText: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: FONT.medium,
  },
  testSuccessText: {
    color: '#15803d',
  },
  testErrorText: {
    color: '#b91c1c',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  testBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#16a34a',
    borderRadius: RADIUS.md,
    paddingVertical: 12,
  },
  testBtnText: {
    color: '#16a34a',
    fontSize: 14,
    fontFamily: FONT.bold,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: '#16a34a',
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: FONT.bold,
  },
  resetBtn: {
    alignSelf: 'center',
    marginTop: 14,
    padding: 4,
  },
  resetBtnText: {
    color: '#64748b',
    fontSize: 12,
    fontFamily: FONT.bold,
    textDecorationLine: 'underline',
  },
});
