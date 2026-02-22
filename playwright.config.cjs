const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: '.',
  testMatch: ['tests/**/*.spec.js', '__tests__/**/*.test.js'],
});
