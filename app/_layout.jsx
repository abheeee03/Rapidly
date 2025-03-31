import { Slot, usePathname } from 'expo-router';
import { ThemeProvider } from '../context/ThemeContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import { AuthProvider } from '../context/AuthContext';
import { trackScreenView } from '../Utlis/analytics';

export default function RootLayout() {
  const [loaded] = useFonts({
    'Inter-Bold': require('../assets/fonts/Inter-Bold.ttf'),
    'Inter-Regular': require('../assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('../assets/fonts/Inter-Medium.ttf'),
    'Inter-SemiBold': require('../assets/fonts/Inter-SemiBold.ttf'),
  });

  // Get current route path for analytics
  const pathname = usePathname();

  // Track screen views for analytics
  useEffect(() => {
    if (pathname) {
      const screenName = pathname.replace(/^\/+|\/+$/g, '') || 'Home';
      trackScreenView(screenName);
    }
  }, [pathname]);

  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <Slot />
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}