import { Slot } from 'expo-router';
import useFonts from '../hooks/useFonts';
import { ThemeProvider } from '../context/ThemeContext';

export default function Layout() {
  useFonts();
  
  return (
    <ThemeProvider>
      <Slot />
    </ThemeProvider>
  );
}