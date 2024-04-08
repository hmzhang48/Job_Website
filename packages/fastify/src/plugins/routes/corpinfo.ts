import type { FastifyPluginAsync } from "fastify"
import fp from "fastify-plugin"
import type { JsonSchemaToTsProvider } from "@fastify/type-provider-json-schema-to-ts"
import type { JSONSchema } from "json-schema-to-ts"
import { eq } from "drizzle-orm"
import type { InferInsertModel } from "drizzle-orm"
import { hrInfo, corpInfo } from "../../lib/schema.ts"
const corpIDpattern =
  "^[0-9A-HJ-NPQRTUWXYa-hj-npqrtuwxy]{2}\\d{6}[0-9A-HJ-NPQRTUWXYa-hj-npqrtuwxy]{10}$"
const corpinfo: FastifyPluginAsync = fp( async ( f ) => {
  const server = f.withTypeProvider<JsonSchemaToTsProvider>()
  server.get(
    "/corp-check",
    {
      schema: {
        querystring: {
          type: "object",
          properties: {
            corpid: {
              type: "string",
              pattern: corpIDpattern
            }
          },
          required: [ "corpid" ],
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
          where: eq( corpInfo.corpID, request.query.corpid )
        } ).catch( ( error ) => server.log.error( error ) )
      reply.send( { result: info ? true : false } )
    }
  )
  server.get(
    "/corpinfo",
    {
      schema: {
        querystring: {
          type: "object",
          properties: {
            logo: { type: "string" }
          },
          additionalProperties: false
        } as const satisfies JSONSchema,
        response: {
          200: {
            type: "object",
            properties: {
              info: {
                type: "object",
                properties: {
                  corpName: { type: "string" },
                  brief: { type: "string" },
                  logo: { type: "string" },
                  chiefHR: { type: "string" },
                  valid: { type: "boolean" },
                  hrList: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        hrID: { type: "string" }
                      },
                      required: [ "name", "hrID" ],
                      additionalProperties: false
                    }
                  }
                },
                required: [ "corpName", "brief", "logo" ],
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
      if ( request.query.logo ) {
        const info = await server.drizzle.query.corpInfo
          .findFirst( {
            columns: {
              corpName: true,
              brief: true,
              logo: true
            },
            where: eq( corpInfo.logo, request.query.logo )
          } ).catch( ( error ) => server.log.error( error ) )
        if ( info ) {
          reply.send( { info: info } )
        } else {
          reply.code( 404 ).send()
        }
      } else {
        const hr_info = await server.drizzle.query.hrInfo
          .findFirst( {
            columns: {
              hrID: true,
              corpID: true
            },
            where: eq( hrInfo.uuid, request.user.uuid )
          } ).catch( ( error ) => server.log.error( error ) )
        if ( hr_info ) {
          const corp_info = await server.drizzle.query.corpInfo
            .findFirst( {
              columns: { corpID: false },
              with: {
                hrList: {
                  columns: {
                    name: true,
                    hrID: true
                  }
                }
              },
              where: eq( corpInfo.corpID, hr_info.corpID )
            } ).catch( ( error ) => server.log.error( error ) )
          if ( corp_info ) {
            corp_info.hrList = corp_info.chiefHR === hr_info.hrID
              ? corp_info.hrList.filter(
                ( info ) => info.hrID !== hr_info.hrID
              ) : []
            reply.send( { info: corp_info } )
          } else {
            reply.code( 404 ).send()
          }
        } else {
          reply.code( 401 ).send()
        }
      }
    }
  )
  server.post(
    "/corpinfo",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            corpName: { type: "string" },
            corpID: {
              type: "string",
              pattern: corpIDpattern
            },
            brief: { type: "string" },
            chiefHR: { type: "string" },
            logo: { type: "string" }
          },
          required: [ "corpName", "corpID", "brief", "chiefHR", "logo" ],
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
      const source: InferInsertModel<typeof corpInfo> = Object.create( null )
      source.corpName = request.body.corpName
      source.corpID = request.body.corpID
      source.brief = request.body.brief
      source.chiefHR = request.body.chiefHR
      source.logo = request.body.logo
      const result = await server.drizzle
        .insert( corpInfo ).values( source )
        .then( () => true )
        .catch( ( error ) => server.log.error( error ) )
      reply.send( { result: !!result } )
    }
  )
} )
export default corpinfo
