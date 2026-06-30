<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const router = useRouter()

const user = computed(() => authStore.user)

// Redirect if not logged in
onMounted(() => {
  if (!authStore.isLoggedIn) {
    router.push({ name: 'login' })
  } else if (user.value.roles.length === 1) {
    // If only one role, select automatically and bypass selection
    authStore.setActiveRole(user.value.roles[0])
    router.push({ name: `dashboard-${user.value.roles[0].toLowerCase()}` })
  }
})

function selectRole(role) {
  if (authStore.setActiveRole(role)) {
    router.push({ name: `dashboard-${role.toLowerCase()}` })
  }
}

function getRoleDescription(role) {
  if (role === 'Buyer') return 'Beli barang, isi saldo wallet, lacak pesanan, dan tulis review.'
  if (role === 'Seller') return 'Kelola toko Anda, tambah produk, proses pesanan masuk, dan pantau omzet.'
  if (role === 'Driver') return 'Cari pekerjaan pengiriman, antarkan pesanan, dan raih komisi.'
  return ''
}

function getRoleIcon(role) {
  if (role === 'Buyer') return '🛒'
  if (role === 'Seller') return '🏪'
  if (role === 'Driver') return '🛵'
  return '👤'
}

function getRoleTheme(role) {
  if (role === 'Buyer') return 'hover:border-amber-500 hover:shadow-amber-950/20 text-amber-400'
  if (role === 'Seller') return 'hover:border-blue-500 hover:shadow-blue-950/20 text-blue-400'
  if (role === 'Driver') return 'hover:border-emerald-500 hover:shadow-emerald-950/20 text-emerald-400'
  return 'hover:border-slate-500 text-slate-400'
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 font-sans p-6">
    <div v-if="user" class="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
      <!-- Decorative background blur -->
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-tr from-amber-500/5 to-rose-500/5 rounded-full blur-3xl"></div>

      <!-- Header -->
      <div class="text-center mb-8 relative z-10">
        <span class="text-3xl font-extrabold font-display bg-gradient-to-r from-amber-500 via-coral-500 to-rose-500 bg-clip-text text-transparent">
          SEAPedia
        </span>
        <h2 class="text-xl font-bold text-slate-200 mt-3">Pilih Peran Aktif Anda</h2>
        <p class="text-slate-400 text-sm mt-1">Akun Anda memiliki beberapa peran. Pilih salah satu untuk memulai sesi.</p>
      </div>

      <!-- Roles Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
        <button
          v-for="role in user.roles"
          :key="role"
          @click="selectRole(role)"
          class="p-6 bg-slate-950 border border-slate-850 rounded-xl text-left transition-all hover:bg-slate-900/60 shadow-lg cursor-pointer group"
          :class="getRoleTheme(role)"
        >
          <div class="flex items-center justify-between mb-4">
            <span class="text-3xl">{{ getRoleIcon(role) }}</span>
            <span class="text-xs bg-slate-900 px-2.5 py-1 rounded-full text-slate-400 font-medium group-hover:text-slate-200 transition-colors">
              Pilih →
            </span>
          </div>
          <h3 class="text-lg font-bold text-slate-200 group-hover:text-inherit transition-colors">{{ role }}</h3>
          <p class="text-slate-400 text-xs mt-2 leading-relaxed">
            {{ getRoleDescription(role) }}
          </p>
        </button>
      </div>

      <div class="text-center mt-8 relative z-10 pt-4 border-t border-slate-800/80">
        <button
          @click="authStore.logout(); router.push('/login')"
          class="text-xs text-slate-500 hover:text-slate-300"
        >
          Ganti Akun Lain
        </button>
      </div>
    </div>
  </div>
</template>
