import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
  INITIAL_CROP_CATEGORIES,
  INITIAL_CROPS_LIST,
  CROP_UNITS,
  LAND_AREA_UNITS,
  IRRIGATION_TYPES,
  CropCategory,
  CropItem,
  CropUnit,
  LandAreaUnit,
  HarvestType,
  IrrigationType,
} from '@/constants/cropCategoriesData';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { CalendarDatePickerModal } from './CalendarDatePickerModal';
import { RegisteredCropField } from '@/src/store/crops-context';
import { useLanguage } from '@/src/store/language-context';

export interface CropFormValues {
  crop: CropItem;
  category: CropCategory;
  fieldName: string;
  area: string;
  areaUnit: LandAreaUnit;
  sowingDate: string;
  unit: CropUnit;
  pricePerUnit: string;
  minPricePerUnit?: string;
  maxPricePerUnit?: string;
  stage: 'PLANTATION' | 'VEGETATIVE' | 'FLOWERING' | 'HARVESTING' | 'COMPLETED' | 'SOWING' | 'GROWTH';
  harvestType: HarvestType;
  irrigationType: IrrigationType;
  plantCount?: string;
}

interface CropCategorySelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onSaveCropForm: (values: CropFormValues) => void;
  customCrops?: CropItem[];
  editingCrop?: RegisteredCropField | null;
  onOpenUpgradeModal?: () => void;
}

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

