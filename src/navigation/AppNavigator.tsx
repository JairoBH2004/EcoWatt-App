import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/FontAwesome5';

// --- Store de autenticación
import { useAuthStore } from '../store/useAuthStore';

// --- Pantallas
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import StatsScreen from '../screens/StatsScreen';

// --- Estilos externos
import { appStyles } from '../styles/appStyles';

// ------------------- Tipos -------------------
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type AppTabParamList = {
  Home: undefined;
  Stats: undefined;
  Profile: undefined;
  Login: undefined;
  Register: undefined;
};

type CustomTabOptions = {
  tabBarLabel?: string;
  tabBarIconName?: string;
  tabBarButton?: any;
  headerShown?: boolean;
};

// ------------------- Configuración -------------------
const Stack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<AppTabParamList>();

// ------------------------------------------------------
// ✅ Barra personalizada tipo “cápsula” inferior
// ------------------------------------------------------
// ------------------------------------------------------
// ✅ Barra personalizada tipo “cápsula” inferior
// ------------------------------------------------------
const CustomTabBar = (props: any) => {
  return (
    <View style={appStyles.tabBarContainer}>
      {props.state.routes.map((route: any, index: number) => {
        const { options } = props.descriptors[route.key];

        // Solo mostrar estas rutas
        const visibleRoutes = ['Home', 'Stats', 'Profile'];
        if (!visibleRoutes.includes(route.name)) return null;

        const label = options.tabBarLabel || route.name;
        const iconName = options.tabBarIconName || 'question-circle';
        const isFocused = props.state.index === index;

        const onPress = () => {
          const event = props.navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            props.navigation.navigate(route.name);
          }
        };

        const buttonBg = isFocused ? '#00FF7F' : 'transparent';
        const textColor = isFocused ? '#000' : '#FFF';
        const iconColor = isFocused ? '#000' : '#FFF';

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={[
              appStyles.tabButton,
              {
                backgroundColor: buttonBg,
                alignItems: 'center',
                justifyContent: 'center',
                padding: 5,
              },
            ]}
          >
            <Icon name={iconName} size={20} color={iconColor} />
            {isFocused && (
              <Text style={{ color: textColor, fontSize: 13, fontWeight: 'bold' }}>
                {label}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};



// ------------------------------------------------------
// ✅ Navegador principal con pestañas inferiores
// ------------------------------------------------------
function AppTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        //tabBarStyle: { display: 'none' },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: 'Principal', tabBarIconName: 'home' } as CustomTabOptions}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{ tabBarLabel: 'Análisis', tabBarIconName: 'chart-line' } as CustomTabOptions}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Perfil', tabBarIconName: 'user' } as CustomTabOptions}
      />

      {/* Pantallas ocultas */}
      <Tab.Screen
        name="Login"
        component={LoginScreen}
        options={{ tabBarButton: () => null } as CustomTabOptions}
      />
      <Tab.Screen
        name="Register"
        component={RegisterScreen}
        options={{ tabBarButton: () => null } as CustomTabOptions}
      />
    </Tab.Navigator>
  );
}

// ------------------------------------------------------
// ✅ Control de navegación según autenticación
// ------------------------------------------------------
export default function AppNavigator() {
  const  isAuthenticated  = true;

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        <AppTabNavigator />
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
