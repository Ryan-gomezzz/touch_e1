const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const API = `${BASE_URL}/api`;

async function request(path: string, options?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers as any) },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || res.statusText);
  }
  return res.json();
}

export const api = {
  // Contacts
  getContacts: (archived = false, tag?: string) => {
    let url = `/contacts?archived=${archived}`;
    if (tag) url += `&tag=${tag}`;
    return request(url);
  },
  getContact: (id: string) => request(`/contacts/${id}`),
  createContact: (data: any) => request('/contacts', { method: 'POST', body: JSON.stringify(data) }),
  updateContact: (id: string, data: any) => request(`/contacts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteContact: (id: string) => request(`/contacts/${id}`, { method: 'DELETE' }),

  // Interactions
  getInteractions: (contactId: string, limit = 20) => request(`/interactions/${contactId}?limit=${limit}`),
  createInteraction: (data: any) => request('/interactions', { method: 'POST', body: JSON.stringify(data) }),

  // Voice
  transcribeVoice: async (uri: string, filename: string) => {
    const formData = new FormData();
    formData.append('file', { uri, name: filename, type: 'audio/wav' } as any);
    const res = await fetch(`${API}/voice/transcribe`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Transcription failed');
    return res.json();
  },

  // AI
  getCallPrep: (contactId: string) => request(`/ai/call-prep/${contactId}`),
  getInsights: () => request('/ai/insights'),
  getPrompts: (contactId: string, mode = 'deep') => request(`/ai/prompts/${contactId}?mode=${mode}`),

  // Dashboard
  getDashboard: () => request('/dashboard'),

  // Goals
  getGoals: (status = 'active') => request(`/goals?status=${status}`),
  createGoal: (data: any) => request('/goals', { method: 'POST', body: JSON.stringify(data) }),
  updateGoal: (id: string, progress?: number, status?: string) => {
    const params = new URLSearchParams();
    if (progress !== undefined) params.append('progress', String(progress));
    if (status) params.append('status', status);
    return request(`/goals/${id}?${params}`, { method: 'PUT' });
  },
  deleteGoal: (id: string) => request(`/goals/${id}`, { method: 'DELETE' }),

  // Settings
  getSettings: () => request('/settings'),
  updateSettings: (data: any) => request('/settings', { method: 'PUT', body: JSON.stringify(data) }),

  // Data
  exportData: () => request('/data/export'),
  deleteAllData: () => request('/data/delete-all', { method: 'DELETE' }),

  // Notifications
  getPendingReminders: () => request('/notifications/pending'),

  // Shared Mode
  createSharedInvite: (data: any) => request('/shared/invite', { method: 'POST', body: JSON.stringify(data) }),
  getSharedInvites: () => request('/shared/invites'),
  getSharedContacts: () => request('/shared/contacts'),

  // Calendar
  getSuggestedTimes: (contactId: string) => request(`/calendar/suggest-times/${contactId}`),

  // Premium
  getPremiumStatus: () => request('/premium/status'),
  upgradePremium: (tier: string) => request(`/premium/upgrade?tier=${tier}`, { method: 'PUT' }),

  // Widget
  getWidgetData: () => request('/widget/data'),

  // Seed
  seed: () => request('/seed', { method: 'POST' }),
};
