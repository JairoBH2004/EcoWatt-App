import React from 'react';
import { View, Platform } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuthStore } from '../store/useAuthStore';

// --- Pantallas ---
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import StatsScreen from '../screens/StatsScreen';
import AddDeviceScreen from '../screens/AddDeviceScreen';

// --- Tipos ---
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  MainApp: undefined;
  AddDevice: undefined;
};

export type RootTabParamList = {
  Home: undefined;
  Profile: undefined;
  Stats: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();

// --- Tabs (barra inferior) ---
function MainAppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 30 : 20,
          left: 20,
          right: 20,
          backgroundColor: 'rgba(40, 40, 40, 0.9)',
          borderRadius: 30,
          height: 70,
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: '#00FF7F',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: 8,
        },
        tabBarIcon: ({ focused }) => {
          let iconName: string = '';

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Stats':
              iconName = focused ? 'bar-chart' : 'bar-chart-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person-circle' : 'person-circle-outline';
              break;
          }

          const iconColor = focused ? '#00FF7F' : '#a0a0a0';
          const iconSize = focused ? 32 : 26;

          return (
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: focused ? '#00FF7F' : 'transparent',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: focused ? 0.8 : 0,
                shadowRadius: focused ? 10 : 0,
                elevation: focused ? 12 : 0,
              }}
            >
              <Ionicons name={iconName} size={iconSize} color={iconColor} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Stats" component={StatsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// --- Navegador Principal ---
const AppNavigator = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {isAuthenticated ? (
        <>
          <Stack.Screen name="MainApp" component={MainAppTabs} />
          <Stack.Screen
            name="AddDevice"
            component={AddDeviceScreen}
            options={{
              headerShown: true,
              title: 'Añadir Dispositivo',
              headerStyle: { backgroundColor: '#1E2A47' },
              headerTintColor: '#FFF',
              headerBackTitle: '', // ✅ reemplaza el texto “Back” por vacío (oculta el título)
            }}
          />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
