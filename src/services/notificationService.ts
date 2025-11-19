import messaging from '@react-native-firebase/messaging';
import { Alert, Platform, PermissionsAndroid } from 'react-native';

// URL base de tu backend
const API_URL = 'https://core-cloud.dev/api/v1';

/**
 * 1. Solicitar permisos (Maneja Android 13+ y iOS automáticamente)
 */
export async function requestNotificationPermission() {
  try {
    // Para Android 13+ (API 33) necesitamos pedir permiso explícito
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        console.log('❌ [FCM] Permiso de Android 13+ denegado');
        return false;
      }
    }

    // Para iOS y manejo general de Firebase
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('✅ [FCM] Permisos concedidos.');
      return true;
    } else {
      console.log('⚠️ [FCM] Permisos denegados por el usuario.');
      return false;
    }
  } catch (error) {
    console.error('❌ [FCM] Error pidiendo permisos:', error);
    return false;
  }
}

/**
 * 2. Obtener el Token FCM del celular
 */
export async function getFCMToken() {
  try {
    // En iOS es necesario registrarse primero en APNs
    if (Platform.OS === 'ios') {
        await messaging().registerDeviceForRemoteMessages();
    }
    
    const token = await messaging().getToken();
    console.log('📱 [FCM] Token generado:', token.substring(0, 15) + '...');
    return token;
  } catch (error) {
    console.error('❌ [FCM] Error obteniendo token:', error);
    return null;
  }
}

/**
 * 3. Enviar el token a TU Backend
 * Recibe deviceId y accessToken como argumentos (Más seguro y limpio)
 */
export async function registerFCMToken(deviceId: number, accessToken: string) {
  try {
    const fcmToken = await getFCMToken();
    if (!fcmToken) return;

    console.log(`📤 [API] Registrando token para dispositivo ID: ${deviceId}`);
    
    const response = await fetch(`${API_URL}/devices/${deviceId}/register-fcm`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fcm_token: fcmToken 
      }),
    });

    if (response.ok) {
      console.log('✅ [BACKEND] Notificaciones activadas correctamente.');
    } else {
      const text = await response.text();
      console.warn('⚠️ [BACKEND] Error al registrar:', text);
    }
  } catch (error) {
    console.error('❌ [BACKEND] Error de red:', error);
  }
}

/**
 * 4. Escuchar notificaciones mientras la app está abierta
 */
export function setupNotificationListeners() {
  // Cuando la app está abierta
  const unsubscribe = messaging().onMessage(async remoteMessage => {
    console.log('🔔 [FCM] Mensaje recibido en primer plano:', remoteMessage);
    Alert.alert(
      remoteMessage.notification?.title || 'Nueva Alerta EcoWatt',
      remoteMessage.notification?.body || 'Revisa tu consumo.'
    );
  });

  // Cuando la app se abre desde segundo plano
  messaging().onNotificationOpenedApp(remoteMessage => {
    console.log('🔔 [FCM] App abierta desde background:', remoteMessage);
  });

  // Cuando la app estaba totalmente cerrada y se abre
  messaging()
    .getInitialNotification()
    .then(remoteMessage => {
      if (remoteMessage) {
        console.log('🔔 [FCM] App iniciada por notificación:', remoteMessage);
      }
    });

  return unsubscribe;
}