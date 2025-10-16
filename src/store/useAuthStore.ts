import { create } from 'zustand';
import { persist, StateStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

// --- Placeholder para tu función de API ---
// Esta función debería hacer una llamada a tu backend para invalidar el refresh token.
const logoutUser = async (refreshToken: string) => {
  console.log('Llamando a la API para invalidar el token:', refreshToken);
  // Ejemplo:
  // await api.post('/auth/logout', { refreshToken });
  return Promise.resolve();
};

// --- Adaptador para usar SecureStore con Zustand ---
const customStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return await SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await SecureStore.deleteItemAsync(name);
  },
};

// --- Definición de la Interfaz del Estado ---
interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  refreshToken: string | null;
  wifiSsid: string | null;
  wifiPassword: string | null;
  login: (accessToken: string, refreshToken: string, ssid: string, password: string) => void;
  logout: () => Promise<void>;
}

// --- Creación del Store con Persistencia Segura ---
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
          refreshToken: refreshToken,
          wifiSsid: ssid,
          wifiPassword: password,
        }),

      logout: async () => {
        const refreshToken = get().refreshToken;
        try {
          if (refreshToken) {
            // Llama a tu API para invalidar el token en el backend
            await logoutUser(refreshToken);
          }
        } catch (error) {
          console.warn('Error al cerrar sesión en el servidor:', error);
        } finally {
          // Limpia el estado local sin importar el resultado de la API
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
      name: 'auth-storage', // Nombre de la clave en el almacenamiento
      storage: customStorage, // Usar el adaptador de SecureStore
    }
  )
);