import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useState, useEffect } from 'react'
import { Link } from 'expo-router'
import AntDesign from '@expo/vector-icons/AntDesign';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

const images = [
  require('../../assets/images/city.jpg'),
  require('../../assets/images/newspaper.jpg'),
  require('../../assets/images/news-globe.jpg'),
  // Add more images as needed
];

const LandingScreen = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { theme, isDarkMode, toggleTheme } = useTheme();


  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3000); // Change image every 3 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <>
    <StatusBar />
    <SafeAreaView style={styles.container}>
      <View style={styles.ImgContainer}>
        <Image source={images[currentImageIndex]} style={{ height: '100%', width: '100%' }} />
      </View>
      <View style={styles.ContentContainer}>
        <Text style={{ fontSize: 23, fontWeight: '500', fontFamily: 'Inter-Bold'}}>Welcome to <Text style={{color: "#2D5BD0"}}>
        UptoDate</Text> </Text>
        <Text style={{ fontSize: 15, marginBottom: 20, fontFamily: 'Inter-SemiBold' }}>Stay Updated in Seconds !</Text>
        <Text style={{ fontSize: 18, padding: 20, textAlign: 'center', fontFamily: 'Inter-Regular' }}>
          We deliver the latest news and updates in bite-sized video reels, keeping you informed quickly and conveniently. Swipe through engaging, short-form news clips tailored to your interests, because staying updated shouldn’t be a hassle!
        </Text>
        <Link href='/screens/Auth/Login' style={styles.btn}>
          <Text style={{ fontSize: 17, color: 'white' }}>Explore <AntDesign name="arrowright" size={20} color="white" /> </Text>
        </Link>
      </View>
    </SafeAreaView>
</>
  )
}

export default LandingScreen

const styles = StyleSheet.create({
  container: {
    height: '100%',
  },
  ContentContainer: {
    position: 'absolute',
    bottom: 1,
    width: '100%',
    height: '50%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
  },
  ImgContainer: {
    top: 2,
    height: '55%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btn: {
    paddingVertical: 14,
    paddingHorizontal: 25,
    borderRadius: 50,
    backgroundColor: '#2D5BD0',
    marginTop: 20,
  },
})