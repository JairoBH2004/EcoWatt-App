import React, { useState, useEffect, useCallback } from 'react'; // Importar useCallback
import {
    View, Text, ActivityIndicator, Button, TouchableOpacity,
    ImageBackground, StatusBar, Alert,
    SafeAreaView,
    FlatList
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';

import { getUserProfile, UserProfile, getDevices, Device } from '../services/authService';
import { useAuthStore } from '../store/useAuthStore';
import styles from '../styles/ProfileStyles';

// --- Tipos de Navegación Actualizados ---
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, RootTabParamList } from '../navigation/AppNavigator';

// Constantes
const PRIMARY_GREEN = '#00FF7F';
const PRIMARY_BLUE = '#003366';
const ECOWATT_BACKGROUND = require('../assets/fondo.jpg');

// --- Tipo de Props Actualizado ---
type ProfileScreenProps = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, 'Profile'>,
  NativeStackScreenProps<RootStackParamList> // Añade el Stack padre
>;

// --- Componente InfoRow (Modificado: sin flecha) ---
const InfoRow = ({ icon, label, value }: { icon: string; label: string; value?: string }) => (
    <View style={styles.infoRow}>
        <Icon name={icon} size={20} color={PRIMARY_BLUE} style={styles.icon} />
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || 'N/A'}</Text>
        {/* Línea de <Icon name="chevron-right".../> eliminada */}
    </View>
);

// --- Componente DeviceRow (Modificado: sin flecha) ---
const DeviceRow = ({ item }: { item: Device }) => (
    <View style={styles.deviceRow}>
        <Icon name="microchip" size={20} color={PRIMARY_BLUE} style={styles.icon} />
        <View style={styles.deviceInfo}>
            <Text style={styles.deviceName}>{item.dev_name}</Text>
            <Text style={styles.deviceMac}>{item.dev_hardware_id}</Text>
        </View>
        {/* Línea de <Icon name="chevron-right".../> eliminada */}
    </View>
);


const ProfileScreen = ({ navigation }: ProfileScreenProps) => {
    // Hooks
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [devices, setDevices] = useState<Device[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const { token, logout } = useAuthStore();

    // --- 👇 Mover loadData aquí y envolver en useCallback 👇 ---
    const loadData = useCallback(async () => {
        if (!token) {
            Alert.alert("Sesión Expirada", "Por favor, inicia sesión de nuevo.");
            logout();
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            // Cargar perfil y dispositivos en paralelo
            const [profileData, devicesDataResult] = await Promise.allSettled([
                getUserProfile(token),
                getDevices(token)
            ]);

            // Manejar resultado del perfil
            if (profileData.status === 'fulfilled') {
                setProfile(profileData.value);
            } else {
                throw profileData.reason; // Lanzar error si falla
            }

            // Manejar resultado de los dispositivos
            if (devicesDataResult.status === 'fulfilled') {
                setDevices(devicesDataResult.value);
            } else {
                if (devicesDataResult.reason?.message?.includes('404')) {
                    setDevices([]); // Lista vacía si no hay dispositivos (404)
                } else {
                    throw devicesDataResult.reason; // Lanzar otros errores
                }
            }
        } catch (err: any) {
            setError(err.message || "No se pudieron cargar los datos.");
            if (err.message.includes('401') || err.message.includes('autenticación')) {
                logout(); // Cerrar sesión si el token es inválido
            }
        } finally {
            setIsLoading(false); // Terminar carga
        }
    }, [token, logout]); // Dependencias de la función

    // Effect para cargar datos y escuchar el 'focus'
    useEffect(() => {
        // Carga inicial
        loadData();

        // Listener para 'focus' (actualizar al volver de otra pantalla)
        const unsubscribe = navigation.addListener('focus', () => {
            loadData();
        });

        return unsubscribe; // Limpia el listener al desmontar
    }, [loadData, navigation]); // Ahora depende de loadData y navigation

    // --- Función para Navegar a Editar Perfil ---
    const handleEditProfile = () => {
        if (!profile) {
            Alert.alert("Error", "No se pueden cargar los datos del perfil para editar.");
            return;
        }
        navigation.navigate('EditProfile', { currentUser: profile });
    };

    // --- Renderizado Condicional: Carga ---
    if (isLoading && !profile) { // Muestra carga solo la primera vez
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={PRIMARY_GREEN} />
                <Text style={styles.loadingText}>Cargando...</Text>
            </View>
        );
    }

    // --- Renderizado Condicional: Error Crítico (sin perfil) ---
    if (error && !profile) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>{error}</Text>
                <Button title="Cerrar Sesión" onPress={logout} color="#E74C3C" />
            </View>
        );
    }

    // --- Componente Header para FlatList ---
    const renderListHeader = () => (
        <>
            <View style={styles.header}>
                <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
                    <Icon name="pencil-alt" size={20} color={PRIMARY_BLUE} />
                </TouchableOpacity>
                <Icon name="user-circle" size={80} color={PRIMARY_BLUE} />
                <Text style={styles.userName}>{profile?.user_name}</Text>
                <Text style={styles.userEmail}>{profile?.user_email}</Text>
            </View>
            <View style={styles.infoSection}>
                <InfoRow icon="bolt" label="Tarifa CFE" value={profile?.user_trf_rate.toUpperCase()} />
                <InfoRow icon="calendar-day" label="Día de Corte" value={profile?.user_billing_day.toString()} />
            </View>
             <View style={styles.devicesSectionHeader}>
                  <Text style={styles.sectionTitle}>Mis Dispositivos</Text>
                  {error && <Text style={styles.errorTextSmall}>{error}</Text>}
             </View>
        </>
    );

     // --- Componente Footer para FlatList ---
     const renderListFooter = () => (
         <>
             <View style={styles.addDeviceContainer}>
                 <TouchableOpacity
                     style={styles.addDeviceButton}
                     onPress={() => navigation.navigate('AddDevice')}
                 >
                     <Icon name="plus" size={18} color={PRIMARY_BLUE} style={{ marginRight: 10 }} />
                     <Text style={styles.addDeviceButtonText}>Añadir Nuevo Dispositivo</Text>
                 </TouchableOpacity>
             </View>
             <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                 <Icon name="sign-out-alt" size={20} color="#FFF" style={{ marginRight: 10 }} />
                 <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
             </TouchableOpacity>
         </>
     );

    // --- Renderizado Principal ---
    return (
        <SafeAreaView style={styles.safeAreaContainer}>
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
                {/* --- Usamos FlatList como contenedor principal --- */}
                <FlatList
                    data={devices}
                    renderItem={DeviceRow}
                    keyExtractor={(item) => item.dev_id.toString()}
                    ListHeaderComponent={renderListHeader}
                    ListFooterComponent={renderListFooter}
                    ListEmptyComponent={
                        <View style={styles.emptyDeviceListContainer}>
                            <Text style={styles.emptyListText}>No tienes dispositivos registrados.</Text>
                        </View>
                    }
                    contentContainerStyle={styles.flatListContentContainer}
                    style={styles.flatListContainer}
                    // --- 👇 Ahora 'loadData' es visible y funciona aquí 👇 ---
                    onRefresh={loadData}
                    refreshing={isLoading}
                />
            </ImageBackground>
        </SafeAreaView>
    );
};

export default ProfileScreen;