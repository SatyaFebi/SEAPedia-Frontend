<script setup>
import { computed, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useOrdersStore } from '../stores/orders'

const authStore = useAuthStore()
const ordersStore = useOrdersStore()

const user = computed(() => authStore.user)

// Available pickup jobs (orders status: Menunggu Pengirim)
const jobs = computed(() => ordersStore.availableJobs)

// Driver active delivery (orders assigned to this driver with status Sedang Dikirim)
const activeJobs = computed(() => {
  return ordersStore.orders.filter(o => o.driver_id === user.value?.id && o.status === 'Sedang Dikirim')
})

// Driver completed jobs
const completedJobs = computed(() => {
  return ordersStore.orders.filter(o => o.driver_id === user.value?.id && o.status === 'Pesanan Selesai')
})

// Earnings calculation
const totalEarnings = computed(() => ordersStore.getDriverEarnings(user.value?.id))

const actionMessage = ref('')

function handleAcceptJob(orderId) {
  actionMessage.value = ''
  // Transition status: Menunggu Pengirim -> Sedang Dikirim
  const success = ordersStore.transitionOrderStatus(orderId, 'Sedang Dikirim', {
    driver_id: user.value.id,
    driver_name: user.value.name
  })
  if (success) {
    triggerAlert('Pekerjaan diambil! Segera ambil barang di toko dan antarkan ke pembeli.')
  }
}

function handleCompleteJob(orderId) {
  actionMessage.value = ''
  // Transition status: Sedang Dikirim -> Pesanan Selesai
  const success = ordersStore.transitionOrderStatus(orderId, 'Pesanan Selesai')
  if (success) {
    triggerAlert('Pesanan berhasil diantar! Komisi telah ditambahkan ke statement Anda.')
  }
}

function handleFailJob(orderId) {
  actionMessage.value = ''
  // Transition status: Sedang Dikirim -> Dikembalikan
  const success = ordersStore.transitionOrderStatus(orderId, 'Dikembalikan')
  if (success) {
    triggerAlert('Pesanan ditandai gagal/dikembalikan ke toko.')
  }
}

function triggerAlert(msg) {
  actionMessage.value = msg
  setTimeout(() => {
    actionMessage.value = ''
  }, 4000)
}
</script>

