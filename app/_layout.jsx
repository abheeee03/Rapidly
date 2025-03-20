import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen 
        name="screens/Login" 
        options={{ 
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="screens/LandingScreen" 
        options={{ 
          headerShown: false 
        }} 
      />
    </Stack>
  );
}