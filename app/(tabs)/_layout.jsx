import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Entypo from '@expo/vector-icons/Entypo';
import AntDesign from '@expo/vector-icons/AntDesign';


const MainScreenTabs = () => {
  return (
    <Tabs
      screenOptions={{
        tabBarHideOnKeyboard: true,
        headerShown: false,
        tabBarActiveTintColor: 'black',
        tabBarInactiveTintColor: 'gray',
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 60,
          paddingBottom: 10, 
          paddingTop: 10, 
          backgroundColor: 'black',      
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={24} 
              color="white"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="ListenNews"
        options={{
          tabBarIcon: ({ focused }) => (
            focused?
            <Entypo
              name='sound'
              size={24} 
              color="white"
            />:
            <AntDesign name="sound" size={24} color="white" />
          ),
        }}
      />
      <Tabs.Screen
        name="Articles"
        options={{
          tabBarIcon: ({ focused }) => (
            
            <Ionicons
              name={focused ? 'newspaper' : 'newspaper-outline'}
              size={24}
              color="white"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="Search"
        options={{
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'search' : 'search-outline'}
              size={24} 
              color="white"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="Account"
        options={{
          tabBarIcon: ({ focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'account-circle' : 'account-circle-outline'}
              size={24} // Scale icon when active
              color="white"
            />
          ),
        }}
      />
    </Tabs>
  );
};

export default MainScreenTabs;

const styles = StyleSheet.create({});