<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useCartStore } from '../stores/cart'
import { useOrdersStore } from '../stores/orders'

const authStore = useAuthStore()
const cartStore = useCartStore()
const ordersStore = useOrdersStore()
const router = useRouter()

const user = computed(() => authStore.user)
const orders = computed(() => ordersStore.getBuyerOrders(user.value?.id))

// State for top-up
const topUpAmount = ref(100000)
const topUpSuccess = ref(false)

// State for editing address
const newAddress = ref(user.value?.address || '')
const isEditingAddress = ref(false)
const addressSuccess = ref(false)

// State for voucher code input
const voucherInput = ref('')
const voucherAppliedMessage = ref('')

// Checkout status
const checkoutError = ref('')
const checkoutSuccess = ref('')

function handleTopUp() {
  if (topUpAmount.value <= 0) return
  const currentBalance = user.value.walletBalance
  authStore.updateWalletBalance(currentBalance + topUpAmount.value)
  topUpSuccess.value = true
  setTimeout(() => {
    topUpSuccess.value = false
  }, 3000)
}

function handleSaveAddress() {
  if (!newAddress.value.trim()) return
  authStore.updateAddress(newAddress.value)
  isEditingAddress.value = false
  addressSuccess.value = true
  setTimeout(() => {
    addressSuccess.value = false
  }, 3000)
}

function handleApplyVoucher() {
  voucherAppliedMessage.value = ''
  const success = cartStore.applyVoucher(voucherInput.value)
  if (success) {
    voucherAppliedMessage.value = `Voucher ${cartStore.activeVoucher.code} berhasil dipasang!`
    voucherInput.value = ''
  }
}

function handleRemoveVoucher() {
  cartStore.removeVoucher()
  voucherAppliedMessage.value = ''
}

function handleCheckout() {
  checkoutError.value = ''
  checkoutSuccess.value = ''
  
  const result = cartStore.submitCheckout()
  if (result.success) {
    checkoutSuccess.value = `Checkout Berhasil! Pesanan Anda telah dibuat dengan ID ${result.orderId}.`
    setTimeout(() => {
      checkoutSuccess.value = ''
    }, 8000)
  } else {
    checkoutError.value = result.error
  }
}

function getStatusBadgeClass(status) {
  if (status === 'Sedang Dikemas') return 'bg-amber-950 text-amber-400 border border-amber-900/50'
  if (status === 'Menunggu Pengirim') return 'bg-blue-950 text-blue-400 border border-blue-900/50'
  if (status === 'Sedang Dikirim') return 'bg-indigo-950 text-indigo-400 border border-indigo-900/50'
  if (status === 'Pesanan Selesai') return 'bg-emerald-950 text-emerald-400 border border-emerald-900/50'
  if (status.includes('Dikembalikan')) return 'bg-rose-950 text-rose-400 border border-rose-900/50'
  return 'bg-slate-800 text-slate-400 border border-slate-700'
}

function getTimelineStepClass(orderStatus, step) {
  const steps = ['Sedang Dikemas', 'Menunggu Pengirim', 'Sedang Dikirim', 'Pesanan Selesai']
  const orderIndex = steps.indexOf(orderStatus)
  const stepIndex = steps.indexOf(step)
  
  if (orderStatus.includes('Dikembalikan')) {
    if (stepIndex === 3) return 'bg-rose-900 text-rose-300 border-rose-700'
    return 'bg-slate-800 text-slate-500 border-slate-700 opacity-50'
  }
  
  if (orderIndex >= stepIndex) {
    return 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
  }
  
  return 'bg-slate-850 text-slate-500 border-slate-800'
}
</script>

