import { StyleSheet } from 'react-native';

// Redefinimos la opacidad para que sean más transparentes
const SEMI_TRANSPARENT_BLACK = 'rgba(0, 0, 0, 0.4)'; // 40% de opacidad

export const statsStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
    // Eliminado el backgroundColor para que se vea la imagen
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  card: {
    padding: 20,
    borderRadius: 15,
    // APLICACIÓN DEL NUEVO VALOR: más transparente
    backgroundColor: SEMI_TRANSPARENT_BLACK, 
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
    color: '#00FF7F', 
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#E0E0E0',
    height: 150, 
    textAlign: 'center',
    paddingTop: 50,
    // FONDO DE LA GRÁFICA: Si la gráfica fuera un elemento separado, 
    // podrías darle este mismo fondo:
    // backgroundColor: SEMI_TRANSPARENT_BLACK, 
  },
  footerText: {
    marginTop: 15,
    fontSize: 12,
    color: '#B0B0B0',
    textAlign: 'right',
  }
});