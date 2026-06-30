import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from './auth'
import { useOrdersStore } from './orders'
import { useProductsStore } from './products'

export const useCartStore = defineStore('cart', () => {
  const items = ref([])
  const selectedDelivery = ref('Regular')
  const voucherCode = ref('')
  const discountError = ref('')
  const activeDiscount = ref(null)

  // Locked store id
  const cartStoreId = computed(() => {
    if (items.value.length === 0) return null
    return items.value[0].product.store_id
  })

  const cartStoreName = computed(() => {
    if (items.value.length === 0) return ''
    return items.value[0].product.store_name
  })

  // Delivery Fees mapping
  const deliveryFees = {
    'Regular': 9000,
    'Next Day': 15000,
    'Instant': 30000
  }

  // Calculations
  const subtotal = computed(() => {
    return items.value.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
  })

  const activeVoucher = computed(() => {
    return activeDiscount.value
  })

  const discountAmount = computed(() => {
    if (!activeDiscount.value) return 0
    // Recalculate discount based on current subtotal
    if (activeDiscount.value.amount_type === 'PERCENTAGE') {
      const calc = subtotal.value * (parseFloat(activeDiscount.value.value) / 100)
      return Math.min(calc, subtotal.value)
    } else {
      return Math.min(parseFloat(activeDiscount.value.value), subtotal.value)
    }
  })

  const rawDeliveryFee = computed(() => {
    if (items.value.length === 0) return 0
    return deliveryFees[selectedDelivery.value] || 0
  })

  const finalDeliveryFee = computed(() => {
    return rawDeliveryFee.value
  })

  const ppnRate = 0.12 // PPN 12%
  const ppnAmount = computed(() => {
    const base = Math.max(0, subtotal.value - discountAmount.value)
    return Math.round(base * ppnRate)
  })

  const total = computed(() => {
    return Math.max(0, subtotal.value - discountAmount.value) + finalDeliveryFee.value + ppnAmount.value
  })

  // Functions
  async function fetchCart() {
    try {
      const data = await apiRequest('/cart')
      items.value = data.items || []
    } catch (err) {
      console.error('Gagal mengambil data keranjang dari backend:', err)
    }
  }

  // Functions
  async function addToCart(product, qty = 1, force = false) {
    try {
      const data = await apiRequest('/cart/items', {
        method: 'POST',
        body: JSON.stringify({
          product_id: product.id,
          quantity: qty,
          force
        })
      })
      await fetchCart()
      return { success: true }
    } catch (err) {
      if (err.status === 409) {
        return { success: false, conflict: true, currentStore: err.data.current_store }
      }
      return { success: false, error: err.message || 'Gagal menambahkan produk.' }
    }
  }

  async function removeFromCart(productId) {
    const item = items.value.find(i => i.product.id === productId)
    if (!item) return
    try {
      await apiRequest(`/cart/items/${item.id}`, { method: 'DELETE' })
      await fetchCart()
    } catch (err) {
      console.error('Gagal menghapus produk dari keranjang:', err)
    }
  }

  async function updateQuantity(productId, qty) {
    const item = items.value.find(i => i.product.id === productId)
    if (!item) return false
    try {
      await apiRequest(`/cart/items/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity: qty })
      })
      await fetchCart()
      return true
    } catch (err) {
      console.error('Gagal memperbarui jumlah produk:', err)
      return false
    }
  }

  async function applyVoucher(code) {
    discountError.value = ''
    try {
      const data = await apiRequest('/discounts/validate', {
        method: 'POST',
        body: JSON.stringify({
          code: code,
          subtotal: subtotal.value
        })
      })
      activeDiscount.value = data
      voucherCode.value = data.code
      return true
    } catch (err) {
      discountError.value = err.message || 'Kode diskon tidak valid.'
      activeDiscount.value = null
      voucherCode.value = ''
      return false
    }
  }

  function removeVoucher() {
    voucherCode.value = ''
    discountError.value = ''
    activeDiscount.value = null
  }

  async function clearCart() {
    try {
      await apiRequest('/cart', { method: 'DELETE' })
      await fetchCart()
    } catch (err) {
      console.error('Gagal mengosongkan keranjang:', err)
    }
  }

  async function submitCheckout() {
    const authStore = useAuthStore()

    if (!authStore.isLoggedIn) {
      return { success: false, error: 'Anda harus login terlebih dahulu.' }
    }
    if (items.value.length === 0) {
      return { success: false, error: 'Keranjang belanja kosong.' }
    }
    if (authStore.user.walletBalance < total.value) {
      return { success: false, error: 'Saldo wallet tidak mencukupi. Silakan lakukan Top Up.' }
    }

    try {
      const data = await apiRequest('/checkout', {
        method: 'POST',
        body: JSON.stringify({
          delivery_method: selectedDelivery.value,
          shipping_address: authStore.user.address || 'Belum ada alamat pengiriman',
          discount_code: voucherCode.value || null
        })
      })

      // Reset local cart variables
      items.value = []
      voucherCode.value = ''
      discountError.value = ''
      activeDiscount.value = null
      selectedDelivery.value = 'Regular'

      // Refresh auth profile (to sync dynamic wallet balance and address)
      await authStore.checkAuth()

      return { success: true, orderId: data.order.id }
    } catch (err) {
      return { success: false, error: err.message || 'Gagal memproses checkout.' }
    }
  }

  return {
    items,
    selectedDelivery,
    voucherCode,
    discountError,
    activeDiscount,
    cartStoreId,
    cartStoreName,
    subtotal,
    activeVoucher,
    discountAmount,
    rawDeliveryFee,
    finalDeliveryFee,
    ppnAmount,
    total,
    fetchCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    applyVoucher,
    removeVoucher,
    clearCart,
    submitCheckout
  }
})
