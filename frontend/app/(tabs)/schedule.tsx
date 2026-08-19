import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  LayoutAnimation,
  UIManager,
  TouchableOpacity,
  Platform,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { RegisteredCropField } from '@/src/store/crops-context';
import { useAcceptedCropsForAdvisor, useUpdateCropSchedule } from '@/src/hooks/useCrops';
import { AdvisorReviewCropCycle } from '@/src/types/api';
import { useSprayScheduleForCrop, useDeleteSprayScheduleItem } from '@/src/hooks/useSpraySchedules';
import { ItemTemplatesSection } from '@/src/components/ItemTemplatesSection';
import { QuickAddDoseItemModal } from '@/src/components/QuickAddDoseItemModal';
import { useMySprayItemTemplates } from '@/src/hooks/useSprayItemTemplates';

const CATEGORY_DISPLAY: Record<string, { name: string; color: string; bg: string }> = {
  FLOWERS: { name: 'Flowers & Floriculture', color: '#e11d48', bg: '#ffe4e6' },
  VEGETABLES: { name: 'Vegetables', color: '#047857', bg: '#ecfdf5' },
  FRUITS: { name: 'Fruits & Orchards', color: '#c2410c', bg: '#fff7ed' },
  GRAINS: { name: 'Cereals & Grains', color: '#15803d', bg: '#f0fdf4' },
  PULSES: { name: 'Pulses & Legumes', color: '#b45309', bg: '#fffbeb' },
  SPICES: { name: 'Spices & Condiments', color: '#ea580c', bg: '#ffedd5' },
  CASH_CROP: { name: 'Commercial & Cash Crops', color: '#7c3aed', bg: '#f5f3ff' },
  OTHER: { name: 'Other Crops', color: '#64748b', bg: '#f1f5f9' },
};

const AREA_UNIT_LABEL: Record<string, string> = { ACRE: 'Killa (Acre)', HECTARE: 'Hectare', BIGHA: 'Bigha', GUNTA: 'Gunta' };

/** Advisor-side crops (real backend, accepted only) adapted into the same card shape the farmer-side screens use. */
function toScheduleFarmCard(crop: AdvisorReviewCropCycle): RegisteredCropField {
  const cat = CATEGORY_DISPLAY[crop.category ?? 'OTHER'] ?? CATEGORY_DISPLAY.OTHER;
  const areaUnit = crop.plot.areaUnit ?? 'ACRE';
  const areaText = crop.plot.area != null ? `${crop.plot.area} ${AREA_UNIT_LABEL[areaUnit]}` : '';
  const sowingDateDisplay =
    crop.notes || (crop.sowingDate ? new Date(crop.sowingDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '');
  const owner = crop.plot.farm.owner;

  return {
    id: crop.id,
    cropName: crop.cropName,
    categoryName: cat.name,
    categoryColor: cat.color,
    categoryBg: cat.bg,
    fieldName: crop.plot.name,
    area: areaText,
    sowingDate: sowingDateDisplay,
    variety: crop.variety ?? undefined,
    unit: (crop.unit as RegisteredCropField['unit']) ?? 'KG',
    pricePerUnit: crop.pricePerUnit ?? '',
    stage: crop.stage,
    status: crop.stage === 'COMPLETED' ? 'INACTIVE' : 'ACTIVE',
    advisorStatus: crop.advisorReviewStatus ?? 'NONE',
    assignedSchedule: crop.assignedSchedule ?? undefined,
    farmerName: owner?.name,
    farmerPhone: owner?.mobile,
    location: [owner?.village, owner?.district, owner?.state].filter(Boolean).join(', '),
    harvestType: crop.harvestType,
    irrigationType: (crop.plot.irrigationType as RegisteredCropField['irrigationType']) ?? undefined,
  };
}

const theme = RoleThemes.FARM_ADVISOR;

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/** Reusable collapse/expand wrapper */
function CollapsibleSection({
  title,
  count,
  isExpanded,
  onToggle,
  accentColor = '#15803d',
  children,
}: {
  title: string;
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
  accentColor?: string;
  children: React.ReactNode;
}) {
  return (
    <View>
      <TouchableOpacity
        style={collapseStyles.toggleRow}
        activeOpacity={0.7}
        onPress={onToggle}
      >
        <Text style={[collapseStyles.toggleLabel, { color: accentColor }]}>
          {title} ({count})
        </Text>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={accentColor}
        />
      </TouchableOpacity>
      {isExpanded && children}
    </View>
  );
}

const collapseStyles = StyleSheet.create({
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 2,
    marginTop: 4,
  },
  toggleLabel: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
  },
});

