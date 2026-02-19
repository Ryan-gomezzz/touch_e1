import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import ConnectionRing from '../../src/components/ConnectionRing';
import { api } from '../../src/api';
import { getTimeSince, getHealthColor, TAG_COLORS } from '../../src/theme';

export default function HomeScreen() {
  const router = useRouter();
  const [contacts, setContacts] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
    try {
      const [c, d] = await Promise.all([api.getContacts(), api.getDashboard()]);
      setContacts(c);
      setDashboard(d);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const pinnedContacts = contacts.filter(c => c.is_pinned);
  const needsAttention = dashboard?.needs_attention || [];
  const suggested = dashboard?.suggested_contact;
  const greeting = getGreeting();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2D6A4F" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor="#2D6A4F" />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.headerSubtitle}>Stay present with your people</Text>
          </View>
          <TouchableOpacity testID="add-contact-btn" onPress={() => router.push('/contact/add')} style={styles.addBtn}>
            <Feather name="plus" size={22} color="#2D6A4F" />
          </TouchableOpacity>
        </View>

        {/* Overall Score */}
        {dashboard && (
          <View style={styles.scoreCard}>
            <View style={styles.scoreRow}>
              <View style={styles.scoreMain}>
                <Text style={styles.scoreValue}>{Math.round(dashboard.overall_score)}%</Text>
                <Text style={styles.scoreLabel}>Connection Score</Text>
              </View>
              <View style={styles.scoreStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{dashboard.total_contacts}</Text>
                  <Text style={styles.statLabel}>People</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{dashboard.weekly_interactions}</Text>
                  <Text style={styles.statLabel}>This Week</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Inner Circle */}
        {pinnedContacts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Inner Circle</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ringRow}>
              {pinnedContacts.map(c => (
                <ConnectionRing
                  key={c.id}
                  name={c.name}
                  health={c.connection_health}
                  avatarColor={c.avatar_color}
                  tag={c.relationship_tag}
                  onPress={() => router.push(`/contact/${c.id}`)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Suggested Contact */}
        {suggested && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reach Out Today</Text>
            <TouchableOpacity
              testID="suggested-contact-card"
              style={styles.suggestedCard}
              onPress={() => router.push(`/contact/${suggested.id}`)}
              activeOpacity={0.7}
            >
              <View style={[styles.suggestedAvatar, { backgroundColor: getHealthColor(suggested.health) + '30' }]}>
                <Feather name="phone" size={24} color={getHealthColor(suggested.health)} />
              </View>
              <View style={styles.suggestedInfo}>
                <Text style={styles.suggestedName}>{suggested.name}</Text>
                <Text style={styles.suggestedTag}>{suggested.relationship_tag} · {Math.round(suggested.health)}% connection</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#B2BEC3" />
            </TouchableOpacity>
          </View>
        )}

        {/* Needs Attention */}
        {needsAttention.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Needs Attention</Text>
            {needsAttention.map((c: any) => (
              <TouchableOpacity
                key={c.id}
                testID={`attention-card-${c.name.toLowerCase()}`}
                style={styles.attentionCard}
                onPress={() => router.push(`/contact/${c.id}`)}
                activeOpacity={0.7}
              >
                <View style={[styles.healthDot, { backgroundColor: getHealthColor(c.health) }]} />
                <View style={styles.attentionInfo}>
                  <Text style={styles.attentionName}>{c.name}</Text>
                  <Text style={styles.attentionTag}>{c.relationship_tag}</Text>
                </View>
                <Text style={[styles.attentionHealth, { color: getHealthColor(c.health) }]}>{Math.round(c.health)}%</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity testID="quick-log-btn" style={styles.actionCard} onPress={() => router.push('/interaction/log')}>
              <View style={[styles.actionIcon, { backgroundColor: '#D8F3DC' }]}>
                <Feather name="edit-3" size={20} color="#2D6A4F" />
              </View>
              <Text style={styles.actionText}>Log Touch</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="quick-reminders-btn" style={styles.actionCard} onPress={() => router.push('/reminders')}>
              <View style={[styles.actionIcon, { backgroundColor: '#FFEEE9' }]}>
                <Feather name="bell" size={20} color="#E76F51" />
              </View>
              <Text style={styles.actionText}>Reminders</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="quick-insights-btn" style={styles.actionCard} onPress={() => router.push('/(tabs)/insights')}>
              <View style={[styles.actionIcon, { backgroundColor: '#E9C46A30' }]}>
                <Feather name="trending-up" size={20} color="#E9C46A" />
              </View>
              <Text style={styles.actionText}>Insights</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* More Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>More</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity testID="quick-goals-btn" style={styles.actionCard} onPress={() => router.push('/goals')}>
              <View style={[styles.actionIcon, { backgroundColor: '#A8DADC40' }]}>
                <Feather name="target" size={20} color="#457B9D" />
              </View>
              <Text style={styles.actionText}>Goals</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="quick-shared-btn" style={styles.actionCard} onPress={() => router.push('/shared')}>
              <View style={[styles.actionIcon, { backgroundColor: '#E9C46A20' }]}>
                <Feather name="users" size={20} color="#E9C46A" />
              </View>
              <Text style={styles.actionText}>Shared</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="quick-widget-btn" style={styles.actionCard} onPress={() => router.push('/widget')}>
              <View style={[styles.actionIcon, { backgroundColor: '#F0EBE3' }]}>
                <Feather name="smartphone" size={20} color="#636E72" />
              </View>
              <Text style={styles.actionText}>Widget</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F7F2' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  greeting: { fontSize: 28, fontWeight: '600', color: '#2D3436', fontFamily: 'Lora_600SemiBold' },
  headerSubtitle: { fontSize: 15, color: '#636E72', marginTop: 4, fontFamily: 'Nunito_400Regular' },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#D8F3DC', justifyContent: 'center', alignItems: 'center' },
  scoreCard: { marginHorizontal: 20, marginTop: 16, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  scoreRow: { flexDirection: 'row', alignItems: 'center' },
  scoreMain: { flex: 1 },
  scoreValue: { fontSize: 42, fontWeight: '700', color: '#2D6A4F' },
  scoreLabel: { fontSize: 14, color: '#636E72', marginTop: 2, fontFamily: 'Nunito_400Regular' },
  scoreStats: { flexDirection: 'row', gap: 24 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '700', color: '#2D3436' },
  statLabel: { fontSize: 12, color: '#636E72', marginTop: 2, fontFamily: 'Nunito_400Regular' },
  section: { marginTop: 28, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#2D3436', marginBottom: 14, fontFamily: 'Nunito_600SemiBold' },
  ringRow: { paddingRight: 20 },
  suggestedCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  suggestedAvatar: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  suggestedInfo: { flex: 1, marginLeft: 14 },
  suggestedName: { fontSize: 17, fontWeight: '600', color: '#2D3436', fontFamily: 'Nunito_600SemiBold' },
  suggestedTag: { fontSize: 13, color: '#636E72', marginTop: 3 },
  attentionCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.04)' },
  healthDot: { width: 10, height: 10, borderRadius: 5 },
  attentionInfo: { flex: 1, marginLeft: 12 },
  attentionName: { fontSize: 16, fontWeight: '600', color: '#2D3436' },
  attentionTag: { fontSize: 13, color: '#636E72', marginTop: 2 },
  attentionHealth: { fontSize: 15, fontWeight: '700' },
  actionsRow: { flexDirection: 'row', gap: 12 },
  actionCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  actionIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionText: { fontSize: 12, fontWeight: '600', color: '#636E72', textAlign: 'center', fontFamily: 'Nunito_600SemiBold' },
});
