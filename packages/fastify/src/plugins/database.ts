import type { FastifyPluginAsync } from "fastify"
import fp from "fastify-plugin"
import { drizzle } from 'drizzle-orm/postgres-js'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../lib/schema.ts'
declare module "fastify" {
  interface FastifyInstance {
    drizzle: PostgresJsDatabase<typeof schema>
  }
}
const drizzlePlugin: FastifyPluginAsync = fp( async ( f ) => {
  const client = postgres( "postgres://postgre:postgre@localhost:5432/postgre" )
  f.decorate( "drizzle", drizzle( client, { schema } ) )
  f.addHook( "onClose", () => {
    client.end()
  } )
} )
export default drizzlePlugin
