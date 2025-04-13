import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../Utlis/firebase';
import I18n, { changeLocale, initializeI18n } from '../translations/i18n';

// Define available languages
export const LANGUAGES = {
  ENGLISH: 'english',
  HINDI: 'hindi',
  MARATHI: 'marathi'
};

// Create context
const LanguageContext = createContext({});

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(LANGUAGES.ENGLISH);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Load language preference from AsyncStorage on app start
  useEffect(() => {
    const loadLanguagePreference = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('userLanguage');
        if (savedLanguage) {
          setLanguage(savedLanguage);
        }
        // Initialize i18n with the saved language
        await initializeI18n();
      } catch (error) {
        console.error('Error loading language preference:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLanguagePreference();
  }, []);

  // Update language preference in AsyncStorage and Firestore
  const updateLanguage = async (newLanguage) => {
    try {
      // Update in AsyncStorage
      await AsyncStorage.setItem('userLanguage', newLanguage);
      
      // Update in Firestore if user is logged in
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          language: newLanguage
        });
      }
      
      // Update i18n locale
      changeLocale(newLanguage);
      
      // Update state
      setLanguage(newLanguage);
    } catch (error) {
      console.error('Error updating language preference:', error);
    }
  };

  // Check if user has already selected a language
  const hasSelectedLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('userLanguage');
      return !!savedLanguage;
    } catch (error) {
      console.error('Error checking language selection:', error);
      return false;
    }
  };

  // Translation function that wraps I18n.t
  const translate = (key, options = {}) => {
    return I18n.t(key, options);
  };

  return (
    <LanguageContext.Provider value={{ 
      language, 
      updateLanguage, 
      isLoading,
      hasSelectedLanguage,
      LANGUAGES,
      translate,
      t: translate // shorthand alias for convenience
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext); 