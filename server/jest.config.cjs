/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@server/(.*)\\.js$': '<rootDir>/src/$1.ts',
    '^@server/(.*)$': '<rootDir>/src/$1',
    '^@shared/(.*)\\.js$': '<rootDir>/../shared/src/$1.ts',
    '^@shared/(.*)$': '<rootDir>/../shared/src/$1',
    '^@shared$': '<rootDir>/../shared/src/api/index.ts',
    '^(\\.{1,2}/.+)\\.js$': '$1',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json',
      diagnostics: { ignoreCodes: [2823] },
    }],
  },
}
