import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, ImageBackground, StatusBar,
    ScrollView, ActivityIndicator, Dimensions, AppState,
    TouchableOpacity, Modal, Alert, StyleSheet,
    PermissionsAndroid, 
    Platform 
} from 'react-native';
import { BarChart, LineChart, lineDataItem } from 'react-native-gifted-charts';
import Icon from 'react-native-vector-icons/FontAwesome5';

import { statsStyles } from '../styles/StatsStyles';
import { useAuthStore } from '../store/useAuthStore';
import { getHistoryGraph, HistoryDataPoint, getDevices } from '../services/authService';

// --- IMPORTACIONES PARA REPORTES ---
import { generateEcoWattReport, MonthlyReportData } from '../services/PDFGenerator'; 
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
    dataPointText?: string; // Aunque lo tengas aquí, el tooltip es mejor
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

    const formatDailyLabel = (date: Date) => date.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
    const formatWeeklyLabel = (date: Date) => {
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return `${startOfWeek.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} - ${endOfWeek.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}`;
    };
    const formatMonthlyLabel = (date: Date) => date.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });

    // ---------------------------------------------------------
    // CARGA DE DATOS
    // ---------------------------------------------------------
    useEffect(() => {
        const loadAllData = async () => {
            if (!token) {
                setIsLoadingHistory(false);
                setTimeout(() => logout(), 100);
                return;
            }

            try {
                const devices = await getDevices(token);
                if (devices.length > 0) {
                    setDeviceId(devices[0].dev_id);
                }
            } catch (devErr) {
                console.error("❌ Error obteniendo dispositivos:", devErr);
            }

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
                        // focusable: true, // Ya no es estrictamente necesario si usamos renderTooltip
                    }));
                    setDailyData(formatted);
                }

                if (weeklyResponse.status === 'fulfilled') {
                    const formatted = weeklyResponse.value.data_points.map((p: HistoryDataPoint) => ({ 
                        value: p.value, 
                        label: formatDateLabel(p.timestamp, 'weekday'),
                        frontColor: PRIMARY_GREEN,
                    }));
                    setWeeklyData(formatted);
                }

                if (monthlyResponse.status === 'fulfilled') {
                    const formatted = monthlyResponse.value.data_points.map((p: HistoryDataPoint) => ({ 
                        value: p.value, 
                        label: formatDateLabel(p.timestamp, 'dayMonth'),
                        frontColor: PRIMARY_GREEN,
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
    // WEBSOCKET
    // ---------------------------------------------------------
    useEffect(() => {
        const connectWebSocket = () => {
            if (!token || !deviceId) return;

            if (ws.current && (ws.current.readyState === WebSocket.CONNECTING || ws.current.readyState === WebSocket.OPEN)) {
                return;
            }

            setWsStatus('connecting');
            const wsUrl = `wss://core-cloud.dev/ws/live/${deviceId}?token=${token}`;
            
            const socket = new WebSocket(wsUrl);

            socket.onopen = () => {
                setWsStatus('connected');
                reconnectAttemptsRef.current = 0;
                setRealtimeData([{ value: 0 }]);
            };

            socket.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    if (typeof message.watts === 'number') {
                        const newWatts = message.watts;
                        setCurrentWatts(newWatts);
                        setMaxChartValue(prev => Math.max(prev, newWatts * 1.3));
                        setRealtimeData(prev => {
                            const newData = [...prev, { value: newWatts }];
                            return newData.length > MAX_REALTIME_POINTS
                                ? newData.slice(newData.length - MAX_REALTIME_POINTS)
                                : newData;
                        });
                    }
                } catch (e) { console.error(e); }
            };

            socket.onerror = (error) => {
                setWsStatus('error');
            };

            socket.onclose = (event) => {
                ws.current = null;
                if (event.code !== 1000 && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
                    reconnectAttemptsRef.current += 1;
                    const delay = 1000 * reconnectAttemptsRef.current;
                    setWsStatus('connecting');
                    reconnectTimeoutRef.current = setTimeout(connectWebSocket, delay);
                } else {
                    setWsStatus('disconnected');
                    setRealtimeData([{ value: 0 }]);
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

        if (deviceId && token) connectWebSocket();

        const appStateSubscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState !== 'active') {
                disconnectWebSocket(); 
            } else {
                if (!ws.current && deviceId && token) setTimeout(connectWebSocket, 500);
            }
        });

        return () => {
            appStateSubscription.remove();
            disconnectWebSocket();
        };
    }, [token, deviceId]); 

    // ---------------------------------------------------------
    // REPORTE PDF (LÓGICA ANDROID 13+)
    // ---------------------------------------------------------
    const handleGenerateReport = async () => {
        if (!token) return;

        if (Platform.OS === 'android' && Platform.Version < 33) {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                    {
                        title: "Permiso de Almacenamiento",
                        message: "EcoWatt necesita permiso para guardar el reporte PDF en tus descargas.",
                        buttonNeutral: "Más tarde",
                        buttonNegative: "Cancelar",
                        buttonPositive: "Aceptar"
                    }
                );
                
                if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                    Alert.alert("Permiso Denegado", "No podemos guardar el reporte sin permiso de almacenamiento.");
                    return; 
                }
            } catch (err) {
                console.warn('Error al solicitar permisos:', err);
                return;
            }
        }

        setIsGeneratingReport(true);
        
        try {
            const reportData = await getCurrentMonthlyReport(token);
            const result = await generateEcoWattReport(reportData);

            if (result.success) {
                Alert.alert("¡Reporte Listo!", `Guardado en: \n${result.path}`, [{ text: "OK" }]);
            } else {
                Alert.alert("Error", "No se pudo crear el PDF.");
            }

        } catch (error: any) {
            Alert.alert("Error", error.message || "Fallo al generar reporte.");
        } finally {
            setIsGeneratingReport(false);
        }
    };

    const calcMax = (data: ChartDataItem[]) => 
        data.length > 0 ? Math.max(...data.map(d => d.value || 0)) * 1.2 : 10;

    const chartContainerWidth = screenWidth - 70; 
    const stableSpacing = chartContainerWidth / MAX_REALTIME_POINTS;

    // --- RENDER TOOLTIP COMPONENT ---
    // Este pequeño componente muestra el valor al hacer click
    const renderTooltip = (item: any) => {
        return (
            <View style={{
                marginBottom: 5,
                marginLeft: -15,
                backgroundColor: '#222',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 4,
                borderWidth: 1,
                borderColor: PRIMARY_GREEN,
                zIndex: 1000
            }}>
                <Text style={{color: 'white', fontSize: 12, fontWeight: 'bold', textAlign: 'center'}}>
                    {item.value.toFixed(2)}
                </Text>
            </View>
        );
    };

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

    const hasRealtimeData = realtimeData.length > 1 || (realtimeData.length === 1 && (realtimeData[0]?.value ?? 0) > 0);

    return (
        <ImageBackground source={ECOWATT_BACKGROUND} style={statsStyles.container} resizeMode="cover">
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

            <ScrollView contentContainerStyle={statsStyles.scrollViewContent}>
                <View style={{ marginTop: 50, marginBottom: 10, paddingHorizontal: 20 }}>
                    <Text style={statsStyles.headerTitle}>Análisis de Consumo</Text>
                </View>

                {/* --- TIEMPO REAL --- */}
                <View style={statsStyles.card}>
                    <View style={localStyles.cleanHeader}>
                        <Text style={localStyles.cardTitle}>Actual</Text>
                        <View style={[localStyles.liveBadge, { backgroundColor: wsStatus === 'connected' ? PRIMARY_GREEN : '#555' }]}>
                            <Text style={localStyles.badgeText}>
                                {wsStatus === 'connected' ? 'EN VIVO' : 
                                 wsStatus === 'connecting' ? 'CONECTANDO' : 
                                 wsStatus === 'error' ? 'ERROR' : 'DESCONECTADO'}
                            </Text>
                        </View>
                    </View>
                    
                    <View style={localStyles.wattsContainer}>
                        {wsStatus === 'connecting' ? (
                            <ActivityIndicator size="small" color={PRIMARY_GREEN} />
                        ) : (
                            <Text style={localStyles.wattsText}>
                                {currentWatts !== null ? `${currentWatts.toFixed(0)} W` : '--- W'}
                            </Text>
                        )}
                    </View>
                    
                    {!hasRealtimeData && wsStatus === 'disconnected' && (
                        <View style={localStyles.noDataContainer}>
                            <Icon name="plug" size={30} color="#666" />
                            <Text style={localStyles.noDataText}>Esperando datos en tiempo real...</Text>
                            <Text style={localStyles.noDataSubtext}>
                                {deviceId ? 'Conectando al dispositivo' : 'No se encontró dispositivo'}
                            </Text>
                        </View>
                    )}
                    
                    <View style={{ alignItems: 'center', overflow: 'hidden', height: 150 }}>
                        <LineChart
                            areaChart
                            curved
                            data={hasRealtimeData ? realtimeData : [{ value: 0 }]}
                            height={150}
                            width={chartContainerWidth}
                            spacing={stableSpacing}
                            color={LIVE_COLOR}
                            startFillColor={LIVE_COLOR} 
                            endFillColor={LIVE_COLOR}   
                            startOpacity={0.3} 
                            endOpacity={0.05}         
                            hideRules 
                            hideYAxisText 
                            hideDataPoints
                            xAxisThickness={0} 
                            yAxisThickness={0}
                            maxValue={maxChartValue}
                            initialSpacing={0}
                        />
                    </View>
                </View>

                {/* --- DIARIO --- */}
                <View style={statsStyles.card}>
                    <View style={localStyles.cleanHeader}>
                        <Text style={localStyles.cardTitle}>Diario</Text>
                        <TouchableOpacity style={localStyles.selectorButton} onPress={() => setShowDailyPicker(true)}>
                            <Text style={localStyles.selectorText}>{formatDailyLabel(selectedDailyDate)}</Text>
                            <Icon name="chevron-down" size={10} color={PRIMARY_GREEN} style={{marginLeft: 5}} />
                        </TouchableOpacity>
                    </View>
                    
                    {isLoadingHistory ? <ActivityIndicator color={PRIMARY_GREEN} style={{marginVertical: 20}} /> : (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <BarChart 
                                data={dailyData} 
                                barWidth={20} 
                                spacing={15} 
                                rulesColor="rgba(255,255,255,0.1)" 
                                yAxisTextStyle={{color:'#ccc'}} 
                                xAxisLabelTextStyle={{color:'white'}} 
                                xAxisThickness={0} 
                                yAxisThickness={0} 
                                maxValue={calcMax(dailyData)} 
                                noOfSections={3} 
                                isAnimated
                                renderTooltip={renderTooltip} // <--- ¡AQUÍ ESTÁ LA MAGIA!
                            />
                        </ScrollView>
                    )}
                </View>

                {/* --- SEMANAL --- */}
                <View style={statsStyles.card}>
                    <View style={localStyles.cleanHeader}>
                        <Text style={localStyles.cardTitle}>Semanal</Text>
                        <TouchableOpacity style={localStyles.selectorButton} onPress={() => setShowWeeklyPicker(true)}>
                            <Text style={localStyles.selectorText}>{formatWeeklyLabel(selectedWeeklyDate)}</Text>
                            <Icon name="chevron-down" size={10} color={PRIMARY_GREEN} style={{marginLeft: 5}} />
                        </TouchableOpacity>
                    </View>

                    {isLoadingHistory ? <ActivityIndicator color={PRIMARY_GREEN} style={{marginVertical: 20}} /> : (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <BarChart 
                                data={weeklyData} 
                                barWidth={30} 
                                spacing={20} 
                                rulesColor="rgba(255,255,255,0.1)" 
                                yAxisTextStyle={{color:'#ccc'}} 
                                xAxisLabelTextStyle={{color:'white'}} 
                                xAxisThickness={0} 
                                yAxisThickness={0} 
                                maxValue={calcMax(weeklyData)} 
                                noOfSections={3} 
                                isAnimated
                                renderTooltip={renderTooltip} // <--- ¡AQUÍ TAMBIÉN!
                            />
                        </ScrollView>
                    )}
                </View>

                {/* --- MENSUAL Y REPORTE --- */}
                <View style={statsStyles.card}>
                    <View style={localStyles.cleanHeader}>
                        <Text style={localStyles.cardTitle}>Mensual</Text>
                        
                        <TouchableOpacity 
                            style={localStyles.reportButton}
                            onPress={handleGenerateReport}
                            disabled={isGeneratingReport}
                        >
                            {isGeneratingReport ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <Icon name="file-pdf" size={12} color="#fff" style={{marginRight: 5}} />
                                    <Text style={localStyles.reportButtonText}>GENERAR REPORTE</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                    
                    <View style={{ alignItems: 'flex-start', marginBottom: 15 }}>
                        <TouchableOpacity style={localStyles.selectorButton} onPress={() => setShowMonthlyPicker(true)}>
                            <Text style={localStyles.selectorText}>{formatMonthlyLabel(selectedMonthlyDate)}</Text>
                            <Icon name="chevron-down" size={10} color={PRIMARY_GREEN} style={{marginLeft: 5}} />
                        </TouchableOpacity>
                    </View>

                    {isLoadingHistory ? <ActivityIndicator color={PRIMARY_GREEN} style={{marginVertical: 20}} /> : (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <BarChart 
                                data={monthlyData} 
                                barWidth={30} 
                                spacing={20} 
                                rulesColor="rgba(255,255,255,0.1)" 
                                yAxisTextStyle={{color:'#ccc'}} 
                                xAxisLabelTextStyle={{color:'white'}} 
                                xAxisThickness={0} 
                                yAxisThickness={0} 
                                maxValue={calcMax(monthlyData)} 
                                noOfSections={3} 
                                isAnimated
                                renderTooltip={renderTooltip} // <--- Y AQUÍ TAMBIÉN!
                            />
                        </ScrollView>
                    )}
                </View>

            </ScrollView>

            <DatePickerModal visible={showDailyPicker} onClose={()=>setShowDailyPicker(false)} options={generateDailyOptions()} selectedDate={selectedDailyDate} onSelect={setSelectedDailyDate} formatLabel={formatDailyLabel} />
            <DatePickerModal visible={showWeeklyPicker} onClose={()=>setShowWeeklyPicker(false)} options={generateWeeklyOptions()} selectedDate={selectedWeeklyDate} onSelect={setSelectedWeeklyDate} formatLabel={formatWeeklyLabel} />
            <DatePickerModal visible={showMonthlyPicker} onClose={()=>setShowMonthlyPicker(false)} options={generateMonthlyOptions()} selectedDate={selectedMonthlyDate} onSelect={setSelectedMonthlyDate} formatLabel={formatMonthlyLabel} />
        </ImageBackground>
    );
};

const localStyles = StyleSheet.create({
    cleanHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        width: '100%',
        paddingHorizontal: 0, 
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        flex: 1,
    },
    selectorButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 255, 127, 0.1)',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: PRIMARY_GREEN,
    },
    selectorText: {
        color: PRIMARY_GREEN,
        fontSize: 12,
        fontWeight: '600',
    },
    liveBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase'
    },
    wattsContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 10
    },
    wattsText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: LIVE_COLOR,
        textShadowColor: 'rgba(255, 99, 71, 0.5)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    reportButton: {
        flexDirection: 'row',
        backgroundColor: '#444',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#666',
    },
    reportButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    noDataContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 30,
    },
    noDataText: {
        color: '#999',
        fontSize: 14,
        marginTop: 10,
        fontWeight: '600',
    },
    noDataSubtext: {
        color: '#666',
        fontSize: 12,
        marginTop: 5,
    },
    debugText: {
        color: '#666',
        fontSize: 10,
        textAlign: 'center',
        marginTop: 10,
    }
});

export default StatsScreen;