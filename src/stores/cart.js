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
  function addToCart(product, qty = 1) {
    // Check if item store matches the current locked store
    if (cartStoreId.value && product.store_id !== cartStoreId.value) {
      return { success: false, conflict: true, currentStore: cartStoreName.value }
    }

    const existing = items.value.find(item => item.product.id === product.id)
    if (existing) {
      if (existing.quantity + qty > product.stock) {
        return { success: false, error: 'Stok tidak mencukupi' }
      }
      existing.quantity += qty
    } else {
      if (qty > product.stock) {
        return { success: false, error: 'Stok tidak mencukupi' }
      }
      items.value.push({ product, quantity: qty })
    }

    return { success: true }
  }

  function removeFromCart(productId) {
    items.value = items.value.filter(item => item.product.id !== productId)
    if (items.value.length === 0) {
      voucherCode.value = ''
      discountError.value = ''
    }
  }

  function updateQuantity(productId, qty) {
    const item = items.value.find(item => item.product.id === productId)
    if (item) {
      if (qty <= 0) {
        removeFromCart(productId)
      } else if (qty > item.product.stock) {
        return false // Exceeds stock
      } else {
        item.quantity = qty
      }
      return true
    }
    return false
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

  function clearCart() {
    items.value = []
    voucherCode.value = ''
    discountError.value = ''
    selectedDelivery.value = 'Regular'
  }

  function submitCheckout() {
    const authStore = useAuthStore()
    const ordersStore = useOrdersStore()
    const productsStore = useProductsStore()

    if (!authStore.isLoggedIn) {
      return { success: false, error: 'Anda harus login terlebih dahulu.' }
    }
    if (items.value.length === 0) {
      return { success: false, error: 'Keranjang belanja kosong.' }
    }
    if (authStore.user.walletBalance < total.value) {
      return { success: false, error: 'Saldo wallet tidak mencukupi. Silakan lakukan Top Up.' }
    }

    // Process checkout
    // 1. Deduct wallet
    const newBalance = authStore.user.walletBalance - total.value
    authStore.updateWalletBalance(newBalance)

    // 2. Reduce stock for each product in store
    items.value.forEach(item => {
      const prod = productsStore.products.find(p => p.id === item.product.id)
      if (prod) {
        prod.stock = Math.max(0, prod.stock - item.quantity)
      }
    })

    // 3. Create order
    const discountObj = activeVoucher.value ? {
      code: activeVoucher.value.code,
      amount: discountAmount.value
    } : null

    const order = ordersStore.createOrder({
      buyer_id: authStore.user.id,
      buyer_name: authStore.user.name,
      buyer_address: authStore.user.address,
      store_id: cartStoreId.value,
      store_name: cartStoreName.value,
      items: items.value.map(item => ({
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        image: item.product.image
      })),
      delivery_method: selectedDelivery.value,
      delivery_fee: finalDeliveryFee.value,
      discount: discountObj,
      subtotal: subtotal.value,
      ppn: ppnAmount.value,
      total: total.value
    })

    // 4. Clear cart
    clearCart()

    return { success: true, orderId: order.id }
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
    addToCart,
    removeFromCart,
    updateQuantity,
    applyVoucher,
    removeVoucher,
    clearCart,
    submitCheckout
  }
})
