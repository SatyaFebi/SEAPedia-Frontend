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

const totalUsers = computed(() => authStore.mockUsers.length)
const totalProducts = computed(() => productsStore.products.length)
const totalOrdersCount = computed(() => orders.value.length)
const totalTransactionVolume = computed(() => orders.value.reduce((sum, o) => sum + o.total, 0))

const voucherForm = ref({
  code: '',
  type: 'percentage',
  value: 10,
  minPurchase: 50000,
  maxDiscount: 20000,
  description: '',
})
const promoAlertMessage = ref('')

function handleCreateVoucher() {
  if (!voucherForm.value.code.trim()) return
  const codeUpper = voucherForm.value.code.trim().toUpperCase()
  const isPercentage = voucherForm.value.type === 'percentage'
  const valDecimal = isPercentage
    ? parseFloat(voucherForm.value.value) / 100
    : parseFloat(voucherForm.value.value)
  cartStore.mockVouchers.push({
    code: codeUpper,
    type: voucherForm.value.type,
    value: valDecimal,
    minPurchase: parseFloat(voucherForm.value.minPurchase) || 0,
    maxDiscount: isPercentage ? parseFloat(voucherForm.value.maxDiscount) || 0 : null,
    description:
      voucherForm.value.description ||
      `Diskon ${isPercentage ? voucherForm.value.value + '%' : 'Potongan Ongkir Rp' + valDecimal} min. belanja Rp${voucherForm.value.minPurchase}`,
  })
  promoAlertMessage.value = `Voucher ${codeUpper} berhasil dibuat!`
  voucherForm.value = {
    code: '',
    type: 'percentage',
    value: 10,
    minPurchase: 50000,
    maxDiscount: 20000,
    description: '',
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

function getStatusBadge(status) {
  if (status === 'Sedang Dikemas') return 'badge-amber'
  if (status === 'Menunggu Pengirim' || status === 'Sedang Dikirim') return 'badge-blue'
  if (status === 'Pesanan Selesai') return 'badge-green'
  if (status.includes('Dikembalikan')) return 'badge-rose'
  return 'badge-gray'
}
</script>

<template>
  <div class="space-y-6 text-[#374151]">
    <!-- Top control bar -->
    <div class="card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="font-display font-bold text-[#0D1117] text-lg">Panel Admin</h2>
        <p class="text-sm text-[#6B7280] mt-0.5">
          Simulasi hari, kelola voucher, dan monitor seluruh transaksi sistem.
        </p>
      </div>
      <div
        class="flex items-center gap-4 bg-[#F4F6F8] border border-[#E5E8EC] rounded-xl px-4 py-3 shrink-0"
      >
        <div>
          <p class="section-label">Hari Simulasi</p>
          <p class="font-display font-bold text-[#0D1117] text-lg">{{ simulatedDay }}</p>
        </div>
        <button @click="handleSimulateNextDay" class="btn-primary">⏩ Hari Berikutnya</button>
      </div>
    </div>

    <!-- SLA alert -->
    <div
      v-if="slaTransitionAlert"
      class="px-4 py-3 bg-accent-rose-50 border border-accent-rose-100 rounded-xl text-sm text-accent-rose-700"
    >
      <strong>Simulasi selesai!</strong> Order melewati SLA otomatis dikembalikan dan paket di jalan
      ditandai terkirim.
    </div>

    <!-- Metrics -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="stat-card">
        <p class="stat-label">Total Pengguna</p>
        <p class="stat-value">{{ totalUsers }}</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">Total Produk</p>
        <p class="stat-value">{{ totalProducts }}</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">Total Pesanan</p>
        <p class="stat-value">{{ totalOrdersCount }}</p>
      </div>
      <div class="stat-card">
        <p class="stat-label">Volume Transaksi</p>
        <p class="stat-value text-primary-600 text-xl">
          Rp{{ totalTransactionVolume.toLocaleString('id-ID') }}
        </p>
      </div>
    </div>

    <!-- Main workspace -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Voucher form -->
      <div class="card p-6 space-y-5">
        <h3 class="font-display font-semibold text-[#0D1117] pb-4 border-b border-[#E5E8EC]">
          Generator Voucher
        </h3>

        <div
          v-if="promoAlertMessage"
          class="px-3 py-2.5 bg-primary-50 border border-primary-100 rounded-lg text-sm text-primary-700"
        >
          {{ promoAlertMessage }}
        </div>

        <form @submit.prevent="handleCreateVoucher" class="space-y-4">
          <div>
            <label class="input-label">Kode Voucher</label>
            <input
              type="text"
              v-model="voucherForm.code"
              placeholder="PROMOJUNI"
              class="input uppercase"
              required
            />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="input-label">Tipe Diskon</label>
              <select v-model="voucherForm.type" class="input cursor-pointer">
                <option value="percentage">Persentase (%)</option>
                <option value="delivery">Subsidi Ongkir</option>
              </select>
            </div>
            <div>
              <label class="input-label">Nilai</label>
              <input type="number" v-model.number="voucherForm.value" class="input" required />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="input-label">Min. Belanja (Rp)</label>
              <input type="number" v-model.number="voucherForm.minPurchase" class="input" />
            </div>
            <div>
              <label class="input-label">Maks. Diskon (Rp)</label>
              <input
                type="number"
                v-model.number="voucherForm.maxDiscount"
                :disabled="voucherForm.type === 'delivery'"
                class="input disabled:opacity-40"
              />
            </div>
          </div>
          <div>
            <label class="input-label">Deskripsi (Opsional)</label>
            <input
              type="text"
              v-model="voucherForm.description"
              class="input"
              placeholder="Promo spesial..."
            />
          </div>
          <button type="submit" class="btn-primary w-full justify-center">Aktifkan Voucher</button>
        </form>
      </div>

      <!-- SLA Monitor table -->
      <div class="card p-6 lg:col-span-2 space-y-5">
        <h3 class="font-display font-semibold text-[#0D1117] pb-4 border-b border-[#E5E8EC]">
          Monitor Pengiriman Global
        </h3>

        <div class="overflow-x-auto">
          <table class="w-full text-sm border-collapse">
            <thead>
              <tr class="border-b border-[#E5E8EC]">
                <th class="text-left py-2 px-3 section-label">Order</th>
                <th class="text-left py-2 px-3 section-label">Toko / Pembeli</th>
                <th class="text-left py-2 px-3 section-label">Metode</th>
                <th class="text-left py-2 px-3 section-label">Umur</th>
                <th class="text-left py-2 px-3 section-label">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#E5E8EC]">
              <tr v-if="orders.length === 0">
                <td colspan="5" class="py-8 text-center text-sm text-[#9CA3AF]">
                  Tidak ada order.
                </td>
              </tr>
              <tr
                v-for="order in orders"
                :key="order.id"
                class="hover:bg-[#F4F6F8] transition-colors"
              >
                <td class="py-3 px-3 font-mono text-xs text-[#374151]">{{ order.id }}</td>
                <td class="py-3 px-3">
                  <p class="font-medium text-[#0D1117] text-xs">{{ order.store_name }}</p>
                  <p class="text-[#9CA3AF] text-xs">{{ order.buyer_name }}</p>
                </td>
                <td class="py-3 px-3 text-xs text-[#374151]">
                  <p>{{ order.delivery_method }}</p>
                  <p class="text-[#9CA3AF]">Rp{{ order.delivery_fee.toLocaleString('id-ID') }}</p>
                </td>
                <td class="py-3 px-3">
                  <span
                    class="text-xs font-mono"
                    :class="
                      order.days_in_current_status >= 1
                        ? 'text-accent-rose-600 font-semibold'
                        : 'text-[#9CA3AF]'
                    "
                  >
                    {{ order.days_in_current_status }}h
                  </span>
                </td>
                <td class="py-3 px-3">
                  <span class="badge" :class="getStatusBadge(order.status)">{{
                    order.status
                  }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
