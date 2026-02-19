import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { api } from '../src/api';

export default function PremiumScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState('');

  useEffect(() => { loadStatus(); }, []);

  async function loadStatus() {
    try { const s = await api.getPremiumStatus(); setStatus(s); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleUpgrade(tier: string) {
    setUpgrading(tier);
    try {
      await api.upgradePremium(tier);
      await loadStatus();
    } catch (e) { console.error(e); }
    finally { setUpgrading(''); }
  }

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.center}><ActivityIndicator size="large" color="#2D6A4F" /></View></SafeAreaView>;

  const plans = status?.plans || [];
  const currentTier = status?.tier || 'free';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity testID="premium-back-btn" onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="#2D3436" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Touch Premium</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Feather name="award" size={32} color="#E9C46A" />
          </View>
          <Text style={styles.heroTitle}>Unlock the full power of Touch</Text>
          <Text style={styles.heroSubtitle}>Deepen your relationships with AI-powered insights, voice recording, and more</Text>
        </View>

        {/* Usage */}
        <View style={styles.usageCard}>
          <View style={styles.usageRow}>
            <Text style={styles.usageLabel}>Contacts Used</Text>
            <Text style={styles.usageValue}>{status?.contacts_used || 0} / {status?.contact_limit || 5}</Text>
          </View>
          <View style={styles.usageBarBg}>
            <View style={[styles.usageBarFill, { width: `${Math.min(100, ((status?.contacts_used || 0) / (status?.contact_limit || 5)) * 100)}%` }]} />
          </View>
          {currentTier === 'free' && (status?.contacts_used || 0) >= 4 && (
            <Text style={styles.usageWarning}>You're approaching your free limit</Text>
          )}
        </View>

        {/* Plans */}
        {plans.map((plan: any) => {
          const isCurrent = plan.id === currentTier;
          const isHighlighted = plan.id === 'plus';
          return (
            <View key={plan.id} style={[styles.planCard, isHighlighted && styles.planCardHighlighted, isCurrent && styles.planCardCurrent]}>
              {isHighlighted && <View style={styles.popularBadge}><Text style={styles.popularText}>Most Popular</Text></View>}
              <View style={styles.planHeader}>
                <View>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planPrice}>{plan.price}</Text>
                </View>
                {isCurrent && <View style={styles.currentBadge}><Text style={styles.currentText}>Current</Text></View>}
              </View>
              <View style={styles.planFeatures}>
                {plan.features.map((f: string, i: number) => (
                  <View key={i} style={styles.featureRow}>
                    <Feather name="check" size={16} color={isHighlighted ? '#2D6A4F' : '#40916C'} />
                    <Text style={styles.featureText}>{f}</Text>
                  </View>
                ))}
              </View>
              {!isCurrent && plan.id !== 'free' && (
                <TouchableOpacity
                  testID={`upgrade-${plan.id}-btn`}
                  style={[styles.upgradeBtn, isHighlighted && styles.upgradeBtnPrimary]}
                  onPress={() => handleUpgrade(plan.id)}
                  disabled={upgrading === plan.id}
                >
                  {upgrading === plan.id ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={[styles.upgradeBtnText, isHighlighted && styles.upgradeBtnTextPrimary]}>
                      Upgrade to {plan.name}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        <Text style={styles.disclaimer}>Cancel anytime. No hidden fees. Your data stays private regardless of plan.</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F7F2' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#2D3436', fontFamily: 'Nunito_600SemiBold' },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  hero: { alignItems: 'center', paddingVertical: 24 },
  heroIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#E9C46A20', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  heroTitle: { fontSize: 24, fontWeight: '600', color: '#2D3436', textAlign: 'center', fontFamily: 'Lora_600SemiBold' },
  heroSubtitle: { fontSize: 15, color: '#636E72', textAlign: 'center', marginTop: 8, lineHeight: 23, fontFamily: 'Nunito_400Regular' },
  usageCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 18, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  usageRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  usageLabel: { fontSize: 14, color: '#636E72' },
  usageValue: { fontSize: 14, fontWeight: '600', color: '#2D3436' },
  usageBarBg: { height: 8, backgroundColor: '#F0EBE3', borderRadius: 4, overflow: 'hidden' },
  usageBarFill: { height: '100%', backgroundColor: '#2D6A4F', borderRadius: 4 },
  usageWarning: { fontSize: 13, color: '#F4A261', marginTop: 8 },
  planCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 2, borderColor: 'transparent', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  planCardHighlighted: { borderColor: '#2D6A4F' },
  planCardCurrent: { borderColor: '#95D5B2' },
  popularBadge: { position: 'absolute', top: -10, right: 16, backgroundColor: '#2D6A4F', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 4 },
  popularText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  planName: { fontSize: 20, fontWeight: '700', color: '#2D3436' },
  planPrice: { fontSize: 16, color: '#636E72', marginTop: 4 },
  currentBadge: { backgroundColor: '#D8F3DC', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  currentText: { fontSize: 12, fontWeight: '600', color: '#2D6A4F' },
  planFeatures: { gap: 10, marginBottom: 16 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureText: { fontSize: 14, color: '#2D3436', flex: 1 },
  upgradeBtn: { backgroundColor: '#F0EBE3', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  upgradeBtnPrimary: { backgroundColor: '#2D6A4F' },
  upgradeBtnText: { fontSize: 15, fontWeight: '600', color: '#2D3436' },
  upgradeBtnTextPrimary: { color: '#FFF' },
  disclaimer: { textAlign: 'center', fontSize: 13, color: '#B2BEC3', marginTop: 8, lineHeight: 20 },
});
