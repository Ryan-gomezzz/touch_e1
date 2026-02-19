import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { api } from '../src/api';
import { getInitials, getHealthColor } from '../src/theme';
import { requestNotificationPermissions, scheduleRemindersForContacts, scheduleDailyCheck, scheduleWeeklyReflection, cancelAllNotifications, getScheduledCount } from '../src/notifications';

export default function RemindersScreen() {
  const router = useRouter();
  const [reminders, setReminders] = useState<any[]>([]);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadReminders(); }, []);

  async function loadReminders() {
    try {
      const data = await api.getPendingReminders();
      setReminders(data.reminders || []);
      const count = await getScheduledCount();
      setScheduledCount(count);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }

  async function enableNotifications() {
    const granted = await requestNotificationPermissions();
    if (!granted) {
      Alert.alert('Permissions Required', 'Please enable notifications in your device settings to receive gentle reminders.');
      return;
    }
    setNotifEnabled(true);
    try {
      await scheduleDailyCheck();
      await scheduleWeeklyReflection();
      if (reminders.length > 0) {
        await scheduleRemindersForContacts(reminders);
      }
      const count = await getScheduledCount();
      setScheduledCount(count);
      Alert.alert('Notifications Enabled', 'You\'ll receive gentle reminders to stay connected.');
    } catch (e) { console.error(e); }
  }

  async function disableNotifications() {
    await cancelAllNotifications();
    setNotifEnabled(false);
    setScheduledCount(0);
    Alert.alert('Notifications Disabled', 'You won\'t receive any reminders.');
  }

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.center}><ActivityIndicator size="large" color="#2D6A4F" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity testID="reminders-back-btn" onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="#2D3436" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gentle Reminders</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadReminders(); }} tintColor="#2D6A4F" />}
      >
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Feather name="bell" size={28} color="#2D6A4F" />
          </View>
          <Text style={styles.heroTitle}>Stay Connected</Text>
          <Text style={styles.heroSubtitle}>These gentle nudges help you maintain meaningful connections — no pressure, just awareness.</Text>
        </View>

        {reminders.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="check-circle" size={48} color="#95D5B2" />
            <Text style={styles.emptyTitle}>You're all caught up!</Text>
            <Text style={styles.emptyText}>All your connections are healthy. Keep it up!</Text>
          </View>
        ) : (
          reminders.map((r: any) => (
            <TouchableOpacity
              key={r.id}
              testID={`reminder-${r.contact_name.toLowerCase().replace(/\s/g, '-')}`}
              style={styles.reminderCard}
              onPress={() => router.push(`/contact/${r.contact_id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.reminderTop}>
                <View style={[styles.avatar, { backgroundColor: r.avatar_color }]}>
                  <Text style={styles.avatarText}>{getInitials(r.contact_name)}</Text>
                </View>
                <View style={styles.reminderInfo}>
                  <Text style={styles.reminderName}>{r.contact_name}</Text>
                  <Text style={styles.reminderTag}>{r.relationship_tag} · {r.days_overdue > 0 ? `${r.days_overdue} days overdue` : 'Due soon'}</Text>
                </View>
                <View style={[styles.healthBadge, { backgroundColor: getHealthColor(r.health) + '20' }]}>
                  <Text style={[styles.healthText, { color: getHealthColor(r.health) }]}>{Math.round(r.health)}%</Text>
                </View>
              </View>
              <Text style={styles.reminderMessage}>{r.message}</Text>
              <View style={styles.reminderActions}>
                <TouchableOpacity
                  testID={`remind-log-${r.contact_name.toLowerCase().replace(/\s/g, '-')}`}
                  style={styles.reminderActionBtn}
                  onPress={() => router.push({ pathname: '/interaction/log', params: { contactId: r.contact_id, contactName: r.contact_name } })}
                >
                  <Feather name="edit-3" size={14} color="#2D6A4F" />
                  <Text style={styles.reminderActionText}>Log Touch</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  testID={`remind-prep-${r.contact_name.toLowerCase().replace(/\s/g, '-')}`}
                  style={[styles.reminderActionBtn, styles.reminderActionAlt]}
                  onPress={() => router.push(`/callprep/${r.contact_id}`)}
                >
                  <Feather name="phone" size={14} color="#457B9D" />
                  <Text style={[styles.reminderActionText, { color: '#457B9D' }]}>Call Prep</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* Push Notification Controls */}
        <View style={styles.notifCard}>
          <View style={styles.notifHeader}>
            <Feather name="bell" size={20} color="#2D6A4F" />
            <View style={styles.notifInfo}>
              <Text style={styles.notifTitle}>Push Notifications</Text>
              <Text style={styles.notifStatus}>{notifEnabled ? `${scheduledCount} scheduled` : 'Not enabled'}</Text>
            </View>
          </View>
          {notifEnabled ? (
            <View style={styles.notifActions}>
              <View style={styles.notifActiveBadge}>
                <Feather name="check-circle" size={14} color="#2D6A4F" />
                <Text style={styles.notifActiveText}>Active</Text>
              </View>
              <TouchableOpacity testID="disable-notif-btn" style={styles.notifDisableBtn} onPress={disableNotifications}>
                <Text style={styles.notifDisableText}>Turn Off</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity testID="enable-notif-btn" style={styles.enableNotifBtn} onPress={enableNotifications}>
              <Feather name="bell" size={16} color="#FFF" />
              <Text style={styles.enableNotifText}>Enable Push Notifications</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.notifDesc}>Get gentle reminders when connections need attention. Includes daily check-ins and weekly reflections.</Text>
        </View>

        {/* Notification Settings */}
        <View style={styles.settingsCard}>
          <Text style={styles.settingsTitle}>Notification Preferences</Text>
          <Text style={styles.settingsSubtext}>Adjust reminder frequency and intensity in Settings → Notifications</Text>
          <TouchableOpacity testID="go-to-notification-settings" style={styles.settingsBtn} onPress={() => router.push('/(tabs)/settings')}>
            <Feather name="settings" size={16} color="#2D6A4F" />
            <Text style={styles.settingsBtnText}>Open Settings</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F7F2' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#2D3436', fontFamily: 'Nunito_600SemiBold' },
  content: { paddingHorizontal: 20 },
  hero: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  heroIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#D8F3DC', justifyContent: 'center', alignItems: 'center' },
  heroTitle: { fontSize: 22, fontWeight: '600', color: '#2D3436', fontFamily: 'Lora_600SemiBold' },
  heroSubtitle: { fontSize: 15, color: '#636E72', textAlign: 'center', lineHeight: 23, fontFamily: 'Nunito_400Regular' },
  empty: { alignItems: 'center', paddingTop: 40, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#2D3436', fontFamily: 'Nunito_600SemiBold' },
  emptyText: { fontSize: 15, color: '#636E72', textAlign: 'center', fontFamily: 'Nunito_400Regular' },
  reminderCard: { backgroundColor: '#FFF', borderRadius: 18, padding: 18, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
  reminderTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  reminderInfo: { flex: 1, marginLeft: 12 },
  reminderName: { fontSize: 17, fontWeight: '600', color: '#2D3436', fontFamily: 'Nunito_600SemiBold' },
  reminderTag: { fontSize: 13, color: '#636E72', marginTop: 2 },
  healthBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  healthText: { fontSize: 13, fontWeight: '700' },
  reminderMessage: { fontSize: 15, color: '#636E72', lineHeight: 22, marginBottom: 14 },
  reminderActions: { flexDirection: 'row', gap: 10 },
  reminderActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#D8F3DC', borderRadius: 12, paddingVertical: 10 },
  reminderActionAlt: { backgroundColor: '#A8DADC30' },
  reminderActionText: { fontSize: 13, fontWeight: '600', color: '#2D6A4F' },
  settingsCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 18, marginTop: 20, gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  settingsTitle: { fontSize: 16, fontWeight: '600', color: '#2D3436' },
  settingsSubtext: { fontSize: 14, color: '#636E72', lineHeight: 20 },
  settingsBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  settingsBtnText: { fontSize: 14, fontWeight: '600', color: '#2D6A4F' },
  notifCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 18, marginTop: 20, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  notifHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  notifInfo: { flex: 1 },
  notifTitle: { fontSize: 16, fontWeight: '600', color: '#2D3436' },
  notifStatus: { fontSize: 13, color: '#636E72', marginTop: 2 },
  notifActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  notifActiveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#D8F3DC', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  notifActiveText: { fontSize: 13, fontWeight: '600', color: '#2D6A4F' },
  notifDisableBtn: { paddingHorizontal: 14, paddingVertical: 6 },
  notifDisableText: { fontSize: 13, color: '#E76F51', fontWeight: '600' },
  enableNotifBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#2D6A4F', borderRadius: 12, paddingVertical: 12 },
  enableNotifText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  notifDesc: { fontSize: 13, color: '#B2BEC3', lineHeight: 19 },
});
