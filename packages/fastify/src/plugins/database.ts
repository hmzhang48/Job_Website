import type { FastifyPluginCallback } from 'fastify'
import fp from 'fastify-plugin'
import { drizzle } from 'drizzle-orm/postgres-js'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import type { Sql } from 'postgres'
import { env } from 'node:process'
import * as schema from '../lib/schema.ts'
declare module 'fastify' {
  interface FastifyInstance {
    postgres: Sql
    drizzle: PostgresJsDatabase<typeof schema>
  }
}
const database: FastifyPluginCallback = fp((f, _, done) => {
  const url = env['NODE_ENV'] === 'production'
    ? `postgres://${env['RDS_USERNAME']}:${env['RDS_PASSWORD']}@${env['RDS_HOSTNAME']}:${env['RDS_PORT']}/${env['RDS_DB_NAME']}`
    : `postgres://${env['PG_USERNAME']}:${env['PG_PASSWORD']}@${env['PG_HOSTNAME']}:${env['PG_PORT']}/${env['PG_DB_NAME']}`
  const client = postgres(url)
  f.decorate('postgres', client)
  f.decorate('drizzle', drizzle(client, { schema, logger: true }))
  f.addHook('onClose', async () => await client.end())
  done()
})
export default database
