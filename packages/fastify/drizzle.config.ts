import { env } from 'node:process'
import { defineConfig } from 'drizzle-kit'
export default defineConfig({
  dialect: "postgresql",
  dbCredentials: env['DB_URL']
    ? { url: env['DB_URL'] }
    : {
      host: env['AZURE_POSTGRESQL_HOST']!,
      port: Number.parseInt(env['AZURE_POSTGRESQL_PORT']!),
      database: env['AZURE_POSTGRESQL_DATABASE']!,
      user: env['AZURE_POSTGRESQL_USER']!,
      password: env['AZURE_POSTGRESQL_PASSWORD']!,
      ssl: true,
    },
  schema: "./src/lib/schema.*",
  out: "./migrations"
})