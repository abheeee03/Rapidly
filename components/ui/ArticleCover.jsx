import { Image, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { useTheme } from '../../context/ThemeContext'

const ArticleCover = ({ cover, title, author, date, featured }) => {
  // Get theme from context or from props if passed
  const {theme} = useTheme()
  
  if (featured) {
    return (
      <View style={styles.featuredContainer}>
        <Image 
          source={cover} 
          style={styles.featuredImage}
        />
        <Text style={[styles.featuredTitle, { color: theme.text }]} numberOfLines={2}>
          {title}
        </Text>
        <View style={styles.authorContainer}>
          <View style={[styles.authorAvatar, { backgroundColor: theme.border }]} />
          <Text style={[styles.authorName, { color: theme.textSecondary }]}>{author.name}</Text>
          <Text style={[styles.dot, { color: theme.textSecondary }]}>•</Text>
          <Text style={[styles.date, { color: theme.textSecondary }]}>{date}</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Image 
        source={cover} 
        style={styles.coverImage}
      />
      <View style={styles.contentContainer}>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
          {title}
        </Text>
        <View style={styles.authorContainer}>
          <View style={[styles.authorAvatar, { backgroundColor: theme.border }]} />
          <Text style={[styles.authorName, { color: theme.textSecondary }]}>{author.name}</Text>
          <Text style={[styles.dot, { color: theme.textSecondary }]}>•</Text>
          <Text style={[styles.date, { color: theme.textSecondary }]}>{date}</Text>
        </View>
      </View>
    </View>
  )
}

export default ArticleCover

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  featuredContainer: {
    flexDirection: 'column',
    marginBottom: 24,
  },
  coverImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  featuredImage: {
    width: '100%',
    height: 200,
    marginRight: 0,
    marginBottom: 12,
    borderRadius: 10,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    marginBottom: 8,
    lineHeight: 22,
  },
  featuredTitle: {
    fontSize: 22,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
    lineHeight: 28,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  authorName: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginRight: 8,
  },
  dot: {
    fontSize: 14,
    marginRight: 8,
  },
  date: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
})