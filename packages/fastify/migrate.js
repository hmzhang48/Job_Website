import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { env } from 'node:process'
const url = env['NODE_ENV'] === 'production'
  ? `postgres://${env['RDS_USERNAME']}:${env['RDS_PASSWORD']}@${env['RDS_HOSTNAME']}:${env['RDS_PORT']}/${env['RDS_DB_NAME']}`
  : `postgres://${env['PG_USERNAME']}:${env['PG_PASSWORD']}@${env['PG_HOSTNAME']}:${env['PG_PORT']}/${env['PG_DB_NAME']}`
const client = postgres(url, { max: 1 })
const database = drizzle(client, { logger: true })
await migrate(database, { migrationsFolder: './migrations' })
await client.end()
