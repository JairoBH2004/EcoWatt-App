// src/styles/ProfileStyles.ts
import { StyleSheet } from 'react-native';

const SEMI_TRANSPARENT_LIGHT = 'rgba(255, 255, 255, 0.4)'; // Fondo de tarjeta más claro (40% opacidad)
const PRIMARY_GREEN = '#00FF7F'; // Verde brillante de Ecowatt
const PRIMARY_BLUE = '#003366'; // Azul oscuro para texto clave

const styles = StyleSheet.create({
    centered: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: 20 
    },
    container: { 
        flex: 1, 
        // ELIMINAR: backgroundColor: '#f4f6f8' -> El fondo es la imagen.
        paddingBottom: 80, // Espacio para que la barra de navegación no cubra contenido
    },
    header: {
        // Estilo de tarjeta, más transparente
        backgroundColor: SEMI_TRANSPARENT_LIGHT, 
        paddingVertical: 30,
        alignItems: 'center',
        borderBottomWidth: 0, // Quitamos la línea para un look más limpio
        borderRadius: 15,
        margin: 15,
        marginTop: 50, // Separación superior para la StatusBar
    },
    userName: { 
        fontSize: 24, 
        fontWeight: 'bold', 
        color: PRIMARY_BLUE, // Mantenemos un color oscuro para contraste en la cabecera clara
        marginTop: 15 
    },
    userEmail: { 
        fontSize: 16, 
        color: PRIMARY_BLUE, 
        marginTop: 5 
    },
    infoSection: { 
        marginTop: 10, 
        backgroundColor: 'transparent', // La sección principal no tendrá fondo
        marginHorizontal: 15,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 15,
        // Fondo semitransparente para cada fila
        backgroundColor: SEMI_TRANSPARENT_LIGHT,
        borderRadius: 10,
        marginBottom: 5, // Espacio entre filas
        borderBottomWidth: 0,
    },
    icon: { 
        width: 30, 
        textAlign: 'center' 
    },
    infoLabel: { 
        flex: 1, 
        marginLeft: 15, 
        fontSize: 16, 
        color: PRIMARY_BLUE // Texto oscuro
    },
    infoValue: { 
        fontSize: 16, 
        fontWeight: 'bold', 
        color: PRIMARY_GREEN // Usamos el verde brillante
    },
    errorText: { 
        color: 'red', 
        marginBottom: 15, 
        textAlign: 'center' 
    },
    logoutButton: {
        backgroundColor: '#c0392b', // Rojo fuerte para acción
        padding: 15,
        borderRadius: 10,
        margin: 15,
        alignItems: 'center',
        marginTop: 30,
    },
    logoutButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default styles;