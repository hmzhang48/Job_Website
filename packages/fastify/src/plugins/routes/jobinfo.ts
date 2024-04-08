import type { FastifyPluginAsync } from "fastify"
import fp from "fastify-plugin"
import type { JsonSchemaToTsProvider } from "@fastify/type-provider-json-schema-to-ts"
import type { JSONSchema } from "json-schema-to-ts"
import { eq, desc, and, not, like, arrayContains, sql } from "drizzle-orm"
import type { SQL, InferInsertModel } from "drizzle-orm"
import { userInfo, hrInfo, corpInfo, jobInfo } from "../../lib/schema.ts"
const corpIDPattern =
  "^[0-9A-HJ-NPQRTUWXYa-hj-npqrtuwxy]{2}\\d{6}[0-9A-HJ-NPQRTUWXYa-hj-npqrtuwxy]{10}$"
const salaryPattern = "^\\[[0-9]+(\\.[0-9]{1,3})?,[0-9]+(\\.[0-9]{1,3})?\\]$"
const jobinfo: FastifyPluginAsync = fp( async ( f ) => {
  const server = f.withTypeProvider<JsonSchemaToTsProvider>()
  server.get(
    "/jobinfo",
    {
      schema: {
        querystring: {
          type: "object",
          properties: {
            position: { type: "string" },
            type: { enum: [ "part-time", "full-time" ] },
            salary: {
              type: "string",
              pattern: "^\\d+$"
            },
            location: {
              type: "string",
              pattern: "^\\d{4}$"
            },
            logo: { type: "string" },
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
                    position: { type: "string" },
                    overview: { type: "string" },
                    type: { enum: [ "part-time", "full-time" ] },
                    salary: {
                      type: "string",
                      pattern: salaryPattern
                    },
                    location: {
                      type: "string",
                      pattern: "^\\d{6}$"
                    },
                    no: { type: "number" },
                    corpInfo: {
                      type: "object",
                      properties: {
                        corpName: { type: "string" },
                        logo: { type: "string" }
                      },
                      required: [ "corpName", "logo" ],
                      additionalProperties: false
                    }
                  },
                  required: [
                    "position",
                    "overview",
                    "type",
                    "salary",
                    "location",
                    "no",
                    "corpInfo"
                  ],
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
      const options: SQL[] = []
      if ( request.user.hr ) {
        const hr_info = await server.drizzle.query.hrInfo
          .findFirst( {
            columns: { corpID: true },
            where: eq( hrInfo.uuid, request.user.uuid )
          } ).catch( ( error ) => server.log.error( error ) )
        if ( hr_info ) {
          options.push( eq( jobInfo.corpID, hr_info.corpID ) )
        }
      } else {
        const user_info = await server.drizzle.query.userInfo
          .findFirst( {
            columns: {
              location: true,
              cv: true
            },
            where: eq( userInfo.uuid, request.user.uuid )
          } ).catch( ( error ) => server.log.error( error ) )
        if ( user_info ) {
          if ( user_info.cv ) {
            options.push( not( arrayContains( jobInfo.cvList, [ user_info.cv ] ) ) )
          }
          if ( request.query.position ) {
            options.push( like( jobInfo.position, `%${ request.query.position }%` ) )
          }
          if ( request.query.type ) {
            options.push( eq( jobInfo.type, request.query.type ) )
          }
          if ( request.query.salary ) {
            options.push(
              sql`jobinfo.salary @> ${ Number.parseInt( request.query.salary ) }`
            )
          }
          if ( request.query.location ) {
            let location = request.query.location
            if ( location === "0000" ) {
              location = user_info.location.slice( 0, 4 )
            }
            options.push( sql`starts_with( jobinfo.location, ${ location } )` )
          }
          if ( request.query.logo ) {
            const corp_info = await server.drizzle.query.corpInfo
              .findFirst( {
                columns: { corpID: true },
                where: eq( corpInfo.logo, request.query.logo )
              } ).catch( ( error ) => server.log.error( error ) )
            if ( corp_info ) {
              options.push( eq( jobInfo.corpID, corp_info.corpID ) )
            }
          }
        }
      }
      if ( options.length > 0 || request.query.offset !== undefined ) {
        const jobList = await server.drizzle.query.jobInfo
          .findMany( {
            columns: {
              corpID: false,
              cvList: false
            },
            with: {
              corpInfo: {
                columns: {
                  corpName: true,
                  logo: true
                }
              }
            },
            where: and( ...options ),
            orderBy: desc( jobInfo.no ),
            limit: request.query.limit,
            offset: request.query.offset
          } ).then( ( list ) =>
            list.map( ( l ) => {
              l.salary = l.salary.slice( 1, -1 ).replace( ",", "~" )
              return l
            } )
          ).catch( ( error ) => server.log.error( error ) )
        reply.send( { list: jobList ?? [] } )
      } else {
        reply.code( 400 ).send()
      }
    }
  )
  server.post(
    "/jobinfo",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            position: { type: "string" },
            overview: { type: "string" },
            type: { enum: [ "part-time", "full-time" ] },
            salary: {
              type: "string",
              pattern: salaryPattern
            },
            location: {
              type: "string",
              pattern: "^\\d{6}$"
            }
          },
          required: [ "position", "overview", "type", "salary", "location" ],
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
      const info = await server.drizzle.query.hrInfo
        .findFirst( {
          columns: { corpID: true },
          where: eq( hrInfo.uuid, request.user.uuid )
        } ).catch( ( error ) => server.log.error( error ) )
      if ( info ) {
        const source: InferInsertModel<typeof jobInfo> = Object.create( null )
        source.position = request.body.position
        source.overview = request.body.overview
        source.type = request.body.type
        source.salary = request.body.salary
        source.location = request.body.location
        source.corpID = info.corpID
        const result = await server.drizzle
          .insert( jobInfo ).values( source )
          .then( () => true )
          .catch( ( error ) => server.log.error( error ) )
        reply.send( { result: !!result } )
      } else {
        reply.code( 401 ).send()
      }
    }
  )
  server.patch(
    "/jobinfo",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            position: { type: "string" },
            overview: { type: "string" },
            type: { enum: [ "part-time", "full-time" ] },
            salary: {
              type: "string",
              pattern: salaryPattern
            },
            location: {
              type: "string",
              pattern: "^\\d{6}$"
            },
            corpID: {
              type: "string",
              pattern: corpIDPattern
            },
            no: { type: "number" }
          },
          required: [ "corpID", "no" ],
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
      const info = await server.drizzle.query.hrInfo
        .findFirst( {
          columns: { corpID: true },
          where: eq( hrInfo.uuid, request.user.uuid )
        } ).catch( ( error ) => server.log.error( error ) )
      if ( info?.corpID === request.body.corpID ) {
        const source: Partial<
          Omit<InferInsertModel<typeof jobInfo>, "corpID" | "cvList" | "no">
        > = Object.create( null )
        if ( request.body.position ) {
          source.position = request.body.position
        }
        if ( request.body.overview ) {
          source.overview = request.body.overview
        }
        if ( request.body.type ) {
          source.type = request.body.type
        }
        if ( request.body.salary ) {
          source.salary = request.body.salary
        }
        if ( request.body.location ) {
          source.location = request.body.location
        }
        if ( Object.keys( source ).length > 0 ) {
          const result = await server.drizzle
            .update( jobInfo ).set( source )
            .where( eq( jobInfo.no, request.body.no ) )
            .then( () => true )
            .catch( ( error ) => server.log.error( error ) )
          reply.send( { result: !!result } )
        } else {
          reply.code( 400 ).send()
        }
      } else {
        reply.code( 401 ).send()
      }
    }
  )
  server.delete(
    "/jobinfo",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            corpID: {
              type: "string",
              pattern: corpIDPattern
            },
            no: { type: "number" }
          },
          required: [ "corpID", "no" ],
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
      const info = await server.drizzle.query.hrInfo
        .findFirst( {
          columns: { corpID: true },
          where: eq( hrInfo.uuid, request.user.uuid )
        } ).catch( ( error ) => server.log.error( error ) )
      if ( info?.corpID === request.body.corpID ) {
        const result = await server.drizzle.delete( jobInfo )
          .where( eq( jobInfo.no, request.body.no ) )
          .then( () => true )
          .catch( ( error ) => server.log.error( error ) )
        reply.send( { result: !!result } )
      } else {
        reply.code( 401 ).send()
      }
    }
  )
} )
export default jobinfo
