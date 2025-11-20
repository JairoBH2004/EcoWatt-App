import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, ImageBackground, StatusBar,
    ScrollView, ActivityIndicator, Dimensions, AppState,
    TouchableOpacity, Modal, Alert 
} from 'react-native';
import { BarChart, LineChart, lineDataItem } from 'react-native-gifted-charts';
import Icon from 'react-native-vector-icons/FontAwesome5';

import { statsStyles } from '../styles/StatsStyles';
import { useAuthStore } from '../store/useAuthStore';
import { getHistoryGraph, HistoryDataPoint, getDevices } from '../services/authService';

// --- NUEVAS IMPORTACIONES PARA REPORTES ---
import { generateEcoWattReport, MonthlyReportData } from '../services/PDFGenerator';
import { getCurrentMonthlyReport } from '../services/reportService';
// ------------------------------------------

const ECOWATT_BACKGROUND = require('../assets/fondo.jpg');
const PRIMARY_GREEN = '#00FF7F';
const LIVE_COLOR = '#FF6347'; 

const screenWidth = Dimensions.get('window').width;

type ChartDataItem = {
    value: number;
    label: string;
    frontColor?: string;
    focusable?: boolean;
    dataPointText?: string;
};

const MAX_REALTIME_POINTS = 30;

const StatsScreen = () => {
    const { token, logout } = useAuthStore();

    const [dailyData, setDailyData] = useState<ChartDataItem[]>([]);
    const [weeklyData, setWeeklyData] = useState<ChartDataItem[]>([]);
    const [monthlyData, setMonthlyData] = useState<ChartDataItem[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true); 
    const [historyError, setHistoryError] = useState('');

    const [deviceId, setDeviceId] = useState<number | null>(null);
    const [realtimeData, setRealtimeData] = useState<lineDataItem[]>([]); 
    const [currentWatts, setCurrentWatts] = useState<number | null>(null);
    const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
    
    const [maxChartValue, setMaxChartValue] = useState(100); 
    const ws = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<number | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const MAX_RECONNECT_ATTEMPTS = 3;

    // --- NUEVO ESTADO PARA GENERACIÓN DE REPORTE ---
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    // -----------------------------------------------

    // --- ESTADOS PARA SELECTORES DE FECHA ---
    const [selectedDailyDate, setSelectedDailyDate] = useState(new Date());
    const [selectedWeeklyDate, setSelectedWeeklyDate] = useState(new Date());
    const [selectedMonthlyDate, setSelectedMonthlyDate] = useState(new Date());

    const [showDailyPicker, setShowDailyPicker] = useState(false);
    const [showWeeklyPicker, setShowWeeklyPicker] = useState(false);
    const [showMonthlyPicker, setShowMonthlyPicker] = useState(false);

    // Formateo de fechas
    const formatDateLabel = (timestamp: string, format: 'hour' | 'weekday' | 'dayMonth') => {
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) return '?';

        if (format === 'hour') {
            let hours = date.getHours();
            const ampm = hours >= 12 ? 'pm' : 'am';
            hours = hours % 12;
            hours = hours ? hours : 12; 
            return `${hours} ${ampm}`;
        }
        if (format === 'weekday') {
            return date.toLocaleDateString('es-MX', { weekday: 'short' }).replace('.', ''); 
        }
        if (format === 'dayMonth') {
            return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }).replace('.', '');
        }
        return '';
    };

    // --- FUNCIONES PARA GENERAR OPCIONES DE FECHA ---
    const generateDailyOptions = () => {
        const options = [];
        const today = new Date();
        for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            options.push(date);
        }
        return options;
    };

    const generateWeeklyOptions = () => {
        const options = [];
        const today = new Date();
        for (let i = 0; i < 12; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - (i * 7));
            options.push(date);
        }
        return options;
    };

    const generateMonthlyOptions = () => {
        const options = [];
        const today = new Date();
        for (let i = 0; i < 12; i++) {
            const date = new Date(today);
            date.setMonth(today.getMonth() - i);
            options.push(date);
        }
        return options;
    };

    const formatDailyLabel = (date: Date) => {
        return date.toLocaleDateString('es-MX', { 
            weekday: 'short', 
            day: 'numeric', 
            month: 'short',
            year: 'numeric'
        });
    };

    const formatWeeklyLabel = (date: Date) => {
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        
        return `${startOfWeek.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} - ${endOfWeek.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}`;
    };

    const formatMonthlyLabel = (date: Date) => {
        return date.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
    };

    const getWeekNumber = (date: Date) => {
        const startOfYear = new Date(date.getFullYear(), 0, 1);
        const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
        return Math.ceil((days + startOfYear.getDay() + 1) / 7);
    };

    useEffect(() => {
        const loadInitialData = async () => {
            if (!token) {
                setIsLoadingHistory(false);
                setTimeout(() => logout(), 100);
                return;
            }

            setIsLoadingHistory(true);
            setHistoryError('');
            setDeviceId(null); 

            try {
                const [devicesResponse, dailyResponse, weeklyResponse, monthlyResponse] = await Promise.allSettled([
                    getDevices(token), 
                    getHistoryGraph(token, 'daily'),
                    getHistoryGraph(token, 'weekly'),
                    getHistoryGraph(token, 'monthly'),
                ]);

                console.log('📱 Respuesta de dispositivos:', devicesResponse);

                if (devicesResponse.status === 'fulfilled' && devicesResponse.value.length > 0) {
                    console.log('✅ Dispositivos encontrados:', devicesResponse.value.length);
                    console.log('🆔 Primer dispositivo ID:', devicesResponse.value[0].dev_id);
                    setDeviceId(devicesResponse.value[0].dev_id); 
                } else if (devicesResponse.status === 'rejected') {
                    console.error('❌ Error obteniendo dispositivos:', devicesResponse.reason);
                    if (!devicesResponse.reason?.message?.includes('404')) {
                        console.error("Error devices:", devicesResponse.reason);
                    } else {
                        console.warn('⚠️ No hay dispositivos registrados (404)');
                    }
                } else {
                    console.warn('⚠️ No hay dispositivos registrados');
                }

                if (dailyResponse.status === 'fulfilled') {
                    const formatted = dailyResponse.value.data_points.map((p: HistoryDataPoint) => ({
                        value: p.value,
                        label: formatDateLabel(p.timestamp, 'hour'),
                        frontColor: PRIMARY_GREEN,
                        focusable: true,
                        dataPointText: `${p.value.toFixed(2)}`
                    }));
                    setDailyData(formatted);
                }

                if (weeklyResponse.status === 'fulfilled') {
                    const formatted = weeklyResponse.value.data_points.map((p: HistoryDataPoint) => ({ 
                        value: p.value, 
                        label: formatDateLabel(p.timestamp, 'weekday'),
                        frontColor: PRIMARY_GREEN,
                        focusable: true,
                        dataPointText: `${p.value.toFixed(1)}`
                    }));
                    setWeeklyData(formatted);
                }

                if (monthlyResponse.status === 'fulfilled') {
                    const formatted = monthlyResponse.value.data_points.map((p: HistoryDataPoint) => ({ 
                        value: p.value, 
                        label: formatDateLabel(p.timestamp, 'dayMonth'),
                        frontColor: PRIMARY_GREEN,
                        focusable: true,
                        dataPointText: `${p.value.toFixed(1)}`
                    }));
                    setMonthlyData(formatted);
                }

            } catch (err: any) {
                console.error('Error cargando datos:', err);
                setHistoryError('No se pudieron cargar algunos datos históricos.');
            } finally {
                setIsLoadingHistory(false);
            }
        };

        loadInitialData();
    }, [token, logout]);

    useEffect(() => {
        const connectWebSocket = () => {
            if (!token || !deviceId) {
                console.log('🔍 WebSocket no puede conectar:');
                console.log('   - Token:', token ? '✅ Existe' : '❌ No existe');
                console.log('   - DeviceId:', deviceId || '❌ No existe');
                return;
            }

            // Si ya hay una conexión activa, no crear otra
            if (ws.current && (ws.current.readyState === WebSocket.CONNECTING || ws.current.readyState === WebSocket.OPEN)) {
                console.log('⚠️ Ya existe una conexión WebSocket activa');
                return;
            }

            setWsStatus('connecting');
            const wsUrl = `wss://core-cloud.dev/ws/live/${deviceId}?token=${token}`;
            console.log('🔌 Intentando conectar WebSocket...');
            console.log('📍 URL:', wsUrl);
            console.log('🆔 Device ID:', deviceId);
            console.log('🔄 Intento:', reconnectAttemptsRef.current + 1);
            
            const socket = new WebSocket(wsUrl);

            socket.onopen = () => {
                console.log('✅ WebSocket conectado exitosamente!');
                setWsStatus('connected');
                setRealtimeData([]); 
                setCurrentWatts(null);
                reconnectAttemptsRef.current = 0; // Resetear intentos de reconexión
            };

            socket.onmessage = (event) => {
                console.log('📨 Mensaje recibido del WebSocket:', event.data);
                try {
                    const message = JSON.parse(event.data);
                    console.log('📦 Mensaje parseado:', message);
                    
                    if (typeof message.watts === 'number') {
                        const newWatts = message.watts;
                        console.log('⚡ Watts recibidos:', newWatts);
                        
                        const newPoint: lineDataItem = { 
                            value: newWatts
                        };
                        
                        setCurrentWatts(newWatts);

                        setMaxChartValue(prevMax => {
                            const newTargetMax = newWatts * 1.3; 
                            return newTargetMax > prevMax ? newTargetMax : prevMax;
                        });

                        setRealtimeData(prevData => {
                            const newData = [...prevData, newPoint];
                            return newData.length > MAX_REALTIME_POINTS
                                ? newData.slice(newData.length - MAX_REALTIME_POINTS)
                                : newData;
                        });
                    } else {
                        console.warn('⚠️ Mensaje sin watts válidos:', message);
                    }
                } catch (e) { 
                    console.error('❌ Error parseando mensaje WebSocket:', e);
                    console.error('📄 Datos crudos:', event.data);
                }
            };

            socket.onerror = (error) => {
                console.error('❌ Error en WebSocket:', error);
                console.error('📍 URL que falló:', wsUrl);
                setWsStatus('error');
            };

            socket.onclose = (event) => {
                console.log('🔌 WebSocket cerrado');
                console.log('   - Código:', event.code);
                console.log('   - Razón:', event.reason || 'Sin razón especificada');
                //console.log('   - Limpio:', event.wasClean ? 'Sí' : 'No');
                
                ws.current = null;
                setCurrentWatts(null);
                
                // Intentar reconectar solo si no fue un cierre intencional y no se excedieron los intentos
                if (event.code !== 1000 && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
                    reconnectAttemptsRef.current += 1;
                    const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000); // Backoff exponencial
                    console.log(`🔄 Intentando reconectar en ${delay/1000} segundos... (Intento ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`);
                    
                    setWsStatus('connecting');
                    reconnectTimeoutRef.current = setTimeout(() => {
                        connectWebSocket();
                    }, delay);
                } else if (event.code === 1000) {
                    console.log('ℹ️ Conexión cerrada normalmente por el servidor. No se reintentará automáticamente.');
                    setWsStatus('disconnected');
                } else {
                    console.log('⚠️ Máximo de intentos de reconexión alcanzado');
                    setWsStatus('error');
                }
            };

            ws.current = socket; 
        };

        const disconnectWebSocket = () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
            if (ws.current) {
                ws.current.close();
                ws.current = null;
            }
        };

        // Solo conectar si hay token y deviceId, y si no hay carga de historial
        if (!isLoadingHistory && token && deviceId) {
            connectWebSocket();
        }

        const appStateSubscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState !== 'active') {
                disconnectWebSocket(); 
            } else {
                if (!ws.current && deviceId && token && !isLoadingHistory) {
                   setTimeout(connectWebSocket, 1000);
                }
            }
        });

        return () => {
            appStateSubscription.remove();
            disconnectWebSocket();
        };
    }, [token, deviceId, isLoadingHistory]);

    // --- LÓGICA DE GENERACIÓN DE REPORTE PDF ---
    const handleGenerateReport = async () => {
        if (!token) {
            Alert.alert("Error", "No tienes permisos para generar el reporte.");
            return;
        }

        setIsGeneratingReport(true);
        
        try {
            // 1. Obtener los datos del reporte de la API
            const reportData = await getCurrentMonthlyReport(token);
            console.log("✅ Datos del reporte obtenidos de la API");
            
            // 2. Generar el PDF
            const result = await generateEcoWattReport(reportData);

            if (result.success) {
                Alert.alert(
                    "Reporte Generado", 
                    `El reporte mensual ha sido guardado exitosamente. Puede encontrarlo en: ${result.path}`
                );
            } else {
                // --------------------------------------------------------------
                // FIX: Convertimos el objeto de error a String para evitar el fallo
                // --------------------------------------------------------------
                const errorMessage = String(result.error) || "Ocurrió un error desconocido al generar el PDF.";
                Alert.alert("Error de PDF", errorMessage);
            }

        } catch (error: any) {
            console.error("Error completo en la generación:", error);
            Alert.alert("Error de API", error.message || "Fallo al obtener los datos del reporte mensual.");
        } finally {
            setIsGeneratingReport(false);
        }
    };
    // ---------------------------------------------


    if (isLoadingHistory || isGeneratingReport) {
        return (
            <View style={statsStyles.centeredContainer}>
                <ActivityIndicator size="large" color={PRIMARY_GREEN} />
                <Text style={statsStyles.loadingText}>
                    {isGeneratingReport ? 'Generando Reporte PDF...' : 'Cargando análisis...'}
                </Text>
            </View>
        );
    }

    const calcMax = (data: ChartDataItem[]) => 
        data.length > 0 ? Math.max(...data.map(d => d.value || 0)) * 1.2 : 10;

    const maxDailyValue = calcMax(dailyData);
    const maxWeeklyValue = calcMax(weeklyData);
    const maxMonthlyValue = calcMax(monthlyData);

    const chartContainerWidth = screenWidth - 80; // Más margen para que no se salga
    const stableSpacing = chartContainerWidth / MAX_REALTIME_POINTS;

    // --- COMPONENTE DE SELECTOR DE FECHA (sin cambios) ---
    const DatePickerModal = ({ 
        visible, 
        onClose, 
        options, 
        selectedDate, 
        onSelect, 
        formatLabel 
    }: { 
        visible: boolean; 
        onClose: () => void; 
        options: Date[]; 
        selectedDate: Date; 
        onSelect: (date: Date) => void;
        formatLabel: (date: Date) => string;
    }) => (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={statsStyles.modalBackground}>
                <View style={statsStyles.modalContainer}>
                    <View style={statsStyles.modalHeader}>
                        <Text style={statsStyles.modalTitle}>Seleccionar Fecha</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Icon name="times" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={statsStyles.modalScroll}>
                        {options.map((date, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    statsStyles.dateOption,
                                    date.toDateString() === selectedDate.toDateString() && 
                                    statsStyles.dateOptionSelected
                                ]}
                                onPress={() => {
                                    onSelect(date);
                                    onClose();
                                }}
                            >
                                <Text style={[
                                    statsStyles.dateOptionText,
                                    date.toDateString() === selectedDate.toDateString() && 
                                    statsStyles.dateOptionTextSelected
                                ]}>
                                    {formatLabel(date)}
                                </Text>
                                {date.toDateString() === selectedDate.toDateString() && (
                                    <Icon name="check" size={18} color={PRIMARY_GREEN} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );

    return (
        <ImageBackground
            source={ECOWATT_BACKGROUND}
            style={statsStyles.container}
            resizeMode="cover"
        >
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

            <ScrollView contentContainerStyle={statsStyles.scrollViewContent}>
                <View style={[statsStyles.header, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 20 }]}>
                    <Text style={statsStyles.headerTitle}>Análisis de Consumo</Text>
                    
                    {/* BOTÓN PARA GENERAR PDF */}
                    <TouchableOpacity 
                        onPress={handleGenerateReport}
                        disabled={isGeneratingReport}
                    >
                        <Icon name="file-pdf" size={24} color="white" />
                    </TouchableOpacity>
                </View>

                {/* --- TIEMPO REAL (Sin cambios) --- */}
                <View style={statsStyles.card}>
                    <Text style={statsStyles.title}>Consumo Actual (Watts)</Text>
                    
                    {wsStatus === 'connected' ? (
                        <>
                            <Text style={[statsStyles.currentValue, { color: LIVE_COLOR }]}>
                                {currentWatts !== null ? `${currentWatts.toFixed(0)} W` : '--- W'}
                            </Text>
                            <View style={{ alignItems: 'center', marginTop: 10, width: '100%', overflow: 'hidden' }}>
                                {realtimeData.length > 0 ? (
                                    <LineChart
                                        areaChart
                                        curved
                                        data={realtimeData}
                                        height={150}
                                        width={chartContainerWidth}
                                        spacing={stableSpacing}
                                        color={LIVE_COLOR}
                                        thickness={2}
                                        startFillColor={LIVE_COLOR} 
                                        endFillColor={LIVE_COLOR}   
                                        startOpacity={0.3}       
                                        endOpacity={0.05}         
                                        hideRules
                                        hideYAxisText
                                        textFontSize={0} 
                                        dataPointLabelWidth={0}
                                        hideDataPoints={false} 
                                        dataPointsColor={LIVE_COLOR}
                                        dataPointsRadius={3}
                                        yAxisThickness={0}
                                        xAxisThickness={0}
                                        maxValue={maxChartValue}
                                        initialSpacing={0}
                                        endSpacing={0}
                                    />
                                ) : (
                                    <View style={{ height: 150, justifyContent: 'center' }}>
                                        <ActivityIndicator color={LIVE_COLOR} />
                                        <Text style={{color:'white', marginTop:10}}>Esperando datos...</Text>
                                    </View>
                                )}
                            </View>
                        </>
                    ) : (
                        <Text style={statsStyles.subtitle}>
                            {wsStatus === 'connecting' ? 'Conectando...' : 'Desconectado'}
                        </Text>
                    )}
                </View>

                {/* --- DIARIO (CON SELECTOR) --- */}
                <View style={statsStyles.card}>
                    <Text style={statsStyles.title}>Consumo Diario (kWh)</Text>
                    <TouchableOpacity 
                        style={statsStyles.dateSelector}
                        onPress={() => setShowDailyPicker(true)}
                    >
                        <Icon name="calendar-alt" size={16} color={PRIMARY_GREEN} />
                        <Text style={statsStyles.dateSelectorText}>
                            {formatDailyLabel(selectedDailyDate)}
                        </Text>
                        <Icon name="chevron-down" size={14} color={PRIMARY_GREEN} />
                    </TouchableOpacity>
                    {dailyData.length > 0 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <BarChart
                                data={dailyData}
                                barWidth={20}
                                spacing={15}
                                rulesColor="rgba(255,255,255,0.1)"
                                yAxisTextStyle={{ color: '#ccc', fontSize: 10 }}
                                xAxisLabelTextStyle={{ color: 'white', fontSize: 10 }}
                                xAxisThickness={0}
                                yAxisThickness={0}
                                maxValue={maxDailyValue}
                                noOfSections={3}
                                isAnimated
                                renderTooltip={(item: any) => (
                                    <View style={{ backgroundColor: '#333', padding: 5, borderRadius: 5 }}>
                                        <Text style={{ color: 'white' }}>{item.value.toFixed(3)} kWh</Text>
                                    </View>
                                )}
                            />
                        </ScrollView>
                    ) : <Text style={statsStyles.subtitle}>Sin datos para esta fecha.</Text>}
                </View>

                {/* --- SEMANAL (CON SELECTOR) --- */}
                <View style={statsStyles.card}>
                    <Text style={statsStyles.title}>Consumo Semanal (kWh)</Text>
                    <TouchableOpacity 
                        style={statsStyles.dateSelector}
                        onPress={() => setShowWeeklyPicker(true)}
                    >
                        <Icon name="calendar-week" size={16} color={PRIMARY_GREEN} />
                        <Text style={statsStyles.dateSelectorText}>
                            {formatWeeklyLabel(selectedWeeklyDate)}
                        </Text>
                        <Icon name="chevron-down" size={14} color={PRIMARY_GREEN} />
                    </TouchableOpacity>
                    {weeklyData.length > 0 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <BarChart
                                data={weeklyData}
                                barWidth={30}
                                spacing={20}
                                rulesColor="rgba(255,255,255,0.1)"
                                yAxisTextStyle={{ color: '#ccc', fontSize: 10 }}
                                xAxisLabelTextStyle={{ color: 'white', fontSize: 10 }}
                                xAxisThickness={0}
                                yAxisThickness={0}
                                maxValue={maxWeeklyValue}
                                noOfSections={3}
                                isAnimated
                                renderTooltip={(item: any) => (
                                    <View style={{ backgroundColor: '#333', padding: 5, borderRadius: 5 }}>
                                        <Text style={{ color: 'white' }}>{item.value.toFixed(2)} kWh</Text>
                                    </View>
                                )}
                            />
                        </ScrollView>
                    ) : <Text style={statsStyles.subtitle}>Sin datos para esta semana.</Text>}
                </View>

                 {/* --- MENSUAL (CON SELECTOR) --- */}
                 <View style={statsStyles.card}>
                    <Text style={statsStyles.title}>Consumo Mensual (kWh)</Text>
                    <TouchableOpacity 
                        style={statsStyles.dateSelector}
                        onPress={() => setShowMonthlyPicker(true)}
                    >
                        <Icon name="calendar" size={16} color={PRIMARY_GREEN} />
                        <Text style={statsStyles.dateSelectorText}>
                            {formatMonthlyLabel(selectedMonthlyDate)}
                        </Text>
                        <Icon name="chevron-down" size={14} color={PRIMARY_GREEN} />
                    </TouchableOpacity>
                    {monthlyData.length > 0 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <BarChart
                                data={monthlyData}
                                barWidth={30}
                                spacing={20}
                                rulesColor="rgba(255,255,255,0.1)"
                                yAxisTextStyle={{ color: '#ccc', fontSize: 10 }}
                                xAxisLabelTextStyle={{ color: 'white', fontSize: 10 }}
                                xAxisThickness={0}
                                yAxisThickness={0}
                                maxValue={maxMonthlyValue}
                                noOfSections={3}
                                isAnimated
                                renderTooltip={(item: any) => (
                                    <View style={{ backgroundColor: '#333', padding: 5, borderRadius: 5 }}>
                                        <Text style={{ color: 'white' }}>{item.value.toFixed(2)} kWh</Text>
                                    </View>
                                )}
                            />
                        </ScrollView>
                    ) : <Text style={statsStyles.subtitle}>Sin datos para este mes.</Text>}
                </View>

            </ScrollView>

            {/* --- MODALES DE SELECCIÓN --- */}
            <DatePickerModal
                visible={showDailyPicker}
                onClose={() => setShowDailyPicker(false)}
                options={generateDailyOptions()}
                selectedDate={selectedDailyDate}
                onSelect={setSelectedDailyDate}
                formatLabel={formatDailyLabel}
            />

            <DatePickerModal
                visible={showWeeklyPicker}
                onClose={() => setShowWeeklyPicker(false)}
                options={generateWeeklyOptions()}
                selectedDate={selectedWeeklyDate}
                onSelect={setSelectedWeeklyDate}
                formatLabel={formatWeeklyLabel}
            />

            <DatePickerModal
                visible={showMonthlyPicker}
                onClose={() => setShowMonthlyPicker(false)}
                options={generateMonthlyOptions()}
                selectedDate={selectedMonthlyDate}
                onSelect={setSelectedMonthlyDate}
                formatLabel={formatMonthlyLabel}
            />
        </ImageBackground>
    );
};

export default StatsScreen;