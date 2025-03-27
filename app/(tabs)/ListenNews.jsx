import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { useTheme } from '../../context/ThemeContext'

const ListenNews = () => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Listen to News</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Audio news coming soon...</Text>
    </View>
  )
}

export default ListenNews

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  }
})