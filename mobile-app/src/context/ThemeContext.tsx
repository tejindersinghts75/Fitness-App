import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { darkTheme, lightTheme } from '../theme';

const ThemeContext = createContext({ theme: lightTheme, isDark: false, toggleTheme: () => {} });
export const ThemeProvider = ({ children }: React.PropsWithChildren) => {
  const [isDark, setDark] = useState(false);
  useEffect(() => { AsyncStorage.getItem('fitora-theme').then(v => v && setDark(v === 'dark')); }, []);
  const toggleTheme = () => setDark(v => { AsyncStorage.setItem('fitora-theme', !v ? 'dark' : 'light'); return !v; });
  const value = useMemo(() => ({ theme: isDark ? darkTheme : lightTheme, isDark, toggleTheme }), [isDark]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
export const useAppTheme = () => useContext(ThemeContext);
