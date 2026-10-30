import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { CropUnit, HarvestType, IrrigationType } from '@/constants/cropCategoriesData';
import { CropFormValues } from '@/components/CropCategorySelectorModal';
import * as AppStorage from '@/src/lib/storage';

export type CropStage = 'PLANTATION' | 'VEGETATIVE' | 'FLOWERING' | 'HARVESTING' | 'COMPLETED' | 'SOWING' | 'GROWTH';
export type CropStatus = 'ACTIVE' | 'INACTIVE';
export type AdvisorShareStatus = 'NONE' | 'PENDING' | 'ACCEPTED';

export const STAGE_ORDER: Record<CropStage, number> = {
  PLANTATION: 1,
  SOWING: 1,
  VEGETATIVE: 2,
  GROWTH: 2,
  FLOWERING: 3,
  HARVESTING: 4,
  COMPLETED: 5,
};

export interface RegisteredCropField {
  id: string;
  cropName: string;
  categoryName: string;
  categoryColor: string;
  categoryBg: string;
  fieldName: string;
  area: string;
  sowingDate: string;
  variety?: string;
  season?: string;
  unit: CropUnit;
  pricePerUnit: string;
  stage: CropStage;
  status: CropStatus; // 'ACTIVE' for SOWING/GROWTH/HARVESTING, 'INACTIVE' for COMPLETED
  advisorStatus?: AdvisorShareStatus; // 'NONE' | 'PENDING' | 'ACCEPTED'
  assignedSchedule?: string;
  farmerName?: string;
  farmerPhone?: string;
  location?: string;
  harvestType?: HarvestType;
  irrigationType?: IrrigationType;
}

export interface CropHistoryEntry extends RegisteredCropField {
  completedDate: string;
  soldQuantity?: string;
  soldRate?: string;
  buyerName?: string;
  totalRevenue?: number;
}

export interface CropSaleRecord {
  id: string;
  cropId: string;
  cropName: string;
  fieldName: string;
  quantity: string;
  unit: string;
  pricePerUnit: string;
  totalAmount: number;
  buyerName: string;
  saleDate: string;
}

export interface SpecialTreatmentTemplate {
  id: string;
  problemTitle: string;
  cropCategory?: string;
  remedyTasks: { id: string; dayNumber: number; treatmentName: string }[];
}

export const INITIAL_SPECIAL_TREATMENTS: SpecialTreatmentTemplate[] = [
  {
    id: 'st1',
    problemTitle: 'Yellow Rust / Pila Rata Fungus Attack (पीला रतुआ)',
    cropCategory: 'Wheat & Cereals',
    remedyTasks: [
      { id: 'stt1', dayNumber: 1, treatmentName: 'Propiconazole 25% EC (200ml/Acre) Spray' },
      { id: 'stt2', dayNumber: 3, treatmentName: 'Water Drenching & Soil Aeration Audit' },
      { id: 'stt3', dayNumber: 7, treatmentName: 'Second Spray: Mancozeb 75% WP (600g/Acre)' },
    ],
  },
  {
    id: 'st2',
    problemTitle: 'Thrips & Leaf Curl Insect Attack (पत्ती मरोड़ / कीड़ा)',
    cropCategory: 'Rose & Vegetables',
    remedyTasks: [
      { id: 'stt4', dayNumber: 1, treatmentName: 'Imidacloprid 17.8% SL (50ml/100L) Foliar Spray' },
      { id: 'stt5', dayNumber: 4, treatmentName: 'Sticky Traps Installation (Yellow/Blue)' },
      { id: 'stt6', dayNumber: 8, treatmentName: 'Neem Oil 10000 PPM (2ml/L) Preventive Spray' },
    ],
  },
  {
    id: 'st3',
    problemTitle: 'Root Rot & Wilt Disease (जड़ सड़न / उकठा बीमारी)',
    cropCategory: 'All Crops',
    remedyTasks: [
      { id: 'stt7', dayNumber: 1, treatmentName: 'Trichoderma Viride Bio-Fungicide Drenching' },
      { id: 'stt8', dayNumber: 5, treatmentName: 'Microbial Root Activator & Humic Acid' },
      { id: 'stt9', dayNumber: 10, treatmentName: 'Root Zone Inspection & Moisture Balance' },
    ],
  },
];

interface SalePayload {
  quantity: string;
  rate: string;
  buyerName: string;
}

interface CropsContextValue {
  cropFields: RegisteredCropField[];
  cropHistory: CropHistoryEntry[];
  salesRecords: CropSaleRecord[];
  specialTreatments: SpecialTreatmentTemplate[];
  addCrop: (values: CropFormValues) => void;
  removeCrop: (id: string) => void;
  updateCropStage: (id: string, targetStage: CropStage) => void;
  recordSale: (cropId: string, payload: SalePayload) => void;
  shareCropWithAdvisor: (cropId: string) => void;
  acceptFarmRequest: (cropId: string, assignedSchedule?: string) => void;
  declineFarmRequest: (cropId: string) => void;
  addSpecialTreatment: (treatment: SpecialTreatmentTemplate) => void;
  applySpecialTreatmentToCrop: (cropId: string, treatmentId: string) => void;
}

