import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../utils/constants';

class AsyncStorageService {
  // Auth Token
  async setAuthToken(token: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  }

  async getAuthToken(): Promise<string | null> {
    return await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  async removeAuthToken(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  // User Data
  async setUserData(user: any): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
  }

  async getUserData(): Promise<any | null> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    return data ? JSON.parse(data) : null;
  }

  async removeUserData(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
  }

  // Cart Data
  async setCartData(cart: any): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.CART_DATA, JSON.stringify(cart));
  }

  async getCartData(): Promise<any | null> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CART_DATA);
    return data ? JSON.parse(data) : null;
  }

  async removeCartData(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.CART_DATA);
  }

  // Theme
  async setTheme(theme: 'light' | 'dark'): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.THEME, theme);
  }

  async getTheme(): Promise<'light' | 'dark' | null> {
    return (await AsyncStorage.getItem(STORAGE_KEYS.THEME)) as 'light' | 'dark' | null;
  }

  // Clear All
  async clearAll(): Promise<void> {
    await AsyncStorage.clear();
  }

  // Generic Methods
  async setItem(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  }

  async getItem(key: string): Promise<string | null> {
    return await AsyncStorage.getItem(key);
  }

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }

  async setObject(key: string, value: any): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  }

  async getObject(key: string): Promise<any | null> {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }
}

export default new AsyncStorageService();
