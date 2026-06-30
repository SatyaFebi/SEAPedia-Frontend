import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

import LandingView from '../views/LandingView.vue'
import LoginView from '../views/LoginView.vue'
import RoleSelectionView from '../views/RoleSelectionView.vue'
import BuyerDashboard from '../views/BuyerDashboard.vue'
import SellerDashboard from '../views/SellerDashboard.vue'
import DriverDashboard from '../views/DriverDashboard.vue'
import AdminDashboard from '../views/AdminDashboard.vue'
import DashboardLayout from '../layouts/DashboardLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: LandingView,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue'),
    },
    {
      path: '/role-selection',
      name: 'role-selection',
      component: RoleSelectionView,
    },
    {
      path: '/dashboard',
      component: DashboardLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: 'buyer',
          name: 'dashboard-buyer',
          component: BuyerDashboard,
          meta: { role: 'Buyer' },
        },
        {
          path: 'seller',
          name: 'dashboard-seller',
          component: SellerDashboard,
          meta: { role: 'Seller' },
        },
        {
          path: 'driver',
          name: 'dashboard-driver',
          component: DriverDashboard,
          meta: { role: 'Driver' },
        },
        {
          path: 'admin',
          name: 'dashboard-admin',
          component: AdminDashboard,
          meta: { role: 'Admin' },
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

// Route guard
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // 1. If route requires authentication
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    if (!authStore.isLoggedIn) {
      return next({ name: 'login' })
    }

    // 2. Check if active role is selected (if user has multiple roles)
    if (!authStore.activeRole) {
      return next({ name: 'role-selection' })
    }

    // 3. Enforce role-based access for child routes
    const requiredRole = to.meta.role
    if (requiredRole && authStore.activeRole !== requiredRole) {
      // Redirect to correct dashboard for their active role
      if (authStore.activeRole === 'Buyer') return next({ name: 'dashboard-buyer' })
      if (authStore.activeRole === 'Seller') return next({ name: 'dashboard-seller' })
      if (authStore.activeRole === 'Driver') return next({ name: 'dashboard-driver' })
      if (authStore.activeRole === 'Admin') return next({ name: 'dashboard-admin' })
    }
  }

  // If user is logged in and tries to access login/register or role selection when they already have active role
  if (authStore.isLoggedIn) {
    if (to.name === 'login' || to.name === 'register') {
      if (authStore.activeRole) {
        return next({ name: `dashboard-${authStore.activeRole.toLowerCase()}` })
      } else {
        return next({ name: 'role-selection' })
      }
    }
    if (to.name === 'role-selection' && authStore.user.roles.length === 1) {
      // Auto redirect if single role
      return next({ name: `dashboard-${authStore.activeRole.toLowerCase()}` })
    }
  }

  next()
})

export default router
