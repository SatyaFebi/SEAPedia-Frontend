import { ref } from 'vue'
import { defineStore } from 'pinia'
import { apiRequest } from '../utils/api'

export const useReviewsStore = defineStore('reviews', () => {
  const reviews = ref([])

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

  async function fetchReviews() {
    try {
      const data = await apiRequest('/reviews', { method: 'GET' })
      reviews.value = data
    } catch (err) {
      console.error('Failed to fetch reviews:', err)
    }
  }

  async function addReview(reviewData) {
    try {
      const sanitizedComment = sanitizeInput(reviewData.comment)
      const data = await apiRequest('/reviews', {
        method: 'POST',
        body: JSON.stringify({
          reviewer_name: reviewData.name || 'Tamu Anonim',
          rating: reviewData.rating,
          comment: sanitizedComment,
        }),
      })
      reviews.value.unshift(data)
      return { success: true }
    } catch (err) {
      return { success: false, message: err.message }
    }
  }

  // Load reviews automatically
  fetchReviews()

  return {
    reviews,
    fetchReviews,
    addReview,
  }
})
