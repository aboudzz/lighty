const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  },
  {
    files: ['__tests__/**/*.js', 'jest.setup.js'],
    languageOptions: {
      globals: {
        ...globals.jest,
        fail: 'readonly',
      },
    },
  },
  {
    ignores: ['node_modules/', 'coverage/', 'mailserver/'],
  },
];
