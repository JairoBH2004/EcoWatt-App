import { StyleSheet } from 'react-native';

// --- Colores y Constantes ---
export const COLOR_PRIMARY_BLUE = '#003366';
export const COLOR_PRIMARY_GREEN = '#66CC66';
export const COLOR_BACKGROUND_WHITE = '#FFFFFF';

// --- Estilos CSS usando StyleSheet (Nativo) ---
const styles = StyleSheet.create({
  
  // 1. FONDO DE PANTALLA COMPLETA (Usado por LinearGradient)
  fullScreenBackground: {
    flex: 1, 
    alignItems: 'center', // Centra la tarjeta horizontalmente
    paddingTop: 50, // Pequeño margen superior para el logo
  },

  // 2. PANEL DE MARCA (Para el Logo encima del formulario)
  brandPanel: {
    alignItems: 'center',
    marginBottom: 20, // Espacio entre el eslogan y la tarjeta blanca
  },
  loginLogo: {
    width: 100, // Tamaño aumentado para un mejor impacto visual
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

  // 3. RECUADRO BLANCO (Formulario Centrado y RESPONSIVE)
  formPanel: {
    width: '90%', // Ocupa el 90% del ancho del dispositivo (móvil)
    maxWidth: 400, // CLAVE RESPONSIVA: No se estirará más de 400px en tablets
    backgroundColor: COLOR_BACKGROUND_WHITE,
    borderRadius: 15, // Bordes redondeados
    paddingHorizontal: 25,
    paddingVertical: 45, // Relleno vertical para más espacio
    justifyContent: 'flex-start', // Alinea el contenido hacia arriba, resolviendo el espacio en blanco inferior
    
    // Sombra para que se vea presentable y flote
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
  eyeIcon: {
    marginLeft: 10,
  },

  // Olvidó Contraseña y Botones
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: COLOR_PRIMARY_GREEN,
    fontSize: 14,
  },
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
   // Botón de Registro (Nuevo)
  registerButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 5,
    borderColor: COLOR_PRIMARY_BLUE,
    borderWidth: 1, // Borde fino
    backgroundColor: 'transparent', // Fondo transparente
  },
  registerButtonText: {
    color: COLOR_PRIMARY_BLUE,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Estilo para el mensaje de error
  errorText: {
    color: '#D8000C', // Un rojo estándar para errores
    textAlign: 'center',
    marginBottom: 15, // Espacio para separarlo de los inputs
    fontSize: 14,
    fontWeight: '500',
  },
  
   
});

export default styles;