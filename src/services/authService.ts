// src/services/authService.ts

const API_BASE_URL = 'https://core-cloud.dev';

// ========================================
// HELPER PARA MANEJAR ERRORES
// ========================================
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

// ========================================
// INTERFACES
// ========================================

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

interface UpdateUserData {
  user_name?: string;
  user_email?: string;
  user_billing_day?: number;
}

interface ResetPasswordData {
  token: string;
  new_password: string;
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

interface DeviceRegistrationData {
  name: string;
  mac: string;
}

export interface HistoryDataPoint {
  timestamp: string;
  value: number;
}

export interface HistoryGraphResponse {
  period?: string;
  unit: string;
  data_points: HistoryDataPoint[];
}

interface FcmRegistrationData {
  fcm_token: string;
  device_name?: string;
  platform?: string;
}

// ========================================
// AUTENTICACIÓN Y USUARIO
// ========================================

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

export const resetPassword = async (resetData: ResetPasswordData): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resetData),
    });

    if (!response.ok && response.status >= 400) {
      await handleApiError(response);
    }
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('Error desconocido al restablecer la contraseña.');
  }
};

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
    return await response.json();
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('Error desconocido al actualizar el perfil.');
  }
};

// ========================================
// DASHBOARD
// ========================================

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

// ========================================
// HISTORIAL
// ========================================

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

// ========================================
// DISPOSITIVOS
// ========================================

/**
 * Obtiene todos los dispositivos del usuario
 */
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

/**
 * Registra un nuevo dispositivo Shelly
 */
export const registerDevice = async (
  token: string, 
  deviceData: DeviceRegistrationData
): Promise<Device> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/devices/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        dev_hardware_id: deviceData.mac.toUpperCase(),
        dev_name: deviceData.name,
      }),
    });

    if (!response.ok) {
      // Manejo específico de errores HTTP
      if (response.status === 409) {
        throw new Error('Este dispositivo ya está registrado en tu cuenta');
      }
      if (response.status === 422) {
        throw new Error('MAC inválida o datos incorrectos');
      }
      await handleApiError(response);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('Error desconocido al registrar el dispositivo.');
  }
};

/**
 * Actualiza el nombre de un dispositivo
 */
export const updateDevice = async (
  token: string,
  deviceId: number,
  newName: string
): Promise<Device> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/devices/${deviceId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ dev_name: newName }),
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('Error desconocido al actualizar dispositivo.');
  }
};

/**
 * Elimina un dispositivo
 */
export const deleteDevice = async (token: string, deviceId: number): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/devices/${deviceId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      await handleApiError(response);
    }
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('Error desconocido al eliminar dispositivo.');
  }
};

// ========================================
// NOTIFICACIONES FCM
// ========================================

/**
 * Registra el token FCM para recibir notificaciones push
 * ✅ ENDPOINT CORRECTO según documentación: POST /api/v1/fcm/register
 */
export const registerFcmToken = async (
  token: string,
  fcmData: FcmRegistrationData
): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/fcm/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        fcm_token: fcmData.fcm_token,
        device_name: fcmData.device_name || null,
        platform: fcmData.platform || null,
      }),
    });

    if (!response.ok) {
      await handleApiError(response);
    }
    // Respuesta exitosa (200) retorna null según documentación
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('Error desconocido al registrar el token FCM.');
  }
};