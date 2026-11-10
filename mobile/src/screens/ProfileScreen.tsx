import React from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSession } from '../auth/sessionStore';
import { getRefreshToken } from '../auth/secureStorage';
import { logoutApi } from '../api/endpoints';
import { Button } from '../components/Button';
import { colors } from '../theme/colors';
import { spacing, borderRadius } from '../theme/spacing';

interface ProfileScreenProps {
  navigation: any;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user, clearSession } = useSession();

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of the hospital portal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await getRefreshToken();
            if (token) {
              await logoutApi(token);
            }
          } catch {
            // Even if network fails, always clear local session
          } finally {
            await clearSession();
          }
        }
      }
    ]);
  };

  return (
    <View style={styles.container}>
      <View>
        {/* Patient Clinical Profile ID Card */}
        <View style={styles.card}>
          <View style={styles.avatarWrapper}>
            <LinearGradient
              colors={[colors.gradientStart, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>
                {user?.name
                  ? user.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                  : 'PT'}
              </Text>
            </LinearGradient>
            <View style={styles.shieldBadge}>
              <MaterialCommunityIcons name="shield-check" size={16} color="#10B981" />
            </View>
          </View>

          <Text style={styles.name}>{user?.name || 'Patient'}</Text>
          <Text style={styles.email}>{user?.email || 'patient@example.test'}</Text>

          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user?.role || 'PATIENT'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoLabelWrap}>
              <Feather name="hash" size={14} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={styles.infoLabel}>Patient ID</Text>
            </View>
            <Text style={styles.infoValue}>{user?.id?.slice(0, 8)}...</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoLabelWrap}>
              <MaterialCommunityIcons name="lock-outline" size={14} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={styles.infoLabel}>Session Security</Text>
            </View>
            <Text style={styles.infoValue}>Android Keystore Protected</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoLabelWrap}>
              <Feather name="shield" size={14} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={styles.infoLabel}>Data Policy</Text>
            </View>
            <Text style={styles.infoValue}>Synthetic Assessment Profile</Text>
          </View>
        </View>

        {/* Reminder Preferences Shortcut Button */}
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Open reminder notification preferences"
          style={styles.settingsCard}
          onPress={() => navigation.navigate('Preferences')}
          activeOpacity={0.8}
        >
          <View style={styles.settingsIconCircle}>
            <Ionicons name="notifications-outline" size={20} color={colors.primary} />
          </View>
          <View style={styles.settingsTextContainer}>
            <Text style={styles.settingsTitle}>Reminder Preferences</Text>
            <Text style={styles.settingsSubtitle}>Configure advance appointment notifications</Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <Button
        title="Sign Out"
        onPress={handleLogout}
        variant="danger"
        accessibilityLabel="Sign out of your account"
        style={styles.logoutButton}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    paddingBottom: 90, // Safe clearance for floating pill nav
    justifyContent: 'space-between'
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: spacing.md
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: spacing.sm
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  shieldBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    elevation: 3
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3
  },
  email: {
    fontSize: 13.5,
    color: colors.textSecondary,
    marginTop: 2
  },
  roleBadge: {
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.success + '40'
  },
  roleText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.successText,
    letterSpacing: 0.6
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    width: '100%',
    marginVertical: spacing.md
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: spacing.xs + 3
  },
  infoLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textSecondary
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary
  },
  settingsCard: {
    minHeight: spacing.minTouchTarget,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2
  },
  settingsIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14
  },
  settingsTextContainer: {
    flex: 1
  },
  settingsTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: colors.textPrimary
  },
  settingsSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2
  },
  logoutButton: {
    marginBottom: spacing.md,
    height: 52,
    borderRadius: borderRadius.md
  }
});
