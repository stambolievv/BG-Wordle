import stylistic from '@stylistic/eslint-plugin';

export default [
  stylistic.configs.customize({
    braceStyle: '1tbs',
    commaDangle: 'only-multiline',
    semi: true,
    severity: 'warn',
  }),
  {
    rules: {
      '@stylistic/quote-props': 'off',
      'curly': ['warn', 'multi-line'],
      'eqeqeq': ['warn', 'always', { null: 'ignore' }],
      'no-unreachable-loop': ['error', { ignore: [] }],
      'no-unused-vars': ['warn', {
        args: 'none',
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
        ignoreRestSiblings: true,
      }],
      'no-var': 'error',
      'one-var': ['warn', 'never'],
      'prefer-const': ['warn', { destructuring: 'all' }],
      'valid-typeof': ['error', { requireStringLiterals: true }],
    }
  }
];
