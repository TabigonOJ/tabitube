import { create } from 'zustand'
import api from '../lib/api'

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  loading: false,
  error: null,

  // 登録
  register: async (name, email, password, password_confirmation) => {
    set({ loading: true, error: null })
    try {
      const { data } = await api.post('/register', {
        name,
        email,
        password,
        password_confirmation,
      })
      localStorage.setItem('token', data.token)
      set({ user: data.user, token: data.token, loading: false })
      return true
    } catch (err) {
      const message =
        err.response?.data?.message || '登録に失敗しました。'
      set({ error: message, loading: false })
      return false
    }
  },

  // ログイン
  login: async (email, password) => {
    set({ loading: true, error: null })
    try {
      const { data } = await api.post('/login', { email, password })
      localStorage.setItem('token', data.token)
      set({ user: data.user, token: data.token, loading: false })
      return true
    } catch (err) {
      const message =
        err.response?.data?.message || 'メールアドレスまたはパスワードが正しくありません。'
      set({ error: message, loading: false })
      return false
    }
  },

  // ログアウト
  logout: async () => {
    try {
      await api.post('/logout')
    } finally {
      localStorage.removeItem('token')
      set({ user: null, token: null })
    }
  },

  // ログイン中ユーザー情報取得
  fetchMe: async () => {
    set({ loading: true })
    try {
      const { data } = await api.get('/me')
      set({ user: data, loading: false })
    } catch {
      localStorage.removeItem('token')
      set({ user: null, token: null, loading: false })
    }
  },

  clearError: () => set({ error: null }),
}))

export default useAuthStore
