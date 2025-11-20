import RNFS from 'react-native-fs';
import { Platform } from 'react-native';

// ---------------------------------------------------------------------------------------
// FIX: Usamos 'require' en lugar de 'import' para RNHTMLToPDF.
// Esto soluciona el error: "Module '...' has no default export".
// ---------------------------------------------------------------------------------------
const RNHTMLToPDF = require('react-native-html-to-pdf').default || require('react-native-html-to-pdf');


// --- 1. DEFINICIÓN DE TIPOS (Basado en tu API) ---

export type DailyConsumptionPoint = {
    date: string;
    kwh: number;
};

export type TariffLevel = {
    level_name: string;
    kwh_consumed: number;
    price_per_kwh: number;
    subtotal_mxn: number;
};

export type Recommendation = {
    date: string;
    text: string;
};

// Esta es la estructura maestra que coincide con tu JSON de /reports/monthly/current
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
    alerts: any[]; 
    recommendations: Recommendation[];
    generated_at: string;
};

// --- 2. PLANTILLA HTML/CSS PROFESIONAL ---

const getReportHtml = (data: MonthlyReportData): string => {
    
    // Generar filas para la tabla de consumo diario
    const dailyRows = data.consumption_details.daily_consumption.map(point => `
        <tr>
            <td>${new Date(point.date).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}</td>
            <td style="text-align: right;">${point.kwh.toFixed(2)} kWh</td>
        </tr>
    `).join('');

    // Generar filas para la tabla de tarifas
    const tariffRows = data.cost_breakdown.tariff_levels.map(level => `
        <tr>
            <td>${level.level_name}</td>
            <td style="text-align: right;">${level.kwh_consumed.toFixed(2)} kWh</td>
            <td style="text-align: right;">$${level.price_per_kwh.toFixed(2)}</td>
            <td style="text-align: right; font-weight: bold;">$${level.subtotal_mxn.toFixed(2)}</td>
        </tr>
    `).join('');

    // Generar lista de recomendaciones
    const recommendationList = data.recommendations.length > 0 
        ? data.recommendations.map(rec => `<li>${rec.text}</li>`).join('')
        : '<li>No hay recomendaciones específicas para este periodo. ¡Sigue así!</li>';

    const formattedDate = new Date(data.generated_at).toLocaleDateString('es-MX', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    return `
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { font-family: Helvetica, Arial, sans-serif; margin: 0; padding: 0; color: #333; background: #fff; }
                
                /* Header Estilo EcoWatt */
                .header { background-color: #008060; color: white; padding: 25px; text-align: center; border-bottom: 4px solid #00FF7F; }
                .header h1 { margin: 0; font-size: 26px; text-transform: uppercase; letter-spacing: 1px; }
                .header p { margin: 5px 0 0 0; font-size: 14px; opacity: 0.9; }
                
                /* Secciones */
                .container { padding: 20px; }
                .section { margin-bottom: 25px; border-bottom: 1px solid #eee; padding-bottom: 15px; }
                h2 { color: #008060; border-left: 5px solid #00FF7F; padding-left: 10px; margin-top: 0; font-size: 18px; }
                
                /* Grid de Resumen */
                .summary-grid { display: flex; flex-wrap: wrap; gap: 10px; justify-content: space-between; }
                .summary-box { width: 48%; background: #f8f9fa; padding: 15px; border-radius: 8px; box-sizing: border-box; border: 1px solid #e9ecef; margin-bottom: 10px; }
                .summary-label { font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
                .summary-value { font-size: 20px; font-weight: bold; color: #2c3e50; margin-top: 5px; }
                .highlight-val { color: #FF6347; } /* Naranja para costos */

                /* Tablas */
                table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
                th { background-color: #e9ecef; color: #495057; padding: 8px; text-align: left; font-weight: 600; }
                td { border-bottom: 1px solid #f1f1f1; padding: 8px; color: #555; }
                .total-row td { font-weight: bold; background-color: #f8f9fa; border-top: 2px solid #ddd; }
                
                /* Impacto Ambiental */
                .eco-box { background-color: #e6ffed; padding: 15px; border-radius: 8px; border: 1px solid #b2f2bb; }
                .eco-note { font-style: italic; color: #2b8a3e; margin-top: 5px; font-size: 13px; }

                /* Recomendaciones */
                ul { padding-left: 20px; }
                li { margin-bottom: 5px; color: #444; }

                .footer { text-align: center; font-size: 10px; color: #999; margin-top: 40px; padding-top: 10px; border-top: 1px solid #eee; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Reporte Mensual</h1>
                <p>Periodo: ${data.header.period_month}</p>
                <p>${data.header.user_name} | ${data.header.user_email}</p>
            </div>

            <div class="container">
                
                <!-- RESUMEN EJECUTIVO -->
                <div class="section">
                    <h2>Resumen Ejecutivo</h2>
                    <div class="summary-grid">
                        <div class="summary-box">
                            <div class="summary-label">Consumo Total</div>
                            <div class="summary-value">${data.executive_summary.total_kwh_consumed.toFixed(2)} kWh</div>
                        </div>
                        <div class="summary-box">
                            <div class="summary-label">Costo Estimado</div>
                            <div class="summary-value highlight-val">$${data.executive_summary.total_estimated_cost_mxn.toFixed(2)}</div>
                        </div>
                        <div class="summary-box">
                            <div class="summary-label">Huella de Carbono</div>
                            <div class="summary-value">${data.executive_summary.carbon_footprint_kg.toFixed(2)} kg</div>
                        </div>
                        <div class="summary-box">
                            <div class="summary-label">Árboles Equivalentes</div>
                            <div class="summary-value">🌳 ${data.executive_summary.equivalent_trees}</div>
                        </div>
                    </div>
                </div>

                <!-- DESGLOSE DE COSTOS -->
                <div class="section">
                    <h2>Desglose de Costos</h2>
                    <p style="font-size: 12px; color: #666;">Tarifa: <strong>${data.cost_breakdown.applied_tariff}</strong></p>
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
                                <td colspan="3" style="text-align: right">Cargo Fijo</td>
                                <td style="text-align: right">$${data.cost_breakdown.fixed_charge_mxn.toFixed(2)}</td>
                            </tr>
                            <tr class="total-row" style="background-color: #dff0d8;">
                                <td colspan="3" style="text-align: right; color: #008060;">TOTAL ESTIMADO</td>
                                <td style="text-align: right; color: #008060;">$${data.cost_breakdown.total_cost_mxn.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- IMPACTO Y RECOMENDACIONES -->
                <div class="section">
                    <h2>Impacto y Ahorro</h2>
                    <div class="eco-box">
                        <strong>Análisis Ambiental:</strong>
                        <p class="eco-note">"${data.environmental_impact.comparison_note}"</p>
                    </div>
                    
                    <h3 style="font-size: 14px; margin-top: 15px; color: #333;">Recomendaciones para ti:</h3>
                    <ul>
                        ${recommendationList}
                    </ul>
                </div>

                <!-- TABLA DIARIA (Opcional, si es muy larga puede ocupar varias páginas) -->
                <div class="section">
                    <h2>Historial Diario</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th style="text-align: right">Consumo (kWh)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${dailyRows}
                        </tbody>
                    </table>
                </div>

            </div>

            <div class="footer">
                Reporte generado automáticamente por EcoWatt el ${formattedDate}.<br>
                Este documento es informativo y no reemplaza su factura oficial de CFE.
            </div>
        </body>
        </html>
    `;
};

// --- 3. FUNCIÓN PRINCIPAL: GENERAR PDF ---

export const generateEcoWattReport = async (reportData: MonthlyReportData) => {
    try {
        const htmlContent = getReportHtml(reportData);
        // Limpiamos el nombre del periodo para que sea un nombre de archivo válido
        const safePeriodName = reportData.header.period_month.replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = `EcoWatt_Reporte_${safePeriodName}`;
        
        let options = {
            html: htmlContent,
            fileName: fileName,
            directory: 'Documents',
            base64: false,
        };

        const file = await RNHTMLToPDF.convert(options);
        let filePath = file.filePath;

        // Manejo específico para Android (Mover a Descargas para fácil acceso)
        if (Platform.OS === 'android') {
            const destinationPath = `${RNFS.DownloadDirectoryPath}/${fileName}.pdf`;
            
            // Verificamos si el archivo ya existe para no dar error, o lo sobrescribimos
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