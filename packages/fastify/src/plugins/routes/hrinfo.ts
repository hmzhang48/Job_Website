import type { FastifyPluginAsync } from "fastify"
import fp from "fastify-plugin"
import type { JsonSchemaToTsProvider } from "@fastify/type-provider-json-schema-to-ts"
import type { JSONSchema } from "json-schema-to-ts"
import { eq } from "drizzle-orm"
import type { InferInsertModel } from "drizzle-orm"
import { hrInfo, corpInfo } from "../../lib/schema.ts"
const regexp =
  "^[0-9A-HJ-NPQRTUWXYa-hj-npqrtuwxy]{2}\\d{6}[0-9A-HJ-NPQRTUWXYa-hj-npqrtuwxy]{10}$"
const hrinfo: FastifyPluginAsync = fp( async ( f ) => {
  const server = f.withTypeProvider<JsonSchemaToTsProvider>()
  server.get(
    "/hrinfo",
    {
      schema: {
        response: {
          200: {
            type: "object",
            properties: {
              info: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  hrID: { type: "string" },
                  corpID: {
                    type: "string",
                    pattern: regexp
                  },
                  phone: {
                    type: "string",
                    pattern: "^\\d{11}$"
                  },
                  avatar: { type: "string" }
                },
                required: [ "name", "hrID", "corpID", "phone", "avatar" ],
                additionalProperties: false
              }
            },
            required: [ "info" ],
            additionalProperties: false
          } as const satisfies JSONSchema
        }
      }
    },
    async ( request, reply ) => {
      const info = await server.drizzle.query.hrInfo
        .findFirst( {
          columns: { uuid: false },
          where: eq( hrInfo.uuid, request.user.uuid )
        } ).catch( ( error ) => server.log.error( error ) )
      if ( info ) {
        reply.send( { info: info } )
      } else {
        reply.code( 404 ).send()
      }
    }
  )
  server.post(
    "/hrinfo",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            name: { type: "string" },
            hrID: { type: "string" },
            corpID: {
              type: "string",
              pattern: regexp
            },
            phone: {
              type: "string",
              pattern: "^\\d{11}$"
            },
            avatar: { type: "string" }
          },
          required: [ "name", "hrID", "corpID", "phone", "avatar" ],
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
      const info = await server.drizzle.query.corpInfo
        .findFirst( {
          columns: { corpID: true },
          where: eq( corpInfo.corpID, request.body.corpID )
        } ).catch( ( error ) => server.log.error( error ) )
      if ( info ) {
        const source: InferInsertModel<typeof hrInfo> = Object.create( null )
        source.uuid = request.user.uuid
        source.name = request.body.name
        source.hrID = request.body.hrID
        source.corpID = request.body.corpID
        source.phone = request.body.phone
        source.avatar = request.body.avatar
        const result = await server.drizzle
          .insert( hrInfo ).values( source )
          .then( () => true )
          .catch( ( error ) => server.log.error( error ) )
        reply.send( { result: !!result } )
      } else {
        reply.code( 404 ).send()
      }
    }
  )
  server.patch(
    "/hrinfo",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            phone: {
              type: "string",
              pattern: "^\\d{11}$"
            }
          },
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
      if ( request.body.phone ) {
        const result = await server.drizzle.update( hrInfo )
          .set( { phone: request.body.phone } )
          .where( eq( hrInfo.uuid, request.user.uuid ) )
          .then( () => true )
          .catch( ( error ) => server.log.error( error ) )
        reply.send( { result: !!result } )
      } else {
        reply.code( 400 ).send()
      }
    }
  )
} )
export default hrinfo
