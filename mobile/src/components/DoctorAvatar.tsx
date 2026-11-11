import React, { useState } from 'react';
import { View, Image, Text, StyleSheet, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { getDoctorPortrait } from '../utils/doctorImages';

interface DoctorAvatarProps {
  name: string;
  size?: number;
  style?: ViewStyle;
}

export const DoctorAvatar: React.FC<DoctorAvatarProps> = ({
  name,
  size = 64,
  style
}) => {
  const [hasError, setHasError] = useState(false);
  const portraitUri = getDoctorPortrait(name);

  const initials = name
    .replace('Dr. ', '')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2);

  const borderRadius = Math.round(size * 0.28);

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius
        },
        style
      ]}
    >
      {!hasError ? (
        <Image
          source={{ uri: portraitUri }}
          style={[styles.image, { borderRadius: borderRadius - 2 }]}
          onError={() => setHasError(true)}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.fallback, { borderRadius: borderRadius - 2 }]}>
          <Text style={[styles.initials, { fontSize: Math.round(size * 0.35) }]}>
            {initials}
          </Text>
          <View style={styles.badgeWrap}>
            <MaterialCommunityIcons name="doctor" size={14} color={colors.ink} />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: colors.ink,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center'
  },
  image: {
    width: '100%',
    height: '100%'
  },
  fallback: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.lilac,
    alignItems: 'center',
    justifyContent: 'center'
  },
  initials: {
    fontWeight: '900',
    color: colors.ink
  },
  badgeWrap: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: colors.chartreuse,
    borderRadius: 8,
    padding: 1
  }
});

