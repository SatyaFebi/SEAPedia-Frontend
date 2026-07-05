<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useCartStore } from '../stores/cart'
import { useOrdersStore } from '../stores/orders'
import { apiRequest } from '../utils/api'
import Skeleton from '../components/Skeleton.vue'


const authStore = useAuthStore()
const cartStore = useCartStore()
const ordersStore = useOrdersStore()
const router = useRouter()

const user = computed(() => authStore.user)
const orders = computed(() => ordersStore.getBuyerOrders(user.value?.id))

const topUpAmount = ref(100000)
const topUpSuccess = ref(false)
const newAddress = ref(user.value?.address || '')
const isEditingAddress = ref(false)
const addressSuccess = ref(false)
const voucherInput = ref('')
const voucherAppliedMessage = ref('')
const checkoutError = ref('')
const checkoutSuccess = ref('')

const walletTransactions = ref([])
const activeTab = ref('dashboard')
const isLoading = ref(true)
const isReportLoading = ref(false)
const reportData = ref({
  summary: { total_spending: 0, total_orders: 0, completed_orders: 0 },
  orders: [],
})


async function fetchReportData() {
  isReportLoading.value = true
  try {
    const data = await apiRequest('/reports/buyer')
    reportData.value = data
  } catch (err) {
    console.error('Gagal mengambil laporan belanja:', err)
  } finally {
    isReportLoading.value = false
  }
}


watch(activeTab, (newTab) => {
  if (newTab === 'report') {
    fetchReportData()
  }
})

async function fetchWalletData() {
  try {
    const data = await apiRequest('/wallet')
    walletTransactions.value = data.transactions || []
    if (authStore.user) {
      authStore.user.walletBalance = data.balance
    }
  } catch (err) {
    console.error('Gagal mengambil data wallet:', err)
  }
}

async function handleTopUp() {
  if (topUpAmount.value <= 0) return
  const res = await authStore.topUpWallet(topUpAmount.value)
  if (res.success) {
    topUpSuccess.value = true
    await fetchWalletData()
    setTimeout(() => {
      topUpSuccess.value = false
    }, 3000)
  } else {
    alert('Gagal top up: ' + res.message)
  }
}

async function handleSaveAddress() {
  if (!newAddress.value.trim()) return
  const res = await authStore.updateAddress(newAddress.value)
  if (res.success) {
    isEditingAddress.value = false
    addressSuccess.value = true
    setTimeout(() => {
      addressSuccess.value = false
    }, 3000)
  } else {
    alert('Gagal mengubah alamat: ' + res.message)
  }
}

async function handleApplyVoucher() {
  voucherAppliedMessage.value = ''
  const success = await cartStore.applyVoucher(voucherInput.value)
  if (success) {
    const typeLabel = cartStore.activeVoucher.type === 'VOUCHER' ? 'Voucher' : 'Promo'
    voucherAppliedMessage.value = `${typeLabel} ${cartStore.activeVoucher.code} berhasil dipasang!`
    voucherInput.value = ''
  }
}

function handleRemoveVoucher() {
  cartStore.removeVoucher()
  voucherAppliedMessage.value = ''
}

async function handleCheckout() {
  checkoutError.value = ''
  checkoutSuccess.value = ''
  const result = await cartStore.submitCheckout()
  if (result.success) {
    checkoutSuccess.value = `Checkout berhasil! ID Pesanan: ${result.orderId}`
    await ordersStore.fetchBuyerOrders()
    await fetchWalletData()
    setTimeout(() => {
      checkoutSuccess.value = ''
    }, 8000)
  } else {
    checkoutError.value = result.error
  }
}

function getStatusBadge(status) {
  if (status === 'Sedang Dikemas') return 'badge-amber'
  if (status === 'Menunggu Pengirim') return 'badge-blue'
  if (status === 'Sedang Dikirim') return 'badge badge-blue'
  if (status === 'Pesanan Selesai') return 'badge-green'
  if (status.includes('Dikembalikan')) return 'badge-rose'
  return 'badge-gray'
}

