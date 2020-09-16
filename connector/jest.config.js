const packageName = require('./package.json').name.split('@1hive/').pop()

const baseConfig = {
  preset: 'ts-jest',
  testEnvironment: 'node',
}

module.exports = {
  ...baseConfig,
  roots: [`<rootDir>`],
  collectCoverageFrom: ['src/**/*.{ts,tsx}'],
  testRegex: `(.*/__tests__/.*|\\.(test|spec))\\.tsx?$`,
  modulePaths: [`<rootDir>/src/`],
  name: packageName,
  displayName: 'DISPUTABLE-DELAY',
  rootDir: '.',
}
