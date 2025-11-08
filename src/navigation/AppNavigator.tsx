import React from 'react';
// --- 👇 CAMBIO 1: Importar Alert ---
import { View, Platform, Alert } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuthStore } from '../store/useAuthStore';

// --- Pantallas ---
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
// --- 👇 Importar la nueva pantalla 👇 ---
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import StatsScreen from '../screens/StatsScreen';
import AddDeviceScreen from '../screens/AddDeviceScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import { UserProfile } from '../services/authService';

// --- Tipos ---
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  // --- 👇 Añadir tipo para la nueva pantalla 👇 ---
  ResetPassword: undefined;
  MainApp: undefined;
  AddDevice: undefined;
  EditProfile: { currentUser: UserProfile };
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
  // --- 👇 CAMBIO 2: Leer el estado global ---
  const { hasDevices } = useAuthStore();

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
            
            {/* --- 👇 CAMBIO 3: Añadir 'listeners' a la pantalla "Stats" --- */}
            <Tab.Screen 
              name="Stats" 
              component={StatsScreen} 
              listeners={{
                tabPress: e => {
                  // Si NO tiene dispositivos, previene la navegación
                  if (!hasDevices) {
                    e.preventDefault(); // <-- Bloquea el clic
                    
                    // Muestra una alerta al usuario
                    Alert.alert(
                      "Sin Dispositivos", 
                      "Añade tu primer dispositivo en la pantalla de Perfil para ver el análisis."
                    );
                  }
                  // Si 'hasDevices' es true, no hace nada y deja que navegue.
                },
              }}
            />
            {/* --- 👆 FIN DEL CAMBIO 3 👆 --- */}

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
        headerShown: false, // Ocultar header por defecto
      }}
    >
      {isAuthenticated ? (
        // --- Pantallas para usuarios autenticados ---
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
              headerBackTitle: '',
            }}
          />
          <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{
              headerShown: true,
              title: 'Editar Perfil',
              headerStyle: { backgroundColor: '#1E2A47' },
              headerTintColor: '#FFF',
              headerBackTitle: '',
            }}
          />
        </>
      ) : (
        // --- Pantallas para usuarios NO autenticados ---
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
            options={{ headerShown: false }} // Sin header
          />
          {/* --- 👇 Pantalla añadida aquí 👇 --- */}
          <Stack.Screen
            name="ResetPassword"
            component={ResetPasswordScreen}
            options={{ headerShown: false }} // Sin header
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;