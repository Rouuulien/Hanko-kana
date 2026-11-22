// ESLint : règles recommandées. Le jeu tourne dans le navigateur, les tests et scripts dans Node.
import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['dist/', 'dist-claude/', 'test-results/', 'playwright-report/', 'node_modules/'] },
  js.configs.recommended,
  {
    files: ['src/**/*.js', 'sw.js'],
    languageOptions: { globals: { ...globals.browser, ...globals.serviceworker, claude: 'readonly' } },
  },
  {
    files: ['tests/**/*.{js,mjs}', 'scripts/**/*.mjs', '*.config.js'],
    // Les fonctions passées à page.evaluate() s'exécutent dans le navigateur.
    languageOptions: { globals: { ...globals.node, ...globals.browser, __hanko: 'readonly' } },
  },
  { rules: { 'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }], 'no-empty': ['error', { allowEmptyCatch: true }] } },
];
