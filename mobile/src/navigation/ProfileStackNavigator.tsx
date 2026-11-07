import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileScreen } from '../screens/ProfileScreen.js';
import { PreferencesScreen } from '../screens/PreferencesScreen.js';
import { colors } from '../theme/colors.js';

export type ProfileStackParamList = {
  Profile: undefined;
  Preferences: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export const ProfileStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface
        },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          fontWeight: '700'
        },
        headerShadowVisible: false
      }}
    >
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'My Profile' }}
      />
      <Stack.Screen
        name="Preferences"
        component={PreferencesScreen}
        options={{ title: 'Notification Preferences' }}
      />
    </Stack.Navigator>
  );
};

