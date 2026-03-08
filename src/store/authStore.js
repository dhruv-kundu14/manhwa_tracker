import { create } from 'zustand'

const MOCK_USER = {
  _id:       'local-user',
  username:  'ShadowReader',
  email:     '',
  avatar:    null,
  bio:       'Devouring manhwa since 2019 🔥',
  isPrivate: false,
}

export const useAuthStore = create((set) => ({
  user:        MOCK_USER,
  accessToken: 'local-mode',

  setAuth:        (user, accessToken) => set({ user, accessToken }),
  setAccessToken: (accessToken)       => set({ accessToken }),
  updateUser:     (partial)           => set((s) => ({ user: { ...s.user, ...partial } })),
  logout:         ()                  => set({ user: null, accessToken: null }),
}))
