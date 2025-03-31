import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  
  // If authentication is still loading, don't redirect yet
  if (isLoading) {
    return null;
  }
  
  // Redirect based on auth status
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  } else {
    return <Redirect href="/screens/LandingScreen" />;
  }
}