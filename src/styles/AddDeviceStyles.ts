import { StyleSheet } from 'react-native';

const PRIMARY_GREEN = '#00FF7F';
const DARK_BLUE_BG = '#0A192F';
const CARD_BLUE = '#1E2A47';
const LIGHT_TEXT = '#FFF';
const MUTED_TEXT = '#a0a0a0';
const ERROR_RED = '#FF6347';

const styles = StyleSheet.create({
    // --- Estilos Generales y de Contenedores ---
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: DARK_BLUE_BG,
        justifyContent: 'center',
        alignItems: 'center', // Centra el contenido por defecto
    },
    centered: {
        flex: 1, // Ocupa todo el espacio disponible
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },

    // --- Estilos para Estados (Carga, Éxito, Error) ---
    loadingText: {
        color: LIGHT_TEXT,
        marginTop: 20,
        fontSize: 16,
        textAlign: 'center',
    },
    successText: {
        fontSize: 22,
        color: PRIMARY_GREEN,
        textAlign: 'center',
        marginVertical: 20,
        fontWeight: 'bold',
    },
    errorText: {
        fontSize: 18,
        color: ERROR_RED,
        textAlign: 'center',
        marginVertical: 20,
    },

    // --- Estilos para Botones ---
    button: {
        backgroundColor: PRIMARY_GREEN,
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 20,
    },
    buttonText: {
        color: DARK_BLUE_BG,
        fontSize: 16,
        fontWeight: 'bold',
    },

    // --- Estilos para la Lista de Dispositivos ---
    listTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: LIGHT_TEXT,
        textAlign: 'center',
        marginBottom: 20,
    },
    deviceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: CARD_BLUE,
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: PRIMARY_GREEN, // Borde verde para resaltar
        width: '100%',
    },
    deviceInfo: {
        marginLeft: 15,
        flex: 1, // Permite que el texto se ajuste si es muy largo
    },
    deviceName: {
        color: LIGHT_TEXT,
        fontSize: 16,
        fontWeight: 'bold',
    },
    deviceId: {
        color: MUTED_TEXT,
        fontSize: 12,
        marginTop: 4,
       // --- AQUÍ SE ELIMINÓ LA LÍNEA 94 INCORRECTA ---
    },

    // --- 👇 ESTILOS NUEVOS PARA EL MODAL DE WIFI 👇 ---
    modalBackground: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    modalContainer: {
        width: '90%',
        backgroundColor: CARD_BLUE,
        borderRadius: 10,
        padding: 25,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: PRIMARY_GREEN,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: LIGHT_TEXT,
        marginBottom: 10,
    },
    modalSubtitle: {
        fontSize: 14,
        color: MUTED_TEXT,
        textAlign: 'center',
        marginBottom: 20,
    },
    modalInput: {
        width: '100%',
        height: 50,
        backgroundColor: DARK_BLUE_BG,
        borderRadius: 8,
        paddingHorizontal: 15,
        color: LIGHT_TEXT,
        borderWidth: 1,
        borderColor: PRIMARY_GREEN,
        marginBottom: 15,
    },
    modalSaveButton: {
        backgroundColor: PRIMARY_GREEN,
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        width: '100%',
    },
    modalButtonText: {
        color: DARK_BLUE_BG,
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalCancelButton: {
        marginTop: 15,
    },
    modalCancelText: {
        color: MUTED_TEXT,
        fontSize: 14,
    },
});

export default styles;