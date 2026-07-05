# SEAPedia Marketplace — Frontend

Vue 3 SPA for the SEAPedia multi-role marketplace. Communicates with the Laravel backend API.

---

## Tech Stack

- **Vue 3** (Composition API)
- **Vite 8**
- **Pinia** — state management
- **Vue Router 5** — client-side routing with role-based guards
- **Tailwind CSS 4**

---

## Requirements

- Node.js `^22.18.0` or `>=24.12.0`
- npm
- Backend running at `http://localhost:8000` (see [backend README](https://github.com/SatyaFebi/SEAPedia-Backend))

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment (optional)

The API base URL defaults to `http://localhost:8000/api`. If your backend runs on a different port or host, create a `.env` file:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

### 3. Start the dev server

```bash
npm run dev
```

App runs at `http://localhost:5173`.

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:8000/api` |

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build locally |
| `npm run format` | Format source files with Prettier |

---

## Application Roles & Views

After login, users are taken to a **Role Selection** screen if they have multiple roles. Each role has its own dedicated dashboard:

| Role | View | Access |
|---|---|---|
| **Buyer** | `BuyerDashboard.vue` | Browse products, manage cart, checkout, view orders |
| **Seller** | `SellerDashboard.vue` | Manage store, products, and incoming orders |
| **Driver** | `DriverDashboard.vue` | View available delivery jobs, take & complete deliveries |
| **Admin** | `AdminDashboard.vue` | System overview, order management, SLA simulation |

---

## Single-Store Checkout

The cart enforces a **single-store constraint** — you can only have items from one store at a time.

**How it works in the UI:**

1. When a user adds a product to the cart and the cart already contains items from a **different store**, the backend returns `409 Conflict`.
2. The frontend (`BuyerDashboard.vue`) detects this conflict and shows a **confirmation dialog**:
   > *"Your cart contains items from [Current Store]. Do you want to clear your cart and add items from [New Store] instead?"*
3. If the user confirms, the frontend resends the request with `force: true`, which clears the existing cart and adds the new item.
4. If the user cancels, the cart remains unchanged.

The locked store name is always shown in the cart panel so the user knows which store they're currently shopping from.

**API behavior:**
- `POST /api/cart/items` — returns `409` if a store conflict is detected.
- Resend with `{ ..., "force": true }` to override and replace the cart.

---

## Folder Structure

```
src/
  views/
    LandingView.vue        Public landing page with product catalog and reviews
    LoginView.vue          Login form
    RegisterView.vue       Registration form (select roles: Buyer, Seller, Driver)
    RoleSelectionView.vue  Role picker (shown when user has multiple roles)
    BuyerDashboard.vue     Buyer: cart, checkout, orders, wallet, addresses
    SellerDashboard.vue    Seller: store management, products, orders
    DriverDashboard.vue    Driver: available jobs, job history, earnings
    AdminDashboard.vue     Admin: dashboard stats, orders, SLA simulation
  stores/
    auth.js                User auth state, login/logout, role management
    cart.js                Cart state, single-store enforcement, checkout logic
    orders.js              Order fetching and status tracking
    products.js            Product listing
    reviews.js             Public reviews
  router/
    index.js               Routes with navigation guards (auth + role checks)
  layouts/
    DashboardLayout.vue    Shared layout wrapper for all dashboards
  components/
    Skeleton.vue           Reusable skeleton loader component
  utils/
    api.js                 Centralized API client — attaches Bearer token and X-Active-Role header automatically
```

---

## Authentication Flow

1. User logs in → receives a Bearer token stored in `localStorage`.
2. User selects an active role → stored in `localStorage` as `activeRole`.
3. Every API request automatically sends:
   ```
   Authorization: Bearer <token>
   X-Active-Role: <activeRole>
   ```
4. On logout, both `token` and `activeRole` are cleared and the user is redirected to `/login`.

---

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar)
- Disable Vetur if installed
