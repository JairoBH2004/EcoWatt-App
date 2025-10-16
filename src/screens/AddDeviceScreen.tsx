import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  PermissionsAndroid,
  Platform
} from 'react-native';
import { BleManager, Device } from 'react-native-ble-plx';
import Icon from 'react-native-vector-icons/FontAwesome5';
import Zeroconf from 'react-native-zeroconf';
import { Buffer } from 'buffer'; // Para codificar base64

// --- Imports del proyecto ---
import styles from '../styles/AddDeviceStyles';
import { useAuthStore } from '../store/useAuthStore';
import { registerDevice } from '../services/authService';

type AddDeviceScreenProps = {
  navigation: {
    goBack: () => void;
  };
};

const bleManager = new BleManager();
const zeroconf = new Zeroconf();

type Step =
  | 'loading'
  | 'success'
  | 'error';

const AddDeviceScreen = ({ navigation }: AddDeviceScreenProps) => {
  const { token, wifiSsid, wifiPassword } = useAuthStore();
  const [currentStep, setCurrentStep] = useState<Step>('loading');
  const [loadingMessage, setLoadingMessage] = useState('Iniciando configuración automática...');
  const [error, setError] = useState('');
  const scanTimeoutRef = useRef<number | null>(null);
  const networkTimeoutRef = useRef<number | null>(null);
  const deviceFoundRef = useRef(false);

  useEffect(() => {
    if (!wifiSsid || !wifiPassword) {
      setError('No hay credenciales de Wi-Fi guardadas.');
      setCurrentStep('error');
      return;
    }
    startAutoSetup();

    return () => {
      try { bleManager.stopDeviceScan(); } catch {}
      try { zeroconf.stop(); } catch {}
      if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
      if (networkTimeoutRef.current) clearTimeout(networkTimeoutRef.current);
    };
  }, []);

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
          return (
            result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === 'granted' &&
            result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === 'granted' &&
            result[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === 'granted'
          );
        } else {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
          );
          return granted === 'granted';
        }
      } catch (e) {
        console.warn('Error permisos BLE', e);
        return false;
      }
    }
    return false;
  };

  const startAutoSetup = async () => {
    const hasPermission = await requestBluetoothPermission();
    if (!hasPermission) {
      setError('Permisos de Bluetooth y localización requeridos.');
      setCurrentStep('error');
      return;
    }

    setLoadingMessage('Buscando dispositivos Shelly cercanos...');
    deviceFoundRef.current = false;

    try { bleManager.stopDeviceScan(); } catch {}

    bleManager.startDeviceScan(null, null, async (err, device) => {
      if (err) {
        setError(`Error BLE: ${err?.message ?? String(err)}`);
        setCurrentStep('error');
        try { bleManager.stopDeviceScan(); } catch {}
        return;
      }

      if (!deviceFoundRef.current && device?.name?.toLowerCase().includes('shelly')) {
        deviceFoundRef.current = true;
        try { bleManager.stopDeviceScan(); } catch {}
        setLoadingMessage('Conectando al Shelly y enviando Wi-Fi...');
        await connectShellyAutomatically(device);
      }
    });

    scanTimeoutRef.current = (setTimeout(() => {
      if (!deviceFoundRef.current) {
        try { bleManager.stopDeviceScan(); } catch {}
        setError('No se encontró ningún Shelly cercano.');
        setCurrentStep('error');
      }
    }, 15000) as unknown) as number;
  };

  const connectShellyAutomatically = async (device: Device) => {
    try {
      const connectedDevice = await bleManager.connectToDevice(device.id, { timeout: 15000 });
      await connectedDevice.discoverAllServicesAndCharacteristics();

      const serviceUUID = '5f6d4f53-5f52-5043-5f53-56435f49445f';
      const characteristicUUID = '5f6d4f53-5f52-5043-5f64-6174615f5f5f';

      const rpcRequest = {
        jsonrpc: '2.0',
        id: 1,
        src: 'ecowatt-app',
        method: 'Shelly.SetConfig',
        params: { config: { wifi: { sta: { enable: true, ssid: wifiSsid, pass: wifiPassword } } } }
      };

      const encodedRpc = Buffer.from(JSON.stringify(rpcRequest), 'utf8').toString('base64');
      await connectedDevice.writeCharacteristicWithResponseForService(serviceUUID, characteristicUUID, encodedRpc);

      try { await connectedDevice.cancelConnection(); } catch {}

      setLoadingMessage('Buscando el Shelly en la red local...');
      findShellyOnNetwork();
    } catch (err: any) {
      console.warn('connectShellyAutomatically error', err);
      setError(`Error al configurar el Wi-Fi: ${err?.message ?? String(err)}`);
      setCurrentStep('error');
    }
  };

  const findShellyOnNetwork = () => {
    zeroconf.removeAllListeners();
    zeroconf.scan('http', 'tcp', 'local.');

    const onResolved = async (service: any) => {
      if (!service?.name?.toLowerCase().includes('shelly')) return;
      try { zeroconf.stop(); } catch {}
      const ip = Array.isArray(service.addresses) ? service.addresses[0] : undefined;
      if (!ip) return;

      setLoadingMessage(`Shelly encontrado en ${ip}, obteniendo info...`);
      try {
        const resp = await fetch(`http://${ip}/rpc/Shelly.GetDeviceInfo`);
        const data = await resp.json();
        if (data?.mac) {
          await registerDevice({ token, name: data.name || 'Shelly', mac: data.mac, ip });
          setCurrentStep('success');
        } else {
          throw new Error('Respuesta sin MAC');
        }
      } catch (e: any) {
        setError(`No se pudo registrar el Shelly: ${e?.message ?? String(e)}`);
        setCurrentStep('error');
      }
    };

    zeroconf.on('resolved', onResolved);

    networkTimeoutRef.current = (setTimeout(() => {
      try { zeroconf.stop(); } catch {}
      setError('No se pudo encontrar el Shelly en la red.');
      setCurrentStep('error');
    }, 60000) as unknown) as number;
  };

  const renderContent = () => {
    switch (currentStep) {
      case 'loading':
        return (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#00FF7F" />
            <Text style={styles.loadingText}>{loadingMessage}</Text>
          </View>
        );

      case 'success':
        return (
          <View style={styles.centered}>
            <Icon name="check-circle" size={80} color="#00FF7F" />
            <Text style={styles.successText}>¡Dispositivo configurado exitosamente!</Text>
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
