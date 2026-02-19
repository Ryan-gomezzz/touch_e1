import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { api } from '../src/api';
import { getInitials, getHealthColor } from '../src/theme';

export default function WidgetScreen() {
  const router = useRouter();
  const [widgetData, setWidgetData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try { const d = await api.getWidgetData(); setWidgetData(d); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.center}><ActivityIndicator size="large" color="#2D6A4F" /></View></SafeAreaView>;

  const contacts = widgetData?.pinned_contacts || [];
  const score = widgetData?.overall_score || 0;
  const suggested = widgetData?.suggested_name;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity testID="widget-back-btn" onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="#2D3436" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Home Widget</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Feather name="smartphone" size={32} color="#2D6A4F" />
          <Text style={styles.heroTitle}>Your Touch Widget</Text>
          <Text style={styles.heroSubtitle}>A beautiful glanceable widget for your home screen showing who needs a touch today.</Text>
        </View>

        {/* Widget Preview */}
        <Text style={styles.previewLabel}>Widget Preview</Text>
        <View style={styles.widgetPreview}>
          {/* Header */}
          <View style={styles.widgetHeader}>
            <View style={styles.widgetLogoRow}>
              <View style={styles.widgetLogo}><Text style={styles.widgetLogoText}>T</Text></View>
              <Text style={styles.widgetBrand}>Touch</Text>
            </View>
            <View style={styles.widgetScoreBadge}>
              <Text style={styles.widgetScoreText}>{Math.round(score)}%</Text>
            </View>
          </View>

          {/* Contact Rings */}
          <View style={styles.widgetRings}>
            {contacts.slice(0, 4).map((c: any, i: number) => {
              const ringSize = 56;
              const sw = 4;
              const r = (ringSize - sw) / 2;
              const circ = 2 * Math.PI * r;
              const prog = (c.health / 100) * circ;
              const hColor = getHealthColor(c.health);
              return (
                <View key={i} style={styles.widgetRingItem}>
                  <View style={{ width: ringSize, height: ringSize }}>
                    <Svg width={ringSize} height={ringSize}>
                      <Circle cx={ringSize / 2} cy={ringSize / 2} r={r} stroke="rgba(255,255,255,0.2)" strokeWidth={sw} fill="none" />
                      <Circle cx={ringSize / 2} cy={ringSize / 2} r={r} stroke={hColor} strokeWidth={sw} fill="none" strokeDasharray={`${prog} ${circ - prog}`} strokeDashoffset={circ * 0.25} strokeLinecap="round" rotation="-90" origin={`${ringSize / 2}, ${ringSize / 2}`} />
                    </Svg>
                    <View style={[styles.widgetAvatar, { backgroundColor: c.avatar_color }]}>
                      <Text style={styles.widgetAvatarText}>{getInitials(c.name)}</Text>
                    </View>
                  </View>
                  <Text style={styles.widgetRingName} numberOfLines={1}>{c.name}</Text>
                </View>
              );
            })}
          </View>

          {/* Suggested */}
          {suggested && (
            <View style={styles.widgetSuggested}>
              <Feather name="phone" size={14} color="#2D6A4F" />
              <Text style={styles.widgetSuggestedText}>Reach out to {suggested} today</Text>
            </View>
          )}
        </View>

        {/* Size Options */}
        <Text style={styles.sizeLabel}>Widget Sizes</Text>
        <View style={styles.sizeGrid}>
          <TouchableOpacity testID="widget-small" style={[styles.sizeCard, styles.sizeActive]}>
            <View style={styles.sizePreview}>
              <View style={styles.sizeDot} /><View style={styles.sizeDot} />
            </View>
            <Text style={styles.sizeName}>Small</Text>
            <Text style={styles.sizeDesc}>2 contacts</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="widget-medium" style={styles.sizeCard}>
            <View style={styles.sizePreview}>
              <View style={styles.sizeDot} /><View style={styles.sizeDot} />
              <View style={styles.sizeDot} /><View style={styles.sizeDot} />
            </View>
            <Text style={styles.sizeName}>Medium</Text>
            <Text style={styles.sizeDesc}>4 contacts</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="widget-large" style={styles.sizeCard}>
            <View style={styles.sizePreview}>
              <View style={styles.sizeDot} /><View style={styles.sizeDot} />
              <View style={styles.sizeDot} /><View style={styles.sizeDot} />
              <View style={styles.sizeLine} />
            </View>
            <Text style={styles.sizeName}>Large</Text>
            <Text style={styles.sizeDesc}>4 + suggestion</Text>
          </TouchableOpacity>
        </View>

        {/* Setup Instructions */}
        <View style={styles.instructionCard}>
          <Text style={styles.instructionTitle}>How to Add Widget</Text>
          <View style={styles.step}><View style={styles.stepNum}><Text style={styles.stepNumText}>1</Text></View><Text style={styles.stepText}>Long-press your home screen</Text></View>
          <View style={styles.step}><View style={styles.stepNum}><Text style={styles.stepNumText}>2</Text></View><Text style={styles.stepText}>Tap "Widgets" or "+"</Text></View>
          <View style={styles.step}><View style={styles.stepNum}><Text style={styles.stepNumText}>3</Text></View><Text style={styles.stepText}>Find "Touch" and select a size</Text></View>
          <View style={styles.step}><View style={styles.stepNum}><Text style={styles.stepNumText}>4</Text></View><Text style={styles.stepText}>Place it wherever feels right</Text></View>
        </View>

        <View style={{ height: 32 }} />
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
  content: { paddingHorizontal: 20 },
  hero: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  heroTitle: { fontSize: 24, fontWeight: '600', color: '#2D3436', fontFamily: 'Lora_600SemiBold' },
  heroSubtitle: { fontSize: 15, color: '#636E72', textAlign: 'center', lineHeight: 23, fontFamily: 'Nunito_400Regular' },
  previewLabel: { fontSize: 13, fontWeight: '600', color: '#B2BEC3', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, marginTop: 8 },
  widgetPreview: { backgroundColor: '#264653', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 8 },
  widgetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  widgetLogoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  widgetLogo: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#2D6A4F', justifyContent: 'center', alignItems: 'center' },
  widgetLogoText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  widgetBrand: { fontSize: 16, fontWeight: '600', color: '#FFF', fontFamily: 'Lora_600SemiBold' },
  widgetScoreBadge: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  widgetScoreText: { color: '#95D5B2', fontSize: 14, fontWeight: '700' },
  widgetRings: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  widgetRingItem: { alignItems: 'center' },
  widgetAvatar: { position: 'absolute', top: 8, left: 8, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  widgetAvatarText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  widgetRingName: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 6, fontWeight: '500' },
  widgetSuggested: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 10 },
  widgetSuggestedText: { color: 'rgba(255,255,255,0.8)', fontSize: 13, flex: 1 },
  sizeLabel: { fontSize: 13, fontWeight: '600', color: '#B2BEC3', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, marginTop: 28 },
  sizeGrid: { flexDirection: 'row', gap: 10 },
  sizeCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  sizeActive: { borderColor: '#2D6A4F' },
  sizePreview: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 8, justifyContent: 'center' },
  sizeDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#D8F3DC' },
  sizeLine: { width: 32, height: 4, borderRadius: 2, backgroundColor: '#D8F3DC' },
  sizeName: { fontSize: 14, fontWeight: '600', color: '#2D3436' },
  sizeDesc: { fontSize: 12, color: '#B2BEC3', marginTop: 2 },
  instructionCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginTop: 24, gap: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  instructionTitle: { fontSize: 16, fontWeight: '600', color: '#2D3436', fontFamily: 'Nunito_600SemiBold' },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#D8F3DC', justifyContent: 'center', alignItems: 'center' },
  stepNumText: { fontSize: 13, fontWeight: '700', color: '#2D6A4F' },
  stepText: { fontSize: 15, color: '#636E72', flex: 1 },
});
