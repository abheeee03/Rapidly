import { StyleSheet, Text, View, Image, TouchableOpacity, ScrollView, Switch, SafeAreaView, ActivityIndicator, Modal } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage, LANGUAGES } from '../../context/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { db } from '../../Utlis/firebase';
import { collection, query, getDocs } from 'firebase/firestore';

const Account = () => {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { user, isLoading, logout, isAuthenticated } = useAuth();
  const { language, updateLanguage } = useLanguage();
  const [savedCount, setSavedCount] = useState(0);
  const [loadingContent, setLoadingContent] = useState(true);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

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

  const handleLanguageChange = async (newLanguage) => {
    await updateLanguage(newLanguage);
    setShowLanguageModal(false);
  };

  const getLanguageDisplayName = (langCode) => {
    switch (langCode) {
      case LANGUAGES.ENGLISH:
        return 'English';
      case LANGUAGES.HINDI:
        return 'हिंदी (Hindi)';
      case LANGUAGES.MARATHI:
        return 'मराठी (Marathi)';
      default:
        return 'English';
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
                color={theme.text}
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
              thumbColor={isDarkMode ? theme.secondaryBackground : '#f4f3f4'}
            />
          </View>
          
          {/* Language Selection */}
          <TouchableOpacity 
            style={[styles.option, { borderBottomColor: theme.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
            onPress={() => setShowLanguageModal(true)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons
                name="language"
                size={20}
                color={theme.text}
                style={{ marginRight: 10 }}
              />
              <Text style={[styles.optionText, { color: theme.text, fontFamily: theme.font }]}>Language</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.optionText, { color: theme.textSecondary, fontFamily: theme.font, marginRight: 5 }]}>
                {getLanguageDisplayName(language)}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
            </View>
          </TouchableOpacity>
          
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

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text, fontFamily: theme.titleFont }]}>Select Language</Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <TouchableOpacity 
                style={[styles.languageOption, { backgroundColor: language === LANGUAGES.ENGLISH ? theme.primary + '20' : 'transparent' }]}
                onPress={() => handleLanguageChange(LANGUAGES.ENGLISH)}
              >
                <Text style={[styles.languageText, { color: theme.text, fontFamily: theme.font }]}>English</Text>
                {language === LANGUAGES.ENGLISH && (
                  <Ionicons name="checkmark" size={20} color={theme.primary} />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.languageOption, { backgroundColor: language === LANGUAGES.HINDI ? theme.primary + '20' : 'transparent' }]}
                onPress={() => handleLanguageChange(LANGUAGES.HINDI)}
              >
                <Text style={[styles.languageText, { color: theme.text, fontFamily: theme.font }]}>हिंदी (Hindi)</Text>
                {language === LANGUAGES.HINDI && (
                  <Ionicons name="checkmark" size={20} color={theme.primary} />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.languageOption, { backgroundColor: language === LANGUAGES.MARATHI ? theme.primary + '20' : 'transparent' }]}
                onPress={() => handleLanguageChange(LANGUAGES.MARATHI)}
              >
                <Text style={[styles.languageText, { color: theme.text, fontFamily: theme.font }]}>मराठी (Marathi)</Text>
                {language === LANGUAGES.MARATHI && (
                  <Ionicons name="checkmark" size={20} color={theme.primary} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    marginRight: 15,
  },
  optionText: {
    fontSize: 16,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  languageText: {
    fontSize: 16,
  },
});