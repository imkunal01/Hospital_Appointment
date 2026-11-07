import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useSession } from '../auth/sessionStore.js';
import { getRefreshToken } from '../auth/secureStorage.js';
import { logoutApi } from '../api/endpoints.js';
import { Button } from '../components/Button.js';
import { colors } from '../theme/colors.js';
import { spacing, borderRadius } from '../theme/spacing.js';

export const ProfileScreen: React.FC = () => {
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
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primaryDark
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary
  },
  email: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2
  },
  roleBadge: {
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginTop: spacing.sm
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
    marginVertical: spacing.lg
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
  logoutButton: {
    marginBottom: spacing.md
  }
});
