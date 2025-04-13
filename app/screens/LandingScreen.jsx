import { StyleSheet, View, Text, Image, useWindowDimensions, TouchableOpacity, StatusBar } from 'react-native';
import PagerView from 'react-native-pager-view';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import AuthModal from '../components/AuthModal';

export default function LandingScreen() {
  const pagerRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(0);
  const { width, height } = useWindowDimensions();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      if (pagerRef.current) {
        const nextPage = (currentPage + 1) % 4;
        pagerRef.current.setPage(nextPage);
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [currentPage]);

  const onPageSelected = (e) => {
    setCurrentPage(e.nativeEvent.position);
  };

  const handleGetStarted = () => {
    setShowAuthModal(true);
  };

  const handleCloseAuthModal = () => {
    setShowAuthModal(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.whiteOverlay} />
      
      <PagerView
        ref={pagerRef}
        style={styles.Imgcontainer}
        initialPage={0}
        onPageSelected={onPageSelected}>
        <View style={styles.page} key="1">
          <Image source={require('../../assets/images/img4.png')} style={styles.image} />
        </View>
        <View style={styles.page} key="2">
          <Image source={require('../../assets/images/img4.png')} style={styles.image} />
        </View>
        <View style={styles.page} key="3">
          <Image source={require('../../assets/images/img4.png')} style={styles.image} />
        </View>
        <View style={styles.page} key="4">
          <Image source={require('../../assets/images/img4.png')} style={styles.image} />
        </View>
      </PagerView>

      <View style={styles.contentContainer}>
        <View style={styles.pagination}>
          {[0, 1, 2, 3].map((index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                currentPage === index && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>

        <Text style={[styles.title, {fontFamily: theme.titleFont}]}>
          {t('welcome')}
        </Text>

        <Text style={[styles.description, {fontFamily: theme.font}]}>
          {t('getStartedDescription')}
        </Text>

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleGetStarted}
          activeOpacity={0.8}
        >
          <Text style={[styles.buttonText, {fontFamily: theme.titleFont}]}>{t('getStarted')}</Text>
          <Text style={styles.arrowIcon}>›</Text>
        </TouchableOpacity>
      </View>

      <AuthModal 
        visible={showAuthModal}
        onClose={handleCloseAuthModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  whiteOverlay: {
    backgroundColor: 'white',
    height: 250,
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  Imgcontainer: {
    height: '40%',
    width: '80%',
    alignSelf: 'center',
    marginTop: 100,
    borderRadius: 25,
    overflow: 'hidden',
    zIndex: 2,
  },
  page: {
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    borderRadius: 25,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 25,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    paddingTop: 20,
    zIndex: 2,
  },
  pagination: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#666',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#fff',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 29,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 34,
  },
  description: {
    color: '#666666',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 80,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#E31E24',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: '80%',
    elevation: 4,
    shadowColor: '#E31E24',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  arrowIcon: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  }
});