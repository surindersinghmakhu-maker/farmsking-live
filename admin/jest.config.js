module.exports = {
  preset: 'jest-expo',
  moduleDirectories: ['node_modules', '<rootDir>/../frontend/node_modules'],
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect', '<rootDir>/__tests__/setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
  ],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/e2e/',
    '<rootDir>/__tests__/setup.ts'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^react-native/setup-env$': '<rootDir>/__mocks__/setup-env.js'
  }
};
