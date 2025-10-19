import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, StatusBar, TouchableOpacity,
    ImageBackground, Alert, ActivityIndicator, Button
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/FontAwesome5';

import { styles } from '../styles/HomeStyles';
import { useAuthStore } from '../store/useAuthStore';
import {
    getDashboardSummary, DashboardSummary,
    getUserProfile, UserProfile,
    getDevices, Device
} from '../services/authService';
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
            if (!token) {
                logout();
                return;
            }

            setIsLoading(true);
            setError('');

            try {
                const profileData = await getUserProfile(token);
                setProfile(profileData);

                let devicesData: Device[] = [];
                try {
                    devicesData = await getDevices(token);
                    console.log("Dispositivos obtenidos:", devicesData);
                    setDevices(devicesData);

                    if (devicesData.length > 0) {
                        const summaryData = await getDashboardSummary(token);
                        setSummary(summaryData);
                    } else {
                        setSummary(null);
                    }

                } catch (deviceError: any) {
                    console.log("Error obteniendo dispositivos:", deviceError);
                    if (deviceError.message?.toLowerCase().includes('not found') || deviceError.message.includes('404')) {
                        setDevices([]);
                        setSummary(null);
                    } else {
                        throw deviceError;
                    }
                }

            } catch (err: any) {
                console.log("Error general:", err);
                setError(err.message || "No se pudieron cargar los datos.");
                if (err.message.includes('401')) logout();
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
                <TouchableOpacity 
                    style={[styles.addButton, {marginVertical: 10}]} 
                    onPress={() => navigation.navigate('AddDevice')}
                >
                    <Text style={styles.addButtonText}>Añadir Dispositivo</Text>
                </TouchableOpacity>
                <View style={{marginTop: 20}}>
                    <Button title="Cerrar Sesión" onPress={logout} color="#E74C3C" />
                </View>
            </View>
        );
    }

    const renderContent = () => {
        if (devices.length === 0) {
            return (
                <View style={styles.centeredContent}>
                    <Icon name="plus-circle" size={50} color={PRIMARY_GREEN} />
                    <Text style={styles.actionTitle}>¡Bienvenido a EcoWatt!</Text>
                    <Text style={styles.actionSubtitle}>
                        No tienes ningún dispositivo, agrega uno para comenzar.
                    </Text>
                    <TouchableOpacity 
                        style={[styles.addButton, {marginVertical: 20}]} 
                        onPress={() => navigation.navigate('AddDevice')}
                    >
                        <Text style={styles.addButtonText}>Añadir Dispositivo</Text>
                    </TouchableOpacity>
                    <View style={{marginTop: 40}}>
                        <Button title="Cerrar Sesión" onPress={logout} color="#E74C3C" />
                    </View>
                </View>
            );
        } 
return (
    <>
        <View style={styles.header}>
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

        <View style={styles.mainCard}>
            <Text style={styles.mainCardTitle}>Costo Estimado del Periodo</Text>
            <Text style={styles.projectedCost}>${summary?.estimated_cost_mxn?.toFixed(2) || '0.00'} MXN</Text>
            <Text style={styles.comparisonText}>Días en el ciclo: {summary?.days_in_cycle || 0}</Text>
        </View>

        {/* --- Dos recuadros pequeños arriba de la gráfica --- */}
        <View style={styles.smallCardsContainer}>
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

        {/* --- Recuadro de la gráfica debajo de los pequeños --- */}
        <View style={styles.graphPlaceholder}>
            <Text style={styles.graphPlaceholderText}>Aquí va la gráfica</Text>
        </View>

        <View style={styles.recommendationCard}>
            <Icon name="lightbulb" size={24} color="#003366" />
            <Text style={styles.recommendationText}>{summary?.latest_recommendation || 'No hay recomendaciones.'}</Text>
        </View>
    </>
);

    };

    return (
        <ImageBackground source={ECOWATT_BACKGROUND} style={styles.container} resizeMode="cover">
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
            <SafeAreaView style={{flex: 1}}>
                <ScrollView contentContainerStyle={styles.contentContainer}>
                    {renderContent()}
                </ScrollView>
            </SafeAreaView>
        </ImageBackground>
    );
};

export default HomeScreen;
