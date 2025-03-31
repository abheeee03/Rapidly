import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

// List of major Indian cities
const INDIAN_CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata',
  'Ahmedabad', 'Pune', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur',
  'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Patna',
  'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad',
  'Meerut', 'Rajkot', 'Varanasi', 'Srinagar', 'Aurangabad', 'Dhanbad',
  'Amritsar', 'Allahabad', 'Ranchi', 'Howrah', 'Coimbatore', 'Jabalpur',
  'Gwalior', 'Vijayawada', 'Jodhpur', 'Madurai', 'Raipur', 'Kota',
  'Chandigarh', 'Thiruvananthapuram', 'Bhubaneswar', 'Dehradun', 'Mangalore',
  'Mysore', 'Gurgaon', 'Aligarh', 'Jamshedpur', 'Bhilai', 'Warangal'
].sort();

const CityAutocomplete = ({ value, onSelectCity, style }) => {
  const { theme } = useTheme();
  const [searchText, setSearchText] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredCities, setFilteredCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const modalAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef(null);

  useEffect(() => {
    if (showDropdown) {
      Animated.spring(modalAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else {
      modalAnim.setValue(0);
    }
  }, [showDropdown]);

  useEffect(() => {
    if (searchText.length > 0) {
      setLoading(true);
      // Simulate API delay
      setTimeout(() => {
        const filtered = INDIAN_CITIES.filter(city =>
          city.toLowerCase().includes(searchText.toLowerCase())
        );
        setFilteredCities(filtered);
        setLoading(false);
      }, 300);
    } else {
      setFilteredCities([]);
    }
  }, [searchText]);

  const handleSelectCity = (city) => {
    onSelectCity(city);
    setShowDropdown(false);
    setSearchText('');
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.cityItem,
        { backgroundColor: theme.cardBackground }
      ]}
      onPress={() => handleSelectCity(item)}
    >
      <Ionicons name="location" size={20} color={theme.accent} />
      <Text style={[styles.cityText, { color: theme.text }]}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[
          styles.inputContainer,
          { backgroundColor: theme.cardBackground, borderColor: theme.border }
        ]}
        onPress={() => {
          setShowDropdown(true);
          inputRef.current?.focus();
        }}
      >
        <Ionicons name="location" size={20} color={theme.accent} />
        <Text style={[styles.inputText, { color: value ? theme.text : theme.textSecondary }]}>
          {value || 'Select your city'}
        </Text>
        <Ionicons name="chevron-down" size={20} color={theme.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={showDropdown}
        transparent
        animationType="none"
        onRequestClose={() => setShowDropdown(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <Animated.View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.background,
                transform: [
                  {
                    translateY: modalAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [300, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Select City</Text>
              <TouchableOpacity
                onPress={() => setShowDropdown(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={[styles.searchContainer, { backgroundColor: theme.cardBackground }]}>
              <Ionicons name="search" size={20} color={theme.textSecondary} />
              <TextInput
                ref={inputRef}
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search cities..."
                placeholderTextColor={theme.textSecondary}
                value={searchText}
                onChangeText={setSearchText}
              />
            </View>

            {loading ? (
              <ActivityIndicator size="large" color={theme.accent} style={styles.loadingIndicator} />
            ) : (
              <View style={styles.listWrapper}>
                <FlatList
                  data={searchText.length > 0 ? filteredCities : INDIAN_CITIES}
                  renderItem={renderItem}
                  keyExtractor={item => item}
                  contentContainerStyle={styles.listContainer}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            )}
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  inputText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  listWrapper: {
    flex: 1,
  },
  listContainer: {
    paddingBottom: 16,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  cityText: {
    marginLeft: 12,
    fontSize: 16,
  },
  loadingIndicator: {
    flex: 1,
    justifyContent: 'center',
  },
});

export default CityAutocomplete; 