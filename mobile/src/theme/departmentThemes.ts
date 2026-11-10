import { colors } from './colors';

export interface DepartmentVisualTheme {
  iconName: string;
  iconFamily: 'Ionicons' | 'MaterialCommunityIcons' | 'Feather';
  bg: string;
  textColor: string;
}

export function getDepartmentTheme(deptName: string = ''): DepartmentVisualTheme {
  const normalized = deptName.toLowerCase();

  if (normalized.includes('cardio')) {
    return {
      iconName: 'heart-pulse',
      iconFamily: 'MaterialCommunityIcons',
      bg: colors.deptCardiologyBg,
      textColor: colors.deptCardiologyText
    };
  }
  if (normalized.includes('neuro')) {
    return {
      iconName: 'brain',
      iconFamily: 'MaterialCommunityIcons',
      bg: colors.deptNeurologyBg,
      textColor: colors.deptNeurologyText
    };
  }
  if (normalized.includes('derma')) {
    return {
      iconName: 'sparkles-outline',
      iconFamily: 'Ionicons',
      bg: colors.deptDermatologyBg,
      textColor: colors.deptDermatologyText
    };
  }
  if (normalized.includes('pediat') || normalized.includes('child')) {
    return {
      iconName: 'baby-face-outline',
      iconFamily: 'MaterialCommunityIcons',
      bg: colors.deptPediatricsBg,
      textColor: colors.deptPediatricsText
    };
  }
  if (normalized.includes('ortho') || normalized.includes('bone')) {
    return {
      iconName: 'bone',
      iconFamily: 'MaterialCommunityIcons',
      bg: colors.deptOrthopedicsBg,
      textColor: colors.deptOrthopedicsText
    };
  }
  if (normalized.includes('general') || normalized.includes('physician') || normalized.includes('internal')) {
    return {
      iconName: 'stethoscope',
      iconFamily: 'MaterialCommunityIcons',
      bg: colors.deptGeneralBg,
      textColor: colors.deptGeneralText
    };
  }

  // Default Medical Specialty
  return {
    iconName: 'medical-bag',
    iconFamily: 'MaterialCommunityIcons',
    bg: colors.deptDefaultBg,
    textColor: colors.deptDefaultText
  };
}

