import React, { useState, useEffect } from 'react';
import { 
  View, 
  TextInput, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Top 100 cities in India for autocomplete
const INDIAN_CITIES = [
  "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", 
  "Kolkata", "Ahmedabad", "Pune", "Surat", "Jaipur", 
  "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", 
  "Bhopal", "Visakhapatnam", "Pimpri-Chinchwad", "Patna", "Vadodara", 
  "Ghaziabad", "Ludhiana", "Agra", "Nashik", "Faridabad", 
  "Meerut", "Rajkot", "Kalyan-Dombivli", "Vasai-Virar", "Varanasi", 
  "Srinagar", "Aurangabad", "Dhanbad", "Amritsar", "Navi Mumbai", 
  "Allahabad", "Ranchi", "Howrah", "Coimbatore", "Jabalpur", 
  "Gwalior", "Vijayawada", "Jodhpur", "Madurai", "Raipur", 
  "Kota", "Guwahati", "Chandigarh", "Solapur", "Hubli-Dharwad", 
  "Mysore", "Tiruchirappalli", "Bareilly", "Aligarh", "Moradabad", 
  "Gorakhpur", "Bikaner", "Saharanpur", "Noida", "Jamshedpur", 
  "Bhilai", "Cuttack", "Firozabad", "Kochi", "Dehradun", 
  "Durgapur", "Ajmer", "Siliguri", "Gaya", "Tirupati", 
  "Mathura", "Bilaspur", "Hapur", "Bhiwandi", "Rohtak", 
  "Sagar", "Korba", "Bhilwara", "Berhampur", "Muzaffarpur", 
  "Ahmednagar", "Shahjahanpur", "Guntur", "Satna", "Amravati", 
  "Rajahmundry", "Yamunanagar", "Bikaner", "Shimla", "Tumkur", 
  "Jhansi", "Mangalore", "Jamnagar", "Bhubaneswar", "Manipal", 
  "Karimnagar", "Warangal", "Thiruvananthapuram", "Puducherry", "Panaji"
];

const CityAutocomplete = ({ value, onSelectCity, style }) => {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (query.length >= 2) {
      setIsLoading(true);
      
      // Filter cities based on query
      const filteredCities = INDIAN_CITIES.filter(city => 
        city.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5); // Show top 5 matches
      
      setSuggestions(filteredCities);
      setShowSuggestions(filteredCities.length > 0);
      setIsLoading(false);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  }, [query]);

  const handleSelectCity = (city) => {
    setQuery(city);
    setShowSuggestions(false);
    onSelectCity(city);
  };

  const clearInput = () => {
    setQuery('');
    onSelectCity('');
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.inputContainer}>
        <Ionicons name="location" size={20} color="#666" style={styles.icon} />
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="Search for a city..."
          placeholderTextColor="#999"
          onFocus={() => query.length >= 2 && setShowSuggestions(true)}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={clearInput} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>
      
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
        </View>
      )}
      
      {showSuggestions && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.suggestionItem} 
                onPress={() => handleSelectCity(item)}
              >
                <Ionicons name="location-outline" size={16} color="#666" style={styles.suggestionIcon} />
                <Text style={styles.suggestionText}>{item}</Text>
              </TouchableOpacity>
            )}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fafafa',
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 46,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 4,
  },
  loadingContainer: {
    position: 'absolute',
    top: 13,
    right: 40,
    zIndex: 2,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxHeight: 200,
    zIndex: 20,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionIcon: {
    marginRight: 10,
  },
  suggestionText: {
    fontSize: 16,
    color: '#333',
  }
});

export default CityAutocomplete; 