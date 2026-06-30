<script setup>
import { computed, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useOrdersStore } from '../stores/orders'
import { useCartStore } from '../stores/cart'
import { useProductsStore } from '../stores/products'

const authStore = useAuthStore()
const ordersStore = useOrdersStore()
const cartStore = useCartStore()
const productsStore = useProductsStore()

const orders = computed(() => ordersStore.orders)
const simulatedDay = computed(() => ordersStore.simulatedDay)

// Metrics
const totalUsers = computed(() => authStore.mockUsers.length)
const totalProducts = computed(() => productsStore.products.length)
const totalOrdersCount = computed(() => orders.value.length)
const totalTransactionVolume = computed(() => {
  return orders.value.reduce((sum, o) => sum + o.total, 0)
})

// Voucher Form State
const voucherForm = ref({
  code: '',
  type: 'percentage',
  value: 10,
  minPurchase: 50000,
  maxDiscount: 20000,
  description: ''
})

const promoAlertMessage = ref('')

function handleCreateVoucher() {
  if (!voucherForm.value.code.trim()) return

  const codeUpper = voucherForm.value.code.trim().toUpperCase()
  
  // Calculate discount value format
  const isPercentage = voucherForm.value.type === 'percentage'
  const valDecimal = isPercentage ? parseFloat(voucherForm.value.value) / 100 : parseFloat(voucherForm.value.value)

  const newVoucher = {
    code: codeUpper,
    type: voucherForm.value.type,
    value: valDecimal,
    minPurchase: parseFloat(voucherForm.value.minPurchase) || 0,
    maxDiscount: isPercentage ? (parseFloat(voucherForm.value.maxDiscount) || 0) : null,
    description: voucherForm.value.description || 
      `Diskon ${isPercentage ? voucherForm.value.value + '%' : 'Potongan Ongkir Rp' + valDecimal} min. belanja Rp${voucherForm.value.minPurchase}`
  }

  // Inject into cartStore vouchers
  cartStore.mockVouchers.push(newVoucher)

  promoAlertMessage.value = `Voucher Promo ${codeUpper} berhasil dibuat dan aktif di sistem!`
  
  // Reset form
  voucherForm.value = {
    code: '',
    type: 'percentage',
    value: 10,
    minPurchase: 50000,
    maxDiscount: 20000,
    description: ''
  }

  setTimeout(() => {
    promoAlertMessage.value = ''
  }, 4000)
}

const slaTransitionAlert = ref(false)

function handleSimulateNextDay() {
  ordersStore.simulateNextDay()
  slaTransitionAlert.value = true
  setTimeout(() => {
    slaTransitionAlert.value = false
  }, 4000)
}

function getStatusColor(status) {
  if (status === 'Sedang Dikemas') return 'text-amber-400'
  if (status === 'Menunggu Pengirim') return 'text-blue-400'
  if (status === 'Sedang Dikirim') return 'text-indigo-400'
  if (status === 'Pesanan Selesai') return 'text-emerald-400'
  if (status.includes('Dikembalikan')) return 'text-rose-450'
  return 'text-slate-400'
}
</script>

