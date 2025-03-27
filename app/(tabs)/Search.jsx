import { StyleSheet, Text, View } from 'react-native'
import React, { useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const Search = () => {
  const supabaseUrl = 'https://wwmppewgyozsmhggokot.supabase.co'
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3bXBwZXdneW96c21oZ2dva290Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1NTgxODIsImV4cCI6MjA1ODEzNDE4Mn0.WBUZXvOes_H-oC4pm4ZlO4n3A3c0tWBqPrUWYWqldw0'
  const supabase = createClient(supabaseUrl, supabaseKey)


  useEffect(()=>{
  const fetchVideoUrls = async () => {
    const { data: files, error } = await supabase
      .storage
      .from('news-shorts') // Replace with your bucket name
      .getPublicUrl('/reel1.mp4') // Adjust path and limit as needed
  
    console.log(files);
    if (error) {
      console.error('Error fetching files:', error);
      return [];
    }
    return files.map(file => file.name); // Return file names
  };
}, [])


  return (
    <View style={{minHeight: '100%', width: '100%', flex: 1
    }}>
      
    </View>
  )
}

export default Search

const styles = StyleSheet.create({})