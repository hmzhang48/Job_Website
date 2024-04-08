import type { FastifyPluginAsync } from "fastify"
import fp from "fastify-plugin"
import type { JsonSchemaToTsProvider } from "@fastify/type-provider-json-schema-to-ts"
import type { JSONSchema } from "json-schema-to-ts"
import crypto from "node:crypto"
import { eq } from "drizzle-orm"
import { users } from "../../lib/schema.ts"
const reset: FastifyPluginAsync = fp( async ( f ) => {
  const server = f.withTypeProvider<JsonSchemaToTsProvider>()
  server.patch(
    "/email-reset",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            email: {
              type: "string",
              format: "email"
            }
          },
          required: [ "email" ],
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
      const result = await server.drizzle.update( users )
        .set( { email: request.body.email } )
        .where( eq( users.uuid, request.user.uuid ) )
        .then( () => true )
        .catch( ( error ) => server.log.error( error ) )
      reply.send( { result: !!result } )
    }
  )
  server.patch(
    "/password-reset",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            oldPassword: {
              type: "string",
              minLength: 8,
              maxLength: 25
            },
            newPassword: {
              type: "string",
              minLength: 8,
              maxLength: 25
            }
          },
          required: [ "oldPassword", "newPassword" ],
          additionalProperties: false
        } as const satisfies JSONSchema,
        response: {
          200: {
            type: "object",
            properties: {
              result: { enum: [ "修改成功", "请重试", "密码错误" ] }
            },
            required: [ "result" ],
            additionalProperties: false
          } as const satisfies JSONSchema
        }
      }
    },
    async ( request, reply ) => {
      const user = await server.drizzle.query.users
        .findFirst( {
          columns: { password: true },
          where: eq( users.uuid, request.user.uuid )
        } ).catch( ( error ) => server.log.error( error ) )
      if ( user ) {
        const hash = crypto.createHash( "md5" )
        hash.update( request.body.oldPassword )
        if ( hash.digest( "hex" ) === user.password ) {
          const hash = crypto.createHash( "md5" )
          hash.update( request.body.newPassword )
          const password = hash.digest( "hex" )
          const result = await server.drizzle.update( users )
            .set( { password: password } )
            .where( eq( users.uuid, request.user.uuid ) )
            .then( () => true )
            .catch( ( error ) => server.log.error( error ) )
          if ( result ) {
            reply.send( { result: "修改成功" } )
          } else {
            reply.send( { result: "请重试" } )
          }
        } else {
          reply.send( { result: "密码错误" } )
        }
      } else {
        reply.code( 401 ).send()
      }
    }
  )
} )
export default reset
