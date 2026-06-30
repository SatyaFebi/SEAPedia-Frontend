import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useProductsStore = defineStore('products', () => {
  const products = ref([
    // Store Budi (Budi Lestari Jaya) - Category: Groceries/Indonesian Heritage Food
    {
      id: 'prod-1',
      store_id: 'str-budi',
      store_name: 'Budi Lestari Jaya',
      name: 'Sambal Roa Khas Manado Premium',
      description: 'Sambal khas Manado terbuat dari ikan roa asap pilihan dan rempah-rempah asli. Pedas gurih mantap tanpa pengawet.',
      price: 45000,
      stock: 50,
      image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&q=80&w=400',
    },
    {
      id: 'prod-2',
      store_id: 'str-budi',
      store_name: 'Budi Lestari Jaya',
      name: 'Kopi Toraja Arabika Kalosi 250g',
      description: 'Biji kopi pilihan Toraja Arabika single origin dengan tingkat keasaman medium dan aroma herbal rempah yang khas.',
      price: 85000,
      stock: 30,
      image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&q=80&w=400',
    },
    {
      id: 'prod-3',
      store_id: 'str-budi',
      store_name: 'Budi Lestari Jaya',
      name: 'Beras Cianjur Pandan Wangi 5kg',
      description: 'Beras pandan wangi asli Cianjur. Bulir bulat sedang, aroma wangi pandan alami, dan tekstur nasi yang sangat pulen.',
      price: 98000,
      stock: 20,
      image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=400',
    },
    // Store Agus (Agus Motor & Parts) - Category: Automotive/Hardware
    {
      id: 'prod-4',
      store_id: 'str-agus',
      store_name: 'Agus Motor & Parts',
      name: 'Oli Mesin Motor Matic 10W-40 1L',
      description: 'Oli mesin sintetik performa tinggi untuk kenyamanan berkendara harian motor matic Anda. Melindungi gesekan mesin secara maksimal.',
      price: 65000,
      stock: 100,
      image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&q=80&w=400',
    },
    {
      id: 'prod-5',
      store_id: 'str-agus',
      store_name: 'Agus Motor & Parts',
      name: 'Kampas Rem Depan Honda Vario/Beat',
      description: 'Kampas rem depan (brake pad) kualitas original. Cengkraman kuat dan awet di segala kondisi cuaca.',
      price: 35000,
      stock: 45,
      image: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=400',
    },
    {
      id: 'prod-6',
      store_id: 'str-agus',
      store_name: 'Agus Motor & Parts',
      name: 'Lampu LED Motor H6 Putih Terang',
      description: 'Lampu utama LED dengan soket H6 untuk bebek dan matic. Sangat terang, hemat daya aki, dan fokus tidak menyilaukan lawan arah.',
      price: 75000,
      stock: 15,
      image: 'https://images.unsplash.com/photo-1517524206127-48bbd363f3d7?auto=format&fit=crop&q=80&w=400',
    }
  ])

  function getProductsByStore(storeId) {
    return products.value.filter(p => p.store_id === storeId)
  }

  function addProduct(productData, store) {
    const newProduct = {
      id: `prod-${Date.now()}`,
      store_id: store.id,
      store_name: store.name,
      name: productData.name,
      description: productData.description || '',
      price: parseFloat(productData.price),
      stock: parseInt(productData.stock) || 0,
      image: productData.image || 'https://images.unsplash.com/photo-1546213290-e1b492ab3aea?auto=format&fit=crop&q=80&w=400'
    }
    products.value.push(newProduct)
    return newProduct
  }

  function updateProduct(productId, productData) {
    const index = products.value.findIndex(p => p.id === productId)
    if (index !== -1) {
      products.value[index] = {
        ...products.value[index],
        name: productData.name,
        description: productData.description,
        price: parseFloat(productData.price),
        stock: parseInt(productData.stock) || 0,
        image: productData.image || products.value[index].image
      }
      return products.value[index]
    }
    return null
  }

  function deleteProduct(productId) {
    const index = products.value.findIndex(p => p.id === productId)
    if (index !== -1) {
      products.value.splice(index, 1)
      return true
    }
    return false
  }

  return {
    products,
    getProductsByStore,
    addProduct,
    updateProduct,
    deleteProduct
  }
})
