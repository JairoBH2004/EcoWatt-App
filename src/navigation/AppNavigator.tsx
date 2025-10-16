import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuthStore } from '../store/useAuthStore';

// Importa TODAS tus pantallas
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import StatsScreen from '../screens/StatsScreen';

// 1. Creamos el mapa con TODAS las pantallas
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  Profile: undefined;
  Stats: undefined;
};

// 2. Le pasamos el mapa al navegador
const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  // Obtenemos el único estado que necesitamos
  const { isAuthenticated } = useAuthStore();

  return (
    <Stack.Navigator>
      {isAuthenticated ? (
        // Si el usuario está autenticado, muestra estas pantallas
        <>
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Inicio' }} />
          <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
          <Stack.Screen name="Stats" component={StatsScreen} options={{ title: 'Estadísticas' }} />
        </>
      ) : (
        // Si no está autenticado, muestra las de login/registro
        <>
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            options={{ headerShown: false }} // Ocultamos la barra en el Login
          />
          <Stack.Screen 
            name="Register" 
            component={RegisterScreen} 
            options={{ title: 'Crear Cuenta' }} // Le ponemos un título a la barra
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;