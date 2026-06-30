<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useProductsStore } from '../stores/products'
import { useOrdersStore } from '../stores/orders'

const authStore = useAuthStore()
const productsStore = useProductsStore()
const ordersStore = useOrdersStore()

const user = computed(() => authStore.user)
const store = computed(() => user.value?.store || { id: '', name: 'Toko Saya' })

// Store setup state
const storeNameInput = ref(store.value.name)
const storeNameSuccess = ref(false)

// Products List
const sellerProducts = computed(() => productsStore.getProductsByStore(store.value.id))

// Active orders at this store
const storeOrders = computed(() => ordersStore.getSellerOrders(store.value.id))
const incomingOrders = computed(() => storeOrders.value.filter(o => o.status === 'Sedang Dikemas'))
const processedOrders = computed(() => storeOrders.value.filter(o => o.status !== 'Sedang Dikemas'))

// Product CRUD Modal/State
const isAddModalOpen = ref(false)
const isEditModalOpen = ref(false)
const selectedProduct = ref(null)

const productForm = ref({
  name: '',
  price: 0,
  stock: 0,
  description: '',
  image: ''
})

const crudSuccessMessage = ref('')

function handleSaveStoreName() {
  if (!storeNameInput.value.trim()) return
  // Update auth store user details
  user.value.store = user.value.store || {}
  user.value.store.name = storeNameInput.value
  
  // Also update product catalog store names
  productsStore.products.forEach(p => {
    if (p.store_id === store.value.id) {
      p.store_name = storeNameInput.value
    }
  })
  
  // Also update order store names
  ordersStore.orders.forEach(o => {
    if (o.store_id === store.value.id) {
      o.store_name = storeNameInput.value
    }
  })

  storeNameSuccess.value = true
  setTimeout(() => {
    storeNameSuccess.value = false
  }, 3000)
}

function openAddModal() {
  productForm.value = {
    name: '',
    price: 15000,
    stock: 10,
    description: '',
    image: ''
  }
  isAddModalOpen.value = true
}

function handleAddProduct() {
  productsStore.addProduct(productForm.value, store.value)
  isAddModalOpen.value = false
  triggerCrudAlert('Produk baru berhasil ditambahkan!')
}

function openEditModal(product) {
  selectedProduct.value = product
  productForm.value = {
    name: product.name,
    price: product.price,
    stock: product.stock,
    description: product.description,
    image: product.image
  }
  isEditModalOpen.value = true
}

function handleEditProduct() {
  productsStore.updateProduct(selectedProduct.value.id, productForm.value)
  isEditModalOpen.value = false
  triggerCrudAlert('Produk berhasil diperbarui!')
}

function handleDeleteProduct(productId) {
  if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
    productsStore.deleteProduct(productId)
    triggerCrudAlert('Produk berhasil dihapus!')
  }
}

function triggerCrudAlert(msg) {
  crudSuccessMessage.value = msg
  setTimeout(() => {
    crudSuccessMessage.value = ''
  }, 4000)
}

// Order status transitioning
function handleShipOrder(orderId) {
  // transition: Sedang Dikemas -> Menunggu Pengirim
  const success = ordersStore.transitionOrderStatus(orderId, 'Menunggu Pengirim')
  if (success) {
    triggerCrudAlert('Pesanan berhasil dikemas & disiapkan untuk Kurir!')
  }
}

// Financial Statistics
const totalRevenue = computed(() => {
  const completed = storeOrders.value.filter(o => o.status === 'Pesanan Selesai')
  return completed.reduce((sum, o) => sum + o.subtotal, 0)
})

const activeProductsCount = computed(() => sellerProducts.value.length)
</script>

