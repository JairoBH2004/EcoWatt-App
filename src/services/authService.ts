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

// Interfaz para los datos necesarios al registrar un dispositivo.
interface DeviceRegistrationData {
  name: string;
  mac: string;
}


// --- FUNCIONES DE AUTENTICACIÓN Y USUARIO ---

export const registerUser = async (userData: UserRegistrationData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      await handleApiError(response);
    }
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

    if (!response.ok) {
      await handleApiError(response);
    }
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

    if (!response.ok) {
      console.error('El logout en el servidor falló, pero se procederá localmente.');
    }
  } catch (error) {
    console.error('Error de red al intentar cerrar sesión:', error);
  }
};

export const getUserProfile = async (token: string): Promise<UserProfile> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      await handleApiError(response);
    }
    return await response.json();
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('Error desconocido al obtener el perfil.');
  }
};


// --- FUNCIONES DEL DASHBOARD ---

export const getDashboardSummary = async (token: string): Promise<DashboardSummary> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/dashboard/summary`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      await handleApiError(response);
    }
    return await response.json();
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('Error desconocido al obtener los datos del dashboard.');
  }
};


// --- FUNCIONES DE DISPOSITIVOS ---

export const getDevices = async (token: string): Promise<Device[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/devices/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      await handleApiError(response);
    }
    return await response.json();
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('Error desconocido al obtener los dispositivos.');
  }
};

/**
 * Registra un nuevo dispositivo.
 * Se ha refactorizado para ser consistente con las demás funciones.
 * @param token El token de autenticación del usuario.
 * @param deviceData Un objeto con el nombre (name) y la MAC (mac) del dispositivo.
 * @returns El objeto del dispositivo recién creado.
 */
export const registerDevice = async (token: string, deviceData: DeviceRegistrationData): Promise<Device> => {
  // Mapeamos los nombres de nuestro objeto a los que espera la API.
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

    // Usamos el mismo manejador de errores que las otras funciones.
    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  } catch (error) {
    // Usamos el mismo bloque catch que las otras funciones.
    if (error instanceof Error) throw error;
    throw new Error('Error desconocido al registrar el dispositivo.');
  }
};