const CropsContext = createContext<CropsContextValue | undefined>(undefined);

const INITIAL_CROPS: RegisteredCropField[] = [
  {
    id: '1',
    cropName: 'Rose (गुलाब)',
    categoryName: 'Flowers & Floriculture',
    categoryColor: '#e11d48',
    categoryBg: '#ffe4e6',
    fieldName: 'Flower Garden - Plot A',
    area: '2.0 Killa (Acre)',
    sowingDate: '15 Nov 2025',
    variety: 'Dutch Red Rose',
    season: 'All Seasons',
    unit: 'Bunch',
    pricePerUnit: '40',
    stage: 'HARVESTING',
    status: 'ACTIVE',
    advisorStatus: 'ACCEPTED',
    assignedSchedule: 'Daily Morning Harvest Inspection & Unit Rate Audit (09:30 AM)',
    farmerName: 'Balwinder Singh',
    farmerPhone: '+91 98765 43210',
    location: 'Bathinda, Punjab',
    harvestType: 'CONTINUOUS',
    irrigationType: 'Drip Irrigation',
  },
  {
    id: '2',
    cropName: 'Wheat (गेहूँ)',
    categoryName: 'Cereals & Grains',
    categoryColor: '#15803d',
    categoryBg: '#f0fdf4',
    fieldName: 'North Field - Plot 1',
    area: '5.0 Killa (Acre)',
    sowingDate: '15 Nov 2025',
    variety: 'HD-2967',
    season: 'Rabi',
    unit: 'Quintal',
    pricePerUnit: '2275',
    stage: 'HARVESTING',
    status: 'ACTIVE',
    advisorStatus: 'ACCEPTED',
    assignedSchedule: 'Weekly Grain Filling Quality & Combine Harvester Slot (11:30 AM)',
    farmerName: 'Kartar Singh',
    farmerPhone: '+91 98123 55678',
    location: 'Barnala, Punjab',
    harvestType: 'ONE_TIME',
    irrigationType: 'Canal',
  },
  {
    id: '3',
    cropName: 'Tomato (टमाटर)',
    categoryName: 'Vegetables',
    categoryColor: '#047857',
    categoryBg: '#ecfdf5',
    fieldName: 'Polyhouse 2',
    area: '1.5 Killa (Acre)',
    sowingDate: '01 Oct 2025',
    variety: 'Abhilash',
    season: 'All Seasons',
    unit: 'KG',
    pricePerUnit: '',
    stage: 'GROWTH',
    status: 'ACTIVE',
    advisorStatus: 'PENDING',
    farmerName: 'Harjeet Singh',
    farmerPhone: '+91 97800 12345',
    location: 'Moga, Punjab',
    harvestType: 'CONTINUOUS',
    irrigationType: 'Tube Well / Borewell',
  },
];

const INITIAL_SALES: CropSaleRecord[] = [
  {
    id: 's1',
    cropId: '1',
    cropName: 'Rose (गुलाब)',
    fieldName: 'Flower Garden - Plot A',
    quantity: '50',
    unit: 'Bunch',
    pricePerUnit: '40',
    totalAmount: 2000,
    buyerName: 'Bathinda Wholesale Dealer',
    saleDate: '2026-08-09',
  },
];

const STORAGE_KEY = 'farmsking_crops_state_v2';

interface PersistedCropsState {
  cropFields: RegisteredCropField[];
  cropHistory: CropHistoryEntry[];
  salesRecords: CropSaleRecord[];
  specialTreatments?: SpecialTreatmentTemplate[];
}

