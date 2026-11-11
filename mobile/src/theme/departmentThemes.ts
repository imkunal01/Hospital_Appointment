import { colors } from './colors';

export interface DepartmentVisualTheme {
  iconName: string;
  iconFamily: 'Ionicons' | 'MaterialCommunityIcons' | 'Feather';
  bg: string;
  textColor: string;
  borderColor: string;
  subtext: string;
}

export function getDepartmentTheme(deptName: string = ''): DepartmentVisualTheme {
  const normalized = deptName.toLowerCase();

  if (normalized.includes('cardio') || normalized.includes('heart')) {
    return {
      iconName: 'heart',
      iconFamily: 'Ionicons',
      bg: colors.deptCardiologyBg,
      textColor: colors.deptCardiologyText,
      borderColor: '#FECACA',
      subtext: 'Heart and circulation'
    };
  }
  if (normalized.includes('respir') || normalized.includes('pulmon') || normalized.includes('lung')) {
    return {
      iconName: 'lungs',
      iconFamily: 'MaterialCommunityIcons',
      bg: '#F0FDFA',
      textColor: '#0F766E',
      borderColor: '#99F6E4',
      subtext: 'Lungs and breathing'
    };
  }
  if (normalized.includes('neuro') || normalized.includes('brain')) {
    return {
      iconName: 'brain',
      iconFamily: 'MaterialCommunityIcons',
      bg: colors.deptNeurologyBg,
      textColor: colors.deptNeurologyText,
      borderColor: '#C7D2FE',
      subtext: 'Brain and nervous system'
    };
  }
  if (normalized.includes('derma') || normalized.includes('skin')) {
    return {
      iconName: 'sparkles-outline',
      iconFamily: 'Ionicons',
      bg: colors.deptDermatologyBg,
      textColor: colors.deptDermatologyText,
      borderColor: '#FDE68A',
      subtext: 'Skin & aesthetic wellness'
    };
  }
  if (normalized.includes('pediat') || normalized.includes('child')) {
    return {
      iconName: 'baby-face-outline',
      iconFamily: 'MaterialCommunityIcons',
      bg: colors.deptPediatricsBg,
      textColor: colors.deptPediatricsText,
      borderColor: '#BBF7D0',
      subtext: 'Adolescent and child health'
    };
  }
  if (normalized.includes('ortho') || normalized.includes('bone') || normalized.includes('joint')) {
    return {
      iconName: 'bone',
      iconFamily: 'MaterialCommunityIcons',
      bg: colors.deptOrthopedicsBg,
      textColor: colors.deptOrthopedicsText,
      borderColor: '#A7F3D0',
      subtext: 'Bones and joint mobility'
    };
  }
  if (normalized.includes('general') || normalized.includes('family') || normalized.includes('physician') || normalized.includes('internal')) {
    return {
      iconName: 'stethoscope',
      iconFamily: 'MaterialCommunityIcons',
      bg: colors.brandBlueLight,
      textColor: colors.brandBlueDark,
      borderColor: colors.brandBlueBorder,
      subtext: 'Everyday health concerns'
    };
  }

  return {
    iconName: 'hospital-building',
    iconFamily: 'MaterialCommunityIcons',
    bg: '#F8FAFC',
    textColor: colors.ink,
    borderColor: colors.border,
    subtext: 'Specialized hospital clinic'
  };
}
