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
  login: (accessToken: string, refreshToken: string, ssid: string, password: string) => void;
  logout: () => Promise<void>;
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

      login: (accessToken, refreshToken, ssid, password) =>
        set({
          isAuthenticated: true,
          token: accessToken,
          refreshToken,
          wifiSsid: ssid,
          wifiPassword: password,
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
          set({
            isAuthenticated: false,
            token: null,
            refreshToken: null,
            wifiSsid: null,
            wifiPassword: null,
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      // ✅ Usa AsyncStorage como almacenamiento persistente
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
