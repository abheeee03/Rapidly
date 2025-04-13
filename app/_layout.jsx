import { Slot, usePathname } from 'expo-router';
import { ThemeProvider } from '../context/ThemeContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import { AuthProvider } from '../context/AuthContext';
import { LanguageProvider } from '../context/LanguageContext';
import { trackScreenView } from '../Utlis/analytics';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { initializeI18n } from '../translations/i18n';

// Loading component while app initializes
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#D70404" />
  </View>
);

// Wrapper component for app content
const AppContent = () => {
  const [loaded] = useFonts({
    'Inter-Bold': require('../assets/fonts/Inter-Bold.ttf'),
    'Inter-Regular': require('../assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('../assets/fonts/Inter-Medium.ttf'),
    'Inter-SemiBold': require('../assets/fonts/Inter-SemiBold.ttf'),
  });

  // Get current route path for analytics
  const pathname = usePathname();

  // Initialize i18n when app starts
  useEffect(() => {
    const setupI18n = async () => {
      await initializeI18n();
    };
    
    setupI18n();
  }, []);

  // Track screen views for analytics
  useEffect(() => {
    if (pathname) {
      const screenName = pathname.replace(/^\/+|\/+$/g, '') || 'Home';
      trackScreenView(screenName);
    }
  }, [pathname]);

  if (!loaded) {
    return <LoadingScreen />;
  }

  return <Slot />;
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <LanguageProvider>
          <ThemeProvider>
            <AppContent />
          </ThemeProvider>
        </LanguageProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});