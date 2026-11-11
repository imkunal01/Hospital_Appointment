import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppointmentsScreen } from '../screens/AppointmentsScreen';
import { AppointmentDetailScreen } from '../screens/AppointmentDetailScreen';

export type AppointmentsStackParamList = {
  AppointmentsList: undefined;
  AppointmentDetail: { appointmentId: string };
};

const Stack = createNativeStackNavigator<AppointmentsStackParamList>();

export const AppointmentsStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        headerBackTitleVisible: false
      }}
    >
      <Stack.Screen
        name="AppointmentsList"
        component={AppointmentsScreen}
      />
      <Stack.Screen
        name="AppointmentDetail"
        component={AppointmentDetailScreen as any}
      />
    </Stack.Navigator>
  );
};
