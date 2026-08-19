import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CropUnit, HarvestType, IrrigationType, LandAreaUnit } from '@/constants/cropCategoriesData';
import { CropFormValues } from '@/components/CropCategorySelectorModal';
import * as AppStorage from '@/src/lib/storage';
import { useAuth } from '@/src/store/auth-context';
import { useMyCrops } from '@/src/hooks/useCrops';
import * as farmsApi from '@/src/api/farms.api';
import * as plotsApi from '@/src/api/plots.api';
import * as cropsApi from '@/src/api/crops.api';
import { AreaUnit as RealAreaUnit, CropCategory as RealCropCategory, MyCropCycle } from '@/src/types/api';

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
  billId?: string;
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
  billId?: string;
}

interface CropsContextValue {
  cropFields: RegisteredCropField[];
  cropHistory: CropHistoryEntry[];
  salesRecords: CropSaleRecord[];
  specialTreatments: SpecialTreatmentTemplate[];
  isLoading: boolean;
  addCrop: (values: CropFormValues) => Promise<void>;
  removeCrop: (id: string) => Promise<void>;
  updateCropStage: (id: string, targetStage: CropStage) => Promise<void>;
  recordSale: (cropId: string, payload: SalePayload) => Promise<void>;
  shareCropWithAdvisor: (cropId: string) => void;
  acceptFarmRequest: (cropId: string, assignedSchedule?: string) => Promise<void>;
  addSpecialTreatment: (treatment: SpecialTreatmentTemplate) => void;
  applySpecialTreatmentToCrop: (cropId: string, treatmentId: string) => Promise<void>;
}

const CropsContext = createContext<CropsContextValue | undefined>(undefined);

/** Real CropCategory enum has fewer buckets than the mock's category list — collapse the extras into OTHER. */
const CATEGORY_ID_TO_REAL: Record<string, RealCropCategory> = {
  flowers: 'FLOWERS',
  vegetables: 'VEGETABLES',
  fruits: 'FRUITS',
  medicinal: 'OTHER',
  spices: 'SPICES',
  cereals: 'GRAINS',
  pulses: 'PULSES',
  oilseeds: 'OTHER',
  commercial: 'CASH_CROP',
  fodder: 'OTHER',
  plantation: 'OTHER',
  other: 'OTHER',
};

const REAL_CATEGORY_DISPLAY: Record<RealCropCategory, { name: string; color: string; bg: string }> = {
  FLOWERS: { name: 'Flowers & Floriculture', color: '#e11d48', bg: '#ffe4e6' },
  VEGETABLES: { name: 'Vegetables', color: '#047857', bg: '#ecfdf5' },
  FRUITS: { name: 'Fruits & Orchards', color: '#c2410c', bg: '#fff7ed' },
  GRAINS: { name: 'Cereals & Grains', color: '#15803d', bg: '#f0fdf4' },
  PULSES: { name: 'Pulses & Legumes', color: '#b45309', bg: '#fffbeb' },
  SPICES: { name: 'Spices & Condiments', color: '#ea580c', bg: '#ffedd5' },
  CASH_CROP: { name: 'Commercial & Cash Crops', color: '#7c3aed', bg: '#f5f3ff' },
  OTHER: { name: 'Other Crops', color: '#64748b', bg: '#f1f5f9' },
};

/** Real AreaUnit enum (ACRE/HECTARE/BIGHA/GUNTA) is coarser than the mock's LandAreaUnit list — nearest-fit mapping. */
const LAND_UNIT_TO_REAL: Record<LandAreaUnit, RealAreaUnit> = {
  'Killa (Acre)': 'ACRE',
  Kanal: 'GUNTA',
  Marla: 'GUNTA',
  Bigha: 'BIGHA',
  Biswa: 'GUNTA',
  Hectare: 'HECTARE',
  'Sq Ft / Gaj': 'GUNTA',
};

const REAL_AREA_UNIT_LABEL: Record<RealAreaUnit, string> = {
  ACRE: 'Killa (Acre)',
  HECTARE: 'Hectare',
  BIGHA: 'Bigha',
  GUNTA: 'Gunta',
};

function normalizeStage(stage: CropStage): 'PLANTATION' | 'VEGETATIVE' | 'FLOWERING' | 'HARVESTING' | 'COMPLETED' {
  if (stage === 'SOWING') return 'PLANTATION';
  if (stage === 'GROWTH') return 'VEGETATIVE';
  return stage;
}

