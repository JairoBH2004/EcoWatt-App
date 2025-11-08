import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, StatusBar, TouchableOpacity,
    ImageBackground, Alert, ActivityIndicator, Button,
    Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { BarChart } from 'react-native-chart-kit';

import { styles } from '../styles/HomeStyles';
import { useAuthStore } from '../store/useAuthStore'; // <-- 1. IMPORTAR (ya lo tenías)
import {
    getDashboardSummary, DashboardSummary,
    getUserProfile, UserProfile,
    getDevices, Device,
    getLast7DaysHistory // Usamos la función correcta
} from '../services/authService';
// Importamos los tipos correctos
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, RootTabParamList } from '../navigation/AppNavigator';

// Constants
const ECOWATT_BACKGROUND = require('../assets/fondo.jpg');
const PRIMARY_GREEN = '#00FF7F';
const screenWidth = Dimensions.get("window").width;

// Helper array for day names
const days = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

// Type definition for graph data
type GraphData = {
    labels: string[];
    datasets: { data: number[] }[];
};

// Default graph data
const defaultGraphData: GraphData = {
    labels: days.slice(-7),
    datasets: [{ data: Array(7).fill(0) }]
};

// Type for screen props using CompositeScreenProps
type HomeScreenProps = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

const HomeScreen = ({ navigation }: HomeScreenProps) => {
    // State Hooks
    // --- 👇 CAMBIO 1: Obtener 'setHasDevices' del store 👇 ---
    const { token, logout, setHasDevices } = useAuthStore();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [devices, setDevices] = useState<Device[]>([]);
    const [graphData, setGraphData] = useState<GraphData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Effect Hook to load initial data
    useEffect(() => {
        const loadInitialData = async () => {
            // Check for token, logout if none
            if (!token) {
                logout();
                return;
            }

            // Set initial loading state
            setIsLoading(true);
            setError('');
            setGraphData(null); // Reset graph data on load

            try {
                // Fetch profile first (essential)
                const profileData = await getUserProfile(token);
                setProfile(profileData);

                // Fetch devices, handle 404 (no devices) gracefully
                let devicesData: Device[] = [];
                try {
                    devicesData = await getDevices(token);
                    setDevices(devicesData);
                } catch (err: any) {
                    if (err.message.includes('404')) {
                        setDevices([]); // Set empty array if 404
                    } else {
                        throw err; // Re-throw other device errors
                    }
                }

                // If user has devices, fetch summary and history in parallel
                if (devicesData.length > 0) {
                    // --- 👇 CAMBIO 2: Informar al store que SÍ hay dispositivos 👇 ---
                    setHasDevices(true);

                    const [summaryData, historyData] = await Promise.all([
                        getDashboardSummary(token),
                        getLast7DaysHistory(token) // Use the correct function
                    ]);
                    setSummary(summaryData);

                    // --- 👇 LOG PARA VER LOS DATOS CRUDOS DE LA API 👇 ---
                    console.log('API Response (History):', JSON.stringify(historyData, null, 2));
                    // --- 👆 FIN DEL LOG 👆 ---


                    // Process history data only if it exists and has data_points array
                    if (historyData && historyData.data_points && historyData.data_points.length > 0) {
                        setGraphData({
                            labels: historyData.data_points.map((p: any) => days[new Date(p.timestamp).getDay()]),
                            datasets: [{ data: historyData.data_points.map((p: any) => p.value) }]
                        });
                    } else {
                        setGraphData(defaultGraphData); // Use default empty graph if no history
                    }
                } else {
                    // No devices, set summary to null and graph to default
                    // --- 👇 CAMBIO 3: Informar al store que NO hay dispositivos 👇 ---
                    setHasDevices(false);
                    
                    setSummary(null);
                    setGraphData(defaultGraphData);
                }

            } catch (err: any) {
                // Handle general errors (profile fetch, unexpected API errors)
                console.log("Error loading home screen data:", err);
                setError(err.message || "No se pudieron cargar los datos.");
                // Logout if token is invalid (401)
                if (err.message.includes('401')) {
                    logout();
                }
            } finally {
                // Always finish loading state
                setIsLoading(false);
            }
        };

        loadInitialData();
        // --- 👇 CAMBIO 4: Añadir 'setHasDevices' a las dependencias 👇 ---
    }, [token, logout, setHasDevices]); // Re-run effect if token or logout function changes

    // Loading State UI
    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={PRIMARY_GREEN} />
                <Text style={{ color: '#FFF', marginTop: 10 }}>Cargando...</Text>
            </View>
        );
    }

    // Error State UI
    if (error) {
       return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>{error}</Text>
                {/* Button to navigate to AddDevice might be useful here too */}
                <TouchableOpacity
                    style={[styles.addButton, { marginVertical: 10 }]}
                    onPress={() => navigation.navigate('AddDevice')}
                >
                    <Text style={styles.addButtonText}>Añadir Dispositivo</Text>
                </TouchableOpacity>
                <View style={{ marginTop: 20 }}>
                    <Button title="Cerrar Sesión" onPress={logout} color="#E74C3C" />
                </View>
            </View>
        );
    }

    // Main Content Rendering Function
    const renderContent = () => {
        // "No Devices" View
        if (devices.length === 0) {
             return (
                 <View style={styles.centeredContent}>
                     <Icon name="plus-circle" size={50} color={PRIMARY_GREEN} />
                     <Text style={styles.actionTitle}>¡Bienvenido a EcoWatt!</Text>
                     <Text style={styles.actionSubtitle}>
                         No tienes ningún dispositivo, agrega uno para comenzar.
                     </Text>
                     <TouchableOpacity
                         style={[styles.addButton, { marginVertical: 20 }]}
                         onPress={() => navigation.navigate('AddDevice')}
                     >
                         <Text style={styles.addButtonText}>Añadir Dispositivo</Text>
                     </TouchableOpacity>
                     <View style={{ marginTop: 40 }}>
                         <Button title="Cerrar Sesión" onPress={logout} color="#E74C3C" />
                     </View>
                 </View>
             );
        }

        // Main Dashboard View (with devices)
        return (
            <>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerTitle}>¡Hola, {profile?.user_name?.split(' ')[0]}!</Text>
                        <Text style={styles.headerSubtitle}>Tu resumen de energía</Text>
                    </View>
                    <View style={styles.headerIconsContainer}>
                        {/* Notification Bell Icon */}
                        <TouchableOpacity style={styles.menuButton} onPress={() => Alert.alert('Notificaciones', 'No tienes notificaciones nuevas.')}>
                            <Icon name="bell" size={24} color="#FFFFFF" solid />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Main Summary Card */}
                <View style={styles.mainCard}>
                    <Text style={styles.mainCardTitle}>Costo Estimado del Periodo</Text>
                    <Text style={styles.projectedCost}>${summary?.estimated_cost_mxn?.toFixed(2) || '0.00'} MXN</Text>
                    <Text style={styles.comparisonText}>Días en el ciclo: {summary?.days_in_cycle || 0}</Text>
                </View>

                {/* Small Info Cards */}
                <View style={styles.smallCardsContainer}>
                    <View style={styles.smallCard}>
                        <Icon name="bolt" size={24} color={PRIMARY_GREEN} />
                        <Text style={styles.smallCardValue}>{summary?.kwh_consumed_cycle?.toFixed(2) || 0} kWh</Text>
                        <Text style={styles.smallCardLabel}>Consumo del Ciclo</Text>
                    </View>
                    <View style={styles.smallCard}>
                        <Icon name="leaf" size={24} color={PRIMARY_GREEN} />
                        <Text style={styles.smallCardValue}>{summary?.carbon_footprint?.co2_emitted_kg?.toFixed(1) || 0} kg</Text>
                        <Text style={styles.smallCardLabel}>CO₂ Emitido</Text>
                    </View>
                </View>

                {/* Recommendation Card */}
                <View style={styles.recommendationCard}>
                    <Icon name="lightbulb" size={24} color="#003366" />
                    <Text style={styles.recommendationText}>{summary?.latest_recommendation || 'Aún no hay recomendaciones.'}</Text>
                </View>

                {/* Graph Card with Horizontal Scroll */}
                <View style={styles.graphContainer}>
                    {/* Dynamic title based on actual data length */}
                    <Text style={styles.graphTitle}>Consumo Últimos {graphData?.labels.length || 0} Días</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {/* Show loading indicator if graphData is null */}
                        {!graphData ? (
                            <View style={[styles.graphPlaceholder, { width: screenWidth - 70, height: 220 }]}>
                                <ActivityIndicator color={PRIMARY_GREEN} />
                            </View>
                        ) : (
                            // Calculate width dynamically based on label count or min screen width
                            <View style={{ width: Math.max(graphData.labels.length * 60, screenWidth - 70) }}>
                                <BarChart
                                    data={graphData} // Data is guaranteed non-null here
                                    width={Math.max(graphData.labels.length * 60, screenWidth - 70)}
                                    height={220}
                                    fromZero // Start Y axis at 0
                                    yAxisSuffix=" kWh"
                                    yAxisLabel="" // No need for Y axis label
                                    chartConfig={chartConfig}
                                    verticalLabelRotation={0} // Keep labels horizontal
                                    showValuesOnTopOfBars={true} // Show value above bar
                                    style={{ borderRadius: 16 }}
                                />
                            </View>
                        )}
                    </ScrollView>
                </View>
            </>
        );
    };

    // Main component return statement
    return (
        <ImageBackground source={ECOWATT_BACKGROUND} style={styles.container} resizeMode="cover">
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
            <SafeAreaView style={{ flex: 1 }}>
                {/* Use ScrollView only for the content area */}
                <ScrollView contentContainerStyle={styles.contentContainer}>
                    {/* Render content based on loading/error state */}
                    {renderContent()}
                </ScrollView>
            </SafeAreaView>
        </ImageBackground>
    );
};

// Chart Configuration (using theme colors)
const chartConfig = {
    backgroundColor: '#1E2A47', // Use a color from your theme if available
    backgroundGradientFrom: '#1E2A47', // Match background
    backgroundGradientTo: '#1E2A47',
    decimalPlaces: 3, // Adjust decimals as needed for kWh values
    color: (opacity = 1) => `rgba(0, 255, 127, ${opacity})`, // Primary green
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`, // White labels
    style: {
        borderRadius: 16
    },
    propsForDots: { // Not used by BarChart
        r: "6",
        strokeWidth: "2",
        stroke: PRIMARY_GREEN
    },
    propsForBackgroundLines: {
        stroke: 'rgba(255, 255, 255, 0.2)' // Faint white lines
    },
    propsForLabels: {
        fontSize: 10 // Smaller font size for labels
    },
    // --- 👇 AÑADIDO PARA AJUSTAR EJE Y 👇 ---
    segments: 4 // Sugerimos 4 líneas horizontales
};

export default HomeScreen;