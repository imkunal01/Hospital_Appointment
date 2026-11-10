import React from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { DoctorsStackNavigator } from './DoctorsStackNavigator';
import { AppointmentsStackNavigator } from './AppointmentsStackNavigator';
import { ProfileStackNavigator } from './ProfileStackNavigator';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();

export const AppNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: -2,
          marginBottom: 6
        },
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 24 : 16,
          left: 18,
          right: 18,
          height: 68,
          borderRadius: 34,
          backgroundColor: 'rgba(255, 255, 255, 0.90)',
          borderWidth: 1.5,
          borderColor: 'rgba(224, 238, 255, 0.85)',
          shadowColor: '#1967D2',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.18,
          shadowRadius: 22,
          elevation: 12,
          paddingTop: 8,
          paddingBottom: 4
        }
      }}
    >
      <Tab.Screen
        name="DoctorsTab"
        component={DoctorsStackNavigator}
        options={{
          tabBarLabel: ({ focused, color }) => (
            <Text style={[styles.tabLabel, { color: focused ? colors.primary : color, fontWeight: focused ? '800' : '600' }]}>
              Doctors
            </Text>
          ),
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconWrapper, focused && styles.tabIconActive]}>
              <Ionicons
                name={focused ? 'medical' : 'medical-outline'}
                size={22}
                color={focused ? colors.primary : color}
              />
            </View>
          )
        }}
      />
      <Tab.Screen
        name="AppointmentsTab"
        component={AppointmentsStackNavigator}
        options={{
          tabBarLabel: ({ focused, color }) => (
            <Text style={[styles.tabLabel, { color: focused ? colors.primary : color, fontWeight: focused ? '800' : '600' }]}>
              Appointments
            </Text>
          ),
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconWrapper, focused && styles.tabIconActive]}>
              <Ionicons
                name={focused ? 'calendar' : 'calendar-outline'}
                size={22}
                color={focused ? colors.primary : color}
              />
            </View>
          )
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: ({ focused, color }) => (
            <Text style={[styles.tabLabel, { color: focused ? colors.primary : color, fontWeight: focused ? '800' : '600' }]}>
              Profile
            </Text>
          ),
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconWrapper, focused && styles.tabIconActive]}>
              <Ionicons
                name={focused ? 'person' : 'person-outline'}
                size={22}
                color={focused ? colors.primary : color}
              />
            </View>
          )
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabIconWrapper: {
    width: 46,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  tabIconActive: {
    backgroundColor: '#EBF3FE'
  },
  tabLabel: {
    fontSize: 11,
    marginTop: -2,
    marginBottom: 6,
    letterSpacing: 0.2
  }
});
