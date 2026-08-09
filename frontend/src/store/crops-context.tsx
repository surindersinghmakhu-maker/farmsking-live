import { createContext, useContext, useMemo, useState, ReactNode } from 'react';
import { CropUnit, HarvestType, IrrigationType } from '@/constants/cropCategoriesData';
import { CropFormValues } from '@/components/CropCategorySelectorModal';

export type CropStage = 'SOWING' | 'GROWTH' | 'HARVESTING' | 'COMPLETED';

export const STAGE_ORDER: Record<CropStage, number> = {
  SOWING: 1,
  GROWTH: 2,
  HARVESTING: 3,
  COMPLETED: 4,
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

interface SalePayload {
  quantity: string;
  rate: string;
  buyerName: string;
}

interface CropsContextValue {
  /** Crops still active in the farmer's fields. */
  cropFields: RegisteredCropField[];
  /** Crops that reached the Completed stage — no longer active. */
  cropHistory: CropHistoryEntry[];
  /** Every sale logged against a currently-active crop. */
  salesRecords: CropSaleRecord[];
  addCrop: (values: CropFormValues) => void;
  removeCrop: (id: string) => void;
  /** Change a crop's stage. Moving to COMPLETED removes it from the active list into history. */
  updateCropStage: (id: string, targetStage: CropStage) => void;
  /**
   * Logs a sale for an active crop. One-time-harvest crops complete automatically
   * as part of their one and only sale, moving straight into history.
   */
  recordSale: (cropId: string, payload: SalePayload) => void;
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
    harvestType: 'CONTINUOUS',
    irrigationType: 'Drip Irrigation (ड्रिप)',
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
    harvestType: 'ONE_TIME',
    irrigationType: 'Canal (नहर)',
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

export function CropsProvider({ children }: { children: ReactNode }) {
  const [cropFields, setCropFields] = useState<RegisteredCropField[]>(INITIAL_CROPS);
  const [cropHistory, setCropHistory] = useState<CropHistoryEntry[]>([]);
  const [salesRecords, setSalesRecords] = useState<CropSaleRecord[]>(INITIAL_SALES);

  const addCrop = (values: CropFormValues) => {
    const newField: RegisteredCropField = {
      id: Date.now().toString(),
      cropName: values.crop.name,
      categoryName: values.category.name,
      categoryColor: values.category.color,
      categoryBg: values.category.bg,
      fieldName: values.fieldName,
      area: `${values.area} ${values.areaUnit}`,
      sowingDate: values.sowingDate,
      variety: values.crop.variety,
      season: values.crop.season,
      unit: values.unit,
      pricePerUnit: values.pricePerUnit,
      stage: values.stage,
      harvestType: values.harvestType,
      irrigationType: values.irrigationType,
    };
    setCropFields((prev) => [newField, ...prev]);
  };

  const removeCrop = (id: string) => {
    setCropFields((prev) => prev.filter((c) => c.id !== id));
  };

  const updateCropStage = (id: string, targetStage: CropStage) => {
    if (targetStage === 'COMPLETED') {
      setCropFields((prev) => {
        const completedCrop = prev.find((item) => item.id === id);
        if (completedCrop) {
          setCropHistory((history) => [
            { ...completedCrop, stage: 'COMPLETED', completedDate: new Date().toISOString().slice(0, 10) },
            ...history,
          ]);
        }
        return prev.filter((item) => item.id !== id);
      });
      return;
    }
    setCropFields((prev) => prev.map((item) => (item.id === id ? { ...item, stage: targetStage } : item)));
  };

  const recordSale = (cropId: string, payload: SalePayload) => {
    const crop = cropFields.find((c) => c.id === cropId);
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

  const value = useMemo(
    () => ({ cropFields, cropHistory, salesRecords, addCrop, removeCrop, updateCropStage, recordSale }),
    [cropFields, cropHistory, salesRecords]
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
