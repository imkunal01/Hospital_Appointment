import React from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { DoctorsStackNavigator } from './DoctorsStackNavigator';
import { BookingStackNavigator } from './BookingStackNavigator';
import { AppointmentsStackNavigator } from './AppointmentsStackNavigator';
import { ProfileStackNavigator } from './ProfileStackNavigator';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();

const baseTabBarStyle = {
  position: 'absolute' as const,
  bottom: Platform.OS === 'ios' ? 24 : 16,
  left: 16,
  right: 16,
  height: 68,
  borderRadius: 34,
  backgroundColor: '#FFFFFF',
  borderWidth: 1.5,
  borderColor: '#E2E8F0',
  shadowColor: '#0A2540',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.10,
  shadowRadius: 16,
  elevation: 8,
  paddingTop: 8,
  paddingBottom: 6
};

// Sub-screens that represent active processes/flows where sticky action buttons appear
const PROCESS_SCREENS_HIDING_TAB_BAR = [
  'DoctorsList',
  'DoctorDetail',
  'Confirmation',
  'AppointmentDetail',
  'Preferences'
];

function getTabBarStyle(route: any) {
  // If in BookTab (dedicated booking flow), hide tab dock so sticky CTAs are unobstructed
  if (route.name === 'BookTab') {
    return { display: 'none' as const };
  }

  const routeName = getFocusedRouteNameFromRoute(route);
  if (routeName && PROCESS_SCREENS_HIDING_TAB_BAR.includes(routeName)) {
    return { display: 'none' as const };
  }

  return baseTabBarStyle;
}

export const AppNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#64748B',
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 10.5,
          fontWeight: '600',
          marginTop: -2,
          marginBottom: 4
        },
        tabBarStyle: getTabBarStyle(route)
      })}
    >
      <Tab.Screen
        name="DoctorsTab"
        component={DoctorsStackNavigator}
        options={{
          tabBarLabel: ({ focused }) => (
            <Text
              style={[
                styles.tabLabel,
                { color: focused ? '#2563EB' : '#64748B', fontWeight: focused ? '800' : '600' }
              ]}
            >
              Home
            </Text>
          ),
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIconWrapper, focused && styles.tabIconActive]}>
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={20}
                color={focused ? '#FFFFFF' : '#64748B'}
              />
            </View>
          )
        }}
      />
      <Tab.Screen
        name="BookTab"
        component={BookingStackNavigator}
        options={{
          tabBarLabel: ({ focused }) => (
            <Text
              style={[
                styles.tabLabel,
                { color: focused ? '#2563EB' : '#64748B', fontWeight: focused ? '800' : '600' }
              ]}
            >
              Book
            </Text>
          ),
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIconWrapper, focused && styles.tabIconActive]}>
              <Ionicons
                name={focused ? 'calendar' : 'calendar-outline'}
                size={20}
                color={focused ? '#FFFFFF' : '#64748B'}
              />
            </View>
          )
        }}
      />
      <Tab.Screen
        name="AppointmentsTab"
        component={AppointmentsStackNavigator}
        options={{
          tabBarLabel: ({ focused }) => (
            <Text
              style={[
                styles.tabLabel,
                { color: focused ? '#2563EB' : '#64748B', fontWeight: focused ? '800' : '600' }
              ]}
            >
              Appointments
            </Text>
          ),
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIconWrapper, focused && styles.tabIconActive]}>
              <MaterialCommunityIcons
                name={focused ? 'calendar-clock' : 'calendar-clock-outline'}
                size={21}
                color={focused ? '#FFFFFF' : '#64748B'}
              />
            </View>
          )
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: ({ focused }) => (
            <Text
              style={[
                styles.tabLabel,
                { color: focused ? '#2563EB' : '#64748B', fontWeight: focused ? '800' : '600' }
              ]}
            >
              Profile
            </Text>
          ),
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIconWrapper, focused && styles.tabIconActive]}>
              <Ionicons
                name={focused ? 'person' : 'person-outline'}
                size={20}
                color={focused ? '#FFFFFF' : '#64748B'}
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
    width: 52,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center'
  },
  tabIconActive: {
    backgroundColor: '#2563EB'
  },
  tabLabel: {
    fontSize: 10.5,
    marginTop: -2,
    marginBottom: 4,
    letterSpacing: 0.1
  }
});
