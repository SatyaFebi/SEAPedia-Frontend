<script setup>
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useOrdersStore } from '../stores/orders'

const authStore = useAuthStore()
const ordersStore = useOrdersStore()
const router = useRouter()
const route = useRoute()

const user = computed(() => authStore.user)
const activeRole = computed(() => authStore.activeRole)
const simulatedDay = computed(() => ordersStore.simulatedDay)

const hasMultipleRoles = computed(() => user.value?.roles.length > 1)
const isProfileModalOpen = ref(false)

async function handleLogout() {
  await authStore.logout()
  router.push({ name: 'landing' })
}

function handleSwitchRole(role) {
  if (authStore.setActiveRole(role)) {
    router.push({ name: `dashboard-${role.toLowerCase()}` })
  }
}

const roleConfig = {
  Buyer: { icon: '🛒', route: 'dashboard-buyer', label: 'Layanan Buyer' },
  Seller: { icon: '🏪', route: 'dashboard-seller', label: 'Toko Saya' },
  Driver: { icon: '🛵', route: 'dashboard-driver', label: 'Driver Workspace' },
  Admin: { icon: '🛡️', route: 'dashboard-admin', label: 'Panel Admin' },
}
</script>

<template>
  <div class="min-h-screen flex flex-col md:flex-row bg-[#FAFAFA] font-sans text-[#374151]">
    <!-- ── Sidebar ── -->
    <aside class="w-full md:w-64 shrink-0 bg-white border-r border-[#E5E8EC] flex flex-col">
      <!-- Logo -->
      <div class="h-16 px-6 flex items-center border-b border-[#E5E8EC]">
        <router-link to="/" class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center">
            <span class="text-white font-display font-bold text-sm">S</span>
          </div>
          <span class="font-display font-bold text-[#0D1117] text-lg tracking-tight">SEAPedia</span>
        </router-link>
      </div>

      <!-- User info -->
      <div class="px-4 py-4 border-b border-[#E5E8EC]">
        <div class="flex items-center gap-3">
          <div
            class="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center font-display font-bold text-white text-sm shrink-0"
          >
            {{ user?.name ? user.name[0].toUpperCase() : 'U' }}
          </div>
          <div class="min-w-0">
            <p class="text-sm font-semibold text-[#0D1117] truncate">{{ user?.name }}</p>
            <div class="flex items-center gap-1.5 mt-0.5">
              <span class="w-1.5 h-1.5 rounded-full bg-primary-500"></span>
              <span class="text-xs text-[#6B7280]">{{ activeRole }}</span>
            </div>
          </div>
        </div>

        <!-- Wallet (Buyer only) -->
        <div
          v-if="activeRole === 'Buyer' && user"
          class="mt-3 px-3 py-2.5 rounded-lg bg-[#F4F6F8] border border-[#E5E8EC] flex items-center justify-between"
        >
          <span class="text-xs text-[#6B7280]">Saldo Wallet</span>
          <span class="text-sm font-semibold text-primary-700 font-display">
            Rp{{ user.walletBalance.toLocaleString('id-ID') }}
          </span>
        </div>

        <!-- Role & Balance Summary Button -->
        <button
          v-if="user"
          @click="isProfileModalOpen = true"
          class="mt-2.5 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary-50 border border-primary-100 hover:bg-primary-100/60 transition-all text-xs font-semibold text-primary-700 cursor-pointer"
        >
          ℹ️ Info Multi-Peran &amp; Saldo
        </button>
      </div>

      <!-- Nav -->
      <nav class="flex-1 p-3 space-y-0.5">
        <p class="section-label px-3 pt-2 pb-2">Menu</p>

        <router-link
          to="/"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-[#6B7280] hover:bg-[#F4F6F8] hover:text-[#0D1117]"
        >
          <span class="text-base">🏠</span>
          <span>Halaman Utama</span>
        </router-link>

        <div class="divider my-2"></div>

        <template v-if="activeRole && roleConfig[activeRole]">
          <router-link
            :to="`/dashboard/${activeRole.toLowerCase()}`"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors font-medium"
            :class="
              route.name === roleConfig[activeRole].route
                ? 'bg-primary-50 text-primary-700'
                : 'text-[#374151] hover:bg-[#F4F6F8] hover:text-[#0D1117]'
            "
          >
            <span class="text-base">{{ roleConfig[activeRole].icon }}</span>
            <span>{{ roleConfig[activeRole].label }}</span>
          </router-link>
        </template>
      </nav>

      <!-- Footer -->
      <div class="p-3 border-t border-[#E5E8EC] space-y-2">
        <!-- Switch Role -->
        <div v-if="hasMultipleRoles" class="relative group">
          <button
            class="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs text-[#374151] hover:bg-[#F4F6F8] transition-colors border border-[#E5E8EC] bg-white"
          >
            <span class="flex items-center gap-2">🔄 Ganti Peran</span>
            <span class="text-[#9CA3AF]">▾</span>
          </button>
          <div
            class="absolute bottom-full left-0 right-0 pb-1.5 hidden group-hover:block z-20"
          >
            <div class="bg-white border border-[#E5E8EC] rounded-xl shadow-lg overflow-hidden p-1">
              <button
                v-for="role in user.roles"
                :key="role"
                @click="handleSwitchRole(role)"
                class="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-[#F4F6F8] flex items-center justify-between transition-colors"
                :class="activeRole === role ? 'text-primary-700 font-semibold' : 'text-[#374151]'"
              >
                <span>{{ role }}</span>
                <span v-if="activeRole === role" class="text-primary-600">✓</span>
              </button>
            </div>
          </div>
        </div>

        <button @click="handleLogout" class="btn-danger w-full text-xs py-2">🚪 Keluar Sesi</button>
      </div>
    </aside>

    <!-- ── Main content ── -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Topbar -->
      <header
        class="h-16 bg-white border-b border-[#E5E8EC] px-6 flex items-center justify-between shrink-0"
      >
        <h1 class="font-display font-semibold text-[#0D1117] text-base hidden md:block">
          Dashboard <span class="text-[#6B7280] font-normal">/ {{ activeRole }}</span>
        </h1>

        <div class="flex items-center gap-3 ml-auto">
          <!-- SLA Day chip -->
          <div
            class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F4F6F8] border border-[#E5E8EC] text-xs text-[#374151]"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse"></span>
            <span
              >Hari <strong class="font-semibold">{{ simulatedDay }}</strong></span
            >
          </div>

          <!-- Store link -->
          <router-link to="/" class="btn-secondary btn-sm hidden sm:inline-flex">
            🛍️ Toko
          </router-link>
        </div>
      </header>

      <!-- Page slot -->
      <main class="flex-1 overflow-y-auto p-6 md:p-8 bg-[#FAFAFA]">
        <RouterView />
      </main>
    </div>

    <!-- ── Profile Summary Modal ── -->
    <div
      v-if="isProfileModalOpen && user"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D1117]/40 backdrop-blur-sm"
    >
      <div
        class="w-full max-w-sm bg-white rounded-2xl border border-[#E5E8EC] p-6 shadow-xl space-y-4"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-2.5">
            <div
              class="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold"
            >
              👤
            </div>
            <div>
              <h3 class="font-display font-bold text-[#0D1117] text-sm">
                Profil &amp; Finansial Akun
              </h3>
              <p class="text-[10px] text-[#9CA3AF]">Username: @{{ user.username }}</p>
            </div>
          </div>
          <button
            @click="isProfileModalOpen = false"
            class="w-6 h-6 flex items-center justify-center rounded-lg bg-[#F4F6F8] text-[#6B7280] hover:text-[#0D1117] hover:bg-[#E5E8EC] transition-colors text-[10px] cursor-pointer shrink-0"
          >
            ✕
          </button>
        </div>

        <div class="space-y-3">
          <!-- User Details -->
          <div class="bg-[#F4F6F8] rounded-xl p-3 space-y-1.5 text-xs">
            <div class="flex justify-between">
              <span class="text-[#6B7280]">Nama Lengkap</span>
              <span class="font-semibold text-[#374151]">{{ user.name }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-[#6B7280]">Email</span>
              <span class="font-semibold text-[#374151] truncate max-w-[180px]">{{
                user.email
              }}</span>
            </div>
          </div>

          <!-- Roles Owned -->
          <div class="space-y-1.5">
            <p class="section-label">Peran yang Dimiliki</p>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="role in ['Buyer', 'Seller', 'Driver', 'Admin']"
                :key="role"
                class="badge text-[10px] px-2 py-0.5"
                :class="
                  user.roles.includes(role)
                    ? activeRole === role
                      ? 'bg-primary-600 text-white font-semibold'
                      : 'bg-primary-50 text-primary-700 border border-primary-100'
                    : 'bg-gray-100 text-[#9CA3AF] opacity-40'
                "
              >
                {{ role }} <span v-if="activeRole === role" class="ml-1 text-[8px]">● Aktif</span>
              </span>
            </div>
          </div>

          <!-- Financial summary placeholders across roles -->
          <div class="space-y-1.5">
            <p class="section-label">Ringkasan Saldo (Multi-Role)</p>
            <div class="space-y-1">
              <!-- Buyer balance -->
              <div
                class="flex items-center justify-between p-2 rounded-lg bg-[#F4F6F8] border border-[#E5E8EC] text-xs"
              >
                <span class="flex items-center gap-1"
                  >🛒 Buyer <span class="text-[#9CA3AF]">(Wallet)</span></span
                >
                <span class="font-semibold text-[#0D1117]">{{
                  user.roles.includes('Buyer')
                    ? 'Rp' + user.walletBalance.toLocaleString('id-ID')
                    : '-'
                }}</span>
              </div>
              <!-- Seller balance -->
              <div
                class="flex items-center justify-between p-2 rounded-lg bg-[#F4F6F8] border border-[#E5E8EC] text-xs"
              >
                <span class="flex items-center gap-1"
                  >🏪 Seller <span class="text-[#9CA3AF]">(Income)</span></span
                >
                <span class="font-semibold text-[#0D1117]">{{
                  user.roles.includes('Seller')
                    ? 'Rp' + (user.sellerIncome || 0).toLocaleString('id-ID')
                    : '-'
                }}</span>
              </div>
              <!-- Driver balance -->
              <div
                class="flex items-center justify-between p-2 rounded-lg bg-[#F4F6F8] border border-[#E5E8EC] text-xs"
              >
                <span class="flex items-center gap-1"
                  >🛵 Driver <span class="text-[#9CA3AF]">(Earnings)</span></span
                >
                <span class="font-semibold text-[#0D1117]">{{
                  user.roles.includes('Driver')
                    ? 'Rp' + (user.driverEarnings || 0).toLocaleString('id-ID')
                    : '-'
                }}</span>
              </div>
            </div>
          </div>
        </div>

        <button
          @click="isProfileModalOpen = false"
          class="btn-primary w-full justify-center text-xs py-2"
        >
          Tutup
        </button>
      </div>
    </div>
  </div>
</template>
