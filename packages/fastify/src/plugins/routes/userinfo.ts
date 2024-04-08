import type { FastifyPluginAsync } from "fastify"
import fp from "fastify-plugin"
import type { JsonSchemaToTsProvider } from "@fastify/type-provider-json-schema-to-ts"
import type { JSONSchema } from "json-schema-to-ts"
import { eq } from "drizzle-orm"
import type { InferInsertModel } from "drizzle-orm"
import { userInfo } from "../../lib/schema.ts"
const idPattern = "^\\d{17}[0-9Xx]$"
const userinfo: FastifyPluginAsync = fp( async ( f ) => {
  const server = f.withTypeProvider<JsonSchemaToTsProvider>()
  server.get(
    "/userinfo",
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
                  id: {
                    type: "string",
                    pattern: idPattern
                  },
                  location: {
                    type: "string",
                    pattern: "^\\d{6}$"
                  },
                  phone: {
                    type: "string",
                    pattern: "^\\d{11}$"
                  },
                  avatar: { type: "string" },
                  cv: { type: "string" },
                  valid: { type: "boolean" }
                },
                required: [
                  "name",
                  "id",
                  "location",
                  "phone",
                  "avatar",
                  "cv",
                  "valid"
                ],
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
      const info = await server.drizzle.query.userInfo
        .findFirst( {
          columns: { uuid: false },
          where: eq( userInfo.uuid, request.user.uuid )
        } ).catch( ( error ) => server.log.error( error ) )
      if ( info ) {
        reply.send( { info: info } )
      } else {
        reply.code( 404 ).send()
      }
    }
  )
  server.post(
    "/userinfo",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            name: { type: "string" },
            id: {
              type: "string",
              pattern: idPattern
            },
            location: {
              type: "string",
              pattern: "^\\d{6}$"
            },
            phone: {
              type: "string",
              pattern: "^\\d{11}$"
            },
            avatar: { type: "string" }
          },
          required: [ "name", "id", "location", "phone", "avatar" ],
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
      const source: InferInsertModel<typeof userInfo> = Object.create( null )
      source.uuid = request.user.uuid
      source.name = request.body.name
      source.id = request.body.id
      source.location = request.body.location
      source.phone = request.body.phone
      source.avatar = request.body.avatar
      const result = await server.drizzle
        .insert( userInfo ).values( source )
        .then( () => true )
        .catch( ( error ) => server.log.error( error ) )
      reply.send( { result: !!result } )
    }
  )
  server.patch(
    "/userinfo",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            location: {
              type: "string",
              pattern: "^\\d{6}$"
            },
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
      const source: { location?: string; phone?: string } = Object.create( null )
      if ( request.body.location ) {
        source.location = request.body.location
      }
      if ( request.body.phone ) {
        source.phone = request.body.phone
      }
      if ( Object.keys( source ).length > 0 ) {
        const result = await server.drizzle
          .update( userInfo ).set( source )
          .where( eq( userInfo.uuid, request.user.uuid ) )
          .then( () => true )
          .catch( ( error ) => server.log.error( error ) )
        reply.send( { result: !!result } )
      } else {
        reply.code( 400 ).send()
      }
    }
  )
} )
export default userinfo
