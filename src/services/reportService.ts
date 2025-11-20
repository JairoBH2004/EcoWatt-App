import { MonthlyReportData } from './PDFGenerator'; // Importamos el tipo de dato que definimos en el paso anterior

const API_BASE_URL = 'https://core-cloud.dev';

/**
 * Obtiene el reporte mensual del mes actual.
 * Endpoint: GET /api/v1/reports/monthly/current
 * @param token Token de autenticación del usuario.
 * @returns Promesa que resuelve con los datos del reporte.
 */
export const getCurrentMonthlyReport = async (token: string): Promise<MonthlyReportData> => {
    const url = `${API_BASE_URL}/api/v1/reports/monthly/current`;
    
    console.log(`📥 Solicitando reporte mensual a: ${url}`);

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            // Intentamos leer el error que manda el backend
            let errorMessage = `Error del servidor (${response.status})`;
            try {
                const errorData = await response.json();
                if (errorData.detail) errorMessage = errorData.detail;
            } catch (e) {
                console.warn("No se pudo leer el JSON de error del servidor");
            }
            
            throw new Error(errorMessage);
        }

        const data: MonthlyReportData = await response.json();
        console.log("✅ Datos del reporte recibidos correctamente");
        return data;

    } catch (error: any) {
        console.error("❌ Error en getCurrentMonthlyReport:", error);
        throw error; // Re-lanzamos el error para que la pantalla lo maneje
    }
};