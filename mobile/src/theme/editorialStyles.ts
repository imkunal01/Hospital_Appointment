import { StyleSheet, Platform } from 'react-native';
import { colors } from './colors';

export const editorialStyles = StyleSheet.create({
  // Clean Professional Outlined Cards with Refined Depth
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 20,
    shadowColor: colors.tactileShadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3
  },
  cardChartreuse: {
    backgroundColor: colors.brandBlueLight,
    borderWidth: 2,
    borderColor: colors.brandBlue,
    borderRadius: 20,
    shadowColor: colors.brandBlue,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3
  },
  cardLilac: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 20,
    shadowColor: colors.tactileShadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3
  },
  cardSky: {
    backgroundColor: colors.skyLight,
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    borderRadius: 20,
    shadowColor: colors.tactileShadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2
  },
  cardPeach: {
    backgroundColor: colors.peach,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 20,
    shadowColor: colors.tactileShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2
  },
  cardPink: {
    backgroundColor: colors.pink,
    borderWidth: 1.5,
    borderColor: '#FECACA',
    borderRadius: 20,
    shadowColor: colors.coral,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2
  },

  // Primary Clinical Button (Deep Midnight Navy with Crisp Contrast)
  buttonPrimary: {
    backgroundColor: colors.foundation,
    borderRadius: 18,
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    shadowColor: colors.foundation,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.20,
    shadowRadius: 10,
    elevation: 4
  },

  // Clean Icon Button (Back Button, Search, Notifications)
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.tactileShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2
  },

  // Pills and Badges
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.border
  },
  statusConfirmedPill: {
    backgroundColor: colors.successLight,
    borderWidth: 1.5,
    borderColor: colors.success,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center'
  },

  // Progress Stepper Bar
  stepperTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden'
  },
  stepperFill: {
    height: '100%',
    backgroundColor: colors.brandBlue,
    borderRadius: 3
  },

  // Editorial Typography
  displayTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.ink,
    letterSpacing: -0.5
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.inkMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase'
  }
});
