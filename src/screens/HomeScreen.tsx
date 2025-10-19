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
import { useAuthStore } from '../store/useAuthStore';
import {
    getDashboardSummary, DashboardSummary,
    getUserProfile, UserProfile,
    getDevices, Device,
    getHistoryGraph
} from '../services/authService';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { RootTabParamList } from '../navigation/AppNavigator';

// Constants
const ECOWATT_BACKGROUND = require('../assets/fondo.jpg');
const PRIMARY_GREEN = '#00FF7F';
const screenWidth = Dimensions.get("window").width;

// Helper array for day names (corrects bug)
const days = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

// Type definition for graph data
type GraphData = {
    labels: string[];
    datasets: { data: number[] }[];
};

// Default graph data (empty state for 7 days)
const defaultGraphData: GraphData = {
    labels: days.slice(-7), // Still keep 7 labels for default empty state layout
    datasets: [{ data: Array(7).fill(0) }]
};

// Screen props type
type HomeScreenProps = BottomTabScreenProps<RootTabParamList, 'Home'>;

const HomeScreen = ({ navigation }: HomeScreenProps) => {
    // Hooks
    const { token, logout } = useAuthStore();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [devices, setDevices] = useState<Device[]>([]);
    const [graphData, setGraphData] = useState<GraphData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadInitialData = async () => {
            if (!token) {
                logout();
                return;
            }

            // Start loading state
            setIsLoading(true);
            setError('');
            setGraphData(null); // Reset graph data

            try {
                // Fetch profile first
                const profileData = await getUserProfile(token);
                setProfile(profileData);

                // Fetch devices
                let devicesData: Device[] = [];
                try {
                    devicesData = await getDevices(token);
                    setDevices(devicesData);
                } catch (err: any) {
                    if (err.message.includes('404')) {
                        setDevices([]);
                    } else {
                        throw err;
                    }
                }

                // If devices exist, fetch summary and graph data in parallel
                if (devicesData.length > 0) {
                    const [summaryData, historyData] = await Promise.all([
                        getDashboardSummary(token),
                        getHistoryGraph(token, 'daily')
                    ]);

                    setSummary(summaryData);

                    // Process graph data if available
                    if (historyData.data_points.length > 0) {
                        setGraphData({
                            labels: historyData.data_points
                                .map((p: any) => days[new Date(p.timestamp).getDay()]), // Sin .slice()
                            datasets: [{
                                data: historyData.data_points.map((p: any) => p.value) // Sin .slice()
                            }]
                        });
                    } else {
                        setGraphData(defaultGraphData); // Show default empty graph
                    }
                } else {
                    // No devices found, set defaults
                    setSummary(null);
                    setGraphData(defaultGraphData); // Show default empty graph
                }

            } catch (err: any) {
                console.log("Error loading home screen data:", err);
                setError(err.message || "No se pudieron cargar los datos.");
                if (err.message.includes('401')) logout();
            } finally {
                setIsLoading(false); // End loading state
            }
        };

        loadInitialData();
    }, [token, logout]); // Depend on token and logout

    // Loading State UI
    if (isLoading) {
        // ... (Tu vista de carga)
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={PRIMARY_GREEN} />
                <Text style={{ color: '#FFF', marginTop: 10 }}>Cargando...</Text>
            </View>
        );
    }

    // Error State UI
    if (error) {
       // ... (Tu vista de error)
       return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>{error}</Text>
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
             // ... (Tu vista "sin dispositivos")
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
                     {/* ... (Tu Header) */}
                     <View>
                        <Text style={styles.headerTitle}>¡Hola, {profile?.user_name?.split(' ')[0]}!</Text>
                        <Text style={styles.headerSubtitle}>Tu resumen de energía</Text>
                    </View>
                    <View style={styles.headerIconsContainer}>
                        <TouchableOpacity style={styles.menuButton} onPress={() => navigation.navigate('AddDevice')}>
                            <Icon name="plus" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.menuButton, { marginLeft: 16 }]} onPress={() => Alert.alert('Notificaciones', 'No tienes notificaciones nuevas.')}>
                            <Icon name="bell" size={24} color="#FFFFFF" solid />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Main Summary Card */}
                <View style={styles.mainCard}>
                     {/* ... (Tu Main Card) */}
                    <Text style={styles.mainCardTitle}>Costo Estimado del Periodo</Text>
                    <Text style={styles.projectedCost}>${summary?.estimated_cost_mxn?.toFixed(2) || '0.00'} MXN</Text>
                    <Text style={styles.comparisonText}>Días en el ciclo: {summary?.days_in_cycle || 0}</Text>
                </View>

                {/* Small Info Cards */}
                <View style={styles.smallCardsContainer}>
                     {/* ... (Tus Small Cards) */}
                     <View style={styles.smallCard}>
                        <Icon name="bolt" size={24} color={PRIMARY_GREEN} />
                        <Text style={styles.smallCardValue}>{summary?.kwh_consumed_cycle || 0} kWh</Text>
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
                    <Text style={styles.recommendationText}>{summary?.latest_recommendation || 'No hay recomendaciones.'}</Text>
                </View>

                {/* Graph Card with Horizontal Scroll */}
                <View style={styles.graphContainer}>
                    {/* El título ahora es dinámico */}
                    <Text style={styles.graphTitle}>Consumo Últimos {graphData?.labels.length || 0} Días</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {!graphData ? (
                            <View style={[styles.graphPlaceholder, { width: screenWidth - 70, height: 220 }]}>
                                <ActivityIndicator color={PRIMARY_GREEN} />
                            </View>
                        ) : (
                            // El ancho ahora depende de la cantidad REAL de labels
                            <View style={{ width: Math.max(graphData.labels.length * 60, screenWidth - 70) }}>
                                <BarChart
                                    data={graphData}
                                    width={Math.max(graphData.labels.length * 60, screenWidth - 70)}
                                    height={220}
                                    fromZero
                                    yAxisSuffix=" kWh"
                                    yAxisLabel=""
                                    chartConfig={chartConfig}
                                    verticalLabelRotation={0}
                                    showValuesOnTopOfBars={true}
                                    style={{ borderRadius: 16 }}
                                />
                            </View>
                        )}
                    </ScrollView>
                </View>
            </>
        );
    };

    // Main component return
    return (
        <ImageBackground source={ECOWATT_BACKGROUND} style={styles.container} resizeMode="cover">
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
            <SafeAreaView style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.contentContainer}>
                    {renderContent()}
                </ScrollView>
            </SafeAreaView>
        </ImageBackground>
    );
};

// Chart Configuration
const chartConfig = {
    backgroundColor: '#1E2A47',
    backgroundGradientFrom: '#1E2A47',
    backgroundGradientTo: '#1E2A47',
    decimalPlaces: 3, // Shows values like 0.028
    color: (opacity = 1) => `rgba(0, 255, 127, ${opacity})`, // Primary green color
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`, // White labels
    style: {
        borderRadius: 16
    },
    propsForDots: {
        r: "6",
        strokeWidth: "2",
        stroke: PRIMARY_GREEN
    },
    propsForBackgroundLines: {
        stroke: 'rgba(255, 255, 255, 0.2)' // Faint background lines
    },
    propsForLabels: {
        fontSize: 10 // Smaller font for labels
    }
};

export default HomeScreen;