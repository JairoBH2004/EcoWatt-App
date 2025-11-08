// src/styles/ResetPasswordStyles.ts
import { StyleSheet } from 'react-native';

// Reutiliza tus colores primarios
export const COLOR_PRIMARY_BLUE = '#003366';
export const COLOR_PRIMARY_GREEN = '#00FF7F';
const ERROR_RED = '#E74C3C';
const SUCCESS_GREEN = '#2ecc71'; // Verde para éxito

const styles = StyleSheet.create({
    fullScreenBackground: {
        flex: 1,
    },
    keyboardAvoidingContainer: {
        flex: 1,
    },
    // Panel superior (más pequeño ahora, sin logo)
    brandPanel: {
        // flex: 1, // Ya no necesita ocupar tanto espacio
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 60, // Espacio desde arriba
        paddingBottom: 20,
    },
    brandTitle: {
        fontSize: 28, // Un poco más pequeño
        fontWeight: 'bold',
        color: '#FFFFFF',
        letterSpacing: 1,
    },
    // Panel inferior con el formulario
    formPanel: {
        flex: 1, // Ocupa el resto del espacio
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: 30,
        paddingBottom: 40,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
    },
    formTitle: {
        fontSize: 22, // Ligeramente más pequeño
        fontWeight: 'bold',
        color: COLOR_PRIMARY_BLUE,
        textAlign: 'center',
        marginBottom: 10,
    },
    formSubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 25,
        lineHeight: 20, // Espaciado entre líneas
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
        color: SUCCESS_GREEN,
        textAlign: 'center',
        marginBottom: 15,
    },
    // Contenedor para input + icono
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
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
        color: '#333',
        fontSize: 16,
    },
    eyeIcon: { // Para el icono de mostrar/ocultar contraseña
        paddingLeft: 10,
    },
    // Botón principal
    mainButton: {
        backgroundColor: COLOR_PRIMARY_GREEN,
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 20,
    },
    mainButtonText: {
        color: COLOR_PRIMARY_BLUE,
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Texto/Botón secundario (Volver a Login)
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