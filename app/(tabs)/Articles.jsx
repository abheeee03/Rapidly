import { ScrollView, StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native'
import React, { useState } from 'react'
import ArticleCover from '@/components/ui/ArticleCover'
import { Ionicons } from '@expo/vector-icons'

const Articles = () => {
  const [selectedCategory, setSelectedCategory] = useState('Trending Now')
  
  const categories = ['Trending Now', 'Technology', 'Business']

  const articlesList = [
    {
      cover: require('../../assets/images/cover-img.png'),
      title: 'Uncovering the Hidden Gems of the Amazon Forest',
      author: {
        name: 'Mr. Lana Kub',
      },
      date: 'May 1, 2023',
      featured: true,
    },
    {
      cover: require('../../assets/images/cover-img.png'),
      title: "Experience the Serenity of Japan's Traditional...",
      author: {
        name: 'Hilda Friesen',
      },
      date: 'May 3, 2023',
    },
    {
      cover: require('../../assets/images/cover-img.png'),
      title: 'A Journey Through Time: Discovering the Nile river',
      author: {
        name: 'Melissa White',
      },
      date: 'May 7, 2023',
    },
    {
      cover: require('../../assets/images/cover-img.png'),
      title: 'Chasing the Northern Lights: A Winter in Finland',
      author: {
        name: 'Jeannie Conn',
      },
      date: 'May 12, 2023',
    },
  ]

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
        <TouchableOpacity>
          <Ionicons name="search" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((category, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.categoryButtonActive
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[
              styles.categoryText,
              selectedCategory === category && styles.categoryTextActive
            ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Articles List */}
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {articlesList.map((article, index) => (
          <View key={index} style={article.featured ? styles.featuredArticle : null}>
            <ArticleCover
              cover={article.cover}
              title={article.title}
              author={article.author}
              date={article.date}
              featured={article.featured}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

export default Articles

const styles = StyleSheet.create({
  container: {
    // flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  categoriesContainer: {
    padding: 10,
    marginVertical: 16,
  },
  categoriesContent: {
    paddingHorizontal: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  categoryButtonActive: {
    backgroundColor: '#000',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  categoryTextActive: {
    color: '#fff',
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  featuredArticle: {
    marginBottom: 24,
  },
})