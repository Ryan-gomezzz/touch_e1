import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { api } from '../../src/api';
import { getInitials, getHealthColor, getTimeSince, TAG_COLORS } from '../../src/theme';

export default function ContactDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [contact, setContact] = useState<any>(null);
  const [interactions, setInteractions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => { loadData(); }, [id]));

  async function loadData() {
    try {
      const [c, ints] = await Promise.all([api.getContact(id!), api.getInteractions(id!)]);
      setContact(c);
      setInteractions(ints);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function togglePin() {
    try {
      const updated = await api.updateContact(id!, { is_pinned: !contact.is_pinned });
      setContact(updated);
    } catch (e) { console.error(e); }
  }

  async function handleDelete() {
    Alert.alert('Remove Contact', `Remove ${contact?.name} from Touch?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try { await api.deleteContact(id!); router.back(); } catch (e) { console.error(e); }
      }},
    ]);
  }

  if (loading || !contact) {
    return <SafeAreaView style={styles.container}><View style={styles.center}><ActivityIndicator size="large" color="#2D6A4F" /></View></SafeAreaView>;
  }

  const size = 120;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (contact.connection_health / 100) * circumference;
  const healthColor = getHealthColor(contact.connection_health);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity testID="contact-back-btn" onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="#2D3436" />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity testID="contact-pin-btn" onPress={togglePin} style={styles.headerIcon}>
            <Feather name="star" size={20} color={contact.is_pinned ? '#E9C46A' : '#B2BEC3'} />
          </TouchableOpacity>
          <TouchableOpacity testID="contact-edit-btn" onPress={() => router.push(`/contact/edit/${id}`)} style={styles.headerIcon}>
            <Feather name="edit-2" size={20} color="#636E72" />
          </TouchableOpacity>
          <TouchableOpacity testID="contact-delete-btn" onPress={handleDelete} style={styles.headerIcon}>
            <Feather name="trash-2" size={20} color="#E76F51" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Profile */}
        <View style={styles.profile}>
          <View style={{ width: size, height: size }}>
            <Svg width={size} height={size}>
              <Circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(0,0,0,0.06)" strokeWidth={strokeWidth} fill="none" />
              <Circle cx={size / 2} cy={size / 2} r={radius} stroke={healthColor} strokeWidth={strokeWidth} fill="none" strokeDasharray={`${progress} ${circumference - progress}`} strokeDashoffset={circumference * 0.25} strokeLinecap="round" rotation="-90" origin={`${size / 2}, ${size / 2}`} />
            </Svg>
            <View style={[styles.profileAvatar, { backgroundColor: contact.avatar_color }]}>
              <Text style={styles.profileInitials}>{getInitials(contact.name)}</Text>
            </View>
          </View>
          <Text style={styles.profileName}>{contact.name}</Text>
          <View style={styles.tagBadge}>
            <View style={[styles.tagDot, { backgroundColor: TAG_COLORS[contact.relationship_tag] || '#B2BEC3' }]} />
            <Text style={styles.tagText}>{contact.relationship_tag}</Text>
          </View>
          <Text style={styles.healthLabel}>{Math.round(contact.connection_health)}% connection health</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{contact.interaction_count}</Text>
            <Text style={styles.statLabel}>Interactions</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{contact.frequency_days}d</Text>
            <Text style={styles.statLabel}>Frequency</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{getTimeSince(contact.last_interaction_at)}</Text>
            <Text style={styles.statLabel}>Last Touch</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity testID="log-interaction-btn" style={styles.actionBtn} onPress={() => router.push({ pathname: '/interaction/log', params: { contactId: id, contactName: contact.name } })}>
            <View style={[styles.actionIcon, { backgroundColor: '#D8F3DC' }]}>
              <Feather name="edit-3" size={18} color="#2D6A4F" />
            </View>
            <Text style={styles.actionText}>Log</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="call-prep-btn" style={styles.actionBtn} onPress={() => router.push(`/callprep/${id}`)}>
            <View style={[styles.actionIcon, { backgroundColor: '#A8DADC40' }]}>
              <Feather name="phone" size={18} color="#457B9D" />
            </View>
            <Text style={styles.actionText}>Call Prep</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="view-calendar-btn" style={styles.actionBtn} onPress={loadCalendarSuggestions}>
            <View style={[styles.actionIcon, { backgroundColor: '#E9C46A30' }]}>
              <Feather name="calendar" size={18} color="#E9C46A" />
            </View>
            <Text style={styles.actionText}>Schedule</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="view-prompts-btn" style={styles.actionBtn} onPress={() => router.push(`/callprep/${id}`)}>
            <View style={[styles.actionIcon, { backgroundColor: '#F0EBE340' }]}>
              <Feather name="message-circle" size={18} color="#636E72" />
            </View>
            <Text style={styles.actionText}>Prompts</Text>
          </TouchableOpacity>
        </View>

        {/* Calendar Suggestions */}
        {calendarLoading && (
          <View style={styles.section}>
            <View style={styles.calendarLoading}>
              <ActivityIndicator size="small" color="#2D6A4F" />
              <Text style={styles.calendarLoadingText}>Finding best times...</Text>
            </View>
          </View>
        )}
        {calendarData && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Best Times to Connect</Text>
            <View style={styles.calendarCard}>
              {calendarData.suggested_times?.map((t: any, i: number) => (
                <View key={i} style={styles.calendarSlot}>
                  <View style={styles.calendarSlotIcon}>
                    <Feather name="clock" size={14} color="#2D6A4F" />
                  </View>
                  <View style={styles.calendarSlotInfo}>
                    <Text style={styles.calendarSlotDay}>{t.day} at {t.time}</Text>
                    <Text style={styles.calendarSlotReason}>{t.reason}</Text>
                  </View>
                </View>
              ))}
              {calendarData.availability_tip && (
                <View style={styles.calendarTip}>
                  <Feather name="info" size={14} color="#457B9D" />
                  <Text style={styles.calendarTipText}>{calendarData.availability_tip}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Memory Bank */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Memory Bank</Text>
          {interactions.length === 0 ? (
            <View style={styles.emptyMemory}>
              <Feather name="book-open" size={32} color="#D8F3DC" />
              <Text style={styles.emptyText}>No interactions yet</Text>
              <Text style={styles.emptySubtext}>Log your first conversation to build memory</Text>
            </View>
          ) : (
            interactions.map((inter) => (
              <View key={inter.id} style={styles.memoryCard}>
                <View style={styles.memoryHeader}>
                  <View style={[styles.typeIcon, { backgroundColor: getTypeColor(inter.interaction_type) + '20' }]}>
                    <Feather name={getTypeIcon(inter.interaction_type) as any} size={14} color={getTypeColor(inter.interaction_type)} />
                  </View>
                  <Text style={styles.memoryDate}>{formatDate(inter.created_at)}</Text>
                  {inter.duration_minutes && <Text style={styles.memoryDuration}>{inter.duration_minutes}m</Text>}
                </View>
                {inter.notes && <Text style={styles.memoryNotes}>{inter.notes}</Text>}
                {inter.ai_summary && (
                  <View style={styles.aiSummary}>
                    <Feather name="zap" size={12} color="#2D6A4F" />
                    <Text style={styles.aiSummaryText}>{inter.ai_summary}</Text>
                  </View>
                )}
                {inter.key_highlights?.length > 0 && (
                  <View style={styles.highlights}>
                    {inter.key_highlights.map((h: string, i: number) => (
                      <Text key={i} style={styles.highlightText}>• {h}</Text>
                    ))}
                  </View>
                )}
                {inter.emotional_cues?.length > 0 && (
                  <View style={styles.cuesRow}>
                    {inter.emotional_cues.map((c: string, i: number) => (
                      <View key={i} style={styles.cueBadge}>
                        <Text style={styles.cueText}>{c}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))
          )}
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function getTypeIcon(type: string) {
  if (type === 'call') return 'phone';
  if (type === 'text') return 'message-square';
  if (type === 'voice') return 'mic';
  return 'edit-3';
}

function getTypeColor(type: string) {
  if (type === 'call') return '#457B9D';
  if (type === 'text') return '#40916C';
  if (type === 'voice') return '#E9C46A';
  return '#636E72';
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F7F2' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F0EBE3', justifyContent: 'center', alignItems: 'center' },
  content: { paddingBottom: 20 },
  profile: { alignItems: 'center', paddingTop: 16 },
  profileAvatar: { position: 'absolute', top: 14, left: 14, width: 92, height: 92, borderRadius: 46, justifyContent: 'center', alignItems: 'center' },
  profileInitials: { fontSize: 32, fontWeight: '700', color: '#FFF' },
  profileName: { fontSize: 26, fontWeight: '600', color: '#2D3436', marginTop: 12, fontFamily: 'Lora_600SemiBold' },
  tagBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, paddingHorizontal: 12, paddingVertical: 4, backgroundColor: '#F0EBE3', borderRadius: 12 },
  tagDot: { width: 8, height: 8, borderRadius: 4 },
  tagText: { fontSize: 13, color: '#636E72', fontWeight: '500' },
  healthLabel: { fontSize: 14, color: '#636E72', marginTop: 8, fontFamily: 'Nunito_400Regular' },
  statsRow: { flexDirection: 'row', marginHorizontal: 20, marginTop: 24, gap: 10 },
  statBox: { flex: 1, backgroundColor: '#FFF', borderRadius: 14, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  statNum: { fontSize: 18, fontWeight: '700', color: '#2D3436' },
  statLabel: { fontSize: 12, color: '#B2BEC3', marginTop: 4 },
  actionsRow: { flexDirection: 'row', marginHorizontal: 20, marginTop: 20, gap: 10 },
  actionBtn: { flex: 1, alignItems: 'center', gap: 6 },
  actionIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  actionText: { fontSize: 12, fontWeight: '600', color: '#636E72' },
  section: { marginTop: 28, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#2D3436', marginBottom: 14, fontFamily: 'Nunito_600SemiBold' },
  emptyMemory: { alignItems: 'center', paddingVertical: 32, backgroundColor: '#FFF', borderRadius: 16, gap: 8 },
  emptyText: { fontSize: 16, color: '#636E72', fontWeight: '600' },
  emptySubtext: { fontSize: 14, color: '#B2BEC3' },
  memoryCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  memoryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  typeIcon: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  memoryDate: { fontSize: 13, color: '#636E72', flex: 1 },
  memoryDuration: { fontSize: 12, color: '#B2BEC3' },
  memoryNotes: { fontSize: 15, color: '#2D3436', lineHeight: 22, marginBottom: 8 },
  aiSummary: { flexDirection: 'row', gap: 6, backgroundColor: '#D8F3DC40', padding: 10, borderRadius: 10, marginBottom: 8 },
  aiSummaryText: { fontSize: 13, color: '#2D6A4F', flex: 1, lineHeight: 19 },
  highlights: { marginBottom: 8 },
  highlightText: { fontSize: 13, color: '#636E72', lineHeight: 20 },
  cuesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  cueBadge: { backgroundColor: '#F0EBE3', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  cueText: { fontSize: 12, color: '#636E72' },
});
