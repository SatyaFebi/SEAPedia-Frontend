<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useProductsStore } from '../stores/products'
import { useCartStore } from '../stores/cart'
import { useReviewsStore } from '../stores/reviews'

const authStore = useAuthStore()
const productsStore = useProductsStore()
const cartStore = useCartStore()
const reviewsStore = useReviewsStore()
const router = useRouter()

const searchInput = ref('')
const selectedCategory = ref('Semua')

// Filtered products list
const filteredProducts = computed(() => {
  return productsStore.products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchInput.value.toLowerCase()) || 
                          p.store_name.toLowerCase().includes(searchInput.value.toLowerCase())
    
    if (selectedCategory.value === 'Semua') {
      return matchesSearch
    } else if (selectedCategory.value === 'Kuliner') {
      return matchesSearch && p.id.startsWith('prod-') && parseInt(p.id.split('-')[1]) <= 3
    } else if (selectedCategory.value === 'Otomotif') {
      return matchesSearch && p.id.startsWith('prod-') && parseInt(p.id.split('-')[1]) > 3
    }
    return matchesSearch
  })
})

// Modal Product Detail state
const isDetailModalOpen = ref(false)
const activeDetailProduct = ref(null)
const qtyToAdd = ref(1)

// Single-store validation conflict warning dialog
const isConflictOpen = ref(false)
const conflictStoreName = ref('')
const pendingProduct = ref(null)

// Application Review state
const reviewForm = ref({
  name: '',
  comment: '',
  rating: 5
})
const reviewSuccess = ref(false)

function openDetailModal(product) {
  activeDetailProduct.value = product
  qtyToAdd.value = 1
  isDetailModalOpen.value = true
}

function handleAddToCart() {
  if (!authStore.isLoggedIn) {
    alert('Anda harus login terlebih dahulu sebagai Buyer.')
    router.push({ name: 'login' })
    return
  }

  if (authStore.activeRole !== 'Buyer') {
    alert('Anda harus memilih peran aktif sebagai Buyer untuk menambah produk ke keranjang.')
    return
  }

  const result = cartStore.addToCart(activeDetailProduct.value, qtyToAdd.value)
  
  if (result.success) {
    isDetailModalOpen.value = false
    alert('Produk berhasil ditambahkan ke keranjang belanja!')
  } else if (result.conflict) {
    conflictStoreName.value = result.currentStore
    pendingProduct.value = activeDetailProduct.value
    isConflictOpen.value = true
  } else {
    alert(result.error)
  }
}

function handleForceClearCartAndAdd() {
  cartStore.clearCart()
  const result = cartStore.addToCart(pendingProduct.value, qtyToAdd.value)
  isConflictOpen.value = false
  isDetailModalOpen.value = false
  if (result.success) {
    alert('Keranjang sebelumnya dikosongkan. Produk dari toko baru berhasil ditambahkan!')
  } else {
    alert(result.error)
  }
}

