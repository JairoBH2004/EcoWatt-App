import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ActivityIndicator, TouchableOpacity, SafeAreaView,
  PermissionsAndroid, Platform, FlatList,
  Modal, TextInput, Alert
} from 'react-native';
import { BleManager, Device as BleDevice } from 'react-native-ble-plx';
import Icon from 'react-native-vector-icons/FontAwesome5';
import Zeroconf from 'react-native-zeroconf';
import { Buffer } from 'buffer';

import styles from '../styles/AddDeviceStyles';
import { useAuthStore } from '../store/useAuthStore';
import { registerDevice, getDevices } from '../services/authService';

type AddDeviceScreenProps = {
  navigation: { goBack: () => void; };
};

const bleManager = new BleManager();
const zeroconf = new Zeroconf();

type Step =
  | 'loadingPrerequisites'
  | 'scanning'
  | 'deviceList'
  | 'configuring'
  | 'success'
  | 'error'
  | 'idle'; // Estado neutro para esperar el modal

const AddDeviceScreen = ({ navigation }: AddDeviceScreenProps) => {
  const { token, wifiSsid, wifiPassword, setWifiCredentials } = useAuthStore();
  
  // Inicia en 'idle' para no mostrar "Verificando..." inmediatamente
  const [currentStep, setCurrentStep] = useState<Step>('idle'); 
  const [loadingMessage, setLoadingMessage] = useState('Verificando tus dispositivos...');
  const [error, setError] = useState('');
  const [foundDevices, setFoundDevices] = useState<BleDevice[]>([]);
  const [registeredMacs, setRegisteredMacs] = useState<Set<string>>(new Set());

  const [isWifiModalVisible, setIsWifiModalVisible] = useState(false);
  const [tempSsid, setTempSsid] = useState('');
  const [tempPass, setTempPass] = useState('');

  const networkTimeoutRef = useRef<number | null>(null);
  const networkDeviceRegisteredRef = useRef(false);

  useEffect(() => {
    const initializeSetup = async () => {
      if (!token) {
        setError('Faltan datos de sesión.');
        setCurrentStep('error');
        return;
      }

      // Si no hay WiFi, muestra el modal y detente.
      // currentStep se queda en 'idle', por lo que no se muestra la carga.
      if (!wifiSsid || !wifiPassword) {
        setIsWifiModalVisible(true);
        return;
      }
      
      // Si hay WiFi, procede con la carga y escaneo.
      await loadAndScan();
    };

    const loadAndScan = async () => {
      setCurrentStep('loadingPrerequisites'); // Ahora sí ponemos la carga
      setLoadingMessage('Verificando tus dispositivos...');
      
      try {
        const existingDevices = await getDevices(token!);
        const macs = new Set(existingDevices.map(d => d.dev_hardware_id.toUpperCase()));
        setRegisteredMacs(macs);
      } catch (err: any) {
        if (!err.message.includes('404')) {
          setError('No se pudo verificar tus dispositivos existentes.');
          setCurrentStep('error');
          return;
        }
        // Si es 404 (sin dispositivos), está bien y continuamos
        setRegisteredMacs(new Set());
      }
      
      await startBleScan();
    };

    // Inicia el setup. El useEffect se re-ejecutará si wifiSsid o wifiPassword cambian.
    initializeSetup();

    // Función de limpieza
    return () => {
      bleManager.stopDeviceScan();
      zeroconf.stop();
      if (networkTimeoutRef.current) clearTimeout(networkTimeoutRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, wifiSsid, wifiPassword]); // Depende de estos valores

  // --- Función para guardar WiFi desde el modal ---
  const handleSaveWifi = () => {
    if (!tempSsid || !tempPass) {
      Alert.alert('Error', 'Ambos campos son obligatorios.');
      return;
    }
    setWifiCredentials(tempSsid, tempPass); 
    setIsWifiModalVisible(false);
    // Al cerrar, el useEffect se re-ejecuta, esta vez con credenciales,
    // y llamará a loadAndScan()
  };

  // --- (requestBluetoothPermission, startBleScan, handleDeviceSelection, connectShellyAndConfigure, findShellyOnNetwork ... ) ---
  // (Estas funciones van aquí sin cambios)
  const requestBluetoothPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'ios') return true;
    if (Platform.OS === 'android') {
        try {
            const ver = Number(Platform.Version);
            if (ver >= 31) {
                const result = await PermissionsAndroid.requestMultiple([
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                ]);
                return result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === 'granted' && result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === 'granted';
            } else {
                const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
                return granted === 'granted';
            }
        } catch (e) { console.warn(e); return false; }
    }
    return false;
  };
  
  const startBleScan = async () => {
    const hasPermission = await requestBluetoothPermission();
    if (!hasPermission) {
      setError('Se requieren permisos de Bluetooth y localización.');
      setCurrentStep('error');
      return;
    }

    setCurrentStep('scanning');
    setLoadingMessage('Buscando nuevos dispositivos Shelly...');
    setFoundDevices([]);

    bleManager.startDeviceScan(null, null, (err, device) => {
      if (err) {
        setError('Error al escanear dispositivos.');
        setCurrentStep('error');
        bleManager.stopDeviceScan();
        return;
      }

      if (device?.name?.toLowerCase().includes('shelly')) {
        const deviceMac = device.id.toUpperCase();
        if (!registeredMacs.has(deviceMac)) {
          setFoundDevices(prev => {
            if (!prev.some(d => d.id === device.id)) {
              return [...prev, device];
            }
            return prev;
          });
        }
      }
    });

    setTimeout(() => {
      bleManager.stopDeviceScan();
      setCurrentStep('deviceList');
    }, 10000);
  };
  
  const handleDeviceSelection = async (device: BleDevice) => {
    setCurrentStep('configuring');
    setLoadingMessage(`Configurando ${device.name}...`);
    await connectShellyAndConfigure(device);
  };

  const connectShellyAndConfigure = async (device: BleDevice) => {
    try {
      const connectedDevice = await bleManager.connectToDevice(device.id, { timeout: 15000 });
      await connectedDevice.discoverAllServicesAndCharacteristics();

      const serviceUUID = '5f6d4f53-5f52-5043-5f53-56435f49445f';
      const characteristicUUID = '5f6d4f53-5f52-5043-5f64-6174615f5f5f';

      const rpcRequest = { jsonrpc: '2.0', id: 1, src: 'ecowatt-app', method: 'Shelly.SetConfig', params: { config: { wifi: { sta: { enable: true, ssid: wifiSsid, pass: wifiPassword } } } } };
      const encodedRpc = Buffer.from(JSON.stringify(rpcRequest), 'utf8').toString('base64');
      await connectedDevice.writeCharacteristicWithResponseForService(serviceUUID, characteristicUUID, encodedRpc);

      await connectedDevice.cancelConnection();
      setLoadingMessage('Buscando el Shelly en la red local...');
      findShellyOnNetwork();
    } catch (err: any) {
      setError(`Error al configurar el Wi-Fi: ${err?.message ?? String(err)}`);
      setCurrentStep('error');
    }
  };

  const findShellyOnNetwork = () => {
    zeroconf.removeAllListeners();
    zeroconf.scan('http', 'tcp', 'local.');
    networkDeviceRegisteredRef.current = false;
    
    const onResolved = async (service: any) => {
      if (networkDeviceRegisteredRef.current || !service?.name?.toLowerCase().includes('shelly')) return;
      networkDeviceRegisteredRef.current = true;
      zeroconf.stop();

      const ip = Array.isArray(service.addresses) ? service.addresses[0] : undefined;
      if (!ip) return;

      setLoadingMessage(`Shelly encontrado en ${ip}, registrando...`);
      try {
        const resp = await fetch(`http://${ip}/rpc/Shelly.GetDeviceInfo`);
        const data = await resp.json();

        if (!token) throw new Error('Usuario no autenticado.');
        
        if (data?.mac) {
          await registerDevice(token, { name: data.name || 'Shelly', mac: data.mac });
          setCurrentStep('success');
        } else {
          throw new Error('La respuesta del dispositivo no contiene MAC.');
        }
      } catch (e: any) {
        setError(`No se pudo registrar el Shelly: ${e?.message ?? String(e)}`);
        setCurrentStep('error');
      }
    };
    zeroconf.on('resolved', onResolved);

    networkTimeoutRef.current = (setTimeout(() => {
        if (!networkDeviceRegisteredRef.current) {
            zeroconf.stop();
            setError('No se pudo encontrar el Shelly en la red.');
            setCurrentStep('error');
        }
    }, 60000) as unknown) as number;
  };
  // --- FIN de funciones sin cambios ---


  // --- Función para renderizar el Modal ---
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

  // --- Función para renderizar el contenido principal ---
  const renderContent = () => {
    // Si el modal está visible, no renderices NADA más.
    // El fondo de la pantalla (de styles.container) se verá, y el modal encima.
    if (isWifiModalVisible) {
        return null;
    }

    switch (currentStep) {
      case 'loadingPrerequisites':
      case 'scanning':
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
              <Text style={styles.listTitle}>Nuevos Dispositivos Encontrados</Text>
              <FlatList
                data={foundDevices}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.deviceItem} onPress={() => handleDeviceSelection(item)}>
                    <Icon name="microchip" size={24} color="#00FF7F" />
                    <View style={styles.deviceInfo}>
                        <Text style={styles.deviceName}>{item.name || 'Dispositivo Shelly'}</Text>
                        <Text style={styles.deviceId}>{item.id}</Text>
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <View style={styles.centered}>
                        <Icon name="sad-tear" size={40} color="#FF6347" />
                        <Text style={styles.errorText}>No se encontraron nuevos dispositivos Shelly. Asegúrate de que estén encendidos y cerca de ti.</Text>
                    </View>
                }
              />
            </SafeAreaView>
        );

      case 'success':
        return (
          <View style={styles.centered}>
            <Icon name="check-circle" size={80} color="#00FF7F" />
            <Text style={styles.successText}>¡Dispositivo configurado!</Text>
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
            <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
              <Text style={styles.buttonText}>Volver</Text>
            </TouchableOpacity>
          </View>
        );
      
      // El estado 'idle' (mientras espera el modal) no muestra nada
      case 'idle':
      default:
        return null;
    }
  };

  return (
    // SafeAreaView envuelve todo
    <SafeAreaView style={styles.container}>
      {/* El contenido (carga, lista, error) se renderiza aquí */}
      {renderContent()}
      
      {/* El modal se renderiza al mismo nivel, por encima del contenido */}
      {renderWifiModal()} 
    </SafeAreaView>
  );
};

export default AddDeviceScreen;