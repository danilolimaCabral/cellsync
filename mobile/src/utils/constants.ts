// API Configuration
export const API_CONFIG = {
  BASE_URL: 'https://3000-iob7ye059hwvp4sz9bjn9-f9914a8d.manusvm.computer',
  TRPC_URL: 'https://3000-iob7ye059hwvp4sz9bjn9-f9914a8d.manusvm.computer/api/trpc',
  TIMEOUT: 30000,
};

// App Configuration
export const APP_CONFIG = {
  NAME: 'CellSync Mobile',
  VERSION: '1.0.0',
  ENABLE_BIOMETRIC_AUTH: false,
  ENABLE_OFFLINE_MODE: false,
};

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: '@cellsync:auth_token',
  USER_DATA: '@cellsync:user_data',
  CART_DATA: '@cellsync:cart_data',
  THEME: '@cellsync:theme',
};

// Navigation Routes
export const ROUTES = {
  // Auth
  SPLASH: 'Splash',
  LOGIN: 'Login',
  
  // Main Tabs
  PDV: 'PDV',
  STOCK: 'Stock',
  ORDERS: 'Orders',
  MORE: 'More',
  
  // PDV Stack
  CART: 'Cart',
  CHECKOUT: 'Checkout',
  RECEIPT: 'Receipt',
  PRODUCT_SEARCH: 'ProductSearch',
  
  // Stock Stack
  PRODUCT_DETAIL: 'ProductDetail',
  STOCK_MOVEMENTS: 'StockMovements',
  SCANNER: 'Scanner',
  
  // Orders Stack
  CREATE_ORDER: 'CreateOrder',
  ORDER_DETAIL: 'OrderDetail',
  ADD_PARTS: 'AddParts',
  
  // Customers
  CUSTOMERS: 'Customers',
  CUSTOMER_DETAIL: 'CustomerDetail',
  
  // Dashboard
  DASHBOARD: 'Dashboard',
  REPORTS: 'Reports',
  
  // Notifications
  NOTIFICATIONS: 'Notifications',
  
  // Profile
  PROFILE: 'Profile',
  SETTINGS: 'Settings',
};

// Payment Methods
export const PAYMENT_METHODS = [
  { id: 'dinheiro', label: 'Dinheiro', icon: 'cash' },
  { id: 'debito', label: 'Débito', icon: 'credit-card' },
  { id: 'credito', label: 'Crédito', icon: 'credit-card-outline' },
  { id: 'pix', label: 'PIX', icon: 'qrcode' },
];

// Order Status
export const ORDER_STATUS = {
  ABERTA: { label: 'Aberta', color: '#3b82f6' },
  EM_ANDAMENTO: { label: 'Em Andamento', color: '#f59e0b' },
  AGUARDANDO_PECA: { label: 'Aguardando Peça', color: '#8b5cf6' },
  PRONTA: { label: 'Pronta', color: '#10b981' },
  ENTREGUE: { label: 'Entregue', color: '#059669' },
  CANCELADA: { label: 'Cancelada', color: '#ef4444' },
};

// Product Categories
export const PRODUCT_CATEGORIES = [
  'Smartphones',
  'Acessórios',
  'Peças',
  'Capas',
  'Películas',
  'Carregadores',
  'Fones',
  'Outros',
];
