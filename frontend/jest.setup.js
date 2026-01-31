require('@testing-library/jest-dom')

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/'
    }
  },
  usePathname() {
    return '/'
  },
  useSearchParams() {
    return new URLSearchParams()
  }
}))

// Mock fetch
global.fetch = jest.fn()

// Mock ResizeObserver for components relying on it (e.g. headlessui)
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn()
}