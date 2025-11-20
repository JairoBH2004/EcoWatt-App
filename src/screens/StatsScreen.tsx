import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, ImageBackground, StatusBar,
    ScrollView, ActivityIndicator, Dimensions, AppState,
    TouchableOpacity, Modal, Alert, StyleSheet
} from 'react-native';
import { BarChart, LineChart, lineDataItem } from 'react-native-gifted-charts';
import Icon from 'react-native-vector-icons/FontAwesome5';

import { statsStyles } from '../styles/StatsStyles';
import { useAuthStore } from '../store/useAuthStore';
import { getHistoryGraph, HistoryDataPoint, getDevices } from '../services/authService';

// --- IMPORTACIONES PARA REPORTES ---
import { generateEcoWattReport } from '../services/PDFGenerator';
import { getCurrentMonthlyReport } from '../services/reportService';

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

    // Estados de Gráficas
    const [dailyData, setDailyData] = useState<ChartDataItem[]>([]);
    const [weeklyData, setWeeklyData] = useState<ChartDataItem[]>([]);
    const [monthlyData, setMonthlyData] = useState<ChartDataItem[]>([]);
    
    // Estados de Carga
    const [isLoadingHistory, setIsLoadingHistory] = useState(true); 
    const [historyError, setHistoryError] = useState('');

    // Estados de WebSocket / Tiempo Real
    const [deviceId, setDeviceId] = useState<number | null>(null);
    const [realtimeData, setRealtimeData] = useState<lineDataItem[]>([]); 
    const [currentWatts, setCurrentWatts] = useState<number | null>(null);
    const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
    const [maxChartValue, setMaxChartValue] = useState(100); 
    
    // Refs WebSocket
    const ws = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<number | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const MAX_RECONNECT_ATTEMPTS = 3;

    // Estado Reporte PDF
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);

    // Selectores de Fecha
    const [selectedDailyDate, setSelectedDailyDate] = useState(new Date());
    const [selectedWeeklyDate, setSelectedWeeklyDate] = useState(new Date());
    const [selectedMonthlyDate, setSelectedMonthlyDate] = useState(new Date());
    const [showDailyPicker, setShowDailyPicker] = useState(false);
    const [showWeeklyPicker, setShowWeeklyPicker] = useState(false);
    const [showMonthlyPicker, setShowMonthlyPicker] = useState(false);

    // --- HELPERS DE FORMATO ---
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
        if (format === 'weekday') return date.toLocaleDateString('es-MX', { weekday: 'short' }).replace('.', ''); 
        if (format === 'dayMonth') return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }).replace('.', '');
        return '';
    };

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

    const formatDailyLabel = (date: Date) => date.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

    const formatWeeklyLabel = (date: Date) => {
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return `${startOfWeek.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} - ${endOfWeek.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}`;
    };

    const formatMonthlyLabel = (date: Date) => date.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });

    // ---------------------------------------------------------
    // 🚀 EFECTO 1: CARGA DE DATOS (CORREGIDO PARA NO BLOQUEAR)
    // ---------------------------------------------------------
    useEffect(() => {
        const loadAllData = async () => {
            if (!token) {
                setIsLoadingHistory(false);
                setTimeout(() => logout(), 100);
                return;
            }

            // 1. PRIORIDAD: Obtener dispositivo para el WebSocket
            // Lo hacemos fuera del Promise.all masivo para tener el ID rápido
            try {
                const devices = await getDevices(token);
                if (devices.length > 0) {
                    console.log('✅ Dispositivo encontrado:', devices[0].dev_id);
                    setDeviceId(devices[0].dev_id); // Esto activa el WebSocket inmediatamente
                } else {
                    console.warn('⚠️ No hay dispositivos registrados');
                }
            } catch (devErr) {
                console.error("Error obteniendo dispositivos:", devErr);
            }

            // 2. SECUNDARIO: Cargar historial (puede tardar, no bloquea lo anterior)
            setIsLoadingHistory(true);
            setHistoryError('');
            
            try {
                const [dailyResponse, weeklyResponse, monthlyResponse] = await Promise.allSettled([
                    getHistoryGraph(token, 'daily'),
                    getHistoryGraph(token, 'weekly'),
                    getHistoryGraph(token, 'monthly'),
                ]);

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
                console.error('Error cargando historial:', err);
                setHistoryError('Error al cargar historial.');
            } finally {
                setIsLoadingHistory(false);
            }
        };

        loadAllData();
    }, [token, logout]);


    // ---------------------------------------------------------
    // 🔌 EFECTO 2: WEBSOCKET (CORREGIDO)
    // ---------------------------------------------------------
    useEffect(() => {
        const connectWebSocket = () => {
            // CORRECCIÓN: Eliminamos !isLoadingHistory de la condición.
            // Si tenemos token y deviceId, conectamos de una.
            if (!token || !deviceId) return;

            if (ws.current && (ws.current.readyState === WebSocket.CONNECTING || ws.current.readyState === WebSocket.OPEN)) {
                return;
            }

            setWsStatus('connecting');
            const wsUrl = `wss://core-cloud.dev/ws/live/${deviceId}?token=${token}`;
            console.log('🔌 Conectando WS a:', wsUrl);
            
            const socket = new WebSocket(wsUrl);

            socket.onopen = () => {
                console.log('✅ WS Conectado');
                setWsStatus('connected');
                reconnectAttemptsRef.current = 0;
            };

            socket.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    if (typeof message.watts === 'number') {
                        const newWatts = message.watts;
                        setCurrentWatts(newWatts);

                        // Ajuste dinámico del máximo de la gráfica
                        setMaxChartValue(prev => Math.max(prev, newWatts * 1.3));

                        setRealtimeData(prev => {
                            const newData = [...prev, { value: newWatts }];
                            return newData.length > MAX_REALTIME_POINTS
                                ? newData.slice(newData.length - MAX_REALTIME_POINTS)
                                : newData;
                        });
                    }
                } catch (e) { 
                    console.error('Error parsing WS msg'); 
                }
            };

            socket.onerror = (error) => {
                console.error('❌ Error WS:', error);
                setWsStatus('error');
            };

            socket.onclose = (event) => {
                console.log('🔌 WS Cerrado code:', event.code);
                ws.current = null;
                
                if (event.code !== 1000 && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
                    reconnectAttemptsRef.current += 1;
                    const delay = 1000 * reconnectAttemptsRef.current;
                    console.log(`🔄 Reconectando en ${delay}ms...`);
                    setWsStatus('connecting');
                    reconnectTimeoutRef.current = setTimeout(connectWebSocket, delay);
                } else {
                    setWsStatus('disconnected');
                }
            };

            ws.current = socket; 
        };

        const disconnectWebSocket = () => {
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
            if (ws.current) {
                ws.current.close();
                ws.current = null;
            }
        };

        // Se inicia la conexión en cuanto hay DeviceID
        if (deviceId && token) {
            connectWebSocket();
        }

        const appStateSubscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState !== 'active') {
                disconnectWebSocket(); 
            } else {
                if (!ws.current && deviceId && token) {
                   setTimeout(connectWebSocket, 500);
                }
            }
        });

        return () => {
            appStateSubscription.remove();
            disconnectWebSocket();
        };
    }, [token, deviceId]); // Quitamos isLoadingHistory de las dependencias


    // ---------------------------------------------------------
    // 📄 GENERACIÓN DE REPORTE (CORREGIDO)
    // ---------------------------------------------------------
    const handleGenerateReport = async () => {
        if (!token) return;
        setIsGeneratingReport(true);
        
        try {
            console.log("📥 Solicitando datos del reporte...");
            const reportData = await getCurrentMonthlyReport(token);
            
            console.log("🔨 Generando PDF...");
            const result = await generateEcoWattReport(reportData);

            if (result.success) {
                Alert.alert(
                    "¡Reporte Listo!", 
                    `Se ha guardado en: \n${result.path}`,
                    [{ text: "OK" }]
                );
            } else {
                // CORRECCIÓN: Manejo seguro del objeto error
                const errString = typeof result.error === 'object' 
                    ? JSON.stringify(result.error) 
                    : String(result.error);
                Alert.alert("Error al crear PDF", errString);
            }

        } catch (error: any) {
            console.error("Error generando reporte:", error);
            Alert.alert("Error", error.message || "No se pudo generar el reporte.");
        } finally {
            setIsGeneratingReport(false);
        }
    };

    const calcMax = (data: ChartDataItem[]) => 
        data.length > 0 ? Math.max(...data.map(d => d.value || 0)) * 1.2 : 10;

    const chartContainerWidth = screenWidth - 80; 
    const stableSpacing = chartContainerWidth / MAX_REALTIME_POINTS;

    // Componente Modal Fecha (Sin cambios)
    const DatePickerModal = ({ visible, onClose, options, selectedDate, onSelect, formatLabel }: any) => (
        <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
            <View style={statsStyles.modalBackground}>
                <View style={statsStyles.modalContainer}>
                    <View style={statsStyles.modalHeader}>
                        <Text style={statsStyles.modalTitle}>Seleccionar Fecha</Text>
                        <TouchableOpacity onPress={onClose}><Icon name="times" size={24} color="#fff" /></TouchableOpacity>
                    </View>
                    <ScrollView style={statsStyles.modalScroll}>
                        {options.map((date: Date, index: number) => (
                            <TouchableOpacity
                                key={index}
                                style={[statsStyles.dateOption, date.toDateString() === selectedDate.toDateString() && statsStyles.dateOptionSelected]}
                                onPress={() => { onSelect(date); onClose(); }}
                            >
                                <Text style={[statsStyles.dateOptionText, date.toDateString() === selectedDate.toDateString() && statsStyles.dateOptionTextSelected]}>
                                    {formatLabel(date)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );

    return (
        <ImageBackground source={ECOWATT_BACKGROUND} style={statsStyles.container} resizeMode="cover">
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

            <ScrollView contentContainerStyle={statsStyles.scrollViewContent}>
                {/* Header Simple */}
                <View style={statsStyles.header}>
                    <Text style={statsStyles.headerTitle}>Análisis de Consumo</Text>
                </View>

                {/* --- TIEMPO REAL --- */}
                <View style={statsStyles.card}>
                    <View style={localStyles.cardHeaderRow}>
                        <Text style={statsStyles.title}>Consumo Actual</Text>
                        <View style={[localStyles.statusBadge, { backgroundColor: wsStatus === 'connected' ? PRIMARY_GREEN : '#555' }]}>
                            <Text style={localStyles.statusText}>{wsStatus === 'connected' ? 'LIVE' : 'OFF'}</Text>
                        </View>
                    </View>
                    
                    <Text style={[statsStyles.currentValue, { color: LIVE_COLOR, alignSelf: 'center', marginVertical: 10 }]}>
                        {currentWatts !== null ? `${currentWatts.toFixed(0)} W` : '---'}
                    </Text>
                    
                    <View style={{ alignItems: 'center', overflow: 'hidden' }}>
                        <LineChart
                            areaChart
                            curved
                            data={realtimeData.length > 0 ? realtimeData : [{value:0}]}
                            height={150}
                            width={chartContainerWidth}
                            spacing={stableSpacing}
                            color={LIVE_COLOR}
                            startFillColor={LIVE_COLOR} 
                            endFillColor={LIVE_COLOR}   
                            startOpacity={0.3} endOpacity={0.05}         
                            hideRules hideYAxisText hideDataPoints
                            xAxisThickness={0} yAxisThickness={0}
                            maxValue={maxChartValue}
                        />
                    </View>
                </View>

                {/* --- DIARIO --- */}
                <View style={statsStyles.card}>
                    <View style={localStyles.cardHeaderRow}>
                        <Text style={statsStyles.title}>Diario (kWh)</Text>
                        <TouchableOpacity style={statsStyles.dateSelector} onPress={() => setShowDailyPicker(true)}>
                            <Text style={statsStyles.dateSelectorText}>{formatDailyLabel(selectedDailyDate)}</Text>
                            <Icon name="chevron-down" size={12} color={PRIMARY_GREEN} />
                        </TouchableOpacity>
                    </View>
                    {isLoadingHistory ? <ActivityIndicator color={PRIMARY_GREEN} /> : (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <BarChart data={dailyData} barWidth={20} spacing={15} rulesColor="rgba(255,255,255,0.1)" yAxisTextStyle={{color:'#ccc'}} xAxisLabelTextStyle={{color:'white'}} xAxisThickness={0} yAxisThickness={0} maxValue={calcMax(dailyData)} noOfSections={3} isAnimated />
                        </ScrollView>
                    )}
                </View>

                {/* --- SEMANAL --- */}
                <View style={statsStyles.card}>
                    <View style={localStyles.cardHeaderRow}>
                        <Text style={statsStyles.title}>Semanal (kWh)</Text>
                        <TouchableOpacity style={statsStyles.dateSelector} onPress={() => setShowWeeklyPicker(true)}>
                            <Text style={statsStyles.dateSelectorText}>{formatWeeklyLabel(selectedWeeklyDate)}</Text>
                            <Icon name="chevron-down" size={12} color={PRIMARY_GREEN} />
                        </TouchableOpacity>
                    </View>
                    {isLoadingHistory ? <ActivityIndicator color={PRIMARY_GREEN} /> : (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <BarChart data={weeklyData} barWidth={30} spacing={20} rulesColor="rgba(255,255,255,0.1)" yAxisTextStyle={{color:'#ccc'}} xAxisLabelTextStyle={{color:'white'}} xAxisThickness={0} yAxisThickness={0} maxValue={calcMax(weeklyData)} noOfSections={3} isAnimated />
                        </ScrollView>
                    )}
                </View>

                {/* --- MENSUAL Y REPORTE --- */}
                <View style={statsStyles.card}>
                    <View style={localStyles.cardHeaderRow}>
                        <Text style={statsStyles.title}>Mensual</Text>
                        
                        {/* 🔥 BOTÓN REUBICADO AQUÍ 🔥 */}
                        <TouchableOpacity 
                            style={localStyles.pdfButton}
                            onPress={handleGenerateReport}
                            disabled={isGeneratingReport}
                        >
                            {isGeneratingReport ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <Icon name="file-pdf" size={14} color="#fff" style={{marginRight: 6}} />
                                    <Text style={localStyles.pdfButtonText}>Reporte</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={[statsStyles.dateSelector, {alignSelf:'flex-start', marginBottom: 10}]} onPress={() => setShowMonthlyPicker(true)}>
                        <Text style={statsStyles.dateSelectorText}>{formatMonthlyLabel(selectedMonthlyDate)}</Text>
                        <Icon name="chevron-down" size={12} color={PRIMARY_GREEN} />
                    </TouchableOpacity>

                    {isLoadingHistory ? <ActivityIndicator color={PRIMARY_GREEN} /> : (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <BarChart data={monthlyData} barWidth={30} spacing={20} rulesColor="rgba(255,255,255,0.1)" yAxisTextStyle={{color:'#ccc'}} xAxisLabelTextStyle={{color:'white'}} xAxisThickness={0} yAxisThickness={0} maxValue={calcMax(monthlyData)} noOfSections={3} isAnimated />
                        </ScrollView>
                    )}
                </View>

            </ScrollView>

            {/* MODALES */}
            <DatePickerModal visible={showDailyPicker} onClose={()=>setShowDailyPicker(false)} options={generateDailyOptions()} selectedDate={selectedDailyDate} onSelect={setSelectedDailyDate} formatLabel={formatDailyLabel} />
            <DatePickerModal visible={showWeeklyPicker} onClose={()=>setShowWeeklyPicker(false)} options={generateWeeklyOptions()} selectedDate={selectedWeeklyDate} onSelect={setSelectedWeeklyDate} formatLabel={formatWeeklyLabel} />
            <DatePickerModal visible={showMonthlyPicker} onClose={()=>setShowMonthlyPicker(false)} options={generateMonthlyOptions()} selectedDate={selectedMonthlyDate} onSelect={setSelectedMonthlyDate} formatLabel={formatMonthlyLabel} />
        </ImageBackground>
    );
};

// Estilos locales para ajustes rápidos de UI
const localStyles = StyleSheet.create({
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        width: '100%'
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },
    statusText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold'
    },
    pdfButton: {
        flexDirection: 'row',
        backgroundColor: '#444', // Un gris oscuro elegante
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: PRIMARY_GREEN,
    },
    pdfButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    }
});

export default StatsScreen;