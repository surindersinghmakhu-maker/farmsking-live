import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getIsoModuleControls, toggleIsoModule, getIsoAuditLogs, IsoModuleControl, IsoAuditLog } from '../api/iso-controls.api';

export const IsoControlCenterPanel: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [controls, setControls] = useState<IsoModuleControl[]>([]);
  const [auditLogs, setAuditLogs] = useState<IsoAuditLog[]>([]);
  const [activeTab, setActiveTab] = useState<'CONTROLS' | 'AUDIT'>('CONTROLS');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [customMsg, setCustomMsg] = useState<string>('');
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const fetchControls = async () => {
    try {
      setLoading(true);
      const data = await getIsoModuleControls();
      setControls(data);
    } catch (e) {
      console.warn('Failed to fetch ISO controls:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const logs = await getIsoAuditLogs();
      setAuditLogs(logs);
    } catch (e) {
      console.warn('Failed to fetch ISO audit logs:', e);
    }
  };

  useEffect(() => {
    fetchControls();
    fetchAuditLogs();
  }, []);

  const handleToggle = async (moduleKey: string, currentEnabled: boolean) => {
    try {
      setSavingKey(moduleKey);
      const newStatus = !currentEnabled;
      await toggleIsoModule(moduleKey, newStatus);
      await fetchControls();
      await fetchAuditLogs();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to toggle module state.');
    } finally {
      setSavingKey(null);
    }
  };

  const handleSaveMessage = async (moduleKey: string, isEnabled: boolean) => {
    try {
      setSavingKey(moduleKey);
      await toggleIsoModule(moduleKey, isEnabled, customMsg);
      setEditingKey(null);
      await fetchControls();
      await fetchAuditLogs();
      Alert.alert('Success', 'Maintenance message updated.');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to update maintenance message.');
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator color="#16a34a" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Badge */}
      <View style={styles.badgeBanner}>
        <Ionicons name="shield-checkmark" size={24} color="#f59e0b" />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.badgeTitle}>ISO 9001:2026 Certification Module Control</Text>
          <Text style={styles.badgeSub}>
            Independent Maintenance Mode Toggles & Audit Trail for ISO Compliance Verification
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'CONTROLS' && styles.tabBtnActive]}
          onPress={() => setActiveTab('CONTROLS')}
        >
          <Ionicons name="toggle" size={18} color={activeTab === 'CONTROLS' ? '#ffffff' : '#94a3b8'} />
          <Text style={[styles.tabBtnText, activeTab === 'CONTROLS' && styles.tabBtnTextActive]}>
            Module Controls ({controls.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'AUDIT' && styles.tabBtnActive]}
          onPress={() => setActiveTab('AUDIT')}
        >
          <Ionicons name="document-text" size={18} color={activeTab === 'AUDIT' ? '#ffffff' : '#94a3b8'} />
          <Text style={[styles.tabBtnText, activeTab === 'AUDIT' && styles.tabBtnTextActive]}>
            ISO Audit Trail ({auditLogs.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'CONTROLS' ? (
        <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
          {controls.map((item) => {
            const isSaving = savingKey === item.moduleKey;
            const isEditing = editingKey === item.moduleKey;

            return (
              <View
                key={item.moduleKey}
                style={[
                  styles.card,
                  !item.isEnabled && { borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.08)' },
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.moduleName}>{item.moduleName}</Text>
                      <View
                        style={[
                          styles.statusPill,
                          { backgroundColor: item.isEnabled ? 'rgba(22, 163, 74, 0.2)' : 'rgba(239, 68, 68, 0.2)' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusPillText,
                            { color: item.isEnabled ? '#4ade80' : '#f87171' },
                          ]}
                        >
                          {item.isEnabled ? 'LIVE / ACTIVE' : 'MAINTENANCE MODE'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.moduleKey}>Key: {item.moduleKey}</Text>
                  </View>

                  {isSaving ? (
                    <ActivityIndicator color="#16a34a" />
                  ) : (
                    <Switch
                      value={item.isEnabled}
                      onValueChange={() => handleToggle(item.moduleKey, item.isEnabled)}
                      trackColor={{ false: '#ef4444', true: '#16a34a' }}
                      thumbColor="#ffffff"
                    />
                  )}
                </View>

                {/* Maintenance Message */}
                <View style={styles.msgBox}>
                  <Text style={styles.msgLabel}>Maintenance Mode Message:</Text>
                  <Text style={styles.msgText}>{item.maintenanceMessage}</Text>
                  <TouchableOpacity
                    style={styles.editMsgBtn}
                    onPress={() => {
                      setEditingKey(item.moduleKey);
                      setCustomMsg(item.maintenanceMessage || '');
                    }}
                  >
                    <Ionicons name="create-outline" size={14} color="#38bdf8" />
                    <Text style={styles.editMsgText}>Custom Message</Text>
                  </TouchableOpacity>
                </View>

                {isEditing && (
                  <View style={styles.editBox}>
                    <TextInput
                      style={styles.editInput}
                      value={customMsg}
                      onChangeText={setCustomMsg}
                      placeholder="Enter custom maintenance message..."
                      placeholderTextColor="#64748b"
                    />
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                      <TouchableOpacity
                        style={styles.saveBtn}
                        onPress={() => handleSaveMessage(item.moduleKey, item.isEnabled)}
                      >
                        <Text style={styles.saveBtnText}>Save</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingKey(null)}>
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
          {auditLogs.length === 0 ? (
            <Text style={styles.emptyLogsText}>No ISO Audit logs recorded yet.</Text>
          ) : (
            auditLogs.map((log) => (
              <View key={log.id} style={styles.logCard}>
                <View style={styles.logHeader}>
                  <Ionicons name="document-text-outline" size={18} color="#38bdf8" />
                  <Text style={styles.logAction}>{log.action}</Text>
                  <Text style={styles.logTime}>{new Date(log.createdAt).toLocaleString()}</Text>
                </View>
                <Text style={styles.logActor}>Actor: {log.actorName || log.actorId}</Text>
                {log.moduleKey && <Text style={styles.logModule}>Module: {log.moduleKey}</Text>}
                {log.details && (
                  <Text style={styles.logDetails}>{JSON.stringify(log.details, null, 2)}</Text>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 16,
  },
  centerBox: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#f59e0b',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  badgeTitle: {
    color: '#f59e0b',
    fontWeight: '800',
    fontSize: 14,
  },
  badgeSub: {
    color: '#cbd5e1',
    fontSize: 11,
    marginTop: 2,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  tabBtnActive: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  tabBtnText: {
    color: '#94a3b8',
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 6,
  },
  tabBtnTextActive: {
    color: '#ffffff',
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moduleName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  moduleKey: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  statusPill: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 10,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  msgBox: {
    marginTop: 12,
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  msgLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  msgText: {
    color: '#e2e8f0',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 18,
  },
  editMsgBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  editMsgText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  editBox: {
    marginTop: 10,
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 10,
  },
  editInput: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 10,
    color: '#ffffff',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#334155',
  },
  saveBtn: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
  cancelBtn: {
    backgroundColor: '#475569',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
  logCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  logAction: {
    color: '#38bdf8',
    fontWeight: '800',
    fontSize: 13,
    marginLeft: 6,
    flex: 1,
  },
  logTime: {
    color: '#64748b',
    fontSize: 11,
  },
  logActor: {
    color: '#e2e8f0',
    fontSize: 12,
  },
  logModule: {
    color: '#f59e0b',
    fontSize: 11,
    marginTop: 2,
  },
  logDetails: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 6,
    backgroundColor: '#0f172a',
    padding: 8,
    borderRadius: 6,
    fontFamily: 'monospace',
  },
  emptyLogsText: {
    color: '#64748b',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },
});
