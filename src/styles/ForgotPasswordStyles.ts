// src/styles/ForgotPasswordStyles.ts
import { StyleSheet } from 'react-native';

// Reutiliza tus colores primarios
export const COLOR_PRIMARY_BLUE = '#003366';
export const COLOR_PRIMARY_GREEN = '#00FF7F';
const ERROR_RED = '#E74C3C'; // Rojo para errores
const SUCCESS_GREEN = '#2ecc71'; // Verde para éxito

const styles = StyleSheet.create({
    fullScreenBackground: {
        flex: 1,
    },
    // Contenedor principal con KeyboardAvoidingView
    keyboardAvoidingContainer: {
        flex: 1,
    },
    // Panel superior con logo y marca
    brandPanel: {
        flex: 1, // Ocupa espacio superior
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 30, // Ajusta según necesites
    },
    loginLogo: {
        width: 100, // Ajusta tamaño
        height: 100, // Ajusta tamaño
        resizeMode: 'contain',
        marginBottom: 15,
    },
    brandTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFFFF',
        letterSpacing: 2,
    },
    // Panel inferior con el formulario
    formPanel: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)', // Fondo blanco semitransparente
        padding: 30,
        paddingBottom: 40, // Más espacio abajo
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
    },
    formTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLOR_PRIMARY_BLUE,
        textAlign: 'center',
        marginBottom: 10,
    },
    // Estilo para el subtítulo
    formSubtitle: {
        fontSize: 14,
        color: '#666', // Gris oscuro
        textAlign: 'center',
        marginBottom: 25,
    },
    // Mensajes de error y éxito
    errorText: {
        fontSize: 14,
        color: ERROR_RED,
        textAlign: 'center',
        marginBottom: 15,
    },
    successText: {
        fontSize: 14,
        color: SUCCESS_GREEN, // Verde éxito
        textAlign: 'center',
        marginBottom: 15,
    },
    // Contenedor para input + icono
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0', // Fondo gris claro para input
        borderRadius: 10,
        marginBottom: 15,
        paddingHorizontal: 15,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: 50,
        color: '#333', // Texto oscuro
        fontSize: 16,
    },
    // Botón principal (reutiliza estilo de login)
    mainButton: {
        backgroundColor: COLOR_PRIMARY_GREEN,
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 20, // Espacio antes del botón
    },
    mainButtonText: {
        color: COLOR_PRIMARY_BLUE, // Texto azul oscuro
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Texto/Botón secundario (Volver)
    secondaryLink: {
        marginTop: 25,
        alignItems: 'center',
    },
    secondaryLinkText: {
        color: COLOR_PRIMARY_BLUE,
        fontSize: 14,
        textDecorationLine: 'underline',
    },
});

export default styles;