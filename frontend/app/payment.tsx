import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { api } from '../src/api';

export default function PaymentScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [s, sub] = await Promise.all([api.getPremiumStatus(), api.getSubscription()]);
      setStatus(s);
      setSubscription(sub);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleSubscribe() {
    if (!selectedPlan) return;
    setProcessing(true);
    try {
      // 1. Create order on backend
      const order = await api.createOrder(selectedPlan);

      if (order.test_mode) {
        // Test mode - simulate payment flow
        Alert.alert(
          'Razorpay Test Mode',
          `This is a test payment for ${order.plan_name} (₹${order.amount / 100}/mo).\n\nIn production, the Razorpay checkout sheet will open here.\n\nSimulating successful payment...`,
          [{
            text: 'Simulate Payment',
            onPress: async () => {
              try {
                const verification = await api.verifyPayment({
                  razorpay_order_id: order.order_id,
                  razorpay_payment_id: `pay_test_${Date.now()}`,
                  razorpay_signature: 'test_signature',
                  plan_id: selectedPlan,
                });
                Alert.alert('Subscription Active!', verification.message, [
                  { text: 'OK', onPress: () => router.back() }
                ]);
              } catch (e) {
                Alert.alert('Error', 'Payment verification failed');
              }
            }
          }, { text: 'Cancel', style: 'cancel' }]
        );
      } else {
        // Production mode - open Razorpay checkout
        try {
          const RazorpayCheckout = require('react-native-razorpay').default;
          const options = {
            description: `Touch ${order.plan_name} Subscription`,
            image: 'https://your-cdn.com/touch-icon.png',
            currency: order.currency,
            key: order.razorpay_key_id,
            amount: order.amount,
            name: 'Touch',
            order_id: order.order_id,
            prefill: { email: '', contact: '' },
            theme: { color: '#2D6A4F' },
          };

          const paymentData = await RazorpayCheckout.open(options);

          // Verify payment
          const verification = await api.verifyPayment({
            razorpay_order_id: order.order_id,
            razorpay_payment_id: paymentData.razorpay_payment_id,
            razorpay_signature: paymentData.razorpay_signature,
            plan_id: selectedPlan,
          });

          Alert.alert('Subscription Active!', verification.message, [
            { text: 'OK', onPress: () => router.back() }
          ]);
        } catch (e: any) {
          if (e?.code !== 'PAYMENT_CANCELLED') {
            Alert.alert('Payment Failed', e?.description || 'Something went wrong');
          }
        }
      }
    } catch (e) {
      Alert.alert('Error', 'Could not create payment order');
    } finally {
      setProcessing(false);
    }
  }

  async function handleCancel() {
    Alert.alert('Cancel Subscription', 'Are you sure you want to cancel? You\'ll lose access to premium features at the end of your billing period.', [
      { text: 'Keep Plan', style: 'cancel' },
      { text: 'Cancel Subscription', style: 'destructive', onPress: async () => {
        try {
          await api.cancelSubscription();
          Alert.alert('Cancelled', 'Your subscription has been cancelled.');
          await loadData();
        } catch (e) { Alert.alert('Error', 'Could not cancel subscription'); }
      }},
    ]);
  }

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.center}><ActivityIndicator size="large" color="#2D6A4F" /></View></SafeAreaView>;

  const plans = (status?.plans || []).filter((p: any) => p.id !== 'free');
  const currentTier = status?.tier || 'free';
  const isSubscribed = subscription?.active && currentTier !== 'free';

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
          <View>
            <Text style={styles.currentLabel}>Current Plan</Text>
            <View style={styles.currentBadge}>
              <Feather name={currentTier === 'free' ? 'user' : 'award'} size={16} color={currentTier === 'free' ? '#636E72' : '#E9C46A'} />
              <Text style={styles.currentName}>{currentTier === 'free' ? 'Free' : currentTier === 'plus' ? 'Plus' : 'Premium'}</Text>
            </View>
          </View>
          {isSubscribed && (
            <TouchableOpacity testID="cancel-sub-btn" onPress={handleCancel} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Active Subscription Info */}
        {isSubscribed && subscription && (
          <View style={styles.subInfoCard}>
            <View style={styles.subInfoRow}>
              <Feather name="check-circle" size={16} color="#40916C" />
              <Text style={styles.subInfoText}>Active since {new Date(subscription.started_at).toLocaleDateString()}</Text>
            </View>
            {subscription.expires_at && (
              <View style={styles.subInfoRow}>
                <Feather name="calendar" size={16} color="#636E72" />
                <Text style={styles.subInfoText}>Renews {new Date(subscription.expires_at).toLocaleDateString()}</Text>
              </View>
            )}
          </View>
        )}

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

        {/* Powered by Razorpay */}
        {selectedPlan && (
          <View style={styles.gatewayInfo}>
            <View style={styles.gatewayRow}>
              <Feather name="shield" size={16} color="#457B9D" />
              <Text style={styles.gatewayText}>Secured by Razorpay</Text>
            </View>
            <Text style={styles.gatewayMethods}>UPI · Credit/Debit Cards · Net Banking · Wallets</Text>
          </View>
        )}

        {/* Subscribe Button */}
        {selectedPlan && !isSubscribed && (
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
                  Subscribe to {selectedPlan === 'plus' ? 'Plus' : 'Premium'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Security & Legal */}
        <View style={styles.securityNote}>
          <Feather name="shield" size={16} color="#95D5B2" />
          <Text style={styles.securityText}>Your payment info is never stored on our servers. All transactions processed securely via Razorpay.</Text>
        </View>

        <View style={styles.legalSection}>
          <Text style={styles.legalTitle}>Subscription Terms</Text>
          <Text style={styles.legalText}>• Subscriptions auto-renew monthly unless cancelled</Text>
          <Text style={styles.legalText}>• Cancel anytime — no cancellation fees</Text>
          <Text style={styles.legalText}>• Refunds per applicable consumer protection laws</Text>
          <Text style={styles.legalText}>• Your data remains private regardless of plan</Text>
          <Text style={styles.legalText}>• Prices inclusive of applicable taxes</Text>
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
  currentLabel: { fontSize: 13, color: '#636E72', marginBottom: 4 },
  currentBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  currentName: { fontSize: 18, fontWeight: '700', color: '#2D3436' },
  cancelBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E76F51' },
  cancelText: { fontSize: 13, fontWeight: '600', color: '#E76F51' },
  subInfoCard: { backgroundColor: '#D8F3DC30', borderRadius: 14, padding: 14, marginBottom: 20, gap: 8 },
  subInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  subInfoText: { fontSize: 14, color: '#2D3436' },
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
  gatewayInfo: { backgroundColor: '#FFF', borderRadius: 14, padding: 16, marginTop: 8, gap: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  gatewayRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  gatewayText: { fontSize: 15, fontWeight: '600', color: '#2D3436' },
  gatewayMethods: { fontSize: 13, color: '#636E72' },
  subscribeBtn: { backgroundColor: '#2D6A4F', borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, marginTop: 20, shadowColor: '#2D6A4F', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 4 },
  subscribeBtnDisabled: { opacity: 0.6 },
  subscribeBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  securityNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#D8F3DC30', borderRadius: 12, padding: 14, marginTop: 20 },
  securityText: { fontSize: 13, color: '#636E72', lineHeight: 20, flex: 1 },
  legalSection: { marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.04)' },
  legalTitle: { fontSize: 14, fontWeight: '600', color: '#636E72', marginBottom: 10 },
  legalText: { fontSize: 13, color: '#B2BEC3', lineHeight: 22 },
});
