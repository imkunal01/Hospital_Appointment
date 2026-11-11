import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, Platform, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { usePreferences, useUpdatePreferences } from '../hooks/usePreferences';
import { useNetwork } from '../hooks/useNetwork';
import { ScreenState } from '../components/ScreenState';
import { Button } from '../components/Button';
import { extractErrorMessage } from '../utils/errors';
import { colors } from '../theme/colors';
import { useSafeInsets } from '../hooks/useSafeInsets';

const HOUR_OPTIONS = [6, 12, 24, 48];

export const PreferencesScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const insets = useSafeInsets();
  const { data: preferences, isLoading, isError, error, refetch } = usePreferences();
  const updateMutation = useUpdatePreferences();
  const { isOffline } = useNetwork();

  const [enabled, setEnabled] = useState<boolean>(true);
  const [hoursBefore, setHoursBefore] = useState<number>(24);

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

    updateMutation.mutate(
      { enabled, hoursBefore },
      {
        onSuccess: () => {
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
      <StatusBar style="dark" />

      {/* Top Editorial Bar */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 20 : 16) + 6 }]}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.backButton}
          onPress={() => (navigation ? navigation.goBack() : null)}
          activeOpacity={0.8}
        >
          <Feather name="arrow-left" size={22} color={colors.ink} />
        </TouchableOpacity>

        <Text style={styles.topBarTitle}>Notification Settings</Text>

        <View style={{ width: 44 }} />
      </View>

      <ScreenState
        loading={isLoading}
        loadingMessage="Loading your notification settings..."
        error={isError ? extractErrorMessage(error) : null}
        onRetry={refetch}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.heading}>Appointment Reminders</Text>
          <Text style={styles.subheading}>
            Configure how and when the hospital automated dispatch delivers visit alerts.
          </Text>

          {/* Setting Card */}
          <View style={styles.card}>
            <View style={styles.switchRow}>
              <View style={styles.iconCircle}>
                <Feather name="bell" size={20} color={colors.ink} />
              </View>
              <View style={styles.switchTextCol}>
                <Text style={styles.switchLabel}>Enable Visit Reminders</Text>
                <Text style={styles.switchHelp}>
                  Deliver automatic notification before consultation
                </Text>
              </View>
              <Switch
                value={enabled}
                onValueChange={setEnabled}
                trackColor={{ false: '#E2DDD2', true: colors.chartreuse }}
                thumbColor={enabled ? colors.foundation : '#FFFFFF'}
                ios_backgroundColor="#E2DDD2"
              />
            </View>

            {enabled && (
              <>
                <View style={styles.divider} />
                <Text style={styles.leadLabel}>REMIND ME IN ADVANCE</Text>
                <View style={styles.hoursRow}>
                  {HOUR_OPTIONS.map((h) => {
                    const isSelected = hoursBefore === h;
                    return (
                      <TouchableOpacity
                        key={h}
                        accessibilityRole="button"
                        accessibilityLabel={`${h} hours before appointment`}
                        style={[styles.hourPill, isSelected && styles.hourPillSelected]}
                        onPress={() => setHoursBefore(h)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.hourText, isSelected && styles.hourTextSelected]}>
                          {h >= 24 ? `${h / 24}d before` : `${h}h before`}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}
          </View>

          {isOffline && (
            <View style={styles.offlineBox}>
              <Feather name="wifi-off" size={16} color={colors.ink} style={{ marginRight: 8 }} />
              <Text style={styles.offlineText}>
                You are currently offline. Changes cannot be saved until you reconnect.
              </Text>
            </View>
          )}

          <Button
            title={updateMutation.isPending ? 'Saving...' : 'Save Preferences'}
            onPress={handleSave}
            disabled={isOffline || updateMutation.isPending}
            loading={updateMutation.isPending}
            style={styles.saveBtn}
          />
        </ScrollView>
      </ScreenState>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 12
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.ink,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.ink,
    letterSpacing: -0.3
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 64
  },
  heading: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.ink,
    letterSpacing: -0.5
  },
  subheading: {
    fontSize: 13,
    color: colors.inkMuted,
    marginTop: 4,
    marginBottom: 20,
    lineHeight: 18
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 22,
    padding: 18,
    shadowColor: colors.ink,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
    marginBottom: 20
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.lilacLight,
    borderWidth: 1.5,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14
  },
  switchTextCol: {
    flex: 1,
    marginRight: 10
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.ink
  },
  switchHelp: {
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: 2
  },
  divider: {
    height: 1.5,
    backgroundColor: '#EAE6DC',
    marginVertical: 18
  },
  leadLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.inkMuted,
    letterSpacing: 1.2,
    marginBottom: 10
  },
  hoursRow: {
    flexDirection: 'row',
    gap: 8
  },
  hourPill: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.canvas,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.ink,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2
  },
  hourPillSelected: {
    backgroundColor: colors.chartreuse
  },
  hourText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.ink
  },
  hourTextSelected: {
    color: colors.ink,
    fontWeight: '900'
  },
  offlineBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.peach,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 14,
    padding: 12,
    marginBottom: 16
  },
  offlineText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.ink
  },
  saveBtn: {
    marginTop: 10
  }
});
