import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

// Define theme colors
export const lightTheme = {
  background: '#FFFFFF',
  cardBackground: '#F8F8F8',
  text: '#333333',
  textSecondary: '#666666',
  accent: '#007AFF',
  border: '#EEEEEE',
  tabBar: '#FFFFFF',
  tabBarInactive: '#8E8E93',
  font: 'Inter-Regular',
  titleFont: 'Inter-SemiBold',
};

export const darkTheme = {
  background: '#121212',
  cardBackground: '#1E1E1E',
  text: '#FFFFFF',
  textSecondary: '#AAAAAA',
  accent: '#0A84FF',
  border: '#2C2C2C',
  tabBar: '#1E1E1E',
  tabBarInactive: '#8E8E93',
  font: 'Inter-Regular',
  titleFont: 'Inter-SemiBold',
};

// Create context
export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const deviceTheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme preference when app starts
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('isDarkMode');
        if (savedTheme !== null) {
          setIsDarkMode(JSON.parse(savedTheme));
        } else {
          // Use device theme if no preference saved
          setIsDarkMode(deviceTheme === 'dark');
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadThemePreference();
  }, [deviceTheme]);

  // Toggle theme function
  const toggleTheme = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    
    // Save theme preference
    try {
      await AsyncStorage.setItem('isDarkMode', JSON.stringify(newMode));
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  // Get current theme
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme }}>
      {!isLoading && children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme
export const useTheme = () => useContext(ThemeContext); 