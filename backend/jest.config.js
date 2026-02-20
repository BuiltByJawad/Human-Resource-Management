module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/__tests__/**/*.test.ts'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
  ],
  coverageThreshold: {
    global: {
      branches: 1,
      functions: 1,
      lines: 20,
      statements: 20,
    },
  },
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  testTimeout: 30000
}