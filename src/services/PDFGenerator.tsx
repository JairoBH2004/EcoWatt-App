import RNFS from 'react-native-fs';
import { Platform } from 'react-native';

const RNHTMLToPDF = require('react-native-html-to-pdf').default || require('react-native-html-to-pdf');

// --- 1. DEFINICIÓN DE TIPOS ---
export type DailyConsumptionPoint = { date: string; kwh: number; };
export type TariffLevel = { level_name: string; kwh_consumed: number; price_per_kwh: number; subtotal_mxn: number; };
export type AlertDetail = { date: string; title: string; body: string; };
export type Recommendation = { date: string; text: string; };

export type MonthlyReportData = {
    header: {
        period_month: string;
        user_name: string;
        user_email: string;
        billing_cycle_start: string;
        billing_cycle_end: string;
        monitored_circuits: string[];
    };
    executive_summary: {
        total_kwh_consumed: number;
        total_estimated_cost_mxn: number;
        carbon_footprint_kg: number;
        equivalent_trees: number;
        comparison_previous_month: any; 
    };
    consumption_details: {
        daily_consumption: DailyConsumptionPoint[];
        highest_consumption_day: DailyConsumptionPoint;
        lowest_consumption_day: DailyConsumptionPoint;
        average_daily_consumption: number;
    };
    cost_breakdown: {
        applied_tariff: string;
        tariff_levels: TariffLevel[];
        fixed_charge_mxn: number;
        total_cost_mxn: number;
    };
    environmental_impact: {
        total_co2_kg: number;
        equivalent_trees_per_year: number;
        comparison_note: string;
    };
    alerts: AlertDetail[]; 
    recommendations: Recommendation[];
    generated_at: string;
};

// --- 2. LÓGICA DE VENTA (Cálculo de Ahorro) ---
// Esta función analiza los datos para decirle al usuario cuánto dinero está perdiendo
const calculateSavingsPitch = (data: MonthlyReportData) => {
    // Buscamos si existe consumo en la tarifa "Excedente"
    const excedenteLevel = data.cost_breakdown.tariff_levels.find(
        (l) => l.level_name.includes("Excedente")
    );

    if (!excedenteLevel || excedenteLevel.kwh_consumed === 0) {
        return { 
            hasSavings: false, 
            savingsAmount: 0, 
            note: "¡Excelente! Lograste mantener tu consumo fuera de la tarifa de alto costo." 
        };
    }

    return {
        hasSavings: true,
        savingsAmount: excedenteLevel.subtotal_mxn,
        note: `El consumo en tarifa Excedente (la más cara a $${excedenteLevel.price_per_kwh.toFixed(2)}/kWh) representó $${excedenteLevel.subtotal_mxn.toFixed(2)} de tu factura. ¡Reducir este consumo es tu mayor oportunidad de ahorro!`
    };
};

