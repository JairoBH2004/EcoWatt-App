import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, Button, TouchableOpacity, ImageBackground, StatusBar, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';

import { getUserProfile } from '../services/authService';
import { useAuthStore } from '../store/useAuthStore';
import styles from '../styles/ProfileStyles'; 

// DEFINICIÓN DE LAS CONSTANTES DE COLOR FALTANTES
const PRIMARY_GREEN = '#00FF7F'; // Verde brillante de Ecowatt
const PRIMARY_BLUE = '#003366';  // Azul oscuro de Ecowatt
// RUTA CORREGIDA: Desde screens/ProfileScreen.tsx, sube un nivel (..) y entra a assets
const ECOWATT_BACKGROUND = require('../assets/fondo.jpg'); 

interface ProfileData {
    user_name: string;
    user_email: string;
    user_trf_rate: string;
    user_billing_day: number;
}

const ProfileScreen = () => {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    
    // OBTENEMOS la función logout del store
    const { token, logout } = useAuthStore((state) => ({
        token: state.token,
        logout: state.logout,
    }));

    const loadProfileData = async () => {
        if (!token) {
            setError('Error de autenticación. Intenta iniciar sesión de nuevo.');
            setIsLoading(false);
            return;
        }
        // ... (Lógica de carga se mantiene) ...
        setIsLoading(true);
        setError('');
        try {
            const data = await getUserProfile(token);
            setProfile(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadProfileData();
    }, []);

    // ... (El renderizado condicional se mantiene igual) ...
    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#00FF7F" />
                <Text>Cargando perfil...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>{error}</Text>
                <Button title="Reintentar" onPress={loadProfileData} color="#00FF7F" />
            </View>
        );
    }

    // JSX de la pantalla de perfil
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
            <ScrollView contentContainerStyle={{flexGrow: 1}}>
                {/* 1. Encabezado de Perfil (Semi-transparente) */}
                <View style={styles.header}>
                    <Icon name="user-circle" size={80} color={PRIMARY_BLUE} />
                    <Text style={styles.userName}>{profile?.user_name}</Text>
                    <Text style={styles.userEmail}>{profile?.user_email}</Text>
                </View>

                {/* 2. Sección de Información (Filas semi-transparentes) */}
                <View style={styles.infoSection}>
                    <InfoRow icon="bolt" label="Tarifa CFE" value={profile?.user_trf_rate.toUpperCase()} />
                    <InfoRow icon="calendar-day" label="Día de Corte Mensual" value={profile?.user_billing_day.toString()} />
                </View>

                {/* 3. Botón de Cerrar Sesión (Ahora visible en la pantalla) */}
                <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                    <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
                </TouchableOpacity>

            </ScrollView>
        </ImageBackground>
    );
};

// Componente auxiliar InfoRow
const InfoRow = ({ icon, label, value }: { icon: string; label: string; value?: string }) => (
    <View style={styles.infoRow}>
        <Icon name={icon} size={20} color={PRIMARY_BLUE} style={styles.icon} />
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || 'N/A'}</Text>
        <Icon name="chevron-right" size={16} color={PRIMARY_GREEN} />
    </View>
);

export default ProfileScreen;