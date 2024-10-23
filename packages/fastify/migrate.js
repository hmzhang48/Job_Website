import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { env } from 'node:process'
const client = env['POSTGRESQL_URL']
  ? postgres(env['POSTGRESQL_URL'])
  : postgres({
    host: env['AZURE_POSTGRESQL_HOST'],
    port: Number.parseInt(env['AZURE_POSTGRESQL_PORT']),
    database: env['AZURE_POSTGRESQL_DATABASE'],
    username: env['AZURE_POSTGRESQL_USER'],
    password: env['AZURE_POSTGRESQL_PASSWORD'],
    ssl: true,
  })
const database = drizzle(client, { logger: true })
await migrate(database, { migrationsFolder: './migrations' })
await client.end()