<template>
  <div class="space-y-8 text-slate-200">
    <!-- Header Summary -->
    <div class="bg-gradient-to-r from-slate-905 to-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div>
        <h2 class="text-xl font-bold text-slate-100">Selamat datang kembali, {{ user?.name }}!</h2>
        <p class="text-slate-400 text-xs mt-1">Kelola saldo wallet, alamat pengiriman, belanjaan, dan lacak pesanan Anda di sini.</p>
      </div>
      <div class="flex items-center gap-4">
        <!-- Address Widget -->
        <div class="bg-slate-950 border border-slate-800 p-4 rounded-xl flex-1 md:flex-none md:w-80">
          <div class="flex items-center justify-between mb-2">
            <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Alamat Pengiriman</span>
            <button @click="isEditingAddress = !isEditingAddress" class="text-xs text-amber-400 hover:text-amber-300">
              {{ isEditingAddress ? 'Batal' : 'Ubah' }}
            </button>
          </div>
          <div v-if="isEditingAddress" class="space-y-2">
            <input
              type="text"
              v-model="newAddress"
              class="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
            <button @click="handleSaveAddress" class="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded transition-colors">
              Simpan
            </button>
          </div>
          <p v-else class="text-xs text-slate-300 line-clamp-2 leading-relaxed">
            {{ user?.address }}
          </p>
          <p v-if="addressSuccess" class="text-emerald-500 text-[10px] mt-1 font-medium">Alamat berhasil diperbarui!</p>
        </div>
      </div>
    </div>

    <!-- Top Up Simulation -->
    <section class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-slate-950 border border-slate-800 p-6 rounded-2xl md:col-span-1">
        <h3 class="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">💰 Simulasi Top Up Wallet</h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-xs text-slate-500 mb-2">Jumlah Top Up (Rp)</label>
            <input
              type="number"
              v-model.number="topUpAmount"
              class="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-emerald-500 text-sm font-semibold"
              min="10000"
              step="50000"
            />
          </div>
          
          <button
            @click="handleTopUp"
            class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-slate-950 font-bold rounded-xl transition-colors text-xs"
          >
            Isi Saldo Wallet
          </button>
          
          <div class="grid grid-cols-3 gap-2">
            <button @click="topUpAmount = 50000" class="py-1 bg-slate-900 hover:bg-slate-850 rounded border border-slate-800 text-[10px]">50rb</button>
            <button @click="topUpAmount = 250000" class="py-1 bg-slate-900 hover:bg-slate-850 rounded border border-slate-800 text-[10px]">250rb</button>
            <button @click="topUpAmount = 1000000" class="py-1 bg-slate-900 hover:bg-slate-850 rounded border border-slate-800 text-[10px]">1jt</button>
          </div>

          <p v-if="topUpSuccess" class="text-emerald-500 text-xs text-center font-semibold">
            Top Up Berhasil! Saldo telah ditambahkan.
          </p>
        </div>
      </div>

      <!-- Shopping Cart & Checkout (Locks to 1 store) -->
      <div class="bg-slate-950 border border-slate-800 p-6 rounded-2xl md:col-span-2 space-y-6">
        <div class="flex items-center justify-between border-b border-slate-800 pb-4">
          <h3 class="text-sm font-bold text-slate-400 uppercase tracking-widest">🛒 Keranjang Belanja</h3>
          <span v-if="cartStore.cartStoreName" class="text-xs bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full text-amber-400">
            Toko Terkunci: <strong>{{ cartStore.cartStoreName }}</strong>
          </span>
        </div>

        <!-- Empty Cart State -->
        <div v-if="cartStore.items.length === 0" class="text-center py-10 space-y-3">
          <p class="text-slate-500 text-sm">Keranjang belanja Anda kosong.</p>
          <router-link to="/" class="inline-block px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs hover:border-slate-700 hover:text-slate-100 transition-colors">
            Cari Produk di Katalog
          </router-link>
        </div>

        <!-- Cart Items List -->
        <div v-else class="space-y-6">
          <div class="space-y-4 max-h-60 overflow-y-auto pr-2">
            <div
              v-for="item in cartStore.items"
              :key="item.product.id"
              class="flex items-center justify-between gap-4 p-3 bg-slate-900/50 rounded-xl border border-slate-850"
            >
              <div class="flex items-center gap-3">
                <img :src="item.product.image" class="w-12 h-12 object-cover rounded-lg bg-slate-850" />
                <div>
                  <h4 class="text-xs font-semibold text-slate-200 line-clamp-1">{{ item.product.name }}</h4>
                  <p class="text-xs text-slate-400 mt-1">Rp{{ item.product.price.toLocaleString('id-ID') }}</p>
                </div>
              </div>
              
              <div class="flex items-center gap-3">
                <div class="flex items-center bg-slate-950 border border-slate-850 rounded-lg overflow-hidden">
                  <button @click="cartStore.updateQuantity(item.product.id, item.quantity - 1)" class="px-2 py-1 text-slate-500 hover:text-slate-200">-</button>
                  <span class="px-2 text-xs font-semibold">{{ item.quantity }}</span>
                  <button @click="cartStore.updateQuantity(item.product.id, item.quantity + 1)" class="px-2 py-1 text-slate-500 hover:text-slate-200">+</button>
                </div>
                
                <button @click="cartStore.removeFromCart(item.product.id)" class="text-xs text-rose-500 hover:text-rose-400">
                  Hapus
                </button>
              </div>
            </div>
          </div>

          <!-- Checkout Configuration & Breakdown -->
          <div class="border-t border-slate-800 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Kurir & Voucher inputs -->
            <div class="space-y-4">
              <!-- Delivery method selection -->
              <div>
                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Metode Pengiriman</label>
                <select
                  v-model="cartStore.selectedDelivery"
                  class="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="Regular">Regular (Ongkir Rp9.000 - SLA 2 hari)</option>
                  <option value="Next Day">Next Day (Ongkir Rp15.000 - SLA 1 hari)</option>
                  <option value="Instant">Instant (Ongkir Rp30.000 - SLA 1 hari)</option>
                </select>
              </div>

              <!-- Promo Code -->
              <div>
                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Kode Voucher / Diskon</label>
                <div class="flex gap-2">
                  <input
                    type="text"
                    v-model="voucherInput"
                    placeholder="Contoh: SEAPEDIA10"
                    class="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 uppercase focus:outline-none focus:border-amber-500"
                  />
                  <button
                    @click="handleApplyVoucher"
                    class="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition-colors"
                  >
                    Pasang
                  </button>
                </div>
                <p v-if="cartStore.discountError" class="text-rose-500 text-[10px] mt-1">{{ cartStore.discountError }}</p>
                <p v-if="voucherAppliedMessage" class="text-emerald-500 text-[10px] mt-1">{{ voucherAppliedMessage }}</p>
                
                <!-- Display Active Voucher Tag -->
                <div v-if="cartStore.activeVoucher" class="mt-2 flex items-center justify-between p-2 bg-slate-900 border border-slate-850 rounded-lg">
                  <div class="flex items-center gap-1.5 text-xs text-slate-300">
                    <span class="text-amber-400">🎟️</span>
                    <span><strong>{{ cartStore.activeVoucher.code }}</strong> aktif</span>
                  </div>
                  <button @click="handleRemoveVoucher" class="text-[10px] text-rose-500 hover:underline">Hapus</button>
                </div>
              </div>
            </div>

            <!-- Checkout Calculations Breakdown -->
            <div class="bg-slate-900/30 border border-slate-850 p-4 rounded-xl space-y-3">
              <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-850 pb-2">Rincian Pembayaran</h4>
              
              <div class="space-y-2 text-xs">
                <div class="flex justify-between text-slate-400">
                  <span>Subtotal Produk:</span>
                  <span>Rp{{ cartStore.subtotal.toLocaleString('id-ID') }}</span>
                </div>
                
                <div v-if="cartStore.discountAmount > 0" class="flex justify-between text-rose-400">
                  <span>Diskon Voucher:</span>
                  <span>-Rp{{ cartStore.discountAmount.toLocaleString('id-ID') }}</span>
                </div>

                <div class="flex justify-between text-slate-400">
                  <span>Ongkos Kirim ({{ cartStore.selectedDelivery }}):</span>
                  <span :class="{ 'line-through text-slate-600': cartStore.rawDeliveryFee !== cartStore.finalDeliveryFee }">
                    Rp{{ cartStore.rawDeliveryFee.toLocaleString('id-ID') }}
                  </span>
                </div>

                <div v-if="cartStore.rawDeliveryFee !== cartStore.finalDeliveryFee" class="flex justify-between text-emerald-400">
                  <span>Potongan Ongkir:</span>
                  <span>Rp{{ cartStore.finalDeliveryFee.toLocaleString('id-ID') }}</span>
                </div>

                <div class="flex justify-between text-slate-400">
                  <span>PPN 12%:</span>
                  <span>Rp{{ cartStore.ppnAmount.toLocaleString('id-ID') }}</span>
                </div>

                <div class="h-px bg-slate-800 my-2"></div>

                <div class="flex justify-between text-sm font-bold text-slate-200">
                  <span>Total Bayar:</span>
                  <span class="text-amber-400">Rp{{ cartStore.total.toLocaleString('id-ID') }}</span>
                </div>
              </div>

              <div class="pt-3">
                <button
                  @click="handleCheckout"
                  class="w-full py-2.5 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all"
                >
                  Bayar & Selesaikan Transaksi
                </button>
                <button
                  @click="cartStore.clearCart"
                  class="w-full mt-2 py-1.5 bg-slate-950 text-slate-500 hover:text-slate-300 text-[10px] rounded transition-colors"
                >
                  Kosongkan Keranjang
                </button>
              </div>

              <p v-if="checkoutError" class="text-rose-500 text-xs mt-2 text-center font-medium">{{ checkoutError }}</p>
              <p v-if="checkoutSuccess" class="text-emerald-500 text-xs mt-2 text-center font-medium">{{ checkoutSuccess }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Order Timeline & History Section -->
    <section class="bg-slate-950 border border-slate-800 p-6 rounded-2xl">
      <h3 class="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 pb-2 border-b border-slate-800">
        📦 Pelacakan Timeline Order Anda
      </h3>

      <div v-if="orders.length === 0" class="text-center py-8 text-slate-500 text-sm">
        Belum ada riwayat pemesanan yang dibuat.
      </div>

      <div v-else class="space-y-8">
        <div
          v-for="order in orders"
          :key="order.id"
          class="border border-slate-850 bg-slate-900/20 rounded-xl p-5 space-y-4"
        >
          <!-- Order Header details -->
          <div class="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-850">
            <div class="flex items-center gap-3">
              <span class="text-xs font-bold text-slate-300 bg-slate-850 px-2.5 py-1 rounded">
                {{ order.id }}
              </span>
              <span class="text-xs text-slate-400">
                Toko: <strong>{{ order.store_name }}</strong>
              </span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-slate-500">Dibuat: {{ order.created_at }}</span>
              <span class="text-xs font-semibold px-2.5 py-0.5 rounded" :class="getStatusBadgeClass(order.status)">
                {{ order.status }}
              </span>
            </div>
          </div>

          <!-- Items row -->
          <div class="flex flex-col gap-2 max-h-32 overflow-y-auto">
            <div v-for="item in order.items" :key="item.id" class="flex items-center justify-between text-xs text-slate-300">
              <div class="flex items-center gap-2">
                <img :src="item.image" class="w-8 h-8 object-cover rounded bg-slate-800" />
                <span>{{ item.name }} <strong>(x{{ item.quantity }})</strong></span>
              </div>
              <span>Rp{{ (item.price * item.quantity).toLocaleString('id-ID') }}</span>
            </div>
          </div>

          <!-- Price & delivery method summary -->
          <div class="flex justify-between items-center text-xs bg-slate-950 p-3 rounded-lg text-slate-400">
            <div>
              Pengiriman: <strong>{{ order.delivery_method }}</strong> 
              <span v-if="order.driver_name"> (Kurir: {{ order.driver_name }})</span>
            </div>
            <div class="text-slate-200">
              Total Pembayaran: <strong class="text-amber-400">Rp{{ order.total.toLocaleString('id-ID') }}</strong>
            </div>
          </div>

          <!-- Visual Timeline Progress -->
          <div>
            <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Timeline Pengiriman</p>
            
            <div class="grid grid-cols-4 gap-2 relative">
              <!-- Connector line -->
              <div class="absolute top-4 left-4 right-4 h-0.5 bg-slate-800 -z-10"></div>
              
              <!-- Step 1: Sedang Dikemas -->
              <div class="text-center">
                <div
                  class="w-8 h-8 rounded-full border-2 flex items-center justify-center mx-auto text-xs"
                  :class="getTimelineStepClass(order.status, 'Sedang Dikemas')"
                >
                  📦
                </div>
                <p class="text-[9px] text-slate-400 mt-1 font-semibold">Dikemas</p>
              </div>

              <!-- Step 2: Menunggu Pengirim -->
              <div class="text-center">
                <div
                  class="w-8 h-8 rounded-full border-2 flex items-center justify-center mx-auto text-xs"
                  :class="getTimelineStepClass(order.status, 'Menunggu Pengirim')"
                >
                  🏪
                </div>
                <p class="text-[9px] text-slate-400 mt-1 font-semibold">Siap Diambil</p>
              </div>

              <!-- Step 3: Sedang Dikirim -->
              <div class="text-center">
                <div
                  class="w-8 h-8 rounded-full border-2 flex items-center justify-center mx-auto text-xs"
                  :class="getTimelineStepClass(order.status, 'Sedang Dikirim')"
                >
                  🛵
                </div>
                <p class="text-[9px] text-slate-400 mt-1 font-semibold">Dalam Perjalanan</p>
              </div>

              <!-- Step 4: Pesanan Selesai / Dikembalikan -->
              <div class="text-center">
                <div
                  class="w-8 h-8 rounded-full border-2 flex items-center justify-center mx-auto text-xs"
                  :class="getTimelineStepClass(order.status, 'Pesanan Selesai')"
                >
                  🏁
                </div>
                <p class="text-[9px] text-slate-400 mt-1 font-semibold">
                  {{ order.status.includes('Dikembalikan') ? 'Dikembalikan' : 'Selesai' }}
                </p>
              </div>
            </div>
          </div>

          <!-- Detailed Status History Logs -->
          <div class="bg-slate-950/50 p-3 rounded-lg border border-slate-900/50">
            <p class="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Riwayat Status Detail</p>
            <ul class="space-y-1">
              <li v-for="log in order.status_history" :key="log.status" class="text-[10px] text-slate-400 flex items-center justify-between">
                <span>🟢 Status berubah menjadi <strong class="text-slate-300">{{ log.status }}</strong></span>
                <span class="text-slate-500 font-mono">{{ log.timestamp }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
