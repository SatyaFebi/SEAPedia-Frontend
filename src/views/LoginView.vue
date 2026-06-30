<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import Input from '../components/Input.vue'
import Button from '../components/Button.vue'

const authStore = useAuthStore()
const router = useRouter()

const usernameInput = ref('')
const passwordInput = ref('')
const error = ref('')
const isLoading = ref(false)

// Quick login helper profiles
const mockLoginUsers = [
  { name: 'Budi Santoso', username: 'budi', roles: ['Buyer', 'Seller'] },
  { name: 'Agus Setiawan', username: 'agus', roles: ['Buyer', 'Seller', 'Driver'] },
  { name: 'Siti Rahma', username: 'siti', roles: ['Buyer', 'Driver'] },
  { name: 'Super Admin', username: 'admin', roles: ['Admin'] },
]

async function handleLogin() {
  error.value = ''
  isLoading.value = true

  const result = await authStore.login(usernameInput.value, passwordInput.value)
  isLoading.value = false

  if (result.success) {
    if (authStore.user.roles.length > 1) {
      router.push({ name: 'role-selection' })
    } else {
      router.push({ name: `dashboard-${authStore.activeRole.toLowerCase()}` })
    }
  } else {
    error.value = result.message || 'Login gagal. Periksa kembali data Anda.'
  }
}

function handleQuickLogin(username) {
  usernameInput.value = username
  passwordInput.value = 'password123'
  handleLogin()
}
</script>

<template>
  <div class="min-h-screen bg-[#FAFAFA] flex font-sans">

    <!-- Left branding panel -->
    <div class="hidden lg:flex flex-col justify-between w-80 bg-primary-600 p-10 text-white shrink-0">
      <div>
        <div class="flex items-center gap-2.5 mb-16">
          <div class="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <span class="font-display font-bold text-white text-sm">S</span>
          </div>
          <span class="font-display font-bold text-white text-lg tracking-tight">SEAPedia</span>
        </div>
        <h2 class="font-display font-bold text-2xl leading-snug">
          Platform Marketplace<br>Multi-Role Nusantara
        </h2>
        <p class="text-primary-100 text-sm mt-4 leading-relaxed">
          Satu platform untuk berbelanja, berjualan, dan mengantarkan produk lokal.
        </p>
      </div>
      <div class="space-y-3">
        <div v-for="role in ['🛒 Buyer', '🏪 Seller', '🛵 Driver']" :key="role" class="flex items-center gap-3 text-sm text-primary-100">
          <span class="w-1.5 h-1.5 rounded-full bg-primary-300"></span>{{ role }}
        </div>
      </div>
    </div>

    <!-- Right form panel -->
    <div class="flex-1 flex items-center justify-center p-6 overflow-y-auto">
      <div class="w-full max-w-sm space-y-8 py-8">

        <!-- Logo mobile only -->
        <div class="lg:hidden text-center">
          <div class="inline-flex items-center gap-2">
            <div class="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center">
              <span class="font-display font-bold text-white text-sm">S</span>
            </div>
            <span class="font-display font-bold text-[#0D1117] text-lg">SEAPedia</span>
          </div>
        </div>

        <!-- Heading -->
        <div class="space-y-1">
          <h1 class="font-display font-bold text-[#0D1117] text-2xl">Selamat datang</h1>
          <p class="text-[#6B7280] text-sm">Masuk ke akun Anda untuk melanjutkan.</p>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleLogin" class="space-y-4">
          <Input
            id="username"
            v-model="usernameInput"
            label="Username / Email"
            placeholder="cth. budi, siti, agus, admin"
            required
          />

          <Input
            id="password"
            v-model="passwordInput"
            type="password"
            label="Kata Sandi"
            placeholder="Masukkan kata sandi Anda"
            required
          />

          <p v-if="error" class="text-accent-rose-500 text-xs mt-2">{{ error }}</p>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            class="w-full justify-center mt-6"
            :disabled="isLoading"
          >
            {{ isLoading ? 'Masuk...' : 'Masuk' }}
          </Button>
        </form>

        <div class="text-center text-xs text-[#9CA3AF]">
          Belum punya akun?
          <router-link to="/register" class="font-semibold text-primary-600 hover:text-primary-700 transition-colors ml-1">
            Daftar sekarang
          </router-link>
        </div>

        <!-- Quick login -->
        <div class="space-y-3">
          <div class="flex items-center gap-3">
            <div class="flex-1 h-px bg-[#E5E8EC]"></div>
            <span class="text-xs text-[#9CA3AF]">Quick Login (Sandi: password123)</span>
            <div class="flex-1 h-px bg-[#E5E8EC]"></div>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="mock in mockLoginUsers"
              :key="mock.username"
              @click="handleQuickLogin(mock.username)"
              class="group p-3 bg-white border border-[#E5E8EC] rounded-xl text-left hover:border-primary-300 hover:shadow-xs transition-all cursor-pointer"
            >
              <p class="text-sm font-semibold text-[#0D1117] group-hover:text-primary-700 transition-colors truncate">
                {{ mock.name.split(' ')[0] }}
              </p>
              <p class="text-xs text-[#9CA3AF] mt-0.5">{{ mock.username }}</p>
              <div class="flex flex-wrap gap-1 mt-2">
                <span
                  v-for="role in mock.roles"
                  :key="role"
                  class="badge text-[9px] px-1.5 py-0.5"
                  :class="{
                    'badge-amber': role === 'Buyer',
                    'badge-blue': role === 'Seller',
                    'badge-green': role === 'Driver',
                    'badge-gray': role === 'Admin',
                  }"
                >{{ role }}</span>
              </div>
            </button>
          </div>
        </div>

        <router-link to="/" class="block text-center text-xs text-[#9CA3AF] hover:text-[#374151] transition-colors">
          ← Kembali ke toko utama
        </router-link>
      </div>
    </div>
  </div>
</template>
