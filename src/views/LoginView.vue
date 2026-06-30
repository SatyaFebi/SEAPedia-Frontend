<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const router = useRouter()

const usernameInput = ref('')
const error = ref('')

function handleLogin(username) {
  error.value = ''
  const success = authStore.login(username)
  if (success) {
    // If the user has multiple roles, they must choose one in role selection
    if (authStore.user.roles.length > 1) {
      router.push({ name: 'role-selection' })
    } else {
      router.push({ name: `dashboard-${authStore.activeRole.toLowerCase()}` })
    }
  } else {
    error.value = 'Akun tidak ditemukan. Silakan masukkan username dengan benar.'
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 font-sans p-6">
    <div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
      <!-- Decorative sunset glow -->
      <div class="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl"></div>
      <div class="absolute bottom-0 left-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl"></div>

      <!-- Header -->
      <div class="text-center mb-8 relative z-10">
        <router-link to="/" class="inline-block text-3xl font-extrabold font-display bg-gradient-to-r from-amber-500 via-coral-500 to-rose-500 bg-clip-text text-transparent mb-2">
          SEAPedia
        </router-link>
        <p class="text-slate-400 text-sm">Masuk ke Platform Multi-Role Marketplace</p>
      </div>

      <!-- Login Form -->
      <form @submit.prevent="handleLogin(usernameInput)" class="space-y-6 relative z-10">
        <div>
          <label for="username" class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Username Pengguna
          </label>
          <div class="relative">
            <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">👤</span>
            <input
              id="username"
              type="text"
              v-model="usernameInput"
              placeholder="Masukkan budi, agus, siti, atau admin"
              class="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none transition-colors text-sm"
              required
            />
          </div>
          <p v-if="error" class="text-rose-500 text-xs mt-2 font-medium">{{ error }}</p>
        </div>

        <button
          type="submit"
          class="w-full py-3 bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bold rounded-xl hover:from-amber-600 hover:to-rose-600 transition-all shadow-lg shadow-rose-950/40 text-sm focus:outline-none"
        >
          Masuk Sekarang
        </button>
      </form>

      <!-- Quick Login Selectors -->
      <div class="mt-8 pt-6 border-t border-slate-800 relative z-10">
        <h4 class="text-xs font-bold text-slate-500 uppercase tracking-widest text-center mb-4">
          Quick-Login Simulasi Akun
        </h4>
        <div class="grid grid-cols-2 gap-3">
          <button
            v-for="mock in authStore.mockUsers"
            :key="mock.username"
            @click="handleLogin(mock.username)"
            class="p-3 bg-slate-950 border border-slate-800/80 rounded-xl hover:border-slate-700 hover:bg-slate-900/50 text-left transition-all group"
          >
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-200 group-hover:text-amber-400 truncate pr-1">
                {{ mock.name.split(' ')[0] }}
              </span>
              <span class="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-medium">
                {{ mock.username }}
              </span>
            </div>
            <!-- Roles badges -->
            <div class="flex flex-wrap gap-1 mt-2">
              <span
                v-for="role in mock.roles"
                :key="role"
                class="text-[9px] px-1 rounded-sm"
                :class="{
                  'bg-amber-950 text-amber-400 border border-amber-900/40': role === 'Buyer',
                  'bg-blue-950 text-blue-400 border border-blue-900/40': role === 'Seller',
                  'bg-emerald-950 text-emerald-400 border border-emerald-900/40': role === 'Driver',
                  'bg-purple-950 text-purple-400 border border-purple-900/40': role === 'Admin',
                }"
              >
                {{ role }}
              </span>
            </div>
          </button>
        </div>
      </div>

      <div class="text-center mt-6">
        <router-link to="/" class="text-xs text-slate-500 hover:text-slate-300">
          ← Kembali ke Toko Utama
        </router-link>
      </div>
    </div>
  </div>
</template>
