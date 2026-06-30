import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from './auth'

export const useOrdersStore = defineStore('orders', () => {
  const orders = ref([
    // Mock existing order for Siti (as Buyer) from Budi's store (completed)
    {
      id: 'ORD-100200',
      buyer_id: 'usr-siti',
      buyer_name: 'Siti Rahma',
      buyer_address: 'Jl. Sudirman No. 88, Surabaya',
      store_id: 'str-budi',
      store_name: 'Budi Lestari Jaya',
      items: [
        {
          id: 'prod-1',
          name: 'Sambal Roa Khas Manado Premium',
          price: 45000,
          quantity: 2,
          image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&q=80&w=400',
        }
      ],
      delivery_method: 'Regular',
      delivery_fee: 9000,
      discount: null,
      subtotal: 90000,
      ppn: 11880, // (90000 + 9000) * 12%
      total: 110880,
      status: 'Pesanan Selesai',
      driver_id: 'usr-agus',
      driver_name: 'Agus Setiawan',
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleString('id-ID'), // 3 days ago
      days_in_current_status: 0,
      status_history: [
        { status: 'Sedang Dikemas', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleString('id-ID') },
        { status: 'Menunggu Pengirim', timestamp: new Date(Date.now() - 2.8 * 24 * 60 * 60 * 1000).toLocaleString('id-ID') },
        { status: 'Sedang Dikirim', timestamp: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000).toLocaleString('id-ID') },
        { status: 'Pesanan Selesai', timestamp: new Date(Date.now() - 2.4 * 24 * 60 * 60 * 1000).toLocaleString('id-ID') }
      ]
    }
  ])

  const simulatedDay = ref(1)

  // Get orders by role
  function getBuyerOrders(buyerId) {
    return orders.value.filter(o => o.buyer_id === buyerId)
  }

  function getSellerOrders(storeId) {
    return orders.value.filter(o => o.store_id === storeId)
  }

  const availableJobs = computed(() => {
    return orders.value.filter(o => o.status === 'Menunggu Pengirim')
  })

  function getDriverJobs(driverId) {
    return orders.value.filter(o => o.driver_id === driverId)
  }

  // Create new order
  function createOrder(orderData) {
    const timestampStr = new Date().toLocaleString('id-ID')
    const newOrder = {
      id: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
      buyer_id: orderData.buyer_id,
      buyer_name: orderData.buyer_name,
      buyer_address: orderData.buyer_address,
      store_id: orderData.store_id,
      store_name: orderData.store_name,
      items: orderData.items,
      delivery_method: orderData.delivery_method,
      delivery_fee: orderData.delivery_fee,
      discount: orderData.discount,
      subtotal: orderData.subtotal,
      ppn: orderData.ppn,
      total: orderData.total,
      status: 'Sedang Dikemas',
      driver_id: null,
      driver_name: null,
      created_at: timestampStr,
      days_in_current_status: 0,
      status_history: [
        { status: 'Sedang Dikemas', timestamp: timestampStr }
      ]
    }
    orders.value.unshift(newOrder)
    return newOrder
  }

  // Handle status updates (enforces transitions)
  function transitionOrderStatus(orderId, newStatus, extra = {}) {
    const order = orders.value.find(o => o.id === orderId)
    if (!order) return false

    const currentStatus = order.status
    let isValid = false

    // Enforce: Sedang Dikemas ➔ Menunggu Pengirim ➔ Sedang Dikirim ➔ Pesanan Selesai OR Dikembalikan
    if (currentStatus === 'Sedang Dikemas' && newStatus === 'Menunggu Pengirim') {
      isValid = true
    } else if (currentStatus === 'Menunggu Pengirim' && newStatus === 'Sedang Dikirim') {
      isValid = true
      if (extra.driver_id) {
        order.driver_id = extra.driver_id
        order.driver_name = extra.driver_name
      }
    } else if (currentStatus === 'Sedang Dikirim' && (newStatus === 'Pesanan Selesai' || newStatus === 'Dikembalikan')) {
      isValid = true
    } else if (newStatus === 'Dikembalikan') {
      // SLA auto-return/cancel can happen from Sedang Dikemas or Menunggu Pengirim
      if (currentStatus === 'Sedang Dikemas' || currentStatus === 'Menunggu Pengirim') {
        isValid = true
      }
    }

    if (isValid) {
      order.status = newStatus
      order.days_in_current_status = 0 // reset age in status
      order.status_history.push({
        status: newStatus,
        timestamp: new Date().toLocaleString('id-ID')
      })
      return true
    }
    return false
  }

  // Admin operational trigger: Simulate Next Day
  function simulateNextDay() {
    simulatedDay.value++
    const authStore = useAuthStore()

    // 1. Process SLA for each active order
    orders.value.forEach(order => {
      // Only check orders that are not yet shipped or completed
      if (order.status === 'Sedang Dikemas' || order.status === 'Menunggu Pengirim') {
        order.days_in_current_status++

        // SLA threshold:
        // Instant: 1 day limit
        // Next Day: 1 day limit
        // Regular: 2 days limit
        let limit = 2
        if (order.delivery_method === 'Instant' || order.delivery_method === 'Next Day') {
          limit = 1
        }

        if (order.days_in_current_status >= limit) {
          // Trigger automatic refund / auto-return
          const oldStatus = order.status
          order.status = 'Dikembalikan'
          order.status_history.push({
            status: `Dikembalikan (SLA Timeout ${oldStatus})`,
            timestamp: `Simulasi Hari Ke-${simulatedDay.value}`
          })

          // Refund money to buyer's wallet
          // If refunding, we look up the buyer
          // Since it's a simulation, if the buyer is currently logged in, update their wallet reactively
          if (authStore.user && authStore.user.id === order.buyer_id) {
            const refundedAmount = authStore.user.walletBalance + order.total
            authStore.updateWalletBalance(refundedAmount)
          } else {
            // Find in mockUsers database
            const dbUser = authStore.mockUsers.find(u => u.id === order.buyer_id)
            if (dbUser) {
              dbUser.walletBalance += order.total
            }
          }
        }
      } else if (order.status === 'Sedang Dikirim') {
        // Driver is delivering. Let's auto-complete it on next day simulation
        order.status = 'Pesanan Selesai'
        order.status_history.push({
          status: 'Pesanan Selesai (Auto-Delivered)',
          timestamp: `Simulasi Hari Ke-${simulatedDay.value}`
        })
      }
    })
  }

  // Earning computation for drivers
  function getDriverEarnings(driverId) {
    const completed = orders.value.filter(o => o.driver_id === driverId && o.status === 'Pesanan Selesai')
    // Driver earnings: Let's say 80% of delivery fee
    return completed.reduce((sum, o) => sum + (o.delivery_fee * 0.8), 0)
  }

  return {
    orders,
    simulatedDay,
    getBuyerOrders,
    getSellerOrders,
    availableJobs,
    getDriverJobs,
    createOrder,
    transitionOrderStatus,
    simulateNextDay,
    getDriverEarnings
  }
})
