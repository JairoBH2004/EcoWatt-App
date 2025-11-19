import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, ImageBackground, StatusBar,
    ScrollView, ActivityIndicator, Dimensions, AppState
} from 'react-native';
import { BarChart, LineChart, lineDataItem } from 'react-native-gifted-charts';

import { statsStyles } from '../styles/StatsStyles';
import { useAuthStore } from '../store/useAuthStore';
import { getHistoryGraph, HistoryDataPoint, getDevices } from '../services/authService';

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

    // Formateo de fechas (incluye AM/PM para horas)
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

                if (devicesResponse.status === 'fulfilled' && devicesResponse.value.length > 0) {
                    setDeviceId(devicesResponse.value[0].dev_id); 
                } else if (devicesResponse.status === 'rejected' && !devicesResponse.reason?.message?.includes('404')) {
                    console.error("Error devices:", devicesResponse.reason);
                }

                if (dailyResponse.status === 'fulfilled') {
                    const formatted = dailyResponse.value.data_points.map((p: HistoryDataPoint) => ({
                        value: p.value,
                        label: formatDateLabel(p.timestamp, 'hour'),
                        frontColor: PRIMARY_GREEN,
                        focusable: true, // Importante para el click
                        dataPointText: `${p.value.toFixed(2)}`
                    }));
                    setDailyData(formatted);
                }

                if (weeklyResponse.status === 'fulfilled') {
                    const formatted = weeklyResponse.value.data_points.map((p: HistoryDataPoint) => ({ 
                        value: p.value, 
                        label: formatDateLabel(p.timestamp, 'weekday'),
                        frontColor: PRIMARY_GREEN,
                        focusable: true, // Importante para el click
                        dataPointText: `${p.value.toFixed(1)}`
                    }));
                    setWeeklyData(formatted);
                }

                if (monthlyResponse.status === 'fulfilled') {
                    const formatted = monthlyResponse.value.data_points.map((p: HistoryDataPoint) => ({ 
                        value: p.value, 
                        label: formatDateLabel(p.timestamp, 'dayMonth'),
                        frontColor: PRIMARY_GREEN,
                        focusable: true, // Importante para el click
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
            if (!token || !deviceId || ws.current) return;

            setWsStatus('connecting');
            const wsUrl = `wss://core-cloud.dev/ws/live/${deviceId}?token=${token}`;
            const socket = new WebSocket(wsUrl);

            socket.onopen = () => {
                setWsStatus('connected');
                setRealtimeData([]); 
                setCurrentWatts(null);
            };

            socket.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    if (typeof message.watts === 'number') {
                        const newWatts = message.watts; 
                        
                        const newPoint: lineDataItem = { 
                            value: newWatts,
                            hideDataPointLabel: true 
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
                    }
                } catch (e) { console.error('WS Parse error', e); }
            };

            socket.onerror = () => {
                setWsStatus('error');
                ws.current = null; 
            };

            socket.onclose = () => {
                if (wsStatus !== 'error') setWsStatus('disconnected');
                ws.current = null;
                setCurrentWatts(null);
            };

            ws.current = socket; 
        };

        const disconnectWebSocket = () => {
            ws.current?.close();
            ws.current = null;
        };

        connectWebSocket();

        const appStateSubscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState !== 'active') {
                disconnectWebSocket(); 
            } else {
                if (!ws.current && deviceId && token) {
                   setTimeout(connectWebSocket, 1000);
                }
            }
        });

        return () => {
            appStateSubscription.remove();
            disconnectWebSocket();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, deviceId, isLoadingHistory]);

    if (isLoadingHistory) {
        return (
            <View style={statsStyles.centeredContainer}>
                <ActivityIndicator size="large" color={PRIMARY_GREEN} />
                <Text style={statsStyles.loadingText}>Cargando análisis...</Text>
            </View>
        );
    }

    const calcMax = (data: ChartDataItem[]) => 
        data.length > 0 ? Math.max(...data.map(d => d.value || 0)) * 1.2 : 10;

    const maxDailyValue = calcMax(dailyData);
    const maxWeeklyValue = calcMax(weeklyData);
    const maxMonthlyValue = calcMax(monthlyData);

    const chartContainerWidth = screenWidth - 40; 
    const stableSpacing = (chartContainerWidth - 40) / MAX_REALTIME_POINTS;

    return (
        <ImageBackground
            source={ECOWATT_BACKGROUND}
            style={statsStyles.container}
            resizeMode="cover"
        >
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

            <ScrollView contentContainerStyle={statsStyles.scrollViewContent}>
                <View style={statsStyles.header}>
                    <Text style={statsStyles.headerTitle}>Análisis de Consumo</Text>
                </View>

                {/* --- TIEMPO REAL --- */}
                <View style={statsStyles.card}>
                    <Text style={statsStyles.title}>Consumo Actual (Watts)</Text>
                    
                    {wsStatus === 'connected' ? (
                        <>
                            <Text style={[statsStyles.currentValue, { color: LIVE_COLOR }]}>
                                {currentWatts !== null ? `${currentWatts.toFixed(0)} W` : '--- W'}
                            </Text>
                            <View style={{ alignItems: 'center', marginTop: 10 }}>
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
                                        hideDataPointLabel={true}
                                        textFontSize={0} 
                                        dataPointLabelWidth={0}
                                        hideDataPoints={false} 
                                        dataPointsColor={LIVE_COLOR}
                                        dataPointsRadius={3}
                                        yAxisThickness={0}
                                        xAxisThickness={0}
                                        maxValue={maxChartValue}
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

                {/* --- DIARIO (RenderTooltip Activado) --- */}
                <View style={statsStyles.card}>
                    <Text style={statsStyles.title}>Últimas 24 Horas (kWh)</Text>
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
                                // --- TOOLTIP INTERACTIVO ---
                                renderTooltip={(item: any) => (
                                    <View style={{ backgroundColor: '#333', padding: 5, borderRadius: 5 }}>
                                        <Text style={{ color: 'white' }}>{item.value.toFixed(3)} kWh</Text>
                                    </View>
                                )}
                            />
                        </ScrollView>
                    ) : <Text style={statsStyles.subtitle}>Sin datos recientes.</Text>}
                </View>

                {/* --- SEMANAL (RenderTooltip Agregado) --- */}
                <View style={statsStyles.card}>
                    <Text style={statsStyles.title}>Historial Semanal (kWh)</Text>
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
                                // --- TOOLTIP INTERACTIVO ---
                                renderTooltip={(item: any) => (
                                    <View style={{ backgroundColor: '#333', padding: 5, borderRadius: 5 }}>
                                        <Text style={{ color: 'white' }}>{item.value.toFixed(2)} kWh</Text>
                                    </View>
                                )}
                            />
                        </ScrollView>
                    ) : <Text style={statsStyles.subtitle}>Faltan datos para la semana.</Text>}
                </View>

                 {/* --- MENSUAL (RenderTooltip Agregado) --- */}
                 <View style={statsStyles.card}>
                    <Text style={statsStyles.title}>Historial Mensual (kWh)</Text>
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
                                // --- TOOLTIP INTERACTIVO ---
                                renderTooltip={(item: any) => (
                                    <View style={{ backgroundColor: '#333', padding: 5, borderRadius: 5 }}>
                                        <Text style={{ color: 'white' }}>{item.value.toFixed(2)} kWh</Text>
                                    </View>
                                )}
                            />
                        </ScrollView>
                    ) : <Text style={statsStyles.subtitle}>Faltan datos para el mes.</Text>}
                </View>

            </ScrollView>
        </ImageBackground>
    );
};

export default StatsScreen;