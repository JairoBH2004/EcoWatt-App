import { create }from 'zustand';
import { logoutUser } from '../services/authService';

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  refreshToken: string | null; // <-- 1. Añadimos el refresh token
  login: (accessToken: string, refreshToken: string) => void; // <-- 2. Actualizamos el login
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  token: null,
  refreshToken: null, // <-- 3. Estado inicial

  login: (accessToken: string, refreshToken: string) => set({ 
      isAuthenticated: true, 
      token: accessToken, 
      refreshToken: refreshToken // <-- 4. Guardamos ambos tokens
  }),

  logout: async () => {
    const refreshToken = get().refreshToken; // <-- 5. Usamos el refresh token
    try {
        if (refreshToken) {
            await logoutUser(refreshToken); // <-- 6. Lo pasamos al servicio
        }
    } catch (error) {
        // La lógica local continúa aunque falle la API
    } finally {
        // Limpiamos todos los datos de la sesión
        set({ isAuthenticated: false, token: null, refreshToken: null });
    }
  },
}));