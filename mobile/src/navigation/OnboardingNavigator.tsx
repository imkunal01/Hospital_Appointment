import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PhoneVerificationScreen } from '../screens/PhoneVerificationScreen';
import { ProfileSetupScreen } from '../screens/ProfileSetupScreen';

const Stack = createNativeStackNavigator();

export const OnboardingNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PhoneVerification" component={PhoneVerificationScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
    </Stack.Navigator>
  );
};

