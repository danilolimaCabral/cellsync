import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorageService from '../services/storage/AsyncStorageService';
import { Cart, CartItem, Product, Customer } from '../types/models.types';

interface CartContextData {
  cart: Cart;
  addItem: (product: Product, quantity: number, stockItemId?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  setCustomer: (customer: Customer | undefined) => void;
  setPaymentMethod: (method: string) => void;
  setSaleType: (type: 'varejo' | 'atacado') => void;
  setDiscount: (discount: number) => void;
  clearCart: () => void;
  itemCount: number;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

interface CartProviderProps {
  children: ReactNode;
}

const initialCart: Cart = {
  items: [],
  subtotal: 0,
  discount: 0,
  total: 0,
  saleType: 'varejo',
};

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cart, setCart] = useState<Cart>(initialCart);

  useEffect(() => {
    loadCart();
  }, []);

  useEffect(() => {
    saveCart();
    calculateTotals();
  }, [cart.items, cart.discount, cart.saleType]);

  async function loadCart() {
    try {
      const storedCart = await AsyncStorageService.getCartData();
      if (storedCart) {
        setCart(storedCart);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  }

  async function saveCart() {
    try {
      await AsyncStorageService.setCartData(cart);
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  }

  function calculateTotals() {
    const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const total = subtotal - cart.discount;

    setCart(prev => ({
      ...prev,
      subtotal,
      total: Math.max(0, total),
    }));
  }

  function addItem(product: Product, quantity: number = 1, stockItemId?: number) {
    setCart(prev => {
      const existingItemIndex = prev.items.findIndex(item => item.product.id === product.id);
      
      const price = prev.saleType === 'atacado' && product.precoAtacado
        ? product.precoAtacado
        : product.precoVenda;

      if (existingItemIndex >= 0) {
        const newItems = [...prev.items];
        newItems[existingItemIndex].quantity += quantity;
        return { ...prev, items: newItems };
      }

      const newItem: CartItem = {
        product,
        quantity,
        price,
        stockItemId,
      };

      return { ...prev, items: [...prev.items, newItem] };
    });
  }

  function removeItem(productId: number) {
    setCart(prev => ({
      ...prev,
      items: prev.items.filter(item => item.product.id !== productId),
    }));
  }

  function updateQuantity(productId: number, quantity: number) {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    setCart(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      ),
    }));
  }

  function setCustomer(customer: Customer | undefined) {
    setCart(prev => ({ ...prev, customer }));
  }

  function setPaymentMethod(method: string) {
    setCart(prev => ({ ...prev, paymentMethod: method }));
  }

  function setSaleType(type: 'varejo' | 'atacado') {
    setCart(prev => {
      const updatedItems = prev.items.map(item => ({
        ...item,
        price: type === 'atacado' && item.product.precoAtacado
          ? item.product.precoAtacado
          : item.product.precoVenda,
      }));

      return { ...prev, saleType: type, items: updatedItems };
    });
  }

  function setDiscount(discount: number) {
    setCart(prev => ({ ...prev, discount }));
  }

  function clearCart() {
    setCart(initialCart);
    AsyncStorageService.removeCartData();
  }

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <AuthContext.Provider
      value={{
        cart,
        addItem,
        removeItem,
        updateQuantity,
        setCustomer,
        setPaymentMethod,
        setSaleType,
        setDiscount,
        clearCart,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }

  return context;
}