function handleAddReview() {
  if (!reviewForm.value.comment.trim()) return
  
  reviewsStore.addReview({
    name: reviewForm.value.name || 'Tamu Anonim',
    comment: reviewForm.value.comment,
    rating: reviewForm.value.rating,
    role: authStore.isLoggedIn ? authStore.activeRole : 'Guest'
  })

  // Reset form
  reviewForm.value = {
    name: '',
    comment: '',
    rating: 5
  }
  reviewSuccess.value = true
  setTimeout(() => {
    reviewSuccess.value = false
  }, 3000)
}
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
    <!-- Navbar -->
    <nav class="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md bg-opacity-80">
      <div class="flex items-center gap-2">
        <span class="text-2xl font-extrabold font-display bg-gradient-to-r from-amber-500 via-coral-500 to-rose-500 bg-clip-text text-transparent">
          SEAPedia
        </span>
      </div>

      <div class="flex items-center gap-4">
        <!-- If logged in -->
        <div v-if="authStore.isLoggedIn" class="flex items-center gap-3">
          <span class="text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
            Sesi Aktif: <strong class="text-amber-400">{{ authStore.activeRole }}</strong>
          </span>
          <router-link
            :to="`/dashboard/${authStore.activeRole.toLowerCase()}`"
            class="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-bold rounded-lg text-xs hover:opacity-90 transition-opacity"
          >
            Masuk Dashboard →
          </router-link>
        </div>
        <!-- If guest -->
        <router-link
          v-else
          to="/login"
          class="px-4 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold rounded-lg text-xs transition-colors border border-slate-700"
        >
          Masuk / Pilih Akun
        </router-link>
      </div>
    </nav>

    <!-- Hero Section -->
    <header class="relative overflow-hidden py-20 px-6 bg-slate-900/40 border-b border-slate-900">
      <!-- Decor sunset blur -->
      <div class="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -z-10"></div>
      <div class="absolute top-1/3 right-1/4 -translate-y-1/2 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl -z-10"></div>

      <div class="max-w-4xl mx-auto text-center space-y-6">
        <span class="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs rounded-full font-semibold uppercase tracking-wider">
          Multi-Role Marketplace Nusantara
        </span>
        <h1 class="text-4xl md:text-6xl font-extrabold font-display leading-tight">
          Jelajahi, Transaksikan &amp; <br />
          <span class="bg-gradient-to-r from-amber-400 via-coral-400 to-rose-500 bg-clip-text text-transparent">
            Kirim Kebutuhan Lokal Anda
          </span>
        </h1>
        <p class="text-slate-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
          Platform terpadu untuk Buyer membeli kopi &amp; otomotif, Seller memantau performa toko, dan Driver mengambil pesanan pengiriman instan.
        </p>
      </div>
    </header>

    <!-- Main Workspace / Catalog -->
    <main class="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-4 gap-8">
      
      <!-- Left sidebar: Search & Filter categories -->
      <aside class="space-y-6 lg:col-span-1">
        <div class="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-850 pb-2">Filter Pencarian</h3>
          
          <!-- Search box -->
          <div>
            <label class="block text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1.5">Kata Kunci</label>
            <input
              type="text"
              v-model="searchInput"
              placeholder="Cari produk / toko..."
              class="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-650 focus:outline-none focus:border-amber-500"
            />
          </div>

          <!-- Category filter buttons -->
          <div class="space-y-2">
            <label class="block text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1.5">Kategori Produk</label>
            <div class="flex flex-col gap-2">
              <button
                @click="selectedCategory = 'Semua'"
                class="px-4 py-2 text-left rounded-xl text-xs transition-colors flex justify-between items-center"
                :class="selectedCategory === 'Semua' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold' : 'bg-slate-950 text-slate-400 border border-slate-900 hover:border-slate-800'"
              >
                <span>🌍 Semua Produk</span>
              </button>
              <button
                @click="selectedCategory = 'Kuliner'"
                class="px-4 py-2 text-left rounded-xl text-xs transition-colors flex justify-between items-center"
                :class="selectedCategory === 'Kuliner' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold' : 'bg-slate-950 text-slate-400 border border-slate-900 hover:border-slate-800'"
              >
                <span>🌶️ Kuliner Nusantara</span>
              </button>
              <button
                @click="selectedCategory = 'Otomotif'"
                class="px-4 py-2 text-left rounded-xl text-xs transition-colors flex justify-between items-center"
                :class="selectedCategory === 'Otomotif' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold' : 'bg-slate-950 text-slate-400 border border-slate-900 hover:border-slate-800'"
              >
                <span>⚙️ Otomotif &amp; Suku Cadang</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Available Promos Widget -->
        <div class="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
          <h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-850 pb-2">Kupon Diskon Sistem</h3>
          <div class="space-y-3">
            <div
              v-for="voucher in cartStore.mockVouchers"
              :key="voucher.code"
              class="p-3 bg-slate-950 border border-slate-850 rounded-xl space-y-1 relative overflow-hidden"
            >
              <div class="absolute -right-2 -bottom-2 w-8 h-8 bg-amber-500/5 rounded-full blur-sm"></div>
              <p class="text-xs font-bold text-amber-400 font-mono tracking-wider">{{ voucher.code }}</p>
              <p class="text-[10px] text-slate-400 leading-tight">{{ voucher.description }}</p>
            </div>
          </div>
        </div>
      </aside>

      <!-- Right column: Catalog Cards & Review list -->
      <div class="lg:col-span-3 space-y-12">
        <!-- Products Grid -->
        <section class="space-y-6">
          <h3 class="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            🛍️ Katalog Penjualan Produk
            <span class="text-xs font-normal text-slate-650 bg-slate-900 px-2 py-0.5 rounded border border-slate-850">
              Menampilkan {{ filteredProducts.length }} produk
            </span>
          </h3>

          <div v-if="filteredProducts.length === 0" class="text-center py-16 bg-slate-900/20 border border-slate-900 rounded-2xl text-slate-500 text-sm">
            Produk tidak ditemukan. Coba gunakan kata kunci pencarian lain.
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              v-for="product in filteredProducts"
              :key="product.id"
              @click="openDetailModal(product)"
              class="bg-slate-900 border border-slate-850 rounded-2xl overflow-hidden hover:border-slate-700 transition-all hover:-translate-y-1 cursor-pointer flex flex-col justify-between shadow-lg"
            >
              <div>
                <div class="relative">
                  <img :src="product.image" class="w-full h-44 object-cover bg-slate-800" />
                  <span class="absolute top-3 left-3 bg-slate-950/80 backdrop-blur px-2.5 py-0.5 rounded-full text-[10px] text-slate-300 font-medium">
                    📍 {{ product.store_name }}
                  </span>
                </div>
                <div class="p-4 space-y-2">
                  <h4 class="font-bold text-sm text-slate-200 line-clamp-1 group-hover:text-amber-400">{{ product.name }}</h4>
                  <p class="text-xs text-slate-400 line-clamp-2 leading-relaxed h-8">{{ product.description || 'Tidak ada deskripsi.' }}</p>
                </div>
              </div>
              
              <div class="px-4 pb-4 pt-2 border-t border-slate-850/50 flex items-center justify-between">
                <span class="text-xs text-slate-500">Stok: <strong>{{ product.stock }} pcs</strong></span>
                <span class="text-sm font-bold text-amber-400 font-mono">Rp{{ product.price.toLocaleString('id-ID') }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Testimonials / Feedback Section -->
        <section class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-900">
          <!-- Reviews list -->
          <div class="md:col-span-2 space-y-4">
            <h3 class="text-sm font-bold text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-900">
              💬 Testimoni &amp; Masukan Aplikasi
            </h3>

            <div class="space-y-4">
              <div
                v-for="review in reviewsStore.reviews"
                :key="review.id"
                class="p-4 bg-slate-900/30 border border-slate-850 rounded-xl space-y-2"
              >
                <div class="flex items-center justify-between text-xs">
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-slate-200">{{ review.name }}</span>
                    <span class="text-[9px] bg-slate-800 text-slate-500 px-1.5 py-0.2 rounded font-medium">
                      {{ review.role }}
                    </span>
                  </div>
                  <span class="text-slate-500 font-mono">{{ review.date }}</span>
                </div>
                <div class="flex items-center gap-0.5 text-amber-500 text-xs">
                  <span v-for="star in review.rating" :key="star">★</span>
                  <span v-for="empty in (5 - review.rating)" :key="'empty'+empty" class="text-slate-700">★</span>
                </div>
                <p class="text-xs text-slate-400 leading-relaxed font-sans">{{ review.comment }}</p>
              </div>
            </div>
          </div>

          <!-- Leave review form -->
          <div class="md:col-span-1 bg-slate-900 border border-slate-800 p-6 rounded-2xl h-fit space-y-4">
            <h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-850 pb-2">
              Kirim Masukan Anda
            </h3>
            
            <form @submit.prevent="handleAddReview" class="space-y-4 text-xs">
              <div>
                <label class="block text-slate-500 mb-1.5">Nama Anda</label>
                <input
                  type="text"
                  v-model="reviewForm.name"
                  placeholder="cth. Rian"
                  class="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-slate-100 placeholder-slate-650 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label class="block text-slate-500 mb-1.5">Rating Kepuasan</label>
                <select
                  v-model.number="reviewForm.rating"
                  class="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option :value="5">⭐⭐⭐⭐⭐ (Sangat Puas)</option>
                  <option :value="4">⭐⭐⭐⭐ (Puas)</option>
                  <option :value="3">⭐⭐⭐ (Cukup)</option>
                  <option :value="2">⭐⭐ (Kurang)</option>
                  <option :value="1">⭐ (Sangat Kecewa)</option>
                </select>
              </div>

              <div>
                <label class="block text-slate-500 mb-1.5">Ulasan / Review Aplikasi</label>
                <textarea
                  v-model="reviewForm.comment"
                  rows="3"
                  placeholder="Berikan komentar atau saran perbaikan..."
                  class="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-slate-100 placeholder-slate-650 focus:outline-none focus:border-amber-500"
                  required
                ></textarea>
              </div>

              <button
                type="submit"
                class="w-full py-2.5 bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-bold rounded-xl shadow-lg transition-colors"
              >
                Kirim Testimoni
              </button>
            </form>
            <p v-if="reviewSuccess" class="text-emerald-500 text-xs font-semibold text-center mt-2">
              Terima kasih! Review Anda berhasil diposting.
            </p>
          </div>
        </section>
      </div>

    </main>

    <!-- Product Detail Modal Dialog -->
    <div v-if="isDetailModalOpen && activeDetailProduct" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div class="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
        <button
          @click="isDetailModalOpen = false"
          class="absolute top-4 right-4 bg-slate-950/80 text-slate-400 hover:text-slate-200 w-8 h-8 rounded-full flex items-center justify-center text-sm z-10"
        >
          ✕
        </button>

        <div class="grid grid-cols-1 md:grid-cols-2">
          <img :src="activeDetailProduct.image" class="w-full h-full object-cover min-h-60 bg-slate-850" />
          
          <div class="p-6 flex flex-col justify-between space-y-6">
            <div class="space-y-4">
              <div class="space-y-1">
                <span class="text-[10px] bg-slate-800 border border-slate-700 text-slate-350 px-2 py-0.5 rounded-full">
                  🏪 Toko: {{ activeDetailProduct.store_name }}
                </span>
                <h3 class="text-lg font-bold text-slate-200 pt-1.5">{{ activeDetailProduct.name }}</h3>
              </div>
              <p class="text-xs text-slate-400 leading-relaxed font-sans">
                {{ activeDetailProduct.description || 'Tidak ada deskripsi detail untuk produk ini.' }}
              </p>
            </div>

            <div class="space-y-4 border-t border-slate-800 pt-4">
              <div class="flex justify-between items-center">
                <span class="text-xs text-slate-500">Ketersediaan Stok</span>
                <span class="text-xs font-bold text-slate-300">{{ activeDetailProduct.stock }} pcs</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-xs text-slate-500">Harga Satuan</span>
                <span class="text-base font-bold text-amber-400 font-mono">Rp{{ activeDetailProduct.price.toLocaleString('id-ID') }}</span>
              </div>

              <!-- Buyer Buy interface -->
              <div v-if="authStore.isLoggedIn && authStore.activeRole === 'Buyer'" class="space-y-3">
                <div class="flex items-center justify-between gap-4">
                  <span class="text-xs text-slate-500">Jumlah Beli</span>
                  <div class="flex items-center bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
                    <button @click="qtyToAdd = Math.max(1, qtyToAdd - 1)" class="px-3 py-1 text-slate-500 hover:text-slate-200 font-bold">-</button>
                    <span class="px-3 text-xs font-semibold font-mono">{{ qtyToAdd }}</span>
                    <button @click="qtyToAdd = Math.min(activeDetailProduct.stock, qtyToAdd + 1)" class="px-3 py-1 text-slate-500 hover:text-slate-200 font-bold">+</button>
                  </div>
                </div>
                <button
                  @click="handleAddToCart"
                  :disabled="activeDetailProduct.stock <= 0"
                  class="w-full py-2.5 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {{ activeDetailProduct.stock <= 0 ? 'Stok Habis' : 'Masukkan ke Keranjang' }}
                </button>
              </div>

              <div v-else class="p-3 bg-slate-950/60 border border-slate-850 rounded-xl text-center text-[10px] text-slate-500">
                Pilih Akun &amp; Peran sebagai <strong>Buyer</strong> untuk mulai berbelanja di SEAPedia.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Conflict Warning Modal (Single-Store checkout restriction) -->
    <div v-if="isConflictOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4">
      <div class="w-full max-w-md bg-slate-900 border border-rose-900/50 rounded-2xl p-6 space-y-4 shadow-2xl">
        <div class="text-center text-3xl">⚠️</div>
        <h3 class="text-base font-bold text-rose-400 text-center uppercase tracking-wide">Batasan Single-Store Checkout</h3>
        
        <p class="text-xs text-slate-400 leading-relaxed text-center font-sans">
          Keranjang belanja Anda terkunci pada produk dari toko <strong class="text-slate-200">{{ conflictStoreName }}</strong>. 
          Anda tidak bisa menambahkan produk dari toko berbeda sebelum mengosongkan keranjang terlebih dahulu.
        </p>

        <div class="grid grid-cols-2 gap-3 pt-2 text-xs">
          <button
            @click="isConflictOpen = false"
            class="py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
          >
            Batal Belanja
          </button>
          <button
            @click="handleForceClearCartAndAdd"
            class="py-2.5 bg-rose-600 hover:bg-rose-700 text-slate-950 font-bold rounded-lg transition-colors"
          >
            Kosongkan &amp; Tambah Baru
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
