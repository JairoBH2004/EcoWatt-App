import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
    // Estilos que ya tenías (con un ajuste de color)
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#0A192F', // Fondo oscuro principal
        justifyContent: 'center',
    },
    centered: {
        // 'flex: 1' aquí puede empujar el contenido si no se usa con cuidado
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#FFF',
        marginTop: 20,
        fontSize: 16,
        textAlign: 'center',
    },
    input: {
        backgroundColor: '#1E2A47',
        color: '#FFF',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#00FF7F',
    },
    button: {
        backgroundColor: '#00FF7F', // Verde brillante
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 20,
    },
    buttonText: {
        color: '#0A192F', // Azul oscuro
        fontSize: 16,
        fontWeight: 'bold',
    },

    // --- ESTILOS QUE FALTABAN ---
    form: {
        width: '100%',
    },
    label: {
        fontSize: 16,
        color: '#a0a0a0', // Un color más suave para las etiquetas
        marginBottom: 8,
    },
    buttonDisabled: {
        backgroundColor: '#555', // Color para el botón deshabilitado
    },
    successText: {
        fontSize: 22,
        color: '#00FF7F', // Verde brillante para éxito
        textAlign: 'center',
        marginVertical: 20,
        fontWeight: 'bold',
    },
    errorText: {
        fontSize: 18,
        color: '#FF6347', // Un color rojo/tomate para errores
        textAlign: 'center',
        marginVertical: 20,
    },
});

export default styles;