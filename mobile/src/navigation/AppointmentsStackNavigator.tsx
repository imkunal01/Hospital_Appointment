import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppointmentsScreen } from '../screens/AppointmentsScreen';
import { AppointmentDetailScreen } from '../screens/AppointmentDetailScreen';
import { colors } from '../theme/colors';

export type AppointmentsStackParamList = {
  AppointmentsList: undefined;
  AppointmentDetail: { appointmentId: string };
};

const Stack = createNativeStackNavigator<AppointmentsStackParamList>();

export const AppointmentsStackNavigator: React.FC = () => {
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
        name="AppointmentsList"
        component={AppointmentsScreen}
        options={{ title: 'My Appointments' }}
      />
      <Stack.Screen
        name="AppointmentDetail"
        component={AppointmentDetailScreen as any}
        options={{ title: 'Appointment Details' }}
      />
    </Stack.Navigator>
  );
};

