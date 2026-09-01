import { createMMKV } from 'react-native-mmkv';
import type { Storage } from 'redux-persist';

const storage = createMMKV();



export const reduxMmkvStorage: Storage = {
  setItem: (key: string, value: string) => {
    try {
      storage.set(key, value);
      return Promise.resolve(true);
    } catch (error) {
      console.error('MMKV setItem error:', error);
      return Promise.reject(error);
    }
  },

  getItem: (key: string) => {
    try {
      const value = storage.getString(key);
      return Promise.resolve(value ?? null);
    } catch (error) {
      console.error('MMKV getItem error:', error);
      return Promise.reject(error);
    }
  },

  removeItem: (key: string) => {
    try {
      storage.remove(key);
      return Promise.resolve();
    } catch (error) {
      console.error('MMKV removeItem error:', error);
      return Promise.reject(error);
    }
  },
};