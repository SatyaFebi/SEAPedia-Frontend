<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const router = useRouter()

const isLoggedIn = computed(() => authStore.isLoggedIn)
const activeRole = computed(() => authStore.activeRole)
const user = computed(() => authStore.user)

async function handleLogout() {
  await authStore.logout()
  router.push('/')
}
</script>

<template>
  <nav
    class="h-14 bg-white border-b border-[#E5E8EC] px-6 flex items-center justify-between sticky top-0 z-40"
  >
    <router-link to="/" class="flex items-center gap-2.5">
      <div class="w-6 h-6 rounded-md bg-primary-600 flex items-center justify-center">
        <span class="text-white font-display font-bold text-xs">S</span>
      </div>
      <span class="font-display font-bold text-[#0D1117] text-base tracking-tight">SEAPedia</span>
      <span class="text-xs text-[#9CA3AF] hidden sm:block">— Marketplace Nusantara</span>
    </router-link>

    <!-- Navigation items -->
    <div class="flex items-center gap-3">
      <!-- Guest navigation -->
      <template v-if="!isLoggedIn">
        <router-link to="/login" class="btn btn-secondary btn-sm"> Masuk </router-link>
        <router-link to="/register" class="btn btn-primary btn-sm"> Daftar </router-link>
      </template>

      <!-- Logged-in navigation -->
      <template v-else>
        <!-- Active Role Badge -->
        <span v-if="activeRole" class="badge badge-green text-xs hidden sm:inline-flex">
          Role Aktif: {{ activeRole }}
        </span>

        <!-- Dashboard Link -->
        <router-link
          :to="activeRole ? `/dashboard/${activeRole.toLowerCase()}` : '/role-selection'"
          class="btn btn-primary btn-sm"
        >
          Dashboard →
        </router-link>

        <!-- Logout button -->
        <button @click="handleLogout" class="btn btn-danger btn-sm">Keluar</button>
      </template>
    </div>
  </nav>
</template>
