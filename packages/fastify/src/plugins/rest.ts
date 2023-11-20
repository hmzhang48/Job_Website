import type { FastifyPluginAsync } from "fastify"
import fp from "fastify-plugin"
import type { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts'
import type { JSONSchema } from "json-schema-to-ts"
import crypto from "node:crypto"
import random from "crypto-random-string"
import { eq, desc, and, not, like, arrayContains, inArray, sql } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { users, userInfo, hrInfo, corpInfo, jobInfo, infoBox } from "../lib/schema"
const regexp = "^[0-9A-HJ-NPQRTUWXYa-hj-npqrtuwxy]{2}\\d{6}[0-9A-HJ-NPQRTUWXYa-hj-npqrtuwxy]{10}$"
const restPlugin: FastifyPluginAsync = fp( async ( f ) => {
  const server = f.withTypeProvider<JsonSchemaToTsProvider<{
    deserialize: [ {
      pattern: {
        type: "string"
        format: "date-time"
      }
      output: Date
    } ]
  }>>()
  server.get( "/email-check",
    {
      schema: {
        querystring: {
          type: 'object',
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
            type: 'object',
            properties: { result: { type: "boolean" } },
            required: [ "result" ],
            additionalProperties: false
          } as const satisfies JSONSchema
        }
      }
    },
    async ( request, reply ) => {
      const user = await server.drizzle.query.users.findFirst( {
        columns: {},
        where: eq( users.email, request.query.email )
      } ).catch( ( error ) => {
        server.log.error( error )
      } )
      reply.send( { result: user ? true : false } )
    }
  )
  server.get( "/email-validate",
    {
      schema: {
        querystring: {
          type: 'object',
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
            type: 'object',
            properties: { result: { type: "string" } },
            required: [ "result" ],
            additionalProperties: false
          } as const satisfies JSONSchema
        }
      }
    },
    async ( request, reply ) => {
      const address = request.query.email
      const code = random( { length: 10 } )
      const message = {
        from: "Haomin Zhang <zhanghaomin@ethereal.email>",
        to: address,
        subject: "验证码",
        html: "<p>" + code + "</p>",
      }
      let result: boolean
      result = await server.mail.verify()
        .then( () => true )
        .catch( ( error ) => {
          server.log.error( error )
          return false
        } )
      if ( result && server.mail.isIdle() ) {
        result = await server.mail.sendMail( message )
          .then( () => true )
          .catch( ( error ) => {
            server.log.error( error )
            return false
          } )
      }
      reply.send( { result: result ? code : "" } )
    }
  )
  server.get( "/phone-validate",
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            phone: {
              type: "string",
              pattern: "^\\d{11}$"
            }
          },
          required: [ "phone" ],
          additionalProperties: false
        } as const satisfies JSONSchema,
        response: {
          200: {
            type: 'object',
            properties: { result: { type: "string" } },
            required: [ "result" ],
            additionalProperties: false
          } as const satisfies JSONSchema
        }
      }
    },
    async ( request, reply ) => {
      const phone = request.query.phone
      server.log.info( phone )
      const code = random( { length: 10 } )
      reply.send( { result: code } )
    }
  )
  server.post( "/register",
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            email: {
              type: "string",
              format: "email"
            },
            password: {
              type: "string",
              minLength: 8,
              maxLength: 25
            },
            hr: { type: "boolean" }
          },
          required: [ "email", "password", "hr" ],
          additionalProperties: false
        } as const satisfies JSONSchema,
        response: {
          200: {
            type: 'object',
            properties: { result: { type: "boolean" } },
            required: [ "result" ],
            additionalProperties: false
          } as const satisfies JSONSchema
        }
      }
    },
    async ( request, reply ) => {
      const uuid = crypto.randomUUID()
      const hash = crypto.createHash( "md5" )
      hash.update( request.body.password )
      const password = hash.digest( "hex" )
      const source: typeof users.$inferInsert = Object.create( null )
      source.uuid = uuid
      source.email = request.body.email
      source.password = password
      source.hr = request.body.hr
      const result = await server.drizzle.insert( users ).values( source )
        .then( () => true )
        .catch( ( error ) => {
          server.log.error( error )
          return false
        } )
      if ( result ) {
        const token = await reply.jwtSign(
          JSON.stringify( {
            uuid: uuid,
            hr: request.body.hr
          } ) )
        reply.setCookie(
          "jwt", token, {
          path: "/",
          httpOnly: true,
          sameSite: true,
          signed: true
        } )
      }
      reply.send( { result: result } )
    }
  )
  server.patch( "/email-reset",
    {
      schema: {
        body: {
          type: 'object',
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
            type: 'object',
            properties: { result: { type: "boolean" } },
            required: [ "result" ],
            additionalProperties: false
          } as const satisfies JSONSchema
        }
      }
    },
    async ( request, reply ) => {

      const result = await server.drizzle.update( users )
        .set( { email: request.body.email } ).where( eq( users.uuid, request.user.uuid ) )
        .then( () => true )
        .catch( ( error ) => {
          server.log.error( error )
          return false
        } )
      reply.send( { result: result } )
    }
  )
  server.patch( "/password-reset",
    {
      schema: {
        body: {
          type: 'object',
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
            type: 'object',
            properties: { result: { enum: [ "修改成功", "请重试", "密码错误" ] } },
            required: [ "result" ],
            additionalProperties: false
          } as const satisfies JSONSchema
        }
      }
    },
    async ( request, reply ) => {
      const user = await server.drizzle.query.users.findFirst( {
        columns: { password: true },
        where: eq( users.uuid, request.user.uuid )
      } ).catch( ( error ) => {
        server.log.error( error )
      } )
      if ( user ) {
        const hash = crypto.createHash( "md5" )
        hash.update( request.body.oldPassword )
        if ( hash.digest( "hex" ) === user.password ) {
          const hash = crypto.createHash( "md5" )
          hash.update( request.body.newPassword )
          const password = hash.digest( "hex" )
          const result = await server.drizzle.update( users )
            .set( { password: password } ).where( eq( users.uuid, request.user.uuid ) )
            .then( () => true )
            .catch( ( error ) => {
              server.log.error( error )
              return false
            } )
          if ( result ) {
            reply.send( { result: "修改成功" } )
          } else {
            reply.send( { result: "请重试" } )
          }
        } else {
          reply.send( { result: "密码错误" } )
        }
      } else {
        reply.code( 403 ).send()
      }
    }
  )
  server.post( "/login",
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            email: {
              type: "string",
              format: "email"
            },
            password: {
              type: "string",
              minLength: 8,
              maxLength: 25
            }
          },
          required: [ "email", "password" ],
          additionalProperties: false
        } as const satisfies JSONSchema,
        response: {
          200: {
            type: 'object',
            properties: {
              result: { type: "boolean" },
              hr: { type: "boolean" }
            },
            required: [ "result" ],
            additionalProperties: false
          } as const satisfies JSONSchema
        }
      }
    },
    async ( request, reply ) => {
      const user = await server.drizzle.query.users.findFirst( {
        columns: { email: false },
        where: eq( users.email, request.body.email )
      } ).catch( ( error ) => {
        server.log.error( error )
      } )
      if ( user ) {
        const hash = crypto.createHash( "md5" )
        hash.update( request.body.password )
        const password = hash.digest( "hex" )
        if ( password === user.password ) {
          const token = await reply.jwtSign(
            JSON.stringify( {
              uuid: user.uuid,
              hr: user.hr
            } ) )
          reply.setCookie(
            "jwt", token, {
            path: "/",
            httpOnly: true,
            sameSite: true,
            signed: true
          } ).send( {
            result: true,
            hr: user.hr
          } )
        } else {
          reply.send( { result: false } )
        }
      } else {
        reply.code( 304 ).send()
      }
    }
  )
  server.get( "/logout",
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: { result: { type: "boolean" } },
            required: [ "result" ],
            additionalProperties: false
          } as const satisfies JSONSchema
        }
      }
    },
    async ( _request, reply ) => {
      reply.clearCookie( "jwt", { path: "/" } )
        .send( { result: true } )
    }
  )
  server.get( '/guide',
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              user: { type: "boolean" },
              hr: { type: "boolean" },
              guide: { type: "boolean" }
            },
            required: [ "hr", "guide" ],
            additionalProperties: false
          } as const satisfies JSONSchema
        }
      }
    },
    async ( request, reply ) => {
      const info = await ( (
        request.user.hr ?
          server.drizzle.query.hrInfo.findFirst( {
            columns: {},
            where: eq( hrInfo.uuid, request.user.uuid )
          } ) :
          server.drizzle.query.userInfo.findFirst( {
            columns: {},
            where: eq( userInfo.uuid, request.user.uuid )
          } )
      ).catch( ( error ) => {
        server.log.error( error )
      } ) )
      reply.send( {
        hr: request.user.hr,
        guide: info ? true : false
      } )
    }
  )
  server.get( "/userinfo",
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              info: {
                type: 'object',
                properties: {
                  name: { type: "string" },
                  id: {
                    type: "string",
                    pattern: "^\\d{17}[0-9Xx]$"
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
                  "name", "id", "location", "phone", "avatar", "cv", "valid"
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
      const info = await server.drizzle.query.userInfo.findFirst( {
        columns: { uuid: false },
        where: eq( userInfo.uuid, request.user.uuid )
      } ).catch( ( error ) => {
        server.log.error( error )
      } )
      if ( info ) {
        reply.send( { info: info } )
      } else {
        reply.code( 404 ).send()
      }
    }
  )
  server.post( "/userinfo",
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            name: { type: "string" },
            id: {
              type: "string",
              pattern: "^\\d{17}[0-9Xx]$"
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
          },
          required: [ "name", "id", "location", "phone", "avatar" ],
          additionalProperties: false
        } as const satisfies JSONSchema,
        response: {
          200: {
            type: 'object',
            properties: { result: { type: "boolean" } },
            required: [ "result" ],
            additionalProperties: false
          } as const satisfies JSONSchema
        }
      }
    },
    async ( request, reply ) => {
      const source: typeof userInfo.$inferInsert = Object.create( null )
      source.uuid = request.user.uuid
      source.name = request.body.name
      source.id = request.body.id
      source.location = request.body.location
      source.phone = request.body.phone
      source.avatar = request.body.avatar
      const result = await server.drizzle.insert( userInfo ).values( source )
        .then( () => true )
        .catch( ( error ) => {
          server.log.error( error )
          return false
        } )
      reply.send( { result: result } )
    },
  )
  server.patch( "/userinfo",
    {
      schema: {
        body: {
          type: 'object',
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
            type: 'object',
            properties: { result: { type: "boolean" } },
            required: [ "result" ],
            additionalProperties: false
          } as const satisfies JSONSchema
        }
      }
    },
    async ( request, reply ) => {
      const source: { location?: string, phone?: string } = Object.create( null )
      if ( request.body.location ) {
        source.location = request.body.location
      }
      if ( request.body.phone ) {
        source.phone = request.body.phone
      }
      if ( Object.keys( source ).length > 0 ) {
        const result = await server.drizzle.update( userInfo )
          .set( source ).where( eq( userInfo.uuid, request.user.uuid ) )
          .then( () => true )
          .catch( ( error ) => {
            server.log.error( error )
            return false
          } )
        reply.send( { result: result } )
      } else {
        reply.code( 401 ).send()
      }
    }
  )
  server.get( "/corp-check",
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            corpid: {
              type: "string",
              pattern: regexp
            }
          },
          required: [ "corpid" ],
          additionalProperties: false
        } as const satisfies JSONSchema,
        response: {
          200: {
            type: 'object',
            properties: { result: { type: "boolean" } },
            required: [ "result" ],
            additionalProperties: false
          } as const satisfies JSONSchema
        }
      }
    },
    async ( request, reply ) => {
      const info = await server.drizzle.query.corpInfo.findFirst( {
        columns: {},
        where: eq( corpInfo.corpID, request.query.corpid )
      } ).catch( ( error ) => {
        server.log.error( error )
      } )
      reply.send( { result: info ? true : false } )
    }
  )
  server.get( "/hrinfo",
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              info: {
                type: 'object',
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
                required: [
                  "name", "hrID", "corpID", "phone", "avatar"
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
      const info = await server.drizzle.query.hrInfo.findFirst( {
        columns: { uuid: false },
        where: eq( hrInfo.uuid, request.user.uuid )
      } ).catch( ( error ) => {
        server.log.error( error )
      } )
      if ( info ) {
        reply.send( { info: info } )
      } else {
        reply.code( 404 ).send()
      }
    }
  )
  server.post( "/hrinfo",
    {
      schema: {
        body: {
          type: 'object',
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
            avatar: { type: "string" },
          },
          required: [ "name", "hrID", "corpID", "phone", "avatar" ],
          additionalProperties: false
        } as const satisfies JSONSchema,
        response: {
          200: {
            type: 'object',
            properties: { result: { type: "boolean" } },
            required: [ "result" ],
            additionalProperties: false
          } as const satisfies JSONSchema
        }
      }
    },
    async ( request, reply ) => {
      const info = await server.drizzle.query.corpInfo.findFirst( {
        columns: {},
        where: eq( corpInfo.corpID, request.body.corpID )
      } ).catch( ( error ) => {
        server.log.error( error )
      } )
      if ( info ) {
        const source: typeof hrInfo.$inferInsert = Object.create( null )
        source.uuid = request.user.uuid
        source.name = request.body.name
        source.hrID = request.body.hrID
        source.corpID = request.body.corpID
        source.phone = request.body.phone
        source.avatar = request.body.avatar
        const result = await server.drizzle.insert( hrInfo ).values( source )
          .then( () => true )
          .catch( ( error ) => {
            server.log.error( error )
            return false
          } )
        reply.send( { result: result } )
      } else {
        reply.code( 403 ).send()
      }
    }
  )
  server.patch( "/hrinfo",
    {
      schema: {
        body: {
          type: 'object',
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
            type: 'object',
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
          .set( { phone: request.body.phone } ).where( eq( hrInfo.uuid, request.user.uuid ) )
          .then( () => true )
          .catch( ( error ) => {
            server.log.error( error )
            return false
          } )
        reply.send( { result: result } )
      } else {
        reply.code( 401 ).send()
      }
    }
  )
  server.get( "/corpinfo",
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            logo: { type: "string" }
          },
          additionalProperties: false
        } as const satisfies JSONSchema,
        response: {
          200: {
            type: 'object',
            properties: {
              info: {
                type: 'object',
                properties: {
                  corpName: { type: "string" },
                  brief: { type: "string" },
                  logo: { type: "string" },
                  chiefhr: { type: "string" },
                  valid: { type: "boolean" },
                  hrist: {
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
        const info = await server.drizzle.query.corpInfo.findFirst( {
          columns: {
            corpName: true,
            brief: true,
            logo: true
          },
          where: eq( corpInfo.logo, request.query.logo )
        } ).catch( ( error ) => {
          server.log.error( error )
        } )
        if ( info ) {
          reply.send( { info: info } )
        } else {
          reply.code( 404 ).send()
        }
      } else {
        const hr_info = await server.drizzle.query.hrInfo.findFirst( {
          columns: {
            hrID: true,
            corpID: true
          },
          where: eq( hrInfo.uuid, request.user.uuid )
        } ).catch( ( error ) => {
          server.log.error( error )
        } )
        if ( hr_info ) {
          const corp_info = await server.drizzle.query.corpInfo.findFirst( {
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
          } )
            .catch( ( error ) => {
              server.log.error( error )
            } )
          if ( corp_info ) {
            if ( corp_info.chiefHR === hr_info.hrID ) {
              corp_info.hrList.filter(
                ( info ) =>
                  info.hrID !== hr_info.hrID
              )
            } else {
              corp_info.hrList = []
            }
            reply.send( { info: corp_info } )
          } else {
            reply.code( 404 ).send()
          }
        } else {
          reply.code( 403 ).send()
        }
      }
    }
  )
  server.post( "/corpinfo",
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            corpName: { type: "string" },
            corpID: {
              type: "string",
              pattern: regexp
            },
            brief: { type: "string" },
            chiefHR: { type: "string" },
            logo: { type: "string" },
          },
          required: [ "corpName", "corpID", "brief", "chiefHR", "logo" ],
          additionalProperties: false
        } as const satisfies JSONSchema,
        response: {
          200: {
            type: 'object',
            properties: { result: { type: "boolean" } },
            required: [ "result" ],
            additionalProperties: false
          } as const satisfies JSONSchema
        }
      }
    },
    async ( request, reply ) => {
      const source: typeof corpInfo.$inferInsert = Object.create( null )
      source.corpName = request.body.corpName
      source.corpID = request.body.corpID
      source.brief = request.body.brief
      source.chiefHR = request.body.chiefHR
      source.logo = request.body.logo
      const result = await server.drizzle.insert( corpInfo ).values( source )
        .then( () => true )
        .catch( ( error ) => {
          server.log.error( error )
          return false
        } )
      reply.send( { result: result } )
    }
  )
  server.get( "/jobinfo",
    {
      schema: {
        querystring: {
          type: 'object',
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
            offset: { type: "number" }
          },
          required: [ "offset" ],
          additionalProperties: false
        } as const satisfies JSONSchema,
        response: {
          200: {
            type: 'object',
            properties: {
              list: {
                type: "array",
                items: {
                  type: 'object',
                  properties: {
                    position: { type: "string" },
                    overview: { type: "string" },
                    type: { enum: [ "part-time", "full-time" ] },
                    salary: {
                      type: "string",
                      pattern: "^\\[[0-9]+(\\.[0-9]{1,3})?,[0-9]+(\\.[0-9]{1,3})?\\]$"
                    },
                    location: {
                      type: "string",
                      pattern: "^\\d{6}$"
                    },
                    no: { type: "number" },
                    corpInfo: {
                      type: 'object',
                      properties: {
                        corpName: { type: "string" },
                        logo: { type: "string" }
                      },
                      required: [ "corpName", "logo" ],
                      additionalProperties: false
                    }
                  },
                  required: [
                    "position", "overview", "type", "salary", "location", "no", "corpInfo"
                  ],
                  additionalProperties: false
                }
              }
            },
            required: [ "list" ],
            additionalProperties: false
          } as const satisfies JSONSchema,
        }
      }
    },
    async ( request, reply ) => {
      const options: SQL[] = []
      if ( request.user.hr ) {
        const hr_info = await server.drizzle.query.hrInfo.findFirst( {
          columns: { corpID: true },
          where: eq( hrInfo.uuid, request.user.uuid )
        } )
          .catch( ( error ) => {
            server.log.error( error )
          } )
        if ( hr_info ) {
          options.push( eq( jobInfo.corpID, hr_info.corpID ) )
        }
      } else {
        const user_info = await server.drizzle.query.userInfo.findFirst( {
          columns: {
            location: true,
            cv: true
          },
          where: eq( userInfo.uuid, request.user.uuid )
        } )
          .catch( ( error ) => {
            server.log.error( error )
          } )
        if ( user_info ) {
          options.push( not( arrayContains( jobInfo.cvList, [ user_info.cv ] ) ) )
          if ( request.query.position ) {
            options.push( like( jobInfo.position, `%${ request.query.position }%` ) )
          }
          if ( request.query.type ) {
            options.push( eq( jobInfo.type, request.query.type ) )
          }
          if ( request.query.salary ) {
            options.push( sql`jobinfo.salary @> ${ Number.parseInt( request.query.salary ) }` )
          }
          if ( request.query.location ) {
            let location = request.query.location
            if ( location === "0000" ) {
              location = user_info.location.slice( 0, 4 )
            }
            options.push( sql`starts_with( jobinfo.location, ${ location } )` )
          }
          if ( request.query.logo ) {
            const corp_info = await server.drizzle.query.corpInfo.findFirst( {
              columns: { corpID: true },
              where: eq( corpInfo.logo, request.query.logo )
            } )
              .catch( ( error ) => {
                server.log.error( error )
              } )
            if ( corp_info ) {
              options.push( eq( jobInfo.corpID, corp_info.corpID ) )
            }
          }
        }
      }
      if ( options.length > 0 ) {
        const jobList = await server.drizzle.query.jobInfo.findMany( {
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
          limit: 2,
          offset: request.query.offset,
        } )
          .then( ( list ) =>
            list.map( ( l ) => {
              l.salary = l.salary.slice( 1, - 1 ).replace( ",", "~" )
              return l
            } )
          )
          .catch( ( error ) => {
            server.log.error( error )
            return []
          } )
        reply.send( { list: jobList } )
      } else {
        reply.code( 304 ).send()
      }
    }
  )
  server.post( "/jobinfo",
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            position: { type: "string" },
            overview: { type: "string" },
            type: { enum: [ "part-time", "full-time" ] },
            salary: {
              type: "string",
              pattern: "^\\[[0-9]+(\\.[0-9]{1,3})?,[0-9]+(\\.[0-9]{1,3})?\\]$"
            },
            location: {
              type: "string",
              pattern: "^\\d{6}$"
            }
          },
          required: [
            "position", "overview", "type", "salary", "location"
          ],
          additionalProperties: false
        } as const satisfies JSONSchema,
        response: {
          200: {
            type: 'object',
            properties: { result: { type: "boolean" } },
            required: [ "result" ],
            additionalProperties: false
          } as const satisfies JSONSchema
        }
      }
    },
    async ( request, reply ) => {
      const info = await server.drizzle.query.hrInfo.findFirst( {
        columns: { corpID: true },
        where: eq( hrInfo.uuid, request.user.uuid )
      } )
        .catch( ( error ) => {
          server.log.error( error )
        } )
      if ( info ) {
        const source: typeof jobInfo.$inferInsert = Object.create( null )
        source.position = request.body.position
        source.overview = request.body.overview
        source.type = request.body.type
        source.salary = request.body.salary
        source.location = request.body.location
        source.corpID = info.corpID
        const result = await server.drizzle.insert( jobInfo ).values( source )
          .then( () => true )
          .catch( ( error ) => {
            server.log.error( error )
            return false
          } )
        reply.send( { result: result } )
      } else {
        reply.code( 304 ).send()
      }
    }
  )
  server.patch( "/jobinfo",
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            position: { type: "string" },
            overview: { type: "string" },
            type: { enum: [ "part-time", "full-time" ] },
            salary: {
              type: "string",
              pattern: "^\\[[0-9]+(\\.[0-9]{1,3})?,[0-9]+(\\.[0-9]{1,3})?\\]$"
            },
            location: {
              type: "string",
              pattern: "^\\d{6}$"
            },
            corpID: {
              type: "string",
              pattern: regexp
            },
            no: { type: "number" }
          },
          required: [ "corpID", "no" ],
          additionalProperties: false
        } as const satisfies JSONSchema,
        response: {
          200: {
            type: 'object',
            properties: { result: { type: "boolean" } },
            required: [ "result" ],
            additionalProperties: false
          } as const satisfies JSONSchema
        }
      }
    },
    async ( request, reply ) => {
      const info = await server.drizzle.query.hrInfo.findFirst( {
        columns: { corpID: true },
        where: eq( hrInfo.uuid, request.user.uuid )
      } )
        .catch( ( error ) => {
          server.log.error( error )
        } )
      if ( info?.corpID === request.body.corpID ) {
        const source: Partial<Omit<typeof jobInfo.$inferInsert, "corpID" | "cvList" | "no">> = Object.create( null )
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
          const result = await server.drizzle.update( jobInfo )
            .set( source ).where( eq( jobInfo.no, request.body.no ) )
            .then( () => true )
            .catch( ( error ) => {
              server.log.error( error )
              return false
            } )
          reply.send( { result: result } )
        } else {
          reply.code( 401 ).send()
        }
      } else {
        reply.code( 403 ).send()
      }
    }
  )
  server.delete( "/jobinfo",
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            corpID: {
              type: "string",
              pattern: regexp
            },
            no: { type: "number" }
          },
          required: [ "corpID", "no" ],
          additionalProperties: false
        } as const satisfies JSONSchema,
        response: {
          200: {
            type: 'object',
            properties: { result: { type: "boolean" } },
            required: [ "result" ],
            additionalProperties: false
          } as const satisfies JSONSchema
        }
      }
    },
    async ( request, reply ) => {
      const info = await server.drizzle.query.hrInfo.findFirst( {
        columns: { corpID: true },
        where: eq( hrInfo.uuid, request.user.uuid )
      } )
        .catch( ( error ) => {
          server.log.error( error )
          return
        } )
      if ( info?.corpID === request.body.corpID ) {
        const result = await server.drizzle.delete( jobInfo )
          .where( eq( jobInfo.no, request.body.no ) )
          .then( () => true )
          .catch( ( error ) => {
            server.log.error( error )
            return false
          } )
        reply.send( { result: result } )
      } else {
        reply.code( 403 ).send()
      }
    }
  )
  server.post( "/image",
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: { result: { type: "string" } },
            required: [ "result" ],
            additionalProperties: false
          } as const satisfies JSONSchema
        }
      }
    },
    async ( request, reply ) => {
      const file = await request.file()
      if ( file ) {
        const fileName = random( { length: 10 } )
        const result = await server.saveFile( file, fileName )
        reply.send( { result: result ? fileName : "" } )
      } else {
        reply.code( 401 ).send()
      }
    }
  )
  server.patch( "/image",
    {
      schema: {
        querystring: {
          type: 'object',
          properties: { fileName: { type: "string" } },
          required: [ "fileName" ],
          additionalProperties: false
        } as const satisfies JSONSchema,
        response: {
          200: {
            type: 'object',
            properties: { result: { type: "string" } },
            required: [ "result" ],
            additionalProperties: false
          } as const satisfies JSONSchema
        }
      }
    },
    async ( request, reply ) => {
      const file = await request.file()
      if ( file ) {
        const fileName = random( { length: 10 } )
        let result = await server.saveFile( file, fileName )
        if ( result ) {
          result = await ( request.user.hr ?
            server.drizzle.update( hrInfo )
              .set( { avatar: fileName } ).where( eq( hrInfo.uuid, request.user.uuid ) ) :
            server.drizzle.update( userInfo )
              .set( { avatar: fileName } ).where( eq( userInfo.uuid, request.user.uuid ) ) )
            .then( () => true )
            .catch( ( error ) => {
              server.log.error( error )
              return false
            } )
          await ( result ?
            server.deleteFile( "image", request.query.fileName ) :
            server.deleteFile( "image", fileName )
          )
        }
        reply.send( { result: result ? fileName : "" } )
      } else {
        reply.code( 401 ).send()
      }
    }
  )
  server.post( "/cv",
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: { result: { type: "string" } },
            required: [ "result" ],
            additionalProperties: false
          } as const satisfies JSONSchema
        }
      }
    },
    async ( request, reply ) => {
      const file = await request.file()
      if ( file ) {
        const info = await server.drizzle.query.userInfo.findFirst( {
          columns: { cv: true },
          where: eq( userInfo.uuid, request.user.uuid )
        } )
          .catch( ( error ) => {
            server.log.error( error )
          } )
        if ( info ) {
          const fileName = random( { length: 10 } )
          let result = await server.saveFile( file, fileName )
          if ( result ) {
            result = await server.drizzle.update( userInfo )
              .set( { cv: fileName } ).where( eq( userInfo.uuid, request.user.uuid ) )
              .then( () => true )
              .catch( ( error ) => {
                server.log.error( error )
                return false
              } )
            await ( result ?
              server.deleteFile( "PDF", info.cv + ".pdf" ) :
              server.deleteFile( "PDF", fileName + ".pdf" )
            )
          }
          reply.send( { result: result ? fileName : "" } )
        } else {
          reply.code( 403 ).send()
        }
      } else {
        reply.code( 401 ).send()
      }
    }
  )
  server.get( "/cv-deliver",
    {
      schema: {
        querystring: {
          type: 'object',
          properties: { no: { type: "number" } },
          required: [ "no" ],
          additionalProperties: false
        } as const satisfies JSONSchema,
        response: {
          200: {
            type: 'object',
            properties: { result: { type: "boolean" } },
            required: [ "result" ],
            additionalProperties: false
          } as const satisfies JSONSchema
        }
      }
    },
    async ( request, reply ) => {
      const user_info = await server.drizzle.query.userInfo.findFirst( {
        columns: { cv: true },
        where: eq( userInfo.uuid, request.user.uuid )
      } )
        .catch( ( error ) => {
          server.log.error( error )
        } )
      if ( user_info ) {
        const job_info = await server.drizzle.query.jobInfo.findFirst( {
          where: and(
            eq( jobInfo.no, request.query.no ),
            arrayContains( jobInfo.cvList, [ user_info.cv ] )
          )
        } )
          .catch( ( error ) => {
            server.log.error( error )
          } )
        if ( job_info ) {
          reply.code( 401 ).send()
        } else {
          const result = await server.drizzle.update( jobInfo )
            .set( { cvList: sql`array_append( jobinfo.cvlist, ${ user_info.cv } )` } )
            .where( eq( jobInfo.no, request.query.no ) )
            .then( () => true )
            .catch( ( error ) => {
              server.log.error( error )
              return false
            } )
          reply.send( { result: result } )
        }
      } else {
        reply.code( 403 ).send()
      }
    }
  )
  server.get( "/cv-receive",
    {
      schema: {
        querystring: {
          type: 'object',
          properties: { no: { type: "number" } },
          required: [ "no" ],
          additionalProperties: false
        } as const satisfies JSONSchema,
        response: {
          200: {
            type: 'object',
            properties: {
              list: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    cv: { type: "string" }
                  },
                  required: [ "name", "cv" ],
                  additionalProperties: false
                }
              }
            },
            required: [ "list" ],
            additionalProperties: false
          } as const satisfies JSONSchema,
        }
      }
    },
    async ( request, reply ) => {
      const hr_info = await server.drizzle.query.hrInfo.findFirst( {
        columns: { corpID: true },
        where: eq( hrInfo.uuid, request.user.uuid )
      } )
        .catch( ( error ) => {
          server.log.error( error )
        } )
      if ( hr_info ) {
        const job_info = await server.drizzle.query.jobInfo.findFirst( {
          columns: {
            corpID: true,
            cvList: true
          },
          where: eq( jobInfo.no, request.query.no )
        } )
          .catch( ( error ) => {
            server.log.error( error )
          } )
        if ( hr_info.corpID === job_info?.corpID ) {
          const userList = await server.drizzle.query.userInfo.findMany( {
            columns: {
              name: true,
              cv: true
            },
            where: inArray( userInfo.cv, job_info.cvList )
          } )
            .catch( ( error ) => {
              server.log.error( error )
              return []
            } )
          reply.send( { list: userList } )
        } else {
          reply.code( 401 ).send()
        }
      } else {
        reply.code( 403 ).send()
      }
    }
  )
  server.post( "/cv-remove/:state",
    {
      schema: {
        params: {
          type: 'object',
          properties: { state: { enum: [ "welcome", "refuse" ] } },
          required: [ "state" ],
          additionalProperties: false
        } as const satisfies JSONSchema,
        body: {
          type: 'object',
          properties: {
            cv: { type: "string" },
            no: {
              type: "number",
              minimum: 1
            },
            corpname: { type: "string" },
            datetime: {
              type: "string",
              pattern: "^\\d{4}-\\d{2}-\\d{2}-\\d{2}:\\d{2}$"
            },
            location: { type: "string" }
          },
          required: [ "cv", "no", "corpname" ],
          additionalProperties: false
        } as const satisfies JSONSchema,
        response: {
          200: {
            type: 'object',
            properties: { result: { type: "boolean" } },
            required: [ "result" ],
            additionalProperties: false
          } as const satisfies JSONSchema
        }
      }
    },
    async ( request, reply ) => {
      const hr_info = await server.drizzle.query.hrInfo.findFirst( {
        columns: { corpID: true },
        where: eq( hrInfo.uuid, request.user.uuid )
      } )
        .catch( ( error ) => {
          server.log.error( error )
        } )
      if ( hr_info ) {
        const user_info = await server.drizzle.query.userInfo.findFirst( {
          columns: {
            name: true,
            uuid: true
          },
          where: eq( userInfo.cv, request.body.cv )
        } )
          .catch( ( error ) => {
            server.log.error( error )
            return
          } )
        const job_info = await server.drizzle.query.jobInfo.findFirst( {
          columns: {
            corpID: true,
            position: true
          },
          where: eq( jobInfo.no, request.body.no )
        } )
          .catch( ( error ) => {
            server.log.error( error )
            return
          } )
        if ( user_info && job_info && hr_info.corpID === job_info.corpID ) {
          let info = ""
          switch ( request.params.state ) {
            case "welcome": {
              if ( request.body.datetime && request.body.location ) {
                const datetime = request.body.datetime.split( "-" )
                datetime[ 0 ] += "年"
                datetime[ 1 ] += "月"
                datetime[ 2 ] += "日"
                const time = datetime.join( "" )
                info = `
                尊敬的${ user_info.name }先生, 很高兴的通知您:
                您申请的${ request.body.corpname }公司的${ job_info.position }职位已通过简历筛选, 现邀请您参加面试.
                请您于${ time }携带简历到${ request.body.location }参加面试.
                `
              }
              break
            }
            case "refuse": {
              info = `
              尊敬的${ user_info.name }先生, 很抱歉的通知您:
              您申请的${ request.body.corpname }公司的${ job_info.position }职位未通过简历筛选, 请选择其他合适的职位.
              `
              break
            }
          }
          if ( info ) {
            const result = await Promise.all( [
              server.drizzle.insert( infoBox )
                .values( { uuid: user_info.uuid, info: info } ),
              server.drizzle.update( jobInfo )
                .set( { cvList: sql`array_remove( jobinfo.cvlist, ${ request.body.cv } )` } )
                .where( eq( jobInfo.no, request.body.no ) )
            ] ).then( () => true )
              .catch( ( error ) => {
                server.log.error( error )
                return false
              } )
            reply.send( { result: result } )
          } else {
            reply.code( 401 ).send()
          }
        } else {
          reply.code( 401 ).send()
        }
      } else {
        reply.code( 403 ).send()
      }
    }
  )
  server.get( "/infobox",
    {
      schema: {
        querystring: {
          type: 'object',
          properties: { offset: { type: "number" } },
          required: [ "offset" ],
          additionalProperties: false
        } as const satisfies JSONSchema,
        response: {
          200: {
            type: 'object',
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
      const list = await server.drizzle.query.infoBox.findMany( {
        columns: { uuid: false },
        where: eq( infoBox.uuid, request.user.uuid ),
        orderBy: [ desc( infoBox.no ) ],
        limit: 2,
        offset: request.query.offset
      } )
        .catch( ( error ) => {
          server.log.error( error )
          return []
        } )
      reply.send( { list: list } )
    }
  )
  server.get( "/infobox/:action",
    {
      schema: {
        params: {
          type: 'object',
          properties: { action: { enum: [ "read", "remove" ] } },
          required: [ "action" ],
          additionalProperties: false
        } as const satisfies JSONSchema,
        querystring: {
          type: 'object',
          properties: { no: { type: "number" } },
          required: [ "no" ],
          additionalProperties: false
        } as const satisfies JSONSchema,
        response: {
          200: {
            type: 'object',
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
      let result = false
      switch ( request.params.action ) {
        case "read": {
          result = await server.drizzle.update( infoBox )
            .set( { read: true } ).where( options )
            .then( () => true )
            .catch( ( error ) => {
              server.log.error( error )
              return false
            } )
          break
        }
        case "remove": {
          result = await server.drizzle.delete( infoBox )
            .where( options )
            .then( () => true )
            .catch( ( error ) => {
              server.log.error( error )
              return false
            } )
          break
        }
      }
      reply.send( { result: result } )
    }
  )
  server.get( "/infobox/:event",
    {
      schema: {
        params: {
          type: 'object',
          properties: { event: { enum: [ "update" ] } },
          required: [ "event" ],
          additionalProperties: false
        } as const satisfies JSONSchema,
        response: {
          200: {
            type: 'object',
            properties: {
              event: { type: "string" }
            },
            required: [ "event" ],
            additionalProperties: false
          } as const satisfies JSONSchema
        }
      }
    },
    async ( request, reply ) => {
      if ( request.params.event === "update" ) {
        const list = await server.drizzle.query.infoBox.findMany( {
          columns: { uuid: false },
          where: eq( infoBox.uuid, request.user.uuid ),
          orderBy: [ desc( infoBox.no ) ],
          limit: 1,
          offset: 1
        } )
          .catch( ( error ) => {
            server.log.error( error )
            return []
          } )
        if ( list.length === 1 ) {
          let payload = `event:${ request.params.event }\n`
          payload += `data:${ JSON.stringify( list[ 0 ] ) }\n`
          payload += `retry:3000\n`
          payload += `\n`
          reply.headers( { "Content-Type": "text/event-stream; charset=utf-8" } )
          reply.send( { event: payload } )
        }
      }
    }
  )
} )
export default restPlugin
