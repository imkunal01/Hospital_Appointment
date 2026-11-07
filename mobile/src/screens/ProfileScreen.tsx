import React from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useSession } from '../auth/sessionStore.js';
import { getRefreshToken } from '../auth/secureStorage.js';
import { logoutApi } from '../api/endpoints.js';
import { Button } from '../components/Button.js';
import { colors } from '../theme/colors.js';
import { spacing, borderRadius } from '../theme/spacing.js';

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
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name
                ? user.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                : 'PT'}
            </Text>
          </View>

          <Text style={styles.name}>{user?.name || 'Patient'}</Text>
          <Text style={styles.email}>{user?.email || 'patient@example.test'}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user?.role || 'PATIENT'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Patient ID</Text>
            <Text style={styles.infoValue}>{user?.id?.slice(0, 8)}...</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Session Security</Text>
            <Text style={styles.infoValue}>Android Keystore Protected</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Data Policy</Text>
            <Text style={styles.infoValue}>Synthetic Assessment Profile</Text>
          </View>
        </View>

        {/* Reminder Preferences Shortcut Button */}
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Open reminder notification preferences"
          style={styles.settingsCard}
          onPress={() => navigation.navigate('Preferences')}
        >
          <View style={styles.settingsIconCircle}>
            <Text style={styles.settingsIcon}>🔔</Text>
          </View>
          <View style={styles.settingsTextContainer}>
            <Text style={styles.settingsTitle}>Reminder Preferences</Text>
            <Text style={styles.settingsSubtitle}>Configure advance appointment notifications</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: spacing.md
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primaryDark
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary
  },
  email: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2
  },
  roleBadge: {
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.successText
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
    width: '100%',
    paddingVertical: spacing.xs
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textSecondary
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary
  },
  settingsCard: {
    minHeight: spacing.minTouchTarget, // 48dp minimum
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1
  },
  settingsIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md
  },
  settingsIcon: {
    fontSize: 18
  },
  settingsTextContainer: {
    flex: 1
  },
  settingsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary
  },
  settingsSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1
  },
  chevron: {
    fontSize: 22,
    color: colors.textMuted,
    fontWeight: '300',
    marginLeft: spacing.sm
  },
  logoutButton: {
    marginBottom: spacing.md
  }
});
