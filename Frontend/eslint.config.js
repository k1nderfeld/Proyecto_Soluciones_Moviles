const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*'],
  },
  {
    files: ['src/hooks/useApiResource.ts', 'src/hooks/usePaginatedList.ts'],
    rules: {
      'react-hooks/exhaustive-deps': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    files: ['src/context/TaxonomyContext.tsx'],
    rules: {
      'react-hooks/set-state-in-effect': 'off',
    },
  },
]);
