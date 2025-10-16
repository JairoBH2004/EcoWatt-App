import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, StatusBar, TouchableOpacity,
    ImageBackground, Alert, ActivityIndicator, Button
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome5';

import { styles } from '../styles/HomeStyles';
import { useAuthStore } from '../store/useAuthStore';
import { getDashboardSummary, DashboardSummary, getUserProfile, UserProfile, getDevices, Device } from '../services/authService';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { RootTabParamList } from '../navigation/AppNavigator';

const ECOWATT_BACKGROUND = require('../assets/fondo.jpg');
const PRIMARY_GREEN = '#00FF7F';

type HomeScreenProps = BottomTabScreenProps<RootTabParamList, 'Home'>;

const HomeScreen = ({ navigation }: HomeScreenProps) => {
    const { token, logout } = useAuthStore();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [devices, setDevices] = useState<Device[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadInitialData = async () => {
            if (!token) { logout(); return; }

            setIsLoading(true);
            setError('');
            try {
                // 1. Primero, pedimos el perfil y la lista de dispositivos.
                const [profileData, devicesData] = await Promise.all([
                    getUserProfile(token),
                    getDevices(token)
                ]);

                setProfile(profileData);
                setDevices(devicesData);

                // 2. Comprobamos si hay dispositivos.
                if (devicesData.length > 0) {
                    // 3. SOLO SI HAY dispositivos, pedimos el resumen del dashboard.
                    const summaryData = await getDashboardSummary(token);
                    setSummary(summaryData);
                }

            } catch (err: any) {
                if (err.message && (err.message.toLowerCase().includes('not found') || err.message.includes('404'))) {
                    setDevices([]);
                } else {
                    setError(err.message || "No se pudieron cargar los datos.");
                    if (err.message.includes('401')) logout();
                }
            } finally {
                setIsLoading(false);
            }
        };

        loadInitialData();
    }, []);

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={PRIMARY_GREEN} />
                <Text style={{color: '#FFF', marginTop: 10}}>Cargando...</Text>
            </View>
        );
    }
    
    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>{error}</Text>
                <Button title="Cerrar Sesión" onPress={logout} color="#E74C3C" />
            </View>
        );
    }

    const renderContent = () => {
        if (devices.length === 0) {
            // VISTA CUANDO NO HAY DISPOSITIVOS
            return (
                <View style={styles.centeredContent}>
                    <Icon name="plus-circle" size={50} color={PRIMARY_GREEN} />
                    <Text style={styles.actionTitle}>¡Bienvenido a EcoWatt!</Text>
                    <Text style={styles.actionSubtitle}>
                        Parece que aún no tienes dispositivos. ¡Añade el primero para empezar a monitorear!
                    </Text>
                    <TouchableOpacity 
                        style={styles.addButton} 
                        onPress={() => Alert.alert("Próximamente", "Aquí te llevaremos a la pantalla para añadir tu Shelly.")}
                    >
                        <Text style={styles.addButtonText}>Añadir Dispositivo</Text>
                    </TouchableOpacity>
                </View>
            );
        } else {
            // VISTA NORMAL DEL DASHBOARD
            return (
                <>
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.headerTitle}>¡Hola, {profile?.user_name?.split(' ')[0]}!</Text>
                            <Text style={styles.headerSubtitle}>Tu resumen de energía</Text>
                        </View>
                        <TouchableOpacity style={styles.menuButton} onPress={() => Alert.alert('Notificaciones', 'No tienes notificaciones nuevas.')}>
                            <Icon name="bell" size={24} color="#FFFFFF" solid />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.mainCard}>
                        <Text style={styles.mainCardTitle}>Costo Estimado del Periodo</Text>
                        <Text style={styles.projectedCost}>${summary?.estimated_cost_mxn?.toFixed(2) || '0.00'} MXN</Text>
                        <Text style={styles.comparisonText}>Días en el ciclo: {summary?.days_in_cycle || 0}</Text>
                    </View>

                    <View style={styles.smallCardsContainer}>
                        <View style={styles.smallCard}><Icon name="bolt" size={24} color={PRIMARY_GREEN} /><Text style={styles.smallCardValue}>{summary?.kwh_consumed_cycle || 0} kWh</Text><Text style={styles.smallCardLabel}>Consumo del Ciclo</Text></View>
                        <View style={styles.smallCard}><Icon name="leaf" size={24} color={PRIMARY_GREEN} /><Text style={styles.smallCardValue}>{summary?.carbon_footprint?.co2_emitted_kg?.toFixed(1) || 0} kg</Text><Text style={styles.smallCardLabel}>CO₂ Emitido</Text></View>
                    </View>

                    <View style={styles.recommendationCard}><Icon name="lightbulb" size={24} color="#003366" /><Text style={styles.recommendationText}>{summary?.latest_recommendation || 'No hay recomendaciones.'}</Text></View>
                </>
            );
        }
    };

    // --- 👇 CORRECCIÓN APLICADA AQUÍ 👇 ---
    return (
        <ImageBackground 
            source={ECOWATT_BACKGROUND} 
            style={styles.container} // Asegúrate que el estilo tenga flex: 1
            resizeMode="cover"
        >
            <StatusBar 
                barStyle="light-content"
                backgroundColor="transparent"
                translucent={true}
            />
            <SafeAreaView style={{flex: 1}}>
                <ScrollView contentContainerStyle={styles.contentContainer}>
                    {renderContent()}
                </ScrollView>
            </SafeAreaView>
        </ImageBackground>
    );
};

export default HomeScreen;