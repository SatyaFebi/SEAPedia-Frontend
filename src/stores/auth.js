import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { apiRequest } from '../utils/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('user')) || null)
  const activeRole = ref(localStorage.getItem('active_role') || null)

  const isLoggedIn = computed(() => user.value !== null)

  // Initialize and check user profile from backend on app start
  async function checkAuth() {
    const token = localStorage.getItem('api_token')
    if (!token) return

    try {
      const data = await apiRequest('/profile', { method: 'GET' })
      user.value = data.user
      localStorage.setItem('user', JSON.stringify(data.user))

      // If active role is invalid or not in current list of roles, reset it
      if (activeRole.value && !data.user.roles.includes(activeRole.value)) {
        activeRole.value = null
        localStorage.removeItem('active_role')
      }

      // Auto-select active role if user has exactly one role
      if (!activeRole.value && data.user.roles.length === 1) {
        setActiveRole(data.user.roles[0])
      }
    } catch (err) {
      console.error('Failed to authenticate token:', err)
      logout()
    }
  }

  // Register function
  async function register(userData) {
    try {
      const data = await apiRequest('/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      })

      localStorage.setItem('api_token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      user.value = data.user

      if (data.user.roles.length === 1) {
        setActiveRole(data.user.roles[0])
      } else {
        activeRole.value = null
        localStorage.removeItem('active_role')
      }

      return { success: true }
    } catch (err) {
      return { success: false, message: err.message }
    }
  }

  // Login function
  async function login(username, password) {
    try {
      const data = await apiRequest('/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      })

      localStorage.setItem('api_token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      user.value = data.user

      if (data.user.roles.length === 1) {
        setActiveRole(data.user.roles[0])
      } else {
        activeRole.value = null
        localStorage.removeItem('active_role')
      }

      return { success: true }
    } catch (err) {
      return { success: false, message: err.message }
    }
  }

  // Logout function
  async function logout() {
    try {
      await apiRequest('/logout', { method: 'POST' })
    } catch (err) {
      // Swallowing errors on logout if token is already invalidated
    } finally {
      localStorage.removeItem('api_token')
      localStorage.removeItem('user')
      localStorage.removeItem('active_role')
      user.value = null
      activeRole.value = null
    }
  }

  // Set active role session
  function setActiveRole(role) {
    if (user.value && user.value.roles.includes(role)) {
      activeRole.value = role
      localStorage.setItem('active_role', role)
      return true
    }
    return false
  }

  // Helper placeholder functions for balance adjustments in later levels
  function updateWalletBalance(amount) {
    if (user.value) {
      user.value.walletBalance = amount
      localStorage.setItem('user', JSON.stringify(user.value))
    }
  }

  function updateAddress(newAddress) {
    if (user.value) {
      user.value.address = newAddress
      localStorage.setItem('user', JSON.stringify(user.value))
    }
  }

  return {
    user,
    activeRole,
    isLoggedIn,
    checkAuth,
    register,
    login,
    logout,
    setActiveRole,
    updateWalletBalance,
    updateAddress
  }
})
