import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Alert
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/FontAwesome';
import LinearGradient from 'react-native-linear-gradient';

import { loginUser } from '../services/authService';
import { useAuthStore } from '../store/useAuthStore';
import styles, {
    COLOR_PRIMARY_BLUE,
    COLOR_PRIMARY_GREEN,
} from '../styles/loginStyles';

const logo = require('../assets/logo.png');

type StackParamList = {
    Login: undefined;
    Home: undefined; 
    Register: undefined;
    ForgotPassword: undefined;
};

type LoginScreenProps = NativeStackScreenProps<StackParamList, 'Login'>;

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
    const { login } = useAuthStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Por favor, completa ambos campos.');
            return;
        }
        setIsLoading(true);
        setError('');
        
        try {
            // 1. Petición al Backend
            const data = await loginUser({
                user_email: email,
                user_password: password
            });

            // 2. Guardar en Store (y navegar)
            login(data.access_token, data.refresh_token);
            
            // Nota: No llamamos a notificaciones aquí. 
            // El HomeScreen lo hará automáticamente al cargar.

        } catch (err: any) {
            console.log('Error en login:', err);
            setError(err.message || 'Error al iniciar sesión');
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
                        <TextInput 
                            style={styles.input} 
                            placeholder="Correo Electrónico" 
                            placeholderTextColor="#888" 
                            keyboardType="email-address" 
                            autoCapitalize="none" 
                            value={email} 
                            onChangeText={setEmail}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Icon name="lock" size={20} color="#888" style={styles.inputIcon} />
                        <TextInput
                          style={[
                            styles.input,
                            { color: '#000', fontFamily: undefined },
                          ]}
                          textAlignVertical="center"
                          placeholder="Contraseña"
                          placeholderTextColor="#888"
                          secureTextEntry={!isPasswordVisible}
                          value={password}
                          onChangeText={setPassword}
                        />
                        <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                           <Icon name={isPasswordVisible ? "eye-slash" : "eye"} size={20} color={COLOR_PRIMARY_GREEN} style={styles.eyeIcon}/>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={styles.forgotPassword}
                        onPress={() => navigation.navigate('ForgotPassword')}
                        disabled={isLoading}
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