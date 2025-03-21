import { Image, StyleSheet, Text, View } from 'react-native'
import React from 'react'

const ArticleCover = ({ cover, title, author, date, featured }) => {
  if (featured) {
    return (
      <View style={styles.featuredContainer}>
        <Image 
          source={cover} 
          style={styles.featuredImage}
        />
        <Text style={styles.featuredTitle} numberOfLines={2}>
          {title}
        </Text>
        <View style={styles.authorContainer}>
          <View style={styles.authorAvatar} />
          <Text style={styles.authorName}>{author.name}</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.date}>{date}</Text>
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
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <View style={styles.authorContainer}>
          <View style={styles.authorAvatar} />
          <Text style={styles.authorName}>{author.name}</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.date}>{date}</Text>
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
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  featuredTitle: {
    fontSize: 20,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorName: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  dot: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
})