import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { api } from '../src/api';

export default function GoalsScreen() {
  const router = useRouter();
  const [goals, setGoals] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => { loadGoals(); }, []);

  async function loadGoals() {
    try {
      const active = await api.getGoals('active');
      const completed = await api.getGoals('completed');
      setGoals([...active, ...completed]);
    } catch (e) { console.error(e); }
  }

  async function handleCreate() {
    if (!title.trim()) return;
    try {
      await api.createGoal({ title: title.trim(), description: description.trim() || null });
      setTitle(''); setDescription(''); setShowAdd(false);
      loadGoals();
    } catch (e) { console.error(e); }
  }

  async function handleComplete(goalId: string) {
    try {
      await api.updateGoal(goalId, 100, 'completed');
      loadGoals();
    } catch (e) { console.error(e); }
  }

  async function handleDelete(goalId: string) {
    Alert.alert('Delete Goal', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await api.deleteGoal(goalId); loadGoals(); } },
    ]);
  }

  const active = goals.filter(g => g.status === 'active');
  const completed = goals.filter(g => g.status === 'completed');

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <TouchableOpacity testID="goals-back-btn" onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color="#2D3436" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Emotional Goals</Text>
          <TouchableOpacity testID="goals-add-btn" onPress={() => setShowAdd(!showAdd)} style={styles.addBtn}>
            <Feather name={showAdd ? 'x' : 'plus'} size={22} color="#2D6A4F" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {showAdd && (
            <View style={styles.addCard}>
              <TextInput testID="goal-title-input" style={styles.input} placeholder="What's your goal?" placeholderTextColor="#B2BEC3" value={title} onChangeText={setTitle} />
              <TextInput testID="goal-desc-input" style={[styles.input, styles.descInput]} placeholder="Add details (optional)" placeholderTextColor="#B2BEC3" value={description} onChangeText={setDescription} multiline />
              <TouchableOpacity testID="goal-create-btn" style={[styles.createBtn, !title.trim() && styles.createBtnDisabled]} onPress={handleCreate} disabled={!title.trim()}>
                <Feather name="check" size={18} color="#FFF" />
                <Text style={styles.createBtnText}>Create Goal</Text>
              </TouchableOpacity>
            </View>
          )}

          {active.length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>Active Goals</Text>
              {active.map(g => (
                <View key={g.id} style={styles.goalCard}>
                  <View style={styles.goalHeader}>
                    <View style={[styles.goalIcon, { backgroundColor: '#D8F3DC' }]}>
                      <Feather name="target" size={18} color="#2D6A4F" />
                    </View>
                    <View style={styles.goalInfo}>
                      <Text style={styles.goalTitle}>{g.title}</Text>
                      {g.description && <Text style={styles.goalDesc}>{g.description}</Text>}
                    </View>
                  </View>
                  <View style={styles.goalActions}>
                    <TouchableOpacity testID={`complete-goal-${g.id}`} style={styles.completeBtn} onPress={() => handleComplete(g.id)}>
                      <Feather name="check-circle" size={16} color="#40916C" />
                      <Text style={styles.completeBtnText}>Complete</Text>
                    </TouchableOpacity>
                    <TouchableOpacity testID={`delete-goal-${g.id}`} onPress={() => handleDelete(g.id)}>
                      <Feather name="trash-2" size={16} color="#E76F51" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {completed.length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>Completed</Text>
              {completed.map(g => (
                <View key={g.id} style={[styles.goalCard, styles.goalCompleted]}>
                  <View style={styles.goalHeader}>
                    <View style={[styles.goalIcon, { backgroundColor: '#95D5B220' }]}>
                      <Feather name="check" size={18} color="#95D5B2" />
                    </View>
                    <Text style={[styles.goalTitle, styles.goalTitleCompleted]}>{g.title}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {goals.length === 0 && !showAdd && (
            <View style={styles.empty}>
              <Feather name="target" size={48} color="#D8F3DC" />
              <Text style={styles.emptyTitle}>Set your first goal</Text>
              <Text style={styles.emptyText}>Goals like "Call parents weekly" or "Reconnect with 3 old friends" help you stay intentional.</Text>
              <TouchableOpacity testID="empty-add-goal-btn" style={styles.emptyBtn} onPress={() => setShowAdd(true)}>
                <Text style={styles.emptyBtnText}>Create a Goal</Text>
              </TouchableOpacity>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  backBtn: { width: 44, height: 44, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#2D3436', fontFamily: 'Nunito_600SemiBold' },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#D8F3DC', justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: 20, paddingTop: 16 },
  addCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 18, marginBottom: 20, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  input: { backgroundColor: '#F9F7F2', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#2D3436' },
  descInput: { minHeight: 80, textAlignVertical: 'top' },
  createBtn: { backgroundColor: '#2D6A4F', borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  createBtnDisabled: { opacity: 0.4 },
  createBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#B2BEC3', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, marginTop: 8 },
  goalCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 18, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  goalCompleted: { opacity: 0.6 },
  goalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  goalIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  goalInfo: { flex: 1 },
  goalTitle: { fontSize: 16, fontWeight: '600', color: '#2D3436' },
  goalTitleCompleted: { textDecorationLine: 'line-through', color: '#B2BEC3' },
  goalDesc: { fontSize: 14, color: '#636E72', marginTop: 4, lineHeight: 20 },
  goalActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.04)' },
  completeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  completeBtnText: { fontSize: 14, color: '#40916C', fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#2D3436', marginTop: 16, fontFamily: 'Lora_600SemiBold' },
  emptyText: { fontSize: 15, color: '#636E72', textAlign: 'center', marginTop: 8, lineHeight: 23, fontFamily: 'Nunito_400Regular' },
  emptyBtn: { backgroundColor: '#2D6A4F', borderRadius: 999, paddingHorizontal: 28, paddingVertical: 14, marginTop: 24 },
  emptyBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