export function CropsProvider({ children }: { children: ReactNode }) {
  const [cropFields, setCropFields] = useState<RegisteredCropField[]>(INITIAL_CROPS);
  const [cropHistory, setCropHistory] = useState<CropHistoryEntry[]>([]);
  const [salesRecords, setSalesRecords] = useState<CropSaleRecord[]>(INITIAL_SALES);
  const [specialTreatments, setSpecialTreatments] = useState<SpecialTreatmentTemplate[]>(INITIAL_SPECIAL_TREATMENTS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AppStorage.getItemAsync(STORAGE_KEY);
        if (raw) {
          const parsed: PersistedCropsState = JSON.parse(raw);
          setCropFields(parsed.cropFields ?? INITIAL_CROPS);
          setCropHistory(parsed.cropHistory ?? []);
          setSalesRecords(parsed.salesRecords ?? INITIAL_SALES);
          setSpecialTreatments(parsed.specialTreatments ?? INITIAL_SPECIAL_TREATMENTS);
        }
      } catch {
        // ignore fallback to initial
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    AppStorage.setItemAsync(
      STORAGE_KEY,
      JSON.stringify({ cropFields, cropHistory, salesRecords, specialTreatments })
    );
  }, [cropFields, cropHistory, salesRecords, specialTreatments, isLoaded]);

  const addCrop = (values: CropFormValues) => {
    const newField: RegisteredCropField = {
      id: Date.now().toString(),
      cropName: values.crop.name.trim(),
      categoryName: values.category.name,
      categoryColor: values.category.color,
      categoryBg: values.category.bg,
      fieldName: values.fieldName.trim(),
      area: `${values.area.trim()} ${values.areaUnit}`,
      sowingDate: values.sowingDate.trim(),
      unit: values.unit,
      pricePerUnit: values.pricePerUnit.trim(),
      stage: values.stage,
      status: 'ACTIVE',
      advisorStatus: 'NONE',
      farmerName: 'Balwinder Singh',
      farmerPhone: '+91 98765 43210',
      location: 'Bathinda, Punjab',
      harvestType: values.harvestType,
      irrigationType: values.irrigationType,
    };

    setCropFields((prev) => [newField, ...prev]);
  };

  const removeCrop = (id: string) => {
    setCropFields((prev) => prev.filter((item) => item.id !== id));
  };

  const updateCropStage = (id: string, targetStage: CropStage) => {
    setCropFields((prev) =>
      prev.map((item) => (item.id === id ? { ...item, stage: targetStage } : item))
    );
  };

  const recordSale = (cropId: string, payload: SalePayload) => {
    const crop = cropFields.find((item) => item.id === cropId);
    if (!crop) return;

    const quantity = Number(payload.quantity);
    const rate = Number(payload.rate);
    const totalAmount = quantity * rate;
    const buyerName = payload.buyerName.trim() || 'Local Mandi Trader';
    const saleDate = new Date().toISOString().slice(0, 10);

    setSalesRecords((prev) => [
      {
        id: Date.now().toString(),
        cropId,
        cropName: crop.cropName,
        fieldName: crop.fieldName,
        quantity: payload.quantity.trim(),
        unit: crop.unit,
        pricePerUnit: payload.rate.trim(),
        totalAmount,
        buyerName,
        saleDate,
      },
      ...prev,
    ]);

    if (crop.harvestType === 'ONE_TIME') {
      setCropHistory((prev) => [
        {
          ...crop,
          stage: 'COMPLETED',
          status: 'INACTIVE',
          soldQuantity: payload.quantity.trim(),
          soldRate: payload.rate.trim(),
          buyerName,
          completedDate: saleDate,
          totalRevenue: totalAmount,
        },
        ...prev,
      ]);
      setCropFields((prev) => prev.filter((item) => item.id !== cropId));
    }
  };

  const shareCropWithAdvisor = (cropId: string) => {
    setCropFields((prev) =>
      prev.map((c) => (c.id === cropId ? { ...c, advisorStatus: 'PENDING' } : c))
    );
  };

  const acceptFarmRequest = (cropId: string, assignedSchedule?: string) => {
    setCropFields((prev) =>
      prev.map((c) =>
        c.id === cropId
          ? {
              ...c,
              advisorStatus: 'ACCEPTED',
              assignedSchedule: assignedSchedule || 'Weekly Inspection & Pest Advisory Visit',
            }
          : c
      )
    );
  };

  const declineFarmRequest = (cropId: string) => {
    setCropFields((prev) =>
      prev.map((c) => (c.id === cropId ? { ...c, advisorStatus: 'NONE' } : c))
    );
  };

  const addSpecialTreatment = (treatment: SpecialTreatmentTemplate) => {
    setSpecialTreatments((prev) => [treatment, ...prev]);
  };

  const applySpecialTreatmentToCrop = (cropId: string, treatmentId: string) => {
    const treatment = specialTreatments.find((t) => t.id === treatmentId);
    if (!treatment) return;

    setCropFields((prev) =>
      prev.map((c) => {
        if (c.id !== cropId) return c;

        const dateFormatted = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

        const treatmentHeader = `\n🚨 Special Remedy Applied (${treatment.problemTitle} - ${dateFormatted}):`;
        const taskLines = treatment.remedyTasks.map((task) => {
          const taskDate = new Date();
          taskDate.setDate(taskDate.getDate() + (task.dayNumber - 1));
          const taskDateStr = taskDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
          return `[Day ${task.dayNumber} · ${taskDateStr}]: ${task.treatmentName}`;
        });

        const updatedSchedule = (c.assignedSchedule ? `${c.assignedSchedule}\n` : '') + treatmentHeader + '\n' + taskLines.join('\n');

        return {
          ...c,
          assignedSchedule: updatedSchedule,
        };
      })
    );
  };

  const value = useMemo(
    () => ({
      cropFields,
      cropHistory,
      salesRecords,
      specialTreatments,
      addCrop,
      removeCrop,
      updateCropStage,
      recordSale,
      shareCropWithAdvisor,
      acceptFarmRequest,
      declineFarmRequest,
      addSpecialTreatment,
      applySpecialTreatmentToCrop,
    }),
    [cropFields, cropHistory, salesRecords, specialTreatments]
  );

  return <CropsContext.Provider value={value}>{children}</CropsContext.Provider>;
}

export function useCrops(): CropsContextValue {
  const context = useContext(CropsContext);
  if (!context) {
    throw new Error('useCrops must be used within a CropsProvider');
  }
  return context;
}
