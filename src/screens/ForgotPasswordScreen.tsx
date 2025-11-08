// src/screens/ForgotPasswordScreen.tsx
import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, Image,
    ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/FontAwesome';
import LinearGradient from 'react-native-linear-gradient';

// Importa la función del servicio
import { requestPasswordReset } from '../services/authService';
// Importa los estilos específicos
import styles, { COLOR_PRIMARY_BLUE, COLOR_PRIMARY_GREEN } from '../styles/ForgotPasswordStyles'; // Cambiado a ForgotPasswordStyles

const logo = require('../assets/logo.png');

// Define los tipos para la navegación (asegúrate que incluya ResetPassword)
type AuthStackParamList = {
    Login: undefined;
    Register: undefined;
    ForgotPassword: undefined;
    ResetPassword: undefined; // Necesario para la navegación
};

type ForgotPasswordScreenProps = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    // --- 👇 Estado para controlar si el email se envió 👇 ---
    const [emailSent, setEmailSent] = useState(false);

    const handleRequestReset = async () => {
        if (!email) {
            setError('Por favor, ingresa tu correo electrónico.');
            return;
        }
        setIsLoading(true);
        setError('');
        setSuccessMessage('');
        setEmailSent(false); // Resetea por si reintenta

        try {
            await requestPasswordReset(email);
            setSuccessMessage('Si tu correo está registrado, recibirás instrucciones para resetear tu contraseña.');
            setEmail(''); // Limpia email
            // --- 👇 Marcar como enviado 👇 ---
            setEmailSent(true);
        } catch (err: any) {
            setError(err.message || 'Ocurrió un error al solicitar el reseteo.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={[COLOR_PRIMARY_BLUE, COLOR_PRIMARY_GREEN]}
            style={styles.fullScreenBackground}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <KeyboardAvoidingView
                style={styles.keyboardAvoidingContainer} // Usa estilo del contenedor
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                {/* Logo y Marca */}
                <View style={styles.brandPanel}>
                    <Image source={logo} style={styles.loginLogo} />
                    <Text style={styles.brandTitle}>ECOWATT</Text>
                </View>

                {/* Formulario */}
                <View style={styles.formPanel}>
                    <Text style={styles.formTitle}>Recuperar Contraseña</Text>
                    {/* Mostrar subtítulo solo si aún no se envía */}
                    {!emailSent && (
                        <Text style={styles.formSubtitle}>Ingresa tu correo electrónico registrado.</Text>
                    )}

                    {error ? <Text style={styles.errorText}>{error}</Text> : null}
                    {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

                    {/* Mostrar input solo si aún no se envía */}
                    {!emailSent && (
                        <View style={styles.inputContainer}>
                            <Icon name="envelope" size={20} color="#888" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Correo Electrónico"
                                placeholderTextColor="#888"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                                editable={!isLoading}
                            />
                        </View>
                    )}

                    {/* Mostrar botón "Enviar" solo si aún no se envía */}
                    {!emailSent && (
                        <TouchableOpacity
                            style={styles.mainButton}
                            onPress={handleRequestReset}
                            disabled={isLoading}
                        >
                            {isLoading
                                ? <ActivityIndicator size="small" color={COLOR_PRIMARY_BLUE} />
                                : <Text style={styles.mainButtonText}>ENVIAR INSTRUCCIONES</Text>
                            }
                        </TouchableOpacity>
                    )}

                    {/* --- 👇 Mostrar botón "Ingresar Token" si ya se envió 👇 --- */}
                    {emailSent && (
                        <TouchableOpacity
                            style={[styles.mainButton, { backgroundColor: '#f39c12', marginTop: 10 }]} // Naranja, con margen
                            onPress={() => navigation.navigate('ResetPassword')} // Navega a ResetPassword
                        >
                            <Text style={[styles.mainButtonText, { color: '#FFF' }]}>INGRESAR TOKEN</Text>
                        </TouchableOpacity>
                    )}

                    {/* Botón Volver a Login */}
                    <TouchableOpacity
                        style={styles.secondaryLink}
                        onPress={() => navigation.goBack()}
                        disabled={isLoading}
                    >
                        <Text style={styles.secondaryLinkText}>Volver a Iniciar Sesión</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
};

export default ForgotPasswordScreen;