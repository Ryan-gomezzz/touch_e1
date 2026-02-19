import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { api } from '../../src/api';

export default function CallPrepScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [prep, setPrep] = useState<any>(null);
  const [prompts, setPrompts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [promptsLoading, setPromptsLoading] = useState(false);

  useEffect(() => { loadPrep(); }, [id]);

  async function loadPrep() {
    try {
      const p = await api.getCallPrep(id!);
      setPrep(p);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function loadPrompts(mode: string) {
    setPromptsLoading(true);
    try {
      const p = await api.getPrompts(id!, mode);
      setPrompts(p.prompts || []);
    } catch (e) { console.error(e); }
    finally { setPromptsLoading(false); }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2D6A4F" />
          <Text style={styles.loadingText}>Preparing your call brief...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity testID="callprep-back-btn" onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="#2D3436" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Call Prep</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Contact Name */}
        <View style={styles.nameCard}>
          <View style={styles.phoneIcon}>
            <Feather name="phone" size={24} color="#2D6A4F" />
          </View>
          <Text style={styles.contactName}>{prep?.contact_name || 'Contact'}</Text>
          <Text style={styles.prepLabel}>Here's what you need to know</Text>
        </View>

        {/* Recap */}
        {prep?.recap && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="clock" size={18} color="#457B9D" />
              <Text style={styles.sectionTitle}>Last Conversation</Text>
            </View>
            <Text style={styles.recapText}>{prep.recap}</Text>
          </View>
        )}

        {/* Follow-ups */}
        {prep?.follow_ups?.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="check-circle" size={18} color="#40916C" />
              <Text style={styles.sectionTitle}>Follow Up On</Text>
            </View>
            {prep.follow_ups.map((f: string, i: number) => (
              <View key={i} style={styles.listItem}>
                <View style={styles.bullet} />
                <Text style={styles.listText}>{f}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Important Dates */}
        {prep?.important_dates?.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="calendar" size={18} color="#E9C46A" />
              <Text style={styles.sectionTitle}>Upcoming Dates</Text>
            </View>
            {prep.important_dates.map((d: string, i: number) => (
              <View key={i} style={styles.listItem}>
                <Feather name="star" size={14} color="#E9C46A" />
                <Text style={styles.listText}>{d}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Conversation Starters */}
        {prep?.conversation_starters?.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="message-circle" size={18} color="#E76F51" />
              <Text style={styles.sectionTitle}>Conversation Starters</Text>
            </View>
            {prep.conversation_starters.map((s: string, i: number) => (
              <View key={i} style={styles.starterCard}>
                <Text style={styles.starterText}>"{s}"</Text>
              </View>
            ))}
          </View>
        )}

        {/* Emotional Note */}
        {prep?.emotional_note && (
          <View style={[styles.section, styles.emotionSection]}>
            <Feather name="heart" size={18} color="#E76F51" />
            <Text style={styles.emotionText}>{prep.emotional_note}</Text>
          </View>
        )}

        {/* AI Prompts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="zap" size={18} color="#2D6A4F" />
            <Text style={styles.sectionTitle}>AI Conversation Prompts</Text>
          </View>
          <View style={styles.promptModes}>
            <TouchableOpacity testID="deep-prompts-btn" style={styles.promptBtn} onPress={() => loadPrompts('deep')} disabled={promptsLoading}>
              <Text style={styles.promptBtnText}>Deep</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="light-prompts-btn" style={[styles.promptBtn, styles.promptBtnAlt]} onPress={() => loadPrompts('light')} disabled={promptsLoading}>
              <Text style={styles.promptBtnTextAlt}>Light</Text>
            </TouchableOpacity>
          </View>
          {promptsLoading && <ActivityIndicator size="small" color="#2D6A4F" style={{ marginTop: 12 }} />}
          {prompts.map((p, i) => (
            <View key={i} style={styles.promptCard}>
              <Text style={styles.promptText}>{p}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F7F2' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText: { fontSize: 16, color: '#636E72', fontFamily: 'Nunito_400Regular' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#2D3436', fontFamily: 'Nunito_600SemiBold' },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  nameCard: { alignItems: 'center', paddingVertical: 24, backgroundColor: '#FFFFFF', borderRadius: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  phoneIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#D8F3DC', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  contactName: { fontSize: 24, fontWeight: '600', color: '#2D3436', fontFamily: 'Lora_600SemiBold' },
  prepLabel: { fontSize: 14, color: '#636E72', marginTop: 4, fontFamily: 'Nunito_400Regular' },
  section: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#2D3436', fontFamily: 'Nunito_600SemiBold' },
  recapText: { fontSize: 15, color: '#636E72', lineHeight: 23 },
  listItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#40916C', marginTop: 7 },
  listText: { fontSize: 15, color: '#2D3436', lineHeight: 22, flex: 1 },
  starterCard: { backgroundColor: '#F0EBE3', borderRadius: 12, padding: 14, marginBottom: 8 },
  starterText: { fontSize: 15, color: '#2D3436', fontStyle: 'italic', lineHeight: 22 },
  emotionSection: { flexDirection: 'row', gap: 12, backgroundColor: '#FFF5F3', alignItems: 'flex-start' },
  emotionText: { fontSize: 14, color: '#E76F51', lineHeight: 21, flex: 1, fontStyle: 'italic' },
  promptModes: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  promptBtn: { flex: 1, backgroundColor: '#2D6A4F', borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  promptBtnAlt: { backgroundColor: '#F0EBE3' },
  promptBtnText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  promptBtnTextAlt: { color: '#636E72', fontSize: 14, fontWeight: '600' },
  promptCard: { backgroundColor: '#F9F7F2', borderRadius: 10, padding: 12, marginBottom: 8 },
  promptText: { fontSize: 14, color: '#2D3436', lineHeight: 21 },
});
