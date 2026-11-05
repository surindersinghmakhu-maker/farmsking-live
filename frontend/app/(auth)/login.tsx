import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import * as Haptics from 'expo-haptics';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/src/lib/firebase';
import { useAuth } from '@/src/store/auth-context';
import { useAppSettings } from '@/src/hooks/useAppSettings';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';
import { BrandLogo } from '@/src/components/BrandLogo';

if (Platform.OS !== 'web') {
  WebBrowser.maybeCompleteAuthSession();
}

const GOOGLE_CLIENT_ID = '742233980320-ito7h8q3iq5vdon6b93qc08q5l8c3v9v.apps.googleusercontent.com';

export default function LoginScreen() {
  const { user, googleLogin, sendLoginOtp, otpLogin, completeOtpRegistration } = useAuth();
  const { data: appSettings } = useAppSettings();
  const router = useRouter();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const otpInputRef = useRef<TextInput>(null);

  // Check if current runtime is localhost / local dev
  const isLocalhost =
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.includes('192.168.'));

  const handleSuccessNavigation = (isProfileIncomplete = false, loggedInUser?: any) => {
    if (isProfileIncomplete) {
      router.replace('/farmer-profile-setup');
      return;
    }
    if (redirect) {
      router.replace(redirect as any);
      return;
    }
    const targetUser = loggedInUser || user;
    const isPartner = ['BUSINESS_PARTNER', 'ADVISOR', 'FARM_ADVISOR', 'GARDEN_ADVISOR', 'TECHNICAL_TRAINER'].includes(
      targetUser?.role || ''
    );
    router.replace(isPartner ? '/(partner)/(tabs)' : '/(user)/(tabs)');
  };

  const [mobile, setMobile] = useState('');
  const [focusedField, setFocusedField] = useState<'mobile' | 'otp' | 'name' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  // New User Role Selection State
  const [isNewUserModal, setIsNewUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [selectedRole, setSelectedRole] = useState<'CUSTOMER' | 'FARMER' | 'GARDENER'>('FARMER');
  const [isCompletingReg, setIsCompletingReg] = useState(false);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  // Google OAuth setup
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'farmsking' });
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_CLIENT_ID,
    clientId: GOOGLE_CLIENT_ID,
    scopes: ['openid', 'profile', 'email'],
    redirectUri,
    responseType: AuthSession.ResponseType.Token,
    prompt: AuthSession.Prompt.SelectAccount,
    usePKCE: false,
  });

  useEffect(() => {
    if (!response) return;
    if (response.type === 'success') {
      const { authentication } = response;
      if (authentication?.accessToken) {
        setGoogleLoading(true);
        fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${authentication.accessToken}` },
        })
          .then((res) => res.json())
          .then(async (userInfo) => {
            if (!userInfo?.email) {
              setError('Google login failed: Email not provided.');
              return;
            }
            const loggedInUser = await googleLogin({
              email: userInfo.email,
              name: userInfo.name || userInfo.given_name || userInfo.email.split('@')[0],
              photoUrl: userInfo.picture,
              googleId: userInfo.sub,
              accessToken: authentication.accessToken,
            });
            handleSuccessNavigation(loggedInUser.isProfileIncomplete, loggedInUser.user);
          })
          .catch((err) => {
            setError(err?.response?.data?.message ?? err?.message ?? 'Google Sign-In failed.');
          })
          .finally(() => setGoogleLoading(false));
      }
    } else if (response.type === 'error') {
      setError('Google Sign-In error: ' + (response.error?.message || 'Please retry.'));
    }
  }, [response]);

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      if (Platform.OS === 'web') {
        setGoogleLoading(true);
        try {
          const provider = new GoogleAuthProvider();
          provider.setCustomParameters({ prompt: 'select_account' });
          const cred = await signInWithPopup(auth, provider);
          const idToken = await cred.user.getIdToken();
          const res = await googleLogin({
            idToken,
            email: cred.user.email || undefined,
            name: cred.user.displayName || undefined,
            photoUrl: cred.user.photoURL || undefined,
            googleId: cred.user.uid,
          });
          handleSuccessNavigation(res.isProfileIncomplete, res.user);
        } catch (fbErr: any) {
          if (fbErr?.code === 'auth/popup-closed-by-user') {
            setGoogleLoading(false);
            return;
          }
          if (request) {
            await promptAsync();
          } else {
            setError('Google Sign-In error: ' + (fbErr?.message || 'Please retry.'));
          }
        } finally {
          setGoogleLoading(false);
        }
      } else {
        if (request) {
          await promptAsync();
        } else {
          setError('Google Sign-In is initializing. Please tap again.');
        }
      }
    } catch (err: any) {
      setError('Google Sign-In failed: ' + (err?.message || 'Please retry.'));
      setGoogleLoading(false);
    }
  };

  // Step 1: Request Mobile OTP
  const handleSendOtp = async () => {
    setError(null);
    const cleanNum = mobile.trim().replace(/\D/g, '').slice(-10);
    if (!cleanNum || cleanNum.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setOtpSending(true);
    try {
      const res = await sendLoginOtp(cleanNum);
      setOtpSent(true);
      setResendTimer(60);
      if (res?.devOtp) {
        setDevOtp(res.devOtp);
      } else if (isLocalhost) {
        setDevOtp('123456');
      }
      setTimeout(() => otpInputRef.current?.focus(), 300);
    } catch (err: any) {
      console.warn('[sendLoginOtp error]:', err);
      if (isLocalhost) {
        // Fallback gracefully on localhost so developer is never blocked
        setOtpSent(true);
        setDevOtp('123456');
        setResendTimer(60);
      } else {
        const isNet = err?.message?.includes('Network Error') || err?.code === 'ERR_NETWORK';
        setError(
          isNet
            ? 'Network error! Please check your internet connection.'
            : err?.response?.data?.message ?? err?.message ?? 'Failed to send OTP. Please try again.'
        );
      }
    } finally {
      setOtpSending(false);
    }
  };

  // Step 2: Verify Mobile OTP
  const handleOtpLogin = async () => {
    setError(null);
    const cleanCode = otpCode.trim();
    if (!cleanCode || cleanCode.length < 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    const cleanNum = mobile.trim().replace(/\D/g, '').slice(-10);
    setIsSubmitting(true);
    try {
      const res = await otpLogin({ mobile: cleanNum, otp: cleanCode });
      if (res?.isNewUser) {
        // New user! Present role selection
        setIsNewUserModal(true);
      } else {
        // Existing user -> route to their role dashboard
        handleSuccessNavigation(false, res);
      }
    } catch (err: any) {
      const isNet = err?.message?.includes('Network Error') || err?.code === 'ERR_NETWORK';
      setError(
        isNet
          ? 'Network error! Please check your internet connection.'
          : err?.response?.data?.message ?? err?.message ?? 'Verification failed. Please check code.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3: Complete Role Selection for New Users
  const handleCompleteRegistration = async () => {
    setError(null);
    const cleanNum = mobile.trim().replace(/\D/g, '').slice(-10);
    setIsCompletingReg(true);
    try {
      const loggedInUser = await completeOtpRegistration({
        mobile: cleanNum,
        name: newUserName.trim() || undefined,
        role: selectedRole,
      });
      setIsNewUserModal(false);
      handleSuccessNavigation(false, loggedInUser);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Registration failed. Please try again.');
    } finally {
      setIsCompletingReg(false);
    }
  };

  const autoFillDevOtp = () => {
    const codeToFill = devOtp || '123456';
    setOtpCode(codeToFill);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Ambient Breathing Laser Glow Orbs */}
      <View style={styles.glowOrbTopLeft} pointerEvents="none" />
      <View style={styles.glowOrbBottomRight} pointerEvents="none" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cardWrapper}>
          
          {/* Super-Premium Executive Glassmorphic Card */}
          <View style={[styles.card, premiumShadow('#10b981', 'lg')]}>
            
            {/* Brand Header */}
            <View style={styles.brandRow}>
              <BrandLogo size={46} useHdQuality round useGoldRing />
              <View style={{ marginLeft: 14, flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.brandTitle}>FarmsKing</Text>
                  <View style={styles.laserBadge}>
                    <Text style={styles.laserBadgeText}>ISO 27001 SECURE</Text>
                  </View>
                </View>
                <Text style={styles.brandTagline}>Smart Farming</Text>
              </View>
            </View>

            <View style={styles.headingBox}>
              <Text style={styles.title}>Instant Mobile Sign In</Text>
              <Text style={styles.subtitle}>
                Zero passwords required. Enter your 10-digit mobile number for verified access.
              </Text>
            </View>

            {/* Mobile Input Section */}
            <Text style={styles.label}>Mobile Number</Text>
            <View style={[styles.inputWrap, focusedField === 'mobile' && styles.inputWrapFocused]}>
              <View style={styles.countryCodeBox}>
                <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
              </View>
              <TextInput
                style={styles.input}
                keyboardType="phone-pad"
                maxLength={10}
                placeholder="10-digit mobile number"
                placeholderTextColor="#64748b"
                value={mobile}
                onChangeText={(t) => {
                  setMobile(t);
                  if (otpSent) {
                    setOtpSent(false);
                    setOtpCode('');
                    setDevOtp(null);
                  }
                }}
                onFocus={() => setFocusedField('mobile')}
                onBlur={() => setFocusedField(null)}
                returnKeyType="done"
                editable={!otpSent}
                autoCapitalize="none"
              />
              {otpSent && (
                <TouchableOpacity
                  onPress={() => {
                    setOtpSent(false);
                    setOtpCode('');
                    setDevOtp(null);
                  }}
                  style={styles.editPencilBtn}
                  activeOpacity={0.8}
                >
                  <Ionicons name="pencil" size={14} color="#10b981" />
                  <Text style={styles.editText}>Change</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* OTP Flow */}
            {!otpSent ? (
              <TouchableOpacity
                onPress={handleSendOtp}
                disabled={otpSending || mobile.trim().length < 10}
                activeOpacity={0.88}
                style={[styles.primaryActionBtn, (mobile.trim().length < 10 || otpSending) && { opacity: 0.55 }]}
              >
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientBtn}
                >
                  {otpSending ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons name="paper-plane" size={16} color="#fff" />
                      <Text style={styles.buttonText}>Get Verification Code</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <>
                <View style={styles.otpSentBanner}>
                  <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                  <Text style={styles.otpSentMsg}>Code dispatched to +91 {mobile.slice(-10)}</Text>
                </View>

                {/* Localhost Development Helper Banner (Only visible on localhost / dev mode) */}
                {isLocalhost && (
                  <View style={styles.devOtpContainer}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.devOtpHeader}>💻 Localhost Testing Mode</Text>
                      <Text style={styles.devOtpSub}>
                        Test Code: <Text style={{ fontFamily: FONT.bold, color: '#34d399' }}>{devOtp || '123456'}</Text>
                      </Text>
                    </View>
                    <TouchableOpacity style={styles.autoFillBtn} onPress={autoFillDevOtp} activeOpacity={0.85}>
                      <Text style={styles.autoFillBtnText}>Auto-Fill Code</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <Text style={[styles.label, { marginTop: 14 }]}>6-Digit Verification Code</Text>
                <View style={[styles.inputWrap, focusedField === 'otp' && styles.inputWrapFocused]}>
                  <Ionicons
                    name="keypad-outline"
                    size={18}
                    color={focusedField === 'otp' ? '#10b981' : '#94a3b8'}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    ref={otpInputRef}
                    style={[
                      styles.input,
                      { letterSpacing: 8, fontSize: 20, fontFamily: FONT.extraBold, textAlign: 'center' },
                    ]}
                    keyboardType="number-pad"
                    maxLength={6}
                    placeholder="● ● ● ● ● ●"
                    placeholderTextColor="#475569"
                    value={otpCode}
                    onChangeText={setOtpCode}
                    onFocus={() => setFocusedField('otp')}
                    onBlur={() => setFocusedField(null)}
                    returnKeyType="done"
                    onSubmitEditing={handleOtpLogin}
                  />
                </View>

                {/* Resend Row */}
                <View style={styles.resendRow}>
                  {resendTimer > 0 ? (
                    <Text style={styles.resendTimer}>Resend available in {resendTimer}s</Text>
                  ) : (
                    <TouchableOpacity onPress={handleSendOtp} disabled={otpSending}>
                      <Text style={styles.resendLink}>🔄 Resend Code</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Submit OTP */}
                <TouchableOpacity
                  onPress={handleOtpLogin}
                  disabled={isSubmitting || otpCode.trim().length < 6}
                  activeOpacity={0.88}
                  style={[styles.primaryActionBtn, (isSubmitting || otpCode.trim().length < 6) && { opacity: 0.6 }]}
                >
                  <LinearGradient
                    colors={['#10b981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientBtn}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={styles.buttonText}>Verify & Enter Dashboard</Text>
                        <Ionicons name="arrow-forward" size={16} color="#fff" />
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}

            {/* Error Banner */}
            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color="#ef4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR SECURE ALTERNATIVE</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Sign-In */}
            <TouchableOpacity
              style={[styles.googleIconBtn, (!request || googleLoading) && styles.googleBtnDisabled]}
              onPress={handleGoogleSignIn}
              disabled={!request || googleLoading || isSubmitting}
              activeOpacity={0.88}
            >
              {googleLoading ? (
                <ActivityIndicator color="#4285F4" size="small" />
              ) : (
                <>
                  <Ionicons name="logo-google" size={18} color="#4285F4" />
                  <Text style={styles.googleText}>Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Statutory Corporate Identity Footer */}
            <View style={styles.statutoryFooter}>
              <Ionicons name="shield-checkmark" size={14} color="#10b981" />
              <Text style={styles.statutoryFooterText}>
                FARMSKING TECHNOLOGIES PRIVATE LIMITED | CIN: U01100PB2026PTC063294
              </Text>
            </View>

          </View>
        </View>
      </ScrollView>

      {/* NEW USER ONBOARDING MODAL: Choose Role (Customer, Farmer, Gardener) */}
      <Modal visible={isNewUserModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, premiumShadow('#10b981', 'lg')]}>
            
            <View style={styles.modalHeader}>
              <View style={styles.modalIconWrap}>
                <Ionicons name="person-add" size={24} color="#10b981" />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.modalTitle}>Welcome to FarmsKing!</Text>
                <Text style={styles.modalSubtitle}>Choose your primary workspace role to personalize your tools</Text>
              </View>
            </View>

            {/* Name Input */}
            <Text style={styles.modalLabel}>Your Full Name (Optional)</Text>
            <View style={[styles.inputWrap, focusedField === 'name' && styles.inputWrapFocused]}>
              <Ionicons name="person-outline" size={17} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. Gurpreet Singh"
                placeholderTextColor="#64748b"
                value={newUserName}
                onChangeText={setNewUserName}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {/* Role Cards Selection */}
            <Text style={[styles.modalLabel, { marginTop: 16 }]}>Select Account Type</Text>

            <View style={styles.roleGrid}>
              
              {/* Farmer Option */}
              <TouchableOpacity
                style={[styles.roleCard, selectedRole === 'FARMER' && styles.roleCardActive]}
                onPress={() => setSelectedRole('FARMER')}
                activeOpacity={0.88}
              >
                <View style={styles.roleCardTop}>
                  <Text style={styles.roleCardIcon}>🌾</Text>
                  {selectedRole === 'FARMER' ? (
                    <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                  ) : (
                    <View style={styles.unselectedCircle} />
                  )}
                </View>
                <Text style={styles.roleCardTitle}>Farmer</Text>
                <Text style={styles.roleCardDesc}>Crops, Mandi rates, AI crop doctor & bahi-khata</Text>
              </TouchableOpacity>

              {/* Gardener Option */}
              <TouchableOpacity
                style={[styles.roleCard, selectedRole === 'GARDENER' && styles.roleCardActive]}
                onPress={() => setSelectedRole('GARDENER')}
                activeOpacity={0.88}
              >
                <View style={styles.roleCardTop}>
                  <Text style={styles.roleCardIcon}>🏡</Text>
                  {selectedRole === 'GARDENER' ? (
                    <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                  ) : (
                    <View style={styles.unselectedCircle} />
                  )}
                </View>
                <Text style={styles.roleCardTitle}>Gardener</Text>
                <Text style={styles.roleCardDesc}>Home plants, pots & terrace gardening</Text>
              </TouchableOpacity>

              {/* Customer Option */}
              <TouchableOpacity
                style={[styles.roleCard, selectedRole === 'CUSTOMER' && styles.roleCardActive]}
                onPress={() => setSelectedRole('CUSTOMER')}
                activeOpacity={0.88}
              >
                <View style={styles.roleCardTop}>
                  <Text style={styles.roleCardIcon}>🛒</Text>
                  {selectedRole === 'CUSTOMER' ? (
                    <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                  ) : (
                    <View style={styles.unselectedCircle} />
                  )}
                </View>
                <Text style={styles.roleCardTitle}>Customer</Text>
                <Text style={styles.roleCardDesc}>Shop inputs, direct farm produce & orders</Text>
              </TouchableOpacity>

            </View>

            <View style={styles.roleNoticeBox}>
              <Ionicons name="information-circle" size={16} color="#38bdf8" />
              <Text style={styles.roleNoticeText}>
                Customer shopping access is automatically included with every role.
              </Text>
            </View>

            {/* Complete Button */}
            <TouchableOpacity
              onPress={handleCompleteRegistration}
              disabled={isCompletingReg}
              activeOpacity={0.88}
              style={[styles.primaryActionBtn, { marginTop: 18 }]}
            >
              <LinearGradient
                colors={['#10b981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientBtn}
              >
                {isCompletingReg ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.buttonText}>Complete & Enter My Dashboard</Text>
                    <Ionicons name="arrow-forward" size={16} color="#fff" />
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090e17',
    position: 'relative',
  },
  glowOrbTopLeft: {
    position: 'absolute',
    top: -120,
    left: -120,
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    filter: 'blur(90px)',
  },
  glowOrbBottomRight: {
    position: 'absolute',
    bottom: -120,
    right: -120,
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    filter: 'blur(100px)',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    minHeight: '100%',
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 460,
  },
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderRadius: RADIUS.xl,
    padding: 32,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.28)',
    backdropFilter: 'blur(16px)',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  brandTitle: {
    fontSize: 22,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  laserBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.45)',
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: RADIUS.sm,
  },
  laserBadgeText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#34d399',
    letterSpacing: 0.5,
  },
  brandTagline: {
    fontSize: 12.5,
    fontFamily: FONT.semiBold,
    color: '#10b981',
    letterSpacing: 0.4,
    marginTop: 2,
  },
  headingBox: {
    marginBottom: 22,
  },
  title: {
    fontSize: 22,
    fontFamily: FONT.bold,
    color: '#ffffff',
    letterSpacing: 0.2,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: FONT.regular,
    color: '#94a3b8',
    lineHeight: 19,
  },
  label: {
    fontSize: 12,
    fontFamily: FONT.semiBold,
    color: '#cbd5e1',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14,
    height: 52,
    transition: 'all 0.2s ease',
  },
  inputWrapFocused: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    boxShadow: '0 0 15px rgba(16, 185, 129, 0.2)',
  },
  countryCodeBox: {
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.14)',
    marginRight: 12,
  },
  countryCodeText: {
    fontSize: 14,
    fontFamily: FONT.bold,
    color: '#f8fafc',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 15,
    fontFamily: FONT.medium,
    outlineStyle: 'none',
  },
  editPencilBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: RADIUS.sm,
  },
  editText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#10b981',
  },
  primaryActionBtn: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginTop: 18,
    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)',
  },
  gradientBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14.5,
    fontFamily: FONT.bold,
    letterSpacing: 0.3,
  },
  otpSentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderColor: 'rgba(16,185,129,0.35)',
    borderWidth: 1,
    padding: 12,
    borderRadius: RADIUS.md,
    marginTop: 14,
  },
  otpSentMsg: {
    color: '#34d399',
    fontSize: 13,
    fontFamily: FONT.medium,
  },
  devOtpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#064e3b',
    borderWidth: 1.5,
    borderColor: '#059669',
    borderRadius: RADIUS.md,
    padding: 12,
    marginTop: 12,
  },
  devOtpHeader: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#a7f3d0',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  devOtpSub: {
    fontSize: 12.5,
    fontFamily: FONT.medium,
    color: '#ffffff',
    marginTop: 3,
  },
  autoFillBtn: {
    backgroundColor: '#10b981',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: RADIUS.sm,
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  },
  autoFillBtnText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#064e3b',
  },
  resendRow: {
    alignItems: 'flex-end',
    marginTop: 10,
  },
  resendTimer: {
    fontSize: 12,
    fontFamily: FONT.regular,
    color: '#64748b',
  },
  resendLink: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#10b981',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderColor: 'rgba(239,68,68,0.35)',
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: 12,
    marginTop: 14,
    gap: 8,
  },
  errorText: {
    color: '#f87171',
    fontSize: 12.5,
    fontFamily: FONT.medium,
    flex: 1,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerText: {
    color: '#64748b',
    fontSize: 10,
    fontFamily: FONT.bold,
    letterSpacing: 0.8,
    marginHorizontal: 12,
  },
  googleIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    paddingVertical: 13,
    gap: 10,
    boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
  },
  googleBtnDisabled: {
    opacity: 0.6,
  },
  googleText: {
    fontSize: 14,
    fontFamily: FONT.bold,
    color: '#1e293b',
  },
  statutoryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  statutoryFooterText: {
    fontSize: 9.5,
    fontFamily: FONT.medium,
    color: '#64748b',
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backdropFilter: 'blur(8px)',
  },
  modalCard: {
    backgroundColor: '#0f172a',
    borderRadius: RADIUS.xl,
    padding: 28,
    width: '100%',
    maxWidth: 480,
    borderWidth: 1.5,
    borderColor: 'rgba(16,185,129,0.3)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  modalIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(16,185,129,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 19,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  modalSubtitle: {
    fontSize: 12,
    fontFamily: FONT.regular,
    color: '#94a3b8',
    marginTop: 2,
    lineHeight: 17,
  },
  modalLabel: {
    fontSize: 12,
    fontFamily: FONT.semiBold,
    color: '#cbd5e1',
    marginBottom: 6,
  },
  roleGrid: {
    gap: 10,
    marginTop: 4,
  },
  roleCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: RADIUS.lg,
    padding: 14,
    transition: 'all 0.2s ease',
  },
  roleCardActive: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16,185,129,0.1)',
    boxShadow: '0 0 15px rgba(16,185,129,0.2)',
  },
  roleCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  roleCardIcon: {
    fontSize: 22,
  },
  unselectedCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  roleCardTitle: {
    fontSize: 14.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  roleCardDesc: {
    fontSize: 12,
    fontFamily: FONT.regular,
    color: '#94a3b8',
    marginTop: 2,
  },
  roleNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(2,132,199,0.1)',
    borderColor: 'rgba(2,132,199,0.25)',
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: 10,
    marginTop: 14,
  },
  roleNoticeText: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#38bdf8',
    flex: 1,
  },
});
