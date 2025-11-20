import { StyleSheet } from 'react-native';

const SEMI_TRANSPARENT_BLACK = 'rgba(0, 0, 0, 0.4)';
const PRIMARY_GREEN = '#00FF7F';
const ERROR_RED = '#FF6347';
const LIGHT_TEXT = '#FFFFFF';

export const statsStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollViewContent: {
      paddingBottom: 100,
      paddingTop: 60,
      paddingHorizontal: 20,
  },
  header: {
    marginBottom: 20,
    marginTop: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: LIGHT_TEXT,
    textAlign: 'center',
  },
  card: {
    padding: 20,
    borderRadius: 15,
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
    color: PRIMARY_GREEN,
    marginBottom: 15,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#E0E0E0',
    textAlign: 'center',
    paddingVertical: 40,
  },
  footerText: {
    marginTop: 15,
    fontSize: 12,
    color: '#B0B0B0',
    textAlign: 'right',
  },
  errorText: {
      fontSize: 16,
      color: ERROR_RED,
      textAlign: 'center',
      paddingHorizontal: 20,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
      color: LIGHT_TEXT,
      marginTop: 10,
      fontSize: 16,
  },
  currentValue: {
      fontSize: 28,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 15,
  },

  // --- NUEVOS ESTILOS PARA SELECTORES DE FECHA ---
  chartHeader: {
    marginBottom: 15,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 255, 127, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PRIMARY_GREEN,
    marginTop: 10,
    gap: 8,
  },
  dateSelectorText: {
    color: LIGHT_TEXT,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },

  // --- ESTILOS DEL MODAL ---
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '70%',
    backgroundColor: 'rgba(10, 25, 47, 0.95)',
    borderRadius: 15,
    borderWidth: 2,
    borderColor: PRIMARY_GREEN,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 255, 127, 0.3)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: PRIMARY_GREEN,
  },
  modalScroll: {
    maxHeight: 400,
  },
  dateOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  dateOptionSelected: {
    backgroundColor: 'rgba(0, 255, 127, 0.15)',
  },
  dateOptionText: {
    color: LIGHT_TEXT,
    fontSize: 16,
    flex: 1,
  },
  dateOptionTextSelected: {
    color: PRIMARY_GREEN,
    fontWeight: 'bold',
  },
});