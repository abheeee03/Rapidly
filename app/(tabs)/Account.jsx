import { StyleSheet, Text, View, Image, TouchableOpacity, ScrollView, Switch, SafeAreaView } from 'react-native';
import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const Account = () => {
  const { theme, isDarkMode, toggleTheme } = useTheme();

  return (
    <SafeAreaView>

    <ScrollView 
      contentContainerStyle={[
        styles.container, 
        { backgroundColor: theme.background }
      ]}
    >
      <View style={styles.profileContainer}>
        <Image 
          source={require('../../assets/images/man.png')} 
          style={styles.profileImage} 
        />
        <Text style={[styles.profileName, { color: theme.text }]}>Dianne Russell</Text>
        <Text style={[styles.profileRole, { color: theme.textSecondary }]}>email@here.com</Text>
      </View>
      <View style={[styles.statsContainer, { borderColor: theme.border }]}>
        <View style={styles.stat}>
          <Text style={[styles.statNumber, { color: theme.text }]}>320</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Following</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statNumber, { color: theme.text }]}>125</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Saved News</Text>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>History</Text>
        <TouchableOpacity style={[styles.option, { borderBottomColor: theme.border }]}>
          <Text style={[styles.optionText, { color: theme.text }]}>Saved News</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.option, { borderBottomColor: theme.border }]}>
          <Text style={[styles.optionText, { color: theme.text }]}>Sved Articles</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Settings</Text>
        
        {/* Dark Mode Toggle */}
        <View style={[styles.option, { borderBottomColor: theme.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons
              name={isDarkMode ? "moon" : "sunny"}
              size={20}
              color={theme.text}
              style={{ marginRight: 10 }}
            />
            <Text style={[styles.optionText, { color: theme.text }]}>Dark Mode</Text>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={toggleTheme}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={isDarkMode ? theme.accent : '#f4f3f4'}
          />
        </View>
        
        <TouchableOpacity style={[styles.option, { borderBottomColor: theme.border }]}>
          <Text style={[styles.optionText, { color: theme.text }]}>My Account</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.option, { borderBottomColor: theme.border }]}>
          <Text style={[styles.optionText, { color: theme.text }]}>About Us</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.option, { borderBottomColor: theme.border }]}>
          <Text style={[styles.optionText, { color: theme.text }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  </SafeAreaView>
  );
};

export default Account;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingVertical: 20,
  },
  profileContainer: {
    marginTop: 55,
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
  profileRole: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  section: {
    marginVertical: 10,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    fontFamily: 'Inter-SemiBold',
  },
  option: {
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  optionText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
});