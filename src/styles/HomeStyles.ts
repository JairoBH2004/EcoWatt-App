import { StyleSheet } from 'react-native';

// --- Constantes de Color ---
const SEMI_TRANSPARENT_BLACK = 'rgba(0, 0, 0, 0.4)';
const PRIMARY_GREEN = '#00FF7F';

export const styles = StyleSheet.create({
    // --- Contenedores y Vistas de Estado ---
    container: {
        flex: 1,
    },
    contentContainer: {
        flexGrow: 1,
        padding: 20,
        paddingTop: 50, // Espacio para la barra de estado
        paddingBottom: 120, // Espacio extra para la barra de navegación flotante
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0A192F', // Fondo oscuro para pantallas de carga/error
    },
    errorText: {
        color: '#E74C3C',
        fontSize: 16,
        marginBottom: 20,
        textAlign: 'center',
        paddingHorizontal: 20,
    },

    // --- Encabezado ---
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 25,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#E0E0E0',
    },
    menuButton: {
        padding: 10,
    },

    // --- Tarjeta Principal ---
    mainCard: {
        backgroundColor: SEMI_TRANSPARENT_BLACK,
        borderRadius: 15,
        padding: 20,
        alignItems: 'center',
        marginBottom: 20,
    },
    mainCardTitle: {
        fontSize: 16,
        color: '#E0E0E0',
        marginBottom: 10,
    },
    projectedCost: {
        fontSize: 42,
        fontWeight: 'bold',
        color: PRIMARY_GREEN,
    },
    comparisonText: {
        fontSize: 14,
        color: '#B0B0B0',
        marginTop: 5,
    },

    // --- Contenedor de Tarjetas Pequeñas ---
    smallCardsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    smallCard: {
        backgroundColor: SEMI_TRANSPARENT_BLACK,
        borderRadius: 15,
        padding: 20,
        alignItems: 'center',
        width: '48%', // Ocupa casi la mitad del espacio
    },
    smallCardValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginTop: 8,
    },
    smallCardLabel: {
        fontSize: 14,
        color: '#B0B0B0',
        marginTop: 5,
        textAlign: 'center',
    },

    // --- Tarjeta de Recomendación ---
    recommendationCard: {
        backgroundColor: 'rgba(230, 255, 230, 0.9)', // Fondo claro para contraste
        borderRadius: 15,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    recommendationText: {
        flex: 1,
        marginLeft: 15,
        fontSize: 15,
        color: '#003366', // Texto oscuro para legibilidad
        lineHeight: 22,
    },
    // --- Estilos para la vista de "Añadir Dispositivo" ---
    centeredContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    actionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginTop: 20,
        textAlign: 'center',
    },
    actionSubtitle: {
        fontSize: 16,
        color: '#E0E0E0',
        marginTop: 10,
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 24,
    },
    addButton: {
        backgroundColor: PRIMARY_GREEN,
        paddingHorizontal: 40,
        paddingVertical: 15,
        borderRadius: 10,
        shadowColor: '#00FF7F',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 15,
        elevation: 10,
    },
    addButtonText: {
        color: '#003366', // Azul oscuro
        fontSize: 16,
        fontWeight: 'bold',
    },
});