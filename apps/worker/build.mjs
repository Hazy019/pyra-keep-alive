import { build } from 'esbuild'

await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  outfile: 'dist/index.js',
  external: [
    'bullmq',
    'drizzle-orm',
    'drizzle-orm/*',
    'fastify',
    'ioredis',
    'pg',
    'undici',
    'zod',
  ],
})
