import { ref } from 'vue'
import { defineStore } from 'pinia'
import { apiRequest } from '../utils/api'

export const useProductsStore = defineStore('products', () => {
  const products = ref([])

  function getProductsByStore(storeId) {
    return products.value.filter(p => p.store_id === storeId)
  }

  async function fetchProducts() {
    try {
      const data = await apiRequest('/products', { method: 'GET' })
      products.value = data
    } catch (err) {
      console.error('Failed to fetch products:', err)
    }
  }

  async function addProduct(productData) {
    try {
      const data = await apiRequest('/products', {
        method: 'POST',
        body: JSON.stringify({
          name: productData.name,
          description: productData.description,
          price: productData.price,
          stock: productData.stock,
          image: productData.image,
          category: productData.category
        })
      })
      products.value.push(data.product)
      return { success: true }
    } catch (err) {
      console.error('Failed to add product:', err)
      return { success: false, message: err.message }
    }
  }

  async function updateProduct(productId, productData) {
    try {
      const data = await apiRequest(`/products/${productId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: productData.name,
          description: productData.description,
          price: productData.price,
          stock: productData.stock,
          image: productData.image,
          category: productData.category
        })
      })
      const index = products.value.findIndex(p => p.id === productId)
      if (index !== -1) {
        products.value[index] = data.product
      }
      return { success: true }
    } catch (err) {
      console.error('Failed to update product:', err)
      return { success: false, message: err.message }
    }
  }

  async function deleteProduct(productId) {
    try {
      await apiRequest(`/products/${productId}`, { method: 'DELETE' })
      const index = products.value.findIndex(p => p.id === productId)
      if (index !== -1) {
        products.value.splice(index, 1)
      }
      return { success: true }
    } catch (err) {
      console.error('Failed to delete product:', err)
      return { success: false, message: err.message }
    }
  }

  return {
    products,
    getProductsByStore,
    fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct
  }
})
