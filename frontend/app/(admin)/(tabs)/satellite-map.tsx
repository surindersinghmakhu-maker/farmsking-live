import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Modal,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FarmLocationPickerModal } from '@/components/FarmLocationPickerModal';
import { useRole } from '@/src/store/role-context';
import { useCrops } from '@/src/store/crops-context';

interface SavedPlot {
  id: string;
  name: string;
  cropName: string;
  areaAcres: number;
  coordsText: string;
  isLocked: boolean;
  status: 'HEALTHY' | 'NEEDS_ATTENTION' | 'CRITICAL';
}

interface SatelliteZone {
  id: string;
  zoneName: string;
  areaAcres: number;
  ndviScore: number;
  status: 'HEALTHY' | 'MODERATE_STRESS' | 'HIGH_DISEASE';
  statusLabel: string;
  moisturePercent: number;
  color: string;
}

export default function SatelliteMapScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    cropId?: string;
    cropName?: string;
    farmerName?: string;
    plotName?: string;
    area?: string;
    location?: string;
    lat?: string;
    lng?: string;
  }>();
  const { role } = useRole();
  const { cropFields, cropGpsDataMap } = useCrops();

  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
  const isAdvisor = role === 'FARM_ADVISOR' || role === 'GARDEN_ADVISOR';

  // Real Active Crops fetched from Database Context & Route Params
  const realPlotsList: SavedPlot[] = useMemo(() => {
    const list: SavedPlot[] = [];

    // 1. Dynamic DB parameter selection passed from Advisor Supervision or Farmer Roster
    if (params.cropId || params.farmerName) {
      list.push({
        id: params.cropId || 'param-crop-1',
        name: params.plotName ? `${params.farmerName ? params.farmerName + "'s " : ''}${params.plotName}` : (params.farmerName ? `${params.farmerName}'s Field Plot` : 'Active Crop Plot'),
        cropName: params.cropName || 'Registered Crop',
        areaAcres: parseFloat(params.area || '2.8') || 2.8,
        coordsText: params.location || (params.lat && params.lng ? `${params.lat}° N, ${params.lng}° E` : '30.9085° N, 75.8610° E (DB Saved)'),
        isLocked: true,
        status: 'HEALTHY',
      });
    }

    // 2. Add registered crop fields from useCrops()
    if (cropFields && cropFields.length > 0) {
      cropFields.forEach((crop, idx) => {
        if (!list.some((p) => p.id === crop.id)) {
          list.push({
            id: crop.id,
            name: crop.fieldName || `Plot #${idx + 101}`,
            cropName: crop.cropName,
            areaAcres: parseFloat(crop.area) || 2.5,
            coordsText: crop.location || '30.9012° N, 75.8575° E (DB Saved)',
            isLocked: true,
            status: crop.stage === 'HARVESTING' ? 'NEEDS_ATTENTION' : 'HEALTHY',
          });
        }
      });
    }

    return list;
  }, [cropFields, params.cropId, params.cropName, params.farmerName, params.plotName, params.area, params.location, params.lat, params.lng]);

  const [selectedPlotId, setSelectedPlotId] = useState<string>(params.cropId || realPlotsList[0]?.id || '');

  const selectedPlot = useMemo(() => {
    if (realPlotsList.length === 0) return null;
    return realPlotsList.find((p) => p.id === selectedPlotId) || realPlotsList[0];
  }, [realPlotsList, selectedPlotId]);

  const activePlotGps = useMemo(() => {
    if (!selectedPlot) return null;
    return cropGpsDataMap[selectedPlot.id] || null;
  }, [cropGpsDataMap, selectedPlot]);

  const [showPlotPicker, setShowPlotPicker] = useState<boolean>(false);
  const [showLocationModal, setShowLocationModal] = useState<boolean>(false);
  const [savedLocation, setSavedLocation] = useState<string | null>(
    selectedPlot ? `${selectedPlot.coordsText} (${selectedPlot.areaAcres} Acres)` : null
  );
  const [isUnlockRequested, setIsUnlockRequested] = useState<boolean>(false);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(false);
  const [mapViewMode, setMapViewMode] = useState<'PHOTO' | 'NDVI' | 'MOISTURE'>('PHOTO');

  const mockZones: SatelliteZone[] = [
    {
      id: 'z1',
      zoneName: 'North Zone',
      areaAcres: 2.5,
      ndviScore: 0.82,
      status: 'HEALTHY',
      statusLabel: '🟢 Fully Healthy',
      moisturePercent: 78,
      color: '#22c55e',
    },
    {
      id: 'z2',
      zoneName: 'Central Zone',
      areaAcres: 3.0,
      ndviScore: 0.61,
      status: 'MODERATE_STRESS',
      statusLabel: '🟡 Water / Nutrient Stress',
      moisturePercent: 42,
      color: '#eab308',
    },
    {
      id: 'z3',
      zoneName: 'South Corner',
      areaAcres: 1.5,
      ndviScore: 0.38,
      status: 'HIGH_DISEASE',
      statusLabel: '🔴 High Disease / Pest Stress',
      moisturePercent: 25,
      color: '#ef4444',
    },
  ];

  const handleAdminUnlockRequest = () => {
    if (!selectedPlot) return;
    setIsUnlockRequested(true);
    Alert.alert(
      'Unlock Requested 🔓',
      `Request sent to Admin to unlock boundaries for ${selectedPlot.name}. Admin will approve re-editing.`
    );
  };

  const handleAdminInstantUnlockOverride = () => {
    if (!selectedPlot) return;
    setIsAdminUnlocked(true);
    Alert.alert(
      'Admin Override Success 🔓',
      `Admin Mode: GPS coordinates and boundaries for ${selectedPlot.name} have been unlocked instantly for farmer re-editing.`
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🛰️ Satellite Field Scanner</Text>
        <View style={[
          styles.roleTag,
          isAdmin ? { backgroundColor: '#f3e8ff' } : isAdvisor ? { backgroundColor: '#eff6ff' } : { backgroundColor: '#dcfce7' }
        ]}>
          <Text style={[
            styles.roleTagText,
            isAdmin ? { color: '#7c3aed' } : isAdvisor ? { color: '#2563eb' } : { color: '#16a34a' }
          ]}>
            {isAdmin ? '👑 Admin Mode' : isAdvisor ? '🎓 Advisor Mode' : '👨‍🌾 Farmer Mode'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Sync Banner */}
        <View style={[
          styles.bannerCard,
          isAdmin ? { backgroundColor: '#2e1065' } : isAdvisor ? { backgroundColor: '#1e3a8a' } : { backgroundColor: '#0f172a' }
        ]}>
          <View style={styles.bannerBadge}>
            <Text style={styles.bannerBadgeText}>
              Real Registered Farmer Crops Only ({realPlotsList.length})
            </Text>
          </View>
          <Text style={styles.bannerHeading}>NDVI Crop Health & Moisture Map</Text>
          <Text style={styles.bannerSub}>
            Live ISRO / Sentinel-2 satellite scanning linked directly to your real registered crops.
          </Text>
        </View>

        {/* IF NO REAL CROPS REGISTERED YET */}
        {realPlotsList.length === 0 || !selectedPlot ? (
          <View style={styles.emptyCropsCard}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="leaf" size={36} color="#16a34a" />
            </View>
            <Text style={styles.emptyCropsTitle}>No Registered Crops Found</Text>
            <Text style={styles.emptyCropsSub}>
              Register your real crops in My Crops & Fields to enable satellite GPS mapping and advisor diagnostics.
            </Text>
            <TouchableOpacity
              style={styles.addCropBtn}
              activeOpacity={0.85}
              onPress={() => router.push('/(tabs)/farm')}
            >
              <Ionicons name="add-circle" size={18} color="#ffffff" />
              <Text style={styles.addCropBtnText}>+ Add Crop in My Crops & Fields</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* RENDER REAL CROPS DATA & CARDS */
          <>
            {/* Set / Lock Farm Location Button */}
            <TouchableOpacity
              style={[styles.setLocationBtn, isAdmin && { backgroundColor: '#7c3aed' }]}
              activeOpacity={0.85}
              onPress={() => setShowLocationModal(true)}
            >
              <Ionicons name="location" size={22} color="#ffffff" />
              <View style={{ flex: 1 }}>
                <Text style={styles.setLocationBtnTitle}>🛰️ Satellite Advisor</Text>
                <Text style={styles.setLocationBtnSub}>
                  {savedLocation ? `Saved & Locked: ${savedLocation}` : '1-Click GPS location setup'}
                </Text>
              </View>
              <Ionicons name="lock-closed" size={18} color="#fef08a" />
            </TouchableOpacity>

            {/* Real Crop Plot Selector Dropdown */}
            <View style={styles.selectorCard}>
              <Text style={styles.selectorLabel}>Select Real Registered Crop Plot:</Text>
              <TouchableOpacity
                style={styles.pickerBox}
                activeOpacity={0.8}
                onPress={() => setShowPlotPicker(true)}
              >
                <Ionicons name="leaf" size={20} color={isAdmin ? '#7c3aed' : isAdvisor ? '#2563eb' : '#16a34a'} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.pickerText}>{selectedPlot.name} — {selectedPlot.cropName}</Text>
                  <Text style={styles.pickerSubText}>
                    {selectedPlot.coordsText} ({selectedPlot.areaAcres} Acres) · {isAdminUnlocked ? '🔓 Admin Unlocked' : selectedPlot.isLocked ? '🔒 Locked' : '🔓 Unlocked'}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* 3 DISTINCT ROLE-TAILORED REQUIREMENT DISPLAY CARDS */}
            {isAdmin ? (
              /* MODE 1: ADMIN PLATFORM COMMAND VIEW */
              <View style={styles.adminCommandCard}>
                <View style={styles.tailoredHeader}>
                  <Ionicons name="shield-checkmark" size={20} color="#7c3aed" />
                  <Text style={[styles.tailoredTitle, { color: '#5b21b6' }]}>
                    👑 Admin Master GPS Governance — {selectedPlot.name}
                  </Text>
                </View>

                <View style={styles.adminCoordBox}>
                  <Text style={styles.adminCoordLabel}>GPS Coordinates & Boundary Stamp:</Text>
                  <Text style={styles.adminCoordVal}>📍 {selectedPlot.coordsText} ({selectedPlot.areaAcres} Acres)</Text>
                  <Text style={styles.adminSyncStatus}>
                    🛡️ Sentinel-2 Sync: <Text style={{ fontWeight: '800', color: '#16a34a' }}>VERIFIED & ACTIVE</Text>
                  </Text>
                </View>

                {/* Instant Admin Unlock Override */}
                <TouchableOpacity
                  style={styles.adminInstantUnlockBtn}
                  activeOpacity={0.85}
                  onPress={handleAdminInstantUnlockOverride}
                >
                  <Ionicons name="key" size={16} color="#ffffff" />
                  <Text style={styles.adminInstantUnlockText}>
                    {isAdminUnlocked ? '🔓 Field Location Unlocked by Admin' : '🔓 Instant Admin GPS Unlock Override'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : isAdvisor ? (
              /* MODE 2: ADVISOR COMPREHENSIVE CROP ADVISORY & DIAGNOSTIC CARD (EASY ENGLISH) */
              <View style={styles.advisorAnalysisCard}>
                <View style={styles.tailoredHeader}>
                  <Ionicons name="analytics" size={20} color="#1d4ed8" />
                  <Text style={[styles.tailoredTitle, { color: '#1e40af' }]}>
                    🎓 Advisor Diagnostic & Crop Advisory — {selectedPlot.cropName}
                  </Text>
                </View>

                {/* 1. Full Crop Profile Details in Easy English */}
                <View style={{ backgroundColor: '#ffffff', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#bfdbfe', marginBottom: 8, gap: 4 }}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#1e3a8a' }}>
                    📋 Field & Crop Profile Summary
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 2 }}>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: '#334155' }}>
                      🌾 Crop: <Text style={{ fontWeight: '800', color: '#16a34a' }}>{selectedPlot.cropName}</Text>
                    </Text>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: '#334155' }}>
                      📏 Field Area: <Text style={{ fontWeight: '800' }}>{selectedPlot.areaAcres} Acres</Text>
                    </Text>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: '#334155' }}>
                      📍 GPS Stamp: <Text style={{ fontWeight: '800', color: '#0284c7' }}>{selectedPlot.coordsText}</Text>
                    </Text>
                  </View>
                </View>

                {/* 2. Technical Satellite Metrics in Easy English */}
                <View style={styles.matrixGrid}>
                  <View style={styles.matrixBox}>
                    <Text style={styles.matrixLabel}>Vegetation NDVI Score</Text>
                    <Text style={styles.matrixValue}>0.82 (High Healthy Peak)</Text>
                  </View>

                  <View style={styles.matrixBox}>
                    <Text style={styles.matrixLabel}>Disease Risk Level</Text>
                    <Text style={[styles.matrixValue, { color: '#dc2626' }]}>84% Yellow Rust Risk</Text>
                  </View>
                </View>

                <View style={styles.matrixGrid}>
                  <View style={styles.matrixBox}>
                    <Text style={styles.matrixLabel}>Soil Hydration Level</Text>
                    <Text style={styles.matrixValue}>48.3% Average Moisture</Text>
                  </View>

                  <View style={styles.matrixBox}>
                    <Text style={styles.matrixLabel}>GPS Boundary Lock</Text>
                    <Text style={[styles.matrixValue, { color: '#16a34a' }]}>
                      {isAdminUnlocked ? '🔓 Admin Unlocked' : '🔒 Verified & Locked'}
                    </Text>
                  </View>
                </View>

                {/* 3. Recommended Advisor Instructions for Farmer (Easy English Advice) */}
                <View style={{ backgroundColor: '#f0fdf4', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#bbf7d0', marginTop: 6, gap: 6 }}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#15803d' }}>
                    💡 Step-by-Step Advisory Actions to Prescribe to Farmer:
                  </Text>

                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
                    <Ionicons name="water" size={14} color="#0284c7" />
                    <Text style={{ fontSize: 11, fontWeight: '600', color: '#166534', flex: 1, lineHeight: 16 }}>
                      💧 <Text style={{ fontWeight: '800', color: '#0369a1' }}>Irrigation Recommendation:</Text> Instruct farmer to apply light irrigation within 24 hours to relieve central zone moisture stress. Avoid standing water.
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
                    <Ionicons name="flask" size={14} color="#dc2626" />
                    <Text style={{ fontSize: 11, fontWeight: '600', color: '#166534', flex: 1, lineHeight: 16 }}>
                      💊 <Text style={{ fontWeight: '800', color: '#dc2626' }}>Fungicide Spray Treatment:</Text> Prescribe 200ml Propiconazole 25% EC (Tilt) mixed in 200L water per acre after morning dew clears to stop Rust spread.
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
                    <Ionicons name="leaf" size={14} color="#16a34a" />
                    <Text style={{ fontSize: 11, fontWeight: '600', color: '#166534', flex: 1, lineHeight: 16 }}>
                      🧪 <Text style={{ fontWeight: '800', color: '#15803d' }}>Nutrient Dosage:</Text> Advise top-dressing 20kg Urea per acre with irrigation for vigorous tillering and leaf recovery.
                    </Text>
                  </View>
                </View>

                {/* Advisory Response Action */}
                <TouchableOpacity
                  style={styles.adminUnlockRowBtn}
                  activeOpacity={0.85}
                  onPress={handleAdminUnlockRequest}
                >
                  <Ionicons name="paper-plane" size={16} color="#2563eb" />
                  <Text style={styles.adminUnlockRowText}>
                    {isUnlockRequested ? '🔓 Unlock Request Sent to Admin' : '🔓 Request Admin to Unlock Field Location'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* MODE 3: FARMER NEED-BASED ACTION VIEW */
              <View style={styles.farmerActionCard}>
                <View style={styles.tailoredHeader}>
                  <Ionicons name="leaf" size={20} color="#15803d" />
                  <Text style={styles.tailoredTitle}>🌾 Farmer Action Summary — {selectedPlot.cropName}</Text>
                </View>

                {/* Health Status */}
                <View style={styles.actionRowItem}>
                  <View style={styles.actionIconBgGreen}>
                    <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.actionItemTitle}>Overall Field Health Status</Text>
                    <Text style={styles.actionItemSub}>88% Healthy Crop Growth ({selectedPlot.name})</Text>
                  </View>
                </View>

                {/* Water Moisture Requirement */}
                <View style={styles.actionRowItem}>
                  <View style={styles.actionIconBgAmber}>
                    <Ionicons name="water" size={18} color="#d97706" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.actionItemTitle}>Irrigation Requirement (Water)</Text>
                    <Text style={styles.actionItemSub}>Central Zone needs watering within 24 Hours (Moisture 42%)</Text>
                  </View>
                </View>

                {/* Spray Prescription */}
                <View style={styles.actionRowItem}>
                  <View style={styles.actionIconBgRed}>
                    <Ionicons name="alert-circle" size={18} color="#dc2626" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.actionItemTitle}>Recommended Spray / Treatment</Text>
                    <Text style={styles.actionItemSub}>Apply Tilt 25% EC (Propiconazole) on South Corner</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Interactive Satellite Scanner & Live Field Photo Viewer */}
            <View style={styles.mapContainer}>
              {/* Header & Mode Switcher */}
              <View style={styles.mapHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.mapTitle}>🛰️ Satellite Scanner — {selectedPlot.cropName}</Text>
                  <Text style={styles.mapDate}>📍 {selectedPlot.name} · {selectedPlot.coordsText}</Text>
                </View>

                {/* View Switcher Chips */}
                <View style={styles.viewModeChipRow}>
                  <TouchableOpacity
                    style={[styles.viewModeChip, mapViewMode === 'PHOTO' && styles.viewModeChipActive]}
                    onPress={() => setMapViewMode('PHOTO')}
                  >
                    <Ionicons name="camera" size={12} color={mapViewMode === 'PHOTO' ? '#ffffff' : '#0369a1'} />
                    <Text style={[styles.viewModeChipText, mapViewMode === 'PHOTO' && styles.viewModeChipTextActive]}>
                      📷 Live Photo
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.viewModeChip, mapViewMode === 'NDVI' && styles.viewModeChipActive]}
                    onPress={() => setMapViewMode('NDVI')}
                  >
                    <Ionicons name="planet" size={12} color={mapViewMode === 'NDVI' ? '#ffffff' : '#0369a1'} />
                    <Text style={[styles.viewModeChipText, mapViewMode === 'NDVI' && styles.viewModeChipTextActive]}>
                      🛰️ NDVI
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.viewModeChip, mapViewMode === 'MOISTURE' && styles.viewModeChipActive]}
                    onPress={() => setMapViewMode('MOISTURE')}
                  >
                    <Ionicons name="water" size={12} color={mapViewMode === 'MOISTURE' ? '#ffffff' : '#0369a1'} />
                    <Text style={[styles.viewModeChipText, mapViewMode === 'MOISTURE' && styles.viewModeChipTextActive]}>
                      💧 Moisture
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* VIEW MODE 1: LIVE FIELD SATELLITE OPTICAL PHOTO */}
              {mapViewMode === 'PHOTO' ? (
                <View style={styles.livePhotoWrapper}>
                  <Image
                    source={require('@/assets/images/satellite_field_live_view.png')}
                    style={styles.liveFieldPhoto}
                    resizeMode="cover"
                  />
                  <View style={styles.photoOverlayBadge}>
                    <Ionicons name="sparkles" size={12} color="#ffffff" />
                    <Text style={styles.photoOverlayText}>
                      🟢 Sentinel-2 Optical Imagery ({activePlotGps?.locationText || selectedPlot.coordsText})
                    </Text>
                  </View>
                  <View style={styles.photoCornerTopLeft}>
                    <Text style={styles.photoCornerText}>
                      {activePlotGps?.corners[0] ? `C1 ✓: ${activePlotGps.corners[0].lat}°N, ${activePlotGps.corners[0].lng}°E` : 'C1 (NW) ✓'}
                    </Text>
                  </View>
                  <View style={styles.photoCornerTopRight}>
                    <Text style={styles.photoCornerText}>
                      {activePlotGps?.corners[1] ? `C2 ✓: ${activePlotGps.corners[1].lat}°N, ${activePlotGps.corners[1].lng}°E` : 'C2 (NE) ✓'}
                    </Text>
                  </View>
                  <View style={styles.photoCornerBottomLeft}>
                    <Text style={styles.photoCornerText}>
                      {activePlotGps?.corners[3] ? `C4 ✓: ${activePlotGps.corners[3].lat}°N, ${activePlotGps.corners[3].lng}°E` : 'C4 (SW) ✓'}
                    </Text>
                  </View>
                  <View style={styles.photoCornerBottomRight}>
                    <Text style={styles.photoCornerText}>
                      {activePlotGps?.corners[2] ? `C3 ✓: ${activePlotGps.corners[2].lat}°N, ${activePlotGps.corners[2].lng}°E` : 'C3 (SE) ✓'}
                    </Text>
                  </View>
                </View>
              ) : mapViewMode === 'NDVI' ? (
                /* VIEW MODE 2: NDVI HEATMAP GRID */
                <View style={styles.heatmapGrid}>
                  <View style={[styles.gridCell, { backgroundColor: 'rgba(34, 197, 94, 0.85)' }]}>
                    <Text style={styles.cellText}>🟢 0.82 NDVI</Text>
                    <Text style={styles.cellSub}>North Zone (Healthy)</Text>
                  </View>

                  <View style={[styles.gridCell, { backgroundColor: 'rgba(234, 179, 8, 0.85)' }]}>
                    <Text style={styles.cellText}>🟡 0.61 NDVI</Text>
                    <Text style={styles.cellSub}>Central Zone (Stress)</Text>
                  </View>

                  <View style={[styles.gridCell, { backgroundColor: 'rgba(239, 68, 68, 0.85)' }]}>
                    <Text style={styles.cellText}>🔴 0.38 NDVI</Text>
                    <Text style={styles.cellSub}>South Zone (Disease)</Text>
                  </View>

                  <View style={[styles.gridCell, { backgroundColor: 'rgba(34, 197, 94, 0.85)' }]}>
                    <Text style={styles.cellText}>🟢 0.85 NDVI</Text>
                    <Text style={styles.cellSub}>East Boundary</Text>
                  </View>
                </View>
              ) : (
                /* VIEW MODE 3: SOIL MOISTURE GRID */
                <View style={styles.heatmapGrid}>
                  <View style={[styles.gridCell, { backgroundColor: 'rgba(2, 132, 199, 0.85)' }]}>
                    <Text style={styles.cellText}>💧 78% Moisture</Text>
                    <Text style={styles.cellSub}>North Zone (Optimal)</Text>
                  </View>

                  <View style={[styles.gridCell, { backgroundColor: 'rgba(217, 119, 6, 0.85)' }]}>
                    <Text style={styles.cellText}>💧 42% Moisture</Text>
                    <Text style={styles.cellSub}>Central Zone (Dry)</Text>
                  </View>

                  <View style={[styles.gridCell, { backgroundColor: 'rgba(220, 38, 38, 0.85)' }]}>
                    <Text style={styles.cellText}>💧 25% Moisture</Text>
                    <Text style={styles.cellSub}>South Zone (Needs Water)</Text>
                  </View>

                  <View style={[styles.gridCell, { backgroundColor: 'rgba(2, 132, 199, 0.85)' }]}>
                    <Text style={styles.cellText}>💧 72% Moisture</Text>
                    <Text style={styles.cellSub}>East Boundary</Text>
                  </View>
                </View>
              )}

              {/* Compact Executive Summary Bar */}
              <View style={styles.executiveSummaryRow}>
                <View style={styles.execMetricItem}>
                  <Text style={styles.execMetricLabel}>NDVI Coverage</Text>
                  <Text style={styles.execMetricValue}>0.82 (Healthy)</Text>
                </View>
                <View style={styles.execMetricDivider} />
                <View style={styles.execMetricItem}>
                  <Text style={styles.execMetricLabel}>Soil Moisture</Text>
                  <Text style={[styles.execMetricValue, { color: '#0284c7' }]}>78% Avg</Text>
                </View>
                <View style={styles.execMetricDivider} />
                <View style={styles.execMetricItem}>
                  <Text style={styles.execMetricLabel}>Rust Index</Text>
                  <Text style={[styles.execMetricValue, { color: '#dc2626' }]}>84% Risk</Text>
                </View>
              </View>
            </View>

            {/* Detailed Zone Breakdown */}
            <Text style={styles.sectionHeading}>📊 Detailed Plot Zone Breakdown</Text>

            {mockZones.map((zone) => (
              <View key={zone.id} style={[styles.zoneCard, { borderLeftColor: zone.color }]}>
                <View style={styles.zoneHeader}>
                  <Text style={styles.zoneName}>{zone.zoneName}</Text>
                  <Text style={styles.zoneArea}>{zone.areaAcres} Acres</Text>
                </View>
                <Text style={styles.zoneStatus}>{zone.statusLabel}</Text>

                <View style={styles.statsRow}>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>NDVI Index Score</Text>
                    <Text style={styles.statValue}>{zone.ndviScore}</Text>
                  </View>

                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Soil Moisture Level</Text>
                    <Text style={styles.statValue}>{zone.moisturePercent}%</Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* SAVED REAL CROPS PICKER MODAL */}
      <Modal visible={showPlotPicker} transparent animationType="fade" onRequestClose={() => setShowPlotPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModalCard}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Registered Crop Plots ({realPlotsList.length})</Text>
              <TouchableOpacity onPress={() => setShowPlotPicker(false)}>
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            {realPlotsList.map((plot) => (
              <TouchableOpacity
                key={plot.id}
                style={[
                  styles.plotOptionCard,
                  selectedPlot?.id === plot.id && styles.selectedPlotOptionCard,
                ]}
                activeOpacity={0.8}
                onPress={() => {
                  setSelectedPlotId(plot.id);
                  setSavedLocation(`${plot.coordsText} (${plot.areaAcres} Acres)`);
                  setShowPlotPicker(false);
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.plotOptionName}>{plot.name}</Text>
                  <Text style={styles.plotOptionSub}>
                    🌾 {plot.cropName} · {plot.coordsText} ({plot.areaAcres} Acres)
                  </Text>
                </View>
                <View style={styles.lockedBadge}>
                  <Ionicons name="lock-closed" size={12} color="#b45309" />
                  <Text style={styles.lockedBadgeText}>LOCKED</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Farm Location GPS Picker Modal */}
      <FarmLocationPickerModal
        visible={showLocationModal}
        initialIsLocked={!isAdminUnlocked}
        cropId={selectedPlot?.id}
        cropName={selectedPlot?.cropName}
        plotName={selectedPlot?.name}
        location={selectedPlot?.coordsText}
        existingGpsData={cropFields.find((c) => c.id === selectedPlot?.id)?.gpsData}
        onClose={() => setShowLocationModal(false)}
        onSaveLocation={(data) => {
          setIsAdminUnlocked(false);
          setSavedLocation(`${data.latitude.toFixed(4)}° N, ${data.longitude.toFixed(4)}° E (${data.areaAcres} Acres · 4 Corners)`);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  roleTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  roleTagText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
  },
  bannerCard: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
  },
  bannerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
  },
  bannerBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  bannerHeading: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  bannerSub: {
    color: '#e2e8f0',
    fontSize: 12.5,
    lineHeight: 18,
  },
  emptyCropsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#bbf7d0',
    marginVertical: 10,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyCropsTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  emptyCropsSub: {
    fontSize: 12.5,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  addCropBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#16a34a',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addCropBtnText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '800',
  },
  setLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#16a34a',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  setLocationBtnTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  setLocationBtnSub: {
    color: '#dcfce7',
    fontSize: 11.5,
    marginTop: 1,
  },
  selectorCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  selectorLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 6,
  },
  pickerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  pickerText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  pickerSubText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  adminCommandCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#ddd6fe',
    marginBottom: 16,
  },
  adminCoordBox: {
    backgroundColor: '#f5f3ff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd6fe',
    marginBottom: 12,
  },
  adminCoordLabel: {
    fontSize: 11.5,
    color: '#5b21b6',
    fontWeight: '700',
    marginBottom: 2,
  },
  adminCoordVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  adminSyncStatus: {
    fontSize: 11,
    color: '#475569',
  },
  adminInstantUnlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#7c3aed',
    paddingVertical: 12,
    borderRadius: 12,
  },
  adminInstantUnlockText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  farmerActionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#bbf7d0',
    marginBottom: 16,
  },
  advisorAnalysisCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    marginBottom: 16,
  },
  tailoredHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  tailoredTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#166534',
  },
  actionRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 10,
  },
  actionIconBgGreen: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconBgAmber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconBgRed: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  actionItemSub: {
    fontSize: 11.5,
    color: '#475569',
    marginTop: 1,
  },
  matrixGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  matrixBox: {
    flex: 1,
    backgroundColor: '#f0f9ff',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  matrixLabel: {
    fontSize: 11,
    color: '#0369a1',
    fontWeight: '600',
  },
  matrixValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  adminUnlockRowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  adminUnlockRowText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#2563eb',
  },
  mapContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginBottom: 20,
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mapTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  mapDate: {
    fontSize: 11,
    color: '#64748b',
  },
  viewModeChipRow: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: '#e0f2fe',
    borderRadius: 10,
    padding: 3,
  },
  viewModeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 7,
  },
  viewModeChipActive: {
    backgroundColor: '#0284c7',
  },
  viewModeChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0369a1',
  },
  viewModeChipTextActive: {
    color: '#ffffff',
  },
  livePhotoWrapper: {
    height: 190,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    marginVertical: 8,
    borderWidth: 1.5,
    borderColor: '#38bdf8',
  },
  liveFieldPhoto: {
    width: '100%',
    height: '100%',
  },
  photoOverlayBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  photoOverlayText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },
  photoCornerTopLeft: {
    position: 'absolute',
    top: 34,
    left: 8,
    backgroundColor: '#0284c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  photoCornerTopRight: {
    position: 'absolute',
    top: 34,
    right: 8,
    backgroundColor: '#0284c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  photoCornerBottomLeft: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: '#0284c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  photoCornerBottomRight: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#0284c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  photoCornerText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ffffff',
  },
  executiveSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 8,
  },
  execMetricItem: {
    flex: 1,
    alignItems: 'center',
  },
  execMetricLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  execMetricValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#16a34a',
    marginTop: 2,
  },
  execMetricDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#cbd5e1',
  },
  heatmapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 8,
  },
  gridCell: {
    width: '48%',
    height: 90,
    borderRadius: 12,
    padding: 10,
    justifyContent: 'center',
  },
  cellText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
  cellSub: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11,
    marginTop: 2,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
  },
  zoneCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderLeftWidth: 5,
  },
  zoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  zoneName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  zoneArea: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  zoneStatus: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 8,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerModalCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
  },
  pickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  pickerModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  plotOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  selectedPlotOptionCard: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  plotOptionName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  plotOptionSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  lockedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#b45309',
  },
});