// --- 3. PLANTILLA HTML MEJORADA (Estilo Estado de Cuenta) ---
const getReportHtml = (data: MonthlyReportData): string => {
    const savings = calculateSavingsPitch(data);

    // Generamos las filas de la tabla, detectando cual es la cara (Excedente)
    const tariffRows = data.cost_breakdown.tariff_levels.map(level => {
        const isExcedente = level.level_name.includes("Excedente");
        // Limpiamos asteriscos si vienen del backend (ej: **Excedente**)
        const cleanName = level.level_name.replace(/\*\*/g, ''); 
        
        return `
        <tr class="${isExcedente ? 'excedente-row' : ''}">
            <td>${cleanName}</td>
            <td style="text-align: right;">${level.kwh_consumed.toFixed(2)}</td>
            <td style="text-align: right;">$${level.price_per_kwh.toFixed(2)}</td>
            <td style="text-align: right; font-weight: bold;">$${level.subtotal_mxn.toFixed(2)}</td>
        </tr>
    `}).join('');

    const alertList = data.alerts && data.alerts.length > 0 
        ? data.alerts.map(a => `<li class="alert-item"><strong>${a.title}:</strong> ${a.body}</li>`).join('')
        : '<li>No se detectaron alertas críticas en este periodo.</li>';

    const formattedDate = new Date(data.generated_at).toLocaleDateString('es-MX', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    return `
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { font-family: Helvetica, Arial, sans-serif; color: #333; padding: 0; margin: 0; }
                
                /* Header */
                .header { background-color: #008060; color: white; padding: 30px 20px; text-align: center; border-bottom: 5px solid #00FF7F; }
                h1 { margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 1px; }
                
                .container { padding: 25px; }
                h2 { color: #008060; border-left: 5px solid #00FF7F; padding-left: 10px; margin-top: 25px; font-size: 18px; }
                
                /* Tablas */
                table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
                th { background-color: #f0f2f5; padding: 12px; text-align: left; border-bottom: 2px solid #ddd; }
                td { border-bottom: 1px solid #eee; padding: 10px; }
                
                /* Estilos de filas especiales */
                .excedente-row td { background-color: #fff5f5; color: #c53030; font-weight: bold; }
                .total-row td { font-weight: bold; background-color: #f9f9f9; }
                
                /* El Total Final Grande */
                .total-final { background-color: #d1e7dd; color: #0f5132; font-size: 16px; border-top: 2px solid #008060; }
                .total-final td { padding: 15px 10px; font-weight: 800; }

                /* Cajas de Resumen */
                .summary-box { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #ddd; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
                .big-num { font-size: 28px; font-weight: bold; color: #2c3e50; display: block; margin-top: 5px; }
                
                /* Caja de Ahorro (La Venta) */
                .savings-box { background-color: #e6ffed; border: 1px solid #28a745; padding: 20px; border-radius: 8px; margin-top: 15px; }
                .savings-amount { color: #dc3545; font-size: 32px; font-weight: bold; display: block; margin: 10px 0; }
                
                .alert-item { background-color: #fff3cd; padding: 8px; margin-bottom: 5px; border-radius: 4px; font-size: 12px; list-style: none; }
                
                .footer { text-align: center; font-size: 10px; color: #999; margin-top: 50px; border-top: 1px solid #eee; padding-top: 15px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Estado de Cuenta</h1>
                <p style="margin: 5px 0; opacity: 0.9;">${data.header.period_month}</p>
                <p style="font-size: 14px;">${data.header.user_name}</p>
            </div>

            <div class="container">
                
                <!-- TOTAL PRINCIPAL -->
                <div class="summary-box">
                    <span style="font-size: 12px; text-transform: uppercase; color: #666;">Total Estimado a Pagar</span>
                    <span class="big-num" style="color: #dc3545;">$${data.executive_summary.total_estimated_cost_mxn.toFixed(2)} MXN</span>
                </div>

                <!-- DESGLOSE (Tabla) -->
                <h2>Desglose de Costos</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Concepto</th>
                            <th style="text-align: right">Consumo</th>
                            <th style="text-align: right">Precio</th>
                            <th style="text-align: right">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tariffRows}
                        <tr class="total-row">
                            <td colspan="3" style="text-align: right;">Cargo Fijo</td>
                            <td style="text-align: right;">$${data.cost_breakdown.fixed_charge_mxn.toFixed(2)}</td>
                        </tr>
                        <tr class="total-final">
                            <td colspan="3" style="text-align: right;">TOTAL ESTIMADO</td>
                            <td style="text-align: right;">$${data.cost_breakdown.total_cost_mxn.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>

                <!-- SECCIÓN DE OPORTUNIDAD (Ahorro) -->
                <h2>Análisis de Ahorro</h2>
                <div class="savings-box">
                    <strong style="color: #008060; font-size: 16px;">💰 Oportunidad de Ahorro Detectada</strong>
                    <span class="savings-amount">$${savings.savingsAmount.toFixed(2)} MXN</span>
                    <p style="margin: 0; color: #155724;">${savings.note}</p>
                </div>

                <!-- ALERTAS -->
                <h2>Alertas y Avisos</h2>
                <ul style="padding: 0;">${alertList}</ul>

                <div class="footer">
                    Generado el ${formattedDate} • EcoWatt App<br>
                    Documento informativo, no oficial ante CFE.
                </div>
            </div>
        </body>
        </html>
    `;
};

// --- 4. FUNCIÓN EXPORTADA ---
export const generateEcoWattReport = async (reportData: MonthlyReportData) => {
    try {
        const htmlContent = getReportHtml(reportData);
        const safePeriodName = reportData.header.period_month.replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = `EcoWatt_EstadoCuenta_${safePeriodName}`;
        
        let options = {
            html: htmlContent,
            fileName: fileName,
            directory: 'Documents',
            base64: false,
        };

        const file = await RNHTMLToPDF.convert(options);
        let filePath = file.filePath;

        // Lógica Android para mover a Descargas
        if (Platform.OS === 'android') {
            const destinationPath = `${RNFS.DownloadDirectoryPath}/${fileName}.pdf`;
            
            if (await RNFS.exists(destinationPath)) {
                await RNFS.unlink(destinationPath);
            }

            await RNFS.moveFile(filePath, destinationPath);
            filePath = destinationPath;
        }

        return { success: true, path: filePath };

    } catch (error) {
        console.error("Error generando PDF:", error);
        return { success: false, error: error };
    }
};