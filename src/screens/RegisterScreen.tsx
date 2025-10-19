import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/FontAwesome'; 
import LinearGradient from 'react-native-linear-gradient'; 

import { registerUser } from '../services/authService'; 
import registerStyles from '../styles/RegisterStyles';
import { COLOR_PRIMARY_GREEN } from '../styles/loginStyles';

const logo = require('../assets/logo.png');

type StackParamList = {
    Login: undefined; 
    Register: undefined; 
    Home: undefined;
};
type RegisterScreenProps = NativeStackScreenProps<StackParamList, 'Register'>;

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
    // --- 1. AJUSTAMOS LOS ESTADOS ---
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    // const [cfeTariff, setCfeTariff] = useState(''); // <-- YA NO SE NECESITA
    const [cutDay, setCutDay] = useState('');
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    // --- 2. ACTUALIZAMOS LA LÓGICA DE REGISTRO ---
    const handleRegister = async () => {
        // Actualizamos la validación
        if (!name || !email || !password || !cutDay) { // <-- Se quita la tarifa
            setError('Todos los campos son obligatorios.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
           // --- ¡AQUÍ ESTÁ LA CORRECCIÓN! ---
            // Usamos los nombres de campo que la API espera.
            await registerUser({
                user_name: name,
                user_email: email,
                user_password: password,
                user_trf_rate: '1f',
                user_billing_day: parseInt(cutDay, 10),
            });
            Alert.alert(
                '¡Registro Exitoso!',
                'Tu cuenta ha sido creada. Ahora puedes iniciar sesión.',
                [{ text: 'OK', onPress: () => navigation.navigate('Login' as never) }]
            );

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={['#003366', '#66CC66']}
            style={registerStyles.fullScreenBackground} 
            start={{ x: 0, y: 0 }} 
            end={{ x: 1, y: 1 }} 
        >
            <ScrollView 
                contentContainerStyle={registerStyles.scrollContainer}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* ... (Logo y Marca se quedan igual) ... */}
                <View style={registerStyles.brandPanel}> 
                    <Image source={logo} style={registerStyles.loginLogo} />
                    <Text style={registerStyles.brandTitle}>ECOWATT</Text>
                    <Text style={registerStyles.brandSlogan}>Crea tu cuenta de ahorro.</Text>
                </View>

                <View style={registerStyles.formPanel}>
                    <Text style={registerStyles.formTitle}>Registro de Usuario</Text>
                    
                    {error ? <Text style={registerStyles.errorText}>{error}</Text> : null}

                    {/* ... (Campos de Nombre, Email y Contraseña se quedan igual) ... */}
                    <View style={registerStyles.inputContainer}>
                        <Icon name="user-plus" size={20} color="#888" style={registerStyles.inputIcon} />
                        <TextInput style={registerStyles.input} placeholder="Nombre Completo" placeholderTextColor="#888" onChangeText={setName} value={name} />
                    </View>
                    <View style={registerStyles.inputContainer}>
                        <Icon name="envelope" size={20} color="#888" style={registerStyles.inputIcon} />
                        <TextInput style={registerStyles.input} placeholder="Correo Electrónico" placeholderTextColor="#888" keyboardType="email-address" autoCapitalize="none" onChangeText={setEmail} value={email}/>
                    </View>
                    <View style={registerStyles.inputContainer}>
                        <Icon name="lock" size={20} color="#888" style={registerStyles.inputIcon} />
                        <TextInput style={registerStyles.input} placeholder="Contraseña" placeholderTextColor="#888" secureTextEntry={!isPasswordVisible} onChangeText={setPassword} value={password}/>
                        <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                            <Icon name={isPasswordVisible ? 'eye-slash' : 'eye'} size={20} color={COLOR_PRIMARY_GREEN} style={registerStyles.eyeIcon} />
                        </TouchableOpacity>
                    </View>

                    {/* --- 3. ELIMINAMOS EL CAMPO DE TARIFA DEL FORMULARIO --- */}
                    {/* El campo de Tarifa CFE ya no es visible para el usuario */}

                    {/* Campo: Día de Corte */}
                    <View style={registerStyles.inputContainer}>
                        <Icon name="calendar" size={20} color="#888" style={registerStyles.inputIcon} />
                        <TextInput style={registerStyles.input} placeholder="Día de Corte (1-31)" placeholderTextColor="#888" keyboardType="numeric" maxLength={2} onChangeText={setCutDay} value={cutDay} />
                    </View>

                    {/* ... (Botones se quedan igual) ... */}
                    <TouchableOpacity style={registerStyles.loginButton} onPress={handleRegister} disabled={isLoading}>
                        {isLoading ? ( <ActivityIndicator size="small" color="#FFFFFF" /> ) : ( <Text style={registerStyles.loginButtonText}>CREAR CUENTA</Text> )}
                    </TouchableOpacity>
                    <TouchableOpacity style={{ marginTop: 15 }} onPress={() => navigation.navigate('Login' as never)}>
                        <Text style={registerStyles.forgotPasswordText}>Ya tengo cuenta, Iniciar Sesión</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </LinearGradient>
    );
};

export default RegisterScreen;