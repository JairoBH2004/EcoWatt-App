/**
 * @format
 */

import {AppRegistry} from 'react-native';
// En tu foto se ve que tu App está dentro de src, así que dejamos esta línea igual:
import App from './src/App'; 
import {name as appName} from './app.json';

// 1. IMPORTAR MESSAGING
import messaging from '@react-native-firebase/messaging';

// 2. REGISTRAR EL MANEJADOR DE FONDO
// Esto es lo que permite recibir notificaciones con la app "matada"
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('💀 [FCM Background] Notificación recibida:', remoteMessage);
});

AppRegistry.registerComponent(appName, () => App);