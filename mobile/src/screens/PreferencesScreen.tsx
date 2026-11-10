import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { usePreferences, useUpdatePreferences } from '../hooks/usePreferences';
import { useNetwork } from '../hooks/useNetwork';
import { ScreenState } from '../components/ScreenState';
import { Button } from '../components/Button';
import { extractErrorMessage } from '../utils/errors';
import { colors } from '../theme/colors';
import { spacing, borderRadius } from '../theme/spacing';

const HOUR_OPTIONS = [6, 12, 24, 48];

export const PreferencesScreen: React.FC = () => {
  const { data: preferences, isLoading, isError, error, refetch } = usePreferences();
  const updateMutation = useUpdatePreferences();
  const { isOffline } = useNetwork();

  const [enabled, setEnabled] = useState<boolean>(true);
  const [hoursBefore, setHoursBefore] = useState<number>(24);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (preferences) {
      setEnabled(preferences.enabled);
      setHoursBefore(preferences.hoursBefore);
    }
  }, [preferences]);

  const handleSave = () => {
    if (isOffline) {
      Alert.alert('Offline', 'Cannot save preferences while offline. Please reconnect.');
      return;
    }

    setSaveSuccess(false);
    updateMutation.mutate(
      { enabled, hoursBefore },
      {
        onSuccess: () => {
          setSaveSuccess(true);
          Alert.alert('Saved', 'Your reminder preferences have been updated on the server.');
        },
        onError: (err) => {
          Alert.alert('Error', extractErrorMessage(err));
        }
      }
    );
  };

  return (
    <View style={styles.container}>
      <ScreenState
        loading={isLoading}
        loadingMessage="Loading your notification settings..."
        error={isError ? extractErrorMessage(error) : null}
        onRetry={refetch}
      >
        <View style={styles.content}>
          <Text style={styles.heading}>Appointment Reminders</Text>
          <Text style={styles.subheading}>
            Configure automated reminder alerts prior to your hospital visits.
          </Text>

          {isOffline && (
            <View style={styles.offlineWarning}>
              <Feather name="wifi-off" size={16} color={colors.errorText} style={{ marginRight: 8 }} />
              <Text style={styles.offlineWarningText}>
                You are offline. Changes cannot be saved until reconnected.
              </Text>
            </View>
          )}

          {/* Toggle Switch Card */}
          <View style={styles.settingCard}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Enable Visit Reminders</Text>
              <Text style={styles.settingDescription}>
                Receive simulated advance notification alerts before upcoming appointments.
              </Text>
            </View>
            <Switch
              accessibilityRole="switch"
              accessibilityLabel="Enable visit reminders"
              value={enabled}
              onValueChange={setEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>

          {/* Hours Selector */}
          {enabled && (
            <View style={styles.hoursCard}>
              <Text style={styles.hoursTitle}>Remind Me Prior To Consultation</Text>
              <Text style={styles.hoursDescription}>
                Select how many hours in advance you would like to be alerted:
              </Text>

              <View style={styles.chipRow}>
                {HOUR_OPTIONS.map((hours) => {
                  const isSelected = hoursBefore === hours;

                  return (
                    <TouchableOpacity
                      key={hours}
                      accessibilityRole="button"
                      accessibilityLabel={`${hours} hours before`}
                      style={[
                        styles.chip,
                        isSelected && styles.chipSelected
                      ]}
                      onPress={() => setHoursBefore(hours)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isSelected && styles.chipTextSelected
                        ]}
                      >
                        {hours}h Before
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Clinical Simulation Notice (Zero Emojis) */}
          <View style={styles.noticeBox}>
            <View style={styles.noticeIconCircle}>
              <Feather name="info" size={16} color={colors.primary} />
            </View>
            <Text style={styles.noticeText}>
              Preferences are saved directly to your patient profile in the PostgreSQL database. Push delivery is simulated in accordance with the assessment brief.
            </Text>
          </View>

          <Button
            title={updateMutation.isPending ? 'Saving...' : 'Save Preferences'}
            onPress={handleSave}
            disabled={isOffline || updateMutation.isPending}
            loading={updateMutation.isPending}
            accessibilityLabel="Save reminder preferences to server"
            style={styles.saveButton}
          />
        </View>
      </ScreenState>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    padding: spacing.lg
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3
  },
  subheading: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.lg
  },
  offlineWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.error + '40',
    marginBottom: spacing.md
  },
  offlineWarningText: {
    flex: 1,
    fontSize: 13,
    color: colors.errorText,
    fontWeight: '600'
  },
  settingCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
    marginBottom: spacing.md
  },
  settingTextContainer: {
    flex: 1,
    paddingRight: spacing.md
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary
  },
  settingDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 18
  },
  hoursCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
    marginBottom: spacing.md
  },
  hoursTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary
  },
  hoursDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.md
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  chip: {
    minHeight: spacing.minTouchTarget,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center'
  },
  chipSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary
  },
  chipTextSelected: {
    color: colors.primaryDark,
    fontWeight: '800'
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.xl
  },
  noticeIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    marginTop: 1
  },
  noticeText: {
    flex: 1,
    fontSize: 12.5,
    color: colors.textSecondary,
    lineHeight: 18
  },
  saveButton: {
    width: '100%',
    height: 52,
    borderRadius: borderRadius.md
  }
});