// Multi-language dictionary for Crop Category Selector Modal
const MODAL_I18N: Record<string, Record<string, string>> = {
  en: {
    editTitle: 'Edit Crop Details',
    registerTitle: 'Register Crop',
    editSubtitle: 'Update specifications & field telemetry below',
    registerSubtitle: 'Enter plot dimensions & cultivation parameters',
    activeRecord: 'Active Record',
    cropId: 'Crop ID',
    cropSelection: '1. CROP SELECTION',
    plotDimensions: '2. PLOT & FIELD DIMENSIONS',
    cultivationHarvesting: '3. CULTIVATION & HARVESTING',
    cropName: 'Crop Name',
    selectCropCount: 'Select Crop',
    varietyOptional: 'Variety (Optional)',
    varietyPlaceholder: 'e.g. Desi / Hybrid',
    customCropPlaceholder: 'e.g. Custom Crop Name',
    fieldNameLabel: 'Plot / Field Name',
    fieldNamePlaceholder: 'e.g. Field Plot 1',
    sowingDateLabel: 'Sowing Date',
    areaSizeLabel: 'Area Size',
    areaUnitLabel: 'Area Unit',
    plantsOptional: 'Plants (Opt.)',
    plantsPlaceholder: 'e.g. 500',
    growthStageLabel: 'Growth Stage',
    stagePlantation: '🌱 Plantation',
    stageVegetative: '🌿 Vegetative',
    stageFlowering: '🌸 Flowering',
    stageHarvesting: '🌾 Harvesting',
    irrigationSystemLabel: 'Irrigation System',
    measurementUnitLabel: 'Measurement Unit',
    harvestPatternLabel: 'Harvest Pattern',
    dailyHarvestContinuous: 'Daily Harvest (Continuous)',
    oneTimeHarvest: '🌾 1-Time Harvest (Single)',
    updateCropBtn: '✏️ Update Crop Details',
    saveCropBtn: 'Save Crop & Field Details',
    selectCategoryTitle: 'Select Crop Category',
    selectCategorySub: 'Tap any category to filter crop list',
    availableCropsTitle: 'Available Crops',
    categoryPrefix: 'Category',
    noCropsFound: 'No crops found in this category.',
    selectLandAreaTitle: 'Select Land Area Unit',
    selectLandAreaSub: 'Tap your preferred unit of land measurement',
    selectIrrigationTitle: 'Select Irrigation System',
    selectIrrigationSub: 'Choose how this field plot is irrigated',
    selectMeasurementTitle: 'Select Measurement Unit',
    selectMeasurementSub: 'Select harvest & trading unit for this crop',
    plotDefaultSuffix: 'Plot 1',
    upgradePlan: 'Upgrade Plan Now 👑',
    irrigationBorewell: 'Tube Well / Borewell',
    irrigationCanal: 'Canal Water',
    irrigationDrip: 'Drip Irrigation',
    irrigationSprinkler: 'Sprinkler System',
    irrigationRainfed: 'Rainfed (Barani)',
    unitKg: 'KG (Kilogram)',
    unitQuintal: 'Quintal (100 KG)',
    unitPieces: 'Pieces (Pcs)',
    unitBunch: 'Bunch',
    unitDozen: 'Dozen',
    unitBox: 'Box / Crate',
    unitSet: 'Set',
    areaKilla: 'Killa (Acre)',
    areaBigha: 'Bigha',
    areaMarla: 'Marla',
    areaKanal: 'Kanal',
    areaBiswa: 'Biswa',
    areaGuntha: 'Guntha',
    areaSquareMeter: 'Square Meter (sq m)',
    catFlowers: 'Flowers & Floriculture',
    catVegetables: 'Vegetables',
    catFruits: 'Fruits & Orchards',
    catGrains: 'Grains & Cereals',
    catPulses: 'Pulses & Legumes',
    catOilseeds: 'Oilseeds',
    catFodder: 'Fodder Crops',
    catHerbs: 'Herbs & Medicinal',
    catOther: 'Other / Custom Crop',
  },
  pa: {
    editTitle: 'ਫ਼ਸਲ ਵੇਰਵੇ ਸੋਧੋ',
    registerTitle: 'ਨਵੀਂ ਫ਼ਸਲ ਦਰਜ ਕਰੋ',
    editSubtitle: 'ਹੇਠਾਂ ਦਿੱਤੇ ਫ਼ਸਲ ਵੇਰਵੇ ਅਤੇ ਜਾਣਕਾਰੀ ਅੱਪਡੇਟ ਕਰੋ',
    registerSubtitle: 'ਪਲਾਟ ਦਾ ਆਕਾਰ ਅਤੇ ਖੇਤੀ ਸੰਬੰਧੀ ਵੇਰਵੇ ਭਰੋ',
    activeRecord: 'ਸਰਗਰਮ ਰਿਕਾਰਡ',
    cropId: 'ਫ਼ਸਲ ID',
    cropSelection: '1. ਫ਼ਸਲ ਦੀ ਚੋਣ',
    plotDimensions: '2. ਪਲਾਟ ਅਤੇ ਖੇਤ ਦਾ ਆਕਾਰ',
    cultivationHarvesting: '3. ਕਾਸ਼ਤ ਅਤੇ ਵਾਢੀ ਵੇਰਵੇ',
    cropName: 'ਫ਼ਸਲ ਦਾ ਨਾਮ',
    selectCropCount: 'ਫ਼ਸਲ ਚੁਣੋ',
    varietyOptional: 'ਕਿਸਮ / ਵਰਾਇਟੀ (ਵਿਕਲਪਿਕ)',
    varietyPlaceholder: 'ਜਿਵੇਂ ਦੇਸੀ / ਹਾਈਬ੍ਰਿਡ',
    customCropPlaceholder: 'ਜਿਵੇਂ ਹੋਰ ਫ਼ਸਲ ਦਾ ਨਾਮ',
    fieldNameLabel: 'ਪਲਾਟ / ਖੇਤ ਦਾ ਨਾਮ',
    fieldNamePlaceholder: 'ਜਿਵੇਂ ਖੇਤ ਪਲਾਟ 1',
    sowingDateLabel: 'ਬਿਜਾਈ ਦੀ ਮਿਤੀ',
    areaSizeLabel: 'ਰਕਬਾ / ਆਕਾਰ',
    areaUnitLabel: 'ਰਕਬਾ ਇਕਾਈ',
    plantsOptional: 'ਬੂਟਿਆਂ ਦੀ ਗਿਣਤੀ',
    plantsPlaceholder: 'ਜਿਵੇਂ 500',
    growthStageLabel: 'ਫ਼ਸਲ ਦਾ ਪੜਾਅ',
    stagePlantation: '🌱 ਬਿਜਾਈ / ਰੋਪਣ',
    stageVegetative: '🌿 ਵਾਧਾ ਤੇ ਫੁਟਾਰਾ',
    stageFlowering: '🌸 ਫੁੱਲ ਪੈਣ ਦਾ ਸਮਾਂ',
    stageHarvesting: '🌾 ਵਾਢੀ / ਤੁੜਾਈ',
    irrigationSystemLabel: 'ਸਿੰਚਾਈ ਪ੍ਰਣਾਲੀ',
    measurementUnitLabel: 'ਮਾਪ ਇਕਾਈ',
    harvestPatternLabel: 'ਵਾਢੀ ਦਾ ਤਰੀਕਾ',
    dailyHarvestContinuous: 'ਰੋਜ਼ਾਨਾ ਤੁੜਾਈ (ਲਗਾਤਾਰ)',
    oneTimeHarvest: '🌾 ਇੱਕ ਵਾਰ ਵਾਢੀ (ਇਕੱਠੀ)',
    updateCropBtn: '✏️ ਫ਼ਸਲ ਵੇਰਵੇ ਅੱਪਡੇਟ ਕਰੋ',
    saveCropBtn: 'ਫ਼ਸਲ ਅਤੇ ਖੇਤ ਵੇਰਵੇ ਸੁਰੱਖਿਅਤ ਕਰੋ',
    selectCategoryTitle: 'ਫ਼ਸਲ ਦੀ ਸ਼੍ਰੇਣੀ ਚੁਣੋ',
    selectCategorySub: 'ਫ਼ਸਲਾਂ ਦੀ ਸੂਚੀ ਦੇਖਣ ਲਈ ਸ਼੍ਰੇਣੀ ਚੁਣੋ',
    availableCropsTitle: 'ਉਪਲਬਧ ਫ਼ਸਲਾਂ',
    categoryPrefix: 'ਸ਼੍ਰੇਣੀ',
    noCropsFound: 'ਇਸ ਸ਼੍ਰੇਣੀ ਵਿੱਚ ਕੋਈ ਫ਼ਸਲ ਨਹੀਂ ਮਿਲੀ।',
    selectLandAreaTitle: 'ਰਕਬਾ ਮਾਪ ਇਕਾਈ ਚੁਣੋ',
    selectLandAreaSub: 'ਆਪਣੀ ਜ਼ਮੀਨ ਦੀ ਮਾਪ ਇਕਾਈ ਚੁਣੋ',
    selectIrrigationTitle: 'ਸਿੰਚਾਈ ਪ੍ਰਣਾਲੀ ਚੁਣੋ',
    selectIrrigationSub: 'ਇਸ ਖੇਤ ਵਿੱਚ ਪਾਣੀ ਦੇਣ ਦਾ ਸਾਧਨ ਚੁਣੋ',
    selectMeasurementTitle: 'ਮਾਪ ਇਕਾਈ ਚੁਣੋ',
    selectMeasurementSub: 'ਫ਼ਸਲ ਦੀ ਉਪਜ ਅਤੇ ਵਿਕਰੀ ਇਕਾਈ ਚੁਣੋ',
    plotDefaultSuffix: 'ਪਲਾਟ 1',
    upgradePlan: 'ਪਲਾਨ ਅੱਪਗ੍ਰੇਡ ਕਰੋ 👑',
    irrigationBorewell: 'ਟਿਊਬਵੈੱਲ / ਬੋਰਵੈੱਲ',
    irrigationCanal: 'ਨਹਿਰੀ ਪਾਣੀ',
    irrigationDrip: 'ਡ੍ਰਿੱਪ (ਤੁਪਕਾ) ਸਿੰਚਾਈ',
    irrigationSprinkler: 'ਫੁਹਾਰਾ ਪ੍ਰਣਾਲੀ',
    irrigationRainfed: 'ਬਰਾਨੀ (ਮੀਂਹ ਅਧਾਰਿਤ)',
    unitKg: 'ਕਿਲੋਗ੍ਰਾਮ (KG)',
    unitQuintal: 'ਕੁਇੰਟਲ (100 KG)',
    unitPieces: 'ਨਗ / ਪੀਸ',
    unitBunch: 'ਗੁੱਛਾ / ਬੰਚ',
    unitDozen: 'ਦਰਜਨ',
    unitBox: 'ਪੇਟੀ / ਕਰੇਟ',
    unitSet: 'ਸੈੱਟ',
    areaKilla: 'ਕਿੱਲਾ (ਏਕੜ)',
    areaBigha: 'ਬੀਘਾ',
    areaMarla: 'ਮਰਲਾ',
    areaKanal: 'ਕਨਾਲ',
    areaBiswa: 'ਬਿਸਵਾ',
    areaGuntha: 'ਗੁੰਠਾ',
    areaSquareMeter: 'ਵਰਗ ਮੀਟਰ',
    catFlowers: 'ਫੁੱਲ ਤੇ ਫਲੋਰੀਕਲਚਰ',
    catVegetables: 'ਸਬਜ਼ੀਆਂ',
    catFruits: 'ਫਲ ਤੇ ਬਾਗਬਾਨੀ',
    catGrains: 'ਅਨਾਜ ਤੇ ਅੰਨ',
    catPulses: 'ਦਾਲਾਂ',
    catOilseeds: 'ਤੇਲ ਬੀਜ',
    catFodder: 'ਚਾਰੇ ਦੀਆਂ ਫ਼ਸਲਾਂ',
    catHerbs: 'ਜੜੀ-ਬੂਟੀਆਂ ਤੇ ਔਸ਼ਧੀ',
    catOther: 'ਹੋਰ / ਆਪਣੀ ਫ਼ਸਲ',
  },
  hi: {
    editTitle: 'फसल विवरण संपादित करें',
    registerTitle: 'नई फसल पंजीकृत करें',
    editSubtitle: 'नीचे दिए गए फसल विनिर्देश और विवरण अपडेट करें',
    registerSubtitle: 'खेत का आकार और खेती के पैरामीटर दर्ज करें',
    activeRecord: 'सक्रिय रिकॉर्ड',
    cropId: 'फसल ID',
    cropSelection: '1. फसल का चयन',
    plotDimensions: '2. खेत और भूखंड का आकार',
    cultivationHarvesting: '3. बुआई और कटाई विवरण',
    cropName: 'फसल का नाम',
    selectCropCount: 'फसल चुनें',
    varietyOptional: 'किस्म / वैरायटी (वैकल्पिक)',
    varietyPlaceholder: 'उदा. देसी / हाइब्रिड',
    customCropPlaceholder: 'उदा. अन्य फसल का नाम',
    fieldNameLabel: 'खेत / प्लॉट का नाम',
    fieldNamePlaceholder: 'उदा. खेत प्लॉट 1',
    sowingDateLabel: 'बुआई की तिथि',
    areaSizeLabel: 'क्षेत्रफल / आकार',
    areaUnitLabel: 'क्षेत्रफल इकाई',
    plantsOptional: 'पौधों की संख्या',
    plantsPlaceholder: 'उदा. 500',
    growthStageLabel: 'फसल की अवस्था',
    stagePlantation: '🌱 रोपण / बुआई',
    stageVegetative: '🌿 वानस्पतिक विकास',
    stageFlowering: '🌸 फूल आने की अवस्था',
    stageHarvesting: '🌾 कटाई / तुड़ाई',
    irrigationSystemLabel: 'सिंचाई प्रणाली',
    measurementUnitLabel: 'माप इकाई',
    harvestPatternLabel: 'कटाई का प्रकार',
    dailyHarvestContinuous: 'दैनिक तुड़ाई (निरंतर)',
    oneTimeHarvest: '🌾 एकमुश्त कटाई (एकल)',
    updateCropBtn: '✏️ फसल विवरण अपडेट करें',
    saveCropBtn: 'फसल और खेत विवरण सहेजें',
    selectCategoryTitle: 'फसल की श्रेणी चुनें',
    selectCategorySub: 'फसलों की सूची देखने के लिए श्रेणी चुनें',
    availableCropsTitle: 'उपलब्ध फसलें',
    categoryPrefix: 'श्रेणी',
    noCropsFound: 'इस श्रेणी में कोई फसल नहीं मिली।',
    selectLandAreaTitle: 'भूमि क्षेत्रफल इकाई चुनें',
    selectLandAreaSub: 'अपनी पसंदीदा भूमि माप इकाई चुनें',
    selectIrrigationTitle: 'सिंचाई प्रणाली चुनें',
    selectIrrigationSub: 'इस खेत में सिंचाई की विधि चुनें',
    selectMeasurementTitle: 'माप इकाई चुनें',
    selectMeasurementSub: 'फसल की उपज और व्यापार इकाई चुनें',
    plotDefaultSuffix: 'प्लॉट 1',
    upgradePlan: 'प्लान अपग्रेड करें 👑',
    irrigationBorewell: 'ट्यूबवेल / बोरवेल',
    irrigationCanal: 'नहरी पानी',
    irrigationDrip: 'ड्रिप (टपक) सिंचाई',
    irrigationSprinkler: 'फव्वारा प्रणाली',
    irrigationRainfed: 'बारानी (वर्षा आधारित)',
    unitKg: 'किलोग्राम (KG)',
    unitQuintal: 'क्विंटल (100 KG)',
    unitPieces: 'नग / पीस',
    unitBunch: 'गुच्छा / बंच',
    unitDozen: 'दर्जन',
    unitBox: 'पेटी / क्रेट',
    unitSet: 'सेट',
    areaKilla: 'किल्ला (एकड़)',
    areaBigha: 'बीघा',
    areaMarla: 'मरला',
    areaKanal: 'कनाल',
    areaBiswa: 'बिस्वा',
    areaGuntha: 'गुंठा',
    areaSquareMeter: 'वर्ग मीटर',
    catFlowers: 'फूल और फ्लोरीकल्चर',
    catVegetables: 'सब्जियां',
    catFruits: 'फल और बागवानी',
    catGrains: 'अनाज और खाद्यान्न',
    catPulses: 'दालें',
    catOilseeds: 'तिलहन',
    catFodder: 'चारा फसलें',
    catHerbs: 'जड़ी-बूटी और औषधीय',
    catOther: 'अन्य / कस्टम फसल',
  },
  mr: {
    editTitle: 'पीक तपशील संपादित करा',
    registerTitle: 'नवीन पीक नोंदणी करा',
    editSubtitle: 'खाली दिलेले तपशील अपडेट करा',
    registerSubtitle: 'प्लॉटचा आकार आणि लागवड माहिती प्रविष्ट करा',
    activeRecord: 'सक्रिय नोंद',
    cropId: 'पीक ID',
    cropSelection: '1. पीक निवड',
    plotDimensions: '2. शेत आणि प्लॉट आकार',
    cultivationHarvesting: '3. लागवड व कापणी माहिती',
    cropName: 'पिकाचे नाव',
    selectCropCount: 'पीक निवडा',
    varietyOptional: 'वाण / व्हरायटी (पर्यायी)',
    varietyPlaceholder: 'उदा. देशी / संकरित',
    customCropPlaceholder: 'उदा. इतर पिकाचे नाव',
    fieldNameLabel: 'शेत / प्लॉटचे नाव',
    fieldNamePlaceholder: 'उदा. शेत प्लॉट 1',
    sowingDateLabel: 'पेरणीची तारीख',
    areaSizeLabel: 'क्षेत्रफळ / आकार',
    areaUnitLabel: 'क्षेत्रफळ एकक',
    plantsOptional: 'झाडांची संख्या',
    plantsPlaceholder: 'उदा. 500',
    growthStageLabel: 'वाढीचा टप्पा',
    stagePlantation: '🌱 लागवड / पेरणी',
    stageVegetative: '🌿 शाकीय वाढ',
    stageFlowering: '🌸 फुलोरा टप्पा',
    stageHarvesting: '🌾 काढणी / तोडणी',
    irrigationSystemLabel: 'सिंचन पद्धत',
    measurementUnitLabel: 'मोजमाप एकक',
    harvestPatternLabel: 'काढणी प्रकार',
    dailyHarvestContinuous: 'दैनिक तोडणी (सतत)',
    oneTimeHarvest: '🌾 एकरकमी काढणी (एकल)',
    updateCropBtn: '✏️ पीक तपशील अपडेट करा',
    saveCropBtn: 'पीक माहिती जतन करा',
    selectCategoryTitle: 'पिकाचा वर्ग निवडा',
    selectCategorySub: 'पिकांची यादी पाहण्यासाठी वर्ग निवडा',
    availableCropsTitle: 'उपलब्ध पिके',
    categoryPrefix: 'वर्ग',
    noCropsFound: 'या वर्गात कोणतीही पिके आढळली नाहीत.',
    selectLandAreaTitle: 'जमीन क्षेत्रफळ एकक निवडा',
    selectLandAreaSub: 'तुमचे पसंतीचे जमीन एकक निवडा',
    selectIrrigationTitle: 'सिंचन पद्धत निवडा',
    selectIrrigationSub: 'या शेतासाठी पाण्याची पद्धत निवडा',
    selectMeasurementTitle: 'मोजमाप एकक निवडा',
    selectMeasurementSub: 'पिकाच्या उत्पादनाचे एकक निवडा',
    plotDefaultSuffix: 'प्लॉट 1',
    upgradePlan: 'प्लॅन अपग्रेड करा 👑',
    irrigationBorewell: 'ट्यूबवेल / विहीर / बोरवेल',
    irrigationCanal: 'कॅनॉल पाणी',
    irrigationDrip: 'ठिबक सिंचन',
    irrigationSprinkler: 'तुषार सिंचन',
    irrigationRainfed: 'जिरायती (पावसावर आधारित)',
    unitKg: 'किलोग्रॅम (KG)',
    unitQuintal: 'क्विंटल (100 KG)',
    unitPieces: 'नग / पीस',
    unitBunch: 'जुडी / गुच्छ',
    unitDozen: 'डझन',
    unitBox: 'बॉक्स / क्रेट',
    unitSet: 'सेट',
    areaKilla: 'एकर (किल्ला)',
    areaBigha: 'बिघा',
    areaMarla: 'मरला',
    areaKanal: 'कनाल',
    areaBiswa: 'बिस्वा',
    areaGuntha: 'गुंठा',
    areaSquareMeter: 'चौरस मीटर',
    catFlowers: 'फुले व पुष्पशेती',
    catVegetables: 'भाजीपाला',
    catFruits: 'फळे व फळबाग',
    catGrains: 'धान्य व तृणधान्ये',
    catPulses: 'कडधान्ये',
    catOilseeds: 'गळीत धान्ये',
    catFodder: 'चारा पिके',
    catHerbs: 'औषधी वनस्पती',
    catOther: 'इतर / स्वतःचे पीक',
  },
  te: {
    editTitle: 'పంట వివరాలను సవరించండి',
    registerTitle: 'కొత్త పంటను నమోదు చేయండి',
    editSubtitle: 'క్రింద వివరాలను నవీకరించండి',
    registerSubtitle: 'పొలం కొలతలు మరియు సాగు వివరాలను నమోదు చేయండి',
    activeRecord: 'క్రియాశీల రికార్డు',
    cropId: 'పంట ID',
    cropSelection: '1. పంట ఎంపిక',
    plotDimensions: '2. పొలం కొలతలు',
    cultivationHarvesting: '3. సాగు మరియు కోత వివరాలు',
    cropName: 'పంట పేరు',
    selectCropCount: 'పంటను ఎంచుకోండి',
    varietyOptional: 'రకం / వెరైటీ (ఐచ్ఛికం)',
    varietyPlaceholder: 'ఉదా. దేశీ / హైబ్రిడ్',
    customCropPlaceholder: 'ఉదా. ఇతర పంట పేరు',
    fieldNameLabel: 'పొలం / ప్లాట్ పేరు',
    fieldNamePlaceholder: 'ఉదా. పొలం ప్లాట్ 1',
    sowingDateLabel: 'విత్తిన తేదీ',
    areaSizeLabel: 'విస్తీర్ణం',
    areaUnitLabel: 'విస్తీర్ణ యూనిట్',
    plantsOptional: 'మొక్కల సంఖ్య',
    plantsPlaceholder: 'ఉదా. 500',
    growthStageLabel: 'పంట దశ',
    stagePlantation: '🌱 నాటడం / విత్తడం',
    stageVegetative: '🌿 ఏపుగా పెరిగే దశ',
    stageFlowering: '🌸 పూత దశ',
    stageHarvesting: '🌾 కోత దశ',
    irrigationSystemLabel: 'నీటి పారుదల వ్యవస్థ',
    measurementUnitLabel: 'కొలత యూనిట్',
    harvestPatternLabel: 'కోత విధానం',
    dailyHarvestContinuous: 'రోజువారీ కోత (నిరంతరాయం)',
    oneTimeHarvest: '🌾 ఒకేసారి కోత (సింగిల్)',
    updateCropBtn: '✏️ పంట వివరాలు నవీకరించండి',
    saveCropBtn: 'పంట వివరాలు భద్రపరచండి',
    selectCategoryTitle: 'పంట వర్గాన్ని ఎంచుకోండి',
    selectCategorySub: 'జాబితాను చూడటానికి వర్గాన్ని ఎంచుకోండి',
    availableCropsTitle: 'అందుబాటులో ఉన్న పంటలు',
    categoryPrefix: 'వర్గం',
    noCropsFound: 'ఈ వర్గంలో పంటలు లేవు.',
    selectLandAreaTitle: 'భూమి కొలత యూనిట్ ఎంచుకోండి',
    selectLandAreaSub: 'మీకు నచ్చిన యూనిట్‌ను ఎంచుకోండి',
    selectIrrigationTitle: 'నీటి పారుదల ఎంచుకోండి',
    selectIrrigationSub: 'పొలానికి నీరు పెట్టే విధానాన్ని ఎంచుకోండి',
    selectMeasurementTitle: 'కొలత యూనిట్ ఎంచుకోండి',
    selectMeasurementSub: 'పంట దిగుబడి యూనిట్‌ను ఎంచుకోండి',
    plotDefaultSuffix: 'ప్లాట్ 1',
    upgradePlan: 'ప్లాన్ అప్‌గ్రేడ్ చేయండి 👑',
    irrigationBorewell: 'బోరుబావి / ట్యూబ్‌వెల్',
    irrigationCanal: 'కాలువ నీరు',
    irrigationDrip: 'బిందు సేద్యం (డ్రిప్)',
    irrigationSprinkler: 'తుంపర సేద్యం (స్ప్రింక్లర్)',
    irrigationRainfed: 'వర్షాధార పంట',
    unitKg: 'కిలోగ్రామ్ (KG)',
    unitQuintal: 'క్వింటాల్ (100 KG)',
    unitPieces: 'ముక్కలు (Pcs)',
    unitBunch: 'కట్ట / బంచ్',
    unitDozen: 'డజన్',
    unitBox: 'బాక్స్ / క్రేట్',
    unitSet: 'సెట్',
    areaKilla: 'ఎకరం (కిల్లా)',
    areaBigha: 'బీఘా',
    areaMarla: 'మర్లా',
    areaKanal: 'కెనాల్',
    areaBiswa: 'బిస్వా',
    areaGuntha: 'గుంట',
    areaSquareMeter: 'చదరపు మీటర్లు',
    catFlowers: 'పూలు మరియు పూలసాగు',
    catVegetables: 'కూరగాయలు',
    catFruits: 'పండ్లు మరియు తోటలు',
    catGrains: 'ధాన్యాలు',
    catPulses: 'పప్పుధాన్యాలు',
    catOilseeds: 'నూనె గింజలు',
    catFodder: 'మేత పంటలు',
    catHerbs: 'ఔషధ మొక్కలు',
    catOther: 'ఇతర / అనుకూల పంట',
  },
  ta: {
    editTitle: 'பயிர் விவரங்களைத் திருத்துக',
    registerTitle: 'புதிய பயிரைப் பதிவுசெய்க',
    editSubtitle: 'கீழே உள்ள விவரங்களைப் புதுப்பிக்கவும்',
    registerSubtitle: 'நிலத்தின் அளவு மற்றும் சாகுபடி விவரங்களை உள்ளிடவும்',
    activeRecord: 'செயலில் உள்ள பதிவு',
    cropId: 'பயிர் ID',
    cropSelection: '1. பயிர் தேர்வு',
    plotDimensions: '2. நிலம் மற்றும் பரப்பளவு',
    cultivationHarvesting: '3. சாகுபடி மற்றும் அறுவடை விவரங்கள்',
    cropName: 'பயிரின் பெயர்',
    selectCropCount: 'பயிரைத் தேர்ந்தெடுக்கவும்',
    varietyOptional: 'வகை / ரகம் (விருப்பத்தேர்வு)',
    varietyPlaceholder: 'எ.கா. நாட்டு ரகம் / கலப்பினம்',
    customCropPlaceholder: 'எ.கா. பிற பயிரின் பெயர்',
    fieldNameLabel: 'நிலம் / ப்ளாட் பெயர்',
    fieldNamePlaceholder: 'எ.கா. வயல் ப்ளாட் 1',
    sowingDateLabel: 'விதைத்த தேதி',
    areaSizeLabel: 'பரப்பளவு',
    areaUnitLabel: 'பரப்பளவு அலகு',
    plantsOptional: 'செடிகளின் எண்ணிக்கை',
    plantsPlaceholder: 'எ.கா. 500',
    growthStageLabel: 'வளர்ச்சி நிலை',
    stagePlantation: '🌱 நடுதல் / விதைத்தல்',
    stageVegetative: '🌿 தழைப்பருவம்',
    stageFlowering: '🌸 பூக்கும் பருவம்',
    stageHarvesting: '🌾 அறுவடைப் பருவம்',
    irrigationSystemLabel: 'நீர்ப்பாசன முறை',
    measurementUnitLabel: 'அளவீட்டு அலகு',
    harvestPatternLabel: 'அறுவடை முறை',
    dailyHarvestContinuous: 'தினசரி அறுவடை (தொடர்ச்சியானது)',
    oneTimeHarvest: '🌾 ஒரே முறை அறுவடை (ஒற்றை)',
    updateCropBtn: '✏️ பயிர் விவரங்களைப் புதுப்பிக்கவும்',
    saveCropBtn: 'பயிர் விவரங்களைச் சேமிக்கவும்',
    selectCategoryTitle: 'பயிர் வகையைத் தேர்ந்தெடுக்கவும்',
    selectCategorySub: 'பட்டியலைக் காண வகையைத் தொடவும்',
    availableCropsTitle: 'கிடைக்கும் பயிர்கள்',
    categoryPrefix: 'வகை',
    noCropsFound: 'இவ்வகையில் பயிர்கள் இல்லை.',
    selectLandAreaTitle: 'நில பரப்பளவு அலகைத் தேர்ந்தெடுக்கவும்',
    selectLandAreaSub: 'உங்கள் நில அளவீட்டு அலகைத் தேர்ந்தெடுக்கவும்',
    selectIrrigationTitle: 'நீர்ப்பாசன முறையைத் தேர்ந்தெடுக்கவும்',
    selectIrrigationSub: 'பாசன முறையைத் தேர்ந்தெடுக்கவும்',
    selectMeasurementTitle: 'அளவீட்டு அலகைத் தேர்ந்தெடுக்கவும்',
    selectMeasurementSub: 'விளைச்சல் அலகைத் தேர்ந்தெடுக்கவும்',
    plotDefaultSuffix: 'ப்ளாட் 1',
    upgradePlan: 'திட்டத்தை மேம்படுத்தவும் 👑',
    irrigationBorewell: 'ஆழ்துளை கிணறு / போர்வெல்',
    irrigationCanal: 'கால்வாய் நீர்',
    irrigationDrip: 'சொட்டு நீர் பாசனம்',
    irrigationSprinkler: 'தெளிப்பு நீர் பாசனம்',
    irrigationRainfed: 'மானாவாரி (மழை சார்ந்த)',
    unitKg: 'கிலோகிராம் (KG)',
    unitQuintal: 'குவிண்டால் (100 KG)',
    unitPieces: 'எண்ணிக்கை (Pcs)',
    unitBunch: 'கொத்து / கட்டு',
    unitDozen: 'டஜன்',
    unitBox: 'பெட்டி / கூடை',
    unitSet: 'செட்',
    areaKilla: 'ஏக்கர் (கில்லா)',
    areaBigha: 'பிகா',
    areaMarla: 'மர்லா',
    areaKanal: 'கனால்',
    areaBiswa: 'பிஸ்வா',
    areaGuntha: 'குந்தா',
    areaSquareMeter: 'சதுர மீட்டர்',
    catFlowers: 'மலர்கள் மற்றும் பூந்தோட்டம்',
    catVegetables: 'காய்கறிகள்',
    catFruits: 'பழங்கள் மற்றும் பழத்தோட்டம்',
    catGrains: 'தானியங்கள்',
    catPulses: 'பருப்பு வகைகள்',
    catOilseeds: 'எண்ணெய் வித்துக்கள்',
    catFodder: 'தீவனப் பயிர்கள்',
    catHerbs: 'மூலிகைகள்',
    catOther: 'பிற பயிர்கள்',
  },
  ur: {
    editTitle: 'فصل کی تفصیلات تبدیل کریں',
    registerTitle: 'نئی فصل درج کریں',
    editSubtitle: 'درج ذیل تفصیلات کو اپ ڈیٹ کریں',
    registerSubtitle: 'زمین اور کاشت کے پیرامیٹرز درج کریں',
    activeRecord: 'فعال ریکارڈ',
    cropId: 'فصل ID',
    cropSelection: '1. فصل کا انتخاب',
    plotDimensions: '2. رقبہ اور زمین کی پیمائش',
    cultivationHarvesting: '3. کاشت اور کٹائی کی تفصیلات',
    cropName: 'فصل کا نام',
    selectCropCount: 'فصل منتخب کریں',
    varietyOptional: 'قسم / ورائٹی (اختیاری)',
    varietyPlaceholder: 'مثلاً دیسی / ہائبرڈ',
    customCropPlaceholder: 'مثلاً دیگر فصل کا نام',
    fieldNameLabel: 'پلاٹ / کھیت کا نام',
    fieldNamePlaceholder: 'مثلاً کھیت پلاٹ 1',
    sowingDateLabel: 'بجائی کی تاریخ',
    areaSizeLabel: 'رقبہ / سائز',
    areaUnitLabel: 'رقبے کی اکائی',
    plantsOptional: 'پودوں کی تعداد',
    plantsPlaceholder: 'مثلاً 500',
    growthStageLabel: 'فصل کا مرحلہ',
    stagePlantation: '🌱 بجائی / پودے لگانا',
    stageVegetative: '🌿 نشوونما کا مرحلہ',
    stageFlowering: '🌸 پھول آنے کا وقت',
    stageHarvesting: '🌾 کٹائی کا وقت',
    irrigationSystemLabel: 'نظام آبپاشی',
    measurementUnitLabel: 'پیمائش کی اکائی',
    harvestPatternLabel: 'کٹائی کا طریقہ',
    dailyHarvestContinuous: 'روزانہ چنائی (مسلسل)',
    oneTimeHarvest: '🌾 ایک بار کٹائی (اکٹھی)',
    updateCropBtn: '✏️ فصل کی تفصیلات اپ ڈیٹ کریں',
    saveCropBtn: 'فصل اور کھیت کی تفصیلات محفوظ کریں',
    selectCategoryTitle: 'فصل کا زمرہ منتخب کریں',
    selectCategorySub: 'فہرست دیکھنے کے لیے زمرہ منتخب کریں',
    availableCropsTitle: 'دستیاب فصلیں',
    categoryPrefix: 'زمرہ',
    noCropsFound: 'اس زمرے میں کوئی فصل نہیں ملی۔',
    selectLandAreaTitle: 'زمین کی اکائی منتخب کریں',
    selectLandAreaSub: 'زمین کی پیمائش کی اکائی منتخب کریں',
    selectIrrigationTitle: 'نظام آبپاشی منتخب کریں',
    selectIrrigationSub: 'پانی دینے کا طریقہ منتخب کریں',
    selectMeasurementTitle: 'پیمائش کی اکائی منتخب کریں',
    selectMeasurementSub: 'پیداوار کی اکائی منتخب کریں',
    plotDefaultSuffix: 'پلاٹ 1',
    upgradePlan: 'پلان اپ گریڈ کریں 👑',
    irrigationBorewell: 'ٹیوب ویل / بور ویل',
    irrigationCanal: 'نہری پانی',
    irrigationDrip: 'ڈرپ (قطرہ قطرہ) آبپاشی',
    irrigationSprinkler: 'فوارہ سسٹم',
    irrigationRainfed: 'بارانی (بارش پر مبنی)',
    unitKg: 'کلوگرام (KG)',
    unitQuintal: 'کوئنٹل (100 KG)',
    unitPieces: 'نگ / پیس',
    unitBunch: 'گچھا / بنچ',
    unitDozen: 'درجن',
    unitBox: 'پیٹی / کریٹ',
    unitSet: 'سیٹ',
    areaKilla: 'قلعہ (ایکڑ)',
    areaBigha: 'بیگھہ',
    areaMarla: 'مرلہ',
    areaKanal: 'کنال',
    areaBiswa: 'بسوہ',
    areaGuntha: 'گنتھا',
    areaSquareMeter: 'مربع میٹر',
    catFlowers: 'پھول اور فلوریکلچر',
    catVegetables: 'سبزیاں',
    catFruits: 'پھل اور باغات',
    catGrains: 'اناج',
    catPulses: 'دالیں',
    catOilseeds: 'تیل کے بیج',
    catFodder: 'چارے کی فصلیں',
    catHerbs: 'جڑی بوٹیاں',
    catOther: 'دیگر / کسٹم فصل',
  },
};

