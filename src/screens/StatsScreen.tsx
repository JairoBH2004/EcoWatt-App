import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, ImageBackground, StatusBar,
    ScrollView, ActivityIndicator, Dimensions, AppState
} from 'react-native';
import { BarChart, LineChart, lineDataItem } from 'react-native-gifted-charts';

import { statsStyles } from '../styles/StatsStyles';
import { useAuthStore } from '../store/useAuthStore';
import { getHistoryGraph, HistoryDataPoint, getDevices, Device } from '../services/authService';

const ECOWATT_BACKGROUND = require('../assets/fondo.jpg');
const PRIMARY_GREEN = '#00FF7F';
const LIVE_COLOR = '#FF6347'; 

const screenWidth = Dimensions.get('window').width;

type ChartDataItem = {
    value: number;
    label: string;
    frontColor?: string;
};

// Límite de puntos para la gráfica en tiempo real
const MAX_REALTIME_POINTS = 30; // Mostrar los últimos 30 puntos

const StatsScreen = () => {
    const { token, logout } = useAuthStore();

    // Estados para historial
    const [weeklyData, setWeeklyData] = useState<ChartDataItem[]>([]);
    const [monthlyData, setMonthlyData] = useState<ChartDataItem[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true); 
    const [historyError, setHistoryError] = useState('');

    // --- Estados para Tiempo Real ---
    const [deviceId, setDeviceId] = useState<number | null>(null);
    const [realtimeData, setRealtimeData] = useState<lineDataItem[]>([]); 
    const [currentWatts, setCurrentWatts] = useState<number | null>(null);
    const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
    
    const [maxChartValue, setMaxChartValue] = useState(100); 
    
    const ws = useRef<WebSocket | null>(null); 

    // --- Efecto para cargar datos iniciales (historial Y deviceId) ---
    useEffect(() => {
        const loadInitialData = async () => {
            if (!token) {
                setHistoryError('No autenticado.');
                setIsLoadingHistory(false);
                setTimeout(() => logout(), 100);
                return;
            }

            setIsLoadingHistory(true);
            setHistoryError('');
            setDeviceId(null); 

            try {
                const [devicesResponse, weeklyResponse, monthlyResponse] = await Promise.allSettled([
                    getDevices(token), 
                    getHistoryGraph(token, 'weekly'),
                    getHistoryGraph(token, 'monthly'),
                ]);

                // Procesar Dispositivos para obtener ID
                if (devicesResponse.status === 'fulfilled' && devicesResponse.value.length > 0) {
                    setDeviceId(devicesResponse.value[0].dev_id); 
                } else if (devicesResponse.status === 'rejected' && !devicesResponse.reason?.message?.includes('404')) {
                    throw devicesResponse.reason; 
                }

                if (weeklyResponse.status === 'fulfilled') {
                    console.log("API Response (Weekly Raw):", JSON.stringify(weeklyResponse.value, null, 2));
                    const formatted = weeklyResponse.value.data_points.map((p: HistoryDataPoint, i: number) => ({ value: p.value, label: `Sem ${i + 1}`, frontColor: PRIMARY_GREEN }));
                    setWeeklyData(formatted);
                } else {
                    console.error("Error fetching weekly data:", weeklyResponse.reason);
                    throw weeklyResponse.reason;
                }

                if (monthlyResponse.status === 'fulfilled') {
                    console.log("API Response (Monthly Raw):", JSON.stringify(monthlyResponse.value, null, 2));
                    const formatted = monthlyResponse.value.data_points.map((p: HistoryDataPoint) => ({ value: p.value, label: new Date(p.timestamp).toLocaleDateString('es-ES', { month: 'short' }).replace('.', ''), frontColor: PRIMARY_GREEN }));
                    setMonthlyData(formatted);
                } else {
                    console.error("Error fetching monthly data:", monthlyResponse.reason);
                    throw monthlyResponse.reason;
                }

            } catch (err: any) {
                console.error('Error cargando datos iniciales:', err);
                setHistoryError(err.message || 'No se pudieron cargar los datos.');
                if (err.message?.includes('401')) setTimeout(() => logout(), 100);
            } finally {
                setIsLoadingHistory(false);
            }
        };

        loadInitialData();
    }, [token, logout]);

    // --- Efecto para manejar WebSocket ---
    useEffect(() => {
        const connectWebSocket = () => {
            if (!token || !deviceId || ws.current) {
                 if (!deviceId && !isLoadingHistory) {
                    setWsStatus('disconnected');
                    setHistoryError(prev => prev ? `${prev}\nNo hay dispositivo para tiempo real.` : 'No hay dispositivo para tiempo real.');
                 }
                return;
            }

            console.log(`Intentando conectar WebSocket para device_id: ${deviceId}`);
            setWsStatus('connecting');
            const wsUrl = `wss://core-cloud.dev/ws/live/${deviceId}?token=${token}`;
            const socket = new WebSocket(wsUrl);

            socket.onopen = () => {
                console.log('WebSocket Conectado');
                setWsStatus('connected');
                setRealtimeData([]); 
                setCurrentWatts(null);
                setMaxChartValue(100); 
                setHistoryError(prev => prev.replace('\nError en conexión tiempo real.', '').replace('Error en conexión tiempo real.', ''));
            };

            socket.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    if (typeof message.watts === 'number') {
                        const newWatts = message.watts; 
                        const newPoint: lineDataItem = { value: newWatts };
                        setCurrentWatts(newWatts);

                        setMaxChartValue(prevMax => {
                            const newTargetMax = newWatts * 1.3; 
                            if (newTargetMax > prevMax) {
                                return newTargetMax;
                            }
                            return prevMax; 
                        });

                        setRealtimeData(prevData => {
                            const newData = [...prevData, newPoint];
                            // Aquí está la lógica de la "ventana deslizante"
                            return newData.length > MAX_REALTIME_POINTS
                                ? newData.slice(newData.length - MAX_REALTIME_POINTS)
                                : newData;
                        });
                    }
                } catch (e) { console.error('Error parseando mensaje WebSocket:', e); }
            };

            socket.onerror = (error) => {
                console.error('WebSocket Error:', error);
                setHistoryError(prev => prev ? `${prev}\nError en conexión tiempo real.` : 'Error en conexión tiempo real.');
                setWsStatus('error');
                ws.current = null; 
            };

            socket.onclose = (event) => {
                console.log('WebSocket Desconectado:', event.code, event.reason);
                if (wsStatus !== 'error') setWsStatus('disconnected');
                ws.current = null;
                setCurrentWatts(null);
            };

            ws.current = socket; 
        };

        const disconnectWebSocket = () => {
            console.log("Cerrando WebSocket.");
            ws.current?.close();
            ws.current = null;
        };

        connectWebSocket();

        const appStateSubscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState !== 'active') {
                disconnectWebSocket(); 
            } else {
                if (!ws.current && deviceId && token) {
                   console.log("App activa de nuevo, intentando reconectar WebSocket...");
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

    if (historyError && weeklyData.length === 0 && monthlyData.length === 0 && wsStatus !== 'connecting' && wsStatus !== 'connected') {
        return (
            <View style={statsStyles.centeredContainer}>
                <Text style={statsStyles.errorText}>{historyError}</Text>
            </View>
        );
    }

    const barWidth = 35;
    const spacing = 15;
    const maxWeeklyValue = weeklyData.length > 0 ? Math.max(...weeklyData.map(d => d.value)) * 1.2 : 1;
    const maxMonthlyValue = monthlyData.length > 0 ? Math.max(...monthlyData.map(d => d.value)) * 1.2 : 1;


    // --- 👇 CAMBIO 1: Calcular espaciado con padding SÓLO a la derecha ---
    const chartContainerWidth = screenWidth - 80;
    
    // Define el espacio que quieres en el borde DERECHO para simetría
    // (Asumimos que el izquierdo ya tiene un padding interno)
    const rightSidePadding = 20; // <-- Puedes ajustar este número (ej. 15, 25)
    
    // Ancho disponible SÓLO para los puntos y sus espacios
    // Restamos SÓLO el padding derecho que estamos añadiendo
    const availableWidthForPoints = chartContainerWidth - rightSidePadding;
    
    // Espacio entre los 30 puntos
    // (MAX_REALTIME_POINTS - 1) porque 30 puntos tienen 29 espacios entre ellos
    const stableSpacing = availableWidthForPoints / (MAX_REALTIME_POINTS - 1);
    // --- 👆 FIN DEL CAMBIO 1 👆 ---


    // === Vista principal ===
    return (
        <ImageBackground
            source={ECOWATT_BACKGROUND}
            style={statsStyles.container}
            resizeMode="cover"
        >
            <StatusBar
                barStyle="light-content"
                backgroundColor="transparent"
                translucent={true}
            />

            <ScrollView contentContainerStyle={statsStyles.scrollViewContent}>
                <View style={statsStyles.header}>
                    <Text style={statsStyles.headerTitle}>Análisis de Consumo</Text>
                </View>

                <View style={statsStyles.card}>
                    <Text style={statsStyles.title}>Consumo Actual (Watts)</Text>
                    {wsStatus === 'connecting' && <ActivityIndicator color={LIVE_COLOR} style={{ marginVertical: 40 }}/>}
                    {wsStatus === 'error' && <Text style={statsStyles.errorText}>{historyError.includes('tiempo real') ? historyError.split('\n').pop() : 'Error de conexión.'}</Text>}
                    {wsStatus === 'disconnected' && !isLoadingHistory && <Text style={statsStyles.subtitle}>{historyError.includes('No hay dispositivo') ? historyError.split('\n').pop() : 'No conectado.'}</Text>}

                    {wsStatus === 'connected' && (
                        <>
                            <Text style={[statsStyles.currentValue, { color: LIVE_COLOR }]}>
                                {currentWatts !== null ? `${currentWatts.toFixed(0)} W` : '--- W'}
                            </Text>
                            {realtimeData.length > 1 ? (
                                <LineChart
                                    areaChart
                                    curved
                                    data={realtimeData}
                                    height={100}
                                    
                                    // --- 👇 CAMBIO 2: Aplicar padding y espaciado nuevo ---
                                    width={chartContainerWidth}    // Ancho total
                                    spacing={stableSpacing}        // Espacio entre puntos
                                    initialSpacing={0}             // Padding izquierdo (para no sumar al interno)
                                    endSpacing={rightSidePadding}  // Padding derecho (para simetría)
                                    // --- 👆 FIN DEL CAMBIO 2 👆 ---

                                    color={LIVE_COLOR}
                                    thickness={2}
                                    startFillColor={LIVE_COLOR} 
                                    endFillColor={LIVE_COLOR}   
                                    startOpacity={0.4}       
                                    endOpacity={0.1}         
                                    dataPointsColor={LIVE_COLOR} 
                                    dataPointsRadius={3}       
                                    hideRules
                                    hideYAxisText
                                    yAxisThickness={0}
                                    xAxisThickness={0}
                                    hideDataPointOnCoords={{x: -1, y: -1}}
                                    maxValue={maxChartValue} 
                                />
                            ) : (
                                <View style={{ height: 100, justifyContent: 'center', alignItems: 'center' }}>
                                     <ActivityIndicator color={LIVE_COLOR} />
                                    <Text style={[statsStyles.subtitle, {paddingVertical: 10, fontStyle: 'italic'}]}>
                                        Conectado. Esperando primeros datos...
                                    </Text>
                                </View>
                            )}
                        </>
                    )}
                </View>

                {/* --- Gráfica Semanal --- */}
                <View style={statsStyles.card}>
                    <Text style={statsStyles.title}>Consumo Semanal (kWh)</Text>
                    {historyError && !isLoadingHistory && weeklyData.length === 0 && <Text style={statsStyles.errorText}>{historyError.split('\n')[0]}</Text>}
                    {weeklyData.length > 0 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <BarChart
                                data={weeklyData}
                                barWidth={barWidth}
                                spacing={spacing}
                                initialSpacing={spacing}
                                rulesColor="rgba(255,255,255,0.3)"
                                yAxisTextStyle={{ color: '#FFFFFF' }}
                                xAxisThickness={0}
                                yAxisThickness={0}
                                noOfSections={4}
                                maxValue={maxWeeklyValue}
                                isAnimated
                                labelComponent={(index: number): JSX.Element => (
                                    <Text style={{ color: 'white', fontSize: 10, width: barWidth + spacing, textAlign: 'center' }}>
                                        {weeklyData[index]?.label ?? ''}
                                    </Text>
                                )}
                            />
                        </ScrollView>
                    ) : (
                        !historyError && !isLoadingHistory && <Text style={statsStyles.subtitle}>No hay datos semanales aún.</Text>
                    )}
                </View>

                {/* --- Gráfica Mensual --- */}
                <View style={statsStyles.card}>
                    <Text style={statsStyles.title}>Consumo Mensual (kWh)</Text>
                    {historyError && !isLoadingHistory && monthlyData.length === 0 && <Text style={statsStyles.errorText}>{historyError.split('\n')[0]}</Text>}
                    {monthlyData.length > 0 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <BarChart
                                data={monthlyData}
                                barWidth={barWidth}
                                spacing={spacing}
                                initialSpacing={spacing}
                                rulesColor="rgba(255,255,255,0.3)"
                                yAxisTextStyle={{ color: '#FFFFFF' }}
                                xAxisThickness={0}
                                yAxisThickness={0}
                                noOfSections={4}
                                maxValue={maxMonthlyValue}
                                isAnimated
                                labelComponent={(index: number): JSX.Element => (
                                    <Text style={{ color: 'white', fontSize: 10, width: barWidth + spacing, textAlign: 'center' }}>
                                        {weeklyData[index]?.label ?? ''}
                                    </Text>
                                )}
                            />
                        </ScrollView>
                    ) : (
                       !historyError && !isLoadingHistory && <Text style={statsStyles.subtitle}>No hay datos mensuales aún.</Text>
                    )}
                </View>

                {/* --- Placeholder --- */}
                <View style={statsStyles.card}>
                    <Text style={statsStyles.title}>Dispositivos que más consumen</Text>
                    <Text style={statsStyles.subtitle}>[Próximamente...]</Text>
                </View>
            </ScrollView>
        </ImageBackground>
    );
};

export default StatsScreen;