/** The mock's sowingDate is a free-text display string (optionally with a season suffix) — best-effort parse to ISO for the real date column. */
function parseSowingDateToISO(display: string): string | undefined {
  const datePart = display.split(' (')[0].trim();
  if (!datePart) return undefined;
  const parsed = new Date(datePart);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function formatDateDisplay(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface PersistedLocalState {
  salesRecords: CropSaleRecord[];
  specialTreatments?: SpecialTreatmentTemplate[];
}

const STORAGE_KEY = 'farmsking_crops_local_state_v1';

function toRegisteredCropField(
  crop: MyCropCycle,
  farmerName: string | undefined,
  farmerPhone: string | undefined,
  location: string | undefined
): RegisteredCropField {
  const realCategory = crop.category ?? 'OTHER';
  const catInfo = REAL_CATEGORY_DISPLAY[realCategory];
  const areaUnit = crop.plot.areaUnit ?? 'ACRE';
  const areaText = crop.plot.area != null ? `${crop.plot.area} ${REAL_AREA_UNIT_LABEL[areaUnit]}` : '';
  const sowingDateDisplay = crop.notes || (crop.sowingDate ? formatDateDisplay(crop.sowingDate) : '');

  return {
    id: crop.id,
    cropName: crop.cropName,
    categoryName: catInfo.name,
    categoryColor: catInfo.color,
    categoryBg: catInfo.bg,
    fieldName: crop.plot.name,
    area: areaText,
    sowingDate: sowingDateDisplay,
    variety: crop.variety ?? undefined,
    unit: (crop.unit as CropUnit) ?? 'KG',
    pricePerUnit: crop.pricePerUnit ?? '',
    stage: crop.stage,
    status: crop.stage === 'COMPLETED' ? 'INACTIVE' : 'ACTIVE',
    advisorStatus: crop.advisorReviewStatus ?? 'NONE',
    assignedSchedule: crop.assignedSchedule ?? undefined,
    farmerName,
    farmerPhone,
    location,
    harvestType: crop.harvestType,
    irrigationType: (crop.plot.irrigationType as IrrigationType | null) ?? undefined,
  };
}

export function CropsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: myCropsRaw, isLoading } = useMyCrops();
  const myCrops = useMemo(() => myCropsRaw ?? [], [myCropsRaw]);

  const [salesRecords, setSalesRecords] = useState<CropSaleRecord[]>([]);
  const [specialTreatments, setSpecialTreatments] = useState<SpecialTreatmentTemplate[]>(INITIAL_SPECIAL_TREATMENTS);
  const [isPersistLoaded, setIsPersistLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AppStorage.getItemAsync(STORAGE_KEY);
        if (raw) {
          const parsed: PersistedLocalState = JSON.parse(raw);
          setSalesRecords(parsed.salesRecords ?? []);
          setSpecialTreatments(parsed.specialTreatments ?? INITIAL_SPECIAL_TREATMENTS);
        }
      } catch {
        // ignore, fallback to defaults
      } finally {
        setIsPersistLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!isPersistLoaded) return;
    AppStorage.setItemAsync(STORAGE_KEY, JSON.stringify({ salesRecords, specialTreatments }));
  }, [salesRecords, specialTreatments, isPersistLoaded]);

  const farmerName = user?.name;
  const farmerPhone = user?.mobile;
  const location = useMemo(() => [user?.village, user?.district, user?.state].filter(Boolean).join(', '), [user?.village, user?.district, user?.state]);

  const activeCrops = useMemo(() => myCrops.filter((c) => c.status !== 'COMPLETED' && c.status !== 'FAILED'), [myCrops]);
  const completedCrops = useMemo(() => myCrops.filter((c) => c.status === 'COMPLETED'), [myCrops]);

  const cropFields = useMemo(
    () => activeCrops.map((c) => toRegisteredCropField(c, farmerName, farmerPhone, location)),
    [activeCrops, farmerName, farmerPhone, location]
  );

  const cropHistory = useMemo(
    () =>
      completedCrops.map((c) => {
        const base = toRegisteredCropField(c, farmerName, farmerPhone, location);
        const sale = salesRecords.find((s) => s.cropId === c.id);
        return {
          ...base,
          completedDate: sale?.saleDate ?? (c.actualHarvestDate ? formatDateDisplay(c.actualHarvestDate) : formatDateDisplay(c.updatedAt)),
          soldQuantity: sale?.quantity,
          soldRate: sale?.pricePerUnit,
          buyerName: sale?.buyerName,
          totalRevenue: sale?.totalAmount,
        };
      }),
    [completedCrops, salesRecords, farmerName, farmerPhone, location]
  );

  const invalidateCrops = () => queryClient.invalidateQueries({ queryKey: ['crops', 'mine'] });

  const ensureFarmAndPlot = async (
    fieldName: string,
    areaValue: number,
    areaUnit: LandAreaUnit,
    irrigationType: IrrigationType
  ) => {
    const farms = await farmsApi.listFarms();
    let farm = farms[0];
    if (!farm) {
      farm = await farmsApi.createFarm({
        name: `${farmerName || 'My'} Farm`,
        totalArea: areaValue || 1,
        areaUnit: LAND_UNIT_TO_REAL[areaUnit] ?? 'ACRE',
      });
    }

    const plots = await plotsApi.listPlotsForFarm(farm.id);
    const existingPlot = plots.find((p) => p.name === fieldName);
    if (existingPlot) return existingPlot;

    return plotsApi.createPlot({
      farmId: farm.id,
      name: fieldName,
      area: areaValue || 1,
      areaUnit: LAND_UNIT_TO_REAL[areaUnit] ?? 'ACRE',
      irrigationType,
    });
  };

  const addCrop = async (values: CropFormValues) => {
    const plot = await ensureFarmAndPlot(values.fieldName.trim(), Number(values.area) || 1, values.areaUnit, values.irrigationType);

    await cropsApi.createCrop({
      plotId: plot.id,
      category: CATEGORY_ID_TO_REAL[values.category.id] ?? 'OTHER',
      cropName: values.crop.name.trim(),
      variety: values.crop.variety,
      sowingDate: parseSowingDateToISO(values.sowingDate),
      unit: values.unit,
      pricePerUnit: values.pricePerUnit.trim() ? Number(values.pricePerUnit) : undefined,
      stage: normalizeStage(values.stage),
      harvestType: values.harvestType,
      notes: values.sowingDate,
    });

    await invalidateCrops();
  };

  const removeCrop = async (id: string) => {
    await cropsApi.deleteCrop(id);
    await invalidateCrops();
  };

  const updateCropStage = async (id: string, targetStage: CropStage) => {
    await cropsApi.updateCrop(id, { stage: normalizeStage(targetStage) });
    await invalidateCrops();
  };

  const recordSale = async (cropId: string, payload: SalePayload) => {
    const crop = myCrops.find((c) => c.id === cropId);
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
        fieldName: crop.plot.name,
        quantity: payload.quantity.trim(),
        unit: crop.unit ?? '',
        pricePerUnit: payload.rate.trim(),
        totalAmount,
        buyerName,
        saleDate,
        billId: payload.billId,
      },
      ...prev,
    ]);

    if (crop.harvestType === 'ONE_TIME') {
      await cropsApi.updateCrop(cropId, { stage: 'COMPLETED' });
      await invalidateCrops();
    }
  };

  /** Legacy no-op — real crop-share requests now go through submitCropToAdvisor/cancelCropSubmission directly. Kept only so existing destructures don't break. */
  const shareCropWithAdvisor = (_cropId: string) => {};

  const acceptFarmRequest = async (cropId: string, assignedSchedule?: string) => {
    await cropsApi.updateCropSchedule(cropId, assignedSchedule || 'Weekly Inspection & Pest Advisory Visit');
    await invalidateCrops();
  };

  const addSpecialTreatment = (treatment: SpecialTreatmentTemplate) => {
    setSpecialTreatments((prev) => [treatment, ...prev]);
  };

  const applySpecialTreatmentToCrop = async (cropId: string, treatmentId: string) => {
    const treatment = specialTreatments.find((t) => t.id === treatmentId);
    if (!treatment) return;

    const existingSchedule = myCrops.find((c) => c.id === cropId)?.assignedSchedule ?? undefined;
    const dateFormatted = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const treatmentHeader = `\n🚨 Special Remedy Applied (${treatment.problemTitle} - ${dateFormatted}):`;
    const taskLines = treatment.remedyTasks.map((task) => {
      const taskDate = new Date();
      taskDate.setDate(taskDate.getDate() + (task.dayNumber - 1));
      const taskDateStr = taskDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      return `[Day ${task.dayNumber} · ${taskDateStr}]: ${task.treatmentName}`;
    });
    const updatedSchedule = (existingSchedule ? `${existingSchedule}\n` : '') + treatmentHeader + '\n' + taskLines.join('\n');

    await cropsApi.updateCropSchedule(cropId, updatedSchedule);
    await invalidateCrops();
  };

  const value = useMemo(
    () => ({
      cropFields,
      cropHistory,
      salesRecords,
      specialTreatments,
      isLoading,
      addCrop,
      removeCrop,
      updateCropStage,
      recordSale,
      shareCropWithAdvisor,
      acceptFarmRequest,
      addSpecialTreatment,
      applySpecialTreatmentToCrop,
    }),
    [cropFields, cropHistory, salesRecords, specialTreatments, isLoading]
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
