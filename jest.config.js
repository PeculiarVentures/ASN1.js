const NODE_OPTIONS = process.env.NODE_OPTIONS || '';

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transformIgnorePatterns: ['<rootDir>/node_modules/'],
  testMatch: ['<rootDir>/test/**/*.ts'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    '<rootDir>/src/**/*.ts',
    '!<rootDir>/src/**/*.d.ts'
  ]
};
