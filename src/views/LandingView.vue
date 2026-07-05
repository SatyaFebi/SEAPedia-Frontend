<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useProductsStore } from '../stores/products'
import { useCartStore } from '../stores/cart'
import { useReviewsStore } from '../stores/reviews'
import Navbar from '../components/Navbar.vue'
import Footer from '../components/Footer.vue'
import Skeleton from '../components/Skeleton.vue'


const authStore = useAuthStore()
const productsStore = useProductsStore()
const cartStore = useCartStore()
const reviewsStore = useReviewsStore()
const router = useRouter()

const searchInput = ref('')
const selectedCategory = ref('Semua')
const isLoading = ref(true)


const filteredProducts = computed(() => {
  return productsStore.products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchInput.value.toLowerCase()) ||
      p.store_name.toLowerCase().includes(searchInput.value.toLowerCase())
    if (selectedCategory.value === 'Semua') return matchesSearch
    return matchesSearch && p.category === selectedCategory.value
  })
})

const isDetailModalOpen = ref(false)
const activeDetailProduct = ref(null)
const qtyToAdd = ref(1)
const isConflictOpen = ref(false)
const conflictStoreName = ref('')
const pendingProduct = ref(null)

const reviewForm = ref({ name: '', comment: '', rating: 5 })
const reviewSuccess = ref(false)

onMounted(async () => {
  try {
    await productsStore.fetchProducts()
    if (authStore.isLoggedIn && authStore.activeRole === 'Buyer') {
      await cartStore.fetchCart()
    }
  } catch (err) {
    console.error('Error fetching landing data:', err)
  } finally {
    isLoading.value = false
  }
})


function filterByStore(storeName) {
  searchInput.value = storeName
  selectedCategory.value = 'Semua'
  isDetailModalOpen.value = false
  const catalogEl = document.getElementById('catalog')
  if (catalogEl) {
    catalogEl.scrollIntoView({ behavior: 'smooth' })
  }
}

function openDetailModal(product) {
  activeDetailProduct.value = product
  qtyToAdd.value = 1
  isDetailModalOpen.value = true
}

function handleQtyInput() {
  if (qtyToAdd.value === '' || qtyToAdd.value === null) return
  if (qtyToAdd.value > activeDetailProduct.value.stock) {
    qtyToAdd.value = activeDetailProduct.value.stock
  }
}

function handleQtyBlur() {
  if (!qtyToAdd.value || qtyToAdd.value < 1) {
    qtyToAdd.value = 1
  }
}

