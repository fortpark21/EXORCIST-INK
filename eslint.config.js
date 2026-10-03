import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/sim/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'phaser',
              message: 'src/sim must not import Phaser (simulation is renderer-agnostic).',
            },
          ],
          patterns: [
            {
              group: ['**/render/**', '**/bridge/**'],
              message: 'src/sim must not import render or bridge layers.',
            },
          ],
        },
      ],
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
  },
);
