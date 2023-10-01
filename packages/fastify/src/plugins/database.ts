import type { FastifyPluginAsync } from "fastify"
import fp from "fastify-plugin"
import knex from "knex"
import type { Knex } from "knex"

declare module "fastify" {
  interface FastifyInstance {
    knex: Knex
  }
}

const knexPlugin: FastifyPluginAsync = fp( async ( f ) => {
  const config: Knex.Config = {
    client: "pg",
    connection: "postgresql://postgre:postgre@localhost:5432/postgre",
  }
  const knexInstance = knex( config )
  f.decorate( "knex", knexInstance )
  f.addHook( "onClose", ( f ) => {
    f.knex.destroy()
  } )
} )

export default knexPlugin
