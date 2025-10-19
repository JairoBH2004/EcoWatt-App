import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ActivityIndicator, TouchableOpacity, SafeAreaView,
  PermissionsAndroid, Platform, FlatList
} from 'react-native';
import { BleManager, Device as BleDevice } from 'react-native-ble-plx';
import Icon from 'react-native-vector-icons/FontAwesome5';
import Zeroconf from 'react-native-zeroconf';
import { Buffer } from 'buffer';

import styles from '../styles/AddDeviceStyles';
import { useAuthStore } from '../store/useAuthStore';
// ✅ **PASO 1: Importamos 'getDevices' para obtener los dispositivos existentes**
import { registerDevice, getDevices } from '../services/authService';

type AddDeviceScreenProps = {
  navigation: { goBack: () => void; };
};

const bleManager = new BleManager();
const zeroconf = new Zeroconf();

// Definimos los posibles estados de la pantalla
type Step =
  | 'loadingPrerequisites' // Cargando dispositivos existentes
  | 'scanning'             // Buscando dispositivos BLE
  | 'deviceList'           // Mostrando la lista de dispositivos encontrados
  | 'configuring'          // Conectando y configurando el dispositivo seleccionado
  | 'success'
  | 'error';

const AddDeviceScreen = ({ navigation }: AddDeviceScreenProps) => {
  const { token, wifiSsid, wifiPassword } = useAuthStore();
  const [currentStep, setCurrentStep] = useState<Step>('loadingPrerequisites');
  const [loadingMessage, setLoadingMessage] = useState('Verificando tus dispositivos...');
  const [error, setError] = useState('');

  // ✅ **PASO 2: Nuevos estados para manejar la lista y el escaneo**
  const [foundDevices, setFoundDevices] = useState<BleDevice[]>([]);
  const [registeredMacs, setRegisteredMacs] = useState<Set<string>>(new Set());

  // Refs para timeouts (sin cambios)
  const networkTimeoutRef = useRef<number | null>(null);
  const networkDeviceRegisteredRef = useRef(false);

  useEffect(() => {
    // Función inicial que carga los dispositivos existentes y luego inicia el escaneo
    const loadAndScan = async () => {
      if (!token || !wifiSsid || !wifiPassword) {
        setError('Faltan datos de sesión o Wi-Fi.');
        setCurrentStep('error');
        return;
      }

      // ✅ **PASO 3: Obtener la lista de dispositivos ya registrados**
      try {
        const existingDevices = await getDevices(token);
        const macs = new Set(existingDevices.map(d => d.dev_hardware_id.toUpperCase()));
        setRegisteredMacs(macs);
      } catch (err: any) {
        // Si da un 404 es porque el usuario es nuevo, no es un error real.
        if (!err.message.includes('404')) {
          setError('No se pudo verificar tus dispositivos existentes.');
          setCurrentStep('error');
          return;
        }
      }
      
      // Una vez que tenemos la lista, iniciamos el escaneo
      await startBleScan();
    };

    loadAndScan();

    return () => {
      bleManager.stopDeviceScan();
      zeroconf.stop();
      if (networkTimeoutRef.current) clearTimeout(networkTimeoutRef.current);
    };
  }, []);

  const requestBluetoothPermission = async (): Promise<boolean> => {
    // ... (Esta función no necesita cambios)
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

      // ✅ **PASO 4: La lógica de filtrado**
      if (device?.name?.toLowerCase().includes('shelly')) {
        // NOTA: En Android, device.id es la dirección MAC. En iOS es un UUID.
        // Esta implementación funciona mejor en Android.
        const deviceMac = device.id.toUpperCase();

        // Si la MAC del dispositivo NO está en nuestra lista de registrados, es nuevo.
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

    // Detenemos el escaneo después de 10 segundos y mostramos la lista.
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
    // ... (Esta función ahora se llama 'connectShellyAndConfigure' y no tiene cambios en su lógica interna)
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
    // ... (Esta función no necesita cambios)
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

  const renderContent = () => {
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

      default:
        return null;
    }
  };

  return <SafeAreaView style={styles.container}>{renderContent()}</SafeAreaView>;
};

export default AddDeviceScreen;