const getCategoryLabel = (id: string, name: string, dict: Record<string, string>) => {
  switch (id) {
    case 'flowers': return dict.catFlowers || name;
    case 'vegetables': return dict.catVegetables || name;
    case 'fruits': return dict.catFruits || name;
    case 'grains': return dict.catGrains || name;
    case 'pulses': return dict.catPulses || name;
    case 'oilseeds': return dict.catOilseeds || name;
    case 'fodder': return dict.catFodder || name;
    case 'herbs': return dict.catHerbs || name;
    case 'other': return dict.catOther || name;
    default: return name;
  }
};

const getIrrigationLabel = (type: string, fallback: string, dict: Record<string, string>) => {
  if (type.includes('Tube Well') || type.includes('Borewell')) return dict.irrigationBorewell || fallback;
  if (type.includes('Canal')) return dict.irrigationCanal || fallback;
  if (type.includes('Drip')) return dict.irrigationDrip || fallback;
  if (type.includes('Sprinkler')) return dict.irrigationSprinkler || fallback;
  if (type.includes('Rainfed')) return dict.irrigationRainfed || fallback;
  return fallback;
};

const getUnitLabel = (unit: string, fallback: string, dict: Record<string, string>) => {
  switch (unit) {
    case 'KG': return dict.unitKg || fallback;
    case 'Quintal': return dict.unitQuintal || fallback;
    case 'Pieces': return dict.unitPieces || fallback;
    case 'Bunch': return dict.unitBunch || fallback;
    case 'Dozen': return dict.unitDozen || fallback;
    case 'Box / Crate': return dict.unitBox || fallback;
    case 'Set': return dict.unitSet || fallback;
    default: return fallback;
  }
};

