import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DepartmentsScreen } from '../screens/DepartmentsScreen';
import { DoctorsListScreen } from '../screens/DoctorsListScreen';
import { DoctorDetailScreen } from '../screens/DoctorDetailScreen';
import { ConfirmationScreen } from '../screens/ConfirmationScreen';
import { Doctor, Appointment } from '../api/types';
import { colors } from '../theme/colors';

export type DoctorsStackParamList = {
  Departments: undefined;
  DoctorsList: { departmentId?: string; departmentName?: string } | undefined;
  DoctorDetail: { doctor: Doctor };
  Confirmation: { appointment: Appointment };
};

const Stack = createNativeStackNavigator<DoctorsStackParamList>();

export const DoctorsStackNavigator: React.FC = () => {
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
        name="Departments"
        component={DepartmentsScreen}
        options={{ title: 'Departments' }}
      />
      <Stack.Screen
        name="DoctorsList"
        component={DoctorsListScreen as any}
        options={({ route }: any) => ({
          title: route.params?.departmentName || 'Specialists'
        })}
      />
      <Stack.Screen
        name="DoctorDetail"
        component={DoctorDetailScreen as any}
        options={{ title: 'Doctor Details' }}
      />
      <Stack.Screen
        name="Confirmation"
        component={ConfirmationScreen as any}
        options={{
          title: 'Booking Confirmed',
          headerBackVisible: false
        }}
      />
    </Stack.Navigator>
  );
};
