const API_URL = 'http://localhost:8000/api'

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('api_token')
  const activeRole = localStorage.getItem('active_role')

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers || {})
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  if (activeRole) {
    headers['X-Active-Role'] = activeRole
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  })

  // Parse JSON response safely
  let data = null
  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    data = await response.json()
  } else {
    data = { message: await response.text() }
  }

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('api_token')
      localStorage.removeItem('active_role')
    }
    const error = new Error(data.message || 'Request failed')
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}
