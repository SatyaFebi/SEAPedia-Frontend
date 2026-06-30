import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from './auth'
import { apiRequest } from '../utils/api'

export const useOrdersStore = defineStore('orders', () => {
  const orders = ref([])
  const availableJobs = ref([])
  const myDriverJobs = ref([])
  const driverEarnings = ref({
    total_earnings: 0,
    completed_count: 0,
    active_job: null,
    earning_rule: '',
  })
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

  async function fetchAvailableJobs() {
    try {
      const data = await apiRequest('/driver/jobs')
      availableJobs.value = data
    } catch (err) {
      console.error('Gagal mengambil daftar pekerjaan:', err)
    }
  }

  async function fetchMyDriverJobs() {
    try {
      const data = await apiRequest('/driver/my-jobs')
      myDriverJobs.value = data
    } catch (err) {
      console.error('Gagal mengambil riwayat pekerjaan driver:', err)
    }
  }

  async function fetchDriverEarnings() {
    try {
      const data = await apiRequest('/driver/earnings')
      driverEarnings.value = data
    } catch (err) {
      console.error('Gagal mengambil ringkasan penghasilan:', err)
    }
  }

  async function takeJob(orderId) {
    const data = await apiRequest(`/driver/jobs/${orderId}/take`, { method: 'POST' })
    availableJobs.value = availableJobs.value.filter((j) => j.order_id !== orderId)
    myDriverJobs.value.unshift(data.job)
    driverEarnings.value.active_job = data.job
    return data
  }

  async function completeJob(orderId) {
    const data = await apiRequest(`/driver/jobs/${orderId}/complete`, { method: 'POST' })
    const idx = myDriverJobs.value.findIndex((j) => j.order_id === orderId)
    if (idx !== -1) myDriverJobs.value[idx] = data.job
    driverEarnings.value.active_job = null
    await fetchDriverEarnings()
    return data
  }

  function getBuyerOrders(buyerId) {
    return orders.value.filter((o) => o.buyer_id === buyerId)
  }

  function getSellerOrders(storeId) {
    return orders.value.filter((o) => o.store_id === storeId)
  }

  function getDriverJobs(driverId) {
    return orders.value.filter((o) => o.driver_id === driverId)
  }

  async function transitionOrderStatus(orderId, newStatus) {
    try {
      const data = await apiRequest(`/orders/${orderId}/status`, {
        method: 'POST',
        body: JSON.stringify({ status: newStatus }),
      })
      const idx = orders.value.findIndex((o) => o.id === orderId)
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

  async function processOrder(orderId) {
    try {
      const data = await apiRequest(`/orders/${orderId}/process`, { method: 'POST' })
      const idx = orders.value.findIndex((o) => o.id === orderId)
      if (idx !== -1) orders.value[idx] = data.order
      return true
    } catch (err) {
      console.error('Gagal memproses pesanan:', err)
      return false
    }
  }

  function simulateNextDay() {
    simulatedDay.value++
    const authStore = useAuthStore()

    orders.value.forEach((order) => {
      if (order.status === 'Sedang Dikemas' || order.status === 'Menunggu Pengirim') {
        order.days_in_current_status = (order.days_in_current_status || 0) + 1
        const limit =
          order.delivery_method === 'Instant' || order.delivery_method === 'Next Day' ? 1 : 2

        if (order.days_in_current_status >= limit) {
          const oldStatus = order.status
          order.status = 'Dikembalikan'
          order.status_history?.push({
            status: `Dikembalikan (SLA Timeout ${oldStatus})`,
            timestamp: `Simulasi Hari Ke-${simulatedDay.value}`,
          })
          if (authStore.user?.id === order.buyer_id) {
            authStore.updateWalletBalance(authStore.user.walletBalance + order.total)
          }
        }
      } else if (order.status === 'Sedang Dikirim') {
        order.status = 'Pesanan Selesai'
        order.status_history?.push({
          status: 'Pesanan Selesai (Auto-Delivered)',
          timestamp: `Simulasi Hari Ke-${simulatedDay.value}`,
        })
      }
    })
  }

  // Kept for backward compat (admin dashboard)
  function getDriverEarnings() {
    return driverEarnings.value.total_earnings || 0
  }

  return {
    orders,
    availableJobs,
    myDriverJobs,
    driverEarnings,
    simulatedDay,
    fetchBuyerOrders,
    fetchSellerOrders,
    fetchAvailableJobs,
    fetchMyDriverJobs,
    fetchDriverEarnings,
    takeJob,
    completeJob,
    getBuyerOrders,
    getSellerOrders,
    getDriverJobs,
    transitionOrderStatus,
    processOrder,
    simulateNextDay,
    getDriverEarnings,
  }
})
