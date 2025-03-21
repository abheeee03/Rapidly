import { View, Text } from 'react-native'
import React from 'react'
import { Stack, Tabs } from 'expo-router'
import Entypo from '@expo/vector-icons/Entypo';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';


const AppLayout = () => {
  return (
    <Tabs screenOptions={{headerShown: false}}>
        <Tabs.Screen name='index' options={{
            title: 'Feed', 
            tabBarIcon: () => <Entypo name="home" size={24} color='black' />
        }}/>
        <Tabs.Screen name='Articles' options={{
            title: 'Articles', 
            tabBarIcon: () => <FontAwesome6 name="newspaper" size={24} color="black" />
        }}/>
        <Tabs.Screen name='Search' options={{
            title: 'Search', 
            tabBarIcon: () => <FontAwesome name="search" size={24} color="black" />
        }}/>
        <Tabs.Screen name='Account' options={{
            title: 'Account', 
            tabBarIcon: () => <MaterialCommunityIcons name="account" size={24} color="black" />
        }}/>
    </Tabs>
  )
}

export default AppLayout