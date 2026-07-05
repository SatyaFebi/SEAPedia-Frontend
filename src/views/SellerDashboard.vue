<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useProductsStore } from '../stores/products'
import { useOrdersStore } from '../stores/orders'
import { apiRequest } from '../utils/api'
import Skeleton from '../components/Skeleton.vue'


const authStore = useAuthStore()
const productsStore = useProductsStore()
const ordersStore = useOrdersStore()

const user = computed(() => authStore.user)
const store = computed(() => user.value?.store || { id: '', name: '' })

const storeNameInput = ref('')
const storeNameSuccess = ref(false)
const storeNameError = ref('')

// Watch for store changes to populate input
watch(
  () => store.value,
  (newStore) => {
    if (newStore) {
      storeNameInput.value = newStore.name || ''
    }
  },
  { immediate: true },
)

onMounted(async () => {
  try {
    await productsStore.fetchProducts()
    await ordersStore.fetchSellerOrders()
  } catch (err) {
    console.error('Error mounting seller dashboard:', err)
  } finally {
    isLoading.value = false
  }
})


const sellerProducts = computed(() => productsStore.getProductsByStore(store.value.id))
const storeOrders = computed(() => ordersStore.getSellerOrders(store.value.id))
const incomingOrders = computed(() =>
  storeOrders.value.filter((o) => o.status === 'Sedang Dikemas'),
)
const processedOrders = computed(() =>
  storeOrders.value.filter((o) => o.status !== 'Sedang Dikemas'),
)

const activeTab = ref('dashboard')
const isLoading = ref(true)
const isReportLoading = ref(false)
const reportData = ref({
  summary: { total_income: 0, total_orders: 0, processed_orders: 0, incoming_orders: 0 },
  orders: [],
})


async function fetchReportData() {
  isReportLoading.value = true
  try {
    const data = await apiRequest('/reports/seller')
    reportData.value = data
  } catch (err) {
    console.error('Gagal mengambil laporan penjualan:', err)
  } finally {
    isReportLoading.value = false
  }
}


watch(activeTab, (newTab) => {
  if (newTab === 'report') {
    fetchReportData()
  }
})

const isAddModalOpen = ref(false)
const isEditModalOpen = ref(false)
const selectedProduct = ref(null)
const productForm = ref({
  name: '',
  price: 0,
  stock: 0,
  description: '',
  image: '',
  category: 'Kuliner',
})
const crudSuccessMessage = ref('')

async function handleSaveStoreName() {
  if (!storeNameInput.value.trim()) return
  storeNameError.value = ''
  storeNameSuccess.value = false
  try {
    const data = await apiRequest('/store', {
      method: 'POST',
      body: JSON.stringify({ store_name: storeNameInput.value }),
    })
    authStore.user.store = data.store
    localStorage.setItem('user', JSON.stringify(authStore.user))
    storeNameSuccess.value = true
    setTimeout(() => {
      storeNameSuccess.value = false
    }, 3000)
    await productsStore.fetchProducts()
  } catch (err) {
    storeNameError.value = err.message || 'Gagal menyimpan nama toko.'
  }
}

function openAddModal() {
  productForm.value = {
    name: '',
    price: null,
    stock: null,
    description: '',
    image: '',
    category: 'Kuliner',
  }
  isAddModalOpen.value = true
}

async function handleAddProduct() {
  if (!store.value.id) {
    alert('Silakan buat nama toko terlebih dahulu.')
    return
  }
  const res = await productsStore.addProduct(productForm.value)
  if (res.success) {
    isAddModalOpen.value = false
    triggerAlert('Produk baru berhasil ditambahkan!')
  } else {
    alert(res.message || 'Gagal menambahkan produk.')
  }
}

function openEditModal(product) {
  selectedProduct.value = product
  productForm.value = {
    name: product.name,
    price: product.price,
    stock: product.stock,
    description: product.description,
    image: product.image,
    category: product.category || 'Kuliner',
  }
  isEditModalOpen.value = true
}

async function handleEditProduct() {
  const res = await productsStore.updateProduct(selectedProduct.value.id, productForm.value)
  if (res.success) {
    isEditModalOpen.value = false
    triggerAlert('Produk berhasil diperbarui!')
  } else {
    alert(res.message || 'Gagal memperbarui produk.')
  }
}

async function handleDeleteProduct(productId) {
  if (confirm('Hapus produk ini?')) {
    const res = await productsStore.deleteProduct(productId)
    if (res.success) {
      triggerAlert('Produk berhasil dihapus!')
    } else {
      alert(res.message || 'Gagal menghapus produk.')
    }
  }
}

