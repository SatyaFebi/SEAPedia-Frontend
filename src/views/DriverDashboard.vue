<script setup>
import { computed, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useOrdersStore } from '../stores/orders'

const authStore = useAuthStore()
const ordersStore = useOrdersStore()

const user = computed(() => authStore.user)
const jobs = computed(() => ordersStore.availableJobs)
const activeJobs = computed(() => ordersStore.orders.filter(o => o.driver_id === user.value?.id && o.status === 'Sedang Dikirim'))
const completedJobs = computed(() => ordersStore.orders.filter(o => o.driver_id === user.value?.id && o.status === 'Pesanan Selesai'))
const totalEarnings = computed(() => ordersStore.getDriverEarnings(user.value?.id))

const actionMessage = ref('')

function handleAcceptJob(orderId) {
  const success = ordersStore.transitionOrderStatus(orderId, 'Sedang Dikirim', {
    driver_id: user.value.id,
    driver_name: user.value.name
  })
  if (success) triggerAlert('Pekerjaan diambil! Segera ambil barang di toko.')
}

function handleCompleteJob(orderId) {
  const success = ordersStore.transitionOrderStatus(orderId, 'Pesanan Selesai')
  if (success) triggerAlert('Pesanan berhasil diantar! Komisi ditambahkan.')
}

function handleFailJob(orderId) {
  const success = ordersStore.transitionOrderStatus(orderId, 'Dikembalikan')
  if (success) triggerAlert('Pesanan ditandai gagal/dikembalikan ke toko.')
}

function triggerAlert(msg) {
  actionMessage.value = msg
  setTimeout(() => { actionMessage.value = '' }, 4000)
}
</script>

<template>
  <div class="space-y-6 text-[#374151]">

    <!-- Stats -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="stat-card sm:col-span-2">
        <p class="font-display font-bold text-[#0D1117] text-lg">Halo, {{ user?.name }}!</p>
        <p class="text-sm text-[#6B7280] mt-0.5">Cek pekerjaan pengiriman yang tersedia dan mulai antar.</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">Total Komisi (80%)</p>
        <p class="stat-value text-primary-600">Rp{{ totalEarnings.toLocaleString('id-ID') }}</p>
        <p class="text-xs text-[#9CA3AF] mt-1">{{ completedJobs.length }} pengiriman selesai</p>
      </div>
    </div>

    <!-- Alert -->
    <div v-if="actionMessage" class="px-4 py-3 bg-primary-50 border border-primary-100 rounded-xl text-sm text-primary-700 font-medium">
      {{ actionMessage }}
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

      <!-- Jobs board -->
      <div class="card p-6 lg:col-span-2 space-y-5">
        <h3 class="font-display font-semibold text-[#0D1117] pb-4 border-b border-[#E5E8EC]">
          Papan Pekerjaan <span class="text-[#9CA3AF] font-normal text-sm">(Menunggu Driver)</span>
        </h3>

        <div v-if="jobs.length === 0" class="py-10 text-center text-sm text-[#9CA3AF]">
          Tidak ada pekerjaan tersedia saat ini.
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="job in jobs"
            :key="job.id"
            class="border border-[#E5E8EC] rounded-xl p-5 space-y-4 hover:border-primary-200 hover:bg-primary-50/20 transition-all"
          >
            <div class="flex items-center justify-between text-xs pb-3 border-b border-[#E5E8EC]">
              <div class="flex items-center gap-2">
                <code class="bg-[#E5E8EC] px-2 py-0.5 rounded font-mono text-[#374151]">{{ job.id }}</code>
                <span class="text-[#6B7280]">{{ job.delivery_method }}</span>
              </div>
              <span class="font-display font-semibold text-primary-600 text-sm">+Rp{{ (job.delivery_fee * 0.8).toLocaleString('id-ID') }}</span>
            </div>

            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p class="section-label mb-1">Ambil dari</p>
                <p class="font-medium text-[#0D1117]">{{ job.store_name }}</p>
              </div>
              <div>
                <p class="section-label mb-1">Antar ke</p>
                <p class="font-medium text-[#0D1117]">{{ job.buyer_name }}</p>
                <p class="text-xs text-[#9CA3AF] mt-0.5 line-clamp-1">{{ job.buyer_address }}</p>
              </div>
            </div>

            <div class="flex justify-end pt-1">
              <button @click="handleAcceptJob(job.id)" class="btn-primary">Ambil Pekerjaan →</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Right panel -->
      <div class="space-y-5">

        <!-- Active jobs -->
        <div class="card p-5 space-y-4">
          <h3 class="font-display font-semibold text-[#0D1117] pb-3 border-b border-[#E5E8EC]">Sedang Dikirim</h3>

          <div v-if="activeJobs.length === 0" class="py-5 text-center text-sm text-[#9CA3AF]">Tidak ada pengiriman aktif.</div>

          <div v-else class="space-y-3">
            <div
              v-for="job in activeJobs"
              :key="job.id"
              class="border border-[#E5E8EC] rounded-xl p-4 space-y-3 bg-[#FAFAFA]"
            >
              <div class="flex items-center justify-between text-xs pb-2 border-b border-[#E5E8EC]">
                <code class="bg-[#E5E8EC] px-2 py-0.5 rounded font-mono text-[#374151]">{{ job.id }}</code>
                <span class="text-[#9CA3AF]">{{ job.delivery_method }}</span>
              </div>
              <div class="text-sm space-y-2">
                <div>
                  <p class="section-label">Toko</p>
                  <p class="font-medium text-[#0D1117]">{{ job.store_name }}</p>
                </div>
                <div>
                  <p class="section-label">Pembeli</p>
                  <p class="font-medium text-[#0D1117]">{{ job.buyer_name }}</p>
                  <p class="text-xs text-[#9CA3AF] mt-0.5 leading-relaxed">{{ job.buyer_address }}</p>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <button @click="handleFailJob(job.id)" class="btn-danger btn-sm w-full justify-center">Gagal</button>
                <button @click="handleCompleteJob(job.id)" class="btn-primary btn-sm w-full justify-center">Selesai ✓</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Completed earnings -->
        <div class="card p-5 space-y-4">
          <h3 class="font-display font-semibold text-[#0D1117] pb-3 border-b border-[#E5E8EC]">Riwayat Selesai</h3>

          <div v-if="completedJobs.length === 0" class="py-4 text-center text-sm text-[#9CA3AF]">Belum ada pengiriman selesai.</div>

          <div v-else class="space-y-2 max-h-56 overflow-y-auto">
            <div
              v-for="job in completedJobs"
              :key="job.id"
              class="flex items-center justify-between p-3 rounded-lg bg-[#F4F6F8] border border-[#E5E8EC] text-xs"
            >
              <div>
                <p class="font-medium text-[#0D1117]">{{ job.id }}</p>
                <p class="text-[#9CA3AF] mt-0.5">{{ job.store_name }}</p>
              </div>
              <span class="font-display font-semibold text-primary-600">+Rp{{ (job.delivery_fee * 0.8).toLocaleString('id-ID') }}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