/** Per-crop spray schedule list + "Add Spray Item" trigger — a self-contained subcomponent so each card can call its own useSprayScheduleForCrop hook. */
function SprayScheduleSection({
  cropCycleId,
  accentColor,
  isExpanded,
  onToggle,
}: {
  cropCycleId: string;
  accentColor: string;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { data: itemsRaw } = useSprayScheduleForCrop(cropCycleId);
  const items = itemsRaw ?? [];
  const deleteItem = useDeleteSprayScheduleItem();

  return (
    <View style={{ marginTop: 8 }}>
      <CollapsibleSection
        title="🧪 Spray Schedule"
        count={items.length}
        isExpanded={isExpanded}
        onToggle={onToggle}
        accentColor={accentColor}
      >
        {items.length === 0 ? (
          <Text style={sprayStyles.emptyText}>No schedule available</Text>
        ) : (
          <View style={sprayStyles.table}>
            <View style={[sprayStyles.tableRow, sprayStyles.tableHeaderRow]}>
              <Text style={[sprayStyles.tableCell, sprayStyles.tableHeaderText, { flex: 1.4 }]}>Item</Text>
              <Text style={[sprayStyles.tableCell, sprayStyles.tableHeaderText, { flex: 1.1 }]}>Dose</Text>
              <Text style={[sprayStyles.tableCell, sprayStyles.tableHeaderText, { flex: 0.9 }]}>Alt. 1</Text>
              <Text style={[sprayStyles.tableCell, sprayStyles.tableHeaderText, { flex: 0.9 }]}>Alt. 2</Text>
              <View style={{ width: 22 }} />
            </View>
            {items.map((item) => (
              <View key={item.id} style={sprayStyles.tableRow}>
                <View style={{ flex: 1.4 }}>
                  <Text style={sprayStyles.tableCell}>{item.recommendedProduct || '—'}</Text>
                  <Text style={sprayStyles.tableDateText}>
                    📅 {new Date(item.scheduledDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </Text>
                </View>
                <Text style={[sprayStyles.tableCell, { flex: 1.1 }]}>{item.dosageInstructions || '—'}</Text>
                <Text style={[sprayStyles.tableCell, { flex: 0.9 }]}>{item.alternativeOption || '—'}</Text>
                <Text style={[sprayStyles.tableCell, { flex: 0.9 }]}>{item.alternativeOption2 || '—'}</Text>
                <TouchableOpacity
                  style={{ width: 22, alignItems: 'center' }}
                  onPress={() => {
                    tap();
                    deleteItem.mutate({ id: item.id, cropCycleId });
                  }}
                >
                  <Ionicons name="trash-outline" size={14} color="#dc2626" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </CollapsibleSection>
    </View>
  );
}

const sprayStyles = StyleSheet.create({
  modalLabel: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#334155',
    marginTop: 10,
    marginBottom: 4,
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    fontFamily: FONT.medium,
  },
  suggestionBox: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: RADIUS.md,
    backgroundColor: '#ffffff',
    marginTop: 4,
    maxHeight: 160,
    ...premiumShadow('#000000', 'md'),
  },
  suggestionRow: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  suggestionText: {
    fontSize: 13,
    fontFamily: FONT.medium,
    color: '#0f172a',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 4,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  chipText: {
    fontSize: 11.5,
    fontFamily: FONT.semiBold,
    color: '#475569',
  },
  unitToggle: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  unitToggleText: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#475569',
  },
  tankBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#e0f2fe',
    borderRadius: RADIUS.md,
    padding: 9,
    marginTop: 8,
  },
  tankBoxText: {
    flex: 1,
    fontSize: 11.5,
    fontFamily: FONT.semiBold,
    color: '#0369a1',
  },
  totalDoseBox: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: RADIUS.md,
    padding: 10,
    marginTop: 8,
  },
  totalDoseText: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#15803d',
  },
  errorText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#dc2626',
    marginTop: 8,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 18,
    marginBottom: 4,
    borderRadius: RADIUS.md,
    paddingVertical: 13,
  },
  saveBtnText: {
    color: '#ffffff',
    fontFamily: FONT.bold,
    fontSize: 14.5,
  },
  emptyText: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    paddingVertical: 6,
  },
  table: {
    marginTop: 4,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 4,
  },
  tableHeaderRow: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#e2e8f0',
  },
  tableCell: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#334155',
  },
  tableHeaderText: {
    fontFamily: FONT.bold,
    color: '#94a3b8',
    textTransform: 'uppercase',
    fontSize: 9.5,
    letterSpacing: 0.2,
  },
  tableDateText: {
    fontSize: 9.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    marginTop: 1,
  },
  calendarSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: '#bbf7d0',
    backgroundColor: '#f0fdf4',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginVertical: 4,
  },
  calendarSelectorDate: {
    fontSize: 14,
    fontFamily: FONT.bold,
    color: '#15803d',
  },
});

type ScheduleTab = 'SCHEDULE' | 'TEMPLATES' | 'DOSE_ITEMS';

export interface TemplateDayTask {
  id: string;
  dayNumber: number;
  taskTitle: string;
}

export interface AdvisoryTemplate {
  id: string;
  templateName: string;
  targetCrop: string;
  tasks: TemplateDayTask[];
}

export interface PlotScheduleItem {
  id: string;
  dayNumber: string;
  taskTitle: string;
  items: string[];
}

const INITIAL_TEMPLATES: AdvisoryTemplate[] = [
  {
    id: 't1',
    templateName: 'Wheat Master Schedule (गेहूँ)',
    targetCrop: 'Wheat',
    tasks: [
      { id: 'dt1', dayNumber: 1, taskTitle: 'Sowing & Root Initial Fertigation' },
      { id: 'dt2', dayNumber: 5, taskTitle: 'First Watering & DAP Application' },
      { id: 'dt3', dayNumber: 8, taskTitle: 'Weedicide Spray & Soil Moisture Check' },
      { id: 'dt4', dayNumber: 15, taskTitle: 'Micronutrient & Zinc Spray' },
      { id: 'dt5', dayNumber: 30, taskTitle: 'Second Watering & Urea Top-Dressing' },
      { id: 'dt6', dayNumber: 60, taskTitle: 'Flag Leaf Fungicide Protection' },
      { id: 'dt7', dayNumber: 90, taskTitle: 'Grain Filling Audit & Combine Slot' },
    ],
  },
  {
    id: 't2',
    templateName: 'Rose Floriculture Plan (गुलाब)',
    targetCrop: 'Rose',
    tasks: [
      { id: 'rt1', dayNumber: 1, taskTitle: 'Pruning & Plantation Root Treatment' },
      { id: 'rt2', dayNumber: 5, taskTitle: 'Organic NPK Fertigation (19:19:19)' },
      { id: 'rt3', dayNumber: 8, taskTitle: 'Thrips & Mites Preventive Spray' },
      { id: 'rt4', dayNumber: 15, taskTitle: 'Bud Enhancer & Cal-Mag Application' },
      { id: 'rt5', dayNumber: 25, taskTitle: 'First Stalk Plucking & Grade Audit' },
    ],
  },
  {
    id: 't3',
    templateName: 'Vegetable Crop Protection Package',
    targetCrop: 'Vegetables',
    tasks: [
      { id: 'vt1', dayNumber: 1, taskTitle: 'Transplanting & Drenching Treatment' },
      { id: 'vt2', dayNumber: 5, taskTitle: 'Humic Acid & Bio-Stimulant Spray' },
      { id: 'vt3', dayNumber: 8, taskTitle: 'Sucking Pest Spray & Sticky Traps' },
      { id: 'vt4', dayNumber: 15, taskTitle: 'Blossom Rot Control & Boron Spray' },
      { id: 'vt5', dayNumber: 20, taskTitle: 'Harvesting Supervision & Weight Audit' },
    ],
  },
];

/** Parse date string like "15 Nov 2025" or "2025-11-15" into Date */
const parsePlantationDate = (dateStr?: string): Date => {
  if (!dateStr) return new Date();
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) return parsed;

  const parts = dateStr.split(' ');
  if (parts.length >= 3) {
    const day = parseInt(parts[0], 10);
    const monthStr = parts[1];
    const year = parseInt(parts[2], 10);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIndex = monthNames.findIndex((m) => m.toLowerCase() === monthStr.substring(0, 3).toLowerCase());
    if (!isNaN(day) && monthIndex !== -1 && !isNaN(year)) {
      return new Date(year, monthIndex, day);
    }
  }
  return new Date();
};

/** Calculate calendar date given plantation date and day number (Day 1 = Plantation Date) */
const calculateTaskDateObj = (plantationDate: Date, dayNumber: number): Date => {
  const d = new Date(plantationDate);
  d.setDate(d.getDate() + (dayNumber - 1));
  return d;
};

