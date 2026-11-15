import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather, Ionicons } from '@expo/vector-icons';
import { ClinicalProgressBar } from './ClinicalProgressBar';
import { colors } from '../theme/colors';
import { useSafeInsets } from '../hooks/useSafeInsets';

interface AppLaunchScreenProps {
  onReady?: () => void;
  isBackendReady?: boolean;
}

export const AppLaunchScreen: React.FC<AppLaunchScreenProps> = ({
  onReady,
  isBackendReady = false
}) => {
  const insets = useSafeInsets();
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (isBackendReady) {
      setCompleted(true);
    }
  }, [isBackendReady]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Top Decorative Background Wave */}
      <View style={[styles.heroHeader, { paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 24 : 16) + 20 }]}>
        <View style={styles.heroCircleLarge} />
        <View style={styles.heroCircleSmall} />

        {/* Stethoscope Watermark Asset */}
        <Image
          source={require('../../assets/stethoscope.png')}
          style={styles.stethoscopeAsset}
          resizeMode="contain"
          accessibilityLabel="Medibook Clinical Stethoscope"
        />

        {/* Brand Logo Row */}
        <View style={styles.brandRow}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.brandLogoImg}
            resizeMode="contain"
            accessibilityLabel="MediBook Logo"
          />
          <Text style={styles.brandTitle}>medibook</Text>
        </View>

        {/* Clinical Subtitle Pill */}
        <View style={styles.badgePill}>
          <Ionicons name="shield-checkmark" size={13} color="#1D4ED8" />
          <Text style={styles.badgePillText}>Enterprise Healthcare Portal</Text>
        </View>
      </View>

      {/* Center Interactive Progress Card */}
      <View style={styles.contentWrapper}>
        <ClinicalProgressBar
          active={!completed}
          completed={completed}
          onComplete={onReady}
          title="Connecting to Clinical Care Network"
          variant="card"
          style={styles.progressCard}
        />

        {/* Verified Hospital Security Badges */}
        <View style={styles.securityMetaRow}>
          <View style={styles.securityMetaItem}>
            <Ionicons name="lock-closed-outline" size={14} color="#64748B" style={{ marginRight: 4 }} />
            <Text style={styles.securityMetaText}>256-Bit SSL</Text>
          </View>
          <Text style={styles.metaDivider}>•</Text>
          <View style={styles.securityMetaItem}>
            <Ionicons name="checkmark-circle-outline" size={14} color="#64748B" style={{ marginRight: 4 }} />
            <Text style={styles.securityMetaText}>NABH Verified</Text>
          </View>
          <Text style={styles.metaDivider}>•</Text>
          <View style={styles.securityMetaItem}>
            <Ionicons name="pulse-outline" size={14} color="#64748B" style={{ marginRight: 4 }} />
            <Text style={styles.securityMetaText}>Live Triage</Text>
          </View>
        </View>
      </View>

      {/* Bottom Footer Accreditation */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
        <Text style={styles.footerHospitalName}>Hospital & Clinical Appointment System</Text>
        <Text style={styles.footerSub}>Authorized Patient Access Only</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  heroHeader: {
    backgroundColor: '#EBF4FE',
    borderBottomWidth: 1.5,
    borderBottomColor: '#DBEAFE',
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden'
  },
  heroCircleLarge: {
    position: 'absolute',
    top: -50,
    right: -40,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#DBEAFE',
    opacity: 0.6
  },
  heroCircleSmall: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#BFDBFE',
    opacity: 0.4
  },
  stethoscopeAsset: {
    position: 'absolute',
    top: 16,
    right: 4,
    width: 140,
    height: 140,
    opacity: 0.95
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  brandLogoImg: {
    width: 44,
    height: 44,
    marginRight: 10
  },
  logoPlusCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brandBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    shadowColor: colors.brandBlue,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3
  },
  brandTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#0A2540',
    letterSpacing: -0.8
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE'
  },
  badgePillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1D4ED8',
    marginLeft: 5
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginTop: -20
  },
  progressCard: {
    marginBottom: 20
  },
  securityMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  securityMetaItem: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  securityMetaText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B'
  },
  metaDivider: {
    fontSize: 12,
    color: '#CBD5E1'
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 20
  },
  footerHospitalName: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0A2540',
    textAlign: 'center'
  },
  footerSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 2
  }
});
