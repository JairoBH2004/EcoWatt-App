// src/screens/EditProfileScreen.tsx
import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, Alert,
    ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, SafeAreaView
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Importa la función y tipos necesarios
import { updateUserProfile, UserProfile } from '../services/authService';
import { useAuthStore } from '../store/useAuthStore';
import styles from '../styles/EditProfileStyles'; // Importa los estilos que acabamos de crear
import { RootStackParamList } from '../navigation/AppNavigator'; // Asegúrate que RootStackParamList esté exportado

// Define el tipo para los parámetros que recibirá esta pantalla
type EditProfileRouteParams = {
    currentUser: UserProfile; // Recibirá el perfil actual
};

// Extiende RootStackParamList para incluir esta pantalla y sus parámetros
type EditProfileStackParamList = RootStackParamList & {
    EditProfile: EditProfileRouteParams;
};

type EditProfileScreenProps = NativeStackScreenProps<EditProfileStackParamList, 'EditProfile'>;

const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ route, navigation }) => {
    // Obtenemos el perfil actual pasado por parámetros
    const { currentUser } = route.params;
    const { token } = useAuthStore();

    // Estados para los campos editables, inicializados con los datos actuales
    const [name, setName] = useState(currentUser.user_name);
    const [email, setEmail] = useState(currentUser.user_email);
    const [billingDay, setBillingDay] = useState(currentUser.user_billing_day.toString()); // Convertido a string para TextInput

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Función para manejar el guardado
    const handleSave = async () => {
        setError(''); // Limpia errores previos

        // Validaciones básicas
        if (!name.trim() || !email.trim() || !billingDay.trim()) {
            setError('Todos los campos son obligatorios.');
            return;
        }
        const dayNumber = parseInt(billingDay, 10);
        if (isNaN(dayNumber) || dayNumber < 1 || dayNumber > 31) {
            setError('El día de corte debe ser un número entre 1 y 31.');
            return;
        }

        setIsLoading(true);

        // Construye el objeto solo con los datos que cambiaron
        const updatedData: { user_name?: string; user_email?: string; user_billing_day?: number } = {};
        if (name !== currentUser.user_name) updatedData.user_name = name;
        if (email !== currentUser.user_email) updatedData.user_email = email;
        if (dayNumber !== currentUser.user_billing_day) updatedData.user_billing_day = dayNumber;

        // Si no cambió nada, no hacemos la llamada
        if (Object.keys(updatedData).length === 0) {
            setIsLoading(false);
            Alert.alert('Sin Cambios', 'No has modificado ningún dato.');
            navigation.goBack(); // Regresa a Perfil
            return;
        }

        try {
            if (!token) throw new Error("Token no encontrado");

            // Llama a la función del servicio
            const updatedProfile = await updateUserProfile(token, updatedData);

            setIsLoading(false);
            Alert.alert('Éxito', 'Perfil actualizado correctamente.');
            navigation.goBack(); // Regresa a la pantalla de Perfil

            // Opcional: Podrías actualizar el estado global o forzar recarga en ProfileScreen

        } catch (err: any) {
            setError(err.message || 'No se pudo actualizar el perfil.');
            setIsLoading(false);
        }
    };

    // Vista de Carga mientras se guarda
    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={styles.saveButton.backgroundColor} />
                <Text style={styles.loadingText}>Guardando cambios...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView contentContainerStyle={styles.container}>
                    <Text style={styles.title}>Editar Perfil</Text>

                    {/* Campo Nombre */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Nombre Completo</Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="Tu nombre completo"
                            placeholderTextColor="#999"
                        />
                    </View>

                    {/* Campo Email */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Correo Electrónico</Text>
                        <TextInput
                            style={styles.input}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="tu.correo@ejemplo.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            placeholderTextColor="#999"
                        />
                    </View>

                     {/* Campo Día de Corte */}
                     <View style={styles.inputContainer}>
                        <Text style={styles.label}>Día de Corte (1-31)</Text>
                        <TextInput
                            style={styles.input}
                            value={billingDay}
                            onChangeText={setBillingDay}
                            placeholder="Ej: 15"
                            keyboardType="number-pad" // Teclado numérico
                            maxLength={2}
                            placeholderTextColor="#999"
                        />
                    </View>

                    {/* Campo Tarifa CFE (No editable) */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Tarifa CFE (No editable)</Text>
                        <View style={styles.readOnlyField}>
                            <Text style={styles.readOnlyText}>{currentUser.user_trf_rate.toUpperCase()}</Text>
                        </View>
                    </View>

                    {/* Mensaje de Error */}
                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    {/* Botón Guardar */}
                    <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                        <Text style={styles.saveButtonText}>Guardar Cambios</Text>
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default EditProfileScreen;