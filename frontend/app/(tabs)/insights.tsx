import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { api } from '../../src/api';

export default function InsightsScreen() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const d = await api.getDashboard();
      setDashboard(d);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }

  async function loadInsights() {
    setAiLoading(true);
    try {
      const i = await api.getInsights();
      setInsights(i);
    } catch (e) { console.error(e); }
    finally { setAiLoading(false); }
  }

  if (loading) {
    return <SafeAreaView style={styles.container}><View style={styles.center}><ActivityIndicator size="large" color="#2D6A4F" /></View></SafeAreaView>;
  }

  const categories = dashboard?.category_breakdown || {};

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor="#2D6A4F" />}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.title}>Insights</Text>
        <Text style={styles.subtitle}>Your relationship patterns</Text>

        {/* Score Overview */}
        <View style={styles.scoreGrid}>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreNum}>{Math.round(dashboard?.overall_score || 0)}%</Text>
            <Text style={styles.scoreBoxLabel}>Overall Score</Text>
          </View>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreNum}>{dashboard?.weekly_interactions || 0}</Text>
            <Text style={styles.scoreBoxLabel}>Weekly</Text>
          </View>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreNum}>{dashboard?.monthly_interactions || 0}</Text>
            <Text style={styles.scoreBoxLabel}>Monthly</Text>
          </View>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreNum}>{dashboard?.total_contacts || 0}</Text>
            <Text style={styles.scoreBoxLabel}>People</Text>
          </View>
        </View>

        {/* Category Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Relationship Categories</Text>
          {Object.entries(categories).map(([tag, count]) => (
            <View key={tag} style={styles.catRow}>
              <View style={[styles.catDot, { backgroundColor: getCatColor(tag) }]} />
              <Text style={styles.catLabel}>{tag}</Text>
              <View style={styles.catBar}>
                <View style={[styles.catFill, { width: `${((count as number) / (dashboard?.total_contacts || 1)) * 100}%`, backgroundColor: getCatColor(tag) }]} />
              </View>
              <Text style={styles.catCount}>{count as number}</Text>
            </View>
          ))}
        </View>

        {/* AI Insights */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>AI Relationship Insights</Text>
            <TouchableOpacity testID="generate-insights-btn" onPress={loadInsights} disabled={aiLoading} style={styles.aiBtn}>
              {aiLoading ? <ActivityIndicator size="small" color="#2D6A4F" /> : <Feather name="zap" size={16} color="#2D6A4F" />}
              <Text style={styles.aiBtnText}>{aiLoading ? 'Analyzing...' : 'Generate'}</Text>
            </TouchableOpacity>
          </View>

          {insights ? (
            <View style={styles.insightCard}>
              {insights.overall_insight && (
                <View style={styles.insightBlock}>
                  <Feather name="eye" size={18} color="#2D6A4F" />
                  <Text style={styles.insightText}>{insights.overall_insight}</Text>
                </View>
              )}
              {insights.drift_alerts?.length > 0 && (
                <View style={styles.insightBlock}>
                  <Feather name="alert-circle" size={18} color="#F4A261" />
                  <View>
                    <Text style={styles.insightLabel}>Drift Alerts</Text>
                    {insights.drift_alerts.map((a: any, i: number) => (
                      <Text key={i} style={styles.insightText}>• {a.contact_name}: {a.message}</Text>
                    ))}
                  </View>
                </View>
              )}
              {insights.suggestions?.length > 0 && (
                <View style={styles.insightBlock}>
                  <Feather name="compass" size={18} color="#457B9D" />
                  <View>
                    <Text style={styles.insightLabel}>Suggestions</Text>
                    {insights.suggestions.map((s: string, i: number) => (
                      <Text key={i} style={styles.insightText}>• {s}</Text>
                    ))}
                  </View>
                </View>
              )}
              {insights.encouragement && (
                <View style={[styles.insightBlock, styles.encourageBlock]}>
                  <Feather name="heart" size={18} color="#E76F51" />
                  <Text style={styles.encourageText}>{insights.encouragement}</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.emptyInsight}>
              <Feather name="zap" size={32} color="#D8F3DC" />
              <Text style={styles.emptyInsightText}>Tap "Generate" to get AI-powered relationship insights</Text>
            </View>
          )}
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function getCatColor(tag: string) {
  const colors: Record<string, string> = { Family: '#E76F51', Friend: '#40916C', Mentor: '#457B9D', Partner: '#E9C46A', Colleague: '#A8DADC', Other: '#B2BEC3' };
  return colors[tag] || '#B2BEC3';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F7F2' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  title: { fontSize: 28, fontWeight: '600', color: '#2D3436', fontFamily: 'Lora_600SemiBold' },
  subtitle: { fontSize: 15, color: '#636E72', marginTop: 4, marginBottom: 20, fontFamily: 'Nunito_400Regular' },
  scoreGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  scoreBox: { width: '47%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  scoreNum: { fontSize: 28, fontWeight: '700', color: '#2D6A4F' },
  scoreBoxLabel: { fontSize: 13, color: '#636E72', marginTop: 4, fontFamily: 'Nunito_400Regular' },
  section: { marginTop: 28 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#2D3436', fontFamily: 'Nunito_600SemiBold' },
  catRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  catDot: { width: 10, height: 10, borderRadius: 5 },
  catLabel: { width: 80, fontSize: 14, color: '#2D3436', fontWeight: '500' },
  catBar: { flex: 1, height: 8, backgroundColor: '#F0EBE3', borderRadius: 4, overflow: 'hidden' },
  catFill: { height: '100%', borderRadius: 4 },
  catCount: { width: 24, fontSize: 14, fontWeight: '600', color: '#636E72', textAlign: 'right' },
  aiBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#D8F3DC', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  aiBtnText: { fontSize: 13, fontWeight: '600', color: '#2D6A4F' },
  insightCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, gap: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  insightBlock: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  insightLabel: { fontSize: 14, fontWeight: '600', color: '#2D3436', marginBottom: 4 },
  insightText: { fontSize: 14, color: '#636E72', lineHeight: 21, flex: 1 },
  encourageBlock: { backgroundColor: '#FFF5F3', padding: 14, borderRadius: 12 },
  encourageText: { fontSize: 14, color: '#E76F51', lineHeight: 21, flex: 1, fontStyle: 'italic' },
  emptyInsight: { alignItems: 'center', paddingVertical: 32, backgroundColor: '#FFFFFF', borderRadius: 16, gap: 12 },
  emptyInsightText: { fontSize: 14, color: '#B2BEC3', textAlign: 'center' },
});
