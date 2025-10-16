// src/styles/ProfileStyles.ts
import { StyleSheet, StatusBar } from 'react-native';

const SEMI_TRANSPARENT_LIGHT = 'rgba(255, 255, 255, 0.4)';
const PRIMARY_GREEN = '#00FF7F';
const PRIMARY_BLUE = '#003366';

const styles = StyleSheet.create({
    // AÑADIDO: Contenedor principal que respeta la barra de estado y el notch.
    safeAreaContainer: {
        flex: 1,
    },
    container: { 
        flex: 1,
    },
    // MEJORADO: Usamos flexGrow para permitir empujar contenido al fondo.
    scrollContainer: {
        flexGrow: 1,
        paddingBottom: 100, // Espacio para la barra de navegación inferior.
    },
    centered: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: 20,
        backgroundColor: '#0A192F', // Fondo oscuro para pantallas de carga/error.
    },
    // AÑADIDO: Estilo para el texto de "Cargando...".
    loadingText: {
        marginTop: 10,
        color: '#FFF',
        fontSize: 16,
    },
    // ...
    header: {
        backgroundColor: SEMI_TRANSPARENT_LIGHT, 
        paddingVertical: 30,
        alignItems: 'center',
        borderRadius: 15,
        marginHorizontal: 15, // Mantener margen horizontal
        marginTop: 60, // <-- AÑADIDO / AJUSTADO: Esto empujará el header hacia abajo
        position: 'relative', // Asegúrate de que el header tenga esta línea
    },
// ...
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
        marginTop: 10, 
        marginHorizontal: 15,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 15,
        backgroundColor: SEMI_TRANSPARENT_LIGHT,
        borderRadius: 10,
        marginBottom: 10, // Un poco más de espacio entre filas.
    },
    icon: { 
        width: 30,
        textAlign: 'center',
    },
    infoLabel: { 
        flex: 1, 
        marginLeft: 15, 
        fontSize: 16, 
        color: PRIMARY_BLUE,
    },
    infoValue: { 
        fontSize: 16, 
        fontWeight: 'bold', 
        color: PRIMARY_GREEN,
        // MEJORADO: Sombra para mejorar contraste y legibilidad.
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 5,
    },
    errorText: { 
        color: '#E74C3C', // Un rojo más visible.
        fontSize: 16,
        marginBottom: 20, 
        textAlign: 'center',
    },
    logoutButton: {
        backgroundColor: '#c0392b',
        padding: 15,
        borderRadius: 10,
        margin: 15,
        alignItems: 'center',
        // MEJORADO: Esta línea empuja el botón al final del ScrollView.
        marginTop: 'auto',
        marginBottom: 20, // Margen inferior para que no pegue con la tab bar.
    },
    logoutButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    // 👇 AÑADE ESTE NUEVO ESTILO 👇
    editButton: {
        position: 'absolute',
        top: 15,
        right: 15,
        padding: 10,
    },
});

export default styles;