import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { api } from '../src/api';

const { width } = Dimensions.get('window');

const steps = [
  {
    icon: 'heart',
    title: 'Stay Present',
    subtitle: 'Touch helps you maintain emotional consistency with the people who matter most.',
    color: '#2D6A4F',
  },
  {
    icon: 'clock',
    title: 'Track Naturally',
    subtitle: 'Set your own rhythm for each relationship. No pressure, no streaks — just gentle awareness.',
    color: '#40916C',
  },
  {
    icon: 'zap',
    title: 'AI-Powered Memory',
    subtitle: 'Never forget what matters. Get conversation summaries, call prep briefs, and thoughtful reminders.',
    color: '#52B788',
  },
  {
    icon: 'shield',
    title: 'Privacy First',
    subtitle: 'Your conversations stay private. Encrypted data, no tracking, no data sales. Your relationships, your data.',
    color: '#457B9D',
  },
];

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  async function handleComplete() {
    setLoading(true);
    try {
      await api.seed();
      await api.updateSettings({ onboarding_completed: true });
    } catch (e) {
      // continue anyway
    }
    setLoading(false);
    router.replace('/(tabs)/home');
  }

  function handleNext() {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  }

  const current = steps[step];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={styles.miniLogo}>
            <Text style={styles.miniLogoText}>T</Text>
          </View>
          <Text style={styles.brandName}>Touch</Text>
        </View>
        {step > 0 && (
          <TouchableOpacity testID="onboarding-back-btn" onPress={() => setStep(step - 1)}>
            <Feather name="arrow-left" size={24} color="#2D3436" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.iconCircle, { backgroundColor: current.color + '15' }]}>
          <Feather name={current.icon as any} size={48} color={current.color} />
        </View>
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.subtitle}>{current.subtitle}</Text>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {steps.map((_, i) => (
            <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
          ))}
        </View>

        <TouchableOpacity
          testID="onboarding-next-btn"
          style={[styles.nextBtn, loading && styles.nextBtnDisabled]}
          onPress={handleNext}
          activeOpacity={0.8}
          disabled={loading}
        >
          <Text style={styles.nextBtnText}>
            {loading ? 'Setting up...' : step === steps.length - 1 ? 'Get Started' : 'Continue'}
          </Text>
          {!loading && <Feather name="arrow-right" size={20} color="#FFF" />}
        </TouchableOpacity>

        {step < steps.length - 1 && (
          <TouchableOpacity testID="onboarding-skip-btn" onPress={handleComplete} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F7F2' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  miniLogo: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2D6A4F', justifyContent: 'center', alignItems: 'center' },
  miniLogoText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  brandName: { fontSize: 20, fontWeight: '600', color: '#2D3436', fontFamily: 'Lora_600SemiBold' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, paddingVertical: 60 },
  iconCircle: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 28, fontWeight: '600', color: '#2D3436', textAlign: 'center', marginBottom: 16, fontFamily: 'Lora_600SemiBold' },
  subtitle: { fontSize: 17, color: '#636E72', textAlign: 'center', lineHeight: 26, fontFamily: 'Nunito_400Regular' },
  footer: { paddingHorizontal: 20, paddingBottom: 32, alignItems: 'center' },
  dots: { flexDirection: 'row', marginBottom: 24, gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D8F3DC' },
  dotActive: { backgroundColor: '#2D6A4F', width: 24 },
  nextBtn: { backgroundColor: '#2D6A4F', borderRadius: 999, height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', paddingHorizontal: 32 },
  nextBtnDisabled: { opacity: 0.6 },
  nextBtnText: { color: '#FFF', fontSize: 17, fontWeight: '600', fontFamily: 'Nunito_600SemiBold' },
  skipBtn: { marginTop: 16, padding: 8 },
  skipText: { color: '#636E72', fontSize: 15, fontFamily: 'Nunito_400Regular' },
});
