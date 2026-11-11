import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileScreen } from '../screens/ProfileScreen';
import { PreferencesScreen } from '../screens/PreferencesScreen';

export type ProfileStackParamList = {
  Profile: undefined;
  Preferences: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export const ProfileStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        headerBackTitleVisible: false
      }}
    >
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
      />
      <Stack.Screen
        name="Preferences"
        component={PreferencesScreen}
      />
    </Stack.Navigator>
  );
};
