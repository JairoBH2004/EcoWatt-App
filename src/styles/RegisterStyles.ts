import { StyleSheet } from 'react-native';
// Asumiendo que has exportado estas constantes en el archivo de estilos de login
import { 
    COLOR_PRIMARY_BLUE, 
    COLOR_PRIMARY_GREEN, 
    COLOR_BACKGROUND_WHITE 
} from './loginStyles'; 

// --- Estilos de la Pantalla de Registro ---
const styles = StyleSheet.create({
    
    // 1. ESTILO DEL CONTENEDOR DESLIZABLE (Usado por ScrollView)
    scrollContainer: {
        flexGrow: 1, 
        alignItems: 'center', 
        paddingBottom: 50, 
        paddingTop: 80, 
    },
    
    // 2. FONDO DE PANTALLA COMPLETA (Para LinearGradient)
    fullScreenBackground: {
        flex: 1, 
    },

    // 3. PANEL DE MARCA (Logo y Eslogan)
    brandPanel: {
        alignItems: 'center',
        paddingBottom: 15,
        paddingTop: 0, 
    },
    loginLogo: {
        width: 100, 
        height: 100, 
        borderRadius: 50,
        marginBottom: 5,
        backgroundColor: COLOR_BACKGROUND_WHITE,
        padding: 5,
    },
    brandTitle: {
        fontSize: 24, 
        fontWeight: 'bold',
        color: COLOR_BACKGROUND_WHITE,
    },
    brandSlogan: {
        fontSize: 14,
        color: COLOR_BACKGROUND_WHITE,
        textAlign: 'center',
    },

    // 4. RECUADRO BLANCO (Formulario de Registro - Ancho y Responsive)
    formPanel: {
        width: '95%', 
        maxWidth: 450, 
        backgroundColor: COLOR_BACKGROUND_WHITE, // Fondo blanco para la tarjeta
        borderRadius: 15,
        paddingHorizontal: 30, 
        paddingVertical: 35, 
        justifyContent: 'flex-start', 
        
        // Sombra
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 10, 
    },
    formTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 40,
        textAlign: 'center',
    },

    // Contenedor para agrupar Icono e Input
    inputContainer: {
        flexDirection: 'row', 
        alignItems: 'center',
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 20,
        height: 50,
        paddingHorizontal: 10,
        backgroundColor: COLOR_BACKGROUND_WHITE, // Fondo blanco para cada campo
    },
    input: {
        flex: 1,
        height: '100%',
        paddingLeft: 10,
        fontSize: 16,
    },
    inputIcon: {
        marginRight: 10,
    },
    // <--- ¡ESTILO CORREGIDO Y EN SU LUGAR! -->
    eyeIcon: { 
        marginLeft: 10,
    },
    // <------------------------------------->

    // Botones
    loginButton: { 
        backgroundColor: COLOR_PRIMARY_GREEN,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10,
    },
    loginButtonText: {
        color: COLOR_BACKGROUND_WHITE,
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    forgotPasswordText: { 
        color: COLOR_PRIMARY_GREEN,
        fontSize: 14,
        textAlign: 'center',
    },
    registerButton: {
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 5,
        borderColor: COLOR_PRIMARY_BLUE,
        borderWidth: 1,
        backgroundColor: 'transparent',
    },
    registerButtonText: {
        color: COLOR_PRIMARY_BLUE,
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    // Añade esto dentro de tu StyleSheet.create({...})
  errorText: {
    color: '#D8000C',
    textAlign: 'center',
    marginBottom: 15,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default styles;