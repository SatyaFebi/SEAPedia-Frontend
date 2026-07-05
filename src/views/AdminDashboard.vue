<script setup>
import { ref, onMounted } from 'vue'
import { apiRequest } from '../utils/api'
import Skeleton from '../components/Skeleton.vue'


const activeTab = ref('overview')

const dashboardStats = ref({
  total_users: 0,
  total_stores: 0,
  total_products: 0,
  total_orders: 0,
  total_volume: 0,
  overdue_count: 0
})

const orders = ref([])
const deliveryJobs = ref([])
const vouchers = ref([])
const promos = ref([])

const voucherForm = ref({
  code: '',
  amount_type: 'PERCENTAGE',
  value: 10,
  max_usage: 100,
  expiry_date: ''
})

const promoForm = ref({
  code: '',
  amount_type: 'PERCENTAGE',
  value: 10,
  expiry_date: ''
})

const alertMessage = ref({ text: '', type: '' })
const isSimulating = ref(false)
const isLoading = ref(true)


async function fetchDashboard() {
  try {
    const data = await apiRequest('/admin/dashboard')
    dashboardStats.value = data
  } catch (e) {
    console.error(e)
  }
}

async function fetchOrders() {
  try {
    const data = await apiRequest('/admin/orders')
    orders.value = data
  } catch (e) {
    console.error(e)
  }
}

async function fetchDeliveryJobs() {
  try {
    const data = await apiRequest('/admin/delivery-jobs')
    deliveryJobs.value = data
  } catch (e) {
    console.error(e)
  }
}

async function fetchVouchers() {
  try {
    vouchers.value = await apiRequest('/vouchers')
  } catch (e) {
    console.error(e)
  }
}

async function fetchPromos() {
  try {
    promos.value = await apiRequest('/promos')
  } catch (e) {
    console.error(e)
  }
}

async function loadDataForTab(tab) {
  activeTab.value = tab
  isLoading.value = true
  try {
    if (tab === 'overview') await fetchDashboard()
    else if (tab === 'orders') await fetchOrders()
    else if (tab === 'delivery') await fetchDeliveryJobs()
    else if (tab === 'discounts') {
      await fetchVouchers()
      await fetchPromos()
    }
  } catch (e) {
    console.error('Gagal memuat data tab:', e)
  } finally {
    isLoading.value = false
  }
}


async function handleSimulateNextDay() {
  isSimulating.value = true
  try {
    const res = await apiRequest('/admin/simulate-next-day', { method: 'POST' })
    showAlert(`${res.message} ${res.overdue_processed_count} order overdue telah diproses.`, 'success')
    await fetchDashboard()
    if (activeTab.value === 'orders') await fetchOrders()
  } catch (e) {
    showAlert(e.message || 'Gagal simulasi hari', 'error')
  } finally {
    isSimulating.value = false
  }
}

async function handleCreateVoucher() {
  try {
    await apiRequest('/admin/vouchers', {
      method: 'POST',
      body: JSON.stringify(voucherForm.value)
    })
    showAlert('Voucher berhasil dibuat!', 'success')
    await fetchVouchers()
    voucherForm.value = { code: '', amount_type: 'PERCENTAGE', value: 10, max_usage: 100, expiry_date: '' }
  } catch (e) {
    showAlert(e.message || 'Gagal membuat voucher', 'error')
  }
}

async function handleCreatePromo() {
  try {
    await apiRequest('/admin/promos', {
      method: 'POST',
      body: JSON.stringify(promoForm.value)
    })
    showAlert('Promo berhasil dibuat!', 'success')
    await fetchPromos()
    promoForm.value = { code: '', amount_type: 'PERCENTAGE', value: 10, expiry_date: '' }
  } catch (e) {
    showAlert(e.message || 'Gagal membuat promo', 'error')
  }
}

function showAlert(text, type) {
  alertMessage.value = { text, type }
  setTimeout(() => {
    alertMessage.value = { text: '', type: '' }
  }, 5000)
}

