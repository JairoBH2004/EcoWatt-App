// src/screens/ResetPasswordScreen.tsx
import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, Image,
    ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView // Añadir ScrollView
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/FontAwesome';
import LinearGradient from 'react-native-linear-gradient';

// Importa la función del servicio
import { resetPassword } from '../services/authService';
// Importa los estilos específicos
import styles, { COLOR_PRIMARY_BLUE, COLOR_PRIMARY_GREEN } from '../styles/ResetPasswordStyles'; // Importa ResetPasswordStyles

// Define los tipos para la navegación (asegúrate que coincidan con tu Stack real)
type AuthStackParamList = {
    Login: undefined;
    Register: undefined;
    ForgotPassword: undefined;
    ResetPassword: undefined; // Añade la nueva pantalla
};

type ResetPasswordScreenProps = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ navigation }) => {
    const [token, setToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleReset = async () => {
        setError('');
        setSuccessMessage('');

        // Validaciones
        if (!token.trim()) {
            setError('Por favor, ingresa el token recibido por correo.');
            return;
        }
        if (!newPassword || newPassword.length < 8) {
            setError('La nueva contraseña debe tener al menos 8 caracteres.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        setIsLoading(true);

        try {
            await resetPassword({
                token: token.trim(), // Asegura quitar espacios extra
                new_password: newPassword
            });
            setSuccessMessage('¡Contraseña restablecida con éxito! Ahora puedes iniciar sesión.');
            // Opcional: Limpiar campos después del éxito
            setToken('');
            setNewPassword('');
            setConfirmPassword('');

            // Navegar a Login después de un momento
            setTimeout(() => navigation.navigate('Login'), 3000); // 3 segundos

        } catch (err: any) {
            // La API podría devolver errores específicos (token inválido, etc.)
            setError(err.message || 'No se pudo restablecer la contraseña.');
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
                style={styles.keyboardAvoidingContainer}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                {/* Panel superior (sin logo ahora) */}
                <View style={styles.brandPanel}>
                    <Text style={styles.brandTitle}>ECOWATT</Text>
                </View>

                {/* Usamos ScrollView por si el teclado cubre los inputs */}
                <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                    {/* Formulario */}
                    <View style={styles.formPanel}>
                        <Text style={styles.formTitle}>Restablecer Contraseña</Text>
                        <Text style={styles.formSubtitle}>Ingresa el token de tu correo y tu nueva contraseña.</Text>

                        {error ? <Text style={styles.errorText}>{error}</Text> : null}
                        {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

                        {/* Input Token */}
                        <View style={styles.inputContainer}>
                            <Icon name="key" size={20} color="#888" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Token del correo"
                                placeholderTextColor="#888"
                                value={token}
                                onChangeText={setToken}
                                autoCapitalize="none"
                                editable={!isLoading && !successMessage}
                            />
                        </View>

                        {/* Input Nueva Contraseña */}
                        <View style={styles.inputContainer}>
                            <Icon name="lock" size={20} color="#888" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Nueva Contraseña"
                                placeholderTextColor="#888"
                                secureTextEntry={!isNewPasswordVisible}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                editable={!isLoading && !successMessage}
                            />
                            <TouchableOpacity onPress={() => setIsNewPasswordVisible(!isNewPasswordVisible)}>
                               <Icon name={isNewPasswordVisible ? "eye-slash" : "eye"} size={20} color={COLOR_PRIMARY_GREEN} style={styles.eyeIcon}/>
                            </TouchableOpacity>
                        </View>

                        {/* Input Confirmar Contraseña */}
                        <View style={styles.inputContainer}>
                            <Icon name="lock" size={20} color="#888" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Confirmar Nueva Contraseña"
                                placeholderTextColor="#888"
                                secureTextEntry={!isConfirmPasswordVisible}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                editable={!isLoading && !successMessage}
                            />
                             <TouchableOpacity onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}>
                               <Icon name={isConfirmPasswordVisible ? "eye-slash" : "eye"} size={20} color={COLOR_PRIMARY_GREEN} style={styles.eyeIcon}/>
                            </TouchableOpacity>
                        </View>

                        {/* Botón Restablecer */}
                        <TouchableOpacity
                            style={styles.mainButton}
                            onPress={handleReset}
                            disabled={isLoading || !!successMessage}
                        >
                            {isLoading
                                ? <ActivityIndicator size="small" color={COLOR_PRIMARY_BLUE} />
                                : <Text style={styles.mainButtonText}>RESTABLECER CONTRASEÑA</Text>
                            }
                        </TouchableOpacity>

                         {/* Botón Volver a Login (solo si no hay mensaje de éxito) */}
                         {!successMessage && (
                            <TouchableOpacity
                                style={styles.secondaryLink}
                                onPress={() => navigation.navigate('Login')}
                                disabled={isLoading}
                            >
                                <Text style={styles.secondaryLinkText}>Volver a Iniciar Sesión</Text>
                            </TouchableOpacity>
                         )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
};

export default ResetPasswordScreen