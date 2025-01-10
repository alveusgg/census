import tseslint from 'typescript-eslint';
import noNativeError from './lint/no-native-error.js';

/** @type {import('eslint').Linter.Config[]} */
export default tseslint.config(...tseslint.configs.recommended, ...tseslint.configs.recommendedTypeChecked, {
  languageOptions: {
    parserOptions: {
      projectService: true,
      project: './tsconfig.json',
      tsconfigRootDir: '.'
    }
  },
  plugins: {
    'census-custom': {
      rules: {
        'no-native-error': noNativeError
      }
    }
  },
  rules: {
    'census-custom/no-native-error': 'error',
    '@typescript-eslint/no-unsafe-argument': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/require-await': 'off',
    '@typescript-eslint/no-misused-promises': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }
    ]
  }
});
