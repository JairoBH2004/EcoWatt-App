import { StyleSheet } from 'react-native';

// Color semitransparente oscuro (simula el efecto "difuminado" o blur)
const SEMI_TRANSPARENT_BLACK = 'rgba(0, 0, 0, 0.4)';

export const styles = StyleSheet.create({
    // --- ESTILOS PARA EL CONTENEDOR Y ENCABEZADO ---
    container: {
        flex: 1,
        // ELIMINAR: backgroundColor: '#003366',
        padding: 30,
        paddingTop: 50, // Ajuste para la StatusBar transparente
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20, // Espacio aumentado
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#FFFFFF',
        opacity: 0.9,
    },
    menuButton: {
        padding: 5, // Ajuste de padding
    },

    // --- ESTILO PARA EL CONTENIDO DEL SCROLLVIEW ---
    contentContainer: {
    flexGrow: 1, 
    // AGREGAR ESPACIO EN LA PARTE INFERIOR para la barra de navegación
    paddingBottom: 100, // <-- CORRECCIÓN CLAVE: Esto empuja el contenido hacia arriba
},

    // --- TARJETAS CON EFECTO SEMITRANSPARENTE ---
    
    mainCard: {
        // CAMBIO CLAVE: Fondo semitransparente
        backgroundColor: SEMI_TRANSPARENT_BLACK, 
        borderRadius: 15,
        padding: 20,
        alignItems: 'center',
        marginBottom: 20,
        // Sombra ajustada para fondo oscuro
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25, 
        shadowRadius: 10,
        elevation: 8, 
    },
    mainCardTitle: {
        fontSize: 16,
        color: '#E0E0E0', // Texto claro
        marginBottom: 5,
    },
    projectedCost: {
        fontSize: 42,
        fontWeight: 'bold',
        color: '#00FF7F', // Verde brillante para resaltar
    },
    comparisonText: {
        fontSize: 14,
        color: '#B0B0B0', // Texto claro
        marginTop: 5,
    },
    
    smallCardsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    smallCard: {
        // CAMBIO CLAVE: Fondo semitransparente
        backgroundColor: SEMI_TRANSPARENT_BLACK, 
        borderRadius: 15,
        padding: 20,
        alignItems: 'center',
        width: '48%',
        // Sombra ajustada
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
        elevation: 8,
    },
    smallCardValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF', // Texto blanco
    },
    smallCardLabel: {
        fontSize: 14,
        color: '#B0B0B0', // Texto claro
        marginTop: 5,
    },
    
    analysisCard: {
        // CAMBIO CLAVE: Fondo semitransparente
        backgroundColor: SEMI_TRANSPARENT_BLACK,
        borderRadius: 15,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        height: 200,
        marginBottom: 20,
    },
    analysisTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF', // Texto blanco
        marginBottom: 10,
    },
    
    // Se deja esta tarjeta con fondo claro para crear contraste
    recommendationCard: {
        backgroundColor: 'rgba(230, 255, 230, 0.9)', 
        borderRadius: 15,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
    },
    recommendationText: {
        flex: 1,
        marginLeft: 15,
        fontSize: 14,
        color: '#003366',
    },
    
});