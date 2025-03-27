import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { useTheme } from '../../context/ThemeContext'
import AntDesign from '@expo/vector-icons/AntDesign';
import { router } from 'expo-router';





const Articles = () => {



  const { theme } = useTheme();
  
  const categories = [
    {
    name: 'Trending Now',
    categoryCode: 10
    },
    {
    name: 'Education',
    categoryCode: 10
    },
    {
     name: 'Sports',
     categoryCode: 10
    }, 
    {
     name: 'Sports',
     categoryCode: 10
    }, 
    {
     name: 'Sports',
     categoryCode: 10
    }, 
    {
     name: 'Accidents',
     categoryCode: 10
    }
  ]
  
  
  
  
  
  
  return (
    <View style={{ backgroundColor: theme.background, flex: 1 }}>
      <View style={styles.header}>
      <Text style={{ color: theme.text, fontFamily: theme.titleFont , fontSize: 20, marginTop: 9 }}>Explore</Text>
      <TouchableOpacity onPress={()=>router.push('/(tabs)/Search')}>
      <AntDesign name="search1" size={24} color="white" />
      </TouchableOpacity>
      </View>
      <ScrollView horizontal={true} style={styles.CategoryContainer}>
        {
          categories.map((item, index)=>
            <TouchableOpacity key={index} style={styles.categoryBtn}>
            <Text style={{ fontFamily: theme.font, color: theme.text}}>{item.name}</Text>
          </TouchableOpacity>)
        }
        </ScrollView>
    </View>
  )
}

export default Articles

const styles = StyleSheet.create({
  header: {
    position: 'fixed',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  CategoryContainer: {
    padding: 5,
    height: 20
  },
  categoryBtn:{
    height: 40,
    padding: 10,
    backgroundColor: 'blue',
    borderRadius: 20,
    margin: 5
  },
  ArticleContainer:{
    
  }
})