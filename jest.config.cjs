/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  moduleFileExtensions: ['js', 'jsx', 'mjs', 'ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^~~/(.*)$': '<rootDir>/$1'
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: './tsconfig.test.json', diagnostics: false }],
    '^.+\\.(js|jsx|mjs)$': 'babel-jest',
    '.+\\.(css|scss|png|jpg|svg)$': 'jest-transform-stub'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(h3|ofetch|defu|destr|ufo|scule|uncrypto|hookable|unctx|unenv))'
  ],
  setupFiles: ['./test-utils/global-test-utils-config.ts']
}