function getTimelineStepClass(orderStatus, step) {
  const steps = ['Sedang Dikemas', 'Menunggu Pengirim', 'Sedang Dikirim', 'Pesanan Selesai']
  const orderIndex = steps.indexOf(orderStatus)
  const stepIndex = steps.indexOf(step)
  if (orderStatus.includes('Dikembalikan')) {
    if (stepIndex === 3) return 'bg-accent-rose-50 border-accent-rose-200 text-accent-rose-600'
    return 'bg-[#F4F6F8] border-[#E5E8EC] text-[#9CA3AF] opacity-50'
  }
  if (orderIndex >= stepIndex) return 'bg-primary-600 border-primary-500 text-white'
  return 'bg-[#F4F6F8] border-[#E5E8EC] text-[#9CA3AF]'
}

onMounted(async () => {
  try {
    await authStore.checkAuth()
    await cartStore.fetchCart()
    await ordersStore.fetchBuyerOrders()
    await fetchWalletData()
    newAddress.value = authStore.user?.address || ''
  } catch (err) {
    console.error('Error on mounting buyer dashboard:', err)
  } finally {
    isLoading.value = false
  }
})

</script>

<template>
  <div class="space-y-6 text-[#374151]">
    <!-- Tab Bar -->
    <div class="flex border-b border-[#E5E8EC]">
      <button
        @click="activeTab = 'dashboard'"
        class="px-5 py-3 font-display font-medium text-sm border-b-2 transition-all cursor-pointer"
        :class="
          activeTab === 'dashboard'
            ? 'border-primary-600 text-[#0D1117] font-semibold'
            : 'border-transparent text-[#6B7280] hover:text-[#0D1117]'
        "
      >
        🛒 Belanja &amp; Wallet
      </button>
      <button
        @click="activeTab = 'report'"
        class="px-5 py-3 font-display font-medium text-sm border-b-2 transition-all cursor-pointer"
        :class="
          activeTab === 'report'
            ? 'border-primary-600 text-[#0D1117] font-semibold'
            : 'border-transparent text-[#6B7280] hover:text-[#0D1117]'
        "
      >
        📊 Laporan Pengeluaran
      </button>
    </div>

    <!-- Dashboard Content Tab -->
    <div v-if="activeTab === 'dashboard'" class="space-y-6">
      <!-- Header row -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Welcome + Address -->
        <div class="card p-5 md:col-span-2 space-y-1">
          <div v-if="isLoading" class="space-y-3 py-1">
            <Skeleton width="40%" height="1.5rem" />
            <Skeleton width="60%" height="1rem" />
            <div class="pt-3 border-t border-[#E5E8EC] space-y-2">
              <Skeleton width="30%" height="0.75rem" />
              <Skeleton width="100%" height="1.25rem" />
            </div>
          </div>
          <template v-else>
            <h2 class="font-display font-bold text-[#0D1117] text-lg">Halo, {{ user?.name }}!</h2>
            <p class="text-sm text-[#6B7280]">
              Kelola wallet, keranjang belanja, dan lacak pesanan Anda.
            </p>
            <div class="mt-3 pt-3 border-t border-[#E5E8EC]">
              <div class="flex items-center justify-between mb-1.5">
                <span class="section-label">Alamat Pengiriman</span>
                <button
                  @click="isEditingAddress = !isEditingAddress"
                  class="text-xs text-primary-600 hover:text-primary-700 cursor-pointer font-medium"
                >
                  {{ isEditingAddress ? 'Batal' : 'Ubah' }}
                </button>
              </div>
              <div v-if="isEditingAddress" class="flex gap-2">
                <input type="text" v-model="newAddress" class="input flex-1 text-sm" />
                <button @click="handleSaveAddress" class="btn-primary btn-sm">Simpan</button>
              </div>
              <p v-else class="text-sm text-[#374151] leading-relaxed">{{ user?.address }}</p>
              <p v-if="addressSuccess" class="text-primary-600 text-xs mt-1">
                Alamat berhasil diperbarui!
              </p>
            </div>
          </template>
        </div>


        <!-- Wallet + Top up -->
        <div class="card p-5 space-y-4">
          <div v-if="isLoading" class="space-y-4 py-1">
            <div class="space-y-1">
              <Skeleton width="30%" height="0.75rem" />
              <Skeleton width="70%" height="1.75rem" />
            </div>
            <div class="space-y-2">
              <Skeleton width="100%" height="2rem" />
              <div class="flex gap-2">
                <Skeleton width="33%" height="1.5rem" />
                <Skeleton width="33%" height="1.5rem" />
                <Skeleton width="33%" height="1.5rem" />
              </div>
              <Skeleton width="100%" height="2rem" />
            </div>
          </div>
          <template v-else>
            <div>
              <p class="section-label">Saldo Wallet</p>
              <p class="font-display font-bold text-[#0D1117] text-2xl mt-1">
                Rp{{ user?.walletBalance?.toLocaleString('id-ID') || '0' }}
              </p>
            </div>
            <div class="space-y-2">
              <input
                type="number"
                v-model.number="topUpAmount"
                class="input text-sm"
                min="10000"
                step="50000"
              />
              <div class="flex gap-2">
                <button @click="topUpAmount = 50000" class="btn-ghost btn-sm flex-1">50rb</button>
                <button @click="topUpAmount = 250000" class="btn-ghost btn-sm flex-1">250rb</button>
                <button @click="topUpAmount = 1000000" class="btn-ghost btn-sm flex-1">1jt</button>
              </div>
              <button @click="handleTopUp" class="btn-primary w-full justify-center">Top Up</button>
              <p v-if="topUpSuccess" class="text-primary-600 text-xs text-center">
                Saldo berhasil ditambahkan!
              </p>
            </div>

            <!-- Wallet Top Up History / Transactions -->
            <div class="mt-4 pt-3 border-t border-[#E5E8EC] space-y-2">
              <p class="section-label text-xs">Riwayat Transaksi Wallet</p>
              <div
                v-if="walletTransactions.length === 0"
                class="text-xs text-[#9CA3AF] text-center py-2"
              >
                Belum ada riwayat transaksi.
              </div>
              <div v-else class="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                <div
                  v-for="tx in walletTransactions"
                  :key="tx.id"
                  class="flex justify-between items-center text-xs p-2 rounded bg-[#F4F6F8] border border-[#E5E8EC]"
                >
                  <div class="min-w-0 flex-1 pr-2">
                    <span
                      class="font-semibold text-[11px]"
                      :class="tx.amount > 0 ? 'text-primary-600' : 'text-accent-rose-600'"
                    >
                      {{ tx.amount > 0 ? '+' : '' }}Rp{{ tx.amount.toLocaleString('id-ID') }}
                    </span>
                    <p class="text-[9px] text-[#9CA3AF] truncate" :title="tx.description">
                      {{ tx.description }}
                    </p>
                  </div>
                  <span class="text-[9px] font-mono text-[#9CA3AF] shrink-0">{{
                    tx.created_at
                  }}</span>
                </div>
              </div>
            </div>
          </template>
        </div>

      </div>

      <!-- Cart + Checkout -->
      <div class="card p-6 space-y-5">
        <div class="flex items-center justify-between pb-4 border-b border-[#E5E8EC]">
          <h3 class="font-display font-semibold text-[#0D1117]">Keranjang Belanja</h3>
          <span v-if="cartStore.cartStoreName" class="badge badge-amber">{{
            cartStore.cartStoreName
          }}</span>
        </div>

        <!-- Skeleton Loader for Cart -->
        <div v-if="isLoading" class="space-y-3">
          <div v-for="i in 2" :key="i" class="flex items-center gap-4 p-3 rounded-xl bg-[#F4F6F8] border border-[#E5E8EC]">
            <Skeleton width="3rem" height="3rem" class="shrink-0" />
            <div class="flex-1 space-y-1.5">
              <Skeleton width="40%" height="1rem" />
              <Skeleton width="20%" height="0.75rem" />
            </div>
            <Skeleton width="4rem" height="1.75rem" />
          </div>
        </div>

        <template v-else>
          <!-- Empty -->
          <div v-if="cartStore.items.length === 0" class="py-10 text-center space-y-3">
            <p class="text-sm text-[#9CA3AF]">Keranjang Anda kosong.</p>
            <router-link to="/" class="btn-secondary btn-sm inline-flex">Cari Produk</router-link>
          </div>

          <!-- Items -->
          <div v-else class="space-y-6">

          <div class="space-y-3 max-h-64 overflow-y-auto">
            <div
              v-for="item in cartStore.items"
              :key="item.product.id"
              class="flex items-center gap-4 p-3 rounded-xl bg-[#F4F6F8] border border-[#E5E8EC]"
            >
              <img
                :src="item.product.image"
                class="w-12 h-12 object-cover rounded-lg bg-[#E5E8EC] shrink-0"
              />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-[#0D1117] truncate">{{ item.product.name }}</p>
                <p class="text-xs text-[#9CA3AF]">
                  Rp{{ item.product.price.toLocaleString('id-ID') }}
                </p>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <div
                  class="flex items-center bg-white border border-[#E5E8EC] rounded-lg overflow-hidden"
                >
                  <button
                    @click="cartStore.updateQuantity(item.product.id, item.quantity - 1)"
                    class="px-2.5 py-1 text-[#6B7280] hover:text-[#0D1117] cursor-pointer text-sm"
                  >
                    −
                  </button>
                  <span class="px-2 text-xs font-semibold">{{ item.quantity }}</span>
                  <button
                    @click="cartStore.updateQuantity(item.product.id, item.quantity + 1)"
                    class="px-2.5 py-1 text-[#6B7280] hover:text-[#0D1117] cursor-pointer text-sm"
                  >
                    +
                  </button>
                </div>
                <button
                  @click="cartStore.removeFromCart(item.product.id)"
                  class="text-xs text-accent-rose-500 hover:text-accent-rose-600 cursor-pointer"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>

          <!-- Checkout config + breakdown -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-[#E5E8EC]">
            <!-- Config -->
            <div class="space-y-4">
              <div>
                <label class="input-label">Metode Pengiriman</label>
                <select v-model="cartStore.selectedDelivery" class="input text-sm cursor-pointer">
                  <option value="Regular">Regular — Rp9.000 (SLA 2 hari)</option>
                  <option value="Next Day">Next Day — Rp15.000 (SLA 1 hari)</option>
                  <option value="Instant">Instant — Rp30.000 (SLA 1 hari)</option>
                </select>
              </div>
              <div>
                <label class="input-label">Kode Diskon</label>
                <div class="flex gap-2">
                  <input
                    type="text"
                    v-model="voucherInput"
                    placeholder="cth. SEAPEDIA10"
                    class="input flex-1 uppercase text-sm"
                  />
                  <button @click="handleApplyVoucher" class="btn-primary btn-sm">Pasang</button>
                </div>
                <p v-if="cartStore.discountError" class="text-accent-rose-500 text-xs mt-1">
                  {{ cartStore.discountError }}
                </p>
                <p v-if="voucherAppliedMessage" class="text-primary-600 text-xs mt-1">
                  {{ voucherAppliedMessage }}
                </p>
                <div
                  v-if="cartStore.activeVoucher"
                  class="mt-2 flex items-center justify-between px-3 py-2 bg-primary-50 border border-primary-100 rounded-lg"
                >
                  <span class="text-xs text-primary-700 font-medium"
                    >🎟️ {{ cartStore.activeVoucher.type === 'VOUCHER' ? 'Voucher' : 'Promo' }}
                    {{ cartStore.activeVoucher.code }} aktif</span
                  >
                  <button
                    @click="handleRemoveVoucher"
                    class="text-xs text-accent-rose-500 hover:underline cursor-pointer"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </div>

            <!-- Breakdown -->
            <div class="bg-[#F4F6F8] rounded-xl border border-[#E5E8EC] p-4 space-y-3">
              <p class="section-label border-b border-[#E5E8EC] pb-2">Rincian Pembayaran</p>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between text-[#6B7280]">
                  <span>Subtotal</span>
                  <span>Rp{{ cartStore.subtotal.toLocaleString('id-ID') }}</span>
                </div>
                <div
                  v-if="cartStore.discountAmount > 0"
                  class="flex justify-between text-accent-rose-600"
                >
                  <span
                    >Diskon
                    {{ cartStore.activeVoucher?.type === 'VOUCHER' ? 'Voucher' : 'Promo' }}</span
                  >
                  <span>−Rp{{ cartStore.discountAmount.toLocaleString('id-ID') }}</span>
                </div>
                <div class="flex justify-between text-[#6B7280]">
                  <span>Ongkos Kirim</span>
                  <span
                    :class="{
                      'line-through text-[#9CA3AF]':
                        cartStore.rawDeliveryFee !== cartStore.finalDeliveryFee,
                    }"
                  >
                    Rp{{ cartStore.rawDeliveryFee.toLocaleString('id-ID') }}
                  </span>
                </div>
                <div
                  v-if="cartStore.rawDeliveryFee !== cartStore.finalDeliveryFee"
                  class="flex justify-between text-primary-600"
                >
                  <span>Potongan Ongkir</span>
                  <span>Rp{{ cartStore.finalDeliveryFee.toLocaleString('id-ID') }}</span>
                </div>
                <div class="flex justify-between text-[#6B7280]">
                  <span>PPN 12%</span>
                  <span>Rp{{ cartStore.ppnAmount.toLocaleString('id-ID') }}</span>
                </div>
                <div class="divider"></div>
                <div class="flex justify-between font-display font-bold text-[#0D1117]">
                  <span>Total Bayar</span>
                  <span class="text-primary-600"
                    >Rp{{ cartStore.total.toLocaleString('id-ID') }}</span
                  >
                </div>
              </div>
              <div class="space-y-2 pt-1">
                <button @click="handleCheckout" class="btn-primary w-full justify-center">
                  Bayar Sekarang
                </button>
                <button
                  @click="cartStore.clearCart"
                  class="btn-ghost w-full justify-center text-xs text-[#9CA3AF]"
                >
                  Kosongkan Keranjang
                </button>
              </div>
              <p v-if="checkoutError" class="text-accent-rose-500 text-xs text-center">
                {{ checkoutError }}
              </p>
              <p v-if="checkoutSuccess" class="text-primary-600 text-xs text-center font-medium">
                {{ checkoutSuccess }}
              </p>
            </div>
          </div>
        </div>
      </template>
    </div>

      <!-- Order tracking -->
      <div class="card p-6 space-y-5">
        <h3 class="font-display font-semibold text-[#0D1117] pb-4 border-b border-[#E5E8EC]">
          Lacak Pesanan
        </h3>

        <!-- Skeleton Loader for Orders -->
        <div v-if="isLoading" class="space-y-4">
          <div v-for="i in 2" :key="i" class="border border-[#E5E8EC] rounded-xl p-5 space-y-4 bg-[#FAFAFA]">
            <div class="flex justify-between items-center pb-3 border-b border-[#E5E8EC]">
              <div class="flex items-center gap-2">
                <Skeleton width="4rem" height="1rem" />
                <Skeleton width="6rem" height="1rem" />
              </div>
              <Skeleton width="5rem" height="1.25rem" />
            </div>
            <div class="space-y-2">
              <Skeleton width="70%" height="1rem" />
              <Skeleton width="30%" height="0.875rem" />
            </div>
          </div>
        </div>

        <template v-else>
          <div v-if="orders.length === 0" class="py-8 text-center text-sm text-[#9CA3AF]">
            Belum ada pesanan. Mulai belanja dari katalog!
          </div>

          <div v-else class="space-y-5">

          <div
            v-for="order in orders"
            :key="order.id"
            class="border border-[#E5E8EC] rounded-xl p-5 space-y-4 bg-[#FAFAFA]"
          >
            <!-- Header -->
            <div
              class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E5E8EC]"
            >
              <div class="flex items-center gap-2">
                <code class="text-xs bg-[#E5E8EC] px-2 py-0.5 rounded font-mono text-[#374151]">{{
                  order.id
                }}</code>
                <span class="text-xs text-[#6B7280]">{{ order.store_name }}</span>
              </div>
              <span class="badge" :class="getStatusBadge(order.status)">{{ order.status }}</span>
            </div>

            <!-- Items -->
            <div class="space-y-2">
              <div
                v-for="item in order.items"
                :key="item.id"
                class="flex items-center justify-between text-xs text-[#374151]"
              >
                <div class="flex items-center gap-2">
                  <img :src="item.image" class="w-7 h-7 object-cover rounded bg-[#E5E8EC]" />
                  <span
                    >{{ item.name }} <strong>(x{{ item.quantity }})</strong></span
                  >
                </div>
                <span>Rp{{ (item.price * item.quantity).toLocaleString('id-ID') }}</span>
              </div>
            </div>

            <!-- Summary Breakdown -->
            <div class="bg-white border border-[#E5E8EC] rounded-lg p-3 space-y-2 text-xs">
              <div class="flex justify-between text-[#6B7280]">
                <span>Subtotal</span>
                <span>Rp{{ order.subtotal.toLocaleString('id-ID') }}</span>
              </div>
              <div
                v-if="order.discount_amount > 0"
                class="flex justify-between text-accent-rose-600"
              >
                <span
                  >Diskon ({{ order.discount_type === 'VOUCHER' ? 'Voucher' : 'Promo' }}:
                  {{ order.discount_code }})</span
                >
                <span>-Rp{{ order.discount_amount.toLocaleString('id-ID') }}</span>
              </div>
              <div class="flex justify-between text-[#6B7280]">
                <span
                  >Ongkos Kirim ({{ order.delivery_method }})<span v-if="order.driver_name">
                    · {{ order.driver_name }}</span
                  ></span
                >
                <span>Rp{{ order.delivery_fee.toLocaleString('id-ID') }}</span>
              </div>
              <div class="flex justify-between text-[#6B7280]">
                <span>PPN 12%</span>
                <span>Rp{{ order.tax_amount.toLocaleString('id-ID') }}</span>
              </div>
              <div
                class="border-t border-[#E5E8EC] pt-2 flex justify-between font-bold text-[#0D1117] text-xs"
              >
                <span>Total Akhir</span>
                <span class="text-primary-600">Rp{{ order.total.toLocaleString('id-ID') }}</span>
              </div>
            </div>

            <!-- Timeline -->
            <div>
              <p class="section-label mb-2">Timeline Pengiriman</p>
              <div class="grid grid-cols-4 gap-2 relative">
                <div class="absolute top-3.5 left-6 right-6 h-0.5 bg-[#E5E8EC] -z-10"></div>
                <div
                  v-for="(step, label) in {
                    'Sedang Dikemas': '📦',
                    'Menunggu Pengirim': '🏪',
                    'Sedang Dikirim': '🛵',
                    'Pesanan Selesai': '🏁',
                  }"
                  :key="step"
                  class="text-center"
                >
                  <div
                    class="w-7 h-7 rounded-full border-2 flex items-center justify-center mx-auto text-xs transition-colors"
                    :class="getTimelineStepClass(order.status, step)"
                  >
                    {{ label }}
                  </div>
                  <p class="text-[9px] text-[#9CA3AF] mt-1">
                    {{
                      step === 'Sedang Dikemas'
                        ? 'Dikemas'
                        : step === 'Menunggu Pengirim'
                          ? 'Siap Ambil'
                          : step === 'Sedang Dikirim'
                            ? 'Dikirim'
                            : order.status.includes('Dikembalikan')
                              ? 'Dikembalikan'
                              : 'Selesai'
                    }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Driver info (when assigned) -->
            <div
              v-if="order.driver_name"
              class="flex items-center gap-3 px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-xl text-sm"
            >
              <span class="text-2xl">🛵</span>
              <div>
                <p class="text-xs text-indigo-500 mb-0.5">Driver Pengiriman</p>
                <p class="font-semibold text-indigo-800">{{ order.driver_name }}</p>
              </div>
              <span
                class="ml-auto text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full"
                >{{ order.delivery_method }}</span
              >
            </div>

            <!-- Status log -->
            <div class="bg-white border border-[#E5E8EC] rounded-lg p-3">
              <p class="section-label mb-3">Riwayat Status</p>
              <div class="space-y-2">
                <div
                  v-for="(log, idx) in order.status_history"
                  :key="idx"
                  class="flex items-start gap-3 text-xs"
                >
                  <div class="flex flex-col items-center">
                    <div
                      class="w-2 h-2 rounded-full mt-1 shrink-0"
                      :class="
                        idx === order.status_history.length - 1 ? 'bg-primary-500' : 'bg-[#D1D5DB]'
                      "
                    ></div>
                    <div
                      v-if="idx < order.status_history.length - 1"
                      class="w-px h-4 bg-[#E5E8EC] mt-1"
                    ></div>
                  </div>
                  <div class="flex-1 pb-1">
                    <p class="font-medium text-[#374151]">{{ log.status }}</p>
                    <p class="text-[#9CA3AF] mt-0.5">
                      {{ log.changed_by_role }} · {{ log.timestamp }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
  
    <!-- Spending Report Tab -->
    <div v-else class="space-y-6">
      <!-- Report Summary cards -->
      <div v-if="isReportLoading" class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div v-for="i in 3" :key="i" class="stat-card space-y-2">
          <Skeleton width="50%" height="0.75rem" />
          <Skeleton width="70%" height="1.75rem" />
        </div>
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="stat-card">
          <p class="stat-label">Total Pengeluaran</p>
          <p class="stat-value text-primary-600">
            Rp{{ reportData.summary.total_spending.toLocaleString('id-ID') }}
          </p>
        </div>
        <div class="stat-card">
          <p class="stat-label">Total Pesanan</p>
          <p class="stat-value">{{ reportData.summary.total_orders }}</p>
        </div>
        <div class="stat-card">
          <p class="stat-label">Pesanan Selesai</p>
          <p class="stat-value text-accent-green-600">{{ reportData.summary.completed_orders }}</p>
        </div>
      </div>

      <!-- Report List -->
      <div class="card p-6 space-y-5">
        <h3 class="font-display font-semibold text-[#0D1117] pb-4 border-b border-[#E5E8EC]">
          Detail Transaksi Belanja
        </h3>

        <div v-if="isReportLoading" class="space-y-4">
          <div v-for="i in 2" :key="i" class="border border-[#E5E8EC] rounded-xl p-5 bg-[#FAFAFA] space-y-3">
            <div class="flex justify-between items-center pb-2 border-b border-[#E5E8EC]">
              <div class="flex gap-2">
                <Skeleton width="5rem" height="1rem" />
                <Skeleton width="8rem" height="1rem" />
              </div>
              <Skeleton width="5rem" height="1rem" />
            </div>
            <div class="space-y-1.5">
              <Skeleton width="60%" height="0.875rem" />
              <Skeleton width="40%" height="0.875rem" />
            </div>
          </div>
        </div>

        <template v-else>
          <div v-if="reportData.orders.length === 0" class="py-8 text-center text-sm text-[#9CA3AF]">
            Belum ada riwayat transaksi belanja.
          </div>


        <div v-else class="space-y-5">
          <div
            v-for="order in reportData.orders"
            :key="order.id"
            class="border border-[#E5E8EC] rounded-xl p-5 bg-[#FAFAFA] space-y-4"
          >
            <!-- Header -->
            <div class="flex justify-between items-center pb-2 border-b border-[#E5E8EC] text-xs">
              <div>
                <span class="font-mono bg-[#E5E8EC] px-2 py-0.5 rounded text-[#374151]">{{
                  order.id
                }}</span>
                <span class="text-[#6B7280] ml-2">Toko: {{ order.store_name }}</span>
              </div>
              <span class="text-[#9CA3AF]">{{ order.created_at }}</span>
            </div>

            <!-- Items -->
            <div class="space-y-1.5 text-xs">
              <div v-for="item in order.items" :key="item.name" class="flex justify-between">
                <span>{{ item.name }} (x{{ item.quantity }})</span>
                <span>Rp{{ (item.price * item.quantity).toLocaleString('id-ID') }}</span>
              </div>
            </div>

            <!-- Breakdown -->
            <div
              class="bg-white border border-[#E5E8EC] rounded-lg p-3 space-y-1.5 text-xs text-[#6B7280]"
            >
              <div class="flex justify-between">
                <span>Subtotal</span>
                <span>Rp{{ order.subtotal.toLocaleString('id-ID') }}</span>
              </div>
              <div
                v-if="order.discount_amount > 0"
                class="flex justify-between text-accent-rose-600"
              >
                <span
                  >Diskon ({{ order.discount_type === 'VOUCHER' ? 'Voucher' : 'Promo' }}:
                  {{ order.discount_code }})</span
                >
                <span>-Rp{{ order.discount_amount.toLocaleString('id-ID') }}</span>
              </div>
              <div class="flex justify-between">
                <span>Ongkos Kirim</span>
                <span>Rp{{ order.delivery_fee.toLocaleString('id-ID') }}</span>
              </div>
              <div class="flex justify-between">
                <span>PPN 12%</span>
                <span>Rp{{ order.tax_amount.toLocaleString('id-ID') }}</span>
              </div>
              <div
                class="border-t border-[#E5E8EC] pt-1.5 flex justify-between font-bold text-[#0D1117] text-sm"
              >
                <span>Total Bayar</span>
                <span class="text-primary-600">Rp{{ order.total.toLocaleString('id-ID') }}</span>
              </div>
            </div>

            <!-- Timeline / Logs -->
            <div class="bg-white border border-[#E5E8EC] rounded-lg p-3 text-xs">
              <p class="font-semibold text-[#0D1117] mb-2">Riwayat Log Status</p>
              <ul class="space-y-1">
                <li
                  v-for="log in order.status_history"
                  :key="log.status"
                  class="flex justify-between text-xs text-[#6B7280]"
                >
                  <span
                    >→ {{ log.status }}
                    <span class="text-[10px] text-[#9CA3AF]"
                      >(oleh {{ log.changed_by_role }})</span
                    ></span
                  >
                  <span class="font-mono text-[#9CA3AF]">{{ log.timestamp }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</div>
</template>
