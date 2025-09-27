import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'public/**',
      'next-env.d.ts',
    ],
  },
  {
    rules: {
      // Reduce CI noise; adjust to ["warn", { allow: ["warn", "error"] }] if preferred
      'no-console': 'off',
    },
  },
  {
    files: [
      'src/components/editor/QuillWrapper.tsx',
      'src/lib/gtag.ts',
      'src/utils/fileParsers.ts',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
    },
  },
];

export default eslintConfig;
