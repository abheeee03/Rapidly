import { StyleSheet, Text, View, Image, TouchableOpacity, ScrollView, Switch, SafeAreaView, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { db } from '../../Utlis/firebase';
import { collection, query, getDocs } from 'firebase/firestore';

const Account = () => {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { user, isLoading, logout, isAuthenticated } = useAuth();
  const [savedCount, setSavedCount] = useState(0);
  const [loadingContent, setLoadingContent] = useState(true);

  useEffect(() => {
    // If user is not authenticated, redirect to login
    if (!isLoading && !isAuthenticated) {
      router.push('/screens/LandingScreen');
    } else if (user) {
      loadSavedContentCount();
    }
  }, [isLoading, isAuthenticated, user]);

  // Load count of saved items (both shorts and articles)
  const loadSavedContentCount = async () => {
    if (!user) return;
    
    try {
      setLoadingContent(true);
      
      // Get shorts count
      const shortsRef = collection(db, 'users', user.uid, 'savedShorts');
      const shortsSnapshot = await getDocs(shortsRef);
      const shortsCount = shortsSnapshot.size;
      
      // Get articles count
      const articlesRef = collection(db, 'users', user.uid, 'savedArticles');
      const articlesSnapshot = await getDocs(articlesRef);
      const articlesCount = articlesSnapshot.size;
      
      // Update total count
      setSavedCount(shortsCount + articlesCount);
    } catch (error) {
      console.error('Error loading saved content count:', error);
    } finally {
      setLoadingContent(false);
    }
  };

  const navigateToMyAccount = () => {
    router.push('/screens/MyAccount');
  };

  const navigateToSavedNews = () => {
    router.push('/screens/SavedNews');
  };

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      router.push('/screens/LandingScreen');
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={{backgroundColor: theme.background, minHeight: '100%'}}>
      <ScrollView 
        contentContainerStyle={[
          styles.container, 
          { backgroundColor: theme.background }
        ]}
      >
        <View style={styles.profileContainer}>
          <Image 
            source={user?.photoURL ? { uri: user.photoURL } : require('../../assets/images/man.png')} 
            style={styles.profileImage} 
          />
          <Text style={[styles.profileName, { color: theme.text, fontFamily: theme.titleFont }]}>
            {user?.name || user?.displayName || 'User'}
          </Text>
          <Text style={[styles.profileRole, { color: theme.textSecondary, fontFamily: theme.font }]}>
            {user?.email || ''}
          </Text>
        </View>
        <View style={[styles.statsContainer, { borderColor: theme.border }]}>
          <View style={styles.stat}>
            <Text style={[styles.statNumber, { color: theme.text, fontFamily: theme.titleFont }]}>
              {user?.following?.length || 0}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary, fontFamily: theme.font }]}>Following</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statNumber, { color: theme.text, fontFamily: theme.titleFont }]}>
              {loadingContent ? '...' : savedCount}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary, fontFamily: theme.font }]}>Saved News</Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: theme.titleFont }]}>History</Text>
          <TouchableOpacity 
            onPress={navigateToSavedNews} 
            style={[styles.option, { borderBottomColor: theme.border }]}
          >
            <View style={styles.optionContent}>
              <Ionicons 
                name="bookmark" 
                size={20} 
                color={theme.accent}
                style={styles.optionIcon} 
              />
              <Text style={[styles.optionText, { color: theme.text, fontFamily: theme.font }]}>
                Saved News
              </Text>
            </View>
            
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text, fontFamily: theme.titleFont }]}>Settings</Text>
          
          {/* Dark Mode Toggle */}
          <View style={[styles.option, { borderBottomColor: theme.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons
                name={isDarkMode ? "moon" : "sunny"}
                size={20}
                color={theme.text}
                style={{ marginRight: 10 }}
              />
              <Text style={[styles.optionText, { color: theme.text, fontFamily: theme.font }]}>Dark Mode</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={isDarkMode ? theme.accent : '#f4f3f4'}
            />
          </View>
          
          <TouchableOpacity 
            style={[styles.option, { borderBottomColor: theme.border }]}
            onPress={navigateToMyAccount}
          >
            <View style={styles.optionContent}>
              <Ionicons
                name="person"
                size={20}
                color={theme.text}
                style={styles.optionIcon}
              />
              <Text style={[styles.optionText, { color: theme.text, fontFamily: theme.font }]}>
                My Account
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.option, { borderBottomColor: theme.border }]}>
            <Link href='https://uptodate-app.vercel.app/About'>
              <View style={styles.optionContent}>
                <Ionicons
                  name="information-circle"
                  size={20}
                  color={theme.text}
                  style={styles.optionIcon}
                />
                <Text style={[styles.optionText, { color: theme.text, fontFamily: theme.font }]}>
                  About Us
                </Text>
              </View>
            </Link>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.option, { borderBottomColor: theme.border }]}
            onPress={handleLogout}
          >
            <View style={styles.optionContent}>
              <Ionicons
                name="log-out"
                size={20}
                color={theme.text}
                style={styles.optionIcon}
              />
              <Text style={[styles.optionText, { color: theme.text, fontFamily: theme.font }]}>
                Logout
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Account;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingVertical: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  profileContainer: {
    marginTop: 55,
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileRole: {
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
  },
  section: {
    marginVertical: 10,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  option: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    marginRight: 10,
  },
  optionText: {
    fontSize: 16,
  },
  optionBadge: {
    backgroundColor: '#FF4C54',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  optionBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});