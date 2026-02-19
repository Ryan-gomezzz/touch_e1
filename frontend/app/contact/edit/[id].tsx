import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { api } from '../../../src/api';
import { TAGS, TAG_COLORS, FREQUENCY_PRESETS } from '../../../src/theme';

export default function EditContact() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [tag, setTag] = useState('Friend');
  const [frequency, setFrequency] = useState(7);
  const [isPinned, setIsPinned] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadContact(); }, [id]);

  async function loadContact() {
    try {
      const c = await api.getContact(id!);
      setName(c.name); setPhone(c.phone || ''); setEmail(c.email || '');
      setTag(c.relationship_tag); setFrequency(c.frequency_days); setIsPinned(c.is_pinned);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await api.updateContact(id!, { name: name.trim(), phone: phone.trim() || null, email: email.trim() || null, relationship_tag: tag, frequency_days: frequency, is_pinned: isPinned });
      router.back();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }

  if (loading) return <SafeAreaView style={styles.container}><View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#2D6A4F" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <TouchableOpacity testID="edit-close-btn" onPress={() => router.back()} style={styles.closeBtn}><Feather name="x" size={22} color="#636E72" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Person</Text>
          <TouchableOpacity testID="edit-save-btn" onPress={handleSave} disabled={!name.trim() || saving} style={[styles.saveBtn, (!name.trim() || saving) && styles.saveBtnDisabled]}>
            <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save'}</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
          <Text style={styles.label}>Name *</Text>
          <TextInput testID="edit-name-input" style={styles.input} value={name} onChangeText={setName} />
          <Text style={styles.label}>Phone</Text>
          <TextInput testID="edit-phone-input" style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <Text style={styles.label}>Email</Text>
          <TextInput testID="edit-email-input" style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Text style={styles.label}>Relationship</Text>
          <View style={styles.tagGrid}>
            {TAGS.map(t => (
              <TouchableOpacity key={t} style={[styles.tagChip, tag === t && { backgroundColor: TAG_COLORS[t] + '20', borderColor: TAG_COLORS[t] }]} onPress={() => setTag(t)}>
                <View style={[styles.tagDot, { backgroundColor: TAG_COLORS[t] }]} /><Text style={[styles.tagLabel, tag === t && { color: TAG_COLORS[t], fontWeight: '600' }]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>Touch Frequency</Text>
          <View style={styles.freqGrid}>
            {FREQUENCY_PRESETS.map(f => (
              <TouchableOpacity key={f.days} style={[styles.freqChip, frequency === f.days && styles.freqChipActive]} onPress={() => setFrequency(f.days)}>
                <Text style={[styles.freqText, frequency === f.days && styles.freqTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.pinRow} onPress={() => setIsPinned(!isPinned)}>
            <Feather name="star" size={20} color={isPinned ? '#E9C46A' : '#B2BEC3'} />
            <Text style={styles.pinLabel}>Pin to Inner Circle</Text>
            <View style={[styles.pinCheck, isPinned && styles.pinCheckActive]}>{isPinned && <Feather name="check" size={14} color="#FFF" />}</View>
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F7F2' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.04)' },
  closeBtn: { width: 44, height: 44, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#2D3436', fontFamily: 'Nunito_600SemiBold' },
  saveBtn: { backgroundColor: '#2D6A4F', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10 },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  form: { paddingHorizontal: 20, paddingTop: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#636E72', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 20 },
  input: { backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#2D3436', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' },
  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFF', borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.06)' },
  tagDot: { width: 8, height: 8, borderRadius: 4 },
  tagLabel: { fontSize: 14, color: '#636E72' },
  freqGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  freqChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#FFF', borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.06)' },
  freqChipActive: { backgroundColor: '#2D6A4F', borderColor: '#2D6A4F' },
  freqText: { fontSize: 14, color: '#636E72' },
  freqTextActive: { color: '#FFF', fontWeight: '600' },
  pinRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 24, backgroundColor: '#FFF', borderRadius: 12, padding: 16 },
  pinLabel: { flex: 1, fontSize: 15, color: '#2D3436', fontWeight: '500' },
  pinCheck: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#D8D8D8', justifyContent: 'center', alignItems: 'center' },
  pinCheckActive: { backgroundColor: '#2D6A4F', borderColor: '#2D6A4F' },
});
