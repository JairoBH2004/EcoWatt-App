import { StyleSheet } from 'react-native';

// Redefinimos la opacidad para que sean más transparentes
const SEMI_TRANSPARENT_BLACK = 'rgba(0, 0, 0, 0.4)'; // 40% de opacidad
const PRIMARY_GREEN = '#00FF7F';
const ERROR_RED = '#FF6347'; // Color para errores
const LIGHT_TEXT = '#FFFFFF'; // Texto blanco general

export const statsStyles = StyleSheet.create({
  container: {
    flex: 1,
    // Eliminado el backgroundColor para que se vea la imagen
    // Eliminado paddingTop aquí, se maneja en ScrollView
  },
  // Añadido padding horizontal al ScrollView en lugar del container
  scrollViewContent: {
      paddingBottom: 100,
      paddingTop: 60, // Espacio para el header y StatusBar
      paddingHorizontal: 20, // Padding lateral
  },
  header: {
    marginBottom: 20,
    // Añadido para asegurar que esté arriba
    marginTop: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: LIGHT_TEXT,
    textAlign: 'center', // Centrado para mejor apariencia
  },
  card: {
    padding: 20,
    borderRadius: 15,
    backgroundColor: SEMI_TRANSPARENT_BLACK, // Fondo semitransparente
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: PRIMARY_GREEN, // Verde primario para títulos
    marginBottom: 15, // Más espacio antes de la gráfica
    textAlign: 'center', // Centrado para mejor apariencia
  },
  subtitle: {
    fontSize: 16,
    color: '#E0E0E0', // Texto claro
    // Eliminado height, paddingTop y backgroundColor
    textAlign: 'center',
    paddingVertical: 40, // Espacio si no hay datos
  },
  footerText: { // No se usa actualmente, pero lo dejamos
    marginTop: 15,
    fontSize: 12,
    color: '#B0B0B0', // Texto grisáceo
    textAlign: 'right',
  },
  // --- 👇 ESTILO AÑADIDO PARA ERRORES 👇 ---
  errorText: {
      fontSize: 16,
      color: ERROR_RED, // Rojo para errores
      textAlign: 'center',
      paddingHorizontal: 20,
  },
  // --- Estilo para centrar contenido (Loading/Error) ---
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    // Puedes darle un fondo si quieres que cubra la imagen al cargar/error
    // backgroundColor: 'rgba(10, 25, 47, 0.8)', // Fondo oscuro semitransparente
  },
  loadingText: {
      color: LIGHT_TEXT,
      marginTop: 10,
      fontSize: 16,
  },
  currentValue: {
      fontSize: 28, // Tamaño grande
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 15, // Espacio antes de la gráfica
      // El color se aplicará directamente en el componente
  },
});