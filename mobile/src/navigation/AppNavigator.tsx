import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../store/authStore';

// Type definitions
import {
  AuthStackParamList,
  MainTabParamList,
  VisitStackParamList,
  RootStackParamList,
} from './types';

// Auth Screens
import LoginScreen from '../screens/LoginScreen';
import MPINSetupScreen from '../screens/MPINSetupScreen';
import MPINVerifyScreen from '../screens/MPINVerifyScreen';
import InitializationScreen from '../screens/InitializationScreen';

// Main Screens
import DashboardScreen from '../screens/DashboardScreen';
import PastVisitsScreen from '../screens/PastVisitsScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Visit Flow Screens
import VisitTypeScreen from '../screens/VisitTypeScreen';
import MCTSVerifyScreen from '../screens/MCTSVerifyScreen';
import DaySelectScreen from '../screens/DaySelectScreen';
import DataCollectionScreen from '../screens/DataCollectionScreen';
import SummaryScreen from '../screens/SummaryScreen';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const VisitStack = createNativeStackNavigator<VisitStackParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

// Placeholder components for screens not yet implemented
const PlaceholderScreen = ({ route }: any) => {
  const { Text, View, StyleSheet } = require('react-native');
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>
        {route.name} Screen - Coming Soon
      </Text>
    </View>
  );
};

const styles = require('react-native').StyleSheet.create({
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  placeholderText: {
    fontSize: 18,
    color: '#666',
  },
});

// Auth Stack Navigator
function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="MPINSetup" component={MPINSetupScreen} />
      <AuthStack.Screen name="MPINVerify" component={MPINVerifyScreen} />
      <AuthStack.Screen name="Initialization" component={InitializationScreen} />
    </AuthStack.Navigator>
  );
}

// Visit Flow Stack Navigator
function VisitNavigator() {
  return (
    <VisitStack.Navigator
      screenOptions={{
        headerShown: true,
        headerBackTitle: 'Back',
      }}
    >
      <VisitStack.Screen
        name="VisitType"
        component={VisitTypeScreen}
        options={{ title: 'Select Visit Type' }}
      />
      <VisitStack.Screen
        name="MCTSVerify"
        component={MCTSVerifyScreen}
        options={{ title: 'Verify Beneficiary' }}
      />
      <VisitStack.Screen
        name="DaySelect"
        component={DaySelectScreen}
        options={{ title: 'Select Visit Day' }}
      />
      <VisitStack.Screen
        name="DataCollection"
        component={DataCollectionScreen}
        options={{ title: 'Record Visit Data' }}
      />
      <VisitStack.Screen
        name="Summary"
        component={SummaryScreen}
        options={{ title: 'Visit Summary' }}
      />
    </VisitStack.Navigator>
  );
}

// Main Tab Navigator
function MainNavigator() {
  return (
    <MainTab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
      }}
    >
      <MainTab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Home',
        }}
      />
      <MainTab.Screen
        name="NewVisit"
        component={VisitNavigator}
        options={{
          title: 'New Visit',
          tabBarLabel: 'New Visit',
          headerShown: false,
        }}
      />
      <MainTab.Screen
        name="PastVisits"
        component={PastVisitsScreen}
        options={{
          title: 'Past Visits',
          tabBarLabel: 'History',
        }}
      />
      <MainTab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
        }}
      />
    </MainTab.Navigator>
  );
}

// Root Navigator
function RootNavigator() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      ) : (
        <RootStack.Screen name="Main" component={MainNavigator} />
      )}
    </RootStack.Navigator>
  );
}

// Main App Navigator Component
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}
