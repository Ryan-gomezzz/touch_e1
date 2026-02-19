import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../src/api';

export default function Index() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkOnboarding();
  }, []);

  async function checkOnboarding() {
    try {
      const settings = await api.getSettings();
      if (settings.onboarding_completed) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/onboarding');
      }
    } catch {
      router.replace('/onboarding');
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>T</Text>
        </View>
        <Text style={styles.appName}>Touch</Text>
        <Text style={styles.tagline}>Stay present with the people you love</Text>
      </View>
      <ActivityIndicator size="large" color="#2D6A4F" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F7F2', justifyContent: 'center', alignItems: 'center' },
  logoContainer: { alignItems: 'center' },
  logoCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#2D6A4F', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  logoText: { fontSize: 36, fontWeight: '700', color: '#FFFFFF' },
  appName: { fontSize: 32, fontWeight: '600', color: '#2D3436', fontFamily: 'Lora_600SemiBold' },
  tagline: { fontSize: 16, color: '#636E72', marginTop: 8, fontFamily: 'Nunito_400Regular' },
  loader: { marginTop: 40 },
});
