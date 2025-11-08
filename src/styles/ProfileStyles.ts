// src/styles/ProfileStyles.ts
import { StyleSheet } from 'react-native';

const SEMI_TRANSPARENT_LIGHT = 'rgba(255, 255, 255, 0.4)';
const PRIMARY_GREEN = '#00FF7F';
const PRIMARY_BLUE = '#003366';
const ERROR_RED = '#E74C3C';

const styles = StyleSheet.create({
    safeAreaContainer: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    // --- 👇 Estilos para FlatList (reemplazan a scrollContainer) 👇 ---
    flatListContainer: {
        flex: 1,
    },
    flatListContentContainer: {
        flexGrow: 1, // Asegura que el contenido pueda crecer y empujar el footer
        paddingBottom: 150, // Espacio para la barra de navegación y botón logout
    },
    // --- 👆 Fin estilos FlatList 👆 ---
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#0A192F',
    },
    loadingText: {
        marginTop: 10,
        color: '#FFF',
        fontSize: 16,
    },
    header: {
        backgroundColor: SEMI_TRANSPARENT_LIGHT,
        paddingVertical: 30,
        paddingTop: 45,
        alignItems: 'center',
        borderRadius: 15,
        marginHorizontal: 15,
        marginTop: 60,
        position: 'relative',
        marginBottom: 20,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: PRIMARY_BLUE,
        marginTop: 15
    },
    userEmail: {
        fontSize: 16,
        color: PRIMARY_BLUE,
        marginTop: 5
    },
    infoSection: {
        marginHorizontal: 15,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 15,
        backgroundColor: SEMI_TRANSPARENT_LIGHT,
        borderRadius: 10,
        marginBottom: 10,
    },
    icon: {
        width: 30,
        textAlign: 'center',
        marginRight: 10,
    },
    infoLabel: {
        flex: 1,
        marginLeft: 5,
        fontSize: 16,
        color: PRIMARY_BLUE,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: PRIMARY_GREEN,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 5,
        marginRight: 10,
    },
    errorText: {
        color: ERROR_RED,
        fontSize: 16,
        marginBottom: 20,
        textAlign: 'center',
    },
    logoutButton: {
        backgroundColor: '#c0392b',
        flexDirection: 'row',
        justifyContent: 'center',
        padding: 15,
        borderRadius: 10,
        margin: 15,
        alignItems: 'center',
        marginTop: 'auto', // Empuja al final del ListFooterComponent
    },
    logoutButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    editButton: {
        position: 'absolute',
        top: 15,
        right: 15,
        padding: 10,
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: 20,
    },

    // --- 👇 ESTILOS NUEVOS Y CORREGIDOS PARA LISTA DE DISPOSITIVOS 👇 ---
    
    // Contenedor solo para el Título (parte del ListHeader)
    devicesSectionHeader: {
        marginTop: 20,
        marginHorizontal: 15,
        paddingHorizontal: 15,
        paddingTop: 15, // Padding solo arriba
        backgroundColor: SEMI_TRANSPARENT_LIGHT,
        borderTopLeftRadius: 15, // Redondeo solo arriba
        borderTopRightRadius: 15,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: PRIMARY_BLUE,
        marginBottom: 15,
        textAlign: 'center',
    },
    // Estilo para la fila del dispositivo (item del FlatList)
    deviceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 15, // Padding dentro de la fila
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 51, 102, 0.2)',
        backgroundColor: SEMI_TRANSPARENT_LIGHT, // Fondo de la fila
        marginHorizontal: 15, // Margen lateral para las filas
    },
    deviceInfo: {
        flex: 1,
        marginLeft: 5,
    },
    deviceName: {
        fontSize: 16,
        color: PRIMARY_BLUE,
        fontWeight: 'bold',
    },
    deviceMac: {
        fontSize: 12,
        color: PRIMARY_BLUE,
        opacity: 0.8,
        marginTop: 3,
    },
    // Contenedor para el texto de lista vacía
    emptyDeviceListContainer: {
        backgroundColor: SEMI_TRANSPARENT_LIGHT,
        marginHorizontal: 15,
        paddingBottom: 15, // Espacio inferior
        borderBottomLeftRadius: 15, // Redondeo solo abajo
        borderBottomRightRadius: 15,
    },
    emptyListText: {
        textAlign: 'center',
        color: PRIMARY_BLUE,
        paddingVertical: 20,
        fontSize: 15,
        fontStyle: 'italic',
    },
    // Contenedor para el botón de añadir (parte del ListFooter)
    addDeviceContainer: {
        backgroundColor: SEMI_TRANSPARENT_LIGHT,
        marginHorizontal: 15,
        padding: 15,
        paddingTop: 0, // El ListEmpty o la última fila ya dan espacio arriba
        borderBottomLeftRadius: 15,
        borderBottomRightRadius: 15,
        // Si la lista de dispositivos NO está vacía, esto añade el borde superior
        // (Asumiendo que el último deviceRow tiene borde inferior)
    },
    addDeviceButton: {
        backgroundColor: PRIMARY_GREEN,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 15,
        borderRadius: 10,
    },
    addDeviceButtonText: {
        color: PRIMARY_BLUE,
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 5,
    },
    errorTextSmall: {
        color: ERROR_RED,
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 10,
    }
});

export default styles;