import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { env } from 'node:process'
const client = postgres(env['POSTGRESQL_URL'])
const database = drizzle(client, { logger: true })
await migrate(database, { migrationsFolder: './migrations' })
await client.end()
