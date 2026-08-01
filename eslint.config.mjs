import { FlatCompat } from '@eslint/eslintrc';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const filePath = fileURLToPath(import.meta.url);
const baseDirectory = path.dirname(filePath);
const compat = new FlatCompat({ baseDirectory });

const config = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: ['.next/**', 'node_modules/**', 'out/**', 'work/**', 'next-env.d.ts'],
  },
];

export default config;
