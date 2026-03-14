import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import ScannerScreen from './src/screens/ScannerScreen';
import DashboardScreen from './src/screens/DashboardScreen';

export type RootStackParamList = {
  Scanner: undefined;
  Dashboard: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Scanner"
        screenOptions={{
          headerStyle: {backgroundColor: '#0d0d0d'},
          headerTintColor: '#fff',
          headerTitleStyle: {fontWeight: '700'},
        }}>
        <Stack.Screen
          name="Scanner"
          component={ScannerScreen}
          options={{title: 'MedLens'}}
        />
        <Stack.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{title: 'Adherence Dashboard'}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
