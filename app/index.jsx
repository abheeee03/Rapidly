import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

// Loading component for index page
const IndexLoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#D70404" />
  </View>
);

export default function Index() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  // If still loading auth data, show loading screen
  if (authLoading) {
    return <IndexLoadingScreen />;
  }
  
  // Redirect based on auth status
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  } else {
    // Always show language selection screen first for non-authenticated users
    return <Redirect href="/screens/LanguageSelectionScreen" />;
  }
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});