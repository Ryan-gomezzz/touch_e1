import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { api } from '../../src/api';
import { TAGS, TAG_COLORS, FREQUENCY_PRESETS } from '../../src/theme';

export default function AddContact() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [tag, setTag] = useState('Friend');
  const [frequency, setFrequency] = useState(7);
  const [isPinned, setIsPinned] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await api.createContact({
        name: name.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        relationship_tag: tag,
        frequency_days: frequency,
        is_pinned: isPinned,
      });
      router.back();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <TouchableOpacity testID="add-contact-close-btn" onPress={() => router.back()} style={styles.closeBtn}>
            <Feather name="x" size={22} color="#636E72" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Person</Text>
          <TouchableOpacity testID="add-contact-save-btn" onPress={handleSave} disabled={!name.trim() || saving} style={[styles.saveBtn, (!name.trim() || saving) && styles.saveBtnDisabled]}>
            <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
          <Text style={styles.label}>Name *</Text>
          <TextInput testID="contact-name-input" style={styles.input} placeholder="Enter their name" placeholderTextColor="#B2BEC3" value={name} onChangeText={setName} autoFocus />

          <Text style={styles.label}>Phone</Text>
          <TextInput testID="contact-phone-input" style={styles.input} placeholder="Phone number" placeholderTextColor="#B2BEC3" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

          <Text style={styles.label}>Email</Text>
          <TextInput testID="contact-email-input" style={styles.input} placeholder="Email address" placeholderTextColor="#B2BEC3" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

          <Text style={styles.label}>Relationship</Text>
          <View style={styles.tagGrid}>
            {TAGS.map(t => (
              <TouchableOpacity key={t} testID={`tag-${t.toLowerCase()}`} style={[styles.tagChip, tag === t && { backgroundColor: TAG_COLORS[t] + '20', borderColor: TAG_COLORS[t] }]} onPress={() => setTag(t)}>
                <View style={[styles.tagDot, { backgroundColor: TAG_COLORS[t] }]} />
                <Text style={[styles.tagLabel, tag === t && { color: TAG_COLORS[t], fontWeight: '600' }]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Touch Frequency</Text>
          <View style={styles.freqGrid}>
            {FREQUENCY_PRESETS.map(f => (
              <TouchableOpacity key={f.days} testID={`freq-${f.days}`} style={[styles.freqChip, frequency === f.days && styles.freqChipActive]} onPress={() => setFrequency(f.days)}>
                <Text style={[styles.freqText, frequency === f.days && styles.freqTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity testID="pin-toggle-btn" style={styles.pinRow} onPress={() => setIsPinned(!isPinned)}>
            <Feather name="star" size={20} color={isPinned ? '#E9C46A' : '#B2BEC3'} />
            <Text style={styles.pinLabel}>Pin to Inner Circle</Text>
            <View style={[styles.pinCheck, isPinned && styles.pinCheckActive]}>
              {isPinned && <Feather name="check" size={14} color="#FFF" />}
            </View>
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
