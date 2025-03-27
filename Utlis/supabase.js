import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Define hardcoded fallback values in case env variables are not loaded
const DEFAULT_SUPABASE_URL = 'https://wwmppewgyozsmhggokot.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3bXBwZXdneW96c21oZ2dva290Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1NTgxODIsImV4cCI6MjA1ODEzNDE4Mn0.WBUZXvOes_H-oC4pm4ZlO4n3A3c0tWBqPrUWYWqldw0';

// Use environment variables if available, otherwise fall back to hardcoded values
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

console.log('Initializing Supabase with URL:', supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