async function handleAddToCart() {
  if (!authStore.isLoggedIn) {
    alert('Anda harus login terlebih dahulu sebagai Buyer.')
    router.push({ name: 'login' })
    return
  }
  if (authStore.activeRole !== 'Buyer') {
    alert('Anda harus memilih peran aktif sebagai Buyer untuk menambah produk ke keranjang.')
    return
  }
  qtyToAdd.value = Math.max(1, Math.min(activeDetailProduct.value.stock, Number(qtyToAdd.value) || 1))
  const result = await cartStore.addToCart(activeDetailProduct.value, qtyToAdd.value)
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

async function handleForceClearCartAndAdd() {
  qtyToAdd.value = Math.max(1, Math.min(pendingProduct.value.stock, Number(qtyToAdd.value) || 1))
  await cartStore.clearCart()
  const result = await cartStore.addToCart(pendingProduct.value, qtyToAdd.value)
  isConflictOpen.value = false
  isDetailModalOpen.value = false
  if (result.success) {
    alert('Keranjang sebelumnya dikosongkan. Produk dari toko baru berhasil ditambahkan!')
  } else {
    alert(result.error)
  }
}

async function handleAddReview() {
  if (!reviewForm.value.comment.trim()) return
  const result = await reviewsStore.addReview({
    name: reviewForm.value.name || 'Tamu Anonim',
    comment: reviewForm.value.comment,
    rating: reviewForm.value.rating,
  })
  if (result.success) {
    reviewForm.value = { name: '', comment: '', rating: 5 }
    reviewSuccess.value = true
    setTimeout(() => {
      reviewSuccess.value = false
    }, 3000)
  } else {
    alert('Gagal mengirim ulasan: ' + result.message)
  }
}

const categories = ['Semua', 'Kuliner', 'Otomotif']
</script>

<template>
  <div class="min-h-screen bg-[#FAFAFA] font-sans text-[#374151]">
    <!-- ── Navbar ── -->
    <Navbar />

    <!-- ── Hero ── -->
    <section class="bg-white border-b border-[#E5E8EC] py-16 px-6">
      <div class="max-w-3xl mx-auto text-center space-y-5">
        <span class="badge badge-green px-3 py-1 text-xs">Platform Multi-Role Marketplace</span>
        <h1 class="font-display font-bold text-[#0D1117] text-4xl md:text-5xl leading-tight">
          Belanja Lokal,<br />
          <span class="text-primary-600">Kirim Cepat</span>
        </h1>
        <p class="text-[#6B7280] text-base max-w-xl mx-auto leading-relaxed">
          Platform terpadu untuk Buyer, Seller, dan Driver. Temukan produk kuliner &amp; otomotif
          dari penjual lokal terpercaya.
        </p>
        <div class="flex items-center justify-center gap-3 pt-2">
          <router-link v-if="!authStore.isLoggedIn" to="/login" class="btn-primary btn-lg">
            Mulai Belanja
          </router-link>
          <a href="#catalog" class="btn-ghost btn-lg"> Lihat Produk ↓ </a>
        </div>
      </div>
    </section>

    <!-- ── Main Catalog ── -->
    <main id="catalog" class="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-4 gap-8">
      <!-- Sidebar filter -->
      <aside class="space-y-5 lg:col-span-1">
        <!-- Search -->
        <div class="card p-4 space-y-3">
          <p class="section-label">Pencarian</p>
          <input
            type="text"
            v-model="searchInput"
            placeholder="Cari produk atau toko..."
            class="input text-sm"
          />
        </div>

        <!-- Category -->
        <div class="card p-4 space-y-3">
          <p class="section-label">Kategori</p>
          <div class="space-y-1.5">
            <button
              v-for="cat in categories"
              :key="cat"
              @click="selectedCategory = cat"
              class="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer"
              :class="
                selectedCategory === cat
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-[#374151] hover:bg-[#F4F6F8]'
              "
            >
              {{
                cat === 'Semua'
                  ? '🌍 Semua Produk'
                  : cat === 'Kuliner'
                    ? '🌶️ Kuliner'
                    : '⚙️ Otomotif'
              }}
            </button>
          </div>
        </div>

        <!-- Vouchers -->
        <div class="card p-4 space-y-3">
          <p class="section-label">Kupon Aktif</p>
          <div class="space-y-2">
            <div
              v-for="voucher in cartStore.mockVouchers"
              :key="voucher.code"
              class="px-3 py-2.5 rounded-lg bg-primary-50 border border-primary-100"
            >
              <p class="text-xs font-semibold text-primary-700 font-mono">{{ voucher.code }}</p>
              <p class="text-[10px] text-primary-600 mt-0.5 leading-tight">
                {{ voucher.description }}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <!-- Catalog + Reviews -->
      <div class="lg:col-span-3 space-y-10">
        <!-- Product grid -->
        <section class="space-y-5">
          <div class="flex items-center justify-between">
            <h2 class="font-display font-semibold text-[#0D1117] text-lg">Katalog Produk</h2>
            <span class="badge badge-gray">{{ filteredProducts.length }} produk</span>
          </div>

          <!-- Skeleton Loader -->
          <div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div v-for="i in 6" :key="i" class="card flex flex-col gap-3">
              <Skeleton height="10rem" />
              <div class="p-4 flex flex-col flex-1 gap-3">
                <div class="space-y-2 flex-1">
                  <Skeleton width="40%" height="0.75rem" />
                  <Skeleton width="80%" height="1.25rem" />
                  <Skeleton width="100%" height="0.875rem" />
                  <Skeleton width="60%" height="0.875rem" />
                </div>
                <div class="flex items-center justify-between pt-3 border-t border-[#E5E8EC]">
                  <Skeleton width="25%" height="0.75rem" />
                  <Skeleton width="35%" height="1rem" />
                </div>
              </div>
            </div>
          </div>

          <div
            v-else-if="filteredProducts.length === 0"
            class="card p-16 text-center text-[#9CA3AF] text-sm"
          >
            Produk tidak ditemukan. Coba kata kunci lain.
          </div>


          <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div
              v-for="product in filteredProducts"
              :key="product.id"
              @click="openDetailModal(product)"
              class="card-hover cursor-pointer flex flex-col group"
            >
              <img :src="product.image" class="w-full h-40 object-cover bg-[#F4F6F8]" />
              <div class="p-4 flex flex-col flex-1 gap-3">
                <div class="flex-1">
                  <p class="text-[10px] text-[#9CA3AF] mb-1">{{ product.store_name }}</p>
                  <h3
                    class="text-sm font-semibold text-[#0D1117] line-clamp-1 group-hover:text-primary-600 transition-colors"
                  >
                    {{ product.name }}
                  </h3>
                  <p class="text-xs text-[#9CA3AF] mt-1 line-clamp-2 leading-relaxed">
                    {{ product.description || 'Tidak ada deskripsi.' }}
                  </p>
                </div>
                <div class="flex items-center justify-between pt-2 border-t border-[#E5E8EC]">
                  <span class="text-xs text-[#9CA3AF]">Stok {{ product.stock }}</span>
                  <span class="font-display font-semibold text-primary-600 text-sm"
                    >Rp{{ product.price.toLocaleString('id-ID') }}</span
                  >
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Reviews -->
        <section class="space-y-5 pt-6 border-t border-[#E5E8EC]">
          <h2 class="font-display font-semibold text-[#0D1117] text-lg">Testimoni Pengguna</h2>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Review list -->
            <div class="md:col-span-2 space-y-3">
              <div
                v-for="review in reviewsStore.reviews"
                :key="review.id"
                class="card p-4 space-y-2.5"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-semibold text-[#0D1117]">{{ review.name }}</span>
                    <span class="badge badge-gray">{{ review.role }}</span>
                  </div>
                  <span class="text-xs text-[#9CA3AF]">{{ review.date }}</span>
                </div>
                <div class="flex gap-0.5">
                  <span v-for="s in review.rating" :key="s" class="text-accent-amber-500 text-xs"
                    >★</span
                  >
                  <span v-for="e in 5 - review.rating" :key="'e' + e" class="text-[#E5E8EC] text-xs"
                    >★</span
                  >
                </div>
                <p class="text-xs text-[#6B7280] leading-relaxed">{{ review.comment }}</p>
              </div>
            </div>

            <!-- Review form -->
            <div class="card p-5 space-y-4 h-fit">
              <p class="font-semibold text-sm text-[#0D1117]">Tulis Ulasan</p>
              <form @submit.prevent="handleAddReview" class="space-y-3">
                <div>
                  <label class="input-label">Nama Anda</label>
                  <input
                    type="text"
                    v-model="reviewForm.name"
                    placeholder="Anonim"
                    class="input text-sm"
                  />
                </div>
                <div>
                  <label class="input-label">Rating</label>
                  <select v-model.number="reviewForm.rating" class="input text-sm cursor-pointer">
                    <option :value="5">⭐⭐⭐⭐⭐ Sangat Puas</option>
                    <option :value="4">⭐⭐⭐⭐ Puas</option>
                    <option :value="3">⭐⭐⭐ Cukup</option>
                    <option :value="2">⭐⭐ Kurang</option>
                    <option :value="1">⭐ Kecewa</option>
                  </select>
                </div>
                <div>
                  <label class="input-label">Ulasan</label>
                  <textarea
                    v-model="reviewForm.comment"
                    rows="3"
                    placeholder="Tulis komentar Anda..."
                    class="input text-sm"
                    required
                  ></textarea>
                </div>
                <button type="submit" class="btn-primary w-full justify-center">
                  Kirim Ulasan
                </button>
                <p v-if="reviewSuccess" class="text-primary-600 text-xs text-center font-medium">
                  Ulasan berhasil dikirim!
                </p>
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- ── Product Detail Modal ── -->
    <div
      v-if="isDetailModalOpen && activeDetailProduct"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D1117]/40 backdrop-blur-sm"
    >
      <div
        class="w-full max-w-2xl bg-white rounded-2xl overflow-hidden border border-[#E5E8EC] shadow-xl"
      >
        <div class="grid grid-cols-1 md:grid-cols-2">
          <img
            :src="activeDetailProduct.image"
            class="w-full h-full object-cover min-h-56 bg-[#F4F6F8]"
          />
          <div class="p-6 flex flex-col gap-5">
            <div class="flex items-start justify-between">
              <div class="space-y-1">
                <span class="badge badge-gray text-xs">{{ activeDetailProduct.store_name }}</span>
                <h3 class="font-display font-bold text-[#0D1117] text-lg mt-1">
                  {{ activeDetailProduct.name }}
                </h3>
              </div>
              <button
                @click="isDetailModalOpen = false"
                class="w-8 h-8 flex items-center justify-center rounded-lg bg-[#F4F6F8] text-[#6B7280] hover:text-[#0D1117] hover:bg-[#E5E8EC] transition-colors text-sm cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            <p class="text-sm text-[#6B7280] leading-relaxed flex-1">
              {{ activeDetailProduct.description || 'Tidak ada deskripsi.' }}
            </p>

            <!-- Store Information Block -->
            <div
              class="flex items-center gap-3 bg-[#F4F6F8] p-3 rounded-xl border border-[#E5E8EC]"
            >
              <div
                class="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-700 text-sm shrink-0"
              >
                {{ activeDetailProduct.store_name.charAt(0).toUpperCase() }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-xs font-semibold text-[#0D1117] truncate">
                  {{ activeDetailProduct.store_name }}
                </p>
                <p class="text-[10px] text-[#9CA3AF]">Penjual Terverifikasi SEAPedia</p>
              </div>
              <button
                @click="filterByStore(activeDetailProduct.store_name)"
                class="btn bg-white hover:bg-[#F4F6F8] text-[#374151] border border-[#E5E8EC] rounded-lg px-2.5 py-1 text-xs font-medium cursor-pointer shrink-0"
              >
                Kunjungi Toko
              </button>
            </div>

            <div class="space-y-3 border-t border-[#E5E8EC] pt-4">
              <div class="flex justify-between text-sm">
                <span class="text-[#6B7280]">Stok tersedia</span>
                <span class="font-medium text-[#374151]">{{ activeDetailProduct.stock }} pcs</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-[#6B7280] text-sm">Harga</span>
                <span class="font-display font-bold text-primary-600 text-xl"
                  >Rp{{ activeDetailProduct.price.toLocaleString('id-ID') }}</span
                >
              </div>

              <!-- Qty + Add to cart -->
              <div
                v-if="authStore.isLoggedIn && authStore.activeRole === 'Buyer'"
                class="space-y-3"
              >
                <div class="flex items-center justify-between">
                  <span class="text-sm text-[#6B7280]">Jumlah</span>
                  <div
                    class="flex items-center gap-1 bg-[#F4F6F8] border border-[#E5E8EC] rounded-lg overflow-hidden"
                  >
                    <button
                      @click="qtyToAdd = Math.max(1, Number(qtyToAdd) - 1)"
                      class="px-3 py-1.5 text-[#6B7280] hover:text-[#0D1117] hover:bg-[#E5E8EC] transition-colors cursor-pointer font-medium text-sm"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      v-model.number="qtyToAdd"
                      @input="handleQtyInput"
                      @blur="handleQtyBlur"
                      min="1"
                      :max="activeDetailProduct.stock"
                      class="w-12 text-center text-sm font-semibold text-[#0D1117] bg-transparent border-0 focus:outline-none focus:ring-0 p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      @click="qtyToAdd = Math.min(activeDetailProduct.stock, Number(qtyToAdd) + 1)"
                      class="px-3 py-1.5 text-[#6B7280] hover:text-[#0D1117] hover:bg-[#E5E8EC] transition-colors cursor-pointer font-medium text-sm"
                    >
                      +
                    </button>
                  </div>
                </div>
                <button
                  @click="handleAddToCart"
                  :disabled="activeDetailProduct.stock <= 0"
                  class="btn-primary w-full justify-center"
                >
                  {{ activeDetailProduct.stock <= 0 ? 'Stok Habis' : 'Tambah ke Keranjang' }}
                </button>
              </div>

              <div
                v-else
                class="px-4 py-3 bg-[#F4F6F8] rounded-lg text-xs text-[#9CA3AF] text-center leading-relaxed"
              >
                Login sebagai <strong class="text-[#374151]">Buyer</strong> untuk mulai berbelanja.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Conflict Modal ── -->
    <div
      v-if="isConflictOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D1117]/40 backdrop-blur-sm"
    >
      <div
        class="w-full max-w-sm bg-white rounded-2xl border border-[#E5E8EC] p-6 shadow-xl space-y-4"
      >
        <div
          class="w-12 h-12 mx-auto rounded-full bg-accent-rose-50 flex items-center justify-center text-xl"
        >
          ⚠️
        </div>
        <div class="text-center space-y-1">
          <h3 class="font-display font-bold text-[#0D1117]">Keranjang Terkunci</h3>
          <p class="text-sm text-[#6B7280] leading-relaxed">
            Keranjang Anda berisi produk dari
            <strong class="text-[#374151]">{{ conflictStoreName }}</strong
            >. Tidak bisa menambahkan produk dari toko berbeda.
          </p>
        </div>
        <div class="grid grid-cols-2 gap-3 pt-1">
          <button @click="isConflictOpen = false" class="btn-secondary w-full justify-center">
            Batal
          </button>
          <button
            @click="handleForceClearCartAndAdd"
            class="btn w-full justify-center bg-accent-rose-600 hover:bg-accent-rose-700 text-white rounded-lg px-4 py-2 text-sm font-medium shadow-xs cursor-pointer"
          >
            Kosongkan &amp; Ganti
          </button>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <Footer />
  </div>
</template>
