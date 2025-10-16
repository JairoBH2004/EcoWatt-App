import React from 'react';
import { View, Text, ImageBackground, StatusBar, ScrollView } from 'react-native';

import { statsStyles } from '../styles/StatsStyles'; 

// RUTA CORREGIDA: Desde screens/StatsScreen.tsx, sube un nivel (..) y entra a assets
const ECOWATT_BACKGROUND = require('../assets/fondo.png'); 

const StatsScreen = () => {
  return (
    <ImageBackground 
      source={ECOWATT_BACKGROUND} 
      style={statsStyles.container} 
      resizeMode="cover"
    >
      <StatusBar 
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />
      
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}> {/* Padding para evitar que la barra de tabs oculte contenido */}
          <View style={statsStyles.header}>
            <Text style={statsStyles.headerTitle}>Análisis de Consumo</Text>
          </View>
          
          {/* Tarjeta de Gráfica (Transparente) */}
          <View style={statsStyles.card}>
            <Text style={statsStyles.title}>Historial y Tendencias</Text>
            <Text style={statsStyles.subtitle}>[Aquí irá tu componente de Gráfica de Consumo Semanal/Mensual]</Text>
            <Text style={statsStyles.footerText}>Última actualización: Hoy</Text>
          </View>

          {/* Ejemplo de otra Tarjeta Transparente */}
          <View style={statsStyles.card}>
            <Text style={statsStyles.title}>Dispositivos que más consumen</Text>
            <Text style={statsStyles.subtitle}>A/C: 45%, Refrigerador: 20%</Text>
          </View>
      </ScrollView>
    </ImageBackground>
  );
};

export default StatsScreen;