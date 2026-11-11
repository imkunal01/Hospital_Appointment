import { colors } from './colors';

export interface DepartmentVisualTheme {
  iconName: string;
  iconFamily: 'Ionicons' | 'MaterialCommunityIcons' | 'Feather';
  bg: string;
  textColor: string;
  subtext: string;
}

export function getDepartmentTheme(deptName: string = ''): DepartmentVisualTheme {
  const normalized = deptName.toLowerCase();

  if (normalized.includes('cardio') || normalized.includes('heart')) {
    return {
      iconName: 'heart',
      iconFamily: 'Ionicons',
      bg: colors.pink,
      textColor: colors.ink,
      subtext: 'Heart and circulation'
    };
  }
  if (normalized.includes('respir') || normalized.includes('pulmon') || normalized.includes('lung')) {
    return {
      iconName: 'lungs',
      iconFamily: 'MaterialCommunityIcons',
      bg: colors.lilac,
      textColor: colors.ink,
      subtext: 'Lungs and breathing'
    };
  }
  if (normalized.includes('neuro') || normalized.includes('brain')) {
    return {
      iconName: 'brain',
      iconFamily: 'MaterialCommunityIcons',
      bg: colors.lilac,
      textColor: colors.ink,
      subtext: 'Brain and nervous system'
    };
  }
  if (normalized.includes('derma') || normalized.includes('skin')) {
    return {
      iconName: 'sparkles-outline',
      iconFamily: 'Ionicons',
      bg: colors.peach,
      textColor: colors.ink,
      subtext: 'Skin & aesthetic wellness'
    };
  }
  if (normalized.includes('pediat') || normalized.includes('child')) {
    return {
      iconName: 'baby-face-outline',
      iconFamily: 'MaterialCommunityIcons',
      bg: colors.lilac,
      textColor: colors.ink,
      subtext: 'Adolescent and child health'
    };
  }
  if (normalized.includes('ortho') || normalized.includes('bone') || normalized.includes('joint')) {
    return {
      iconName: 'bone',
      iconFamily: 'MaterialCommunityIcons',
      bg: colors.peach,
      textColor: colors.ink,
      subtext: 'Bones and joint mobility'
    };
  }
  if (normalized.includes('general') || normalized.includes('family') || normalized.includes('physician') || normalized.includes('internal')) {
    return {
      iconName: 'stethoscope',
      iconFamily: 'MaterialCommunityIcons',
      bg: '#FFFFFF',
      textColor: colors.ink,
      subtext: 'Everyday health concerns'
    };
  }

  return {
    iconName: 'hospital-building',
    iconFamily: 'MaterialCommunityIcons',
    bg: colors.peach,
    textColor: colors.ink,
    subtext: 'Specialized hospital clinic'
  };
}
