import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
// --- 👇 1. IMPORTAMOS EL NUEVO SERVICIO ---
import { initializeNotificationService } from '../services/notificationService'; 
import { logoutUser } from '../services/authService'; // <--- CORREGIDO (Simulación movida a authService)

// --- Interfaz de AuthState ---
interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  refreshToken: string | null;
  wifiSsid: string | null;
  wifiPassword: string | null;
  hasDevices: boolean; // <--- AÑADIDO

  login: (accessToken: string, refreshToken: string) => void;
  logout: () => Promise<void>;
  setWifiCredentials: (ssid: string, password: string) => void; 
  setHasDevices: (status: boolean) => void; // <--- AÑADIDO
}

// --- Creación del Store ---
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      token: null,
      refreshToken: null,
      wifiSsid: null,
      wifiPassword: null,
      hasDevices: false, // <--- AÑADIDO (Estado inicial)

      login: (accessToken, refreshToken) => {
        set({
          isAuthenticated: true,
          token: accessToken,
          refreshToken,
        });
        
        // --- 👇 2. "ENCENDEMOS" LAS NOTIFICACIONES ---
        // Justo después de guardar el token, inicializamos el servicio.
        // No usamos 'await' para no bloquear el login (se ejecuta en fondo).
        initializeNotificationService();
      },

      logout: async () => {
        const refreshToken = get().refreshToken;
        try {
          if (refreshToken) {
            await logoutUser(refreshToken);
          }
        } catch (error) {
          console.warn('Error al cerrar sesión en el servidor:', error);
        } finally {
          set({
            isAuthenticated: false,
            token: null,
            refreshToken: null,
            wifiSsid: null,
            wifiPassword: null,
            hasDevices: false, // <--- AÑADIDO (Reset en logout)
          });
          // Opcional: Aquí podríamos llamar a una función para
          // des-registrar el token FCM del backend si quisiéramos.
        }
      },
      
      setWifiCredentials: (ssid, password) =>
        set({
          wifiSsid: ssid,
          wifiPassword: password,
        }),

      // --- 👇 AÑADIDO (Nueva acción) ---
      setHasDevices: (status) =>
        set({
          hasDevices: status,
        }),

    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // --- 👇 3. (OPCIONAL PERO RECOMENDADO) ---
      // Esto llama a 'initializeNotificationService' tan pronto como
      // la app carga y detecta que ya estabas logueado.
      onRehydrateStorage: () => (state) => {
        if (state?.isAuthenticated) {
          console.log('Usuario ya autenticado, inicializando notificaciones...');
          initializeNotificationService();
        }
      },
    }
  )
);