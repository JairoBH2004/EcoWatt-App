import React, { useState, useEffect } from 'react';
import {
    View, Text, ActivityIndicator, Button, TouchableOpacity,
    ImageBackground, StatusBar, ScrollView, Alert,
    SafeAreaView
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';

import { getUserProfile, UserProfile } from '../services/authService';
import { useAuthStore } from '../store/useAuthStore';
import styles from '../styles/ProfileStyles';

import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { RootTabParamList } from '../navigation/AppNavigator';

const PRIMARY_GREEN = '#00FF7F';
const PRIMARY_BLUE = '#003366';
const ECOWATT_BACKGROUND = require('../assets/fondo.jpg');

type ProfileScreenProps = BottomTabScreenProps<RootTabParamList, 'Profile'>;

const ProfileScreen = ({ navigation }: ProfileScreenProps) => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const { token, logout } = useAuthStore();

    useEffect(() => {
        const loadProfileData = async () => {
            if (!token) {
                Alert.alert("Sesión Expirada", "Por favor, inicia sesión de nuevo.");
                logout();
                return;
            }

            setIsLoading(true);
            setError('');
            try {
                const data = await getUserProfile(token);
                setProfile(data);
            } catch (err: any) {
                setError(err.message || "No se pudo cargar el perfil.");
                if (err.message.includes('401') || err.message.includes('autenticación')) {
                    logout();
                }
            } finally {
                setIsLoading(false);
            }
        };

        loadProfileData();
    }, []);

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={PRIMARY_GREEN} />
                <Text style={styles.loadingText}>Cargando perfil...</Text>
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
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <View style={styles.header}>
                        {/* --- 👇 BOTÓN DE EDITAR AÑADIDO AQUÍ --- */}
                        <TouchableOpacity
                            style={styles.editButton}
                            onPress={() => Alert.alert('Editar Perfil', 'Próximamente podrás editar tu perfil aquí.')}
                        >
                            <Icon name="pencil-alt" size={20} color={PRIMARY_BLUE} />
                        </TouchableOpacity>
                        
                        {/* --- Contenido del header --- */}
                        <Icon name="user-circle" size={80} color={PRIMARY_BLUE} />
                        <Text style={styles.userName}>{profile?.user_name}</Text>
                        <Text style={styles.userEmail}>{profile?.user_email}</Text>
                    </View>

                    <View style={styles.infoSection}>
                        <InfoRow icon="bolt" label="Tarifa CFE" value={profile?.user_trf_rate.toUpperCase()} />
                        <InfoRow icon="calendar-day" label="Día de Corte Mensual" value={profile?.user_billing_day.toString()} />
                    </View>

                    <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                        <Icon name="sign-out-alt" size={20} color="#FFF" style={{marginRight: 10}}/>
                        <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
                    </TouchableOpacity>
                </ScrollView>
            </ImageBackground>
        </SafeAreaView>
    );
};

const InfoRow = ({ icon, label, value }: { icon: string; label: string; value?: string }) => (
    <View style={styles.infoRow}>
        <Icon name={icon} size={20} color={PRIMARY_BLUE} style={styles.icon} />
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || 'N/A'}</Text>
        <Icon name="chevron-right" size={16} color={PRIMARY_GREEN} />
    </View>
);

export default ProfileScreen;