/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          // Jest needs CommonJS; the app itself is bundled by Next.
          module: 'commonjs',
          target: 'ES2017',
          esModuleInterop: true,
          resolveJsonModule: true,
          strict: true,
          skipLibCheck: true,
          // The app enables noUncheckedIndexedAccess, which makes many
          // legitimately-safe test assertions awkward to type. Keep the
          // source's strictness for the app, relax it for tests only.
          noUncheckedIndexedAccess: false,
        },
      },
    ],
  },
};
