import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useAppTheme } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import { CatalogProvider } from './src/context/CatalogContext';
import { AppNavigator } from './src/navigation/AppNavigator';
const AppContent=()=>{const{isDark}=useAppTheme();return <><StatusBar style={isDark?'light':'dark'}/><AppNavigator/></>};
export default function App(){return <ThemeProvider><AuthProvider><CatalogProvider><AppContent/></CatalogProvider></AuthProvider></ThemeProvider>}
