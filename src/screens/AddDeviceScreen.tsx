import React, { useState, useEffect } from 'react';
import {
  View, Text, ActivityIndicator, TouchableOpacity, SafeAreaView,
  PermissionsAndroid, Platform, FlatList,
  Modal, TextInput, Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import WifiManager from 'react-native-wifi-reborn';

import styles from '../styles/AddDeviceStyles';
import { useAuthStore } from '../store/useAuthStore';
import { registerDevice, getDevices } from '../services/authService';

type AddDeviceScreenProps = {
  navigation: { goBack: () => void; };
};

type ShellyNetwork = {
  SSID: string;
  BSSID: string;
  level: number;
};

type Step =
  | 'requestingPermissions'
  | 'scanningWifi'
  | 'deviceList'
  | 'connecting'
  | 'configuring'
  | 'success'
  | 'error'
  | 'idle';

const AddDeviceScreen = ({ navigation }: AddDeviceScreenProps) => {
  const { token, wifiSsid, wifiPassword, setWifiCredentials } = useAuthStore();
  
  const [currentStep, setCurrentStep] = useState<Step>('idle');
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState('');
  const [foundDevices, setFoundDevices] = useState<ShellyNetwork[]>([]);
  const [registeredMacs, setRegisteredMacs] = useState<Set<string>>(new Set());
  const [hasPermissions, setHasPermissions] = useState(false);

  const [isWifiModalVisible, setIsWifiModalVisible] = useState(false);
  const [tempSsid, setTempSsid] = useState('');
  const [tempPass, setTempPass] = useState('');

  const [selectedShellySSID, setSelectedShellySSID] = useState<string>('');
  const [userNetworkSSID, setUserNetworkSSID] = useState<string>('');

  useEffect(() => {
    initializeSetup();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, wifiSsid, wifiPassword]);

  const initializeSetup = async () => {
    if (!token) {
      setError('Faltan datos de sesión.');
      setCurrentStep('error');
      return;
    }

    // Si no hay WiFi guardado, mostrar modal
    if (!wifiSsid || !wifiPassword) {
      setIsWifiModalVisible(true);
      return;
    }

    // Cargar dispositivos registrados
    await loadRegisteredDevices();
    
    // Solicitar permisos
    await requestWifiPermissions();
  };

  const loadRegisteredDevices = async () => {
    try {
      const existingDevices = await getDevices(token!);
      const macs = new Set(existingDevices.map(d => d.dev_hardware_id.toUpperCase()));
      setRegisteredMacs(macs);
    } catch (err: any) {
      if (!err.message.includes('404')) {
        console.warn('Error cargando dispositivos:', err);
      }
      setRegisteredMacs(new Set());
    }
  };

  const requestWifiPermissions = async () => {
    if (Platform.OS !== 'android') {
      setHasPermissions(true);
      return;
    }

    setCurrentStep('requestingPermissions');
    setLoadingMessage('Solicitando permisos...');

    try {
      const apiLevel = Platform.Version as number;
      let permissions: Array<typeof PermissionsAndroid.PERMISSIONS[keyof typeof PermissionsAndroid.PERMISSIONS]> = [
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ];

      if (apiLevel >= 33) {
        // Para Android 13+, necesitamos NEARBY_WIFI_DEVICES
        permissions.push('android.permission.NEARBY_WIFI_DEVICES' as any);
      }

      const granted = await PermissionsAndroid.requestMultiple(permissions as any);
      
      const allGranted = Object.values(granted).every(
        permission => permission === PermissionsAndroid.RESULTS.GRANTED
      );

      if (allGranted) {
        console.log('✅ Permisos concedidos');
        setHasPermissions(true);
        // Después de obtener permisos, iniciar escaneo automáticamente
        await scanForShellyNetworks();
      } else {
        setError('Se requieren permisos de ubicación y WiFi para escanear redes.');
        setCurrentStep('error');
      }
    } catch (err: any) {
      console.error('Error solicitando permisos:', err);
      setError('Error al solicitar permisos: ' + err.message);
      setCurrentStep('error');
    }
  };

  const scanForShellyNetworks = async () => {
    if (!hasPermissions) {
      Alert.alert('Error', 'Se requieren permisos de ubicación y WiFi');
      return;
    }

    setCurrentStep('scanningWifi');
    setLoadingMessage('Buscando dispositivos Shelly cercanos...');
    setFoundDevices([]);

    try {
      // Guardar la red actual del usuario
      const currentSSID = await WifiManager.getCurrentWifiSSID();
      setUserNetworkSSID(currentSSID);
      console.log('📱 Red actual del usuario:', currentSSID);

      // Escanear redes WiFi disponibles
      const wifiList = await WifiManager.loadWifiList();
      console.log(`📡 Total de redes encontradas: ${wifiList.length}`);

      // Filtrar solo las redes Shelly
      const shellyNetworks = wifiList.filter((wifi: any) => {
        const ssid = wifi.SSID.toLowerCase();
        return ssid.startsWith('shelly') || 
               ssid.startsWith('shellypro') || 
               ssid.startsWith('shellyplus');
      });

      console.log(`✨ Dispositivos Shelly encontrados: ${shellyNetworks.length}`);
      
      if (shellyNetworks.length === 0) {
        setError(
          'No se encontraron dispositivos Shelly.\n\n' +
          'Asegúrate de que:\n' +
          '• El Shelly esté encendido\n' +
          '• El LED esté parpadeando (modo AP)\n' +
          '• Estés cerca del dispositivo\n' +
          '• El WiFi del teléfono esté activado'
        );
        setCurrentStep('error');
      } else {
        setFoundDevices(shellyNetworks);
        setCurrentStep('deviceList');
      }

    } catch (error: any) {
      console.error('❌ Error escaneando WiFi:', error);
      setError('Error al escanear redes WiFi: ' + error.message);
      setCurrentStep('error');
    }
  };

  const handleDeviceSelection = async (device: ShellyNetwork) => {
    Alert.alert(
      'Conectar a Shelly',
      `¿Deseas conectarte a "${device.SSID}"?\n\nLa app se conectará temporalmente a este dispositivo para configurarlo.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Conectar',
          onPress: () => connectToShelly(device)
        }
      ]
    );
  };

  const connectToShelly = async (device: ShellyNetwork) => {
    setCurrentStep('connecting');
    setLoadingMessage(`Conectando a ${device.SSID}...`);
    setSelectedShellySSID(device.SSID);

    try {
      console.log(`🔗 Intentando conectar a ${device.SSID}...`);
      
      // Conectar a la red Shelly (generalmente sin contraseña)
      await WifiManager.connectToProtectedSSID(
        device.SSID,
        '', // Sin contraseña por defecto
        false, // No es una red oculta
        false  // No es WEP
      );

      // Esperar a que se establezca la conexión
      setTimeout(async () => {
        try {
          const currentSSID = await WifiManager.getCurrentWifiSSID();
          console.log('📱 SSID actual:', currentSSID);
          
          if (currentSSID === device.SSID) {
            console.log('✅ Conectado exitosamente al Shelly');
            await configureShelly();
          } else {
            throw new Error('No se pudo conectar al dispositivo');
          }
        } catch (err: any) {
          setError('Error verificando conexión: ' + err.message);
          setCurrentStep('error');
        }
      }, 5000); // Esperar 5 segundos para que se estabilice la conexión

    } catch (error: any) {
      console.error('❌ Error conectando:', error);
      setError('No se pudo conectar al Shelly: ' + error.message);
      setCurrentStep('error');
    }
  };

  const configureShelly = async () => {
    setCurrentStep('configuring');
    setLoadingMessage('Configurando WiFi del Shelly...');

    try {
      console.log('⚙️ Configurando Shelly con WiFi:', wifiSsid);

      // La IP por defecto del Shelly en modo AP es 192.168.33.1
      const shellyIP = '192.168.33.1';
      
      // Primero obtener info del dispositivo
      console.log('📡 Obteniendo información del dispositivo...');
      const infoResponse = await fetch(`http://${shellyIP}/rpc/Shelly.GetDeviceInfo`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!infoResponse.ok) {
        throw new Error('No se pudo comunicar con el Shelly');
      }

      const deviceInfo = await infoResponse.json();
      console.log('📋 Info del dispositivo:', deviceInfo);

      // Configurar el WiFi del Shelly
      console.log('📡 Enviando configuración WiFi...');
      const configResponse = await fetch(`http://${shellyIP}/rpc/WiFi.SetConfig`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: {
            sta: {
              ssid: wifiSsid,
              pass: wifiPassword,
              enable: true,
            }
          }
        })
      });

      if (!configResponse.ok) {
        throw new Error('Error al configurar WiFi');
      }

      const configResult = await configResponse.json();
      console.log('✅ Configuración enviada:', configResult);

      // Reconectar a la red del usuario
      setLoadingMessage('Volviendo a tu red WiFi...');
      await reconnectToUserNetwork();

      // Esperar a que el Shelly se conecte a la red del usuario
      setLoadingMessage('Esperando a que el Shelly se conecte a tu red...');
      
      setTimeout(async () => {
        await registerShellyDevice(deviceInfo);
      }, 15000); // Esperar 15 segundos

    } catch (error: any) {
      console.error('❌ Error configurando Shelly:', error);
      setError('Error al configurar el Shelly: ' + error.message);
      setCurrentStep('error');
      
      // Intentar volver a la red del usuario
      await reconnectToUserNetwork();
    }
  };

  const reconnectToUserNetwork = async () => {
    try {
      if (userNetworkSSID) {
        console.log('🔄 Reconectando a red del usuario:', userNetworkSSID);
        await WifiManager.connectToProtectedSSID(
          userNetworkSSID,
          wifiPassword!,
          false,
          false
        );
        console.log('✅ Reconectado a red del usuario');
      }
    } catch (err) {
      console.warn('⚠️ No se pudo reconectar automáticamente a tu red:', err);
    }
  };

  const registerShellyDevice = async (deviceInfo: any) => {
    try {
      setLoadingMessage('Registrando dispositivo...');
      console.log('💾 Registrando dispositivo con MAC:', deviceInfo.mac);

      if (!token) {
        throw new Error('Usuario no autenticado');
      }

      await registerDevice(token, {
        name: deviceInfo.name || deviceInfo.id || 'Shelly',
        mac: deviceInfo.mac
      });

      console.log('✅ Dispositivo registrado exitosamente');
      setCurrentStep('success');
    } catch (error: any) {
      console.error('❌ Error registrando dispositivo:', error);
      setError('No se pudo registrar el dispositivo: ' + error.message);
      setCurrentStep('error');
    }
  };

  const handleSaveWifi = () => {
    if (!tempSsid || !tempPass) {
      Alert.alert('Error', 'Ambos campos son obligatorios.');
      return;
    }
    setWifiCredentials(tempSsid, tempPass);
    setIsWifiModalVisible(false);
  };

  const renderWifiModal = () => (
    <Modal
      visible={isWifiModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => navigation.goBack()}
    >
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Configurar WiFi</Text>
          <Text style={styles.modalSubtitle}>
            Ingresa los datos de tu red WiFi para que el dispositivo se conecte.
          </Text>
          
          <TextInput
            style={styles.modalInput}
            placeholder="Nombre de Red (SSID)"
            value={tempSsid}
            onChangeText={setTempSsid}
            placeholderTextColor="#888"
          />
          <TextInput
            style={styles.modalInput}
            placeholder="Contraseña de Red"
            value={tempPass}
            onChangeText={setTempPass}
            secureTextEntry
            placeholderTextColor="#888"
          />
          
          <TouchableOpacity style={styles.modalSaveButton} onPress={handleSaveWifi}>
            <Text style={styles.modalButtonText}>Guardar y Continuar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalCancelButton} onPress={() => navigation.goBack()}>
            <Text style={styles.modalCancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderContent = () => {
    if (isWifiModalVisible) {
      return null;
    }

    switch (currentStep) {
      case 'requestingPermissions':
      case 'scanningWifi':
      case 'connecting':
      case 'configuring':
        return (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#00FF7F" />
            <Text style={styles.loadingText}>{loadingMessage}</Text>
          </View>
        );
      
      case 'deviceList':
        return (
          <SafeAreaView style={{flex: 1, width: '100%'}}>
            <Text style={styles.listTitle}>Dispositivos Shelly Encontrados</Text>
            <FlatList
              data={foundDevices}
              keyExtractor={(item) => item.BSSID}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.deviceItem} 
                  onPress={() => handleDeviceSelection(item)}
                >
                  <Icon name="wifi" size={24} color="#00FF7F" />
                  <View style={styles.deviceInfo}>
                    <Text style={styles.deviceName}>{item.SSID}</Text>
                    <Text style={styles.deviceId}>Señal: {item.level} dBm</Text>
                  </View>
                  <Icon name="chevron-right" size={16} color="#00FF7F" />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.centered}>
                  <Icon name="sad-tear" size={40} color="#FF6347" />
                  <Text style={styles.errorText}>
                    No se encontraron dispositivos Shelly
                  </Text>
                </View>
              }
            />
            <TouchableOpacity 
              style={[styles.button, {marginBottom: 20}]} 
              onPress={scanForShellyNetworks}
            >
              <Text style={styles.buttonText}>🔄 Buscar de nuevo</Text>
            </TouchableOpacity>
          </SafeAreaView>
        );

      case 'success':
        return (
          <View style={styles.centered}>
            <Icon name="check-circle" size={80} color="#00FF7F" />
            <Text style={styles.successText}>¡Dispositivo configurado!</Text>
            <Text style={styles.loadingText}>
              Tu Shelly ahora está conectado a tu red WiFi
            </Text>
            <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
              <Text style={styles.buttonText}>Volver</Text>
            </TouchableOpacity>
          </View>
        );

      case 'error':
        return (
          <View style={styles.centered}>
            <Icon name="times-circle" size={80} color="#FF6347" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.button} 
              onPress={scanForShellyNetworks}
            >
              <Text style={styles.buttonText}>Intentar de nuevo</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, {backgroundColor: '#666', marginTop: 10}]} 
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.buttonText}>Volver</Text>
            </TouchableOpacity>
          </View>
        );
      
      case 'idle':
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderContent()}
      {renderWifiModal()}
    </SafeAreaView>
  );
};

export default AddDeviceScreen;