<template>
  <div class="space-y-8 text-slate-200">
    
    <!-- Top KPI metrics and financial summaries -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div class="bg-slate-950 border border-slate-800 p-5 rounded-2xl">
        <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">💰 Total Pendapatan Selesai</p>
        <h3 class="text-2xl font-extrabold text-emerald-400 mt-2">Rp{{ totalRevenue.toLocaleString('id-ID') }}</h3>
        <p class="text-[10px] text-slate-500 mt-1">Hanya dari status pesanan selesai</p>
      </div>

      <div class="bg-slate-950 border border-slate-800 p-5 rounded-2xl">
        <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">🛍️ Jumlah Produk Aktif</p>
        <h3 class="text-2xl font-extrabold text-blue-400 mt-2">{{ activeProductsCount }} produk</h3>
        <p class="text-[10px] text-slate-500 mt-1">Terdaftar dalam katalog SEAPedia</p>
      </div>

      <div class="bg-slate-950 border border-slate-800 p-5 rounded-2xl">
        <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">⚡ Pesanan Sedang Dikemas</p>
        <h3 class="text-2xl font-extrabold text-amber-500 mt-2">{{ incomingOrders.length }} pesanan</h3>
        <p class="text-[10px] text-slate-500 mt-1">Membutuhkan tindakan Anda segera</p>
      </div>

      <!-- Store Profile Card -->
      <div class="bg-slate-950 border border-slate-800 p-5 rounded-2xl">
        <div class="flex items-center justify-between mb-2">
          <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">🏪 Profil Toko</span>
          <span v-if="storeNameSuccess" class="text-[9px] text-emerald-500 font-semibold">Tersimpan!</span>
        </div>
        <div class="flex gap-2">
          <input
            type="text"
            v-model="storeNameInput"
            class="flex-1 min-w-0 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500 text-slate-200"
          />
          <button @click="handleSaveStoreName" class="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-slate-950 font-bold text-xs rounded transition-colors">
            Simpan
          </button>
        </div>
        <p class="text-[9px] text-slate-600 mt-2">ID Toko: {{ store.id }}</p>
      </div>
    </div>

    <!-- Main Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <!-- Left Column: Product CRUD -->
      <section class="bg-slate-950 border border-slate-800 p-6 rounded-2xl lg:col-span-2 space-y-6">
        <div class="flex items-center justify-between border-b border-slate-800 pb-4">
          <h3 class="text-sm font-bold text-slate-400 uppercase tracking-widest">📦 Manajemen Produk Toko</h3>
          <button
            @click="openAddModal"
            class="px-3.5 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold text-xs rounded-xl transition-all shadow-md"
          >
            + Tambah Produk Baru
          </button>
        </div>

        <p v-if="crudSuccessMessage" class="bg-emerald-950/40 border border-emerald-900/50 text-emerald-400 p-3 rounded-lg text-xs font-semibold text-center">
          {{ crudSuccessMessage }}
        </p>

        <!-- Product Table -->
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="border-b border-slate-850 text-slate-500">
                <th class="py-3 px-2">Info Produk</th>
                <th class="py-3 px-2">Stok</th>
                <th class="py-3 px-2">Harga Satuan</th>
                <th class="py-3 px-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-850">
              <tr v-if="sellerProducts.length === 0">
                <td colspan="4" class="text-center py-6 text-slate-500">Belum ada produk aktif yang terdaftar.</td>
              </tr>
              <tr v-for="product in sellerProducts" :key="product.id" class="hover:bg-slate-900/30">
                <td class="py-3 px-2">
                  <div class="flex items-center gap-2.5">
                    <img :src="product.image" class="w-10 h-10 object-cover rounded bg-slate-800" />
                    <div>
                      <p class="font-bold text-slate-200 line-clamp-1">{{ product.name }}</p>
                      <p class="text-[10px] text-slate-500 truncate max-w-xs">{{ product.description || 'Tidak ada deskripsi' }}</p>
                    </div>
                  </div>
                </td>
                <td class="py-3 px-2 font-mono">
                  <span :class="product.stock <= 5 ? 'text-amber-500 font-bold' : 'text-slate-300'">
                    {{ product.stock }} pcs
                  </span>
                </td>
                <td class="py-3 px-2 font-mono text-slate-300">
                  Rp{{ product.price.toLocaleString('id-ID') }}
                </td>
                <td class="py-3 px-2 text-right space-x-2">
                  <button @click="openEditModal(product)" class="text-blue-400 hover:text-blue-300">Edit</button>
                  <button @click="handleDeleteProduct(product.id)" class="text-rose-500 hover:text-rose-400">Hapus</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Right Column: Incoming Orders & Simple Charts -->
      <div class="space-y-6">
        <!-- Incoming Orders Panel -->
        <section class="bg-slate-950 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h3 class="text-sm font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-3">
            ⚡ Pesanan Masuk (Dikemas)
          </h3>

          <div v-if="incomingOrders.length === 0" class="text-center py-6 text-slate-600 text-xs">
            Belum ada pesanan masuk yang perlu dikemas.
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="order in incomingOrders"
              :key="order.id"
              class="bg-slate-900 border border-slate-850 p-4 rounded-xl space-y-3"
            >
              <div class="flex justify-between items-center text-xs">
                <span class="font-bold text-amber-500">{{ order.id }}</span>
                <span class="text-slate-400 font-mono">{{ order.delivery_method }}</span>
              </div>
              
              <div class="space-y-1.5 border-t border-b border-slate-850 py-2">
                <div v-for="item in order.items" :key="item.id" class="text-[11px] text-slate-300 flex justify-between">
                  <span>{{ item.name }} (x{{ item.quantity }})</span>
                  <span>Rp{{ (item.price * item.quantity).toLocaleString('id-ID') }}</span>
                </div>
              </div>

              <div class="flex items-center justify-between text-xs pt-1">
                <div>
                  <p class="text-[9px] text-slate-500 uppercase tracking-wider">Pemesan</p>
                  <p class="font-semibold text-slate-300">{{ order.buyer_name }}</p>
                </div>
                <button
                  @click="handleShipOrder(order.id)"
                  class="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg transition-colors text-[10px]"
                >
                  Kembalikan / Siap Kirim
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- Processed Orders History -->
        <section class="bg-slate-950 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h3 class="text-sm font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-3">
            📋 Riwayat Proses Pesanan
          </h3>

          <div v-if="processedOrders.length === 0" class="text-center py-6 text-slate-600 text-xs">
            Belum ada pesanan yang diproses sebelumnya.
          </div>

          <div v-else class="space-y-3 max-h-60 overflow-y-auto pr-2">
            <div
              v-for="order in processedOrders"
              :key="order.id"
              class="p-3 bg-slate-900/30 border border-slate-850 rounded-lg flex items-center justify-between text-xs"
            >
              <div>
                <p class="font-bold text-slate-300">{{ order.id }}</p>
                <p class="text-[10px] text-slate-500 mt-0.5">Total: Rp{{ order.total.toLocaleString('id-ID') }}</p>
              </div>
              <span class="px-2 py-0.5 rounded text-[10px]" :class="{
                'bg-blue-950 text-blue-400 border border-blue-900/40': order.status === 'Menunggu Pengirim',
                'bg-indigo-950 text-indigo-400 border border-indigo-900/40': order.status === 'Sedang Dikirim',
                'bg-emerald-950 text-emerald-400 border border-emerald-900/40': order.status === 'Pesanan Selesai',
                'bg-rose-950 text-rose-400 border border-rose-900/40': order.status.includes('Dikembalikan')
              }">
                {{ order.status }}
              </span>
            </div>
          </div>
        </section>
      </div>

    </div>

    <!-- Add Product Modal Dialog -->
    <div v-if="isAddModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div class="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <h3 class="text-base font-bold text-slate-200">Tambah Produk Baru</h3>
        
        <div class="space-y-4 text-xs">
          <div>
            <label class="block text-slate-400 mb-1.5">Nama Produk</label>
            <input type="text" v-model="productForm.name" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-blue-500" required />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-slate-400 mb-1.5">Harga (Rp)</label>
              <input type="number" v-model.number="productForm.price" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-blue-500" required />
            </div>
            <div>
              <label class="block text-slate-400 mb-1.5">Jumlah Stok</label>
              <input type="number" v-model.number="productForm.stock" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-blue-500" required />
            </div>
          </div>

          <div>
            <label class="block text-slate-400 mb-1.5">Deskripsi Produk</label>
            <textarea v-model="productForm.description" rows="3" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-blue-500"></textarea>
          </div>

          <div>
            <label class="block text-slate-400 mb-1.5">URL Gambar (Opsional)</label>
            <input type="text" v-model="productForm.image" placeholder="Masukkan URL gambar bebas" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-blue-500" />
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <button @click="isAddModalOpen = false" class="px-4 py-2 bg-slate-950 text-slate-400 rounded-lg hover:text-slate-200">Batal</button>
          <button @click="handleAddProduct" class="px-4 py-2 bg-blue-600 text-slate-950 font-bold rounded-lg hover:bg-blue-500">Simpan Produk</button>
        </div>
      </div>
    </div>

    <!-- Edit Product Modal Dialog -->
    <div v-if="isEditModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div class="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <h3 class="text-base font-bold text-slate-200">Edit Produk</h3>
        
        <div class="space-y-4 text-xs">
          <div>
            <label class="block text-slate-400 mb-1.5">Nama Produk</label>
            <input type="text" v-model="productForm.name" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-blue-500" required />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-slate-400 mb-1.5">Harga (Rp)</label>
              <input type="number" v-model.number="productForm.price" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-blue-500" required />
            </div>
            <div>
              <label class="block text-slate-400 mb-1.5">Jumlah Stok</label>
              <input type="number" v-model.number="productForm.stock" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-blue-500" required />
            </div>
          </div>

          <div>
            <label class="block text-slate-400 mb-1.5">Deskripsi Produk</label>
            <textarea v-model="productForm.description" rows="3" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-blue-500"></textarea>
          </div>

          <div>
            <label class="block text-slate-400 mb-1.5">URL Gambar (Opsional)</label>
            <input type="text" v-model="productForm.image" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-blue-500" />
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <button @click="isEditModalOpen = false" class="px-4 py-2 bg-slate-950 text-slate-400 rounded-lg hover:text-slate-200">Batal</button>
          <button @click="handleEditProduct" class="px-4 py-2 bg-blue-600 text-slate-950 font-bold rounded-lg hover:bg-blue-500">Perbarui Produk</button>
        </div>
      </div>
    </div>

  </div>
</template>
