// src/styles/EditProfileStyles.ts
import { StyleSheet } from 'react-native';

// Reutiliza tus colores
const PRIMARY_GREEN = '#00FF7F';
const PRIMARY_BLUE = '#003366';
const ERROR_RED = '#E74C3C';
const LIGHT_TEXT = '#FFFFFF';
const DARK_TEXT = '#333333';
const INPUT_BG = '#f0f0f0'; // Fondo para inputs

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: PRIMARY_BLUE, // Fondo azul oscuro base
    },
    container: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: LIGHT_TEXT,
        marginBottom: 25,
        textAlign: 'center',
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        color: LIGHT_TEXT, // Texto claro para etiquetas
        marginBottom: 8,
        fontWeight: '500',
    },
    input: {
        backgroundColor: INPUT_BG,
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 12, // Altura estándar
        fontSize: 16,
        color: DARK_TEXT, // Texto oscuro en input
        borderWidth: 1,
        borderColor: '#ddd', // Borde sutil
    },
    // Estilo para campos no editables
    readOnlyField: {
        backgroundColor: '#e0e0e0', // Gris más oscuro para indicar no editable
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        color: '#666', // Texto gris oscuro
        borderWidth: 1,
        borderColor: '#ccc',
    },
    readOnlyText: {
        fontSize: 16,
        color: '#666',
    },
    saveButton: {
        backgroundColor: PRIMARY_GREEN,
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 30, // Más espacio arriba
    },
    saveButtonText: {
        color: PRIMARY_BLUE,
        fontSize: 18,
        fontWeight: 'bold',
    },
    // Estilo para mensajes de error
    errorText: {
        fontSize: 14,
        color: ERROR_RED,
        textAlign: 'center',
        marginTop: 15, // Mostrar debajo del botón
    },
    // Contenedor para la pantalla de carga
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: PRIMARY_BLUE,
    },
    loadingText: {
        marginTop: 10,
        color: LIGHT_TEXT,
        fontSize: 16,
    }
});

export default styles;