import type { FastifyPluginAsync } from "fastify"
import fp from "fastify-plugin"
import type { JsonSchemaToTsProvider } from "@fastify/type-provider-json-schema-to-ts"
import type { JSONSchema } from "json-schema-to-ts"
import { eq, desc, and } from "drizzle-orm"
import { infoBox } from "../../lib/schema.ts"
const infobox: FastifyPluginAsync = fp( async ( f ) => {
  const server = f.withTypeProvider<
    JsonSchemaToTsProvider<{
      deserialize: [
        {
          pattern: {
            type: "string"
            format: "date-time"
          }
          output: Date
        }
      ]
    }>
  >()
  server.get(
    "/infobox",
    {
      schema: {
        querystring: {
          type: "object",
          properties: {
            offset: { type: "number" },
            limit: { type: "number" }
          },
          required: [ "offset", "limit" ],
          additionalProperties: false
        } as const satisfies JSONSchema,
        response: {
          200: {
            type: "object",
            properties: {
              list: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    info: { type: "string" },
                    read: { type: "boolean" },
                    time: {
                      type: "string",
                      format: "date-time"
                    },
                    no: {
                      type: "number",
                      minimum: 1
                    }
                  },
                  required: [ "info", "read", "time", "no" ],
                  additionalProperties: false
                }
              }
            },
            required: [ "list" ],
            additionalProperties: false
          } as const satisfies JSONSchema
        }
      }
    },
    async ( request, reply ) => {
      const list = await server.drizzle.query.infoBox
        .findMany( {
          columns: { uuid: false },
          where: eq( infoBox.uuid, request.user.uuid ),
          orderBy: [ desc( infoBox.no ) ],
          limit: request.query.limit,
          offset: request.query.offset
        } ).catch( ( error ) => server.log.error( error ) )
      reply.send( { list: list ?? [] } )
    }
  )
  server.get(
    "/infobox/:action",
    {
      schema: {
        params: {
          type: "object",
          properties: { action: { enum: [ "read", "remove" ] } },
          required: [ "action" ],
          additionalProperties: false
        } as const satisfies JSONSchema,
        querystring: {
          type: "object",
          properties: { no: { type: "number" } },
          required: [ "no" ],
          additionalProperties: false
        } as const satisfies JSONSchema,
        response: {
          200: {
            type: "object",
            properties: { result: { type: "boolean" } },
            required: [ "result" ],
            additionalProperties: false
          } as const satisfies JSONSchema
        }
      }
    },
    async ( request, reply ) => {
      const options = and(
        eq( infoBox.uuid, request.user.uuid ),
        eq( infoBox.no, request.query.no )
      )
      let result
      switch ( request.params.action ) {
        case "read": {
          result = await server.drizzle.update( infoBox )
            .set( { read: true } ).where( options )
            .then( () => true )
            .catch( ( error ) => server.log.error( error ) )
          break
        }
        case "remove": {
          result = await server.drizzle.delete( infoBox )
            .where( options )
            .then( () => true )
            .catch( ( error ) => server.log.error( error ) )
          break
        }
      }
      reply.send( { result: !!result } )
    }
  )
} )
export default infobox
