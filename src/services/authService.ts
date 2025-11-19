// --- HELPER PARA MANEJAR ERRORES DE FORMA CENTRALIZADA ---
// Esta función evita repetir la misma lógica de errores en todas las llamadas a la API.
const handleApiError = async (response: Response) => {
  const data = await response.json();
  let errorMessage = 'Ocurrió un error inesperado.';

  if (data.detail) {
    if (Array.isArray(data.detail) && data.detail[0]?.msg) {
      errorMessage = data.detail[0].msg;
    } else if (typeof data.detail === 'string') {
      errorMessage = data.detail;
    }
  }
  throw new Error(errorMessage);
};


// --- CÓDIGO DEL SERVICIO ---
const API_BASE_URL = 'https://core-cloud.dev';

// --- INTERFACES ---
interface UserRegistrationData {
  user_name: string;
  user_email: string;
  user_password: string;
  user_trf_rate: string;
  user_billing_day: number;
}
interface LoginCredentials {
  user_email: string;
  user_password: string;
}
interface LoginResponse {
  access_token: string;
  refresh_token: string;
}
export interface UserProfile {
  user_id: number;
  user_name: string;
  user_email: string;
  user_trf_rate: string;
  user_billing_day: number;
}
interface CarbonFootprint {
  co2_emitted_kg: number;
  equivalent_trees_absorption_per_year: number;
}
export interface DashboardSummary {
  kwh_consumed_cycle: number;
  estimated_cost_mxn: number;
  billing_cycle_start: string;
  billing_cycle_end: string;
  days_in_cycle: number;
  current_tariff: string;
  carbon_footprint: CarbonFootprint;
  latest_recommendation: string;
}
export interface Device {
  dev_id: number;
  dev_user_id: number;
  dev_hardware_id: string;
  dev_name: string;
  dev_status: boolean;
  dev_brand: string;
  dev_model: string;
}
export interface HistoryDataPoint {
  timestamp: string;
  value: number;
}
// Interfaz ajustada: period es opcional
export interface HistoryGraphResponse {
  period?: string; // Puede que last7days no lo devuelva
  unit: string;
  data_points: HistoryDataPoint[];
}
interface DeviceRegistrationData {
  name: string;
  mac: string;
}

// Interfaz para actualizar usuario (campos opcionales)
interface UpdateUserData {
    user_name?: string;
    user_email?: string;
    user_billing_day?: number;
    // user_trf_rate?: string; // Omitido porque no será editable
}

// --- 👇 NUEVA INTERFAZ PARA RESET PASSWORD 👇 ---
interface ResetPasswordData {
    token: string;
    new_password: string;
}
// --- 👆 FIN DE NUEVA INTERFAZ 👆 ---

// --- 👇 NUEVA INTERFAZ PARA EL TOKEN FCM (NOTIFICACIONES) 👇 ---
interface FcmTokenData {
    dev_fcm_token: string;
}
// --- 👆 FIN DE NUEVA INTERFAZ 👆 ---


// --- FUNCIONES DE AUTENTICACIÓN Y USUARIO ---
export const registerUser = async (userData: UserRegistrationData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    if (!response.ok) await handleApiError(response);
    return await response.json();
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('Error desconocido al registrar usuario.');
  }
};

export const loginUser = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!response.ok) await handleApiError(response);
    return await response.json() as LoginResponse;
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('Error desconocido al iniciar sesión.');
  }
};

export const logoutUser = async (refreshToken: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!response.ok) console.error('El logout en el servidor falló, pero se procederá localmente.');
  } catch (error) {
    console.error('Error de red al intentar cerrar sesión:', error);
  }
};

export const requestPasswordReset = async (email: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_email: email }),
    });
    if (!response.ok && response.status >= 400) {
      await handleApiError(response);
    }
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('Error desconocido al solicitar reseteo de contraseña.');
  }
};

// --- 👇 NUEVA FUNCIÓN PARA RESET PASSWORD 👇 ---
export const resetPassword = async (resetData: ResetPasswordData): Promise<void> => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(resetData),
        });

        // Este endpoint también puede devolver 200 OK incluso si el token es inválido
        // o ya fue usado, para no dar pistas. Manejamos errores >= 400.
        if (!response.ok && response.status >= 400) {
            await handleApiError(response); // Reutilizamos el manejador de errores
        }
        // No esperamos un body en la respuesta exitosa
    } catch (error) {
        if (error instanceof Error) throw error;
        throw new Error('Error desconocido al restablecer la contraseña.');
    }
};
// --- 👆 FIN DE NUEVA FUNCIÓN 👆 ---

export const getUserProfile = async (token: string): Promise<UserProfile> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) await handleApiError(response);
    return await response.json();
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('Error desconocido al obtener el perfil.');
  }
};

export const updateUserProfile = async (token: string, userData: UpdateUserData): Promise<UserProfile> => {
    try {
        // Filtramos para enviar solo los campos definidos
        const body = JSON.stringify(Object.fromEntries(
            Object.entries(userData).filter(([_, v]) => v !== undefined)
        ));

        const response = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: body,
        });

        if (!response.ok) {
            await handleApiError(response);
        }
        return await response.json(); // Devuelve el perfil actualizado
    } catch (error) {
        if (error instanceof Error) throw error;
        throw new Error('Error desconocido al actualizar el perfil.');
    }
};

// --- FUNCIONES DEL DASHBOARD ---
export const getDashboardSummary = async (token: string): Promise<DashboardSummary> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/dashboard/summary`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) await handleApiError(response);
    return await response.json();
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('Error desconocido al obtener los datos del dashboard.');
  }
};

// --- FUNCIONES DE HISTORIAL ---
export const getHistoryGraph = async (
  token: string,
  period: 'daily' | 'weekly' | 'monthly'
): Promise<HistoryGraphResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/history/graph?period=${period}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) await handleApiError(response);
    return await response.json();
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('Error desconocido al obtener la gráfica.');
  }
};

export const getLast7DaysHistory = async (token: string): Promise<HistoryGraphResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/history/last7days`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) await handleApiError(response);
    return await response.json();
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('Error desconocido al obtener historial de 7 días.');
  }
};

// --- FUNCIONES DE DISPOSITIVOS ---
export const getDevices = async (token: string): Promise<Device[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/devices/`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) await handleApiError(response);
    return await response.json();
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('Error desconocido al obtener los dispositivos.');
  }
};

export const registerDevice = async (token: string, deviceData: DeviceRegistrationData): Promise<Device> => {
  const body = JSON.stringify({
    dev_hardware_id: deviceData.mac,
    dev_name: deviceData.name,
  });
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/devices/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: body,
    });
    if (!response.ok) await handleApiError(response);
    return await response.json();
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('Error desconocido al registrar el dispositivo.');
  }
};

// --- 👇 FUNCIÓN AÑADIDA PARA NOTIFICACIONES ---
/**
 * Registra el token FCM (Firebase Cloud Messaging) de un dispositivo específico 
 * en el backend para que pueda recibir notificaciones push.
 */
export const registerFcmToken = async (token: string, deviceId: number, fcmToken: string): Promise<void> => {
    try {
        const body: FcmTokenData = {
            dev_fcm_token: fcmToken
        };
        
        const response = await fetch(`${API_BASE_URL}/api/v1/devices/${deviceId}/register-fcm`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            await handleApiError(response);
        }
        // Un 200 OK sin cuerpo es éxito
    } catch (error) { 
        if (error instanceof Error) throw error;
        throw new Error('Error desconocido al registrar el token FCM.');
    }
};
// --- 👆 FIN DE FUNCIÓN AÑADIDA 👆 --- 