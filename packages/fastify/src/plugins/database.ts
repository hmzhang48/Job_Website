import type { FastifyPluginAsync } from "fastify"
import fp from "fastify-plugin"
import { drizzle } from "drizzle-orm/postgres-js"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import type { Sql } from "postgres"
import { env } from "node:process"
import * as schema from "../lib/schema.ts"
declare module "fastify" {
  interface FastifyInstance {
    postgres: Sql
    drizzle: PostgresJsDatabase<typeof schema>
  }
}
const database: FastifyPluginAsync = fp( async ( f ) => {
  const client = postgres( <string> env[ "database" ] )
  f.decorate( "postgres", client )
  f.decorate( "drizzle", drizzle( client, { schema, logger: true } ) )
  f.addHook( "onClose", async () => {
    await client.end()
  } )
} )
export default database