<template>
  <div class="space-y-8 text-slate-200">
    
    <!-- Admin Controls Row -->
    <div class="bg-gradient-to-r from-slate-905 to-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div>
        <h2 class="text-xl font-bold text-slate-100">Panel Operasional Admin</h2>
        <p class="text-slate-400 text-xs mt-1">Gunakan simulator hari untuk menguji SLA pengiriman, atau tambahkan kode promo baru ke marketplace.</p>
      </div>

      <!-- Simulated day progress and operational trigger button -->
      <div class="flex items-center gap-4 bg-slate-950 p-4 rounded-xl border border-slate-850">
        <div class="text-right">
          <p class="text-[10px] text-slate-500 uppercase tracking-widest">Simulasi Waktu Sistem</p>
          <p class="text-sm font-bold text-slate-200">Hari Ke: <span class="text-amber-400">{{ simulatedDay }}</span></p>
        </div>
        <button
          @click="handleSimulateNextDay"
          class="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all"
        >
          ⏩ Jalankan Hari Berikutnya (SLA)
        </button>
      </div>
    </div>

    <!-- Alert for SLA progression -->
    <div
      v-if="slaTransitionAlert"
      class="bg-rose-950/40 border border-rose-900/50 text-rose-300 p-4 rounded-xl text-xs space-y-1 text-center"
    >
      <p class="font-bold">⚡ Simulasi Transisi Hari Selesai!</p>
      <p class="text-[10px] text-rose-400">Order melewati batas waktu SLA secara otomatis dikembalikan ke saldo buyer, dan paket di jalan ditandai terkirim.</p>
    </div>

    <!-- Metrics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div class="bg-slate-950 border border-slate-800 p-5 rounded-2xl text-center">
        <p class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">👥 TOTAL PENGGUNA</p>
        <h3 class="text-3xl font-extrabold text-slate-200 mt-2">{{ totalUsers }}</h3>
      </div>
      <div class="bg-slate-950 border border-slate-800 p-5 rounded-2xl text-center">
        <p class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">📦 TOTAL PRODUK KATALOG</p>
        <h3 class="text-3xl font-extrabold text-slate-200 mt-2">{{ totalProducts }}</h3>
      </div>
      <div class="bg-slate-950 border border-slate-800 p-5 rounded-2xl text-center">
        <p class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">📋 TOTAL PEMESANAN</p>
        <h3 class="text-3xl font-extrabold text-slate-200 mt-2">{{ totalOrdersCount }}</h3>
      </div>
      <div class="bg-slate-950 border border-slate-800 p-5 rounded-2xl text-center">
        <p class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">💰 VOLUME TRANSAKSI</p>
        <h3 class="text-3xl font-extrabold text-emerald-400 mt-2">Rp{{ totalTransactionVolume.toLocaleString('id-ID') }}</h3>
      </div>
    </div>

    <!-- Main Admin Workspace Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <!-- Voucher Generator (Left Column) -->
      <section class="bg-slate-950 border border-slate-800 p-6 rounded-2xl lg:col-span-1 space-y-6">
        <h3 class="text-sm font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-4">
          🎟️ Generator Voucher Diskon & Promo
        </h3>

        <p v-if="promoAlertMessage" class="bg-emerald-950/40 border border-emerald-900/50 text-emerald-400 p-3 rounded-lg text-xs font-semibold text-center">
          {{ promoAlertMessage }}
        </p>

        <form @submit.prevent="handleCreateVoucher" class="space-y-4 text-xs">
          <div>
            <label class="block text-slate-400 mb-1.5 font-bold uppercase tracking-wider">Kode Voucher</label>
            <input
              type="text"
              v-model="voucherForm.code"
              placeholder="Contoh: PROMOJUNI"
              class="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-100 uppercase focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-slate-400 mb-1.5 font-bold uppercase tracking-wider">Tipe Diskon</label>
              <select
                v-model="voucherForm.type"
                class="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
              >
                <option value="percentage">Persentase (%)</option>
                <option value="delivery">Subsidi Ongkir (Flat)</option>
              </select>
            </div>
            <div>
              <label class="block text-slate-400 mb-1.5 font-bold uppercase tracking-wider">Nilai Diskon</label>
              <input
                type="number"
                v-model.number="voucherForm.value"
                placeholder="cth. 10 untuk 10% / 15000"
                class="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                required
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-slate-400 mb-1.5 font-bold uppercase tracking-wider">Min. Belanja (Rp)</label>
              <input
                type="number"
                v-model.number="voucherForm.minPurchase"
                class="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label class="block text-slate-400 mb-1.5 font-bold uppercase tracking-wider">Maks. Potongan (Rp)</label>
              <input
                type="number"
                v-model.number="voucherForm.maxDiscount"
                :disabled="voucherForm.type === 'delivery'"
                class="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-amber-500 disabled:opacity-30"
              />
            </div>
          </div>

          <div>
            <label class="block text-slate-400 mb-1.5 font-bold uppercase tracking-wider">Deskripsi (Opsional)</label>
            <input
              type="text"
              v-model="voucherForm.description"
              placeholder="Masukkan deskripsi promo singkat"
              class="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            type="submit"
            class="w-full py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold rounded-xl transition-all shadow-md"
          >
            Aktifkan Kode Promo
          </button>
        </form>
      </section>

      <!-- Active Promos & Global System Orders (Right Columns) -->
      <section class="bg-slate-950 border border-slate-800 p-6 rounded-2xl lg:col-span-2 space-y-6">
        <h3 class="text-sm font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-4">
          📈 Daftar Pengiriman Sistem Global (SLA Monitor)
        </h3>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="border-b border-slate-850 text-slate-500">
                <th class="py-3 px-2">Order ID</th>
                <th class="py-3 px-2">Toko & Pembeli</th>
                <th class="py-3 px-2">Metode / Ongkir</th>
                <th class="py-3 px-2">Umur Status</th>
                <th class="py-3 px-2">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-850">
              <tr v-if="orders.length === 0">
                <td colspan="5" class="text-center py-6 text-slate-650">Tidak ada order yang sedang berjalan.</td>
              </tr>
              <tr v-for="order in orders" :key="order.id" class="hover:bg-slate-900/30">
                <td class="py-3 px-2 font-bold font-mono text-slate-300">{{ order.id }}</td>
                <td class="py-3 px-2">
                  <p class="font-bold text-slate-200">{{ order.store_name }}</p>
                  <p class="text-[10px] text-slate-500">Kustomer: {{ order.buyer_name }}</p>
                </td>
                <td class="py-3 px-2">
                  <p class="text-slate-300">{{ order.delivery_method }}</p>
                  <p class="text-[10px] text-slate-500">Ongkir: Rp{{ order.delivery_fee.toLocaleString('id-ID') }}</p>
                </td>
                <td class="py-3 px-2 text-slate-400 font-mono">
                  <span :class="order.days_in_current_status >= 1 ? 'text-rose-450 font-bold' : 'text-slate-400'">
                    {{ order.days_in_current_status }} Hari
                  </span>
                </td>
                <td class="py-3 px-2 font-semibold" :class="getStatusColor(order.status)">
                  {{ order.status }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      
    </div>

  </div>
</template>
