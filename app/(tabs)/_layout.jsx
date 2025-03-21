import { View, Text, StyleSheet } from 'react-native'
import React from 'react'
import { Stack, Tabs } from 'expo-router'
import Entypo from '@expo/vector-icons/Entypo';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const AppLayout = () => {
  return (
    <Tabs screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: styles.tabBar,
      tabBarLabelStyle: styles.tabBarLabel,
      tabBarActiveTintColor: '#2D5BD0',
      tabBarInactiveTintColor: '#666',
      tabBarItemStyle: styles.tabBarItem,
      tabBarLabel: ({ focused }) => {
        let label;
        switch (route.name) {
          case 'index':
            label = 'Home';
            break;
          case 'Articles':
            label = 'Articles';
            break;
          case 'Search':
            label = 'Search';
            break;
          case 'Account':
            label = 'Account';
            break;
        }
        return focused ? <Text style={styles.tabBarLabel}>{label}</Text> : null;
      },
      tabBarActiveBackgroundColor: 'black',
      tabBarItemStyle: ({ focused }) => ({
        ...styles.tabBarItem,
        backgroundColor: focused ? 'black' : 'transparent',
        borderRadius: focused ? 20 : 0, // Add borderRadius when active
      }),
    })}>
      <Tabs.Screen name='index' options={{
        tabBarIcon: ({ focused }) => <Entypo name="home" size={25} color={focused ? 'white' : 'black'} />
      }}/>
      <Tabs.Screen name='Articles' options={{
        tabBarIcon: ({ focused }) => <FontAwesome6 name="newspaper" size={25} color={focused ? 'white' : 'black'} />
      }}/>
      <Tabs.Screen name='Search' options={{
        tabBarIcon: ({ focused }) => <FontAwesome name="search" size={25} color={focused ? 'white' : 'black'} />
      }}/>
      <Tabs.Screen name='Account' options={{
        tabBarIcon: ({ focused }) => <MaterialCommunityIcons name="account" size={25} color={focused ? 'white' : 'black'} />
      }}/>
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    borderRadius: 10,
    backgroundColor: '#fff',
    borderTopWidth: 0,
    elevation: 6,
    height: 60,
  },
  tabBarLabel: {
    fontSize: 10,
    color: 'white'
  },
  tabBarItem: {
    paddingVertical: 5,
  },
});

export default AppLayout