module.exports = {
    ...require('@ackee/styleguide-backend-config/eslint'),
    ignorePatterns: ['dist'],
    parserOptions: {
      project: '.eslint.tsconfig.json',
    },
    rules: {
      ...require('@ackee/styleguide-backend-config/eslint').rules,
      'sonarjs/no-identical-functions': 1,
      '@typescript-eslint/prefer-nullish-coalescing': 1,
    },
  }
  