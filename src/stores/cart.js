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
  
  // Available Vouchers
  const mockVouchers = [
    { code: 'SEAPEDIA10', type: 'percentage', value: 0.10, minPurchase: 50000, maxDiscount: 50000, description: 'Diskon 10% minimal pembelian Rp50.000 (Maks Rp50.000)' },
    { code: 'HEMAT25', type: 'percentage', value: 0.25, minPurchase: 100000, maxDiscount: 30000, description: 'Diskon 25% minimal pembelian Rp100.000 (Maks Rp30.000)' },
    { code: 'GRATISONGKIR', type: 'delivery', value: 15000, minPurchase: 75000, description: 'Potongan Ongkir Rp15.000 minimal pembelian Rp75.000' }
  ]

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
    if (!voucherCode.value) return null
    return mockVouchers.find(v => v.code.toUpperCase() === voucherCode.value.toUpperCase())
  })

  const discountAmount = computed(() => {
    const voucher = activeVoucher.value
    if (!voucher) return 0
    if (subtotal.value < voucher.minPurchase) return 0

    if (voucher.type === 'percentage') {
      const calc = subtotal.value * voucher.value
      return Math.min(calc, voucher.maxDiscount)
    } else if (voucher.type === 'delivery') {
      // Delivery fee discount cannot exceed actual delivery fee
      return Math.min(voucher.value, rawDeliveryFee.value)
    }
    return 0
  })

  const rawDeliveryFee = computed(() => {
    if (items.value.length === 0) return 0
    return deliveryFees[selectedDelivery.value] || 0
  })

  const finalDeliveryFee = computed(() => {
    const voucher = activeVoucher.value
    const fee = rawDeliveryFee.value
    if (voucher && voucher.type === 'delivery' && subtotal.value >= voucher.minPurchase) {
      return Math.max(0, fee - voucher.value)
    }
    return fee
  })

  const ppnRate = 0.12 // PPN 12%
  const ppnAmount = computed(() => {
    // PPN is calculated on the subtotal + delivery - discount (if subtotal - discount is positive)
    const base = Math.max(0, subtotal.value - (activeVoucher.value?.type === 'percentage' ? discountAmount.value : 0)) + finalDeliveryFee.value
    return Math.round(base * ppnRate)
  })

  const total = computed(() => {
    const discount = activeVoucher.value?.type === 'percentage' ? discountAmount.value : 0
    return Math.max(0, subtotal.value - discount) + finalDeliveryFee.value + ppnAmount.value
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

  function applyVoucher(code) {
    discountError.value = ''
    const voucher = mockVouchers.find(v => v.code.toUpperCase() === code.toUpperCase().trim())
    
    if (!voucher) {
      discountError.value = 'Kode voucher tidak valid.'
      return false
    }
    if (subtotal.value < voucher.minPurchase) {
      discountError.value = `Minimal pembelian Rp${voucher.minPurchase.toLocaleString('id-ID')} untuk voucher ini.`
      return false
    }
    
    voucherCode.value = voucher.code
    return true
  }

  function removeVoucher() {
    voucherCode.value = ''
    discountError.value = ''
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
          voucher_code: voucherCode.value || null
        })
      })

      // Reset local cart variables
      items.value = []
      voucherCode.value = ''
      discountError.value = ''
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
    mockVouchers,
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
