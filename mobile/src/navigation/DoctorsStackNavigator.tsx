import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DepartmentsScreen } from '../screens/DepartmentsScreen';
import { DoctorsListScreen } from '../screens/DoctorsListScreen';
import { DoctorDetailScreen } from '../screens/DoctorDetailScreen';
import { ConfirmationScreen } from '../screens/ConfirmationScreen';
import { Doctor, Appointment } from '../api/types';

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
        headerShown: false,
        headerBackTitleVisible: false
      }}
    >
      <Stack.Screen
        name="Departments"
        component={DepartmentsScreen}
      />
      <Stack.Screen
        name="DoctorsList"
        component={DoctorsListScreen as any}
      />
      <Stack.Screen
        name="DoctorDetail"
        component={DoctorDetailScreen as any}
      />
      <Stack.Screen
        name="Confirmation"
        component={ConfirmationScreen as any}
      />
    </Stack.Navigator>
  );
};
