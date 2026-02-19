import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { api } from '../../src/api';

export default function SettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => { loadSettings(); }, []);

  async function loadSettings() {
    try { const s = await api.getSettings(); setSettings(s); } catch (e) { console.error(e); }
  }

  async function toggleSetting(key: string, value: boolean) {
    try {
      const updated = await api.updateSettings({ [key]: value });
      setSettings(updated);
    } catch (e) { console.error(e); }
  }

  async function handleExport() {
    try {
      const data = await api.exportData();
      Alert.alert('Data Exported', `Exported ${data.contacts?.length || 0} contacts and ${data.interactions?.length || 0} interactions.`);
    } catch (e) { Alert.alert('Error', 'Failed to export data'); }
  }

  async function handleDeleteAll() {
    Alert.alert('Delete All Data', 'This will permanently delete all your data. This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete Everything', style: 'destructive', onPress: async () => {
        try {
          await api.deleteAllData();
          Alert.alert('Done', 'All data has been deleted.');
          router.replace('/onboarding');
        } catch (e) { Alert.alert('Error', 'Failed to delete data'); }
      }},
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Settings</Text>

        {/* Privacy */}
        <Text style={styles.sectionTitle}>Privacy & Security</Text>
        <View style={styles.card}>
          <SettingRow icon="shield" label="Privacy Mode" sublabel="Enhanced data protection" toggle value={settings?.privacy_mode} onToggle={(v) => toggleSetting('privacy_mode', v)} />
          <SettingRow icon="lock" label="Data Encryption" sublabel="AES-256 encryption for all data" toggle value={settings?.data_encryption} onToggle={(v) => toggleSetting('data_encryption', v)} />
        </View>

        {/* Notifications */}
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.card}>
          <SettingRow icon="moon" label="Low Pressure Mode" sublabel="Reduce reminder frequency during busy times" toggle value={settings?.low_pressure_mode} onToggle={(v) => toggleSetting('low_pressure_mode', v)} />
          <View style={styles.settingRow}>
            <View style={[styles.iconBox, { backgroundColor: '#D8F3DC' }]}>
              <Feather name="bell" size={18} color="#2D6A4F" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Notification Intensity</Text>
              <Text style={styles.settingValue}>{settings?.notification_intensity || 50}%</Text>
            </View>
          </View>
        </View>

        {/* Appearance */}
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={[styles.iconBox, { backgroundColor: '#F0EBE3' }]}>
              <Feather name="sun" size={18} color="#636E72" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Theme</Text>
              <Text style={styles.settingValue}>{settings?.theme_mode === 'dark' ? 'Dark' : settings?.theme_mode === 'light' ? 'Light' : 'System'}</Text>
            </View>
          </View>
        </View>

        {/* Goals */}
        <Text style={styles.sectionTitle}>Features</Text>
        <View style={styles.card}>
          <TouchableOpacity testID="settings-goals-btn" style={styles.settingRow} onPress={() => router.push('/goals')}>
            <View style={[styles.iconBox, { backgroundColor: '#A8DADC40' }]}>
              <Feather name="target" size={18} color="#457B9D" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Emotional Goals</Text>
              <Text style={styles.settingSublabel}>Set and track relationship goals</Text>
            </View>
            <Feather name="chevron-right" size={18} color="#B2BEC3" />
          </TouchableOpacity>
        </View>

        {/* Data */}
        <Text style={styles.sectionTitle}>Data Management</Text>
        <View style={styles.card}>
          <TouchableOpacity testID="export-data-btn" style={styles.settingRow} onPress={handleExport}>
            <View style={[styles.iconBox, { backgroundColor: '#D8F3DC' }]}>
              <Feather name="download" size={18} color="#2D6A4F" />
            </View>
            <Text style={styles.settingLabel}>Export My Data</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="delete-all-btn" style={styles.settingRow} onPress={handleDeleteAll}>
            <View style={[styles.iconBox, { backgroundColor: '#FFEEE9' }]}>
              <Feather name="trash-2" size={18} color="#E76F51" />
            </View>
            <Text style={[styles.settingLabel, { color: '#E76F51' }]}>Delete All Data</Text>
          </TouchableOpacity>
        </View>

        {/* Legal */}
        <Text style={styles.sectionTitle}>Legal</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={[styles.iconBox, { backgroundColor: '#F0EBE3' }]}>
              <Feather name="file-text" size={18} color="#636E72" />
            </View>
            <Text style={styles.settingLabel}>Privacy Policy</Text>
          </View>
          <View style={styles.settingRow}>
            <View style={[styles.iconBox, { backgroundColor: '#F0EBE3' }]}>
              <Feather name="book" size={18} color="#636E72" />
            </View>
            <Text style={styles.settingLabel}>Terms of Service</Text>
          </View>
        </View>

        <Text style={styles.version}>Touch v1.0 · Made with care</Text>
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({ icon, label, sublabel, toggle, value, onToggle }: any) {
  return (
    <View style={styles.settingRow}>
      <View style={[styles.iconBox, { backgroundColor: '#D8F3DC' }]}>
        <Feather name={icon} size={18} color="#2D6A4F" />
      </View>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
        {sublabel && <Text style={styles.settingSublabel}>{sublabel}</Text>}
      </View>
      {toggle && <Switch value={value} onValueChange={onToggle} trackColor={{ false: '#D8D8D8', true: '#95D5B2' }} thumbColor={value ? '#2D6A4F' : '#F4F3F4'} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F7F2' },
  content: { paddingHorizontal: 20, paddingTop: 16 },
  title: { fontSize: 28, fontWeight: '600', color: '#2D3436', marginBottom: 24, fontFamily: 'Lora_600SemiBold' },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#B2BEC3', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginTop: 24 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.04)', gap: 12 },
  iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: 15, fontWeight: '500', color: '#2D3436' },
  settingSublabel: { fontSize: 13, color: '#B2BEC3', marginTop: 2 },
  settingValue: { fontSize: 13, color: '#636E72', marginTop: 2 },
  version: { textAlign: 'center', fontSize: 13, color: '#B2BEC3', marginTop: 32, fontFamily: 'Nunito_400Regular' },
});
