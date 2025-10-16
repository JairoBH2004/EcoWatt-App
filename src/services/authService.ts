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


// --- REGISTRO DE USUARIO ---
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


// --- LOGIN DE USUARIO ---
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


// --- LOGOUT DE USUARIO ---
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


// --- PERFIL DE USUARIO ---
export const getUserProfile = async (token: string): Promise<UserProfile> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
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


// --- RESUMEN DEL DASHBOARD ---
export const getDashboardSummary = async (token: string): Promise<DashboardSummary> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/dashboard/summary`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
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

// --- 👇 NUEVO CÓDIGO AÑADIDO AQUÍ 👇 ---

// --- INTERFAZ PARA UN DISPOSITIVO ---
// Corregida para coincidir exactamente con la respuesta de tu API.
export interface Device {
  dev_hardware_id: string;
  dev_name: string;
  dev_id: number;
  dev_user_id: number;
  dev_status: boolean;
  dev_brand: string;
  dev_model: string;
}

// --- FUNCIÓN PARA OBTENER LA LISTA DE DISPOSITIVOS ---
export const getDevices = async (token: string): Promise<Device[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/devices/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
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