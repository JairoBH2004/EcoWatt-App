import React, { useState, useEffect } from 'react';
import {
  View, Text, ActivityIndicator, TouchableOpacity, SafeAreaView,
  PermissionsAndroid, Platform, FlatList, Modal, TextInput, Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import WifiManager from 'react-native-wifi-reborn';

import styles from '../styles/AddDeviceStyles';
import { useAuthStore } from '../store/useAuthStore';
import { registerDevice, getDevices } from '../services/authService';

type AddDeviceScreenProps = {
  navigation: { goBack: () => void };
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
      setError('Falta token de sesión. Por favor inicia sesión nuevamente.');
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
      const macs = new Set(
        existingDevices.map(d => d.dev_hardware_id.toUpperCase())
      );
      setRegisteredMacs(macs);
      console.log(`📋 Dispositivos registrados: ${macs.size}`);
    } catch (err: any) {
      console.warn('⚠️ Error cargando dispositivos:', err.message);
      setRegisteredMacs(new Set());
    }
  };

  const requestWifiPermissions = async () => {
    if (Platform.OS !== 'android') {
      setHasPermissions(true);
      await scanForShellyNetworks();
      return;
    }

    setCurrentStep('requestingPermissions');
    setLoadingMessage('Solicitando permisos de WiFi y ubicación...');

    try {
      const apiLevel = Platform.Version as number;
      let permissions: any[] = [
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ];

      if (apiLevel >= 33) {
        permissions.push('android.permission.NEARBY_WIFI_DEVICES' as any);
      }

      const granted = await PermissionsAndroid.requestMultiple(permissions);
      
      const allGranted = Object.values(granted).every(
        permission => permission === PermissionsAndroid.RESULTS.GRANTED
      );

      if (allGranted) {
        console.log('✅ Permisos concedidos');
        setHasPermissions(true);
        await scanForShellyNetworks();
      } else {
        setError(
          'Se requieren permisos de ubicación y WiFi para escanear redes cercanas.\n\n' +
          'Por favor, habilítalos en la configuración de la app.'
        );
        setCurrentStep('error');
      }
    } catch (err: any) {
      console.error('❌ Error solicitando permisos:', err);
      setError('Error al solicitar permisos: ' + err.message);
      setCurrentStep('error');
    }
  };

  const scanForShellyNetworks = async () => {
    if (!hasPermissions && Platform.OS === 'android') {
      Alert.alert('Error', 'Se requieren permisos de WiFi');
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
      console.log(`🔡 Total de redes encontradas: ${wifiList.length}`);

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

  /**
   * Extrae la MAC del SSID del Shelly
   * Ejemplo: "shellyplus1pm-A1B2C3D4E5F6" -> "A1B2C3D4E5F6"
   */
  const extractMacFromSSID = (ssid: string): string | null => {
    const macMatch = ssid.match(/[A-Fa-f0-9]{12}$/);
    return macMatch ? macMatch[0].toUpperCase() : null;
  };

  const handleDeviceSelection = async (device: ShellyNetwork) => {
    // Extraer MAC del SSID
    const deviceMac = extractMacFromSSID(device.SSID);

    // Validar si ya está registrado
    if (deviceMac && registeredMacs.has(deviceMac)) {
      Alert.alert(
        'Dispositivo Ya Registrado',
        `Este Shelly ya está en tu cuenta.\n\nMAC: ${deviceMac}`,
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Conectar a Shelly',
      `¿Deseas conectarte a "${device.SSID}"?\n\n` +
      `La app se conectará temporalmente a este dispositivo para configurarlo con tu WiFi.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Conectar',
          onPress: () => connectToShelly(device)
        }
      ]
    );
  };

  /**
   * Verifica la conexión WiFi actual
   */
  const verifyConnection = async (
    targetSSID: string, 
    maxAttempts = 10
  ): Promise<boolean> => {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const currentSSID = await WifiManager.getCurrentWifiSSID();
        console.log(`🔍 Intento ${i + 1}: SSID actual = ${currentSSID}`);
        
        if (currentSSID === targetSSID) {
          console.log('✅ Conexión verificada');
          return true;
        }
        
        // Esperar 1 segundo antes del próximo intento
        await new Promise<void>((resolve) => {
          setTimeout(() => resolve(), 1000);
        });
      } catch (error) {
        console.warn('⚠️ Error verificando SSID:', error);
      }
    }
    
    return false;
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

      // Verificar que la conexión se estableció
      const connected = await verifyConnection(device.SSID);
      
      if (connected) {
        console.log('✅ Conectado exitosamente al Shelly');
        await configureShelly();
      } else {
        throw new Error('No se pudo establecer conexión con el dispositivo');
      }

    } catch (error: any) {
      console.error('❌ Error conectando:', error);
      setError(
        'No se pudo conectar al Shelly.\n\n' +
        'Asegúrate de que:\n' +
        '• El dispositivo esté en modo AP (LED parpadeando)\n' +
        '• Estés cerca del Shelly\n' +
        '• El WiFi de tu teléfono esté activado'
      );
      setCurrentStep('error');
    }
  };

  const configureShelly = async () => {
    setCurrentStep('configuring');
    setLoadingMessage('Obteniendo información del Shelly...');

    try {
      console.log('⚙️ Configurando Shelly con WiFi:', wifiSsid);

      // La IP por defecto del Shelly en modo AP es 192.168.33.1
      const shellyIP = '192.168.33.1';
      const timeout = 10000; // 10 segundos
      
      // 1. Obtener info del dispositivo
      console.log('📡 Obteniendo información del dispositivo...');
      const infoController = new AbortController();
      const infoTimeoutId = setTimeout(() => infoController.abort(), timeout);

      const infoResponse = await fetch(`http://${shellyIP}/rpc/Shelly.GetDeviceInfo`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: infoController.signal,
      });
      clearTimeout(infoTimeoutId);

      if (!infoResponse.ok) {
        throw new Error('No se pudo comunicar con el Shelly');
      }

      const deviceInfo = await infoResponse.json();
      console.log('📋 Info del dispositivo:', {
        id: deviceInfo.id,
        name: deviceInfo.name,
        mac: deviceInfo.mac,
        model: deviceInfo.model,
        fw_id: deviceInfo.fw_id,
      });

      // 2. Configurar el WiFi del Shelly
      setLoadingMessage('Configurando WiFi del Shelly...');
      console.log('🔧 Enviando configuración WiFi...');
      
      const configController = new AbortController();
      const configTimeoutId = setTimeout(() => configController.abort(), timeout);

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
        }),
        signal: configController.signal,
      });
      clearTimeout(configTimeoutId);

      if (!configResponse.ok) {
        throw new Error('Error al configurar WiFi del Shelly');
      }

      const configResult = await configResponse.json();
      console.log('✅ Configuración aplicada:', configResult);

      // 3. Reiniciar el Shelly si es necesario
      if (configResult.restart_required) {
        setLoadingMessage('Reiniciando Shelly...');
        console.log('🔄 Reiniciando Shelly para aplicar cambios...');
        
        try {
          await fetch(`http://${shellyIP}/rpc/Shelly.Reboot`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });
        } catch (rebootError) {
          // El reboot puede causar que la conexión se pierda, es normal
          console.log('⚠️ Reboot iniciado (conexión perdida es esperado)');
        }
      }

      // 4. Reconectar a la red del usuario
      setLoadingMessage('Volviendo a tu red WiFi...');
      await reconnectToUserNetwork();

      // 5. Esperar a que el Shelly se conecte a la red del usuario
      setLoadingMessage('Esperando a que el Shelly se conecte a tu red...');
      console.log('⏳ Esperando 20 segundos para que el Shelly se conecte...');
      
      await new Promise<void>((resolve) => {
        setTimeout(() => resolve(), 20000);
      });

      // 6. Registrar dispositivo en el backend
      await registerShellyDevice(deviceInfo);

    } catch (error: any) {
      console.error('❌ Error configurando Shelly:', error);
      
      if (error.name === 'AbortError') {
        setError('Timeout: El Shelly no respondió a tiempo.\n\nIntenta de nuevo más cerca del dispositivo.');
      } else {
        setError('Error al configurar el Shelly: ' + error.message);
      }
      
      setCurrentStep('error');
      await reconnectToUserNetwork();
    }
  };

  const reconnectToUserNetwork = async () => {
    try {
      if (userNetworkSSID && wifiPassword) {
        console.log('🔄 Reconectando a red del usuario:', userNetworkSSID);
        
        await WifiManager.connectToProtectedSSID(
          userNetworkSSID,
          wifiPassword,
          false,
          false
        );
        
        // Verificar reconexión
        const reconnected = await verifyConnection(userNetworkSSID, 5);
        
        if (reconnected) {
          console.log('✅ Reconectado a red del usuario');
        } else {
          console.warn('⚠️ No se pudo verificar reconexión automática');
        }
      }
    } catch (err) {
      console.warn('⚠️ No se pudo reconectar automáticamente a tu red:', err);
      Alert.alert(
        'Reconectar Manualmente',
        `Por favor, reconéctate manualmente a tu red WiFi: ${userNetworkSSID}`
      );
    }
  };

  const registerShellyDevice = async (deviceInfo: any) => {
    try {
      setLoadingMessage('Registrando dispositivo en EcoWatt...');
      console.log('💾 Registrando dispositivo con MAC:', deviceInfo.mac);

      if (!token) {
        throw new Error('Usuario no autenticado');
      }

      // Registrar en el backend
      const registeredDevice = await registerDevice(token, {
        name: deviceInfo.name || deviceInfo.id || 'Shelly',
        mac: deviceInfo.mac
      });

      console.log('✅ Dispositivo registrado exitosamente:', registeredDevice);
      setCurrentStep('success');

    } catch (error: any) {
      console.error('❌ Error registrando dispositivo:', error);
      setError(
        'El Shelly se configuró correctamente pero hubo un error al registrarlo en EcoWatt.\n\n' +
        error.message
      );
      setCurrentStep('error');
    }
  };

  const handleSaveWifi = () => {
    if (!tempSsid || !tempPass) {
      Alert.alert('Campos Incompletos', 'Por favor ingresa el nombre y contraseña de tu red WiFi.');
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
          <Icon name="wifi" size={50} color="#00FF7F" style={{marginBottom: 20}} />
          <Text style={styles.modalTitle}>Configurar WiFi</Text>
          <Text style={styles.modalSubtitle}>
            Ingresa los datos de tu red WiFi para que los dispositivos Shelly se conecten.
          </Text>
          
          <TextInput
            style={styles.modalInput}
            placeholder="Nombre de Red (SSID)"
            value={tempSsid}
            onChangeText={setTempSsid}
            placeholderTextColor="#888"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            style={styles.modalInput}
            placeholder="Contraseña de Red"
            value={tempPass}
            onChangeText={setTempPass}
            secureTextEntry
            placeholderTextColor="#888"
            autoCapitalize="none"
            autoCorrect={false}
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
            {currentStep === 'configuring' && (
              <Text style={[styles.loadingText, {fontSize: 14, marginTop: 10, color: '#888'}]}>
                Esto puede tardar hasta 30 segundos...
              </Text>
            )}
          </View>
        );
      
      case 'deviceList':
        return (
          <SafeAreaView style={{flex: 1, width: '100%'}}>
            <View style={{alignItems: 'center', marginTop: 20, marginBottom: 10}}>
              <Icon name="broadcast-tower" size={40} color="#00FF7F" />
            </View>
            <Text style={styles.listTitle}>Dispositivos Shelly Encontrados</Text>
            <Text style={[styles.modalSubtitle, {marginBottom: 20, paddingHorizontal: 20}]}>
              Toca un dispositivo para configurarlo
            </Text>
            
            <FlatList
              data={foundDevices}
              keyExtractor={(item) => item.BSSID}
              renderItem={({ item }) => {
                const deviceMac = extractMacFromSSID(item.SSID);
                const isRegistered = deviceMac ? registeredMacs.has(deviceMac) : false;
                
                return (
                  <TouchableOpacity 
                    style={[
                      styles.deviceItem,
                      isRegistered && {opacity: 0.5, borderColor: '#666'}
                    ]} 
                    onPress={() => handleDeviceSelection(item)}
                    disabled={isRegistered}
                  >
                    <Icon 
                      name={isRegistered ? "check-circle" : "wifi"} 
                      size={24} 
                      color={isRegistered ? "#888" : "#00FF7F"} 
                    />
                    <View style={styles.deviceInfo}>
                      <Text style={styles.deviceName}>
                        {item.SSID}
                        {isRegistered && " (Registrado)"}
                      </Text>
                      <Text style={styles.deviceId}>
                        Señal: {item.level} dBm
                        {deviceMac && ` • MAC: ${deviceMac}`}
                      </Text>
                    </View>
                    {!isRegistered && (
                      <Icon name="chevron-right" size={16} color="#00FF7F" />
                    )}
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={{paddingHorizontal: 20}}
            />
            
            <View style={{padding: 20}}>
              <TouchableOpacity 
                style={styles.button} 
                onPress={scanForShellyNetworks}
              >
                <Icon name="sync-alt" size={16} color="#0A192F" style={{marginRight: 8}} />
                <Text style={styles.buttonText}>Buscar de Nuevo</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        );

      case 'success':
        return (
          <View style={styles.centered}>
            <Icon name="check-circle" size={80} color="#00FF7F" />
            <Text style={styles.successText}>¡Dispositivo Configurado!</Text>
            <Text style={styles.loadingText}>
              Tu Shelly ahora está conectado a tu red WiFi y registrado en EcoWatt.
            </Text>
            <Text style={[styles.loadingText, {fontSize: 14, marginTop: 10, color: '#888'}]}>
              Comenzará a enviar datos de consumo en unos minutos.
            </Text>
            <TouchableOpacity style={[styles.button, {marginTop: 30}]} onPress={() => navigation.goBack()}>
              <Text style={styles.buttonText}>Volver al Inicio</Text>
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
              <Text style={styles.buttonText}>Intentar de Nuevo</Text>
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