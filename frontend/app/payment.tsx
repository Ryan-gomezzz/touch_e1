import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { api } from '../src/api';

export default function PaymentScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [gateway, setGateway] = useState<'stripe' | 'razorpay'>('stripe');
  const [processing, setProcessing] = useState(false);

  useEffect(() => { loadStatus(); }, []);

  async function loadStatus() {
    try { const s = await api.getPremiumStatus(); setStatus(s); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleSubscribe() {
    if (!selectedPlan) return;
    setProcessing(true);
    // Payment gateway integration placeholder - will be connected when gateway is chosen
    setTimeout(async () => {
      try {
        await api.upgradePremium(selectedPlan);
        Alert.alert('Subscription Active', `You're now on the ${selectedPlan === 'plus' ? 'Plus' : 'Premium'} plan!`, [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } catch (e) { Alert.alert('Error', 'Subscription update failed'); }
      finally { setProcessing(false); }
    }, 1500);
  }

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.center}><ActivityIndicator size="large" color="#2D6A4F" /></View></SafeAreaView>;

  const plans = (status?.plans || []).filter((p: any) => p.id !== 'free');
  const currentTier = status?.tier || 'free';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity testID="payment-back-btn" onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="#2D3436" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscribe</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Plan */}
        <View style={styles.currentPlan}>
          <Text style={styles.currentLabel}>Current Plan</Text>
          <View style={styles.currentBadge}>
            <Feather name={currentTier === 'free' ? 'user' : 'award'} size={16} color={currentTier === 'free' ? '#636E72' : '#E9C46A'} />
            <Text style={styles.currentName}>{currentTier === 'free' ? 'Free' : currentTier === 'plus' ? 'Plus' : 'Premium'}</Text>
          </View>
        </View>

        {/* Plan Selection */}
        <Text style={styles.sectionTitle}>Choose Your Plan</Text>
        {plans.map((plan: any) => {
          const isSelected = selectedPlan === plan.id;
          const isCurrent = currentTier === plan.id;
          return (
            <TouchableOpacity
              key={plan.id}
              testID={`plan-${plan.id}`}
              style={[styles.planCard, isSelected && styles.planCardSelected, isCurrent && styles.planCardCurrent]}
              onPress={() => !isCurrent && setSelectedPlan(plan.id)}
              disabled={isCurrent}
              activeOpacity={0.7}
            >
              <View style={styles.planHeader}>
                <View style={[styles.radioOuter, isSelected && styles.radioSelected]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
                <View style={styles.planInfo}>
                  <View style={styles.planNameRow}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    {plan.id === 'plus' && <View style={styles.bestValue}><Text style={styles.bestValueText}>Best Value</Text></View>}
                  </View>
                  <Text style={styles.planPrice}>{plan.price}</Text>
                </View>
                {isCurrent && <View style={styles.activeBadge}><Text style={styles.activeText}>Active</Text></View>}
              </View>
              <View style={styles.planFeatures}>
                {plan.features.map((f: string, i: number) => (
                  <View key={i} style={styles.featureRow}>
                    <Feather name="check" size={14} color="#2D6A4F" />
                    <Text style={styles.featureText}>{f}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Payment Gateway Selection */}
        {selectedPlan && (
          <View style={styles.gatewaySection}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            <View style={styles.gatewayRow}>
              <TouchableOpacity
                testID="gateway-stripe"
                style={[styles.gatewayCard, gateway === 'stripe' && styles.gatewayActive]}
                onPress={() => setGateway('stripe')}
              >
                <View style={styles.gatewayIcon}>
                  <Feather name="credit-card" size={24} color={gateway === 'stripe' ? '#2D6A4F' : '#636E72'} />
                </View>
                <Text style={[styles.gatewayName, gateway === 'stripe' && styles.gatewayNameActive]}>Stripe</Text>
                <Text style={styles.gatewayDesc}>Credit/Debit Card</Text>
                {gateway === 'stripe' && <View style={styles.gatewayCheck}><Feather name="check" size={14} color="#FFF" /></View>}
              </TouchableOpacity>
              <TouchableOpacity
                testID="gateway-razorpay"
                style={[styles.gatewayCard, gateway === 'razorpay' && styles.gatewayActive]}
                onPress={() => setGateway('razorpay')}
              >
                <View style={styles.gatewayIcon}>
                  <Feather name="smartphone" size={24} color={gateway === 'razorpay' ? '#2D6A4F' : '#636E72'} />
                </View>
                <Text style={[styles.gatewayName, gateway === 'razorpay' && styles.gatewayNameActive]}>Razorpay</Text>
                <Text style={styles.gatewayDesc}>UPI, Cards, Wallets</Text>
                {gateway === 'razorpay' && <View style={styles.gatewayCheck}><Feather name="check" size={14} color="#FFF" /></View>}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Subscribe Button */}
        {selectedPlan && (
          <TouchableOpacity
            testID="subscribe-btn"
            style={[styles.subscribeBtn, processing && styles.subscribeBtnDisabled]}
            onPress={handleSubscribe}
            disabled={processing}
            activeOpacity={0.8}
          >
            {processing ? (
              <><ActivityIndicator size="small" color="#FFF" /><Text style={styles.subscribeBtnText}>Processing...</Text></>
            ) : (
              <>
                <Feather name="lock" size={18} color="#FFF" />
                <Text style={styles.subscribeBtnText}>
                  Subscribe to {selectedPlan === 'plus' ? 'Plus' : 'Premium'} via {gateway === 'stripe' ? 'Stripe' : 'Razorpay'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Security Note */}
        <View style={styles.securityNote}>
          <Feather name="shield" size={16} color="#95D5B2" />
          <Text style={styles.securityText}>Payments are processed securely. Cancel anytime from your account settings. No data is shared with payment providers.</Text>
        </View>

        {/* Legal */}
        <View style={styles.legalSection}>
          <Text style={styles.legalTitle}>Subscription Terms</Text>
          <Text style={styles.legalText}>• Subscriptions auto-renew monthly unless cancelled</Text>
          <Text style={styles.legalText}>• Cancel anytime from Settings → Subscription</Text>
          <Text style={styles.legalText}>• Refunds processed per applicable consumer protection laws</Text>
          <Text style={styles.legalText}>• Your data remains private regardless of subscription status</Text>
          <Text style={styles.legalText}>• Price may vary by region (taxes applicable)</Text>
        </View>

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
  content: { paddingHorizontal: 20, paddingTop: 12 },
  currentPlan: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 14, padding: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  currentLabel: { fontSize: 14, color: '#636E72' },
  currentBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F0EBE3', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  currentName: { fontSize: 14, fontWeight: '600', color: '#2D3436' },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#B2BEC3', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  planCard: { backgroundColor: '#FFF', borderRadius: 18, padding: 18, marginBottom: 12, borderWidth: 2, borderColor: 'transparent', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  planCardSelected: { borderColor: '#2D6A4F' },
  planCardCurrent: { opacity: 0.6, borderColor: '#95D5B2' },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#D8D8D8', justifyContent: 'center', alignItems: 'center' },
  radioSelected: { borderColor: '#2D6A4F' },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#2D6A4F' },
  planInfo: { flex: 1 },
  planNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  planName: { fontSize: 18, fontWeight: '700', color: '#2D3436' },
  bestValue: { backgroundColor: '#D8F3DC', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  bestValueText: { fontSize: 11, fontWeight: '600', color: '#2D6A4F' },
  planPrice: { fontSize: 15, color: '#636E72', marginTop: 2 },
  activeBadge: { backgroundColor: '#D8F3DC', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  activeText: { fontSize: 12, fontWeight: '600', color: '#2D6A4F' },
  planFeatures: { gap: 8 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { fontSize: 14, color: '#636E72', flex: 1 },
  gatewaySection: { marginTop: 20 },
  gatewayRow: { flexDirection: 'row', gap: 12 },
  gatewayCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 16, padding: 18, alignItems: 'center', borderWidth: 2, borderColor: 'transparent', gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  gatewayActive: { borderColor: '#2D6A4F', backgroundColor: '#D8F3DC08' },
  gatewayIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F0EBE3', justifyContent: 'center', alignItems: 'center' },
  gatewayName: { fontSize: 16, fontWeight: '600', color: '#2D3436' },
  gatewayNameActive: { color: '#2D6A4F' },
  gatewayDesc: { fontSize: 12, color: '#B2BEC3' },
  gatewayCheck: { position: 'absolute', top: 10, right: 10, width: 22, height: 22, borderRadius: 11, backgroundColor: '#2D6A4F', justifyContent: 'center', alignItems: 'center' },
  subscribeBtn: { backgroundColor: '#2D6A4F', borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, marginTop: 24, shadowColor: '#2D6A4F', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 4 },
  subscribeBtnDisabled: { opacity: 0.6 },
  subscribeBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  securityNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#D8F3DC30', borderRadius: 12, padding: 14, marginTop: 20 },
  securityText: { fontSize: 13, color: '#636E72', lineHeight: 20, flex: 1 },
  legalSection: { marginTop: 24, paddingTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.04)' },
  legalTitle: { fontSize: 14, fontWeight: '600', color: '#636E72', marginBottom: 10 },
  legalText: { fontSize: 13, color: '#B2BEC3', lineHeight: 22 },
});
