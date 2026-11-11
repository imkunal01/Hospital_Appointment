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
      iconName: 'heart-pulse',
      iconFamily: 'MaterialCommunityIcons',
      bg: '#FFF0F3',
      textColor: '#E11D48',
      borderColor: '#FFE4E8',
      subtext: 'Heart and circulation'
    };
  }
  if (normalized.includes('respir') || normalized.includes('pulmon') || normalized.includes('lung')) {
    return {
      iconName: 'lungs',
      iconFamily: 'MaterialCommunityIcons',
      bg: '#FAF5FF',
      textColor: '#7C3AED',
      borderColor: '#F3E8FF',
      subtext: 'Lungs and breathing'
    };
  }
  if (normalized.includes('neuro') || normalized.includes('brain')) {
    return {
      iconName: 'brain',
      iconFamily: 'MaterialCommunityIcons',
      bg: '#EEF2FF',
      textColor: '#4338CA',
      borderColor: '#E0E7FF',
      subtext: 'Brain and nervous system'
    };
  }
  if (normalized.includes('derma') || normalized.includes('skin')) {
    return {
      iconName: 'sparkles',
      iconFamily: 'MaterialCommunityIcons',
      bg: '#F0FDF4',
      textColor: '#059669',
      borderColor: '#DCFCE7',
      subtext: 'Skin & aesthetic wellness'
    };
  }
  if (normalized.includes('pediat') || normalized.includes('child')) {
    return {
      iconName: 'baby-face-outline',
      iconFamily: 'MaterialCommunityIcons',
      bg: '#F0FDF4',
      textColor: '#15803D',
      borderColor: '#DCFCE7',
      subtext: 'Adolescent and child health'
    };
  }
  if (normalized.includes('ortho') || normalized.includes('bone') || normalized.includes('joint')) {
    return {
      iconName: 'bone',
      iconFamily: 'MaterialCommunityIcons',
      bg: '#F0FDF4',
      textColor: '#059669',
      borderColor: '#DCFCE7',
      subtext: 'Bones and joint mobility'
    };
  }
  if (normalized.includes('general') || normalized.includes('family') || normalized.includes('physician') || normalized.includes('internal')) {
    return {
      iconName: 'stethoscope',
      iconFamily: 'MaterialCommunityIcons',
      bg: '#EFF6FF',
      textColor: '#2563EB',
      borderColor: '#DBEAFE',
      subtext: 'Everyday health concerns'
    };
  }

  return {
    iconName: 'hospital-building',
    iconFamily: 'MaterialCommunityIcons',
    bg: '#F8FAFC',
    textColor: '#2563EB',
    borderColor: '#E2E8F0',
    subtext: 'Specialized hospital clinic'
  };
}
