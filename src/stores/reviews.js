import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useReviewsStore = defineStore('reviews', () => {
  const reviews = ref([
    {
      id: 'rev-1',
      name: 'Rian Dwi',
      role: 'Buyer',
      rating: 5,
      comment: 'Sangat praktis! Belanja bahan masakan tradisional jadi lebih cepat. Fitur instant delivery-nya sangat membantu ketika butuh mendadak.',
      date: '2026-06-20'
    },
    {
      id: 'rev-2',
      name: 'Dewi Lestari',
      role: 'Seller',
      rating: 5,
      comment: 'Dashboard sellernya ringkas dan mudah dipahami. Sebagai penjual kopi lokal, saya bisa memantau stok dan pesanan masuk secara real-time dengan lancar.',
      date: '2026-06-22'
    },
    {
      id: 'rev-3',
      name: 'Hendra Setiawan',
      role: 'Driver',
      rating: 4,
      comment: 'Aplikasi mudah digunakan oleh driver. Notifikasi pekerjaan baru langsung masuk dan petunjuk pengiriman alamatnya sangat jelas.',
      date: '2026-06-23'
    }
  ])

  // Simple script/HTML tag stripper to prevent XSS
  function sanitizeInput(text) {
    if (typeof text !== 'string') return ''
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  }

  function addReview(reviewData) {
    const sanitizedComment = sanitizeInput(reviewData.comment)
    const newReview = {
      id: `rev-${Date.now()}`,
      name: sanitizeInput(reviewData.name) || 'Guest',
      role: reviewData.role || 'Guest',
      rating: parseInt(reviewData.rating) || 5,
      comment: sanitizedComment,
      date: new Date().toISOString().split('T')[0]
    }
    reviews.value.unshift(newReview)
    return newReview
  }

  return {
    reviews,
    addReview
  }
})
