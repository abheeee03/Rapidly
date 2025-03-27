import { StyleSheet, Text, View, TextInput } from 'react-native'
import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../context/ThemeContext'

const Search = () => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Search</Text>
      <View style={[styles.searchContainer, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
        <Ionicons name="search" size={20} color={theme.textSecondary} />
        <TextInput
          placeholder="Search for Authors, Topics, etc."
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text }]}
        />
      </View>
    </View>
  )
}

export default Search

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    marginTop: 10,
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  }
})