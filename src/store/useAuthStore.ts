import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Simulación de cierre de sesión remoto ---
const logoutUser = async (refreshToken: string) => {
  console.log('Llamando a la API para invalidar el token:', refreshToken);
  return Promise.resolve();
};

// --- Interfaz de AuthState ---
interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  refreshToken: string | null;
  wifiSsid: string | null;
  wifiPassword: string | null;

  // 👇 1. Se actualiza la firma de login (sin WiFi)
  login: (accessToken: string, refreshToken: string) => void;
  
  logout: () => Promise<void>;
  
  // 👇 2. Se añade la nueva función para el WiFi
  setWifiCredentials: (ssid: string, password: string) => void; 
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

      // 👇 3. Login ya NO maneja el WiFi
      login: (accessToken, refreshToken) =>
        set({
          isAuthenticated: true,
          token: accessToken,
          refreshToken,
        }),

      logout: async () => {
        const refreshToken = get().refreshToken;
        try {
          if (refreshToken) {
            await logoutUser(refreshToken);
          }
        } catch (error) {
          console.warn('Error al cerrar sesión en el servidor:', error);
        } finally {
          // 👇 5. Logout se queda igual (borra todo, lo cual es correcto)
          set({
            isAuthenticated: false,
            token: null,
            refreshToken: null,
            wifiSsid: null,
            wifiPassword: null,
          });
        }
      },
      
      // 👇 4. Se implementa la nueva función
      setWifiCredentials: (ssid, password) =>
        set({
          wifiSsid: ssid,
          wifiPassword: password,
        }),

    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);