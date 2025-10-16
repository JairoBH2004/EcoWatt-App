import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, Alert,
    ActivityIndicator, TouchableOpacity, SafeAreaView, PermissionsAndroid, Platform
} from 'react-native';
import { BleManager, Device } from 'react-native-ble-plx';
import Icon from 'react-native-vector-icons/FontAwesome5';
import * as base64 from 'react-native-base64'; // <-- CORRECCIÓN #1

// --- Imports del proyecto ---
import styles from '../styles/AddDeviceStyles';
import { useAuthStore } from '../store/useAuthStore';
import { registerDevice } from '../services/authService'; // <-- CORRECCIÓN #2: Asegúrate de que este archivo esté guardado

// Simulación de props de navegación
type AddDeviceScreenProps = {
    navigation: {
        goBack: () => void;
    };
};

const bleManager = new BleManager();

type Step = 'start' | 'scanning' | 'wifi_form' | 'naming' | 'success' | 'error' | 'loading';

const AddDeviceScreen = ({ navigation }: AddDeviceScreenProps) => {
    const [currentStep, setCurrentStep] = useState<Step>('start');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [discoveredShellyBLE, setDiscoveredShellyBLE] = useState<Device | null>(null);
    const [wifiSsid, setWifiSsid] = useState('');
    const [wifiPassword, setWifiPassword] = useState('');
    const [deviceName, setDeviceName] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        return () => {
            bleManager.stopDeviceScan();
        };
    }, []);

    const requestBluetoothPermission = async () => {
        if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.requestMultiple([
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            ]);
            if (
                granted['android.permission.BLUETOOTH_SCAN'] !== 'granted' ||
                granted['android.permission.BLUETOOTH_CONNECT'] !== 'granted' ||
                granted['android.permission.ACCESS_FINE_LOCATION'] !== 'granted'
            ) {
                Alert.alert("Permisos requeridos", "Se necesitan permisos de Bluetooth y Ubicación para buscar dispositivos.");
                return false;
            }
        }
        return true;
    };

    const startBleScan = async () => {
        const hasPermission = await requestBluetoothPermission();
        if (!hasPermission) return;

        setCurrentStep('scanning');
        setLoadingMessage('Buscando dispositivos Shelly cercanos...');

        bleManager.startDeviceScan(null, null, (error, device) => {
            if (error) {
                setError(error.message);
                setCurrentStep('error');
                bleManager.stopDeviceScan();
                return;
            }
            if (device?.name?.toLowerCase().includes('shelly')) {
                bleManager.stopDeviceScan();
                setLoadingMessage(`¡Dispositivo encontrado: ${device.name}!`);
                setDiscoveredShellyBLE(device);
                setTimeout(() => {
                    setCurrentStep('wifi_form');
                }, 1500);
            }
        });

        setTimeout(() => {
            setCurrentStep(prevStep => {
                if (prevStep === 'scanning') {
                    bleManager.stopDeviceScan();
                    setError("No se encontraron dispositivos Shelly. Asegúrate de que esté encendido y cerca.");
                    return 'error';
                }
                return prevStep;
            });
        }, 30000);
    };

    const connectToWifi = async () => {
        if (!discoveredShellyBLE || !wifiSsid) {
            Alert.alert('Datos incompletos', 'No se ha encontrado un dispositivo o falta el nombre de la red Wi-Fi.');
            return;
        }

        setIsLoading(true);
        setLoadingMessage('Conectando al Shelly para configurar el Wi-Fi...');

        try {
            const device = await bleManager.connectToDevice(discoveredShellyBLE.id);
            setLoadingMessage('Conectado. Descubriendo servicios...');

            await device.discoverAllServicesAndCharacteristics();
            
            const serviceUUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
            const characteristicUUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8";

            const wifiConfig = JSON.stringify({
                config: { wifi: { sta: { enable: true, ssid: wifiSsid, pass: wifiPassword } } }
            });
            const encodedWifiConfig = base64.encode(wifiConfig);

            setLoadingMessage('Enviando credenciales de Wi-Fi...');
            await device.writeCharacteristicWithResponseForService(
                serviceUUID, characteristicUUID, encodedWifiConfig
            );

            setLoadingMessage('¡Credenciales enviadas! El Shelly se reiniciará.');
            await device.cancelConnection();

            setTimeout(() => {
                setIsLoading(false);
                Alert.alert("Simulación", "Ahora buscaríamos el Shelly en la red Wi-Fi.");
                setCurrentStep('naming');
            }, 4000);

        } catch (error: any) {
            setError(`Error al configurar el Wi-Fi: ${error.message}`);
            setCurrentStep('error');
            setIsLoading(false);
            if (discoveredShellyBLE) {
                bleManager.cancelDeviceConnection(discoveredShellyBLE.id);
            }
        }
    };
    
    const finishSetup = () => {
        setIsLoading(true);
        setLoadingMessage('Registrando dispositivo y finalizando...');
        setTimeout(() => {
            setIsLoading(false);
            setCurrentStep('success');
        }, 3000);
    };

    const renderContent = () => {
        if (isLoading || currentStep === 'scanning') {
            return (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#00FF7F" />
                    <Text style={styles.loadingText}>{loadingMessage}</Text>
                </View>
            );
        }

        switch (currentStep) {
            case 'start':
                return (
                    <View style={styles.centered}>
                        <Icon name="bluetooth-b" size={50} color="#00FF7F" />
                        <Text style={styles.title}>Añadir Nuevo Dispositivo</Text>
                        <Text style={styles.subtitle}>Asegúrate de que tu Shelly esté encendido y el Bluetooth de tu teléfono activado.</Text>
                        <TouchableOpacity style={styles.button} onPress={startBleScan}>
                            <Text style={styles.buttonText}>Comenzar Búsqueda</Text>
                        </TouchableOpacity>
                    </View>
                );
            case 'wifi_form':
                return (
                     <View>
                        <Icon name="wifi" size={50} color="#00FF7F" style={{alignSelf: 'center', marginBottom: 20}}/>
                        <Text style={styles.title}>Conectar a tu Wi-Fi</Text>
                        <Text style={styles.subtitle}>Ingresa las credenciales de la red a la que se conectará tu dispositivo.</Text>
                        <TextInput style={styles.input} placeholder="Nombre de la red (SSID)" placeholderTextColor="#888" onChangeText={setWifiSsid} />
                        <TextInput style={styles.input} placeholder="Contraseña de la red" placeholderTextColor="#888" secureTextEntry onChangeText={setWifiPassword} />
                        <TouchableOpacity style={styles.button} onPress={connectToWifi}>
                            <Text style={styles.buttonText}>Conectar</Text>
                        </TouchableOpacity>
                    </View>
                );
            case 'naming':
                return (
                     <View>
                        <Icon name="tag" size={50} color="#00FF7F" style={{alignSelf: 'center', marginBottom: 20}}/>
                        <Text style={styles.title}>¡Casi listo!</Text>
                        <Text style={styles.subtitle}>Dale un nombre a tu dispositivo para identificarlo fácilmente.</Text>
                        <TextInput style={styles.input} placeholder="Ej: Medidor Cocina" placeholderTextColor="#888" onChangeText={setDeviceName} />
                        <TouchableOpacity style={styles.button} onPress={finishSetup}>
                            <Text style={styles.buttonText}>Finalizar</Text>
                        </TouchableOpacity>
                    </View>
                );
            case 'success':
                 return (
                    <View style={styles.centered}>
                        <Icon name="check-circle" size={50} color="#00FF7F" solid/>
                        <Text style={styles.title}>¡Dispositivo Añadido!</Text>
                        <Text style={styles.subtitle}>"{deviceName || 'Tu Shelly'}" ya está listo para monitorear tu energía.</Text>
                        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
                            <Text style={styles.buttonText}>Volver al Inicio</Text>
                        </TouchableOpacity>
                    </View>
                );
            case 'error':
                 return (
                    <View style={styles.centered}>
                        <Icon name="times-circle" size={50} color="#E74C3C" solid/>
                        <Text style={styles.title}>Ocurrió un Error</Text>
                        <Text style={styles.subtitle}>{error}</Text>
                        <TouchableOpacity style={styles.button} onPress={() => { setError(''); setCurrentStep('start'); }}>
                            <Text style={styles.buttonText}>Reintentar</Text>
                        </TouchableOpacity>
                    </View>
                );
            default: return null;
        }
    };
    
    return <SafeAreaView style={styles.container}>{renderContent()}</SafeAreaView>;
};

export default AddDeviceScreen;