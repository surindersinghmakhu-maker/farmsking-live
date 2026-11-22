import '@testing-library/jest-native/extend-expect';

// Mock AsyncStorage in-memory
const mockStorage: Record<string, string> = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn((k: string, v: string) => Promise.resolve(mockStorage[k] = v)),
  getItem: jest.fn((k: string) => Promise.resolve(mockStorage[k] || null)),
  removeItem: jest.fn((k: string) => { delete mockStorage[k]; return Promise.resolve(); }),
  clear: jest.fn(() => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); return Promise.resolve(); }),
  getAllKeys: jest.fn(() => Promise.resolve(Object.keys(mockStorage))),
}), { virtual: true });

// Mock Expo SecureStore
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock Expo Router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/',
  useSegments: () => [],
}));

// Mock API Client to avoid real network requests during unit tests
jest.mock('@/src/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));
