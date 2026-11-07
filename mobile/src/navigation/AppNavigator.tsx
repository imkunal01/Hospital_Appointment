import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { DoctorsStackNavigator } from './DoctorsStackNavigator.js';
import { AppointmentsStackNavigator } from './AppointmentsStackNavigator.js';
import { ProfileStackNavigator } from './ProfileStackNavigator.js';
import { colors } from '../theme/colors.js';

const Tab = createBottomTabNavigator();

export const AppNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.borderLight,
          minHeight: 56
        }
      }}
    >
      <Tab.Screen
        name="DoctorsTab"
        component={DoctorsStackNavigator}
        options={{
          tabBarLabel: 'Doctors',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🩺</Text>
        }}
      />
      <Tab.Screen
        name="AppointmentsTab"
        component={AppointmentsStackNavigator}
        options={{
          tabBarLabel: 'Appointments',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>📅</Text>
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>👤</Text>
        }}
      />
    </Tab.Navigator>
  );
};
