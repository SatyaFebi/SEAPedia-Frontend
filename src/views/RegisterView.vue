<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import Input from '../components/Input.vue'
import Button from '../components/Button.vue'

const authStore = useAuthStore()
const router = useRouter()

const name = ref('')
const username = ref('')
const email = ref('')
const password = ref('')
const selectedRoles = ref(['Buyer']) // default is Buyer

const error = ref('')
const isLoading = ref(false)

async function handleRegister() {
  if (selectedRoles.value.length === 0) {
    error.value = 'Anda harus memilih minimal satu peran aktif.'
    return
  }

  error.value = ''
  isLoading.value = true

  const result = await authStore.register({
    name: name.value,
    username: username.value,
    email: email.value,
    password: password.value,
    roles: selectedRoles.value,
  })

  isLoading.value = false

  if (result.success) {
    if (authStore.user.roles.length > 1) {
      router.push({ name: 'role-selection' })
    } else {
      router.push({ name: `dashboard-${authStore.activeRole.toLowerCase()}` })
    }
  } else {
    error.value = result.message || 'Pendaftaran gagal. Silakan coba lagi.'
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#FAFAFA] flex font-sans">
    <!-- Left branding panel -->
    <div
      class="hidden lg:flex flex-col justify-between w-80 bg-primary-600 p-10 text-white shrink-0"
    >
      <div>
        <div class="flex items-center gap-2.5 mb-16">
          <div class="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <span class="font-display font-bold text-white text-sm">S</span>
          </div>
          <span class="font-display font-bold text-white text-lg tracking-tight">SEAPedia</span>
        </div>
        <h2 class="font-display font-bold text-2xl leading-snug">
          Gabung Bersama<br />Marketplace Nusantara
        </h2>
        <p class="text-primary-100 text-sm mt-4 leading-relaxed">
          Daftarkan akun baru untuk mulai berbelanja, berjualan, atau mengantarkan produk lokal.
        </p>
      </div>
      <div class="space-y-3">
        <div
          v-for="role in ['🛒 Buyer', '🏪 Seller', '🛵 Driver']"
          :key="role"
          class="flex items-center gap-3 text-sm text-primary-100"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-primary-300"></span>{{ role }}
        </div>
      </div>
    </div>

    <!-- Right form panel -->
    <div class="flex-1 flex items-center justify-center p-6 overflow-y-auto">
      <div class="w-full max-w-md space-y-8 py-8">
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
        <div class="space-y-1 text-left">
          <h1 class="font-display font-bold text-[#0D1117] text-2xl">Daftar Akun Baru</h1>
          <p class="text-[#6B7280] text-sm">
            Isi detail di bawah ini untuk bergabung dengan SEAPedia.
          </p>
        </div>

        <!-- Error display -->
        <div
          v-if="error"
          class="p-3.5 bg-accent-rose-50 border border-accent-rose-100 rounded-xl text-xs text-accent-rose-600 font-medium"
        >
          {{ error }}
        </div>

        <!-- Form -->
        <form @submit.prevent="handleRegister" class="space-y-4">
          <Input
            id="name"
            v-model="name"
            label="Nama Lengkap"
            placeholder="cth. Budi Santoso"
            required
          />

          <Input
            id="username"
            v-model="username"
            label="Username"
            placeholder="cth. budisantoso"
            required
          />

          <Input
            id="email"
            v-model="email"
            type="email"
            label="Email"
            placeholder="cth. budi@seapedia.test"
            required
          />

          <Input
            id="password"
            v-model="password"
            type="password"
            label="Kata Sandi"
            placeholder="Minimal 6 karakter"
            required
          />

          <!-- Roles selection -->
          <div class="space-y-2">
            <label class="input-label">Pilih Peran Akun (Bisa pilih lebih dari satu)</label>
            <div class="grid grid-cols-3 gap-2">
              <label
                v-for="role in [
                  { name: 'Buyer', icon: '🛒', desc: 'Belanja' },
                  { name: 'Seller', icon: '🏪', desc: 'Jualan' },
                  { name: 'Driver', icon: '🛵', desc: 'Antar' },
                ]"
                :key="role.name"
                class="flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer select-none bg-white"
                :class="
                  selectedRoles.includes(role.name)
                    ? 'border-primary-500 bg-primary-50/30 text-primary-700'
                    : 'border-[#E5E8EC] hover:border-primary-200 text-[#374151]'
                "
              >
                <input type="checkbox" :value="role.name" v-model="selectedRoles" class="hidden" />
                <span class="text-xl mb-1">{{ role.icon }}</span>
                <span class="text-xs font-semibold">{{ role.name }}</span>
                <span class="text-[9px] text-[#9CA3AF] mt-0.5">{{ role.desc }}</span>
              </label>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            class="w-full justify-center mt-6"
            :disabled="isLoading"
          >
            {{ isLoading ? 'Mendaftar...' : 'Daftar Sekarang' }}
          </Button>
        </form>

        <div class="text-center text-xs text-[#9CA3AF]">
          Sudah punya akun?
          <router-link
            to="/login"
            class="font-semibold text-primary-600 hover:text-primary-700 transition-colors ml-1"
          >
            Masuk di sini
          </router-link>
        </div>

        <router-link
          to="/"
          class="block text-center text-xs text-[#9CA3AF] hover:text-[#374151] transition-colors mt-2"
        >
          ← Kembali ke toko utama
        </router-link>
      </div>
    </div>
  </div>
</template>
