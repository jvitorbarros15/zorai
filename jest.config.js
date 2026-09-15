const nextJest = require('next/jest');
module.exports = nextJest({ dir: './' })({
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  modulePathIgnorePatterns: ['<rootDir>/discovery/', '<rootDir>/.next/'],
});
