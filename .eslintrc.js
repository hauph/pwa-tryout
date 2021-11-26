const fs = require('fs');
const path = require('path');

const isProduction = process.env.ENV === 'production';
const prettierOptions = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '.prettierrc'), 'utf8'),
);

module.exports = {
  root: true,
  env: {
    browser: true,
    jquery: true,
    commonjs: true,
    es6: true,
  },
  extends: ['airbnb-base', 'prettier'],
  plugins: ['prettier', 'html'],
  rules: {
    'prettier/prettier': ['error', prettierOptions],
    'no-console': 'off',
    'no-debugger': isProduction ? 'error' : 'off',
    'no-unused-vars': 'off',
    'eol-last': 'off',
    'linebreak-style': 'off',
    'no-param-reassign': 'off',
    'no-script-url': 'off',
    'no-return-assign': 'off',
    'no-multi-assign': 'off',
    'no-template-curly-in-string': 'off',
    'no-plusplus': 'off',
    'global-require': 'off',
    'no-webpack-loader-syntax': 'off',
    'import/prefer-default-export': 'off',
    'prefer-promise-reject-errors': 'off',
    'class-methods-use-this': 'off',
    radix: 'off',
    'no-shadow': 'off',
    'prefer-destructuring': 'off',
    'func-names': 'off',
    'arrow-body-style': 'off',
    'no-restricted-globals': 'off',
    'no-underscore-dangle': 'off',
    'function-paren-newline': 'off',
    'no-throw-literal': 'off',
    camelcase: 'off',
    'no-empty': ['error', { allowEmptyCatch: true }],
    'max-len': ['error', { code: 300 }],
    'import/extensions': 'off',
    'import/no-unresolved': 'off',
  },
  settings: {
    'import/resolver': 'webpack',
  },
  parser: 'babel-eslint',
  parserOptions: {
    sourceType: 'module',
    allowImportExportEverywhere: true,
  },
  globals: {
    $: true,
    jquery: true,
    console: true,
  },
};
