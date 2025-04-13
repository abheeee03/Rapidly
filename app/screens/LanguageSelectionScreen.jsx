import { StyleSheet, View, Text, TouchableOpacity, Image, SafeAreaView, StatusBar, Dimensions } from 'react-native';
import React from 'react';
import { useLanguage, LANGUAGES } from '../../context/LanguageContext';
import { router } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const LanguageSelectionScreen = () => {
  const { updateLanguage, t } = useLanguage();
  const { theme } = useTheme();

  const handleLanguageSelect = async (language) => {
    await updateLanguage(language);
    router.replace('/screens/LandingScreen');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}>
            <Ionicons name="language" size={60} color={theme.text} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>
            {t('selectLanguage')}
          </Text>

          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {t('languageDescription')}
          </Text>
        </View>

        <View style={styles.languageContainer}>
          {[
            { code: LANGUAGES.ENGLISH, name: t('english'), native: 'English' },
            { code: LANGUAGES.MARATHI, name: t('marathi'), native: 'मराठी' },
            { code: LANGUAGES.HINDI, name: t('hindi'), native: 'हिंदी' }
          ].map((lang, index) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.languageButton,
                { backgroundColor: theme.card },
                index === 0 && styles.firstButton,
                index === 2 && styles.lastButton
              ]}
              onPress={() => handleLanguageSelect(lang.code)}
            >
              <View style={styles.languageInfo}>
                <Text style={[styles.languageText, { color: theme.text }]}>{lang.native}</Text>
                <Text style={[styles.languageNative, { color: theme.textSecondary }]}>{lang.name}</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    width: '100%',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
    maxWidth: width * 0.8,
    lineHeight: 22,
  },
  languageContainer: {
    width: '100%',
    maxWidth: 450,
  },
  languageButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  firstButton: {
    marginTop: 8,
  },
  lastButton: {
    marginBottom: 8,
  },
  languageInfo: {
    flex: 1,
  },
  languageText: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  languageNative: {
    fontSize: 16,
  },
});

export default LanguageSelectionScreen;