function triggerAlert(msg) {
  crudSuccessMessage.value = msg
  setTimeout(() => {
    crudSuccessMessage.value = ''
  }, 4000)
}

async function handleShipOrder(orderId) {
  const success = await ordersStore.processOrder(orderId)
  if (success) {
    triggerAlert('Pesanan berhasil disiapkan untuk kurir!')
    await ordersStore.fetchSellerOrders()
  }
}

const totalRevenue = computed(() =>
  storeOrders.value
    .filter((o) => o.status === 'Pesanan Selesai')
    .reduce((sum, o) => sum + o.subtotal, 0),
)
const activeProductsCount = computed(() => sellerProducts.value.length)

const statusBadge = (status) => {
  if (status === 'Menunggu Pengirim') return 'badge-blue'
  if (status === 'Sedang Dikirim') return 'badge-blue'
  if (status === 'Pesanan Selesai') return 'badge-green'
  if (status.includes('Dikembalikan')) return 'badge-rose'
  return 'badge-gray'
}
</script>

<template>
  <div class="space-y-6 text-[#374151]">
    <!-- Tab Navigation -->
    <div class="flex gap-2 border-b border-[#E5E8EC] pb-0">
      <button
        @click="activeTab = 'dashboard'"
        :class="
          activeTab === 'dashboard'
            ? 'border-b-2 border-primary-600 text-primary-600 font-semibold'
            : 'text-[#6B7280] hover:text-[#374151]'
        "
        class="px-4 py-2.5 text-sm transition-colors cursor-pointer"
      >
        🏪 Dashboard Toko
      </button>
      <button
        @click="activeTab = 'report'"
        :class="
          activeTab === 'report'
            ? 'border-b-2 border-primary-600 text-primary-600 font-semibold'
            : 'text-[#6B7280] hover:text-[#374151]'
        "
        class="px-4 py-2.5 text-sm transition-colors cursor-pointer"
      >
        📊 Laporan Penjualan
      </button>
    </div>

    <!-- Dashboard Tab -->
    <div v-show="activeTab === 'dashboard'">
      <!-- Stats row -->
      <div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div v-for="i in 4" :key="i" class="stat-card space-y-2">
          <Skeleton width="40%" height="0.75rem" />
          <Skeleton width="70%" height="1.75rem" />
        </div>
      </div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="stat-card">
          <p class="stat-label">Pendapatan Selesai</p>
          <p class="stat-value text-primary-600">Rp{{ totalRevenue.toLocaleString('id-ID') }}</p>
        </div>
        <div class="stat-card">
          <p class="stat-label">Produk Aktif</p>
          <p class="stat-value">{{ activeProductsCount }}</p>
        </div>
        <div class="stat-card">
          <p class="stat-label">Pesanan Masuk</p>
          <p class="stat-value text-accent-amber-600">{{ incomingOrders.length }}</p>
        </div>
        <!-- Store name editor -->
        <div class="card p-5 space-y-2">
          <p class="stat-label">Nama Toko</p>
          <div class="flex gap-2">
            <input type="text" v-model="storeNameInput" class="input text-sm flex-1 min-w-0" />
            <button @click="handleSaveStoreName" class="btn-primary btn-sm shrink-0">Simpan</button>
          </div>
          <p v-if="storeNameSuccess" class="text-primary-600 text-xs">Tersimpan!</p>
          <p v-if="storeNameError" class="text-accent-rose-500 text-xs">{{ storeNameError }}</p>
          <p class="text-xs text-[#9CA3AF]">ID: {{ store.id || '-' }}</p>
        </div>
      </div>


      <!-- Alert -->
      <div
        v-if="crudSuccessMessage"
        class="px-4 py-3 bg-primary-50 border border-primary-100 rounded-xl text-sm text-primary-700 font-medium"
      >
        {{ crudSuccessMessage }}
      </div>

      <!-- Main grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Product table -->
        <div class="card p-6 lg:col-span-2 space-y-5">
          <div class="flex items-center justify-between pb-4 border-b border-[#E5E8EC]">
            <h3 class="font-display font-semibold text-[#0D1117]">Produk Toko</h3>
            <button @click="openAddModal" class="btn-primary btn-sm">+ Tambah Produk</button>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-sm border-collapse">
              <thead>
                <tr class="border-b border-[#E5E8EC]">
                  <th class="text-left py-2 px-3 section-label">Produk</th>
                  <th class="text-left py-2 px-3 section-label">Stok</th>
                  <th class="text-left py-2 px-3 section-label">Harga</th>
                  <th class="py-2 px-3"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#E5E8EC]">
                <tr v-if="isLoading">
                  <td colspan="4" class="py-4 px-3">
                    <div class="space-y-3">
                      <div v-for="i in 3" :key="i" class="flex items-center justify-between gap-4 py-2 border-b border-[#E5E8EC] last:border-b-0">
                        <div class="flex items-center gap-3 flex-1">
                          <Skeleton width="2.25rem" height="2.25rem" class="shrink-0" />
                          <div class="space-y-1.5 flex-1">
                            <Skeleton width="40%" height="0.875rem" />
                            <Skeleton width="70%" height="0.75rem" />
                          </div>
                        </div>
                        <Skeleton width="3rem" height="1rem" class="shrink-0" />
                        <Skeleton width="6rem" height="1rem" class="shrink-0" />
                        <Skeleton width="5rem" height="1.25rem" class="shrink-0" />
                      </div>
                    </div>
                  </td>
                </tr>
                <tr v-else-if="sellerProducts.length === 0">
                  <td colspan="4" class="py-8 text-center text-sm text-[#9CA3AF]">
                    Belum ada produk.
                  </td>
                </tr>
                <tr
                  v-else
                  v-for="product in sellerProducts"
                  :key="product.id"
                  class="hover:bg-[#F4F6F8] transition-colors"
                >

                  <td class="py-3 px-3">
                    <div class="flex items-center gap-3">
                      <img
                        :src="product.image"
                        class="w-9 h-9 object-cover rounded-lg bg-[#E5E8EC] shrink-0"
                      />
                      <div>
                        <p class="font-medium text-[#0D1117] line-clamp-1">{{ product.name }}</p>
                        <p class="text-xs text-[#9CA3AF] truncate max-w-48">
                          {{ product.description || 'Tidak ada deskripsi' }}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td class="py-3 px-3">
                    <span
                      :class="
                        product.stock <= 5
                          ? 'text-accent-amber-600 font-semibold'
                          : 'text-[#374151]'
                      "
                      >{{ product.stock }} pcs</span
                    >
                  </td>
                  <td class="py-3 px-3 font-mono text-[#374151]">
                    Rp{{ product.price.toLocaleString('id-ID') }}
                  </td>
                  <td class="py-3 px-3 text-right space-x-3">
                    <button
                      @click="openEditModal(product)"
                      class="text-sm text-accent-blue-600 hover:text-accent-blue-700 font-medium cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      @click="handleDeleteProduct(product.id)"
                      class="text-sm text-accent-rose-500 hover:text-accent-rose-600 font-medium cursor-pointer"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Orders column -->
        <div class="space-y-5">
          <!-- Incoming orders -->
          <div class="card p-5 space-y-4">
            <h3 class="font-display font-semibold text-[#0D1117] pb-3 border-b border-[#E5E8EC]">
              Pesanan Masuk
            </h3>

            <div v-if="isLoading" class="space-y-3">
              <div v-for="i in 2" :key="i" class="border border-[#E5E8EC] rounded-xl p-4 bg-[#FAFAFA] space-y-2">
                <div class="flex justify-between">
                  <Skeleton width="4rem" height="1rem" />
                  <Skeleton width="6rem" height="1rem" />
                </div>
                <Skeleton width="80%" height="0.875rem" />
              </div>
            </div>

            <template v-else>
              <div v-if="incomingOrders.length === 0" class="py-6 text-center text-sm text-[#9CA3AF]">
                Tidak ada pesanan baru.
              </div>

              <div v-else class="space-y-3">
                <div

                v-for="order in incomingOrders"
                :key="order.id"
                class="border border-[#E5E8EC] rounded-xl p-4 space-y-3 bg-[#FAFAFA]"
              >
                <div class="flex items-center justify-between text-xs">
                  <code class="bg-[#E5E8EC] px-2 py-0.5 rounded font-mono text-[#374151]">{{
                    order.id
                  }}</code>
                  <span class="text-[#9CA3AF]">{{ order.delivery_method }}</span>
                </div>
                <div class="space-y-1">
                  <div
                    v-for="item in order.items"
                    :key="item.id"
                    class="flex justify-between text-xs text-[#374151]"
                  >
                    <span>{{ item.name }} (x{{ item.quantity }})</span>
                    <span>Rp{{ (item.price * item.quantity).toLocaleString('id-ID') }}</span>
                  </div>
                </div>

                <!-- Pricing Breakdown -->
                <div
                  class="bg-white border border-[#E5E8EC] rounded-lg p-2.5 space-y-1 text-[11px] text-[#6B7280]"
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
                    class="border-t border-[#E5E8EC] pt-1 flex justify-between font-bold text-[#0D1117] text-xs"
                  >
                    <span>Total</span>
                    <span class="text-primary-600"
                      >Rp{{ order.total.toLocaleString('id-ID') }}</span
                    >
                  </div>
                </div>

                <!-- Status log -->
                <div class="bg-white border border-[#E5E8EC] rounded-lg p-2 text-[10px]">
                  <p class="font-semibold text-[#0D1117] mb-2">Timeline Status</p>
                  <div class="space-y-1.5">
                    <div
                      v-for="(log, idx) in order.status_history"
                      :key="idx"
                      class="flex items-start gap-2 text-[10px]"
                    >
                      <div
                        class="w-1.5 h-1.5 rounded-full mt-1 shrink-0"
                        :class="
                          idx === order.status_history.length - 1
                            ? 'bg-primary-500'
                            : 'bg-[#D1D5DB]'
                        "
                      ></div>
                      <div>
                        <span class="font-medium text-[#374151]">{{ log.status }}</span>
                        <span class="text-[#9CA3AF] ml-1">· {{ log.changed_by_role }}</span>
                        <p class="text-[#9CA3AF] font-mono">{{ log.timestamp }}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="flex items-center justify-between pt-2 border-t border-[#E5E8EC]">
                  <span class="text-xs text-[#6B7280]">Pembeli: {{ order.buyer_name }}</span>
                  <button @click="handleShipOrder(order.id)" class="btn-primary btn-sm">
                    Proses Pesanan →
                  </button>
                </div>
              </div>
            </div>
            </template>
          </div>


          <!-- Order history -->
          <div class="card p-5 space-y-4">
            <h3 class="font-display font-semibold text-[#0D1117] pb-3 border-b border-[#E5E8EC]">
              Riwayat Pesanan
            </h3>

            <div v-if="isLoading" class="space-y-3">
              <div v-for="i in 2" :key="i" class="border border-[#E5E8EC] rounded-xl p-3 bg-[#FAFAFA] space-y-2">
                <div class="flex justify-between">
                  <Skeleton width="4rem" height="1rem" />
                  <Skeleton width="3rem" height="1rem" />
                </div>
                <Skeleton width="80%" height="0.875rem" />
              </div>
            </div>

            <template v-else>
              <div
                v-if="processedOrders.length === 0"
                class="py-4 text-center text-sm text-[#9CA3AF]"
              >
                Belum ada riwayat.
              </div>

              <div v-else class="space-y-3 max-h-96 overflow-y-auto pr-1">
                <div

                v-for="order in processedOrders"
                :key="order.id"
                class="border border-[#E5E8EC] rounded-xl p-3 space-y-2 bg-[#FAFAFA] text-xs"
              >
                <div class="flex items-center justify-between">
                  <code class="bg-[#E5E8EC] px-2 py-0.5 rounded font-mono text-[#374151]">{{
                    order.id
                  }}</code>
                  <span class="badge" :class="statusBadge(order.status)">{{ order.status }}</span>
                </div>

                <div class="space-y-1 text-[#374151]">
                  <div v-for="item in order.items" :key="item.id" class="flex justify-between">
                    <span>{{ item.name }} (x{{ item.quantity }})</span>
                    <span>Rp{{ (item.price * item.quantity).toLocaleString('id-ID') }}</span>
                  </div>
                </div>

                <!-- Pricing Breakdown -->
                <div
                  class="bg-white border border-[#E5E8EC] rounded-lg p-2 space-y-1 text-[10px] text-[#6B7280]"
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
                    <span>Ongkir</span>
                    <span>Rp{{ order.delivery_fee.toLocaleString('id-ID') }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span>PPN 12%</span>
                    <span>Rp{{ order.tax_amount.toLocaleString('id-ID') }}</span>
                  </div>
                  <div
                    class="border-t border-[#E5E8EC] pt-1 flex justify-between font-bold text-[#0D1117] text-xs"
                  >
                    <span>Total</span>
                    <span class="text-primary-600"
                      >Rp{{ order.total.toLocaleString('id-ID') }}</span
                    >
                  </div>
                </div>

                <!-- Driver info if assigned -->
                <div
                  v-if="order.driver_name"
                  class="flex items-center gap-2 px-2 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-[10px]"
                >
                  <span>🛵</span>
                  <span class="text-indigo-600"
                    >Driver: <strong>{{ order.driver_name }}</strong></span
                  >
                </div>

                <!-- Status log -->
                <div class="bg-white border border-[#E5E8EC] rounded-lg p-2 text-[10px]">
                  <p class="font-semibold text-[#0D1117] mb-2">Timeline Status</p>
                  <div class="space-y-1.5">
                    <div
                      v-for="(log, idx) in order.status_history"
                      :key="idx"
                      class="flex items-start gap-2"
                    >
                      <div
                        class="w-1.5 h-1.5 rounded-full mt-1 shrink-0"
                        :class="
                          idx === order.status_history.length - 1
                            ? 'bg-primary-500'
                            : 'bg-[#D1D5DB]'
                        "
                      ></div>
                      <div>
                        <span class="font-medium text-[#374151]">{{ log.status }}</span>
                        <span class="text-[#9CA3AF] ml-1">· {{ log.changed_by_role }}</span>
                        <p class="text-[#9CA3AF] font-mono">{{ log.timestamp }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- end dashboard tab -->

    <!-- Report Tab -->
    <div v-show="activeTab === 'report'" class="space-y-6">
      <!-- Summary Cards -->
      <div v-if="isReportLoading" class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div v-for="i in 4" :key="i" class="stat-card space-y-2">
          <Skeleton width="50%" height="0.75rem" />
          <Skeleton width="70%" height="1.75rem" />
        </div>
      </div>
      <div v-else class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="stat-card">
          <p class="stat-label">Total Pendapatan</p>
          <p class="stat-value text-primary-600">
            Rp{{ (reportData.summary.total_income || 0).toLocaleString('id-ID') }}
          </p>
        </div>
        <div class="stat-card">
          <p class="stat-label">Total Pesanan</p>
          <p class="stat-value">{{ reportData.summary.total_orders || 0 }}</p>
        </div>
        <div class="stat-card">
          <p class="stat-label">Pesanan Selesai</p>
          <p class="stat-value text-primary-600">{{ reportData.summary.processed_orders || 0 }}</p>
        </div>
        <div class="stat-card">
          <p class="stat-label">Pesanan Masuk</p>
          <p class="stat-value text-accent-amber-600">
            {{ reportData.summary.incoming_orders || 0 }}
          </p>
        </div>
      </div>

      <!-- Orders Table -->
      <div class="card p-6 space-y-4">
        <h3 class="font-display font-semibold text-[#0D1117] pb-3 border-b border-[#E5E8EC]">
          Riwayat Transaksi
        </h3>

        <div v-if="isReportLoading" class="space-y-3 py-4">
          <div v-for="i in 3" :key="i" class="flex justify-between items-center py-2 border-b border-[#E5E8EC] last:border-0 text-sm">
            <div class="flex gap-4 items-center flex-1">
              <Skeleton width="4rem" height="1rem" />
              <Skeleton width="6rem" height="1rem" />
              <Skeleton width="15rem" height="1rem" />
            </div>
            <Skeleton width="4rem" height="1rem" class="shrink-0" />
            <Skeleton width="6rem" height="1.25rem" class="shrink-0 ml-4" />
          </div>
        </div>

        <template v-else>
          <div
            v-if="!reportData.orders || reportData.orders.length === 0"
            class="py-10 text-center text-sm text-[#9CA3AF]"
          >
            Belum ada data penjualan.
          </div>

          <div v-else class="overflow-x-auto">

          <table class="w-full text-sm border-collapse">
            <thead>
              <tr class="border-b border-[#E5E8EC]">
                <th class="text-left py-2 px-3 section-label">Order ID</th>
                <th class="text-left py-2 px-3 section-label">Pembeli</th>
                <th class="text-left py-2 px-3 section-label">Produk</th>
                <th class="text-left py-2 px-3 section-label">Status</th>
                <th class="text-right py-2 px-3 section-label">Total</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#E5E8EC]">
              <tr
                v-for="order in reportData.orders"
                :key="order.id"
                class="hover:bg-[#F4F6F8] transition-colors"
              >
                <td class="py-3 px-3">
                  <code
                    class="bg-[#E5E8EC] px-1.5 py-0.5 rounded font-mono text-[11px] text-[#374151]"
                    >{{ order.id.slice(0, 8) }}…</code
                  >
                </td>
                <td class="py-3 px-3 text-[#374151]">{{ order.buyer_name }}</td>
                <td class="py-3 px-3 text-[#6B7280]">
                  <span v-for="(item, i) in order.items" :key="item.id">
                    {{ item.name }} (x{{ item.quantity }})<span v-if="i < order.items.length - 1"
                      >,
                    </span>
                  </span>
                </td>
                <td class="py-3 px-3">
                  <span class="badge" :class="statusBadge(order.status)">{{ order.status }}</span>
                </td>
                <td class="py-3 px-3 text-right font-mono font-semibold text-primary-600">
                  Rp{{ (order.total || 0).toLocaleString('id-ID') }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        </template>
      </div>
    </div>
    <!-- end report tab -->


    <!-- Add Product Modal -->
    <div
      v-if="isAddModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D1117]/40 backdrop-blur-sm"
    >
      <div
        class="w-full max-w-lg bg-white rounded-2xl border border-[#E5E8EC] shadow-xl overflow-hidden"
      >
        <div class="px-6 py-4 border-b border-[#E5E8EC] flex items-center justify-between">
          <h3 class="font-display font-bold text-[#0D1117]">Tambah Produk</h3>
          <button
            @click="isAddModalOpen = false"
            class="w-8 h-8 flex items-center justify-center rounded-lg bg-[#F4F6F8] text-[#6B7280] hover:text-[#0D1117] text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="input-label">Nama Produk</label>
            <input type="text" v-model="productForm.name" class="input" required />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="input-label">Harga (Rp)</label>
              <input type="number" v-model.number="productForm.price" class="input" />
            </div>
            <div>
              <label class="input-label">Stok</label>
              <input type="number" v-model.number="productForm.stock" class="input" />
            </div>
          </div>
          <div>
            <label class="input-label">Kategori</label>
            <select v-model="productForm.category" class="input cursor-pointer">
              <option value="Kuliner">Kuliner</option>
              <option value="Otomotif">Otomotif</option>
            </select>
          </div>
          <div>
            <label class="input-label">Deskripsi</label>
            <textarea v-model="productForm.description" rows="2" class="input"></textarea>
          </div>
          <div>
            <label class="input-label">URL Gambar</label>
            <input
              type="text"
              v-model="productForm.image"
              class="input"
              placeholder="https://..."
            />
          </div>
        </div>
        <div class="px-6 py-4 border-t border-[#E5E8EC] flex justify-end gap-3">
          <button @click="isAddModalOpen = false" class="btn-secondary">Batal</button>
          <button @click="handleAddProduct" class="btn-primary">Simpan Produk</button>
        </div>
      </div>
    </div>

    <!-- Edit Product Modal -->
    <div
      v-if="isEditModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D1117]/40 backdrop-blur-sm"
    >
      <div
        class="w-full max-w-lg bg-white rounded-2xl border border-[#E5E8EC] shadow-xl overflow-hidden"
      >
        <div class="px-6 py-4 border-b border-[#E5E8EC] flex items-center justify-between">
          <h3 class="font-display font-bold text-[#0D1117]">Edit Produk</h3>
          <button
            @click="isEditModalOpen = false"
            class="w-8 h-8 flex items-center justify-center rounded-lg bg-[#F4F6F8] text-[#6B7280] hover:text-[#0D1117] text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="input-label">Nama Produk</label>
            <input type="text" v-model="productForm.name" class="input" required />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="input-label">Harga (Rp)</label>
              <input type="number" v-model.number="productForm.price" class="input" />
            </div>
            <div>
              <label class="input-label">Stok</label>
              <input type="number" v-model.number="productForm.stock" class="input" />
            </div>
          </div>
          <div>
            <label class="input-label">Kategori</label>
            <select v-model="productForm.category" class="input cursor-pointer">
              <option value="Kuliner">Kuliner</option>
              <option value="Otomotif">Otomotif</option>
            </select>
          </div>
          <div>
            <label class="input-label">Deskripsi</label>
            <textarea v-model="productForm.description" rows="2" class="input"></textarea>
          </div>
          <div>
            <label class="input-label">URL Gambar</label>
            <input type="text" v-model="productForm.image" class="input" />
          </div>
        </div>
        <div class="px-6 py-4 border-t border-[#E5E8EC] flex justify-end gap-3">
          <button @click="isEditModalOpen = false" class="btn-secondary">Batal</button>
          <button @click="handleEditProduct" class="btn-primary">Perbarui</button>
        </div>
      </div>
    </div>
  </div>
</template>
