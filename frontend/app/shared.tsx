import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { api } from '../src/api';
import { getInitials } from '../src/theme';

export default function SharedModeScreen() {
  const router = useRouter();
  const [contacts, setContacts] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [partnerName, setPartnerName] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [mode, setMode] = useState<'couple' | 'coparent'>('couple');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [c, inv] = await Promise.all([api.getContacts(), api.getSharedInvites()]);
      setContacts(c);
      setInvites(inv.invites || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function toggleContact(id: string) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }

  async function handleSendInvite() {
    if (!partnerName.trim()) return;
    setSending(true);
    try {
      await api.createSharedInvite({ partner_name: partnerName.trim(), partner_email: partnerEmail.trim() || null, shared_contact_ids: selectedIds, mode });
      Alert.alert('Invitation Sent', `Shared mode invitation sent to ${partnerName}.`);
      setShowInvite(false); setPartnerName(''); setPartnerEmail(''); setSelectedIds([]);
      await loadData();
    } catch (e) { console.error(e); }
    finally { setSending(false); }
  }

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.center}><ActivityIndicator size="large" color="#2D6A4F" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <TouchableOpacity testID="shared-back-btn" onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color="#2D3436" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Shared Mode</Text>
          <TouchableOpacity testID="shared-invite-toggle" onPress={() => setShowInvite(!showInvite)} style={styles.addBtn}>
            <Feather name={showInvite ? 'x' : 'user-plus'} size={20} color="#2D6A4F" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <View style={styles.hero}>
            <View style={styles.heroIcons}>
              <View style={[styles.heroCircle, { backgroundColor: '#D8F3DC' }]}><Feather name="heart" size={24} color="#2D6A4F" /></View>
              <View style={[styles.heroCircle, { backgroundColor: '#E9C46A20', marginLeft: -12 }]}><Feather name="users" size={24} color="#E9C46A" /></View>
            </View>
            <Text style={styles.heroTitle}>Better Together</Text>
            <Text style={styles.heroSubtitle}>Share relationship tracking with your partner or co-parent. Stay aligned on who needs attention.</Text>
          </View>

          {/* Mode Selection */}
          <View style={styles.modeRow}>
            <TouchableOpacity testID="mode-couple-btn" style={[styles.modeBtn, mode === 'couple' && styles.modeBtnActive]} onPress={() => setMode('couple')}>
              <Feather name="heart" size={18} color={mode === 'couple' ? '#FFF' : '#636E72'} />
              <Text style={[styles.modeText, mode === 'couple' && styles.modeTextActive]}>Couple</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="mode-coparent-btn" style={[styles.modeBtn, mode === 'coparent' && styles.modeBtnActive]} onPress={() => setMode('coparent')}>
              <Feather name="users" size={18} color={mode === 'coparent' ? '#FFF' : '#636E72'} />
              <Text style={[styles.modeText, mode === 'coparent' && styles.modeTextActive]}>Co-Parent</Text>
            </TouchableOpacity>
          </View>

          {/* Invite Form */}
          {showInvite && (
            <View style={styles.inviteCard}>
              <Text style={styles.inviteTitle}>Invite Your {mode === 'couple' ? 'Partner' : 'Co-Parent'}</Text>
              <TextInput testID="partner-name-input" style={styles.input} placeholder="Their name" placeholderTextColor="#B2BEC3" value={partnerName} onChangeText={setPartnerName} />
              <TextInput testID="partner-email-input" style={styles.input} placeholder="Email (optional)" placeholderTextColor="#B2BEC3" value={partnerEmail} onChangeText={setPartnerEmail} keyboardType="email-address" autoCapitalize="none" />

              <Text style={styles.shareLabel}>Share these contacts:</Text>
              <View style={styles.contactGrid}>
                {contacts.slice(0, 12).map(c => (
                  <TouchableOpacity key={c.id} style={[styles.contactChip, selectedIds.includes(c.id) && styles.contactChipSelected]} onPress={() => toggleContact(c.id)}>
                    <View style={[styles.miniAvatar, { backgroundColor: c.avatar_color }]}><Text style={styles.miniInit}>{getInitials(c.name)}</Text></View>
                    <Text style={[styles.chipName, selectedIds.includes(c.id) && styles.chipNameSelected]} numberOfLines={1}>{c.name}</Text>
                    {selectedIds.includes(c.id) && <Feather name="check" size={14} color="#FFF" />}
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity testID="send-invite-btn" style={[styles.sendBtn, (!partnerName.trim() || sending) && styles.sendBtnDisabled]} onPress={handleSendInvite} disabled={!partnerName.trim() || sending}>
                {sending ? <ActivityIndicator size="small" color="#FFF" /> : (
                  <><Feather name="send" size={16} color="#FFF" /><Text style={styles.sendBtnText}>Send Invitation</Text></>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Existing Invites */}
          {invites.length > 0 && (
            <View style={styles.invitesSection}>
              <Text style={styles.sectionTitle}>Shared Connections</Text>
              {invites.map((inv: any) => (
                <View key={inv.id} style={styles.inviteRow}>
                  <View style={[styles.inviteIcon, { backgroundColor: inv.status === 'accepted' ? '#D8F3DC' : '#E9C46A20' }]}>
                    <Feather name={inv.status === 'accepted' ? 'check-circle' : 'clock'} size={18} color={inv.status === 'accepted' ? '#2D6A4F' : '#E9C46A'} />
                  </View>
                  <View style={styles.inviteInfo}>
                    <Text style={styles.inviteName}>{inv.partner_name}</Text>
                    <Text style={styles.inviteStatus}>{inv.mode === 'couple' ? 'Partner' : 'Co-Parent'} · {inv.status === 'accepted' ? 'Connected' : 'Pending'}</Text>
                  </View>
                  <Text style={styles.inviteCount}>{inv.shared_contact_ids?.length || 0} shared</Text>
                </View>
              ))}
            </View>
          )}

          {invites.length === 0 && !showInvite && (
            <View style={styles.empty}>
              <Feather name="users" size={48} color="#D8F3DC" />
              <Text style={styles.emptyTitle}>No shared connections yet</Text>
              <Text style={styles.emptyText}>Invite your partner or co-parent to share relationship tracking and stay aligned.</Text>
            </View>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F7F2' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#2D3436', fontFamily: 'Nunito_600SemiBold' },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#D8F3DC', justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: 20 },
  hero: { alignItems: 'center', paddingVertical: 20 },
  heroIcons: { flexDirection: 'row', marginBottom: 16 },
  heroCircle: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  heroTitle: { fontSize: 24, fontWeight: '600', color: '#2D3436', fontFamily: 'Lora_600SemiBold' },
  heroSubtitle: { fontSize: 15, color: '#636E72', textAlign: 'center', marginTop: 8, lineHeight: 23, fontFamily: 'Nunito_400Regular' },
  modeRow: { flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 20 },
  modeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, backgroundColor: '#FFF', borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.06)' },
  modeBtnActive: { backgroundColor: '#2D6A4F', borderColor: '#2D6A4F' },
  modeText: { fontSize: 15, fontWeight: '600', color: '#636E72' },
  modeTextActive: { color: '#FFF' },
  inviteCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  inviteTitle: { fontSize: 18, fontWeight: '600', color: '#2D3436', fontFamily: 'Nunito_600SemiBold' },
  input: { backgroundColor: '#F9F7F2', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#2D3436' },
  shareLabel: { fontSize: 13, fontWeight: '600', color: '#636E72', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 },
  contactGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  contactChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F9F7F2', borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.06)' },
  contactChipSelected: { backgroundColor: '#2D6A4F', borderColor: '#2D6A4F' },
  miniAvatar: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  miniInit: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  chipName: { fontSize: 13, color: '#2D3436', maxWidth: 80 },
  chipNameSelected: { color: '#FFF' },
  sendBtn: { backgroundColor: '#2D6A4F', borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, marginTop: 4 },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  invitesSection: { marginTop: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#B2BEC3', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  inviteRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 14, padding: 14, marginBottom: 10, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  inviteIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  inviteInfo: { flex: 1 },
  inviteName: { fontSize: 16, fontWeight: '600', color: '#2D3436' },
  inviteStatus: { fontSize: 13, color: '#636E72', marginTop: 2 },
  inviteCount: { fontSize: 13, color: '#B2BEC3' },
  empty: { alignItems: 'center', paddingTop: 40, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#2D3436', fontFamily: 'Nunito_600SemiBold' },
  emptyText: { fontSize: 15, color: '#636E72', textAlign: 'center', lineHeight: 23, fontFamily: 'Nunito_400Regular', paddingHorizontal: 20 },
});
