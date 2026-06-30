<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useOrdersStore } from '../stores/orders'

const authStore = useAuthStore()
const ordersStore = useOrdersStore()

const user = computed(() => authStore.user)
const availableJobs = computed(() => ordersStore.availableJobs)
const myDriverJobs = computed(() => ordersStore.myDriverJobs)
const earnings = computed(() => ordersStore.driverEarnings)

const activeJob = computed(() => myDriverJobs.value.find((j) => j.status === 'Active'))
const completedJobs = computed(() => myDriverJobs.value.filter((j) => j.status === 'Completed'))

const loading = ref(false)
const actionMessage = ref({ text: '', type: 'success' })
const selectedJob = ref(null)
const showJobModal = ref(false)
const activeTab = ref('board') // board | active | history

onMounted(async () => {
  loading.value = true
  await Promise.all([
    ordersStore.fetchAvailableJobs(),
    ordersStore.fetchMyDriverJobs(),
    ordersStore.fetchDriverEarnings(),
  ])
  loading.value = false
})

function openJobDetail(job) {
  selectedJob.value = job
  showJobModal.value = true
}

async function handleTakeJob(orderId) {
  try {
    await ordersStore.takeJob(orderId)
    showJobModal.value = false
    selectedJob.value = null
    activeTab.value = 'active'
    triggerAlert('Pekerjaan berhasil diambil! Segera ambil barang di toko.', 'success')
  } catch (err) {
    triggerAlert(err.message || 'Gagal mengambil pekerjaan.', 'error')
  }
}

async function handleCompleteJob(orderId) {
  try {
    await ordersStore.completeJob(orderId)
    activeTab.value = 'history'
    triggerAlert('Pengiriman selesai! Komisi telah ditambahkan ke riwayat.', 'success')
  } catch (err) {
    triggerAlert(err.message || 'Gagal menyelesaikan pengiriman.', 'error')
  }
}

function triggerAlert(text, type = 'success') {
  actionMessage.value = { text, type }
  setTimeout(() => {
    actionMessage.value = { text: '', type: 'success' }
  }, 4500)
}

function formatCurrency(val) {
  return `Rp${Number(val).toLocaleString('id-ID')}`
}

