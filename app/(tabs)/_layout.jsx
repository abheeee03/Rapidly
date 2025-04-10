import { StyleSheet } from 'react-native';
import React from 'react';
import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Entypo from '@expo/vector-icons/Entypo';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useTheme } from '../../context/ThemeContext';
import { MaterialIcons } from '@expo/vector-icons';

const MainScreenTabs = () => {
  const { theme } = useTheme();
  
  return (
    <Tabs
      screenOptions={{
        tabBarHideOnKeyboard: true,
        headerShown: false,
        tabBarActiveTintColor: theme.secondaryBackground,
        tabBarInactiveTintColor: theme.tabBarInactive,
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 60,
          paddingBottom: 10, 
          paddingTop: 10, 
          backgroundColor: theme.tabBar,      
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            focused ? 
            <Entypo name="home" 
            size={24} 
            color={focused ? theme.secondaryBackground : theme.text} />:
            <AntDesign 
            name='home'
            size={focused ? 26 : 24} 
            color={focused ? theme.secondaryBackground : theme.text}
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
              size={focused ? 26 : 24}
              color={theme.secondaryBackground}
            />:
            <AntDesign 
              name="sound" 
              size={focused ? 26 : 24}
              color={theme.text} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="Articles"
        options={{
          tabBarIcon: ({ focused }) => (
            <MaterialIcons
              name='article'
              size={focused ? 26 : 24}
              color={focused ? theme.secondaryBackground : theme.text}
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
              size={focused ? 26 : 24}
              color={focused ? theme.secondaryBackground : theme.text}
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
              size={focused ? 26 : 24}
              color={focused ? theme.secondaryBackground : theme.text}
            />
          ),
        }}
      />
    </Tabs>
  );
};

export default MainScreenTabs;

const styles = StyleSheet.create({});