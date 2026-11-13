import { defineConfig } from 'drizzle-kit'

// `npm run db:generate` writes new SQL migrations from src/db/schema.ts.
export default defineConfig({
  schema: './src/db/schema.ts',
  out: './migrations',
  dialect: 'sqlite',
  driver: 'd1-http',
})