function formatDate(dt) {
  if (!dt) return '-'
  return new Date(dt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
}

const statusColor = {
  'Sedang Dikemas': 'bg-yellow-100 text-yellow-700',
  'Menunggu Pengirim': 'bg-blue-100 text-blue-700',
  'Sedang Dikirim': 'bg-indigo-100 text-indigo-700',
  'Pesanan Selesai': 'bg-green-100 text-green-700',
}
</script>

<template>
  <div class="space-y-6 text-[#374151]">
    <!-- Stats Row -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="stat-card sm:col-span-2">
        <p class="font-display font-bold text-[#0D1117] text-lg">Halo, {{ user?.name }}! 🚴</p>
        <p class="text-sm text-[#6B7280] mt-0.5">
          {{
            earnings.earning_rule ||
            'Driver mendapat 80% dari ongkos kirim setiap pengiriman yang selesai.'
          }}
        </p>
      </div>
      <div class="stat-card">
        <p class="stat-label">Total Komisi (80%)</p>
        <p class="stat-value text-primary-600">{{ formatCurrency(earnings.total_earnings) }}</p>
        <p class="text-xs text-[#9CA3AF] mt-1">{{ earnings.completed_count }} pengiriman selesai</p>
      </div>
    </div>

    <!-- Alert -->
    <transition name="fade">
      <div
        v-if="actionMessage.text"
        :class="
          actionMessage.type === 'error'
            ? 'bg-red-50 border-red-100 text-red-700'
            : 'bg-primary-50 border-primary-100 text-primary-700'
        "
        class="px-4 py-3 border rounded-xl text-sm font-medium"
      >
        {{ actionMessage.text }}
      </div>
    </transition>

    <!-- Active Job Banner -->
    <div v-if="activeJob" class="card p-5 border-l-4 border-indigo-500 bg-indigo-50/30 space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="font-display font-semibold text-indigo-700">📦 Sedang Dalam Pengiriman</h3>
        <span class="text-xs text-[#9CA3AF]">{{ activeJob.delivery_method }}</span>
      </div>
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p class="section-label mb-1">Ambil dari</p>
          <p class="font-medium text-[#0D1117]">{{ activeJob.store_name }}</p>
        </div>
        <div>
          <p class="section-label mb-1">Antar ke</p>
          <p class="font-medium text-[#0D1117]">{{ activeJob.buyer_name }}</p>
          <p class="text-xs text-[#9CA3AF] mt-0.5 leading-relaxed">
            {{ activeJob.shipping_address }}
          </p>
        </div>
      </div>
      <div class="flex items-center justify-between pt-2 border-t border-indigo-100">
        <span class="text-sm font-semibold text-indigo-600"
          >+{{ formatCurrency(activeJob.earned_amount) }}</span
        >
        <button @click="handleCompleteJob(activeJob.order_id)" class="btn-primary btn-sm">
          ✓ Konfirmasi Selesai
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 bg-[#F4F6F8] p-1 rounded-xl w-fit">
      <button
        v-for="tab in [
          { id: 'board', label: 'Papan Kerja' },
          { id: 'history', label: 'Riwayat & Komisi' },
        ]"
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="
          activeTab === tab.id
            ? 'bg-white shadow-sm text-[#0D1117]'
            : 'text-[#6B7280] hover:text-[#374151]'
        "
        class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
      >
        {{ tab.label }}
        <span
          v-if="tab.id === 'board' && availableJobs.length"
          class="ml-1.5 bg-primary-500 text-white text-xs rounded-full px-1.5 py-0.5"
        >
          {{ availableJobs.length }}
        </span>
      </button>
    </div>

    <!-- Job Board Tab -->
    <div v-if="activeTab === 'board'" class="card p-6 space-y-4">
      <h3 class="font-display font-semibold text-[#0D1117] pb-4 border-b border-[#E5E8EC]">
        Lowongan Pengiriman
        <span class="text-[#9CA3AF] font-normal text-sm">(Menunggu Driver)</span>
      </h3>

      <div v-if="loading" class="py-10 text-center text-sm text-[#9CA3AF]">
        Memuat pekerjaan tersedia...
      </div>
      <div v-else-if="availableJobs.length === 0" class="py-10 text-center text-sm text-[#9CA3AF]">
        <div class="text-3xl mb-3">📭</div>
        Tidak ada pekerjaan tersedia saat ini. Coba refresh nanti.
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="job in availableJobs"
          :key="job.order_id"
          class="border border-[#E5E8EC] rounded-xl p-5 space-y-4 hover:border-primary-200 hover:bg-primary-50/20 transition-all"
        >
          <div class="flex items-center justify-between text-xs pb-3 border-b border-[#E5E8EC]">
            <div class="flex items-center gap-2">
              <span
                class="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium"
                >{{ job.delivery_method }}</span
              >
              <span class="text-[#9CA3AF]">{{ job.items_count }} produk</span>
            </div>
            <span class="font-display font-semibold text-green-600 text-sm"
              >+{{ formatCurrency(job.driver_earning) }}</span
            >
          </div>

          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p class="section-label mb-1">Ambil dari</p>
              <p class="font-medium text-[#0D1117]">{{ job.store_name }}</p>
            </div>
            <div>
              <p class="section-label mb-1">Antar ke</p>
              <p class="font-medium text-[#0D1117]">{{ job.buyer_name }}</p>
              <p class="text-xs text-[#9CA3AF] mt-0.5 line-clamp-2">{{ job.shipping_address }}</p>
            </div>
          </div>

          <div class="flex items-center justify-between pt-1">
            <span class="text-xs text-[#9CA3AF]">Masuk {{ formatDate(job.created_at) }}</span>
            <div class="flex gap-2">
              <button @click="openJobDetail(job)" class="btn-secondary btn-sm">Detail</button>
              <button
                @click="handleTakeJob(job.order_id)"
                :disabled="!!activeJob"
                class="btn-primary btn-sm"
                :class="{ 'opacity-50 cursor-not-allowed': !!activeJob }"
              >
                {{ activeJob ? 'Sedang Aktif' : 'Ambil →' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- History & Earnings Tab -->
    <div v-if="activeTab === 'history'" class="space-y-4">
      <div class="card p-6">
        <h3 class="font-display font-semibold text-[#0D1117] pb-4 mb-4 border-b border-[#E5E8EC]">
          Riwayat Pengiriman
        </h3>

        <div v-if="completedJobs.length === 0" class="py-8 text-center text-sm text-[#9CA3AF]">
          <div class="text-3xl mb-3">📋</div>
          Belum ada pengiriman yang selesai.
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="job in completedJobs"
            :key="job.job_id"
            class="flex items-start justify-between p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E8EC] hover:border-[#D1D5DB] transition-all"
          >
            <div class="space-y-1 flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="font-medium text-[#0D1117] text-sm truncate">{{
                  job.store_name
                }}</span>
                <span
                  class="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full shrink-0"
                  >Selesai</span
                >
              </div>
              <p class="text-xs text-[#6B7280]">→ {{ job.buyer_name }}</p>
              <p class="text-xs text-[#9CA3AF]">
                {{ job.delivery_method }} · Selesai {{ formatDate(job.completed_at) }}
              </p>
            </div>
            <div class="text-right shrink-0 ml-4">
              <p class="font-display font-semibold text-green-600">
                +{{ formatCurrency(job.earned_amount) }}
              </p>
              <p class="text-xs text-[#9CA3AF] mt-0.5">
                80% dari {{ formatCurrency(job.delivery_fee) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Earnings Summary -->
      <div class="card p-5 bg-gradient-to-br from-primary-50 to-primary-100/40 border-primary-200">
        <h4 class="font-display font-semibold text-primary-800 mb-3">Ringkasan Penghasilan</h4>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-xs text-primary-600 mb-1">Total Penghasilan</p>
            <p class="text-2xl font-display font-bold text-primary-700">
              {{ formatCurrency(earnings.total_earnings) }}
            </p>
          </div>
          <div>
            <p class="text-xs text-primary-600 mb-1">Pengiriman Selesai</p>
            <p class="text-2xl font-display font-bold text-primary-700">
              {{ earnings.completed_count }}
            </p>
          </div>
        </div>
        <p class="text-xs text-primary-500 mt-3 pt-3 border-t border-primary-200">
          💡
          {{
            earnings.earning_rule ||
            'Driver mendapat 80% dari ongkos kirim setiap pesanan yang diselesaikan.'
          }}
        </p>
      </div>
    </div>
  </div>

  <!-- Job Detail Modal -->
  <transition name="modal">
    <div
      v-if="showJobModal && selectedJob"
      class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      @click.self="showJobModal = false"
    >
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div class="p-6 border-b border-[#E5E8EC]">
          <div class="flex items-center justify-between">
            <h3 class="font-display font-bold text-[#0D1117]">Detail Pekerjaan</h3>
            <button
              @click="showJobModal = false"
              class="text-[#9CA3AF] hover:text-[#374151] text-xl leading-none"
            >
              ✕
            </button>
          </div>
        </div>
        <div class="p-6 space-y-4 text-sm">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="section-label mb-1">Ambil dari Toko</p>
              <p class="font-medium text-[#0D1117]">{{ selectedJob.store_name }}</p>
            </div>
            <div>
              <p class="section-label mb-1">Metode Kirim</p>
              <p class="font-medium text-[#0D1117]">{{ selectedJob.delivery_method }}</p>
            </div>
          </div>
          <div>
            <p class="section-label mb-1">Alamat Tujuan</p>
            <p class="font-medium text-[#0D1117] leading-relaxed">
              {{ selectedJob.shipping_address }}
            </p>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="section-label mb-1">Penerima</p>
              <p class="font-medium text-[#0D1117]">{{ selectedJob.buyer_name }}</p>
            </div>
            <div>
              <p class="section-label mb-1">Jumlah Produk</p>
              <p class="font-medium text-[#0D1117]">{{ selectedJob.items_count }} item</p>
            </div>
          </div>
          <div class="p-4 bg-green-50 rounded-xl border border-green-100 text-center">
            <p class="text-xs text-green-600 mb-1">Komisi yang akan kamu dapatkan</p>
            <p class="text-2xl font-display font-bold text-green-700">
              +{{ formatCurrency(selectedJob.driver_earning) }}
            </p>
            <p class="text-xs text-green-500 mt-1">
              80% dari ongkir {{ formatCurrency(selectedJob.delivery_fee) }}
            </p>
          </div>
        </div>
        <div class="p-4 border-t border-[#E5E8EC] flex gap-3">
          <button @click="showJobModal = false" class="btn-secondary flex-1 justify-center">
            Tutup
          </button>
          <button
            @click="handleTakeJob(selectedJob.order_id)"
            :disabled="!!activeJob"
            class="btn-primary flex-1 justify-center"
            :class="{ 'opacity-50 cursor-not-allowed': !!activeJob }"
          >
            {{ activeJob ? 'Kamu Sedang Aktif' : 'Ambil Pekerjaan →' }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
