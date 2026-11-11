import React from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
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
  backgroundColor: '#0A2540',
  borderWidth: 1.5,
  borderColor: '#1E293B',
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.28,
  shadowRadius: 14,
  elevation: 10,
  paddingTop: 8,
  paddingBottom: 4
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
        tabBarActiveTintColor: '#38BDF8',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
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
                { color: focused ? '#38BDF8' : '#94A3B8', fontWeight: focused ? '800' : '600' }
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
                color={focused ? '#FFFFFF' : '#94A3B8'}
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
                { color: focused ? '#38BDF8' : '#94A3B8', fontWeight: focused ? '800' : '600' }
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
                color={focused ? '#FFFFFF' : '#94A3B8'}
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
                { color: focused ? '#38BDF8' : '#94A3B8', fontWeight: focused ? '800' : '600' }
              ]}
            >
              Appointments
            </Text>
          ),
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIconWrapper, focused && styles.tabIconActive]}>
              <Ionicons
                name={focused ? 'calendar-number' : 'calendar-number-outline'}
                size={20}
                color={focused ? '#FFFFFF' : '#94A3B8'}
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
                { color: focused ? '#38BDF8' : '#94A3B8', fontWeight: focused ? '800' : '600' }
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
                color={focused ? '#FFFFFF' : '#94A3B8'}
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
    width: 48,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  tabIconActive: {
    backgroundColor: '#2563EB'
  },
  tabLabel: {
    fontSize: 10,
    marginTop: -2,
    marginBottom: 4,
    letterSpacing: 0.1
  }
});