function getStatusBadge(status) {
  if (status === 'Sedang Dikemas') return 'badge-amber'
  if (status === 'Menunggu Pengirim' || status === 'Sedang Dikirim') return 'badge-blue'
  if (status === 'Pesanan Selesai' || status === 'Completed') return 'badge-green'
  if (status.includes('Dikembalikan')) return 'badge-rose'
  return 'badge-gray'
}

onMounted(async () => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 7)
  const defaultDate = tomorrow.toISOString().slice(0, 10)
  voucherForm.value.expiry_date = defaultDate
  promoForm.value.expiry_date = defaultDate
  
  await loadDataForTab('overview')
})
</script>


<template>
  <div class="space-y-6 text-[#374151]">
    <!-- Top control bar -->
    <div class="card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="font-display font-bold text-[#0D1117] text-lg">Panel Admin SEAPedia</h2>
        <p class="text-sm text-[#6B7280] mt-0.5">
          Monitoring aktivitas marketplace, simulasi sistem, dan manajemen diskon.
        </p>
      </div>
      <div class="flex items-center gap-4 bg-[#F4F6F8] border border-[#E5E8EC] rounded-xl px-4 py-3 shrink-0">
        <button 
          @click="handleSimulateNextDay" 
          :disabled="isSimulating"
          class="btn-primary flex items-center gap-2"
        >
          <span v-if="isSimulating" class="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></span>
          ⏩ Simulasi +1 Hari & Cek SLA
        </button>
      </div>
    </div>

    <!-- Alert -->
    <div
      v-if="alertMessage.text"
      class="px-4 py-3 border rounded-xl text-sm font-medium transition-all"
      :class="alertMessage.type === 'success' ? 'bg-accent-emerald-50 border-accent-emerald-100 text-accent-emerald-700' : 'bg-accent-rose-50 border-accent-rose-100 text-accent-rose-700'"
    >
      {{ alertMessage.text }}
    </div>

    <!-- Tabs -->
    <div class="flex gap-2 border-b border-[#E5E8EC]">
      <button 
        @click="loadDataForTab('overview')"
        class="px-4 py-2 font-medium text-sm border-b-2 transition-colors"
        :class="activeTab === 'overview' ? 'border-primary-600 text-primary-700' : 'border-transparent text-[#6B7280] hover:text-[#374151]'"
      >Overview</button>
      <button 
        @click="loadDataForTab('orders')"
        class="px-4 py-2 font-medium text-sm border-b-2 transition-colors"
        :class="activeTab === 'orders' ? 'border-primary-600 text-primary-700' : 'border-transparent text-[#6B7280] hover:text-[#374151]'"
      >Semua Pesanan</button>
      <button 
        @click="loadDataForTab('delivery')"
        class="px-4 py-2 font-medium text-sm border-b-2 transition-colors"
        :class="activeTab === 'delivery' ? 'border-primary-600 text-primary-700' : 'border-transparent text-[#6B7280] hover:text-[#374151]'"
      >Pekerjaan Kurir</button>
      <button 
        @click="loadDataForTab('discounts')"
        class="px-4 py-2 font-medium text-sm border-b-2 transition-colors"
        :class="activeTab === 'discounts' ? 'border-primary-600 text-primary-700' : 'border-transparent text-[#6B7280] hover:text-[#374151]'"
      >Manajemen Diskon</button>
    </div>

    <!-- Tab Content: Overview -->
    <div v-if="activeTab === 'overview'" class="space-y-6">
      <div v-if="isLoading" class="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="i in 6" :key="i" class="stat-card space-y-2">
          <Skeleton width="40%" height="0.75rem" />
          <Skeleton width="60%" height="1.5rem" />
        </div>
      </div>
      <div v-else class="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div class="stat-card">
          <p class="stat-label">Total Pengguna</p>
          <p class="stat-value">{{ dashboardStats.total_users }}</p>
        </div>
        <div class="stat-card">
          <p class="stat-label">Total Toko</p>
          <p class="stat-value">{{ dashboardStats.total_stores }}</p>
        </div>
        <div class="stat-card">
          <p class="stat-label">Total Produk</p>
          <p class="stat-value">{{ dashboardStats.total_products }}</p>
        </div>
        <div class="stat-card">
          <p class="stat-label">Total Pesanan</p>
          <p class="stat-value">{{ dashboardStats.total_orders }}</p>
        </div>
        <div class="stat-card">
          <p class="stat-label">Pesanan Overdue (Belum Diproses)</p>
          <p class="stat-value text-accent-rose-600">{{ dashboardStats.overdue_count }}</p>
        </div>
        <div class="stat-card border-primary-200 bg-primary-50">
          <p class="stat-label">Volume Transaksi</p>
          <p class="stat-value text-primary-700 text-xl">
            Rp{{ dashboardStats.total_volume.toLocaleString('id-ID') }}
          </p>
        </div>
      </div>
    </div>


    <!-- Tab Content: Orders -->
    <div v-if="activeTab === 'orders'" class="card p-6">
      <h3 class="font-display font-semibold text-[#0D1117] mb-4">Semua Pesanan</h3>
      <div class="overflow-x-auto">
        <table class="w-full text-sm border-collapse min-w-[800px]">
          <thead>
            <tr class="border-b border-[#E5E8EC]">
              <th class="text-left py-2 px-3 section-label">Order ID</th>
              <th class="text-left py-2 px-3 section-label">Toko / Pembeli</th>
              <th class="text-left py-2 px-3 section-label">Kurir</th>
              <th class="text-left py-2 px-3 section-label">Metode</th>
              <th class="text-left py-2 px-3 section-label">Total / Dibuat</th>
              <th class="text-left py-2 px-3 section-label">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#E5E8EC]">
            <tr v-if="isLoading">
              <td colspan="6" class="py-4 px-3">
                <div class="space-y-3">
                  <div v-for="i in 3" :key="i" class="flex justify-between items-center py-2 border-b border-[#E5E8EC] last:border-b-0">
                    <Skeleton width="4rem" height="1rem" />
                    <div class="space-y-1 flex-1 px-4">
                      <Skeleton width="50%" height="0.875rem" />
                      <Skeleton width="30%" height="0.75rem" />
                    </div>
                    <Skeleton width="5rem" height="1rem" class="shrink-0" />
                    <Skeleton width="4rem" height="1rem" class="shrink-0 ml-4" />
                    <div class="space-y-1 shrink-0 ml-4 text-right">
                      <Skeleton width="6rem" height="0.875rem" />
                      <Skeleton width="4rem" height="0.75rem" />
                    </div>
                    <Skeleton width="6rem" height="1.25rem" class="shrink-0 ml-4" />
                  </div>
                </div>
              </td>
            </tr>
            <tr v-else-if="orders.length === 0">
              <td colspan="6" class="py-8 text-center text-sm text-[#9CA3AF]">Belum ada pesanan.</td>
            </tr>

            <tr v-for="order in orders" :key="order.id" class="hover:bg-[#F4F6F8]">
              <td class="py-3 px-3 font-mono text-xs">{{ order.id.substring(0,8) }}</td>
              <td class="py-3 px-3">
                <p class="font-medium text-[#0D1117] text-xs">{{ order.store_name }}</p>
                <p class="text-[#9CA3AF] text-xs">{{ order.buyer_name }}</p>
              </td>
              <td class="py-3 px-3 text-xs">{{ order.driver_name || '-' }}</td>
              <td class="py-3 px-3 text-xs">
                <p>{{ order.delivery_method }}</p>
              </td>
              <td class="py-3 px-3 text-xs">
                <p class="font-medium">Rp{{ order.total.toLocaleString('id-ID') }}</p>
                <p class="text-[#9CA3AF]">{{ order.created_at.substring(0, 10) }}</p>
              </td>
              <td class="py-3 px-3">
                <span class="badge" :class="getStatusBadge(order.status)">{{ order.status }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Tab Content: Delivery Jobs -->
    <div v-if="activeTab === 'delivery'" class="card p-6">
      <h3 class="font-display font-semibold text-[#0D1117] mb-4">Pekerjaan Kurir</h3>
      <div class="overflow-x-auto">
        <table class="w-full text-sm border-collapse min-w-[600px]">
          <thead>
            <tr class="border-b border-[#E5E8EC]">
              <th class="text-left py-2 px-3 section-label">Order ID</th>
              <th class="text-left py-2 px-3 section-label">Kurir</th>
              <th class="text-left py-2 px-3 section-label">Komisi</th>
              <th class="text-left py-2 px-3 section-label">Diambil / Selesai</th>
              <th class="text-left py-2 px-3 section-label">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#E5E8EC]">
            <tr v-if="isLoading">
              <td colspan="5" class="py-4 px-3">
                <div class="space-y-3">
                  <div v-for="i in 3" :key="i" class="flex justify-between items-center py-2 border-b border-[#E5E8EC] last:border-b-0">
                    <Skeleton width="4rem" height="1rem" />
                    <Skeleton width="8rem" height="1rem" class="flex-1 px-4" />
                    <Skeleton width="6rem" height="1rem" class="shrink-0" />
                    <div class="space-y-1 shrink-0 ml-4 text-right">
                      <Skeleton width="6rem" height="0.875rem" />
                      <Skeleton width="6rem" height="0.75rem" />
                    </div>
                    <Skeleton width="6rem" height="1.25rem" class="shrink-0 ml-4" />
                  </div>
                </div>
              </td>
            </tr>
            <tr v-else-if="deliveryJobs.length === 0">
              <td colspan="5" class="py-8 text-center text-sm text-[#9CA3AF]">Belum ada pekerjaan kurir.</td>
            </tr>

            <tr v-for="job in deliveryJobs" :key="job.id" class="hover:bg-[#F4F6F8]">
              <td class="py-3 px-3 font-mono text-xs">{{ job.order_id.substring(0,8) }}</td>
              <td class="py-3 px-3 text-xs font-medium">{{ job.driver_name }}</td>
              <td class="py-3 px-3 text-xs text-primary-600 font-medium">Rp{{ job.earned_amount.toLocaleString('id-ID') }}</td>
              <td class="py-3 px-3 text-xs text-[#6B7280]">
                {{ job.taken_at ? job.taken_at.substring(0,16) : '-' }}<br>
                {{ job.completed_at ? job.completed_at.substring(0,16) : '-' }}
              </td>
              <td class="py-3 px-3">
                <span class="badge" :class="getStatusBadge(job.status)">{{ job.status }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Tab Content: Discounts -->
    <div v-if="activeTab === 'discounts'" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Vouchers -->
      <div class="space-y-6">
        <div class="card p-6">
          <h3 class="font-display font-semibold text-[#0D1117] mb-4 border-b pb-2">Buat Voucher Baru</h3>
          <form @submit.prevent="handleCreateVoucher" class="space-y-4">
            <div>
              <label class="input-label">Kode Voucher</label>
              <input type="text" v-model="voucherForm.code" class="input uppercase" required />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="input-label">Tipe Nominal</label>
                <select v-model="voucherForm.amount_type" class="input">
                  <option value="PERCENTAGE">Persentase (%)</option>
                  <option value="FIXED">Nominal Tetap (Rp)</option>
                </select>
              </div>
              <div>
                <label class="input-label">Nilai</label>
                <input type="number" v-model.number="voucherForm.value" class="input" required />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="input-label">Kuota Maksimal</label>
                <input type="number" v-model.number="voucherForm.max_usage" class="input" required />
              </div>
              <div>
                <label class="input-label">Tanggal Kedaluwarsa</label>
                <input type="date" v-model="voucherForm.expiry_date" class="input" required />
              </div>
            </div>
            <button type="submit" class="btn-primary w-full justify-center">Simpan Voucher</button>
          </form>
        </div>

        <div class="card p-6">
          <h3 class="font-display font-semibold text-[#0D1117] mb-4 border-b pb-2">Daftar Voucher</h3>
          <div v-if="isLoading" class="space-y-3">
            <div v-for="i in 2" :key="i" class="p-3 border rounded-lg flex justify-between">
              <div class="space-y-2 flex-1">
                <Skeleton width="4rem" height="1.25rem" />
                <Skeleton width="6rem" height="0.75rem" />
              </div>
              <div class="text-right space-y-2 shrink-0 ml-4">
                <Skeleton width="3rem" height="1rem" />
                <Skeleton width="5rem" height="0.75rem" />
              </div>
            </div>
          </div>
          <div v-else class="space-y-3">
            <div v-for="v in vouchers" :key="v.id" class="p-3 border rounded-lg">
              <div class="flex justify-between items-start">
                <div>
                  <span class="font-mono font-bold text-primary-700 bg-primary-50 px-2 py-1 rounded">{{ v.code }}</span>
                  <p class="text-xs text-[#6B7280] mt-2">Exp: {{ v.expiry_date ? v.expiry_date.substring(0,10) : '-' }}</p>
                </div>
                <div class="text-right">
                  <p class="text-sm font-semibold">{{ v.amount_type === 'PERCENTAGE' ? v.value + '%' : 'Rp' + v.value.toLocaleString('id-ID') }}</p>
                  <p class="text-xs text-[#6B7280] mt-1">Terpakai: {{ v.used_count }}/{{ v.max_usage }}</p>
                </div>
              </div>
            </div>
            <p v-if="vouchers.length === 0" class="text-sm text-center text-[#9CA3AF]">Belum ada voucher</p>
          </div>
        </div>

      </div>

      <!-- Promos -->
      <div class="space-y-6">
        <div class="card p-6">
          <h3 class="font-display font-semibold text-[#0D1117] mb-4 border-b pb-2">Buat Promo (Tanpa Kuota)</h3>
          <form @submit.prevent="handleCreatePromo" class="space-y-4">
            <div>
              <label class="input-label">Kode Promo</label>
              <input type="text" v-model="promoForm.code" class="input uppercase" required />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="input-label">Tipe Nominal</label>
                <select v-model="promoForm.amount_type" class="input">
                  <option value="PERCENTAGE">Persentase (%)</option>
                  <option value="FIXED">Nominal Tetap (Rp)</option>
                </select>
              </div>
              <div>
                <label class="input-label">Nilai</label>
                <input type="number" v-model.number="promoForm.value" class="input" required />
              </div>
            </div>
            <div>
              <label class="input-label">Tanggal Kedaluwarsa</label>
              <input type="date" v-model="promoForm.expiry_date" class="input" required />
            </div>
            <button type="submit" class="btn-primary w-full justify-center">Simpan Promo</button>
          </form>
        </div>

        <div class="card p-6">
          <h3 class="font-display font-semibold text-[#0D1117] mb-4 border-b pb-2">Daftar Promo</h3>
          <div v-if="isLoading" class="space-y-3">
            <div v-for="i in 2" :key="i" class="p-3 border rounded-lg flex justify-between">
              <div class="space-y-2 flex-1">
                <Skeleton width="4rem" height="1.25rem" />
                <Skeleton width="6rem" height="0.75rem" />
              </div>
              <div class="text-right space-y-2 shrink-0 ml-4">
                <Skeleton width="3rem" height="1rem" />
                <Skeleton width="5rem" height="0.75rem" />
              </div>
            </div>
          </div>
          <div v-else class="space-y-3">
            <div v-for="p in promos" :key="p.id" class="p-3 border rounded-lg">
              <div class="flex justify-between items-start">
                <div>
                  <span class="font-mono font-bold text-accent-emerald-700 bg-accent-emerald-50 px-2 py-1 rounded">{{ p.code }}</span>
                  <p class="text-xs text-[#6B7280] mt-2">Exp: {{ p.expiry_date ? p.expiry_date.substring(0,10) : '-' }}</p>
                </div>
                <div class="text-right">
                  <p class="text-sm font-semibold">{{ p.amount_type === 'PERCENTAGE' ? p.value + '%' : 'Rp' + p.value.toLocaleString('id-ID') }}</p>
                  <p class="text-xs text-[#6B7280] mt-1">Total Terpakai: {{ p.used_count }}</p>
                </div>
              </div>
            </div>
            <p v-if="promos.length === 0" class="text-sm text-center text-[#9CA3AF]">Belum ada promo</p>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>
