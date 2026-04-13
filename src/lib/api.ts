const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000/api';

const getHeaders = () => {
  const token = localStorage.getItem('tvet_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const api = {
  // --- Auth ---
  login: async (credentials: any) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      // Show details if available, otherwise show the main error or fallback
      const errorMsg = errorData.details || errorData.error || 'Login failed';
      throw new Error(errorMsg);
    }
    return res.json();
  },

  signup: async (data: any) => {
    const res = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Signup failed');
    }
    return res.json();
  },

  updateOnboarding: async (data: any) => {
    const res = await fetch(`${API_URL}/auth/onboarding`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to update onboarding data');
    }
    return res.json();
  },
  
  updateProfile: async (data: any) => {
    const res = await fetch(`${API_URL}/auth/profile`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to update profile');
    }
    return res.json();
  },

  getProfile: async () => {
    const res = await fetch(`${API_URL}/auth/profile`, {
      headers: getHeaders()
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch profile');
    }
    return res.json();
  },

  deleteAccount: async () => {
    const res = await fetch(`${API_URL}/auth`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to delete account');
    }
    return res.json();
  },

  changePassword: async (passwords: any) => {
    const res = await fetch(`${API_URL}/auth/change-password`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(passwords)
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to change password');
    }
    return res.json();
  },

  uploadAvatar: async (file: File) => {
    const token = localStorage.getItem('tvet_token');
    const formData = new FormData();
    formData.append('avatar', file);

    const res = await fetch(`${API_URL}/auth/avatar`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Avatar upload failed');
    }
    return res.json();
  },

  // --- Quizzes ---
  generateQuiz: async (subject: string, trade: string) => {
    try {
      const res = await fetch(`${API_URL}/quizzes/generate`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ subject, trade })
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown server error' }));
        throw new Error(errorData.details || errorData.error || 'Failed to generate quiz');
      }
      return res.json();
    } catch (e: any) {
      console.error(`[API] Quiz generation error: ${e.message}`);
      throw e;
    }
  },

  // --- History ---
  saveHistory: async (data: any) => {
    const res = await fetch(`${API_URL}/history`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to save history');
    }
    return res.json();
  },

  getHistory: async () => {
    const res = await fetch(`${API_URL}/history`, {
      headers: getHeaders()
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch history');
    }
    return res.json();
  },

  // --- Goals ---
  getGoals: async () => {
    const res = await fetch(`${API_URL}/goals`, {
      headers: getHeaders()
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch goals');
    }
    return res.json();
  },

  createGoal: async (text: string, urgency?: string, dueDate?: string) => {
    const res = await fetch(`${API_URL}/goals`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ text, urgency, dueDate })
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create goal');
    }
    return res.json();
  },

  updateGoal: async (id: string, completed: boolean) => {
    const res = await fetch(`${API_URL}/goals/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ completed })
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to update goal');
    }
    return res.json();
  },

  // --- Portfolio ---
  getPortfolio: async () => {
    const res = await fetch(`${API_URL}/portfolio`, {
      headers: getHeaders()
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch portfolio');
    }
    return res.json();
  },

  uploadEvidence: async (formData: FormData) => {
    const token = localStorage.getItem('tvet_token');
    const res = await fetch(`${API_URL}/portfolio`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Upload failed');
    }
    return res.json();
  },

  // --- AI Chat ---
  sendChatMessage: async (message: string, history: any[] = []) => {
    const res = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ message, history })
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Chat failed');
    }
    return res.json();
  },

  gradeQuiz: async (quiz: any, userAnswers: any) => {
    const res = await fetch(`${API_URL}/quizzes/grade`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ quiz, userAnswers })
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Grading failed');
    }
    return res.json();
  }
};
