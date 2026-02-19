import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAudioRecorder, AudioModule, RecordingPresets } from 'expo-audio';
import { api } from '../../src/api';
import { getInitials } from '../../src/theme';

export default function LogInteraction() {
  const router = useRouter();
  const params = useLocalSearchParams<{ contactId?: string; contactName?: string }>();
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContact, setSelectedContact] = useState<string>(params.contactId || '');
  const [selectedName, setSelectedName] = useState(params.contactName || '');
  const [notes, setNotes] = useState('');
  const [interactionType, setInteractionType] = useState('note');
  const [saving, setSaving] = useState(false);
  const [showPicker, setShowPicker] = useState(!params.contactId);

  // Voice recording state - expo-audio
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [transcribing, setTranscribing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { if (!params.contactId) loadContacts(); }, []);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  async function loadContacts() {
    try { const c = await api.getContacts(); setContacts(c); } catch (e) { console.error(e); }
  }

  async function startRecording() {
    try {
      const permStatus = await AudioModule.requestRecordingPermissionsAsync();
      if (!permStatus.granted) return;
      recorder.record();
      setIsRecording(true);
      setRecordingDuration(0);
      timerRef.current = setInterval(() => { setRecordingDuration(d => d + 1); }, 1000);
    } catch (e) { console.error('Failed to start recording:', e); }
  }

  async function stopRecording() {
    if (!isRecording) return;
    setIsRecording(false);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (uri) {
        setTranscribing(true);
        setInteractionType('voice');
        try {
          const result = await api.transcribeVoice(uri, 'recording.wav');
          if (result.transcript) {
            setNotes(prev => prev ? `${prev}\n\n[Voice Note] ${result.transcript}` : result.transcript);
          }
        } catch (e) {
          console.error('Transcription error:', e);
          setNotes(prev => prev ? `${prev}\n\n[Voice recording captured - transcription unavailable]` : '[Voice recording captured - transcription unavailable]');
        }
        setTranscribing(false);
      }
    } catch (e) { console.error('Stop recording error:', e); setTranscribing(false); }
  }

  async function handleSave() {
    if (!selectedContact || !notes.trim()) return;
    setSaving(true);
    try {
      await api.createInteraction({ contact_id: selectedContact, interaction_type: interactionType, notes: notes.trim() });
      router.back();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }

  function formatDuration(sec: number) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  const types = [
    { key: 'call', icon: 'phone', label: 'Call' },
    { key: 'text', icon: 'message-square', label: 'Text' },
    { key: 'note', icon: 'edit-3', label: 'Note' },
    { key: 'voice', icon: 'mic', label: 'Voice' },
    { key: 'meeting', icon: 'users', label: 'Meet' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <TouchableOpacity testID="log-close-btn" onPress={() => router.back()} style={styles.closeBtn}>
            <Feather name="x" size={22} color="#636E72" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Log Interaction</Text>
          <TouchableOpacity
            testID="log-save-btn"
            onPress={handleSave}
            disabled={!selectedContact || !notes.trim() || saving}
            style={[styles.saveBtn, (!selectedContact || !notes.trim() || saving) && styles.saveBtnDisabled]}
          >
            {saving ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveBtnText}>Save</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
          {/* Contact Picker */}
          {showPicker ? (
            <View>
              <Text style={styles.label}>Who did you connect with?</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.contactPicker}>
                {contacts.map(c => (
                  <TouchableOpacity
                    key={c.id}
                    testID={`pick-contact-${c.name.toLowerCase().replace(/\s/g, '-')}`}
                    style={[styles.contactChip, selectedContact === c.id && styles.contactChipActive]}
                    onPress={() => { setSelectedContact(c.id); setSelectedName(c.name); }}
                  >
                    <View style={[styles.miniAvatar, { backgroundColor: c.avatar_color }]}>
                      <Text style={styles.miniInitials}>{getInitials(c.name)}</Text>
                    </View>
                    <Text style={[styles.contactChipText, selectedContact === c.id && styles.contactChipTextActive]}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : (
            <View style={styles.selectedRow}>
              <Text style={styles.selectedLabel}>Logging for</Text>
              <Text style={styles.selectedName}>{selectedName}</Text>
            </View>
          )}

          {/* Type */}
          <Text style={styles.label}>Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeRow}>
            {types.map(t => (
              <TouchableOpacity
                key={t.key}
                testID={`type-${t.key}`}
                style={[styles.typeChip, interactionType === t.key && styles.typeChipActive]}
                onPress={() => setInteractionType(t.key)}
              >
                <Feather name={t.icon as any} size={16} color={interactionType === t.key ? '#FFF' : '#636E72'} />
                <Text style={[styles.typeText, interactionType === t.key && styles.typeTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Voice Recording */}
          <View style={styles.voiceSection}>
            <View style={styles.voiceHeader}>
              <Feather name="mic" size={16} color="#2D6A4F" />
              <Text style={styles.voiceTitle}>Voice Recording</Text>
            </View>
            <View style={styles.voiceCard}>
              {isRecording ? (
                <View style={styles.recordingActive}>
                  <View style={styles.recordingDot} />
                  <Text style={styles.recordingTime}>{formatDuration(recordingDuration)}</Text>
                  <TouchableOpacity testID="stop-recording-btn" style={styles.stopBtn} onPress={stopRecording}>
                    <Feather name="square" size={20} color="#E76F51" />
                  </TouchableOpacity>
                </View>
              ) : transcribing ? (
                <View style={styles.transcribingRow}>
                  <ActivityIndicator size="small" color="#2D6A4F" />
                  <Text style={styles.transcribingText}>Transcribing with AI...</Text>
                </View>
              ) : (
                <TouchableOpacity testID="start-recording-btn" style={styles.recordBtn} onPress={startRecording}>
                  <View style={styles.recordDot}>
                    <Feather name="mic" size={20} color="#FFF" />
                  </View>
                  <Text style={styles.recordText}>Tap to record a voice note</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Notes */}
          <Text style={styles.label}>What happened?</Text>
          <TextInput
            testID="interaction-notes-input"
            style={styles.notesInput}
            multiline
            placeholder="Share what you talked about, how they're doing, things to remember..."
            placeholderTextColor="#B2BEC3"
            value={notes}
            onChangeText={setNotes}
            textAlignVertical="top"
          />
          <Text style={styles.hint}>
            <Feather name="zap" size={12} color="#40916C" /> AI will analyze your notes to extract highlights, follow-ups, and emotional cues
          </Text>

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
  saveBtn: { backgroundColor: '#2D6A4F', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10, minWidth: 70, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  form: { paddingHorizontal: 20, paddingTop: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#636E72', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginTop: 20 },
  contactPicker: { gap: 10, paddingBottom: 4 },
  contactChip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 24, backgroundColor: '#FFF', borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.06)' },
  contactChipActive: { backgroundColor: '#2D6A4F', borderColor: '#2D6A4F' },
  miniAvatar: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  miniInitials: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  contactChipText: { fontSize: 14, color: '#2D3436', fontWeight: '500' },
  contactChipTextActive: { color: '#FFF' },
  selectedRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#D8F3DC40', borderRadius: 12, padding: 14, marginBottom: 4 },
  selectedLabel: { fontSize: 14, color: '#636E72' },
  selectedName: { fontSize: 16, fontWeight: '600', color: '#2D6A4F' },
  typeRow: { gap: 8 },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, backgroundColor: '#FFF', borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.06)' },
  typeChipActive: { backgroundColor: '#2D6A4F', borderColor: '#2D6A4F' },
  typeText: { fontSize: 13, color: '#636E72' },
  typeTextActive: { color: '#FFF', fontWeight: '600' },
  voiceSection: { marginTop: 20 },
  voiceHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  voiceTitle: { fontSize: 13, fontWeight: '600', color: '#2D6A4F', textTransform: 'uppercase', letterSpacing: 0.5 },
  voiceCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' },
  recordBtn: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  recordDot: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E76F51', justifyContent: 'center', alignItems: 'center' },
  recordText: { fontSize: 15, color: '#636E72' },
  recordingActive: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  recordingDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#E76F51' },
  recordingTime: { fontSize: 20, fontWeight: '700', color: '#2D3436', flex: 1, fontVariant: ['tabular-nums'] },
  stopBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFEEE9', justifyContent: 'center', alignItems: 'center' },
  transcribingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  transcribingText: { fontSize: 15, color: '#2D6A4F', fontWeight: '500' },
  notesInput: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, fontSize: 16, color: '#2D3436', minHeight: 120, lineHeight: 24, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' },
  hint: { fontSize: 13, color: '#40916C', marginTop: 10, lineHeight: 20 },
});
