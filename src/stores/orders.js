import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from './auth'
import { apiRequest } from '../utils/api'

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

  async function fetchBuyerOrders() {
    try {
      const data = await apiRequest('/orders/buyer')
      orders.value = data
    } catch (err) {
      console.error('Gagal mengambil pesanan pembeli:', err)
    }
  }

  async function fetchSellerOrders() {
    try {
      const data = await apiRequest('/orders/seller')
      orders.value = data
    } catch (err) {
      console.error('Gagal mengambil pesanan penjual:', err)
    }
  }

  // Get orders by role (working on top of synchronized local ref)
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

  // Create new order (stub, actual checkout is backend-driven)
  function createOrder(orderData) {
    return orderData
  }

  // Handle status updates via API
  async function transitionOrderStatus(orderId, newStatus, extra = {}) {
    try {
      const data = await apiRequest(`/orders/${orderId}/status`, {
        method: 'POST',
        body: JSON.stringify({ status: newStatus })
      })
      const idx = orders.value.findIndex(o => o.id === orderId)
      if (idx !== -1) {
        orders.value[idx] = data.order
      } else {
        orders.value.unshift(data.order)
      }
      return true
    } catch (err) {
      console.error('Gagal memperbarui status pesanan:', err)
      return false
    }
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
    fetchBuyerOrders,
    fetchSellerOrders,
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
