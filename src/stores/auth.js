import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const activeRole = ref(null)

  // Mock users database
  const mockUsers = [
    {
      id: 'usr-budi',
      name: 'Budi Santoso',
      username: 'budi',
      roles: ['Buyer', 'Seller'],
      store: {
        id: 'str-budi',
        name: 'Budi Lestari Jaya',
      },
      walletBalance: 1500000,
      address: 'Jl. Pemuda No. 12, Jakarta Pusat',
    },
    {
      id: 'usr-agus',
      name: 'Agus Setiawan',
      username: 'agus',
      roles: ['Buyer', 'Seller', 'Driver'],
      store: {
        id: 'str-agus',
        name: 'Agus Motor & Parts',
      },
      walletBalance: 2500000,
      address: 'Jl. Merdeka No. 45, Bandung',
    },
    {
      id: 'usr-siti',
      name: 'Siti Rahma',
      username: 'siti',
      roles: ['Buyer', 'Driver'],
      store: null,
      walletBalance: 500000,
      address: 'Jl. Sudirman No. 88, Surabaya',
    },
    {
      id: 'usr-admin',
      name: 'Super Admin',
      username: 'admin',
      roles: ['Admin'],
      store: null,
      walletBalance: 0,
      address: 'HQ SEAPedia, Jakarta',
    }
  ]

  const isLoggedIn = computed(() => user.value !== null)
  
  function login(username) {
    const found = mockUsers.find(u => u.username.toLowerCase() === username.toLowerCase().trim())
    if (found) {
      user.value = { ...found }
      // If user only has one role, set it automatically as active
      if (found.roles.length === 1) {
        activeRole.value = found.roles[0]
      } else {
        activeRole.value = null // Must select role first
      }
      return true
    }
    return false
  }

  function logout() {
    user.value = null
    activeRole.value = null
  }

  function setActiveRole(role) {
    if (user.value && user.value.roles.includes(role)) {
      activeRole.value = role
      return true
    }
    return false
  }

  function updateWalletBalance(amount) {
    if (user.value) {
      user.value.walletBalance = amount
      // Update our local mockDB record too for consistency
      const dbUser = mockUsers.find(u => u.id === user.value.id)
      if (dbUser) dbUser.walletBalance = amount
    }
  }

  function updateAddress(newAddress) {
    if (user.value) {
      user.value.address = newAddress
      const dbUser = mockUsers.find(u => u.id === user.value.id)
      if (dbUser) dbUser.address = newAddress
    }
  }

  return {
    user,
    activeRole,
    mockUsers,
    isLoggedIn,
    login,
    logout,
    setActiveRole,
    updateWalletBalance,
    updateAddress
  }
})
