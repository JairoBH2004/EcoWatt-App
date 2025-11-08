import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/FontAwesome';
import LinearGradient from 'react-native-linear-gradient';

// --- 1. IMPORTAMOS EL SERVICIO Y EL STORE ---
import { loginUser } from '../services/authService';
import { useAuthStore } from '../store/useAuthStore'; // Asegúrate que este useAuthStore esté actualizado sin WiFi en login
import styles, {
    COLOR_PRIMARY_BLUE,
    COLOR_PRIMARY_GREEN,
} from '../styles/loginStyles';

const logo = require('../assets/logo.png');

// --- Definición de Tipos ---
// --- 👇 Asegúrate que este tipo coincida con tu Stack Navigator principal 👇 ---
type StackParamList = {
    Login: undefined;
    Home: undefined; // O MainApp, dependiendo de tu navigator
    Register: undefined;
    ForgotPassword: undefined; // <-- AÑADIDO
};

type LoginScreenProps = NativeStackScreenProps<StackParamList, 'Login'>;

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
    // --- (Los estados del componente no cambian) ---
    const { login } = useAuthStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // --- Lógica de Login (asegúrate que 'login' en useAuthStore ya no pida ssid/pass) ---
    const handleLogin = async () => {
        if (!email || !password) {
            setError('Por favor, completa ambos campos.');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            const data = await loginUser({
                user_email: email,
                user_password: password
            });

            // Llama a login solo con token y refresh token
            login(data.access_token, data.refresh_token);

        } catch (err: any) {
            console.log('Error en login:', err);
            setError(err.message);
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
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <View style={styles.brandPanel}>
                    <Image source={logo} style={styles.loginLogo} />
                    <Text style={styles.brandTitle}>ECOWATT</Text>
                    <Text style={styles.brandSlogan}>Mide. Entiende. Ahorra.</Text>
                </View>

                <View style={styles.formPanel}>
                    <Text style={styles.formTitle}>Bienvenido de nuevo</Text>

                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    <View style={styles.inputContainer}>
                        <Icon name="user" size={20} color="#888" style={styles.inputIcon} />
                        <TextInput style={styles.input} placeholder="Correo Electrónico" placeholderTextColor="#888" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail}/>
                    </View>

                    <View style={styles.inputContainer}>
                        <Icon name="lock" size={20} color="#888" style={styles.inputIcon} />
                        <TextInput style={styles.input} placeholder="Contraseña" placeholderTextColor="#888" secureTextEntry={!isPasswordVisible} value={password} onChangeText={setPassword}/>
                        <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                           <Icon name={isPasswordVisible ? "eye-slash" : "eye"} size={20} color={COLOR_PRIMARY_GREEN} style={styles.eyeIcon}/>
                        </TouchableOpacity>
                    </View>

                    {/* --- 👇 MODIFICACIÓN AQUÍ 👇 --- */}
                    <TouchableOpacity
                        style={styles.forgotPassword}
                        onPress={() => navigation.navigate('ForgotPassword')} // Navega a la pantalla
                        disabled={isLoading} // Deshabilitado si está cargando
                    >
                        <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={isLoading}>
                        {isLoading ? ( <ActivityIndicator size="small" color="#FFFFFF" /> ) : ( <Text style={styles.loginButtonText}>INGRESAR</Text> )}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.registerButton} onPress={() => navigation.navigate('Register')} disabled={isLoading}>
                        <Text style={styles.registerButtonText}>REGISTRARSE</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
};

export default LoginScreen;