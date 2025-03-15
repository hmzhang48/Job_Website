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
const database: FastifyPluginCallback = fp(
  (f, _, done) => {
    const client = env['DB_URL']
      ? postgres(env['DB_URL'])
      : postgres({
        host: env['AZURE_POSTGRESQL_HOST']!,
        port: Number.parseInt(env['AZURE_POSTGRESQL_PORT']!),
        database: env['AZURE_POSTGRESQL_DATABASE']!,
        username: env['AZURE_POSTGRESQL_USER']!,
        password: env['AZURE_POSTGRESQL_PASSWORD']!,
        ssl: true,
      })
    f.decorate('postgres', client)
    f.decorate('drizzle', drizzle(client, { schema, logger: true }))
    f.addHook('onClose', async () => await client.end())
    done()
  }
)
export default database
