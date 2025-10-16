const API_BASE_URL = 'https://core-cloud.dev';

// --- INTERFACES ---

// Datos para registro de usuario
interface UserRegistrationData {
  user_name: string;
  user_email: string;
  user_password: string;
  user_trf_rate: string;
  user_billing_day: number;
}

// Datos para login
interface LoginCredentials {
  user_email: string;
  user_password: string;
}

// Respuesta del login
interface LoginResponse {
  access_token: string;
  refresh_token: string;
}

// --- REGISTRO DE USUARIO ---

export const registerUser = async (userData: UserRegistrationData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      let errorMessage = 'Ocurrió un error en el registro.';

      if (data.detail) {
        if (Array.isArray(data.detail) && data.detail.length > 0) {
          errorMessage = data.detail[0]?.msg || errorMessage;
        } else if (typeof data.detail === 'string') {
          errorMessage = data.detail;
        }
      }

      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('Error desconocido al registrar usuario.');
  }
};


// --- LOGIN DE USUARIO ---

export const loginUser = async (
  credentials: LoginCredentials
): Promise<LoginResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      let errorMessage = 'Credenciales no válidas.';

      if (data.detail) {
        if (typeof data.detail === 'string') {
          errorMessage = data.detail;
        } else if (Array.isArray(data.detail) && data.detail[0]?.msg) {
          errorMessage = data.detail[0].msg;
        }
      }

      throw new Error(errorMessage);
    }

    return data as LoginResponse;
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('Error desconocido al iniciar sesión.');
  }
};



// --- LOGOUT DE USUARIO ---

export const logoutUser = async (refreshToken: string) => {
    try {
        // Corregimos la petición para que coincida con la documentación
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            // Enviamos el refresh_token en el body, no el token de acceso en los headers
            body: JSON.stringify({
                refresh_token: refreshToken
            })
        });

        if (!response.ok) {
            console.error('El logout en el servidor falló, pero se procederá localmente.');
        }

    } catch (error) {
        console.error('Error de red al intentar cerrar sesión:', error);
        throw error;
    }
};

// --- PERFIL DE USUARIO ---
interface UserProfile {
  id: number;
  user_name: string;
  user_email: string;
  user_trf_rate: string;
  user_billing_day: number;
  created_at?: string;
  updated_at?: string;
}

export const getUserProfile = async (token: string): Promise<UserProfile> => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // Las rutas protegidas necesitan el token de acceso en la cabecera
                'Authorization': `Bearer ${token}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'No se pudo obtener la información del perfil.');
        }

        return data;

    } catch (error) {
        if (error instanceof Error) throw error;
        throw new Error('Error desconocido al obtener el perfil.');
    }
};