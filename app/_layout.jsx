import { Slot, Stack } from 'expo-router';
import { View } from 'react-native';
import useFonts from '../hooks/useFonts';

export default function Layout() {
  useFonts();
  
  return (
    <Slot/>
  );
}