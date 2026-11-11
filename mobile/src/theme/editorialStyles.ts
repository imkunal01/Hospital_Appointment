import { StyleSheet, Platform } from 'react-native';
import { colors } from './colors';

export const editorialStyles = StyleSheet.create({
  // Tactile Outlined Cards with Hard Offset Shadows
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 20,
    shadowColor: colors.ink,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4
  },
  cardChartreuse: {
    backgroundColor: colors.chartreuse,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 20,
    shadowColor: colors.ink,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4
  },
  cardLilac: {
    backgroundColor: colors.lilac,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 20,
    shadowColor: colors.ink,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4
  },
  cardSky: {
    backgroundColor: colors.sky,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 20,
    shadowColor: colors.ink,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4
  },
  cardPeach: {
    backgroundColor: colors.peach,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 20,
    shadowColor: colors.ink,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4
  },
  cardPink: {
    backgroundColor: colors.pink,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 20,
    shadowColor: colors.ink,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4
  },

  // Primary Editorial Button (Deep ink-green with coral tactile shadow)
  buttonPrimary: {
    backgroundColor: colors.foundation,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 18,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    shadowColor: colors.coral,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4
  },

  // Tactile Icon Button (Back Button, Search, Notifications)
  iconButton: {
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

  // Pills and Badges
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.ink
  },
  statusConfirmedPill: {
    backgroundColor: colors.chartreuse,
    borderWidth: 1.5,
    borderColor: colors.ink,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center'
  },

  // Progress Stepper Bar
  stepperTrack: {
    height: 8,
    backgroundColor: '#E4DFD5',
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.ink,
    overflow: 'hidden'
  },
  stepperFill: {
    height: '100%',
    backgroundColor: colors.chartreuse,
    borderRadius: 2
  },

  // Editorial Typography
  displayTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.ink,
    letterSpacing: -0.6
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.inkMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase'
  }
});