const getAreaUnitLabel = (unit: string, fallback: string, dict: Record<string, string>) => {
  if (unit.includes('Killa') || unit.includes('Acre')) return dict.areaKilla || fallback;
  if (unit.includes('Bigha')) return dict.areaBigha || fallback;
  if (unit.includes('Marla')) return dict.areaMarla || fallback;
  if (unit.includes('Kanal')) return dict.areaKanal || fallback;
  if (unit.includes('Biswa')) return dict.areaBiswa || fallback;
  if (unit.includes('Guntha')) return dict.areaGuntha || fallback;
  if (unit.includes('Square Meter')) return dict.areaSquareMeter || fallback;
  return fallback;
};

export const CropCategorySelectorModal: React.FC<CropCategorySelectorModalProps> = ({
  visible,
  onClose,
  onSaveCropForm,
  customCrops,
  editingCrop,
  onOpenUpgradeModal,
}) => {
  const router = useRouter();
  const { language } = useLanguage();
  const dict = useMemo(() => MODAL_I18N[language] || MODAL_I18N.en, [language]);

  const [selectedCatId, setSelectedCatId] = useState<string>('flowers');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState<boolean>(false);

  // Single Unified Form Modal
  const [selectedCrop, setSelectedCrop] = useState<CropItem | null>(null);
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState<boolean>(false);
  const [isCropDropdownOpen, setIsCropDropdownOpen] = useState<boolean>(false);
  const [cropSearchQuery, setCropSearchQuery] = useState<string>('');
  const [isCropPickerOpen, setIsCropPickerOpen] = useState<boolean>(false);
  const [isAreaUnitPickerOpen, setIsAreaUnitPickerOpen] = useState<boolean>(false);
  const [isIrrigationPickerOpen, setIsIrrigationPickerOpen] = useState<boolean>(false);
  const [isCropUnitPickerOpen, setIsCropUnitPickerOpen] = useState<boolean>(false);

  // Form Fields
  const [fieldName, setFieldName] = useState('');
  const [area, setArea] = useState('1');
  const [plantCount, setPlantCount] = useState('');
  const [selectedAreaUnit, setSelectedAreaUnit] = useState<LandAreaUnit>('Killa (Acre)');
  const [selectedIrrigation, setSelectedIrrigation] = useState<IrrigationType>('Tube Well / Borewell');
  const [cropStage, setCropStage] = useState<'PLANTATION' | 'VEGETATIVE' | 'FLOWERING' | 'HARVESTING' | 'COMPLETED' | 'SOWING' | 'GROWTH'>('PLANTATION');
  const [sowingDate, setSowingDate] = useState(() =>
    new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  );
  const [selectedSeason, setSelectedSeason] = useState<string>('Rabi (Winter)');
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
  const [selectedUnit, setSelectedUnit] = useState<CropUnit>('KG');
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const [customCropName, setCustomCropName] = useState('');
  const [varietyName, setVarietyName] = useState('');
  const [customHarvestType, setCustomHarvestType] = useState<HarvestType>('CONTINUOUS');

  useEffect(() => {
    if (visible && editingCrop) {
      setFieldName(editingCrop.fieldName || '');

      // Parse area & land area unit accurately
      if (editingCrop.area) {
        const parts = editingCrop.area.trim().split(' ');
        const numericVal = parts[0];
        setArea(numericVal || '1');

        const restUnitText = parts.slice(1).join(' ').trim();
        const foundUnit = LAND_AREA_UNITS.find(
          (u) => u.unit.toLowerCase() === restUnitText.toLowerCase() || u.label.toLowerCase() === restUnitText.toLowerCase()
        );
        if (foundUnit) {
          setSelectedAreaUnit(foundUnit.unit);
        }
      } else {
        setArea('1');
      }

      setVarietyName(editingCrop.variety || '');
      setPlantCount(editingCrop.plantCount ? String(editingCrop.plantCount) : '');
      if (editingCrop.sowingDate) setSowingDate(editingCrop.sowingDate);
      if (editingCrop.unit) setSelectedUnit(editingCrop.unit);
      if (editingCrop.stage) setCropStage(editingCrop.stage);
      if (editingCrop.irrigationType) setSelectedIrrigation(editingCrop.irrigationType);
      if (editingCrop.harvestType) setCustomHarvestType(editingCrop.harvestType);

      const matchedCat = INITIAL_CROP_CATEGORIES.find((c) => c.name === editingCrop.categoryName) || INITIAL_CROP_CATEGORIES[0];
      setSelectedCatId(matchedCat.id);

      const baseName = editingCrop.cropName.replace(/\s*\([^)]*\)/g, '').trim();
      setSelectedCrop({
        id: editingCrop.id,
        categoryId: matchedCat.id,
        name: baseName,
        hindiName: baseName,
        variety: editingCrop.variety,
        defaultUnit: editingCrop.unit,
        harvestType: editingCrop.harvestType,
      });
    } else if (visible && !editingCrop) {
      // Reset form defaults when adding a new crop
      setFieldName('');
      setArea('1');
      setVarietyName('');
      setPlantCount('');
      setSelectedIrrigation('Tube Well / Borewell');
      setCustomHarvestType('CONTINUOUS');
      setSowingDate(new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }));
      setSelectedCrop(null);
      setIsCatDropdownOpen(false);
      setIsCropDropdownOpen(false);
      setCropSearchQuery('');
    }
  }, [visible, editingCrop]);

  const allCrops = customCrops || INITIAL_CROPS_LIST;

  const currentCategory = useMemo(() => {
    return (
      INITIAL_CROP_CATEGORIES.find((c) => c.id === selectedCatId) ||
      INITIAL_CROP_CATEGORIES[0]
    );
  }, [selectedCatId]);

  // Filter crops belonging to selected category for modal
  const filteredCrops = useMemo(() => {
    const list = allCrops.filter((crop) => crop.categoryId === selectedCatId);
    if (!searchQuery.trim()) return list;
    return list.filter(
      (crop) =>
        crop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (crop.variety && crop.variety.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [allCrops, selectedCatId, searchQuery]);

  // Filter crops for inline dropdown list with intelligent search
  const displayedCrops = useMemo(() => {
    const q = cropSearchQuery.trim().toLowerCase();
    if (!q) {
      return allCrops.filter((crop) => crop.categoryId === selectedCatId);
    }
    const withinCategory = allCrops.filter(
      (crop) =>
        crop.categoryId === selectedCatId &&
        (crop.name.toLowerCase().includes(q) || (crop.variety && crop.variety.toLowerCase().includes(q)))
    );
    if (withinCategory.length > 0) return withinCategory;
    return allCrops.filter(
      (crop) =>
        crop.name.toLowerCase().includes(q) || (crop.variety && crop.variety.toLowerCase().includes(q))
    );
  }, [allCrops, selectedCatId, cropSearchQuery]);

  const handleSelectCategory = (catId: string) => {
    tap();
    setSelectedCatId(catId);
    setSearchQuery('');
    setCropSearchQuery('');
    setCustomCropName('');
    setCustomHarvestType('CONTINUOUS');
    setIsCategoryPickerOpen(false);
  };

  const handleAddCustomCrop = () => {
    if (!customCropName.trim()) return;
    tap();
    handleSelectCropItem({
      id: `custom-${Date.now()}`,
      categoryId: 'other',
      name: customCropName.trim(),
      hindiName: customCropName.trim(),
      harvestType: customHarvestType,
    });
  };

  const handleSelectCropItem = (crop: CropItem) => {
    tap();
    setSelectedCrop(crop);
    if (!fieldName.trim()) {
      setFieldName(`${crop.name} ${dict.plotDefaultSuffix || 'Plot 1'}`);
    }
    setSelectedUnit(crop.defaultUnit || 'KG');
    setVarietyName(crop.variety || '');
    setIsCropDropdownOpen(false);
    setCropSearchQuery('');
  };

  const handleFormSubmit = () => {
    tap();
    const baseCrop = selectedCrop || filteredCrops[0] || {
      id: `custom-${Date.now()}`,
      categoryId: selectedCatId,
      name: customCropName || 'Crop',
      hindiName: customCropName || 'Crop',
      harvestType: 'CONTINUOUS',
    };
    const cropToSave: CropItem = {
      ...baseCrop,
      variety: varietyName.trim() || undefined,
    };
    const finalFieldName = fieldName.trim() ? fieldName.trim() : `${cropToSave.name || 'Crop'} ${dict.plotDefaultSuffix || 'Plot 1'}`;

    onSaveCropForm({
      crop: cropToSave,
      category: currentCategory,
      fieldName: finalFieldName,
      area: area.trim() || '1',
      areaUnit: selectedAreaUnit,
      sowingDate: sowingDate,
      unit: selectedUnit || 'KG',
      pricePerUnit: '',
      stage: cropStage,
      harvestType: cropToSave.harvestType || 'CONTINUOUS',
      irrigationType: selectedIrrigation,
      plantCount: plantCount.trim() || undefined,
    });
    // Reset state & close
    setSelectedCrop(null);
    setFieldName('');
    setArea('1');
    setVarietyName('');
    setPlantCount('');
    setSowingDate(new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }));
    setErrorNotice(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerBadge}>
              <Ionicons name="leaf" size={18} color="#16a34a" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>{editingCrop ? dict.editTitle : dict.registerTitle}</Text>
              <Text style={styles.modalSub}>{editingCrop ? dict.editSubtitle : dict.registerSubtitle}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} activeOpacity={0.7} onPress={onClose}>
              <Ionicons name="close" size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          {editingCrop ? (
            <View style={styles.cropIdRibbon}>
              <Ionicons name="finger-print-outline" size={15} color="#0284c7" />
              <Text style={styles.cropIdText}>
                {dict.cropId}: <Text style={{ fontFamily: FONT.extraBold, color: '#0369a1' }}>{editingCrop.cropId || (editingCrop.id?.startsWith('C-') ? editingCrop.id : `C-${editingCrop.id?.slice(0, 6).toUpperCase()}`)}</Text>
              </Text>
              <View style={styles.cropIdVerifiedPill}>
                <Text style={styles.cropIdVerifiedText}>{dict.activeRecord}</Text>
              </View>
            </View>
          ) : null}

          <ScrollView style={{ maxHeight: 540 }} showsVerticalScrollIndicator={false}>
            {/* SECTION 1: CROP IDENTITY & SELECTION */}
            <View style={styles.formSectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="grid-outline" size={13} color="#16a34a" />
                <Text style={styles.sectionHeaderTitle}>{dict.cropSelection}</Text>
              </View>

              {/* 2-Column Responsive Dropdown Row: Category Dropdown & Crop Item Dropdown */}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                {/* 1. Category Dropdown Selector */}
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabelCompact} numberOfLines={1}>
                    Crop Category *
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.cropDropdownTriggerBtn,
                      {
                        borderColor: isCatDropdownOpen ? '#16a34a' : '#cbd5e1',
                        backgroundColor: '#ffffff',
                      },
                    ]}
                    activeOpacity={0.8}
                    onPress={() => {
                      tap();
                      setIsCatDropdownOpen(!isCatDropdownOpen);
                      setIsCropDropdownOpen(false);
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                      <Ionicons name={currentCategory.icon as any} size={14} color={currentCategory.color} />
                      <Text style={styles.cropDropdownTriggerText} numberOfLines={1}>
                        {getCategoryLabel(currentCategory.id, currentCategory.name, dict)}
                      </Text>
                    </View>
                    <Ionicons
                      name={isCatDropdownOpen ? "chevron-up" : "chevron-down"}
                      size={13}
                      color="#64748b"
                    />
                  </TouchableOpacity>
                </View>

                {/* 2. Crop Item Dropdown Selector */}
                <View style={{ flex: 1.2 }}>
                  <Text style={styles.inputLabelCompact} numberOfLines={1}>
                    {dict.cropName} *
                  </Text>
                  {selectedCatId !== 'other' ? (
                    <TouchableOpacity
                      style={[
                        styles.cropDropdownTriggerBtn,
                        {
                          borderColor: isCropDropdownOpen ? '#16a34a' : selectedCrop ? '#16a34a' : '#cbd5e1',
                          backgroundColor: selectedCrop ? '#f0fdf4' : '#ffffff',
                        },
                      ]}
                      activeOpacity={0.8}
                      onPress={() => {
                        tap();
                        setIsCropDropdownOpen(!isCropDropdownOpen);
                        setIsCatDropdownOpen(false);
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                        <Ionicons
                          name="leaf"
                          size={14}
                          color={selectedCrop ? '#16a34a' : currentCategory.color}
                        />
                        <Text
                          style={[
                            styles.cropDropdownTriggerText,
                            selectedCrop && { color: '#16a34a', fontFamily: FONT.bold },
                          ]}
                          numberOfLines={1}
                        >
                          {selectedCrop ? selectedCrop.name : `${dict.selectCropCount} (${filteredCrops.length})`}
                        </Text>
                      </View>
                      <Ionicons
                        name={isCropDropdownOpen ? "chevron-up" : "chevron-down"}
                        size={13}
                        color={selectedCrop ? '#16a34a' : "#64748b"}
                      />
                    </TouchableOpacity>
                  ) : (
                    <TextInput
                      style={styles.compactFormInput}
                      placeholder={dict.customCropPlaceholder}
                      placeholderTextColor="#94a3b8"
                      value={customCropName}
                      onChangeText={(text) => {
                        setCustomCropName(text);
                        setFieldName(text.trim() ? `${text.trim()} ${dict.plotDefaultSuffix || 'Plot 1'}` : '');
                      }}
                    />
                  )}
                </View>
              </View>

              {/* Variety Input Row */}
              <View style={{ marginTop: 8 }}>
                <Text style={styles.inputLabelCompact} numberOfLines={1}>{dict.varietyOptional}</Text>
                <TextInput
                  style={styles.compactFormInput}
                  placeholder={dict.varietyPlaceholder}
                  placeholderTextColor="#94a3b8"
                  value={varietyName}
                  onChangeText={setVarietyName}
                />
              </View>

              {/* CATEGORY DROPDOWN LIST (Opens when isCatDropdownOpen is true) */}
              {isCatDropdownOpen && (
                <View style={[styles.inlineDropdownCard, { marginTop: 8 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, paddingHorizontal: 2 }}>
                    <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#64748b' }}>
                      SELECT CROP CATEGORY ({INITIAL_CROP_CATEGORIES.length})
                    </Text>
                    <TouchableOpacity onPress={() => setIsCatDropdownOpen(false)}>
                      <Ionicons name="close-circle" size={16} color="#94a3b8" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled showsVerticalScrollIndicator={true}>
                    {INITIAL_CROP_CATEGORIES.map((cat) => {
                      const isSelected = cat.id === selectedCatId;
                      const catLabel = getCategoryLabel(cat.id, cat.name, dict);
                      const count = allCrops.filter((c) => c.categoryId === cat.id).length;
                      return (
                        <TouchableOpacity
                          key={cat.id}
                          style={[
                            styles.categoryDropdownListItem,
                            isSelected && { backgroundColor: '#f0fdf4', borderColor: '#16a34a' },
                          ]}
                          activeOpacity={0.7}
                          onPress={() => {
                            handleSelectCategory(cat.id);
                            setIsCatDropdownOpen(false);
                            setIsCropDropdownOpen(true);
                          }}
                        >
                          <View style={[styles.cropListIconBadge, { backgroundColor: cat.bg }]}>
                            <Ionicons name={cat.icon as any} size={14} color={cat.color} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.cropListItemTitle, isSelected && { color: '#16a34a', fontFamily: FONT.bold }]}>
                              {catLabel}
                            </Text>
                          </View>
                          <View style={[styles.compactTileBadge, { backgroundColor: isSelected ? '#dcfce7' : '#f1f5f9' }]}>
                            <Text style={[styles.compactTileBadgeText, { color: isSelected ? '#15803d' : '#64748b' }]}>
                              {count > 0 ? `${count} Crops` : 'Custom'}
                            </Text>
                          </View>
                          {isSelected && (
                            <Ionicons name="checkmark-circle" size={16} color="#16a34a" style={{ marginLeft: 6 }} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* CROP ITEMS DROPDOWN LIST (Opens when isCropDropdownOpen is true) */}
              {isCropDropdownOpen && selectedCatId !== 'other' && (
                <View style={[styles.inlineDropdownCard, { marginTop: 8 }]}>
                  {/* Search Bar */}
                  <View style={styles.dropdownSearchRow}>
                    <Ionicons name="search-outline" size={14} color="#64748b" />
                    <TextInput
                      style={styles.dropdownSearchInput}
                      placeholder="Search crop or variety..."
                      placeholderTextColor="#94a3b8"
                      value={cropSearchQuery}
                      onChangeText={setCropSearchQuery}
                      autoFocus={Platform.OS === 'web'}
                    />
                    {cropSearchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => setCropSearchQuery('')}>
                        <Ionicons name="close-circle" size={15} color="#94a3b8" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Header Title with count & Modal option */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, paddingHorizontal: 2 }}>
                    <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#64748b' }}>
                      CROP ITEMS ({displayedCrops.length})
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setIsCropDropdownOpen(false);
                        setIsCropPickerOpen(true);
                      }}
                    >
                      <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#16a34a' }}>
                        View Full List ↗
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Scrollable Dropdown List */}
                  <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled showsVerticalScrollIndicator={true}>
                    {displayedCrops.length > 0 ? (
                      displayedCrops.map((crop) => {
                        const isSelected = selectedCrop?.id === crop.id || selectedCrop?.name.toLowerCase() === crop.name.toLowerCase();
                        const isCont = (crop.harvestType || 'CONTINUOUS') === 'CONTINUOUS';
                        return (
                          <TouchableOpacity
                            key={crop.id}
                            style={[
                              styles.cropDropdownListItem,
                              isSelected && { backgroundColor: '#f0fdf4', borderColor: '#16a34a' },
                            ]}
                            activeOpacity={0.7}
                            onPress={() => handleSelectCropItem(crop)}
                          >
                            <View style={[styles.cropListIconBadge, { backgroundColor: currentCategory.bg }]}>
                              <Ionicons name="leaf" size={13} color={currentCategory.color} />
                            </View>

                            <View style={{ flex: 1 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={[styles.cropListItemTitle, isSelected && { color: '#16a34a', fontFamily: FONT.bold }]}>
                                  {crop.name}
                                </Text>
                                {crop.variety ? (
                                  <Text style={styles.cropListItemVariety}>({crop.variety})</Text>
                                ) : null}
                              </View>
                              {crop.season || crop.duration ? (
                                <Text style={styles.cropListItemMeta}>
                                  {[crop.season, crop.duration].filter(Boolean).join(' • ')}
                                </Text>
                              ) : null}
                            </View>

                            <View style={[styles.miniHarvestBadge, isCont ? { backgroundColor: '#e0f2fe' } : { backgroundColor: '#fef3c7' }]}>
                              <Text style={[styles.miniHarvestBadgeText, isCont ? { color: '#0369a1' } : { color: '#b45309' }]}>
                                {isCont ? 'Daily Harvest' : '1-Time Harvest'}
                              </Text>
                            </View>

                            {isSelected && (
                              <Ionicons name="checkmark-circle" size={16} color="#16a34a" style={{ marginLeft: 6 }} />
                            )}
                          </TouchableOpacity>
                        );
                      })
                    ) : (
                      <View style={styles.dropdownEmptyRow}>
                        <Ionicons name="leaf-outline" size={24} color="#cbd5e1" />
                        <Text style={styles.dropdownEmptyText}>
                          No crops found matching "{cropSearchQuery}"
                        </Text>
                      </View>
                    )}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* SECTION 2: PLOT & FIELD DIMENSIONS */}
            <View style={styles.formSectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="location-outline" size={13} color="#0284c7" />
                <Text style={[styles.sectionHeaderTitle, { color: '#0284c7' }]}>{dict.plotDimensions}</Text>
              </View>

              {/* Row: Field Name + Sowing Date */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1.2 }}>
                  <Text style={styles.inputLabelCompact}>{dict.fieldNameLabel} *</Text>
                  <TextInput
                    style={styles.compactFormInput}
                    placeholder={dict.fieldNamePlaceholder}
                    placeholderTextColor="#94a3b8"
                    value={fieldName}
                    onChangeText={setFieldName}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabelCompact}>{dict.sowingDateLabel} *</Text>
                  <TouchableOpacity
                    style={styles.calendarSelector}
                    activeOpacity={0.8}
                    onPress={() => {
                      tap();
                      setIsCalendarOpen(true);
                    }}
                  >
                    <Ionicons name="calendar-outline" size={14} color="#16a34a" />
                    <Text style={styles.calendarSelectorDate} numberOfLines={1}>
                      {sowingDate}
                    </Text>
                    <Ionicons name="chevron-down" size={11} color="#64748b" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* 3-Column: Area Size + Land Unit + Plants Count */}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabelCompact} numberOfLines={1}>{dict.areaSizeLabel} *</Text>
                  <TextInput
                    style={styles.compactFormInput}
                    placeholder="e.g. 1"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    value={area}
                    onChangeText={setArea}
                  />
                </View>

                <View style={{ flex: 1.2 }}>
                  <Text style={styles.inputLabelCompact} numberOfLines={1}>{dict.areaUnitLabel} *</Text>
                  <TouchableOpacity
                    style={styles.dropdownUnitSelectorBtn}
                    activeOpacity={0.8}
                    onPress={() => {
                      tap();
                      setIsAreaUnitPickerOpen(true);
                    }}
                  >
                    <Ionicons name="map-outline" size={13} color="#16a34a" />
                    <Text style={styles.dropdownUnitSelectorText} numberOfLines={1}>
                      {getAreaUnitLabel(selectedAreaUnit, selectedAreaUnit, dict)}
                    </Text>
                    <Ionicons name="chevron-down" size={11} color="#64748b" />
                  </TouchableOpacity>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabelCompact} numberOfLines={1}>{dict.plantsOptional}</Text>
                  <TextInput
                    style={styles.compactFormInput}
                    placeholder={dict.plantsPlaceholder}
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    value={plantCount}
                    onChangeText={setPlantCount}
                  />
                </View>
              </View>
            </View>

            {/* SECTION 3: CULTIVATION & HARVESTING */}
            <View style={styles.formSectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="construct-outline" size={13} color="#d97706" />
                <Text style={[styles.sectionHeaderTitle, { color: '#d97706' }]}>{dict.cultivationHarvesting}</Text>
              </View>

              {/* Growth Stage */}
              <Text style={styles.inputLabelCompact}>{dict.growthStageLabel} *</Text>
              <View style={styles.compactStageGrid}>
                {[
                  { key: 'PLANTATION', label: dict.stagePlantation, color: '#d97706', bg: '#fef3c7' },
                  { key: 'VEGETATIVE', label: dict.stageVegetative, color: '#0284c7', bg: '#e0f2fe' },
                  { key: 'FLOWERING', label: dict.stageFlowering, color: '#e11d48', bg: '#ffe4e6' },
                  { key: 'HARVESTING', label: dict.stageHarvesting, color: '#16a34a', bg: '#dcfce7' },
                ].map((st) => {
                  const isSelected = st.key === cropStage;
                  return (
                    <TouchableOpacity
                      key={st.key}
                      style={[
                        styles.compactStageChip,
                        isSelected
                          ? { backgroundColor: st.color, borderColor: st.color }
                          : { backgroundColor: '#ffffff', borderColor: '#e2e8f0' },
                      ]}
                      onPress={() => {
                        tap();
                        setCropStage(st.key as any);
                      }}
                    >
                      <Text
                        style={[
                          styles.compactStageText,
                          isSelected ? { color: '#ffffff', fontFamily: FONT.bold } : { color: '#475569' },
                        ]}
                      >
                        {st.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 2-Column: Irrigation System + Crop Measurement Unit */}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabelCompact} numberOfLines={1}>{dict.irrigationSystemLabel} *</Text>
                  <TouchableOpacity
                    style={styles.dropdownUnitSelectorBtn}
                    activeOpacity={0.8}
                    onPress={() => {
                      tap();
                      setIsIrrigationPickerOpen(true);
                    }}
                  >
                    <Ionicons
                      name={(IRRIGATION_TYPES.find((irr) => irr.type === selectedIrrigation)?.icon as any) || 'water-outline'}
                      size={14}
                      color="#0284c7"
                    />
                    <Text style={styles.dropdownUnitSelectorText} numberOfLines={1}>
                      {getIrrigationLabel(selectedIrrigation, selectedIrrigation, dict)}
                    </Text>
                    <Ionicons name="chevron-down" size={11} color="#64748b" />
                  </TouchableOpacity>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabelCompact} numberOfLines={1}>{dict.measurementUnitLabel} *</Text>
                  <TouchableOpacity
                    style={styles.dropdownUnitSelectorBtn}
                    activeOpacity={0.8}
                    onPress={() => {
                      tap();
                      setIsCropUnitPickerOpen(true);
                    }}
                  >
                    <Ionicons
                      name={(CROP_UNITS.find((u) => u.unit === selectedUnit)?.icon as any) || 'scale-outline'}
                      size={14}
                      color="#16a34a"
                    />
                    <Text style={styles.dropdownUnitSelectorText} numberOfLines={1}>
                      {getUnitLabel(selectedUnit, selectedUnit, dict)}
                    </Text>
                    <Ionicons name="chevron-down" size={11} color="#64748b" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Harvest Pattern */}
              <Text style={[styles.inputLabelCompact, { marginTop: 8 }]}>{dict.harvestPatternLabel} *</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={[
                    styles.compactMiniChip,
                    { flex: 1, justifyContent: 'center', height: 36, borderRadius: RADIUS.md },
                    customHarvestType === 'CONTINUOUS'
                      ? { backgroundColor: '#16a34a', borderColor: '#16a34a' }
                      : { backgroundColor: '#ffffff', borderColor: '#e2e8f0' },
                  ]}
                  onPress={() => {
                    tap();
                    setCustomHarvestType('CONTINUOUS');
                  }}
                >
                  <Text style={[styles.compactMiniText, customHarvestType === 'CONTINUOUS' ? { color: '#fff', fontFamily: FONT.bold } : { color: '#16a34a' }]}>
                    {dict.dailyHarvestContinuous}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.compactMiniChip,
                    { flex: 1, justifyContent: 'center', height: 36, borderRadius: RADIUS.md },
                    customHarvestType === 'ONE_TIME'
                      ? { backgroundColor: '#d97706', borderColor: '#d97706' }
                      : { backgroundColor: '#ffffff', borderColor: '#e2e8f0' },
                  ]}
                  onPress={() => {
                    tap();
                    setCustomHarvestType('ONE_TIME');
                  }}
                >
                  <Text style={[styles.compactMiniText, customHarvestType === 'ONE_TIME' ? { color: '#fff', fontFamily: FONT.bold } : { color: '#d97706' }]}>
                    {dict.oneTimeHarvest}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {errorNotice ? (
              <View style={{ gap: 6, marginVertical: 6, alignItems: 'center' }}>
                <Text style={styles.errorText}>{errorNotice}</Text>
                {errorNotice.toLowerCase().includes('upgrade') ? (
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#16a34a',
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: RADIUS.md,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    }}
                    onPress={() => {
                      onClose();
                      if (onOpenUpgradeModal) {
                        onOpenUpgradeModal();
                      } else {
                        router.push('/(tabs)/wallet' as never);
                      }
                    }}
                  >
                    <Ionicons name="sparkles" size={15} color="#ffffff" />
                    <Text style={{ color: '#ffffff', fontFamily: FONT.bold, fontSize: 13 }}>{dict.upgradePlan}</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.submitFormBtn, { backgroundColor: '#16a34a', marginTop: 8 }]}
              activeOpacity={0.85}
              onPress={handleFormSubmit}
            >
              <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
              <Text style={styles.submitFormText}>{editingCrop ? dict.updateCropBtn : dict.saveCropBtn}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* COMPACT CATEGORY PICKER MODAL */}
        <Modal visible={isCategoryPickerOpen} transparent animationType="slide">
          <View style={styles.overlay}>
            <View style={styles.pickerModalCard}>
              <View style={styles.headerRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>{dict.selectCategoryTitle}</Text>
                  <Text style={styles.modalSub}>{dict.selectCategorySub}</Text>
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setIsCategoryPickerOpen(false)}>
                  <Ionicons name="close" size={20} color="#475569" />
                </TouchableOpacity>
              </View>

              <View style={styles.categoryGridContainer}>
                {INITIAL_CROP_CATEGORIES.map((cat) => {
                  const isSelected = cat.id === selectedCatId;
                  const count = allCrops.filter((c) => c.categoryId === cat.id).length;
                  const catLabel = getCategoryLabel(cat.id, cat.name, dict);
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.compactGridTile,
                        isSelected
                          ? { backgroundColor: cat.color, borderColor: cat.color }
                          : { backgroundColor: cat.bg, borderColor: 'transparent' },
                      ]}
                      activeOpacity={0.8}
                      onPress={() => handleSelectCategory(cat.id)}
                    >
                      <Ionicons name={cat.icon as any} size={15} color={isSelected ? '#ffffff' : cat.color} />
                      <Text style={[styles.compactTileTitle, { color: isSelected ? '#ffffff' : cat.color }]} numberOfLines={1}>
                        {catLabel}
                      </Text>
                      <View style={[styles.compactTileBadge, { backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.7)' }]}>
                        <Text style={[styles.compactTileBadgeText, { color: isSelected ? '#ffffff' : cat.color }]}>
                          {count}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </Modal>

        {/* COMPACT CROP ITEMS PICKER MODAL */}
        <Modal visible={isCropPickerOpen} transparent animationType="slide">
          <View style={styles.overlay}>
            <View style={styles.pickerModalCard}>
              <View style={styles.headerRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>{dict.availableCropsTitle} ({filteredCrops.length})</Text>
                  <Text style={styles.modalSub}>{dict.categoryPrefix}: {getCategoryLabel(currentCategory.id, currentCategory.name, dict)}</Text>
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setIsCropPickerOpen(false)}>
                  <Ionicons name="close" size={20} color="#475569" />
                </TouchableOpacity>
              </View>

              {/* Search bar inside modal */}
              <View style={[styles.dropdownSearchRow, { marginVertical: 8 }]}>
                <Ionicons name="search-outline" size={14} color="#64748b" />
                <TextInput
                  style={styles.dropdownSearchInput}
                  placeholder="Search crop or variety..."
                  placeholderTextColor="#94a3b8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={15} color="#94a3b8" />
                  </TouchableOpacity>
                )}
              </View>

              <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={true}>
                <View style={{ gap: 6, paddingVertical: 4 }}>
                  {filteredCrops.length > 0 ? (
                    filteredCrops.map((crop) => {
                      const isSelected = selectedCrop?.id === crop.id || selectedCrop?.name.toLowerCase() === crop.name.toLowerCase();
                      const isCont = (crop.harvestType || 'CONTINUOUS') === 'CONTINUOUS';
                      return (
                        <TouchableOpacity
                          key={crop.id}
                          style={[
                            styles.cropDropdownListItem,
                            isSelected && { backgroundColor: '#f0fdf4', borderColor: '#16a34a' },
                          ]}
                          activeOpacity={0.8}
                          onPress={() => {
                            tap();
                            setIsCropPickerOpen(false);
                            handleSelectCropItem(crop);
                          }}
                        >
                          <View style={[styles.cropListIconBadge, { backgroundColor: currentCategory.bg }]}>
                            <Ionicons name="leaf" size={14} color={currentCategory.color} />
                          </View>

                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text style={[styles.cropListItemTitle, isSelected && { color: '#16a34a', fontFamily: FONT.bold }]}>
                                {crop.name}
                              </Text>
                              {crop.variety ? (
                                <Text style={styles.cropListItemVariety}>({crop.variety})</Text>
                              ) : null}
                            </View>
                            {crop.season || crop.duration ? (
                              <Text style={styles.cropListItemMeta}>
                                {[crop.season, crop.duration].filter(Boolean).join(' • ')}
                              </Text>
                            ) : null}
                          </View>

                          <View style={[styles.miniHarvestBadge, isCont ? { backgroundColor: '#e0f2fe' } : { backgroundColor: '#fef3c7' }]}>
                            <Text style={[styles.miniHarvestBadgeText, isCont ? { color: '#0369a1' } : { color: '#b45309' }]}>
                              {isCont ? 'Daily Harvest' : '1-Time Harvest'}
                            </Text>
                          </View>

                          {isSelected && (
                            <Ionicons name="checkmark-circle" size={16} color="#16a34a" style={{ marginLeft: 4 }} />
                          )}
                        </TouchableOpacity>
                      );
                    })
                  ) : (
                    <View style={styles.emptyWrap}>
                      <Ionicons name="leaf-outline" size={28} color="#cbd5e1" />
                      <Text style={styles.emptyText}>{dict.noCropsFound}</Text>
                    </View>
                  )}
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* CALENDAR DATE PICKER MODAL */}
        <CalendarDatePickerModal
          visible={isCalendarOpen}
          onClose={() => setIsCalendarOpen(false)}
          onSelectDate={(formattedDate, season) => {
            setSowingDate(formattedDate);
            setSelectedSeason(season);
          }}
          initialDate={sowingDate}
        />

        {/* COMPACT LAND AREA UNIT PICKER MODAL */}
        <Modal visible={isAreaUnitPickerOpen} transparent animationType="slide">
          <View style={styles.overlay}>
            <View style={styles.pickerModalCard}>
              <View style={styles.headerRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>{dict.selectLandAreaTitle}</Text>
                  <Text style={styles.modalSub}>{dict.selectLandAreaSub}</Text>
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setIsAreaUnitPickerOpen(false)}>
                  <Ionicons name="close" size={20} color="#475569" />
                </TouchableOpacity>
              </View>

              <View style={{ gap: 8, paddingVertical: 8 }}>
                {LAND_AREA_UNITS.map((u) => {
                  const isSelected = u.unit === selectedAreaUnit;
                  const unitLabel = getAreaUnitLabel(u.unit, u.label, dict);
                  return (
                    <TouchableOpacity
                      key={u.unit}
                      style={[
                        styles.unitOptionRow,
                        isSelected && { backgroundColor: '#f0fdf4', borderColor: '#16a34a' },
                      ]}
                      onPress={() => {
                        tap();
                        setSelectedAreaUnit(u.unit);
                        setIsAreaUnitPickerOpen(false);
                      }}
                    >
                      <Ionicons name="map-outline" size={16} color={isSelected ? '#16a34a' : '#64748b'} />
                      <Text style={[styles.unitOptionText, isSelected && { color: '#16a34a', fontFamily: FONT.bold }]}>
                        {unitLabel}
                      </Text>
                      {isSelected ? <Ionicons name="checkmark-circle" size={18} color="#16a34a" /> : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </Modal>

        {/* COMPACT IRRIGATION SYSTEM PICKER MODAL */}
        <Modal visible={isIrrigationPickerOpen} transparent animationType="slide">
          <View style={styles.overlay}>
            <View style={styles.pickerModalCard}>
              <View style={styles.headerRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>{dict.selectIrrigationTitle}</Text>
                  <Text style={styles.modalSub}>{dict.selectIrrigationSub}</Text>
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setIsIrrigationPickerOpen(false)}>
                  <Ionicons name="close" size={20} color="#475569" />
                </TouchableOpacity>
              </View>

              <View style={{ gap: 8, paddingVertical: 8 }}>
                {IRRIGATION_TYPES.map((irr) => {
                  const isSelected = irr.type === selectedIrrigation;
                  const irrLabel = getIrrigationLabel(irr.type, irr.label, dict);
                  return (
                    <TouchableOpacity
                      key={irr.type}
                      style={[
                        styles.unitOptionRow,
                        isSelected && { backgroundColor: '#f0f9ff', borderColor: '#0284c7' },
                      ]}
                      onPress={() => {
                        tap();
                        setSelectedIrrigation(irr.type);
                        setIsIrrigationPickerOpen(false);
                      }}
                    >
                      <Ionicons name={irr.icon as any} size={18} color={isSelected ? '#0284c7' : '#64748b'} />
                      <Text style={[styles.unitOptionText, isSelected && { color: '#0284c7', fontFamily: FONT.bold }]}>
                        {irrLabel}
                      </Text>
                      {isSelected ? <Ionicons name="checkmark-circle" size={18} color="#0284c7" /> : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </Modal>

        {/* COMPACT CROP MEASUREMENT UNIT PICKER MODAL */}
        <Modal visible={isCropUnitPickerOpen} transparent animationType="slide">
          <View style={styles.overlay}>
            <View style={styles.pickerModalCard}>
              <View style={styles.headerRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>{dict.selectMeasurementTitle}</Text>
                  <Text style={styles.modalSub}>{dict.selectMeasurementSub}</Text>
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setIsCropUnitPickerOpen(false)}>
                  <Ionicons name="close" size={20} color="#475569" />
                </TouchableOpacity>
              </View>

              <View style={{ gap: 8, paddingVertical: 8 }}>
                {CROP_UNITS.map((u) => {
                  const isSelected = u.unit === selectedUnit;
                  const unitLabel = getUnitLabel(u.unit, u.label, dict);
                  return (
                    <TouchableOpacity
                      key={u.unit}
                      style={[
                        styles.unitOptionRow,
                        isSelected && { backgroundColor: '#f0fdf4', borderColor: '#16a34a' },
                      ]}
                      onPress={() => {
                        tap();
                        setSelectedUnit(u.unit);
                        setIsCropUnitPickerOpen(false);
                      }}
                    >
                      <Ionicons name={(u.icon as any) || 'scale-outline'} size={18} color={isSelected ? '#16a34a' : '#64748b'} />
                      <Text style={[styles.unitOptionText, isSelected && { color: '#16a34a', fontFamily: FONT.bold }]}>
                        {unitLabel}
                      </Text>
                      {isSelected ? <Ionicons name="checkmark-circle" size={18} color="#16a34a" /> : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};


const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: Platform.OS === 'web' ? 'center' : 'flex-end',
    alignItems: 'center',
    padding: Platform.OS === 'web' ? 16 : 0,
  },
  modalCard: {
    width: '100%',
    maxWidth: 620,
    maxHeight: '92%',
    backgroundColor: '#ffffff',
    borderRadius: Platform.OS === 'web' ? 20 : 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 18,
    paddingBottom: Platform.OS === 'web' ? 20 : 28,
    borderWidth: Platform.OS === 'web' ? 1.5 : 0,
    borderColor: '#e2e8f0',
    ...premiumShadow('#000000', 'lg'),
  },
  pickerModalCard: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '85%',
    backgroundColor: '#ffffff',
    borderRadius: Platform.OS === 'web' ? 20 : 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 18,
    paddingBottom: 28,
    borderWidth: Platform.OS === 'web' ? 1.5 : 0,
    borderColor: '#e2e8f0',
    ...premiumShadow('#000000', 'lg'),
  },
  headerBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropIdRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#bae6fd',
    marginBottom: 10,
  },
  cropIdText: {
    flex: 1,
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#0369a1',
  },
  cropIdVerifiedPill: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  cropIdVerifiedText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#0284c7',
  },
  formSectionCard: {
    backgroundColor: '#f8fafc',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 10,
    marginBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  sectionHeaderTitle: {
    fontSize: 10.5,
    fontFamily: FONT.extraBold,
    color: '#15803d',
    letterSpacing: 0.5,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
  },
  modalSub: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  categorySelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: 9,
    maxWidth: '48%',
  },
  categorySelectText: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    flexShrink: 1,
  },
  compactSearchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  compactSearchInput: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: FONT.medium,
    color: '#0f172a',
    padding: 0,
  },
  inputLabelCompact: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#334155',
    marginBottom: 6,
    marginTop: 4,
  },
  compactStageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  compactStageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    flexGrow: 1,
  },
  compactStageText: {
    fontSize: 11.5,
    fontFamily: FONT.semiBold,
  },
  compactFormInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    height: 40,
    fontSize: 13,
    fontFamily: FONT.medium,
    color: '#0f172a',
  },
  selectPromptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderRadius: RADIUS.lg,
    padding: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  selectPromptTitle: {
    fontSize: 13,
    fontFamily: FONT.bold,
  },
  selectPromptSub: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginTop: 2,
  },
  cropDropdownSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
  },
  cropDropdownTitle: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
  },
  cropDropdownSub: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginTop: 1,
  },
  inlineDropdownCard: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    marginTop: 8,
    padding: 8,
    ...premiumShadow('#000000', 'sm'),
  },
  dropdownSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8fafc',
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 10,
    height: 36,
  },
  dropdownSearchInput: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: FONT.medium,
    color: '#0f172a',
    paddingVertical: 0,
  },
  cropDropdownTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
    height: 40,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
  },
  cropDropdownTriggerText: {
    fontSize: 12.5,
    fontFamily: FONT.semiBold,
    color: '#0f172a',
  },
  categoryDropdownListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginBottom: 5,
  },
  cropDropdownListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginBottom: 5,
  },
  cropListIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropListItemTitle: {
    fontSize: 13,
    fontFamily: FONT.semiBold,
    color: '#0f172a',
  },
  cropListItemVariety: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  cropListItemMeta: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    marginTop: 1,
  },
  dropdownEmptyRow: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dropdownEmptyText: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    textAlign: 'center',
  },
  categoryGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 6,
  },
  compactGridTile: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    paddingHorizontal: 9,
    paddingVertical: 8,
  },
  compactTileTitle: {
    flex: 1,
    fontSize: 12,
    fontFamily: FONT.bold,
  },
  compactTileBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  compactTileBadgeText: {
    fontSize: 9.5,
    fontFamily: FONT.extraBold,
  },
  categoryOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  catOptionIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catOptionTitle: {
    fontSize: 13.5,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  countBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  countBadgeText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
  },
  examplesTagBox: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  examplesTagText: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#475569',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: FONT.medium,
    color: '#0f172a',
  },
  listHeader: {
    marginBottom: 8,
  },
  listHeaderTitle: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  cropListScroll: {
    maxHeight: 380,
  },
  compactCropRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.md,
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginBottom: 6,
    gap: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  compactCropIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactCropName: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  miniHarvestBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  miniHarvestBadgeText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
  },
  cropRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: 12,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cropIconBg: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customCropBox: {
    backgroundColor: '#f8fafc',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: SPACING.md,
  },
  customCropHint: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#64748b',
    lineHeight: 17,
    marginBottom: 4,
  },
  cropName: {
    fontSize: 14.5,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  cropDesc: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 5,
  },
  miniBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  miniBadgeText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#15803d',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    gap: 6,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: FONT.bold,
    color: '#64748b',
  },
  emptySub: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    textAlign: 'center',
  },
  selectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: RADIUS.lg,
    marginBottom: 10,
  },
  selectedCropTitle: {
    fontSize: 15,
    fontFamily: FONT.bold,
  },
  selectedCropSub: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#475569',
    marginTop: 2,
  },
  readOnlyNoticeBox: {
    padding: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: 10,
    gap: 4,
  },
  readOnlyNoticeTitle: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: FONT.bold,
  },
  readOnlyNoticeSub: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    lineHeight: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#334155',
    marginTop: 10,
    marginBottom: 4,
  },
  formInput: {
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
  calendarSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    height: 40,
  },
  calendarSelectorDate: {
    fontSize: 14,
    fontFamily: FONT.bold,
    color: '#15803d',
  },
  calendarSelectorSeason: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#16a34a',
    marginTop: 2,
  },
  unitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 4,
  },
  unitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  unitChipText: {
    fontSize: 11.5,
    fontFamily: FONT.semiBold,
    color: '#475569',
  },
  priceWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: RADIUS.md,
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    height: 38,
    gap: 6,
  },
  currencySymbol: {
    fontSize: 16,
    fontFamily: FONT.bold,
    color: '#16a34a',
  },
  priceInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  unitSuffix: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#64748b',
  },
  errorText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#dc2626',
    marginTop: 8,
  },
  submitFormBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 18,
    borderRadius: RADIUS.md,
    paddingVertical: 13,
  },
  submitFormText: {
    color: '#ffffff',
    fontFamily: FONT.bold,
    fontSize: 14.5,
  },
  compactMiniChip: {
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
  },
  compactMiniText: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
  },
  compactCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  compactCategoryText: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
  },
  cropSelectBtnLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    marginBottom: 6,
  },
  cropSelectTextLarge: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONT.bold,
  },
  dropdownUnitSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: RADIUS.md,
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    height: 40,
  },
  dropdownUnitSelectorText: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  unitOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  unitOptionText: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: FONT.medium,
    color: '#0f172a',
  },
  saleInfoCard: {
    backgroundColor: '#f8fafc',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 10,
    marginTop: 8,
  },
  saleCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  saleCardTitle: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
});
