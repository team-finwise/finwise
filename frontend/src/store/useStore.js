/**
 * FINWISE Global Store (Zustand)
 *
 * Holds the user's financial profile and computed analysis results.
 * Persisted to sessionStorage so refreshing the page doesn't wipe the form.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const defaultProfile = {
  name: '',
  income: '',
  expenses: {
    housing: '',
    food: '',
    transportation: '',
    education: '',
    healthcare: '',
    entertainment: '',
    subscriptions: '',
    other: '',
  },
  debtPayment: '',
  savingsContribution: '',
};

const defaultGoal = {
  name: '',
  targetAmount: '',
  amountSaved: '',
  targetDate: '',
};

const useStore = create(
  persist(
    (set) => ({
      // User inputs
      userName: '',
      authUser: null,
      authToken: null,
      profile: defaultProfile,
      goal: defaultGoal,

      // AI assistant chat messages
      chatMessages: [],

      // Computed results (set after calling analyze())
      results: null,

      // Profile form step (1–4)
      formStep: 1,

      // Actions
      setUserName: (name) => set({ userName: name }),

      setAuth: ({ user, token }) => set({ authUser: user, authToken: token, userName: user?.name || '' }),

      logout: () => set({ authUser: null, authToken: null, results: null, formStep: 1, chatMessages: [] }),

      setProfile: (updates) =>
        set((s) => ({ profile: { ...s.profile, ...updates } })),

      setExpense: (key, value) =>
        set((s) => ({
          profile: {
            ...s.profile,
            expenses: { ...s.profile.expenses, [key]: value },
          },
        })),

      setGoal: (updates) =>
        set((s) => ({ goal: { ...s.goal, ...updates } })),

      setResults: (results) => set({ results }),

      setFormStep: (step) => set({ formStep: step }),

      addChatMessage: (msg) =>
        set((s) => ({ chatMessages: [...s.chatMessages, msg] })),

      clearChatMessages: () => set({ chatMessages: [] }),

      resetAll: () =>
        set({
          userName: '',
          profile: defaultProfile,
          goal: defaultGoal,
          results: null,
          formStep: 1,
          chatMessages: [],
        }),
    }),
    {
      name: 'finwise-store',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

export default useStore;
