import { ref, toRaw } from 'vue'
import { defineStore } from 'pinia'
import { apiRequest } from '../utils/api'

const API_URL = 'http://localhost:8000/api'

function buildProductFormData(productData) {
  const fd = new FormData()
  fd.append('name', productData.name)
  fd.append('price', productData.price)
  fd.append('stock', productData.stock)
  fd.append('category', productData.category || 'Kuliner')
  if (productData.description) fd.append('description', productData.description)
  if (productData.imageFile) {
    fd.append('image_file', toRaw(productData.imageFile))
  } else if (productData.image) {
    fd.append('image', productData.image)
  }
  return fd
}

export const useProductsStore = defineStore('products', () => {
  const products = ref([])

  function getProductsByStore(storeId) {
    return products.value.filter((p) => p.store_id === storeId)
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
      const token = localStorage.getItem('api_token')
      const activeRole = localStorage.getItem('active_role')
      let data

      if (productData.imageFile) {
        // multipart upload
        const headers = { Accept: 'application/json' }
        if (token) headers['Authorization'] = `Bearer ${token}`
        if (activeRole) headers['X-Active-Role'] = activeRole
        const res = await fetch(`${API_URL}/products`, {
          method: 'POST',
          headers,
          body: buildProductFormData(productData),
        })
        data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Request failed')
      } else {
        data = await apiRequest('/products', {
          method: 'POST',
          body: JSON.stringify({
            name: productData.name,
            description: productData.description,
            price: productData.price,
            stock: productData.stock,
            image: productData.image,
            category: productData.category,
          }),
        })
      }

      products.value.push(data.product)
      return { success: true }
    } catch (err) {
      console.error('Failed to add product:', err)
      return { success: false, message: err.message }
    }
  }

  async function updateProduct(productId, productData) {
    try {
      const token = localStorage.getItem('api_token')
      const activeRole = localStorage.getItem('active_role')
      let data

      if (productData.imageFile) {
        // multipart upload — use POST alias route (PUT doesn't support multipart)
        const fd = buildProductFormData(productData)
        const headers = { Accept: 'application/json' }
        if (token) headers['Authorization'] = `Bearer ${token}`
        if (activeRole) headers['X-Active-Role'] = activeRole
        const res = await fetch(`${API_URL}/products/${productId}`, {
          method: 'POST',
          headers,
          body: fd,
        })
        data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Request failed')
      } else {
        data = await apiRequest(`/products/${productId}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: productData.name,
            description: productData.description,
            price: productData.price,
            stock: productData.stock,
            image: productData.image,
            category: productData.category,
          }),
        })
      }

      const index = products.value.findIndex((p) => p.id === productId)
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
      const index = products.value.findIndex((p) => p.id === productId)
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
    deleteProduct,
  }
})
