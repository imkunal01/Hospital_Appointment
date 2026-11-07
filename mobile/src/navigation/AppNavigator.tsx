import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { DoctorsStackNavigator } from './DoctorsStackNavigator.js';
import { AppointmentsTabPlaceholder } from '../screens/AppointmentsTabPlaceholder.js';
import { ProfileScreen } from '../screens/ProfileScreen.js';
import { colors } from '../theme/colors.js';

const Tab = createBottomTabNavigator();

export const AppNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface
        },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          fontWeight: '700'
        },
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
          headerShown: false,
          tabBarLabel: 'Doctors',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🩺</Text>
        }}
      />
      <Tab.Screen
        name="AppointmentsTab"
        component={AppointmentsTabPlaceholder}
        options={{
          title: 'My Appointments',
          tabBarLabel: 'Appointments',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>📅</Text>
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: 'My Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>👤</Text>
        }}
      />
    </Tab.Navigator>
  );
};