<template>
  <div class="space-y-8 text-slate-200">
    
    <!-- Driver Stats & Header -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-slate-950 border border-slate-800 p-6 rounded-2xl md:col-span-2">
        <h2 class="text-xl font-bold text-slate-100">Halo Driver, {{ user?.name }}!</h2>
        <p class="text-slate-400 text-xs mt-1">Cari pekerjaan pengiriman aktif di sekitar Anda, ambil barang, dan antarkan ke alamat tujuan.</p>
      </div>

      <!-- Earnings Card -->
      <div class="bg-slate-950 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between">
        <div>
          <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">💰 Pendapatan Driver (Komisi 80%)</p>
          <h3 class="text-2xl font-extrabold text-emerald-400 mt-2">Rp{{ totalEarnings.toLocaleString('id-ID') }}</h3>
        </div>
        <p class="text-[9px] text-slate-650 mt-2">Dari {{ completedJobs.length }} pengiriman yang berhasil diselesaikan</p>
      </div>
    </div>

    <!-- Alert Message Banner -->
    <p v-if="actionMessage" class="bg-emerald-950/40 border border-emerald-900/50 text-emerald-400 p-3 rounded-xl text-xs font-semibold text-center">
      {{ actionMessage }}
    </p>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <!-- Column 1: Jobs Board (Menunggu Pengirim) -->
      <section class="bg-slate-950 border border-slate-800 p-6 rounded-2xl lg:col-span-2 space-y-6">
        <h3 class="text-sm font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-4">
          🛵 Papan Pekerjaan Pengiriman (Menunggu Pengirim)
        </h3>

        <div v-if="jobs.length === 0" class="text-center py-10 text-slate-600 text-sm">
          Tidak ada kiriman baru saat ini. Silakan pantau beberapa saat lagi.
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="job in jobs"
            :key="job.id"
            class="bg-slate-900/60 border border-slate-850 p-5 rounded-xl space-y-4 hover:border-slate-750 transition-colors"
          >
            <div class="flex items-center justify-between text-xs pb-2 border-b border-slate-850">
              <div>
                <span class="font-mono bg-slate-950 text-amber-500 px-2 py-0.5 rounded font-bold">{{ job.id }}</span>
                <span class="text-slate-400 ml-2 font-medium">Metode: <strong>{{ job.delivery_method }}</strong></span>
              </div>
              <span class="font-mono text-emerald-400 font-bold bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-900/20">
                Tarif: Rp{{ (job.delivery_fee * 0.8).toLocaleString('id-ID') }}
              </span>
            </div>

            <!-- Details -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div class="space-y-1">
                <p class="text-[9px] text-slate-500 uppercase tracking-wider font-bold">🏪 Alamat Ambil (Toko)</p>
                <p class="font-semibold text-slate-200">{{ job.store_name }}</p>
                <p class="text-slate-400 text-[10px]">Silakan koordinasikan dengan penjual.</p>
              </div>

              <div class="space-y-1">
                <p class="text-[9px] text-slate-500 uppercase tracking-wider font-bold">📍 Alamat Antar (Penerima)</p>
                <p class="font-semibold text-slate-200">{{ job.buyer_name }}</p>
                <p class="text-slate-300 text-[10px] leading-relaxed line-clamp-2">{{ job.buyer_address }}</p>
              </div>
            </div>

            <!-- Action -->
            <div class="flex justify-end pt-2">
              <button
                @click="handleAcceptJob(job.id)"
                class="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-colors"
              >
                Ambil Pekerjaan Ini
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Column 2: Active Delivery and Earnings logs -->
      <div class="space-y-6">
        
        <!-- Active Delivery Job Tracker -->
        <section class="bg-slate-950 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h3 class="text-sm font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-3">
            ⚡ Pekerjaan Pengiriman Aktif
          </h3>

          <div v-if="activeJobs.length === 0" class="text-center py-6 text-slate-650 text-xs">
            Anda sedang tidak mengantarkan paket saat ini.
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="job in activeJobs"
              :key="job.id"
              class="bg-slate-900 border border-slate-850 p-4 rounded-xl space-y-4"
            >
              <div class="flex justify-between items-center text-xs">
                <span class="font-bold text-emerald-400">{{ job.id }}</span>
                <span class="text-slate-400 font-bold">{{ job.delivery_method }}</span>
              </div>

              <div class="text-xs space-y-2 border-t border-b border-slate-850 py-3">
                <div>
                  <p class="text-[9px] text-slate-500 uppercase">Toko Asal:</p>
                  <p class="font-bold text-slate-300">{{ job.store_name }}</p>
                </div>
                <div>
                  <p class="text-[9px] text-slate-500 uppercase">Tujuan Antar:</p>
                  <p class="font-bold text-slate-300">{{ job.buyer_name }}</p>
                  <p class="text-slate-400 text-[10px] mt-0.5">{{ job.buyer_address }}</p>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-2 pt-1">
                <button
                  @click="handleFailJob(job.id)"
                  class="py-2 bg-rose-950/40 hover:bg-rose-950/60 border border-rose-900/50 text-rose-400 text-[10px] rounded-lg transition-colors"
                >
                  Gagal / Kembalikan
                </button>
                <button
                  @click="handleCompleteJob(job.id)"
                  class="py-2 bg-emerald-600 hover:bg-emerald-700 text-slate-950 font-bold text-[10px] rounded-lg transition-colors"
                >
                  Selesaikan Antar
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- Driver Earnings History -->
        <section class="bg-slate-950 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h3 class="text-sm font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-3">
            📋 Riwayat Pengiriman Selesai
          </h3>

          <div v-if="completedJobs.length === 0" class="text-center py-6 text-slate-650 text-xs">
            Belum ada pengiriman yang diselesaikan.
          </div>

          <div v-else class="space-y-3 max-h-60 overflow-y-auto pr-2">
            <div
              v-for="job in completedJobs"
              :key="job.id"
              class="p-3 bg-slate-900/30 border border-slate-850 rounded-lg flex items-center justify-between text-xs"
            >
              <div>
                <p class="font-bold text-slate-300">{{ job.id }}</p>
                <p class="text-[10px] text-slate-500 mt-0.5">Toko: {{ job.store_name }}</p>
              </div>
              <div class="text-right">
                <p class="font-bold text-emerald-400 font-mono">+Rp{{ (job.delivery_fee * 0.8).toLocaleString('id-ID') }}</p>
                <p class="text-[9px] text-slate-650 mt-0.5">Komisi Masuk</p>
              </div>
            </div>
          </div>
        </section>
      </div>

    </div>

  </div>
</template>
