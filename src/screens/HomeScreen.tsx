import React from 'react';
import { View, Text, ScrollView, StatusBar, TouchableOpacity, ImageBackground, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { styles } from '../styles/HomeStyles';
import { StackScreenProps } from '@react-navigation/stack';

// 1. Se importa la lista COMPLETA de pantallas desde el navegador.
import { RootStackParamList } from '../navigation/AppNavigator';

// Imagen de fondo
const ECOWATT_BACKGROUND = require('../assets/fondo.jpg');

// 2. Se define el tipo correcto para los props de esta pantalla.
type HomeScreenProps = StackScreenProps<RootStackParamList, 'Home'>;

// 3. Se aplica el tipo 'HomeScreenProps' al componente.
const HomeScreen = ({ navigation }: HomeScreenProps) => {
  return (
    <ImageBackground 
      source={ECOWATT_BACKGROUND} 
      style={styles.container} 
      resizeMode="cover"
    >
      <StatusBar 
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />

      {/* 1. Encabezado */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>EcoWatt</Text>
          <Text style={styles.headerSubtitle}>Pantalla Principal</Text>
        </View>
        
        {/* Botón de Notificaciones */}
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => Alert.alert('Notificaciones', 'Abrir Notificaciones')}
        >
          <Icon name="bell" size={24} color="#FFFFFF" /> 
        </TouchableOpacity>
      </View>

      {/* 2. Contenido Scrolleable */}
      <ScrollView 
        contentContainerStyle={[styles.contentContainer, { paddingBottom: 100 }]} 
        // paddingBottom igual o mayor que la altura de tu barra + margen
      >
        {/* Tarjeta Principal */}
        <View style={styles.mainCard}>
          <Text style={styles.mainCardTitle}>Costo Proyectado del Periodo (CFE)</Text>
          <Text style={styles.projectedCost}>$850.00 MXN</Text>
          <Text style={styles.comparisonText}>+5% vs. Ciclo Anterior</Text>
        </View>

        {/* Tarjetas Pequeñas */}
        <View style={styles.smallCardsContainer}>
          <View style={styles.smallCard}>
            <Icon name="bolt" size={24} color="#00FF7F" />
            <Text style={styles.smallCardValue}>1,250 W</Text>
            <Text style={styles.smallCardLabel}>Consumo Actual</Text>
          </View>
          <View style={styles.smallCard}>
            <Icon name="charging-station" size={24} color="#00FF7F" />
            <Text style={styles.smallCardValue}>118 V</Text>
            <Text style={styles.smallCardLabel}>Voltaje</Text>
          </View>
        </View>

        {/* Tarjeta de Análisis */}
        <View style={styles.analysisCard}>
          <Text style={styles.analysisTitle}>Análisis de Consumo Semanal</Text>
          <Text style={{ color: '#B0B0B0' }}>{'[Aquí irá la gráfica de líneas/barras]'}</Text>
        </View>

        {/* Tarjeta de Recomendación */}
        <View style={styles.recommendationCard}>
          <Icon name="lightbulb" size={24} color="#27ae60" />
          <Text style={styles.recommendationText}>
            Recomendación: El A/C usa 45% de tu energía. Ajústalo 1°C.
          </Text>
        </View>
      </ScrollView>

      {/* 3. Nota: Tu barra de navegación flotará por encima de este contenido */}
      
    </ImageBackground>
  );
};

export default HomeScreen;