import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, useWindowDimensions, Pressable, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import PublicHeader from '@/components/PublicHeader';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence, withRepeat, withTiming, withDelay } from 'react-native-reanimated';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';
import { BlurView } from 'expo-blur';

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
        
        {/* Floating Glowing Orbs (Web effect) */}
        {Platform.OS === 'web' && (
          <>
            <View style={{ position: 'absolute', top: -20, left: '10%', width: 250, height: 250, borderRadius: 125, backgroundColor: 'rgba(16, 185, 129, 0.2)', filter: 'blur(60px)' as any, zIndex: -1 }} />
            <View style={{ position: 'absolute', top: 150, right: '10%', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(2, 132, 199, 0.2)', filter: 'blur(60px)' as any, zIndex: -1 }} />
          </>
        )}

        {/* TOP TEXT AREA */}
        <View style={styles.heroTextContainer}>
          {/* Trust Badges */}
          <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center', marginBottom: 16 }}>
            <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="leaf" size={12} color="#10b981" />
              <Text style={{ color: '#10b981', fontSize: 10, fontFamily: FONT.bold }}>10k+ Farmers</Text>
            </View>
            <View style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="trophy" size={12} color="#f59e0b" />
              <Text style={{ color: '#f59e0b', fontSize: 10, fontFamily: FONT.bold }}>Premium AI</Text>
            </View>
          </View>

          <Text style={[styles.heroTitle, !isDesktop && styles.heroTitleMobile, { color: '#fef08a', textShadowColor: 'rgba(234, 179, 8, 0.4)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 10 }]}>
            Revolutionizing Indian Agriculture
          </Text>
          <Text style={[styles.heroSubtitle, !isDesktop && styles.heroSubtitleMobile]}>
            Complete Agri-Platform: From Seeds to Harvest & Pure Farmer-Made Foods.
          </Text>

          {/* Action Buttons */}
          <View style={{ flexDirection: 'row', gap: 16, justifyContent: 'center', marginTop: 28 }}>
            <TouchableOpacity 
              style={{ backgroundColor: '#10b981', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 30, ...premiumShadow('#10b981', 'md') }}
              onPress={() => router.push('/shop')}
            >
              <Text style={{ color: '#fff', fontFamily: FONT.bold, fontSize: 15 }}>Shop Now</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={{ backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}
              onPress={() => router.push('/topic/Crop-Doctors')}
            >
              <Text style={{ color: '#fff', fontFamily: FONT.bold, fontSize: 15 }}>Ask Agri-AI</Text>
            </TouchableOpacity>
          </View>
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
  const { width } = useWindowDimensions();
  const isMobile = width <= 768;
  const cardWidth = isMobile ? (width / 2) - 24 : 175;
  
  return (
    <View style={[styles.glassCard, { width: cardWidth, overflow: 'hidden' }]}>
      <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'stretch',
    justifyContent: 'center',
    paddingTop: 30,
    gap: 12,
  },
  glassCard: {
    backgroundColor: 'rgba(20, 30, 45, 0.3)',
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