const formatDateStr = (dateObj: Date): string => {
  return dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function ScheduleScreen() {
  const [activeTab, setActiveTab] = useState<ScheduleTab>('SCHEDULE');

  const { data: acceptedCropsRaw } = useAcceptedCropsForAdvisor();
  const updateCropSchedule = useUpdateCropSchedule();
  const cropFields = useMemo(() => (acceptedCropsRaw ?? []).map(toScheduleFarmCard), [acceptedCropsRaw]);
  const cropIdToTankSize = useMemo(() => {
    const map: Record<string, number | null | undefined> = {};
    (acceptedCropsRaw ?? []).forEach((c) => {
      map[c.id] = c.plot.farm.owner?.sprayTankSizeL;
    });
    return map;
  }, [acceptedCropsRaw]);
  const [templates, setTemplates] = useState<AdvisoryTemplate[]>(INITIAL_TEMPLATES);

  // Track which sections are expanded (by unique key)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = useCallback((key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // Active advisor farms
  const activeFarms = useMemo(
    () => cropFields.filter((c) => c.status === 'ACTIVE' && c.advisorStatus === 'ACCEPTED'),
    [cropFields]
  );

  // Modal State for Assigning / Editing Schedule
  const [selectedFarm, setSelectedFarm] = useState<RegisteredCropField | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedTemplateForAssign, setSelectedTemplateForAssign] = useState<AdvisoryTemplate | null>(null);

  // Interactive Daywise Schedule Entries State (Edit, Add, Remove entries)
  const [editingScheduleItems, setEditingScheduleItems] = useState<PlotScheduleItem[]>([]);

  // Modal State for Making / Editing Template
  const [isMakeTemplateModalOpen, setIsMakeTemplateModalOpen] = useState(false);
  const [isQuickAddDoseItemOpen, setIsQuickAddDoseItemOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateCrop, setNewTemplateCrop] = useState('');
  const [newTemplateTasks, setNewTemplateTasks] = useState<{ dayNumber: string; taskTitle: string; items: string[] }[]>([
    { dayNumber: '1', taskTitle: 'Plantation / Sowing Check & Root Treatment', items: [] },
    { dayNumber: '5', taskTitle: 'First Water & DAP Fertigation', items: [] },
    { dayNumber: '8', taskTitle: 'Micronutrient & Pest Inspection', items: [] },
  ]);
  const { data: itemTemplatesForSearch } = useMySprayItemTemplates();

  const openScheduleModal = (farm: RegisteredCropField) => {
    tap();
    setSelectedFarm(farm);
    setSelectedTemplateForAssign(null);

    if (farm.assignedSchedule) {
      const lines = farm.assignedSchedule.split('\n');
      const parsed: PlotScheduleItem[] = [];

      lines.forEach((line, idx) => {
        const match = line.match(/(?:\[?Day\s*(\d+).*?\]?:\s*)(.*)/i);
        if (match) {
          parsed.push({
            id: Date.now().toString() + idx,
            dayNumber: match[1],
            taskTitle: match[2].trim(),
            items: [],
          });
        } else if (line.trim().length > 0 && !line.includes('Schedule') && !line.includes('Plan')) {
          parsed.push({
            id: Date.now().toString() + idx,
            dayNumber: ((idx + 1) * 3).toString(),
            taskTitle: line.trim(),
            items: [],
          });
        }
      });

      if (parsed.length > 0) {
        setEditingScheduleItems(parsed);
      } else {
        setEditingScheduleItems([
          { id: '1', dayNumber: '1', taskTitle: 'Sowing & Root Initial Fertigation', items: [] },
          { id: '2', dayNumber: '5', taskTitle: 'First Watering & DAP Application', items: [] },
          { id: '3', dayNumber: '8', taskTitle: 'Weedicide Spray & Soil Moisture Check', items: [] },
        ]);
      }
    } else {
      setEditingScheduleItems([
        { id: '1', dayNumber: '1', taskTitle: 'Sowing & Root Initial Fertigation', items: [] },
        { id: '2', dayNumber: '5', taskTitle: 'First Watering & DAP Application', items: [] },
        { id: '3', dayNumber: '8', taskTitle: 'Weedicide Spray & Soil Moisture Check', items: [] },
      ]);
    }

    setIsScheduleModalOpen(true);
  };

  const handlePickTemplateToPopulate = (tpl: AdvisoryTemplate) => {
    tap();
    setSelectedTemplateForAssign(tpl);
    setEditingScheduleItems(
      tpl.tasks.map((t, idx) => ({
        id: Date.now().toString() + idx,
        dayNumber: t.dayNumber.toString(),
        taskTitle: t.taskTitle,
        items: [],
      }))
    );
  };

  const handleAddScheduleEntryRow = () => {
    tap();
    const nextDayNum = (editingScheduleItems.length * 5 || 1).toString();
    setEditingScheduleItems((prev) => [
      ...prev,
      { id: Date.now().toString(), dayNumber: nextDayNum, taskTitle: '', items: [] },
    ]);
  };

  const handleRemoveScheduleEntryRow = (id: string) => {
    tap();
    setEditingScheduleItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddScheduleEntryItem = (rowId: string, composed: string) => {
    tap();
    setEditingScheduleItems((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, items: [...row.items, composed], taskTitle: '' } : row)),
    );
  };

  const handleRemoveScheduleEntryItem = (rowId: string, itemIdx: number) => {
    tap();
    setEditingScheduleItems((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, items: row.items.filter((_, i) => i !== itemIdx) } : row)),
    );
  };

  const handleUpdateScheduleEntryRow = (id: string, field: 'dayNumber' | 'taskTitle', value: string) => {
    setEditingScheduleItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleApplyTemplateToFarm = async () => {
    if (!selectedFarm) return;
    tap();

    const activeRows = editingScheduleItems
      .filter((item) => item.items.length > 0 || item.taskTitle.trim().length > 0)
      .sort((a, b) => (parseInt(a.dayNumber, 10) || 1) - (parseInt(b.dayNumber, 10) || 1));

    if (activeRows.length === 0) {
      Alert.alert('Entries Required', 'Kripya kam se kam 1 schedule entry rakhein.');
      return;
    }

    const plantDateObj = parsePlantationDate(selectedFarm.sowingDate);
    const computedTasks = activeRows.map((item) => {
      const dayNum = parseInt(item.dayNumber, 10) || 1;
      const calendarDate = formatDateStr(calculateTaskDateObj(plantDateObj, dayNum));
      const taskText = [...item.items, item.taskTitle.trim()].filter(Boolean).join(', ');
      return `[Day ${dayNum} · ${calendarDate}]: ${taskText}`;
    });

    const prefix = selectedTemplateForAssign
      ? `${selectedTemplateForAssign.templateName}\n`
      : `Advisory Crop Schedule\n`;

    const finalScheduleString = prefix + computedTasks.join('\n');

    try {
      await updateCropSchedule.mutateAsync({ id: selectedFarm.id, assignedSchedule: finalScheduleString });
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Could not save the schedule. Please try again.';
      Platform.OS === 'web' ? alert(message) : Alert.alert('Error', message);
      return;
    }
    setIsScheduleModalOpen(false);

    if (Platform.OS === 'web') {
      alert(`✅ Crop schedule updated for ${selectedFarm.fieldName} (${selectedFarm.cropName})!\nDay 1 counted as ${selectedFarm.sowingDate}.`);
    } else {
      Alert.alert('Schedule Updated ✅', `Day 1 counted as ${selectedFarm.sowingDate}. Schedule saved.`);
    }
  };

  const handleEditTemplate = (tpl: AdvisoryTemplate) => {
    tap();
    setEditingTemplateId(tpl.id);
    setNewTemplateName(tpl.templateName);
    setNewTemplateCrop(tpl.targetCrop);
    setNewTemplateTasks(
      tpl.tasks.map((t) => ({ dayNumber: t.dayNumber.toString(), taskTitle: t.taskTitle, items: [] }))
    );
    setIsMakeTemplateModalOpen(true);
  };

  const handleDeleteTemplate = (tplId: string) => {
    tap();
    const tpl = templates.find((t) => t.id === tplId);
    const doDelete = () => {
      setTemplates((prev) => prev.filter((t) => t.id !== tplId));
    };
    if (Platform.OS === 'web') {
      if (confirm(`"${tpl?.templateName}" template delete karein? Ye action undo nahi hoga.`)) {
        doDelete();
      }
    } else {
      Alert.alert(
        'Delete Template?',
        `"${tpl?.templateName}" template delete karein? Ye action undo nahi hoga.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: doDelete },
        ]
      );
    }
  };

  const openNewTemplateModal = () => {
    tap();
    setEditingTemplateId(null);
    setNewTemplateName('');
    setNewTemplateCrop('');
    setNewTemplateTasks([
      { dayNumber: '1', taskTitle: 'Plantation / Sowing Check & Root Treatment', items: [] },
      { dayNumber: '5', taskTitle: 'First Water & DAP Fertigation', items: [] },
      { dayNumber: '8', taskTitle: 'Micronutrient & Pest Inspection', items: [] },
    ]);
    setIsMakeTemplateModalOpen(true);
  };

  const handleSaveNewTemplate = () => {
    if (!newTemplateName.trim()) {
      Alert.alert('Name Required', 'Kripya Template Name bharein.');
      return;
    }

    const parsedTasks: TemplateDayTask[] = newTemplateTasks
      .filter((t) => t.items.length > 0 || t.taskTitle.trim().length > 0)
      .map((t, idx) => ({
        id: Date.now().toString() + idx,
        dayNumber: parseInt(t.dayNumber, 10) || 1,
        taskTitle: [...t.items, t.taskTitle.trim()].filter(Boolean).join(', '),
      }))
      .sort((a, b) => a.dayNumber - b.dayNumber);

    if (parsedTasks.length === 0) {
      Alert.alert('Tasks Required', 'Kripya kam se kam 1 Daywise task add karein.');
      return;
    }

    if (editingTemplateId) {
      // Update existing template
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === editingTemplateId
            ? { ...t, templateName: newTemplateName.trim(), targetCrop: newTemplateCrop.trim() || 'General Crop', tasks: parsedTasks }
            : t
        )
      );
      setIsMakeTemplateModalOpen(false);
      setEditingTemplateId(null);
      setNewTemplateName('');
      setNewTemplateCrop('');

      if (Platform.OS === 'web') {
        alert(`✅ Template "${newTemplateName.trim()}" updated successfully!`);
      } else {
        Alert.alert('Template Updated ✅', `Template "${newTemplateName.trim()}" has been updated.`);
      }
    } else {
      // Create new template
      const created: AdvisoryTemplate = {
        id: Date.now().toString(),
        templateName: newTemplateName.trim(),
        targetCrop: newTemplateCrop.trim() || 'General Crop',
        tasks: parsedTasks,
      };

      setTemplates((prev) => [created, ...prev]);
      setIsMakeTemplateModalOpen(false);
      setNewTemplateName('');
      setNewTemplateCrop('');

      if (Platform.OS === 'web') {
        alert(`🎉 New Schedule Template "${created.templateName}" Created Successfully!`);
      } else {
        Alert.alert('Template Created 🎉', `Template "${created.templateName}" is now ready to assign.`);
      }
    }
  };

  const handleAddTaskRow = () => {
    tap();
    const nextDay = (newTemplateTasks.length * 5 || 1).toString();
    setNewTemplateTasks((prev) => [...prev, { dayNumber: nextDay, taskTitle: '', items: [] }]);
  };


  return (
    <View style={styles.container}>
      {/* Top Hero Banner */}
      <LinearGradient colors={theme.gradient} style={styles.hero}>
        <Text style={styles.heroTitle}>Advisory Schedules & Templates</Text>
        <Text style={styles.heroSubtitle}>Crop-wise schedules & reusable item/dose templates</Text>

        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{activeFarms.length}</Text>
            <Text style={styles.statLabel}>Active Farms</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{activeFarms.filter((f) => !!f.assignedSchedule).length}</Text>
            <Text style={styles.statLabel}>Scheduled</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{templates.length}</Text>
            <Text style={styles.statLabel}>Templates</Text>
          </View>
        </View>

        {/* 3 Sub-Tabs Row: Schedule | Templates | Dose Items */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabChip, activeTab === 'SCHEDULE' && styles.tabChipActive]}
            activeOpacity={0.8}
            onPress={() => {
              tap();
              setActiveTab('SCHEDULE');
            }}
          >
            <Ionicons name="calendar-outline" size={12} color={activeTab === 'SCHEDULE' ? theme.primary : '#fff'} />
            <Text style={[styles.tabChipText, activeTab === 'SCHEDULE' && { color: theme.primary }]}>
              Schedule ({activeFarms.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabChip, activeTab === 'TEMPLATES' && styles.tabChipActive]}
            activeOpacity={0.8}
            onPress={() => {
              tap();
              setActiveTab('TEMPLATES');
            }}
          >
            <Ionicons name="bookmarks-outline" size={12} color={activeTab === 'TEMPLATES' ? theme.primary : '#fff'} />
            <Text style={[styles.tabChipText, activeTab === 'TEMPLATES' && { color: theme.primary }]}>
              Templates ({templates.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabChip, activeTab === 'DOSE_ITEMS' && styles.tabChipActive]}
            activeOpacity={0.8}
            onPress={() => {
              tap();
              setActiveTab('DOSE_ITEMS');
            }}
          >
            <Ionicons name="flask-outline" size={12} color={activeTab === 'DOSE_ITEMS' ? theme.primary : '#fff'} />
            <Text style={[styles.tabChipText, activeTab === 'DOSE_ITEMS' && { color: theme.primary }]}>
              Dose Items
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Main List Area */}
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {activeTab === 'DOSE_ITEMS' ? (
          /* DOSE ITEMS TAB (reusable item + dose library used while building templates & schedules) */
          <ItemTemplatesSection themeColor={theme.primary} />
        ) : activeTab === 'TEMPLATES' ? (
          /* TEMPLATES TAB (Make & View Templates) */
          <View style={{ gap: 12 }}>
            <View style={styles.templateHeaderCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.templateHeaderTitle}>Advisory Daywise Templates Library</Text>
                <View style={styles.templateHeaderTag}>
                  <Ionicons name="calendar-outline" size={10} color="#64748b" />
                  <Text style={styles.templateHeaderTagText}>Day 1 = Sowing Date</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.makeTemplateBtn}
                activeOpacity={0.85}
                onPress={openNewTemplateModal}
              >
                <Ionicons name="add-circle" size={16} color="#ffffff" />
                <Text style={styles.makeTemplateBtnText}>+ Make Template</Text>
              </TouchableOpacity>
            </View>

            {templates.map((tpl) => {
              const isCardExpanded = !!expandedSections[`tpl-card-${tpl.id}`];
              return (
                <View key={tpl.id} style={[styles.card, premiumShadow('#0f172a', 'sm')]}>
                  <TouchableOpacity
                    style={styles.tplCompactRow}
                    activeOpacity={0.7}
                    onPress={() => toggleSection(`tpl-card-${tpl.id}`)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.tplName}>📋 {tpl.templateName}</Text>
                      <Text style={styles.tplCrop}>{tpl.targetCrop} · {tpl.tasks.length} tasks</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleEditTemplate(tpl)} style={{ padding: 4 }}>
                      <Ionicons name="create-outline" size={18} color={theme.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteTemplate(tpl.id)} style={{ padding: 4 }}>
                      <Ionicons name="trash-outline" size={18} color="#dc2626" />
                    </TouchableOpacity>
                    <Ionicons name={isCardExpanded ? 'chevron-up' : 'chevron-down'} size={18} color="#94a3b8" />
                  </TouchableOpacity>

                  {isCardExpanded ? (
                    <View style={styles.dayTasksContainer}>
                      {tpl.tasks.map((task) => (
                        <View key={task.id} style={styles.dayTaskItem}>
                          <View style={styles.dayPill}>
                            <Text style={styles.dayPillText}>Day {task.dayNumber}</Text>
                          </View>
                          <Text style={styles.dayTaskTitle}>{task.taskTitle}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        ) : (
          /* SCHEDULE TAB — accepted farms, single flat list */
          activeFarms.length === 0 ? (
            <View style={styles.emptyCenter}>
              <Ionicons name="calendar-outline" size={42} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No Active Farms Yet</Text>
              <Text style={styles.emptySub}>Farms you've accepted for advisory review will show up here.</Text>
            </View>
          ) : (
            activeFarms.map((farm) => {
              const hasSchedule = !!farm.assignedSchedule && farm.assignedSchedule.trim().length > 0;

              return (
                <View key={farm.id} style={[styles.card, premiumShadow('#0f172a', 'sm')]}>
                  <View style={styles.cardHeaderRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', flex: 1 }}>
                      <Text style={styles.plotTitle}>📍 {farm.fieldName}</Text>
                      <View style={[styles.cropBadge, { backgroundColor: farm.categoryBg || '#f0fdf4' }]}>
                        <Text style={[styles.cropBadgeText, { color: farm.categoryColor || '#16a34a' }]}>
                          🌾 {farm.cropName}
                        </Text>
                      </View>
                    </View>

                    {hasSchedule ? (
                      <View style={styles.scheduledBadge}>
                        <Ionicons name="checkmark-circle" size={11} color="#16a34a" />
                        <Text style={styles.scheduledBadgeText}>SCHEDULED</Text>
                      </View>
                    ) : (
                      <View style={styles.noScheduleBadge}>
                        <Ionicons name="alert-circle" size={11} color="#d97706" />
                        <Text style={styles.noScheduleBadgeText}>NO SCHEDULE</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.farmerSub}>
                    👨‍🌾 {farm.farmerName || 'Balwinder Singh'} · 📍 {farm.location || 'Bathinda, Punjab'}
                  </Text>

                  <View style={styles.metaRow}>
                    <Text style={styles.metaText}>📏 Area: {farm.area}</Text>
                    <Text style={styles.metaText}>📅 Sown (Day 1): {farm.sowingDate}</Text>
                    {farm.variety ? <Text style={styles.metaText}>🌱 {farm.variety}</Text> : null}
                  </View>

                  {/* Assigned Schedule Display or Empty Alert */}
                  {hasSchedule ? (
                    <CollapsibleSection
                      title="Assigned Schedule"
                      count={(farm.assignedSchedule || '').split('\n').filter((l) => l.trim()).length}
                      isExpanded={!!expandedSections[`farm-${farm.id}`]}
                      onToggle={() => toggleSection(`farm-${farm.id}`)}
                      accentColor="#16a34a"
                    >
                      <View style={styles.scheduleBox}>
                        <Ionicons name="calendar" size={15} color="#16a34a" />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.scheduleBoxTitle}>Assigned Advisory Schedule & Dates:</Text>
                          <Text style={styles.scheduleBoxText}>{farm.assignedSchedule}</Text>
                        </View>
                      </View>
                    </CollapsibleSection>
                  ) : (
                    <View style={styles.noScheduleAlertBox}>
                      <Ionicons name="warning-outline" size={15} color="#b45309" />
                      <Text style={styles.noScheduleAlertText}>
                        Is farm ke liye abhi koi advisory schedule assign nahi hai.
                      </Text>
                    </View>
                  )}

                  <SprayScheduleSection
                    cropCycleId={farm.id}
                    accentColor="#0284c7"
                    isExpanded={!!expandedSections[`spray-${farm.id}`]}
                    onToggle={() => toggleSection(`spray-${farm.id}`)}
                  />

                  {/* Action Button: Edit Schedule */}
                  <View style={{ gap: 8, marginTop: 4 }}>
                    <TouchableOpacity
                      style={[
                        styles.assignBtn,
                        { backgroundColor: hasSchedule ? '#f1f5f9' : theme.primary },
                      ]}
                      activeOpacity={0.85}
                      onPress={() => openScheduleModal(farm)}
                    >
                      <Ionicons
                        name={hasSchedule ? 'create-outline' : 'add-circle-outline'}
                        size={15}
                        color={hasSchedule ? '#0f172a' : '#ffffff'}
                      />
                      <Text
                        style={[
                          styles.assignBtnText,
                          { color: hasSchedule ? '#0f172a' : '#ffffff' },
                        ]}
                      >
                        {hasSchedule ? 'Edit / Add / Remove Schedule Entries' : 'Assign / Edit Schedule (Day 1 = Plantation)'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )
        )}
      </ScrollView>

      {/* CROP SCHEDULE EDITOR MODAL (ADD, EDIT, REMOVE ENTRIES & TEMPLATE SELECTION) */}
      <Modal visible={isScheduleModalOpen} transparent animationType="slide" onRequestClose={() => setIsScheduleModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '92%' }]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>📅 Edit & Manage Crop Schedule</Text>
                <Text style={styles.modalSub}>
                  {selectedFarm?.fieldName} ({selectedFarm?.cropName})
                </Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setIsScheduleModalOpen(false)}>
                <Ionicons name="close" size={20} color="#475569" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 8 }}>
              <View style={styles.infoBanner}>
                <Ionicons name="information-circle" size={16} color="#15803d" />
                <Text style={styles.infoBannerText}>
                  Plantation Date (<Text style={{ fontFamily: FONT.bold }}>{selectedFarm?.sowingDate}</Text>) ko <Text style={{ fontFamily: FONT.bold }}>Day 1</Text> count karke dates calculate hongi. Aap koi bhi entry <Text style={{ fontFamily: FONT.bold }}>Edit</Text>, <Text style={{ fontFamily: FONT.bold }}>Add</Text> ya <Text style={{ fontFamily: FONT.bold }}>Remove</Text> kar sakte hain.
                </Text>
              </View>

              {/* Quick Template Picker Grid */}
              <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#0f172a' }}>
                Load Template to Auto-Populate (Optional):
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {templates.map((tpl) => (
                  <TouchableOpacity
                    key={tpl.id}
                    style={[
                      styles.templateChipQuick,
                      selectedTemplateForAssign?.id === tpl.id && { backgroundColor: theme.primary, borderColor: theme.primary },
                    ]}
                    onPress={() => handlePickTemplateToPopulate(tpl)}
                  >
                    <Text
                      style={[
                        styles.templateChipQuickText,
                        selectedTemplateForAssign?.id === tpl.id && { color: '#ffffff' },
                      ]}
                    >
                      ⚡ {tpl.templateName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Daywise Schedule Entries List with Edit, Add & Remove Controls */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                <Text style={{ fontSize: 12.5, fontFamily: FONT.bold, color: '#0f172a' }}>
                  Crop Schedule Daywise Entries ({editingScheduleItems.length}):
                </Text>
                <TouchableOpacity style={styles.addEntryBtn} onPress={handleAddScheduleEntryRow}>
                  <Ionicons name="add-circle" size={15} color="#16a34a" />
                  <Text style={styles.addEntryBtnText}>+ Add Entry</Text>
                </TouchableOpacity>
              </View>

              {editingScheduleItems.map((item, idx) => {
                const plantDateObj = parsePlantationDate(selectedFarm?.sowingDate);
                const dayNum = parseInt(item.dayNumber, 10) || 1;
                const calcDateStr = formatDateStr(calculateTaskDateObj(plantDateObj, dayNum));
                const query = item.taskTitle.trim().toLowerCase();
                const doseSuggestions = query
                  ? (itemTemplatesForSearch ?? []).filter((t) => t.item.toLowerCase().includes(query)).slice(0, 6)
                  : [];

                return (
                  <View key={item.id || idx} style={styles.entryRowCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={{ width: 75 }}>
                        <Text style={{ fontSize: 10, fontFamily: FONT.bold, color: '#64748b', marginBottom: 2 }}>
                          Day #
                        </Text>
                        <TextInput
                          style={[styles.singleLineInput, { textAlign: 'center', fontWeight: 'bold', color: theme.primary }]}
                          value={item.dayNumber}
                          onChangeText={(val) => handleUpdateScheduleEntryRow(item.id, 'dayNumber', val)}
                          keyboardType="numeric"
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                          <Text style={{ fontSize: 10, fontFamily: FONT.bold, color: '#64748b' }}>
                            Calculated Calendar Date:
                          </Text>
                          <Text style={{ fontSize: 10.5, fontFamily: FONT.bold, color: '#15803d' }}>
                            📅 {calcDateStr}
                          </Text>
                        </View>

                        <TextInput
                          style={styles.singleLineInput}
                          value={item.taskTitle}
                          onChangeText={(val) => handleUpdateScheduleEntryRow(item.id, 'taskTitle', val)}
                          placeholder="Type to search Dose Items, or write free text"
                        />
                      </View>

                      <TouchableOpacity
                        style={styles.removeEntryBtn}
                        onPress={() => handleRemoveScheduleEntryRow(item.id)}
                      >
                        <Ionicons name="trash-outline" size={16} color="#dc2626" />
                      </TouchableOpacity>
                    </View>

                    {doseSuggestions.length > 0 ? (
                      <View style={styles.itemSuggestBox}>
                        {doseSuggestions.map((s) => (
                          <TouchableOpacity
                            key={s.id}
                            style={styles.itemSuggestRow}
                            onPress={() => {
                              const composed = s.dose ? `${s.item} (${s.dose})` : s.item;
                              handleAddScheduleEntryItem(item.id, composed);
                            }}
                          >
                            <Ionicons name="add-circle-outline" size={14} color={theme.primary} />
                            <Text style={styles.itemSuggestText}>
                              {s.item}
                              {s.dose ? <Text style={styles.itemSuggestDose}> · {s.dose}</Text> : null}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    ) : null}

                    {item.items.length > 0 ? (
                      <View style={styles.itemChipRow}>
                        {item.items.map((it, itemIdx) => (
                          <View key={itemIdx} style={styles.itemChip}>
                            <Text style={styles.itemChipText}>{it}</Text>
                            <TouchableOpacity onPress={() => handleRemoveScheduleEntryItem(item.id, itemIdx)}>
                              <Ionicons name="close-circle" size={14} color="#94a3b8" />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalSubmitBtn, { backgroundColor: theme.primary, marginTop: 10 }]}
              activeOpacity={0.85}
              onPress={handleApplyTemplateToFarm}
            >
              <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
              <Text style={styles.modalSubmitBtnText}>✔️ Save & Update Crop Schedule</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MAKE NEW TEMPLATE MODAL */}
      <Modal visible={isMakeTemplateModalOpen} transparent animationType="slide" onRequestClose={() => setIsMakeTemplateModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '90%' }]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{editingTemplateId ? '✏️ Edit Schedule Template' : '🛠️ Make Schedule Template'}</Text>
                <Text style={{ fontSize: 12, fontFamily: FONT.medium, color: '#64748b', marginTop: 2 }}>
                  {editingTemplateId ? 'Update daywise tasks for this template' : 'Create daywise tasks (e.g. Day 1, 5, 8, 15...) for any crop name'}
                </Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => { setIsMakeTemplateModalOpen(false); setEditingTemplateId(null); }}>
                <Ionicons name="close" size={20} color="#475569" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.quickAddDoseItemBtn, { borderColor: theme.primary }]}
              activeOpacity={0.85}
              onPress={() => setIsQuickAddDoseItemOpen(true)}
            >
              <Ionicons name="add-circle" size={15} color={theme.primary} />
              <Text style={[styles.quickAddDoseItemBtnText, { color: theme.primary }]}>+ Add New Dose Item to Library</Text>
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 8 }}>
              <Text style={{ fontSize: 12.5, fontFamily: FONT.bold, color: '#0f172a' }}>
                Template Name *
              </Text>
              <TextInput
                style={styles.singleLineInput}
                value={newTemplateName}
                onChangeText={setNewTemplateName}
                placeholder="e.g. Dutch Rose Spray & Fertilizer Plan"
              />


              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                <Text style={{ fontSize: 12.5, fontFamily: FONT.bold, color: '#0f172a' }}>
                  Daywise Tasks (1, 5, 8...) *
                </Text>
                <TouchableOpacity style={styles.addTaskRowBtn} onPress={handleAddTaskRow}>
                  <Ionicons name="add" size={14} color="#16a34a" />
                  <Text style={styles.addTaskRowBtnText}>+ Add Day Task</Text>
                </TouchableOpacity>
              </View>

              {newTemplateTasks.map((taskRow, idx) => {
                const query = taskRow.taskTitle.trim().toLowerCase();
                const suggestions = query
                  ? (itemTemplatesForSearch ?? []).filter((t) => t.item.toLowerCase().includes(query)).slice(0, 6)
                  : [];
                return (
                  <View key={idx} style={styles.entryRowCard}>
                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                      <View style={{ width: 75 }}>
                        <Text style={{ fontSize: 10, fontFamily: FONT.bold, color: '#64748b', marginBottom: 2 }}>
                          Day #
                        </Text>
                        <TextInput
                          style={[styles.singleLineInput, { textAlign: 'center', fontWeight: 'bold', color: theme.primary }]}
                          value={taskRow.dayNumber}
                          onChangeText={(val) => {
                            const updated = [...newTemplateTasks];
                            updated[idx].dayNumber = val;
                            setNewTemplateTasks(updated);
                          }}
                          placeholder="Day"
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 10, fontFamily: FONT.bold, color: '#64748b', marginBottom: 2 }}>
                          Task / Activity
                        </Text>
                        <TextInput
                          style={styles.singleLineInput}
                          value={taskRow.taskTitle}
                          onChangeText={(val) => {
                            const updated = [...newTemplateTasks];
                            updated[idx].taskTitle = val;
                            setNewTemplateTasks(updated);
                          }}
                          placeholder={`Type to search Item Templates, or write free text`}
                        />
                      </View>
                      <TouchableOpacity
                        style={styles.removeEntryBtn}
                        onPress={() => {
                          tap();
                          setNewTemplateTasks((prev) => prev.filter((_, i) => i !== idx));
                        }}
                      >
                        <Ionicons name="trash-outline" size={16} color="#dc2626" />
                      </TouchableOpacity>
                    </View>

                    {suggestions.length > 0 ? (
                      <View style={styles.itemSuggestBox}>
                        {suggestions.map((s) => (
                          <TouchableOpacity
                            key={s.id}
                            style={styles.itemSuggestRow}
                            onPress={() => {
                              tap();
                              const composed = s.dose ? `${s.item} (${s.dose})` : s.item;
                              const updated = [...newTemplateTasks];
                              updated[idx] = { ...updated[idx], items: [...updated[idx].items, composed], taskTitle: '' };
                              setNewTemplateTasks(updated);
                            }}
                          >
                            <Ionicons name="add-circle-outline" size={14} color={theme.primary} />
                            <Text style={styles.itemSuggestText}>
                              {s.item}
                              {s.dose ? <Text style={styles.itemSuggestDose}> · {s.dose}</Text> : null}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    ) : null}

                    {taskRow.items.length > 0 ? (
                      <View style={styles.itemChipRow}>
                        {taskRow.items.map((it, itemIdx) => (
                          <View key={itemIdx} style={styles.itemChip}>
                            <Text style={styles.itemChipText}>{it}</Text>
                            <TouchableOpacity
                              onPress={() => {
                                tap();
                                const updated = [...newTemplateTasks];
                                updated[idx] = { ...updated[idx], items: updated[idx].items.filter((_, i) => i !== itemIdx) };
                                setNewTemplateTasks(updated);
                              }}
                            >
                              <Ionicons name="close-circle" size={14} color="#94a3b8" />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalSubmitBtn, { backgroundColor: theme.primary, marginTop: 10 }]}
              activeOpacity={0.85}
              onPress={handleSaveNewTemplate}
            >
              <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
              <Text style={styles.modalSubmitBtnText}>{editingTemplateId ? '✔️ Update Template' : 'Save Template to Library'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <QuickAddDoseItemModal
        visible={isQuickAddDoseItemOpen}
        onClose={() => setIsQuickAddDoseItemOpen(false)}
        themeColor={theme.primary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  hero: { paddingTop: 20, paddingBottom: 18, paddingHorizontal: SPACING.xxl },
  heroTitle: { color: '#fff', fontSize: 20, fontFamily: FONT.extraBold, letterSpacing: -0.2 },
  heroSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontFamily: FONT.medium, marginTop: 2 },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    paddingVertical: 11,
    marginTop: 14,
  },
  statCard: { flex: 1, alignItems: 'center', gap: 3 },
  statDivider: { width: 1, height: 26, backgroundColor: 'rgba(255,255,255,0.2)' },
  statValue: { color: '#fff', fontSize: 17, fontFamily: FONT.extraBold, letterSpacing: -0.3 },
  statLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 9.5, fontFamily: FONT.bold, textTransform: 'uppercase', letterSpacing: 0.2, marginTop: 1 },
  tabRow: { flexDirection: 'row', gap: 5, marginTop: 12 },
  tabChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 7,
    paddingHorizontal: 2,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  tabChipActive: { backgroundColor: '#ffffff' },
  tabChipText: { fontSize: 10.5, fontFamily: FONT.bold, color: '#ffffff' },
  list: { padding: SPACING.lg, gap: 12, paddingBottom: SPACING.xxl },
  emptyCenter: { alignItems: 'center', justifyContent: 'center', padding: 40, gap: 6 },
  emptyTitle: { fontSize: 15, fontFamily: FONT.bold, color: '#334155', textAlign: 'center' },
  emptySub: { fontSize: 12, fontFamily: FONT.medium, color: '#94a3b8', textAlign: 'center' },
  card: { backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.md, gap: 8 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  plotTitle: { fontSize: 14, fontFamily: FONT.bold, color: '#0f172a' },
  cropBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: RADIUS.xs },
  cropBadgeText: { fontSize: 10.5, fontFamily: FONT.bold },
  scheduledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  scheduledBadgeText: { fontSize: 9.5, fontFamily: FONT.bold, color: '#15803d' },
  noScheduleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  noScheduleBadgeText: { fontSize: 9.5, fontFamily: FONT.bold, color: '#b45309' },
  farmerSub: { fontSize: 12, color: '#475569', fontFamily: FONT.medium },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metaText: { fontSize: 11.5, color: '#64748b', fontFamily: FONT.medium },
  scheduleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0fdf4',
    padding: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginTop: 4,
  },
  scheduleBoxTitle: { fontSize: 10.5, fontFamily: FONT.bold, color: '#16a34a' },
  scheduleBoxText: { fontSize: 11.5, fontFamily: FONT.medium, color: '#15803d', marginTop: 2, lineHeight: 17 },
  noScheduleAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fffbeb',
    padding: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#fde68a',
    marginTop: 4,
  },
  noScheduleAlertText: { flex: 1, fontSize: 11, fontFamily: FONT.medium, color: '#b45309' },
  actionBtnRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  assignBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
  },
  assignBtnText: { fontSize: 12, fontFamily: FONT.bold },
  templateHeaderCard: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  templateHeaderTitle: { fontSize: 14, fontFamily: FONT.extraBold, color: '#0f172a' },
  templateHeaderTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
    backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: RADIUS.pill, paddingHorizontal: 8, paddingVertical: 3, marginTop: 5,
  },
  templateHeaderTagText: { fontSize: 10, fontFamily: FONT.bold, color: '#64748b' },
  makeTemplateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  makeTemplateBtnText: { color: '#ffffff', fontSize: 12, fontFamily: FONT.bold },
  tplName: { fontSize: 14, fontFamily: FONT.bold, color: '#0f172a' },
  tplCrop: { fontSize: 11.5, fontFamily: FONT.medium, color: '#64748b', marginTop: 2 },
  tplCompactRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  taskCountBadge: { backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.pill, borderWidth: 1, borderColor: '#bbf7d0' },
  taskCountBadgeText: { fontSize: 10.5, fontFamily: FONT.bold, color: '#16a34a' },
  dayTasksContainer: { gap: 6, marginTop: 8 },
  dayTaskItem: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f8fafc', padding: 8, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: '#e2e8f0' },
  dayPill: { backgroundColor: '#15803d', paddingHorizontal: 7, paddingVertical: 2, borderRadius: RADIUS.pill },
  dayPillText: { fontSize: 10, fontFamily: FONT.bold, color: '#ffffff' },
  dayTaskTitle: { fontSize: 12, fontFamily: FONT.medium, color: '#334155', flex: 1 },
  tplActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
  },
  tplEditBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  tplEditBtnText: { fontSize: 12, fontFamily: FONT.bold, color: theme.primary },
  tplDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
  },
  tplDeleteBtnText: { fontSize: 12, fontFamily: FONT.bold, color: '#dc2626' },
  infoBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f0fdf4', padding: 10, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#bbf7d0' },
  infoBannerText: { flex: 1, fontSize: 11.5, fontFamily: FONT.medium, color: '#15803d' },
  templateChipQuick: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 6, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: '#e2e8f0' },
  templateChipQuickText: { fontSize: 11, fontFamily: FONT.bold, color: '#334155' },
  addEntryBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.xs, borderWidth: 1, borderColor: '#bbf7d0' },
  addEntryBtnText: { fontSize: 11, fontFamily: FONT.bold, color: '#16a34a' },
  entryRowCard: { backgroundColor: '#ffffff', borderRadius: RADIUS.md, padding: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  removeEntryBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#fff1f2', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#fecdd3' },
  itemSuggestBox: { marginTop: 6, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: RADIUS.md, overflow: 'hidden', backgroundColor: '#f8fafc' },
  itemSuggestRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#eef2f7' },
  itemSuggestText: { fontSize: 12.5, fontFamily: FONT.semiBold, color: '#0f172a' },
  itemSuggestDose: { fontSize: 11, fontFamily: FONT.medium, color: '#64748b' },
  itemChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  itemChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  itemChipText: { fontSize: 11.5, fontFamily: FONT.semiBold, color: '#15803d' },
  addTaskRowBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.xs, backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0' },
  addTaskRowBtnText: { fontSize: 11, fontFamily: FONT.bold, color: '#16a34a' },
  quickAddDoseItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: RADIUS.md,
    paddingVertical: 9,
    marginBottom: 10,
  },
  quickAddDoseItemBtnText: { fontSize: 12.5, fontFamily: FONT.bold },
  singleLineInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: RADIUS.md, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, color: '#0f172a' },
  auditItemCard: { backgroundColor: '#ffffff', borderRadius: RADIUS.md, padding: 10, borderWidth: 1, borderColor: '#cbd5e1', gap: 4 },
  auditTaskTitle: { fontSize: 12.5, fontFamily: FONT.medium, color: '#0f172a', marginTop: 2 },
  doneChip: { backgroundColor: '#dcfce7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.xs },
  doneChipText: { fontSize: 9.5, fontFamily: FONT.bold, color: '#15803d' },
  skipChip: { backgroundColor: '#fffbeb', paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.xs },
  skipChipText: { fontSize: 9.5, fontFamily: FONT.bold, color: '#b45309' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...premiumShadow('#000000', 'lg'),
  },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  modalTitle: { fontSize: 16, fontFamily: FONT.extraBold, color: '#0f172a' },
  modalSub: { fontSize: 12, fontFamily: FONT.bold, color: '#16a34a', marginTop: 2 },
  closeBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  modalSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
  },
  modalSubmitBtnText: { color: '#ffffff', fontFamily: FONT.bold, fontSize: 13.5 },
});
