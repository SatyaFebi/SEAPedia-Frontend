<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const router = useRouter()
const user = computed(() => authStore.user)

onMounted(() => {
  if (!authStore.isLoggedIn) {
    router.push({ name: 'login' })
  } else if (user.value.roles.length === 1) {
    authStore.setActiveRole(user.value.roles[0])
    router.push({ name: `dashboard-${user.value.roles[0].toLowerCase()}` })
  }
})

function selectRole(role) {
  if (authStore.setActiveRole(role)) {
    router.push({ name: `dashboard-${role.toLowerCase()}` })
  }
}

const roleConfig = {
  Buyer: { icon: '🛒', desc: 'Beli barang, isi wallet, lacak pesanan.' },
  Seller: { icon: '🏪', desc: 'Kelola toko, tambah produk, proses pesanan.' },
  Driver: { icon: '🛵', desc: 'Ambil job pengiriman dan raih komisi.' },
}
</script>

<template>
  <div class="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-6 font-sans">
    <div v-if="user" class="w-full max-w-lg space-y-8">
      <!-- Header -->
      <div class="text-center space-y-1">
        <div class="inline-flex items-center gap-2 mb-4">
          <div class="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center">
            <span class="font-display font-bold text-white text-sm">S</span>
          </div>
          <span class="font-display font-bold text-[#0D1117] text-lg">SEAPedia</span>
        </div>
        <h1 class="font-display font-bold text-[#0D1117] text-2xl">Pilih Peran Aktif</h1>
        <p class="text-[#6B7280] text-sm">
          Akun <strong class="text-[#374151]">{{ user.name }}</strong> memiliki beberapa peran.
          Pilih untuk memulai sesi.
        </p>
      </div>

      <!-- Role cards -->
      <div class="grid grid-cols-1 gap-3">
        <button
          v-for="role in user.roles"
          :key="role"
          @click="selectRole(role)"
          class="group card-hover p-5 text-left flex items-center gap-5 transition-all cursor-pointer active:scale-[0.99]"
        >
          <div
            class="w-12 h-12 rounded-xl bg-[#F4F6F8] flex items-center justify-center text-2xl shrink-0 group-hover:bg-primary-50 transition-colors"
          >
            {{ roleConfig[role]?.icon || '👤' }}
          </div>
          <div class="flex-1 min-w-0">
            <p
              class="font-display font-semibold text-[#0D1117] text-base group-hover:text-primary-700 transition-colors"
            >
              {{ role }}
            </p>
            <p class="text-xs text-[#9CA3AF] mt-0.5 leading-relaxed">
              {{ roleConfig[role]?.desc || '' }}
            </p>
          </div>
          <span
            class="text-[#9CA3AF] group-hover:text-primary-600 transition-colors text-lg shrink-0"
            >→</span
          >
        </button>
      </div>

      <div class="text-center">
        <button
          @click="
            authStore.logout()
            router.push('/login')
          "
          class="text-xs text-[#9CA3AF] hover:text-[#374151] transition-colors cursor-pointer"
        >
          Ganti akun lain
        </button>
      </div>
    </div>
  </div>
</template>
