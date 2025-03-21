import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Link } from 'expo-router'

const LandingScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.ImgContainer}>

      </View>
      <View style={styles.ContentContainer}>
        <Text style={{fontSize: 23, fontWeight: 500}}>Welcome to FastFeed</Text>
        <Text style={{fontSize: 15}}>Stay Updated in Seconds !</Text>
      
 

        <Text style={{fontSize: 18, padding: 50, textAlign: 'center'}}>We deliver the latest news and updates in bite-sized video reels, keeping you informed quickly and conveniently. Swipe through engaging, short-form news clips tailored to your interests, because staying updated shouldn’t be a hassle!</Text>

   
        <Link href='/screens/Auth/Login' style={styles.btn}>
        <Text style={{fontSize: 17, color: 'white'}}>Explore</Text>
        </Link>
        
      </View>
    </View>
  )
}

export default LandingScreen

const styles = StyleSheet.create({
  container: {
    height: '100%',
  },
  ContentContainer: {
    height: '50%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'red',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  ImgContainer: {
    height: '50%',
    backgroundColor: 'blue',
  },
  btn: {
    paddingVertical: 14,
    paddingHorizontal: 25,
    borderRadius: 50,
    backgroundColor: '#2D5BD0'
  }
})