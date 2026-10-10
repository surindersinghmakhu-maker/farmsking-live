import React, { useState } from 'react';
import {
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export interface FestivalEvent {
  id: string;
  state: string;
  religion: string;
  daysToEvent: number;
  sowWindowDays: number;
  eventName: string;
  sowAlertTitle: string;
  sowCrops: string[];
  sowAdvice: string;
  highDemand: string[];
  lowDemand: string[];
  strategyTip: string;
}

export const FESTIVAL_DATA: FestivalEvent[] = [
  {
    id: 'diwali',
    state: 'Pan-India / All States',
    religion: 'Hindu / Sikh / National',
    daysToEvent: 66,
    sowWindowDays: 4,
    eventName: '🪔 Grand Diwali & Dhanteras Surge',
    sowAlertTitle: '🌱 SOW TODAY FOR 3X DIWALI PRICE SURGE',
    sowCrops: ['Flowers', 'Cauliflower (Gobhi)', 'Green Peas (Matar)', 'Capsicum'],
    sowAdvice: 'Plant Marigold flowers & Early Peas today. Harvest right 3 days before Diwali for 300% market price surge.',
    highDemand: ['▲ Flowers (3x Surge)', '▲ Green Peas & Capsicum', '▲ Fresh Milk & Mawa', '▲ Sweet Vegetables'],
    lowDemand: ['▼ Stored Onions (Price Slump)', '▼ Coarse Grains', '▼ Non-Festival Leafy Greens'],
    strategyTip: '💡 Expert Tip: Inter-crop Marigold with Cauliflower to prevent pests naturally and double your income on Dhanteras!',
  },
  {
    id: 'chhath',
    state: 'UP, Bihar, Jharkhand & Bengal',
    religion: 'Hindu / Folk Tradition',
    daysToEvent: 72,
    sowWindowDays: 5,
    eventName: '☀️ Mahaparv Chhath Puja Special Surge',
    sowAlertTitle: '🌱 HIGH VALUE SOWING ALERT FOR CHHATH PUJA',
    sowCrops: ['Red Sugarcane (Ganna)', 'Green Banana Stalks', 'Radish (Mooli)', 'Spinach (Palak)', 'Sweet Potato'],
    sowAdvice: 'Sow Sugarcane, Sweet Potato & Radish now. Chhath Puja requires raw whole sugarcane stalks with leaves.',
    highDemand: ['▲ Whole Red Sugarcane (3.5x Price)', '▲ Green Banana Clusters', '▲ Fresh Mooli with Leaves', '▲ Lemon & Ginger Plants'],
    lowDemand: ['▼ Brinjal / Eggplant (Strictly avoided during fasting)', '▼ Non-Satvik Veggies', '▼ Garlic & Onion'],
    strategyTip: '💡 Expert Tip: Bundle whole red sugarcane with fresh leafy tops; buyers pay premium ₹150-₹200 per stalk during Arghya!',
  },
  {
    id: 'baisakhi',
    state: 'Punjab, Haryana & North India',
    religion: 'Sikh / Hindu / Agricultural Harvest',
    daysToEvent: 85,
    sowWindowDays: 6,
    eventName: '🌾 Baisakhi Harvest & Summer Cash Crop Surge',
    sowAlertTitle: '🌱 SOW SHORT-DURATION CASH CROPS TODAY',
    sowCrops: ['Summer Moong Pulse', 'Okra (Bhindi)', 'Bottle Gourd (Lauki)', 'Cucumber (Kheera)', 'Muskmelon'],
    sowAdvice: 'Sow 60-day Summer Moong & Cucumber immediately post Rabi harvest. Capture high summer vegetable prices.',
    highDemand: ['▲ Summer Moong Pulse (2.5x Price)', '▲ Fresh Cucumber & Muskmelon', '▲ Okra & Bottle Gourd', '▲ Green Fodder'],
    lowDemand: ['▼ Heavy Winter Root Veggies', '▼ Stored Potatoes', '▼ Low-Moisture Crops'],
    strategyTip: '💡 Expert Tip: 60-day Summer Moong yields ₹40,000/acre in just 2 months while fixing nitrogen in your soil for Next Paddy crop!',
  }
];

export const ReverseSowingAlertCard: React.FC = () => {
  const [selectedEventIndex, setSelectedEventIndex] = useState<number>(0);
  const activeEvent = FESTIVAL_DATA[selectedEventIndex] || FESTIVAL_DATA[0];

  const handleShareWhatsapp = () => {
    tap();
    const shareText = `🌾 *FarmsKing Reverse Sowing Alert (${activeEvent.state})*\n\n🎉 Event: ${activeEvent.eventName}\n⏳ Countdown: ${activeEvent.daysToEvent} Days to Harvest\n\n${activeEvent.sowAlertTitle}:\n• ${activeEvent.sowCrops.join('\n• ')}\n\n💡 Advice: ${activeEvent.sowAdvice}\n\n📈 High Demand Surge:\n${activeEvent.highDemand.join('\n')}\n\n📲 Download FarmsKing App for Daily Market Rates & Reverse Sowing Alerts!`;
    const url = `whatsapp://send?text=${encodeURIComponent(shareText)}`;
    Linking.openURL(url).catch(() => {
      if (Platform.OS === 'web') alert(shareText);
    });
  };

  return (
    <View style={[styles.card, premiumShadow('#0f172a', 'md')]}>
      {/* Header Banner */}
      <LinearGradient colors={['#065f46', '#047857']} style={styles.cardHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="calendar" size={18} color="#a7f3d0" />
            <Text style={styles.cardHeaderTag}>REVERSE SOWING ENGINE</Text>
          </View>
          <View style={styles.countdownPill}>
            <Ionicons name="time-outline" size={12} color="#ffffff" />
            <Text style={styles.countdownPillText}>{activeEvent.daysToEvent} Days to Event</Text>
          </View>
        </View>

        <Text style={styles.eventTitle}>{activeEvent.eventName}</Text>

        <View style={styles.badgeRow}>
          <View style={styles.stateBadge}>
            <Ionicons name="location" size={11} color="#dcfce7" />
            <Text style={styles.stateBadgeText}>{activeEvent.state}</Text>
          </View>
          <View style={styles.religionBadge}>
            <Ionicons name="star" size={11} color="#fef3c7" />
            <Text style={styles.religionBadgeText}>{activeEvent.religion}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Festival Selector Tabs */}
      <View style={styles.eventTabsRow}>
        {FESTIVAL_DATA.map((evt, idx) => {
          const isActive = selectedEventIndex === idx;
          return (
            <TouchableOpacity
              key={evt.id}
              style={[styles.eventTab, isActive && styles.eventTabActive]}
              onPress={() => {
                tap();
                setSelectedEventIndex(idx);
              }}
            >
              <Text style={[styles.eventTabText, isActive && styles.eventTabTextActive]} numberOfLines={1}>
                {evt.eventName.split(' ')[0]} {evt.eventName.split(' ')[1]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Green Highlighted Sowing Alert Box */}
      <LinearGradient colors={['#f0fdf4', '#dcfce7']} style={styles.sowAlertBox}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={styles.sowAlertTitle}>{activeEvent.sowAlertTitle}</Text>
          <View style={styles.sowWindowTag}>
            <Text style={styles.sowWindowTagText}>⚡ Sow Today: {activeEvent.sowWindowDays} Days Left</Text>
          </View>
        </View>

        <View style={styles.cropChipsGrid}>
          {activeEvent.sowCrops.map((crop, i) => (
            <View key={i} style={styles.cropChip}>
              <Text style={styles.cropChipText}>🌱 {crop}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sowAdviceText}>{activeEvent.sowAdvice}</Text>
      </LinearGradient>

      {/* High vs Low Demand Comparison Grid */}
      <View style={styles.comparisonGrid}>
        {/* High Demand Column */}
        <View style={[styles.comparisonBox, { backgroundColor: '#f0fdf4', borderColor: '#86efac' }]}>
          <Text style={[styles.comparisonHeader, { color: '#15803d' }]}>▲ High Demand (2x-3x Price)</Text>
          {activeEvent.highDemand.map((item, idx) => (
            <Text key={idx} style={styles.highDemandItem}>{item}</Text>
          ))}
        </View>

        {/* Low Demand Column */}
        <View style={[styles.comparisonBox, { backgroundColor: '#fef2f2', borderColor: '#fca5a5' }]}>
          <Text style={[styles.comparisonHeader, { color: '#b91c1c' }]}>▼ Low Demand (Price Slump)</Text>
          {activeEvent.lowDemand.map((item, idx) => (
            <Text key={idx} style={styles.lowDemandItem}>{item}</Text>
          ))}
        </View>
      </View>

      {/* Strategy Tip Box */}
      <View style={styles.strategyTipBox}>
        <Text style={styles.strategyTipText}>{activeEvent.strategyTip}</Text>
      </View>

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.whatsappBtn} onPress={handleShareWhatsapp}>
          <Ionicons name="logo-whatsapp" size={16} color="#ffffff" />
          <Text style={styles.whatsappBtnText}>Share Reverse Sowing Alert on WhatsApp</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    marginTop: 10,
    marginBottom: 16,
  },
  cardHeader: {
    padding: 14,
    gap: 8,
  },
  cardHeaderTag: {
    fontSize: 10,
    fontFamily: FONT.extraBold,
    color: '#a7f3d0',
    letterSpacing: 0.5,
  },
  countdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  countdownPillText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  eventTitle: {
    fontSize: 16,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    lineHeight: 22,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  stateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  stateBadgeText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#dcfce7',
  },
  religionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  religionBadgeText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#fef3c7',
  },
  eventTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  eventTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  eventTabActive: {
    borderBottomColor: '#047857',
    backgroundColor: '#f0fdf4',
  },
  eventTabText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#64748b',
  },
  eventTabTextActive: {
    color: '#047857',
  },
  sowAlertBox: {
    margin: 12,
    padding: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: '#86efac',
    gap: 8,
  },
  sowAlertTitle: {
    fontSize: 12,
    fontFamily: FONT.extraBold,
    color: '#15803d',
    flex: 1,
  },
  sowWindowTag: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sowWindowTagText: {
    fontSize: 9.5,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  cropChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  cropChip: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  cropChipText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#166534',
  },
  sowAdviceText: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#14532d',
    lineHeight: 16,
  },
  comparisonGrid: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 8,
  },
  comparisonBox: {
    flex: 1,
    padding: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: 4,
  },
  comparisonHeader: {
    fontSize: 10.5,
    fontFamily: FONT.extraBold,
    marginBottom: 2,
  },
  highDemandItem: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#166534',
  },
  lowDemandItem: {
    fontSize: 10,
    fontFamily: FONT.semiBold,
    color: '#991b1b',
  },
  strategyTipBox: {
    margin: 12,
    padding: 10,
    backgroundColor: '#fffbe8',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  strategyTipText: {
    fontSize: 11,
    fontFamily: FONT.semiBold,
    color: '#92400e',
    lineHeight: 15,
  },
  actionBar: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  whatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#25d366',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  whatsappBtnText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
});
