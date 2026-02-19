import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, SafeAreaView, TextInput } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { api } from '../../src/api';
import { getInitials, getHealthColor, getTimeSince, TAGS, TAG_COLORS } from '../../src/theme';

export default function ContactsScreen() {
  const router = useRouter();
  const [contacts, setContacts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  useFocusEffect(useCallback(() => { loadContacts(); }, []));

  async function loadContacts() {
    try {
      const data = await api.getContacts(false, activeTag || undefined);
      setContacts(data);
    } catch (e) { console.error(e); }
    finally { setRefreshing(false); }
  }

  const filtered = contacts.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>People</Text>
        <TouchableOpacity testID="contacts-add-btn" onPress={() => router.push('/contact/add')} style={styles.addBtn}>
          <Feather name="plus" size={22} color="#2D6A4F" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Feather name="search" size={18} color="#B2BEC3" />
          <TextInput
            testID="contacts-search-input"
            style={styles.searchInput}
            placeholder="Search people..."
            placeholderTextColor="#B2BEC3"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagScroll} contentContainerStyle={styles.tagRow}>
        <TouchableOpacity style={[styles.tagChip, !activeTag && styles.tagChipActive]} onPress={() => { setActiveTag(null); }}>
          <Text style={[styles.tagText, !activeTag && styles.tagTextActive]}>All</Text>
        </TouchableOpacity>
        {TAGS.map(t => (
          <TouchableOpacity key={t} style={[styles.tagChip, activeTag === t && styles.tagChipActive]} onPress={() => { setActiveTag(activeTag === t ? null : t); }}>
            <Text style={[styles.tagText, activeTag === t && styles.tagTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadContacts(); }} tintColor="#2D6A4F" />}
        contentContainerStyle={styles.listContent}
      >
        {filtered.map(c => (
          <TouchableOpacity
            key={c.id}
            testID={`contact-card-${c.name.toLowerCase().replace(/\s/g, '-')}`}
            style={styles.contactCard}
            onPress={() => router.push(`/contact/${c.id}`)}
            activeOpacity={0.7}
          >
            <View style={[styles.avatar, { backgroundColor: c.avatar_color }]}>
              <Text style={styles.initials}>{getInitials(c.name)}</Text>
              {c.is_pinned && (
                <View style={styles.pinBadge}>
                  <Feather name="star" size={8} color="#FFF" />
                </View>
              )}
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>{c.name}</Text>
              <View style={styles.contactMeta}>
                <View style={[styles.tagDot, { backgroundColor: TAG_COLORS[c.relationship_tag] || '#B2BEC3' }]} />
                <Text style={styles.contactTag}>{c.relationship_tag}</Text>
                <Text style={styles.contactTime}>· {getTimeSince(c.last_interaction_at)}</Text>
              </View>
            </View>
            <View style={styles.healthBadge}>
              <Text style={[styles.healthText, { color: getHealthColor(c.connection_health) }]}>
                {Math.round(c.connection_health)}%
              </Text>
            </View>
          </TouchableOpacity>
        ))}
        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Feather name="users" size={48} color="#D8F3DC" />
            <Text style={styles.emptyText}>No contacts found</Text>
            <TouchableOpacity testID="empty-add-btn" onPress={() => router.push('/contact/add')} style={styles.emptyBtn}>
              <Text style={styles.emptyBtnText}>Add someone</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F7F2' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '600', color: '#2D3436', fontFamily: 'Lora_600SemiBold' },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#D8F3DC', justifyContent: 'center', alignItems: 'center' },
  searchRow: { paddingHorizontal: 20, marginTop: 8 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 14, height: 44, gap: 10 },
  searchInput: { flex: 1, fontSize: 15, color: '#2D3436' },
  tagScroll: { marginTop: 12, maxHeight: 44 },
  tagRow: { paddingHorizontal: 20, gap: 8 },
  tagChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' },
  tagChipActive: { backgroundColor: '#2D6A4F', borderColor: '#2D6A4F' },
  tagText: { fontSize: 13, fontWeight: '600', color: '#636E72' },
  tagTextActive: { color: '#FFFFFF' },
  listContent: { paddingHorizontal: 20, paddingTop: 16 },
  contactCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  initials: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  pinBadge: { position: 'absolute', top: -2, right: -2, width: 16, height: 16, borderRadius: 8, backgroundColor: '#E9C46A', justifyContent: 'center', alignItems: 'center' },
  contactInfo: { flex: 1, marginLeft: 14 },
  contactName: { fontSize: 16, fontWeight: '600', color: '#2D3436', fontFamily: 'Nunito_600SemiBold' },
  contactMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
  tagDot: { width: 8, height: 8, borderRadius: 4 },
  contactTag: { fontSize: 13, color: '#636E72' },
  contactTime: { fontSize: 13, color: '#B2BEC3' },
  healthBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  healthText: { fontSize: 14, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, color: '#636E72', marginTop: 16, fontFamily: 'Nunito_400Regular' },
  emptyBtn: { marginTop: 16, backgroundColor: '#2D6A4F', borderRadius: 999, paddingHorizontal: 24, paddingVertical: 12 },
  emptyBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
});
