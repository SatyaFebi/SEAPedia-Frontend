<script setup>
import { computed } from 'vue'
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

function handleLogout() {
  authStore.logout()
  router.push({ name: 'landing' })
}

function handleSwitchRole(role) {
  if (authStore.setActiveRole(role)) {
    router.push({ name: `dashboard-${role.toLowerCase()}` })
  }
}

const currentRoleIcon = computed(() => {
  if (activeRole.value === 'Buyer') return '🛒'
  if (activeRole.value === 'Seller') return '🏪'
  if (activeRole.value === 'Driver') return '🛵'
  if (activeRole.value === 'Admin') return '🛡️'
  return '👤'
})
</script>

<template>
  <div class="min-h-screen flex flex-col md:flex-row bg-slate-900 text-slate-100 font-sans">
    <!-- Sidebar -->
    <aside class="w-full md:w-64 bg-slate-950 border-r border-slate-800 flex flex-col">
      <!-- Logo -->
      <div class="p-6 border-b border-slate-800 flex items-center justify-between">
        <router-link to="/" class="flex items-center gap-2 group">
          <span class="text-2xl font-extrabold font-display bg-gradient-to-r from-amber-500 via-coral-500 to-rose-500 bg-clip-text text-transparent">
            SEAPedia
          </span>
          <span class="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-400">v1.0</span>
        </router-link>
      </div>

      <!-- User Profile Summary & Active Role -->
      <div class="p-6 border-b border-slate-800 bg-slate-900/50">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center font-bold text-white text-lg">
            {{ user?.name ? user.name[0] : 'U' }}
          </div>
          <div class="overflow-hidden">
            <h4 class="font-semibold text-sm text-slate-200 truncate">{{ user?.name }}</h4>
            <div class="flex items-center gap-1.5 mt-0.5">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span class="text-xs text-slate-400 font-medium">Aktif: {{ activeRole }}</span>
            </div>
          </div>
        </div>

        <!-- Wallet chip for Buyer -->
        <div v-if="activeRole === 'Buyer' && user" class="mt-4 p-3 rounded-lg bg-emerald-950/40 border border-emerald-900/50 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-emerald-400">💵</span>
            <div>
              <p class="text-[10px] text-emerald-500 uppercase font-bold tracking-wider">Saldo Wallet</p>
              <p class="text-sm font-bold text-emerald-300">Rp{{ user.walletBalance.toLocaleString('id-ID') }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar Navigation Options based on Active Role -->
      <nav class="flex-1 p-4 space-y-1">
        <!-- Common Landing Link -->
        <router-link
          to="/"
          class="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition-colors text-sm"
        >
          <span>🏠</span>
          <span>Halaman Utama</span>
        </router-link>

        <div class="h-px bg-slate-800 my-4"></div>

        <p class="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">MENU DASHBOARD</p>

        <!-- BUYER NAVIGATION -->
        <template v-if="activeRole === 'Buyer'">
          <router-link
            to="/dashboard/buyer"
            class="flex items-center justify-between px-4 py-3 rounded-lg text-sm transition-colors"
            :class="route.name === 'dashboard-buyer' ? 'bg-gradient-to-r from-amber-500/10 to-rose-500/10 border-l-2 border-amber-500 text-amber-400 font-medium' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'"
          >
            <div class="flex items-center gap-3">
              <span>🛒</span>
              <span>Layanan Buyer</span>
            </div>
          </router-link>
        </template>

        <!-- SELLER NAVIGATION -->
        <template v-if="activeRole === 'Seller'">
          <router-link
            to="/dashboard/seller"
            class="flex items-center justify-between px-4 py-3 rounded-lg text-sm transition-colors"
            :class="route.name === 'dashboard-seller' ? 'bg-gradient-to-r from-amber-500/10 to-rose-500/10 border-l-2 border-amber-500 text-amber-400 font-medium' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'"
          >
            <div class="flex items-center gap-3">
              <span>🏪</span>
              <span>Toko Saya (Seller)</span>
            </div>
          </router-link>
        </template>

        <!-- DRIVER NAVIGATION -->
        <template v-if="activeRole === 'Driver'">
          <router-link
            to="/dashboard/driver"
            class="flex items-center justify-between px-4 py-3 rounded-lg text-sm transition-colors"
            :class="route.name === 'dashboard-driver' ? 'bg-gradient-to-r from-amber-500/10 to-rose-500/10 border-l-2 border-amber-500 text-amber-400 font-medium' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'"
          >
            <div class="flex items-center gap-3">
              <span>🛵</span>
              <span>Layanan Driver</span>
            </div>
          </router-link>
        </template>

        <!-- ADMIN NAVIGATION -->
        <template v-if="activeRole === 'Admin'">
          <router-link
            to="/dashboard/admin"
            class="flex items-center justify-between px-4 py-3 rounded-lg text-sm transition-colors"
            :class="route.name === 'dashboard-admin' ? 'bg-gradient-to-r from-amber-500/10 to-rose-500/10 border-l-2 border-amber-500 text-amber-400 font-medium' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'"
          >
            <div class="flex items-center gap-3">
              <span>🛡️</span>
              <span>Panel Admin</span>
            </div>
          </router-link>
        </template>
      </nav>

      <!-- Sidebar Footer -->
      <div class="p-4 border-t border-slate-800 space-y-2">
        <!-- Switch Role (if has multiple) -->
        <div v-if="hasMultipleRoles" class="relative group">
          <button class="w-full flex items-center justify-between px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs hover:border-slate-700 transition-colors">
            <span class="flex items-center gap-1.5">
              <span>🔄</span> Ganti Peran
            </span>
            <span>▼</span>
          </button>
          
          <div class="absolute bottom-full left-0 right-0 mb-1 hidden group-hover:block bg-slate-950 border border-slate-800 rounded-lg shadow-xl z-20 overflow-hidden">
            <button
              v-for="role in user.roles"
              :key="role"
              @click="handleSwitchRole(role)"
              class="w-full text-left px-4 py-2 text-xs hover:bg-slate-900 flex items-center justify-between"
              :class="activeRole === role ? 'text-amber-400 font-bold bg-slate-900/50' : 'text-slate-300'"
            >
              <span>{{ role }}</span>
              <span v-if="activeRole === role">✓</span>
            </button>
          </div>
        </div>

        <!-- Logout button -->
        <button
          @click="handleLogout"
          class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/50 text-rose-400 rounded-lg text-xs transition-colors"
        >
          <span>🚪</span> Keluar Sesi
        </button>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Navbar / Top bar -->
      <header class="h-16 bg-slate-950 border-b border-slate-800 px-6 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <span class="text-xl font-bold text-slate-200 md:block hidden">
            {{ activeRole }} Dashboard
          </span>
        </div>

        <div class="flex items-center gap-4">
          <!-- SLA Day Indicator -->
          <div class="bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-full flex items-center gap-2 text-xs text-slate-300">
            <span class="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
            <span>Hari Simulasi: <strong>{{ simulatedDay }}</strong></span>
          </div>

          <!-- Quick access landing page icon -->
          <router-link to="/" class="p-2 bg-slate-900 hover:bg-slate-800 rounded-lg text-sm border border-slate-800" title="Kunjungi Landing Page">
            🛍️ Toko
          </router-link>
        </div>
      </header>

      <!-- Page Content -->
      <main class="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-900">
        <RouterView />
      </main>
    </div>
  </div>
</template>
