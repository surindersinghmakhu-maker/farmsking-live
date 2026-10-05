import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, useWindowDimensions, Pressable, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import PublicHeader from '@/components/PublicHeader';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence, withRepeat, withTiming, withDelay } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';

function AnimatedCropAsset({ imgSrc, style, label, index = 0 }: { imgSrc: any, style: any, label: string, index?: number }) {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    // Subtle float animation
    const duration = 2500;
    const offset = index % 2 === 0 ? -4 : 4;
    const delay = index * 300;
    
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(offset, { duration }),
          withTiming(-offset, { duration })
        ),
        -1,
        true
      )
    );

    rotation.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(3, { duration }),
          withTiming(-3, { duration })
        ),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { translateY: translateY.value },
        { rotate: `${rotation.value}deg` }
      ],
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(1.2, { damping: 10, stiffness: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 100 });
  };

  return (
    <Animated.View style={[style, animatedStyle]}>
      <Pressable 
        onPressIn={handlePressIn} 
        onPressOut={handlePressOut}
        onHoverIn={handlePressIn} // Works on Web
        onHoverOut={handlePressOut} // Works on Web
        style={{ alignItems: 'center' }}
      >
        <Image source={imgSrc} style={styles.interactiveAsset} resizeMode="cover" />
      </Pressable>
    </Animated.View>
  );
}

const AnimatedSmartText = ({ inHeader = false }: { inHeader?: boolean }) => {
  return (
    <View style={[styles.smartBadgeContainer, inHeader && { marginBottom: 0, marginLeft: 16 }]}>
      <LinearGradient
        colors={['#10b981', '#059669', '#047857']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.smartBadgeGradient, inHeader && { paddingVertical: 6, paddingHorizontal: 12 }]}
      >
        <Ionicons name="sparkles" size={14} color="#ecfdf5" style={{ marginRight: 6 }} />
        <Text style={[styles.smartBadgeText, inHeader && { fontSize: 11 }]}>SMART FARMING PLATFORM</Text>
      </LinearGradient>
    </View>
  );
};

export default function PublicLandingPage() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const isDesktop = width > 768;

  return (
    <View style={styles.container}>
      
      {/* 100% RESPONSIVE FULL SCREEN BACKGROUND */}
      <Image 
        source={require('@/assets/images/farmsking_clean_bg.png')} 
        style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} 
        resizeMode="cover" 
      />
      {/* Dark overlay to make text pop */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.4)' }]} />

      {/* FLOATING HEADER (PILL) */}
      <PublicHeader />

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
      >
        
        {/* TOP TEXT AREA */}
        <View style={styles.heroTextContainer}>
          <AnimatedSmartText />
          <Text style={[styles.heroTitle, !isDesktop && styles.heroTitleMobile]}>
            Revolutionizing Indian Agriculture
          </Text>
          <Text style={[styles.heroSubtitle, !isDesktop && styles.heroSubtitleMobile]}>
            Complete Agri-Platform: From Seeds to Harvest & Pure Farmer-Made Foods.
          </Text>
        </View>

        {/* BOTTOM CARDS ROW */}
        <View style={[styles.cardsRow, !isDesktop && styles.cardsRowMobile]}>
          
          <GlassCard 
            imgSrcs={[
              require('@/assets/images/asset_wheat.png'),
              require('@/assets/images/icon_farming.png')
            ]}
            title="Farming" 
            desc="Precision Agriculture, Yield Max, Resource Efficiency."
            onLearnMore={() => router.push('/topic/Farming')}
          />
          <GlassCard 
            imgSrcs={[
              require('@/assets/images/asset_sunflower.png'),
              require('@/assets/images/icon_gardening.png')
            ]}
            title="Gardening" 
            desc="Home Gardening Kits, Urban Farming Solutions, Plant Care."
            onLearnMore={() => router.push('/topic/Gardening')}
          />
          <GlassCard 
            imgSrcs={[
              require('@/assets/images/icon_cropdoctors.png'),
              require('@/assets/images/asset_tomato.png')
            ]}
            title="Crop Doctors" 
            desc="AI Disease Diagnosis, Expert Consultations, Soil Analysis."
            onLearnMore={() => router.push('/topic/Crop-Doctors')}
          />
          <GlassCard 
            imgSrcs={[
              require('@/assets/images/icon_agristore.png'),
              require('@/assets/images/asset_wheat.png')
            ]}
            title="Agri Store" 
            desc="Buy Certified Seeds, Fertilizers, Equipment & More."
            onLearnMore={() => router.push('/shop')}
          />
          
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function GlassCard({ imgSrcs, title, desc }: { imgSrcs: any[], title: string, desc: string }) {
  const router = useRouter();
  
  return (
    <View style={styles.glassCard}>
      <View style={styles.glassCardTopRow}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {imgSrcs.map((src, idx) => (
            <AnimatedCropAsset 
              key={idx}
              index={idx}
              imgSrc={src} 
              label="" 
              style={{ zIndex: 10 }} 
            />
          ))}
        </View>
      </View>
      
      <Text style={styles.glassCardTitle}>{title}</Text>
      <Text style={styles.glassCardDesc}>{desc}</Text>
      
      <TouchableOpacity 
        style={styles.learnMoreBtn}
        onPress={() => router.push(`/topic/${encodeURIComponent(title)}`)}
      >
        <Text style={styles.learnMoreText}>Learn More</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  interactiveAsset: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    ...premiumShadow('#000', 'lg'),
  },
  floatingHeader: {
    position: 'absolute',
    top: 20,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(25, 30, 45, 0.75)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 50,
    width: '90%',
    maxWidth: 1000,
    zIndex: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  floatingHeaderMobile: {
    width: '95%',
    paddingHorizontal: 16,
    top: Platform.OS === 'web' ? 20 : 40,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoCircle: {
    width: 28,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 20,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  navLink: {
    fontSize: 14,
    fontFamily: FONT.medium,
    color: '#cbd5e1',
  },
  loginBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  loginBtnText: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 100, // pushed down just enough for header
    justifyContent: 'space-between',
    zIndex: 10,
  },
  smartBadgeContainer: {
    marginBottom: 12,
    borderRadius: 30,
    ...premiumShadow('rgba(16, 185, 129, 0.6)', 'md'),
  },
  smartBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#34d399',
  },
  smartBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: FONT.extraBold,
    letterSpacing: 1.5,
  },
  heroTextContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 0,
  },
  heroTitle: {
    fontSize: 32,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  heroTitleMobile: {
    fontSize: 24,
  },
  heroSubtitle: {
    fontSize: 16,
    fontFamily: FONT.medium,
    color: '#e2e8f0',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroSubtitleMobile: {
    fontSize: 14,
  },
  cardsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 16,
    marginTop: 'auto',
    paddingTop: 40,
  },
  cardsRowMobile: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: 40,
  },
  glassCard: {
    backgroundColor: 'rgba(20, 30, 45, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 12,
    width: 175,
    ...premiumShadow('rgba(0,0,0,0.5)', 'lg'),
  },
  glassCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  glassCardArrowBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassCardTitle: {
    fontSize: 18,
    fontFamily: FONT.bold,
    color: '#ffffff',
    marginBottom: 6,
  },
  glassCardDesc: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#cbd5e1',
    lineHeight: 18,
    marginBottom: 16,
    flex: 1,
  },
  learnMoreBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  learnMoreText: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
});
