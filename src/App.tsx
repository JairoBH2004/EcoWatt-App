import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from '../src/navigation/AppNavigator';

const App = () => {
  return (
    // Simplemente envolvemos el navegador principal
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
};

export default App;