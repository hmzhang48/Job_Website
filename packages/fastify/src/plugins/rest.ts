import type { FastifyPluginAsync } from "fastify"
import fp from "fastify-plugin"
//import { S } from "fluent-json-schema"
import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts'
import { JSONSchema } from "json-schema-to-ts"
import crypto from "crypto"
import random from "crypto-random-string"
import type { User, UserInfo, HRInfo, CorpInfo, JobInfo, InfoBox } from "../lib/types"

const idPattern = "^\\d{17}[0-9Xx]$"
const corpidPattern = "^[0-9A-HJ-NPQRTUWXYa-hj-npqrtuwxy]{2}\\d{6}[0-9A-HJ-NPQRTUWXYa-hj-npqrtuwxy]{10}$"
const salaryPattern = "^\\[[0-9]+(\\.[0-9]{1,3})?,[0-9]+(\\.[0-9]{1,3})?\\]$"
const datetimePattern = "^\\d{4}-\\d{2}-\\d{2}-\\d{2}:\\d{2}$"

const restPlugin: FastifyPluginAsync = fp( async ( f ) => {
  const server = f.withTypeProvider<JsonSchemaToTsProvider>()

  server.get( '/',
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              user: { type: "boolean" },
              guide: { type: "boolean" },
              hr: { type: "boolean" }
            },
            required: [ "user" ],
            additionalProperties: false
          } as const satisfies JSONSchema
        }
      },
      preValidation: async ( request, reply ) => {
        const result = await server.authJWT( request )
        if ( !result ) {
          reply.send( { user: result } )
        }
      }
    },
    async ( request, reply ) => {
      const user = request.user
      if ( user.hr ) {
        const query = server.knex<HRInfo>( 'hrinfo' )
          .select( 'hrid' ).where( { uuid: user.uuid } )
        const info = await query
          .then( ( result ) => {
            return result
          } )
          .catch( ( reason ) => {
            server.log.error( reason )
            return []
          } )
        if ( info.length ) {
          reply.send( {
            user: true,
            guide: false,
            hr: true
          } )
        } else {
          reply.send( {
            user: true,
            guide: true,
            hr: true
          } )
        }
      } else {
        const query = server.knex<UserInfo>( 'userinfo' )
          .select( 'id' ).where( { uuid: user.uuid } )
        const info = await query
          .then( ( result ) => {
            return result
          } )
          .catch( ( reason ) => {
            server.log.error( reason )
            return []
          } )
        if ( info.length ) {
          reply.send( {
            user: true,
            guide: false,
            hr: false
          } )
        } else {
          reply.send( {
            user: true,
            guide: true,
            hr: false
          } )
        }
      }
    }
  )

  server.post(
    "/",
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
            properties: {
              result: { type: "boolean" }
            },
            required: [ "result" ],
            additionalProperties: false
          } as const satisfies JSONSchema
        }
      }
    },
    async ( request, reply ) => {
      const body = request.body
      const uuid = crypto.randomUUID()
      const email = body.email
      const hash = crypto.createHash( "md5" )
      hash.update( body.password )
      const password = hash.digest( "hex" )
      const hr = body.hr
      const source = Object.create( null )
      source.uuid = uuid
      source.email = email
      source.password = password
      source.hr = hr
      const query = server.knex<User>( 'users' )
        .insert( source )
      const result = await query
        .then( () => {
          return true
        } )
        .catch( ( reason ) => {
          server.log.error( reason )
          return false
        } )
      if ( result ) {
        const token = await reply.jwtSign( {
          uuid: uuid,
          hr: hr
        } )
        reply.setCookie(
          "jwt", token, {
          path: "/",
          httpOnly: true,
          sameSite: true,
          signed: true
        } )
          .send( {
            result: result,
          } )
      } else {
        reply.send( {
          result: result
        } )
      }
    }
  )

  server.get(
    "/email-check",
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
            properties: {
              result: { type: "boolean" }
            },
            required: [ "result" ],
            additionalProperties: false
          } as const satisfies JSONSchema
        }
      }
    },
    async ( request, reply ) => {
      const query = server.knex<User>( 'users' ).where( { email: request.query.email } )
      const users = await query
        .then( ( result ) => {
          return result
        } )
        .catch( ( reason ) => {
          server.log.error( reason )
          return []
        } )
      if ( users.length ) {
        reply.send( { result: true } )
      } else {
        reply.send( { result: false } )
      }
    }
  )

  server.get(
    "/email-validate",
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
            properties: {
              result: {
                anyOf: [
                  { type: "string" },
                  { type: "null" }
                ]
              }
            },
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
        .catch( ( reason ) => {
          server.log.error( reason )
          return false
        } )
      if ( result && server.mail.isIdle() ) {
        result = await server.mail.sendMail( message )
          .then( () => true )
          .catch( ( reason ) => {
            server.log.error( reason )
            return false
          } )
      }
      if ( result ) {
        reply.send( { result: code } )
      } else {
        reply.send( { result: null } )
      }
    }
  )

  server.get(
    "/phone-validate",
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
            properties: {
              result: {
                anyOf: [
                  { type: "string" },
                  { type: "null" }
                ]
              }
            },
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

  server.patch(
    "/email-reset",
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
            properties: {
              result: { type: "boolean" }
            },
            required: [ "result" ],
            additionalProperties: false
          } as const satisfies JSONSchema
        }
      },
      preValidation: async ( request, reply ) => {
        const result = await server.authJWT( request )
        if ( !result ) {
          reply.send( { result: result } )
        }
      }
    },
    async ( request, reply ) => {
      const query = server.knex<User>( 'users' )
        .update( { email: request.body.email } ).where( { uuid: request.user.uuid } )
      const result = await query
        .then( () => {
          return true
        } )
        .catch( ( reason ) => {
          server.log.error( reason )
          return false
        } )
      reply.send( { result: result } )
    }
  )

  server.patch(
    "/password-reset",
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
            properties: {
              result: { type: "string" }
            },
            required: [ "result" ],
            additionalProperties: false
          } as const satisfies JSONSchema
        }
      },
      preValidation: async ( request, reply ) => {
        const result = await server.authJWT( request )
        if ( !result ) {
          reply.send( {
            result: "请重新登陆"
          } )
        }
      }
    },
    async ( request, reply ) => {
      const query = server.knex<User>( 'users' )
        .select( 'password' ).where( { uuid: request.user.uuid } )
      const users = await query
        .then( ( result ) => {
          return result
        } )
        .catch( ( reason ) => {
          server.log.error( reason )
          return []
        } )
      if ( users.length ) {
        const hash = crypto.createHash( "md5" )
        hash.update( request.body.oldPassword )
        if ( hash.digest( "hex" ) === users[ 0 ].password ) {
          const hash = crypto.createHash( "md5" )
          hash.update( request.body.newPassword )
          const password = hash.digest( "hex" )
          const query = server.knex<User>( 'users' )
            .update( { password: password } ).where( { uuid: request.user.uuid } )
          const result = await query
            .then( () => {
              return true
            } )
            .catch( ( reason ) => {
              server.log.error( reason )
              return false
            } )
          if ( result ) {
            reply.send( {
              result: "修改成功"
            } )
          } else {
            reply.send( {
              result: "请重试"
            } )
          }
        } else {
          reply.send( {
            result: "密码错误"
          } )
        }
      } else {
        reply.send( {
          result: "用户不存在"
        } )
      }
    }
  )

  server.post(
    "/login",
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
              result: { enum: [ "success", "email", "password" ] }
            },
            required: [],
            additionalProperties: false
          } as const satisfies JSONSchema
        }
      }
    },
    async ( request, reply ) => {
      const query = server.knex<User>( 'users' )
        .select( [ "uuid", "password", "hr" ] ).where( { email: request.body.email } )
      const users = await query
        .then( ( result ) => {
          return result
        } )
        .catch( ( reason ) => {
          server.log.error( reason )
          return []
        } )
      if ( users.length ) {
        const hash = crypto.createHash( "md5" )
        hash.update( request.body.password )
        const password = hash.digest( "hex" )
        if ( password === users[ 0 ].password ) {
          const token = await reply.jwtSign( {
            uuid: users[ 0 ].uuid,
            hr: users[ 0 ].hr
          } )
          reply.setCookie(
            "jwt", token, {
            path: "/",
            httpOnly: true,
            sameSite: true,
            signed: true
          } ).send( { result: "success" } )
        } else {
          reply.send( { result: "password" } )
        }
      } else {
        reply.send( { result: "email" } )
      }
    }
  )

  server.get(
    "/logout",
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              result: { type: "boolean" }
            },
            required: [ "result" ],
            additionalProperties: false
          } as const satisfies JSONSchema
        }
      },
      preValidation: async ( request, reply ) => {
        const result = await server.authJWT( request )
        if ( !result ) {
          reply.send( { result: result } )
        }
      }
    },
    async ( _request, reply ) => {
      reply.clearCookie( "jwt", { path: "/" } )
        .send( { result: true } )
    }
  )

  server.get(
    "/userinfo",
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              result: {
                anyOf: [
                  {
                    type: 'object',
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
                      "name", "id", "location", "phone", "avatar", "cv", "valid"
                    ],
                    additionalProperties: false
                  },
                  { type: "null" }
                ]
              }
            },
            required: [ "result" ],
            additionalProperties: false
          } as const satisfies JSONSchema
        }
      },
      preValidation: async ( request, reply ) => {
        const result = await server.authJWT( request )
        if ( !result ) {
          reply.send( { result: null } )
        }
      }
    },
    async ( request, reply ) => {
      const query = server.knex<UserInfo>( 'userinfo' )
        .select( [ "name", "id", "location", "phone", "valid", "avatar", "cv" ] ).where( { uuid: request.user.uuid } )
      const info = await query
        .then( ( result ) => {
          return result
        } )
        .catch( ( reason ) => {
          server.log.error( reason )
          return []
        } )
      if ( info.length ) {
        reply.send( { result: info[ 0 ] } )
      } else {
        reply.send( { result: null } )
      }
    }
  )

  server.post(
    "/userinfo",
    {
      schema: {
        body: {
          type: 'object',
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
          },
          required: [ "name", "id", "location", "phone", "avatar" ],
          additionalProperties: false
        } as const satisfies JSONSchema,
        response: {
          200: {
            type: 'object',
            properties: {
              result: { type: "boolean" }
            },
            required: [ "result" ],
            additionalProperties: false
          } as const satisfies JSONSchema
        }
      },
      preValidation: async ( request, reply ) => {
        const result = await server.authJWT( request )
        if ( !result ) {
          reply.send( { result: result } )
        }
      }
    },
    async ( request, reply ) => {
      const user = request.user
      const source = Object.create( null )
      source.uuid = user.uuid
      source.name = request.body.name
      source.id = request.body.id
      source.location = request.body.location
      source.phone = request.body.phone
      source.avatar = request.body.avatar
      const query = server.knex<UserInfo>( 'userinfo' )
        .insert( source )
      const result = await query
        .then( () => {
          return true
        } )
        .catch( ( reason ) => {
          server.log.error( reason )
          return false
        } )
      reply.send( { result: result } )
    },
  )

  server.patch(
    "/userinfo",
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
            properties: {
              result: { type: "boolean" }
            },
            required: [ "result" ],
            additionalProperties: false
          } as const satisfies JSONSchema
        }
      },
      preValidation: async ( request, reply ) => {
        const result = await server.authJWT( request )
        if ( !result ) {
          reply.send( { result: result } )
        }
      }
    },
    async ( request, reply ) => {
      const source = Object.create( null )
      if ( request.body.location ) {
        source.location = request.body.location
      }
      if ( request.body.phone ) {
        source.phone = request.body.phone
      }
      if ( Object.keys( source ).length ) {
        const query = server.knex<UserInfo>( 'userinfo' )
          .update( source ).where( { uuid: request.user.uuid } )
        const result = await query
          .then( () => {
            return true
          } )
          .catch( ( reason ) => {
            server.log.error( reason )
            return false
          } )
        reply.send( { result: result } )
      } else {
        reply.send( { result: false } )
      }
    }
  )

  server.get(
    "/corp-check",
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            corpid: {
              type: "string",
              pattern: corpidPattern
            }
          },
          required: [ "corpid" ],
          additionalProperties: false
        } as const satisfies JSONSchema,
        response: {
          200: {
            type: 'object',
            properties: {
              result: { type: "boolean" }
            },
            required: [ "result" ],
            additionalProperties: false
          } as const satisfies JSONSchema
        }
      },
      preValidation: async ( request, reply ) => {
        const result = await server.authJWT( request )
        if ( !result ) {
          reply.send( { result: result } )
        }
      }
    },
    async ( request, reply ) => {
      const query = server.knex<CorpInfo>( 'corpinfo' ).where( { corpid: request.query.corpid } )
      const corp = await query
        .then( ( result ) => {
          return result
        } )
        .catch( ( reason ) => {
          server.log.error( reason )
          return []
        } )
      if ( corp.length ) {
        reply.send( { result: true } )
      } else {
        reply.send( { result: false } )
      }
    }
  )

  server.get(
    "/hrinfo",
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              result: {
                anyOf: [
                  {
                    type: 'object',
                    properties: {
                      name: { type: "string" },
                      hrid: { type: "string" },
                      corpid: {
                        type: "string",
                        pattern: corpidPattern
                      },
                      phone: {
                        type: "string",
                        pattern: "^\\d{11}$"
                      },
                      avatar: { type: "string" }
                    },
                    required: [
                      "name", "hrid", "corpid", "phone", "avatar"
                    ],
                    additionalProperties: false
                  },
                  { type: "null" }
                ]
              }
            },
            required: [ "result" ],
            additionalProperties: false
          } as const satisfies JSONSchema
        }
      },
      preValidation: async ( request, reply ) => {
        const result = await server.authJWT( request )
        if ( !result ) {
          reply.send( { result: null } )
        }
      }
    },
    async ( request, reply ) => {
      const query = server.knex<HRInfo>( 'hrinfo' )
        .select( [ "name", "hrid", "corpid", "phone", "avatar" ] ).where( { uuid: request.user.uuid } )
      const info = await query
        .then( ( result ) => {
          return result
        } )
        .catch( ( reason ) => {
          server.log.error( reason )
          return []
        } )
      if ( info.length ) {
        reply.send( { result: info[ 0 ] } )
      } else {
        reply.send( { result: null } )
      }
    }
  )

  server.post(
    "/hrinfo",
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            name: { type: "string" },
            hrid: { type: "string" },
            corpid: {
              type: "string",
              pattern: corpidPattern
            },
            phone: {
              type: "string",
              pattern: "^\\d{11}$"
            },
            avatar: { type: "string" },
          },
          required: [ "name", "hrid", "corpid", "phone", "avatar" ],
          additionalProperties: false
        } as const satisfies JSONSchema,
        response: {
          200: {
            type: 'object',
            properties: {
              result: { type: "boolean" }
            },
            required: [ "result" ],
            additionalProperties: false
          } as const satisfies JSONSchema
        }
      },
      preValidation: async ( request, reply ) => {
        const result = await server.authJWT( request )
        if ( !result ) {
          reply.send( { result: result } )
        }
      }
    },
    async ( request, reply ) => {
      const query = server.knex<CorpInfo>( 'corpinfo' )
        .select( "corpid" ).where( { corpid: request.body.corpid } )
      const info = await query
        .then( ( result ) => {
          return result
        } )
        .catch( ( reason ) => {
          server.log.error( reason )
          return []
        } )
      if ( info.length ) {
        const source = Object.create( null )
        source.uuid = request.user.uuid
        source.name = request.body.name
        source.hrid = request.body.hrid
        source.corpid = request.body.corpid
        source.phone = request.body.phone
        source.avatar = request.body.avatar
        const query = server.knex<HRInfo>( 'hrinfo' )
          .insert( source )
        const result = await query
          .then( () => {
            return true
          } )
          .catch( ( reason ) => {
            server.log.error( reason )
            return false
          } )
        reply.send( { result: result } )
      } else {
        reply.send( { result: false } )
      }
    }
  )

  server.patch(
    "/hrinfo",
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
            properties: {
              result: { type: "boolean" }
            },
            required: [ "result" ],
            additionalProperties: false
          } as const satisfies JSONSchema
        }
      },
      preValidation: async ( request, reply ) => {
        const result = await server.authJWT( request )
        if ( !result ) {
          reply.send( { result: result } )
        }
      }
    },
    async ( request, reply ) => {
      if ( request.body.phone ) {
        const query = server.knex<HRInfo>( 'hrinfo' )
          .update( { phone: request.body.phone } ).where( { uuid: request.user.uuid } )
        const result = await query
          .then( () => {
            return true
          } )
          .catch( ( reason ) => {
            server.log.error( reason )
            return false
          } )
        reply.send( { result: result } )
      } else {
        reply.send( { result: false } )
      }
    }
  )

  server.get(
    "/corpinfo",
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
              result: {
                anyOf: [
                  {
                    type: 'object',
                    properties: {
                      corpname: { type: "string" },
                      brief: { type: "string" },
                      logo: { type: "string" },
                      chiefhr: { type: "string" },
                      valid: { type: "boolean" }
                    },
                    required: [ "corpname", "brief", "logo" ],
                    additionalProperties: false
                  },
                  { type: "null" }
                ]
              },
              addition: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    hrid: { type: "string" }
                  },
                  required: [ "name", "hrid" ],
                  additionalProperties: false
                }
              }
            },
            required: [ "result" ],
            additionalProperties: false
          } as const satisfies JSONSchema
        }
      },
      preValidation: async ( request, reply ) => {
        const result = await server.authJWT( request )
        if ( !result ) {
          reply.send( { result: null } )
        }
      }
    },
    async ( request, reply ) => {
      if ( request.query.logo ) {
        const query = server.knex<CorpInfo>( 'corpinfo' )
          .select( [ "corpname", "brief", "logo" ] ).where( { logo: request.query.logo } )
        const info = await query
          .then( ( result ) => {
            return result
          } )
          .catch( ( reason ) => {
            server.log.error( reason )
            return []
          } )
        reply.send( { result: info[ 0 ] } )
      } else {
        const query = server.knex<HRInfo>( 'hrinfo' )
          .select( [ "hrid", "corpid" ] ).where( { uuid: request.user.uuid } )
        const hrinfo = await query
          .then( ( result ) => {
            return result
          } )
          .catch( ( reason ) => {
            server.log.error( reason )
            return []
          } )
        if ( hrinfo.length ) {
          const query = server.knex<CorpInfo>( 'corpinfo' )
            .select( "corpname", "logo", "brief", "chiefhr", "valid" ).where( { corpid: hrinfo[ 0 ].corpid } )
          const corpinfo = await query
            .then( ( result ) => {
              return result
            } )
            .catch( ( reason ) => {
              server.log.error( reason )
              return []
            } )
          if ( corpinfo[ 0 ].chiefhr === hrinfo[ 0 ].hrid ) {
            const query = server.knex<HRInfo>( 'hrinfo' )
              .select( [ "name", "hrid" ] ).where( { corpid: hrinfo[ 0 ].corpid } )
            let hrs = await query
              .then( ( result ) => {
                return result
              } )
              .catch( ( reason ) => {
                server.log.error( reason )
                return []
              } )
            hrs = hrs.filter( ( hr ) => hr.hrid !== hrinfo[ 0 ].hrid )
            reply.send( {
              result: corpinfo[ 0 ],
              addition: hrs
            } )
          }
          reply.send( { result: corpinfo[ 0 ] } )
        }
      }
    }
  )

  server.post(
    "/corpinfo",
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            corpname: { type: "string" },
            corpid: {
              type: "string",
              pattern: corpidPattern
            },
            brief: { type: "string" },
            chiefhr: { type: "string" },
            logo: { type: "string" },
          },
          required: [ "corpname", "corpid", "brief", "chiefhr", "logo" ],
          additionalProperties: false
        } as const satisfies JSONSchema,
        response: {
          200: {
            type: 'object',
            properties: {
              result: { type: "boolean" }
            },
            required: [ "result" ],
            additionalProperties: false
          } as const satisfies JSONSchema
        }
      },
      preValidation: async ( request, reply ) => {
        const result = await server.authJWT( request )
        if ( !result ) {
          reply.send( { result: result } )
        }
      }
    },
    async ( request, reply ) => {
      const source = Object.create( null )
      source.corpname = request.body.corpname
      source.corpid = request.body.corpid
      source.brief = request.body.brief
      source.chiefhr = request.body.chiefhr
      source.logo = request.body.logo
      const query = server.knex<CorpInfo>( 'corpinfo' )
        .insert( source )
      const result = await query
        .then( () => {
          return true
        } )
        .catch( ( reason ) => {
          server.log.error( reason )
          return false
        } )
      reply.send( { result: result } )
    }
  )

  server.get(
    "/jobinfo",
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            position: { type: "string" },
            type: {
              enum: [ "part-time", "full-time" ]
            },
            salary: {
              type: "string",
              pattern: "^\\d+$"
            },
            location: {
              type: "string",
              pattern: "^\\d{4}$"
            },
            logo: { type: "string" },
            offset: {
              type: "string",
              pattern: "^\\d+$"
            }
          },
          required: [ "offset" ],
          additionalProperties: false
        } as const satisfies JSONSchema,
        response: {
          200: {
            type: 'object',
            properties: {
              result: {
                type: "array",
                items: {
                  type: 'object',
                  properties: {
                    position: { type: "string" },
                    overview: { type: "string" },
                    type: {
                      enum: [ "part-time", "full-time" ]
                    },
                    salary: {
                      type: "string",
                      pattern: salaryPattern
                    },
                    location: {
                      type: "string",
                      pattern: "^\\d{6}$"
                    },
                    no: {
                      type: "number",
                    },
                    corpname: { type: "string" },
                    logo: { type: "string" }
                  },
                  required: [
                    "position", "overview", "type", "salary", "location", "no",
                    "corpname", "logo"
                  ],
                  additionalProperties: false
                }
              }
            },
            required: [ "result" ],
            additionalProperties: false
          } as const satisfies JSONSchema,
        }
      },
      preValidation: async ( request, reply ) => {
        const result = await server.authJWT( request )
        if ( !result ) {
          reply.send( { result: [] } )
        }
      }
    },
    async ( request, reply ) => {
      const user = request.user
      let jobQuery = server.knex<JobInfo>( "jobinfo" )
        .select( "position", "overview", "type", "salary", "location", "no" )
        .orderBy( "no" ).offset( parseInt( request.query.offset ) ).limit( 2 )
      if ( user.hr ) {
        const hrQuery = server.knex<HRInfo>( 'hrinfo' )
          .select( "corpid" ).where( { "uuid": user.uuid } )
        const hrInfo = await hrQuery
          .then( ( result ) => {
            return result
          } )
          .catch( ( reason ) => {
            server.log.error( reason )
            return []
          } )
        if ( !hrInfo.length ) {
          reply.send( { result: [] } )
          return
        }
        jobQuery = jobQuery.whereRaw( 'jobinfo.corpid = ?', [ hrInfo[ 0 ].corpid ] )
      } else {
        const userQuery = server.knex<UserInfo>( 'userinfo' )
          .select( [ "location", "cv" ] ).where( { "uuid": user.uuid } )
        const userInfo = await userQuery
          .then( ( result ) => {
            return result
          } )
          .catch( ( reason ) => {
            server.log.error( reason )
            return []
          } )
        if ( !userInfo.length ) {
          reply.send( { result: [] } )
          return
        }
        if ( userInfo[ 0 ].cv ) {
          jobQuery = jobQuery.whereRaw( "NOT ? = ANY (cvlist)", [ userInfo[ 0 ].cv ] )
        }
        if ( request.query.position ) {
          jobQuery = jobQuery.whereLike( "position", "%" + request.query.position + "%" )
        }
        if ( request.query.type ) {
          jobQuery = jobQuery.where( "type", request.query.type )
        }
        if ( request.query.salary ) {
          jobQuery = jobQuery.whereRaw( "salary @> ?::numeric", [ request.query.salary ] )
        }
        if ( request.query.location ) {
          let location = request.query.location
          if ( location === "0000" ) {
            location = userInfo[ 0 ].location.slice( 0, 4 )
          }
          jobQuery = jobQuery.whereRaw( "starts_with(location,?)", [ location ] )
        }
        if ( request.query.logo ) {
          const corpQuery = server.knex<CorpInfo>( 'corpinfo' )
            .select( 'corpid' ).where( { "logo": request.query.logo } )
          const corpInfo = await corpQuery
            .then( ( result ) => {
              return result
            } )
            .catch( ( reason ) => {
              server.log.error( reason )
              return []
            } )
          if ( corpInfo.length ) {
            jobQuery = jobQuery.whereRaw( 'jobinfo.corpid = ?', [ corpInfo[ 0 ].corpid ] )
          }
        }
      }
      const joinQuery = jobQuery.select( "corpname", "logo" )
        .join<CorpInfo>( "corpinfo", { "jobinfo.corpid": "corpinfo.corpid" } )
      const jobList = await joinQuery
        .then( ( result ) => {
          return result
        } )
        .catch( ( reason ) => {
          server.log.error( reason )
          return []
        } )
      jobList.forEach( ( j ) => {
        j.salary = j.salary
          .slice( 1, j.salary.length - 1 )
          .replace( ",", "~" )
      } )
      reply.send( { result: jobList } )
    }
  )

  server.post(
    "/jobinfo",
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            position: { type: "string" },
            overview: { type: "string" },
            type: {
              enum: [ "part-time", "full-time" ]
            },
            salary: {
              type: "string",
              pattern: salaryPattern
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
            properties: {
              result: { type: "boolean" }
            },
            required: [ "result" ],
            additionalProperties: false
          } as const satisfies JSONSchema
        }
      },
      preValidation: async ( request, reply ) => {
        const result = await server.authJWT( request )
        if ( !result ) {
          reply.send( { result: result } )
        }
      }
    },
    async ( request, reply ) => {
      const source = Object.create( null )
      source.position = request.body.position
      source.overview = request.body.overview
      source.type = request.body.type
      source.salary = request.body.salary
      source.location = request.body.location
      const query = server.knex<HRInfo>( 'hrinfo' )
        .select( 'corpid' ).where( { uuid: request.user.uuid } )
      const info = await query
        .then( ( result ) => {
          return result
        } )
        .catch( ( reason ) => {
          server.log.error( reason )
          return []
        } )
      if ( info.length ) {
        source.corpid = info[ 0 ].corpid
        const query = server.knex<JobInfo>( 'jobinfo' )
          .insert( source )
        const result = await query
          .then( () => {
            return true
          } )
          .catch( ( reason ) => {
            server.log.error( reason )
            return false
          } )
        reply.send( { result: result } )
      } else {
        reply.send( { result: false } )
      }
    }
  )

  server.patch(
    "/jobinfo",
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            position: { type: "string" },
            overview: { type: "string" },
            type: {
              enum: [ "part-time", "full-time" ]
            },
            salary: {
              type: "string",
              pattern: salaryPattern
            },
            location: {
              type: "string",
              pattern: "^\\d{6}$"
            },
            corpid: {
              type: "string",
              pattern: corpidPattern
            },
            no: { type: "number" }
          },
          required: [ "corpid", "no" ],
          additionalProperties: false
        } as const satisfies JSONSchema,
        response: {
          200: {
            type: 'object',
            properties: {
              result: { type: "boolean" }
            },
            required: [ "result" ],
            additionalProperties: false
          } as const satisfies JSONSchema
        }
      },
      preValidation: async ( request, reply ) => {
        const result = await server.authJWT( request )
        if ( !result ) {
          reply.send( { result: result } )
        }
      }
    },
    async ( request, reply ) => {
      const source = Object.create( null )
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
      const query = server.knex<HRInfo>( 'hrinfo' )
        .select( 'corpid' ).where( { uuid: request.user.uuid } )
      const info = await query
        .then( ( result ) => {
          return result
        } )
        .catch( ( reason ) => {
          server.log.error( reason )
          return []
        } )
      if ( info.length && info[ 0 ].corpid === request.body.corpid ) {
        const query = server.knex<JobInfo>( 'jobinfo' )
          .update( source ).where( { no: request.body.no } )
        const result = await query
          .then( () => {
            return true
          } )
          .catch( ( reason ) => {
            server.log.error( reason )
            return false
          } )
        reply.send( { result: result } )
      } else {
        reply.send( { result: false } )
      }
    }
  )

  server.delete(
    "/jobinfo",
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            corpid: {
              type: "string",
              pattern: corpidPattern
            },
            no: { type: "number" }
          },
          required: [ "corpid", "no" ],
          additionalProperties: false
        } as const satisfies JSONSchema,
        response: {
          200: {
            type: 'object',
            properties: {
              result: { type: "boolean" }
            },
            required: [ "result" ],
            additionalProperties: false
          } as const satisfies JSONSchema
        }
      },
      preValidation: async ( request, reply ) => {
        const result = await server.authJWT( request )
        if ( !result ) {
          reply.send( { result: result } )
        }
      }
    },
    async ( request, reply ) => {
      const query = server.knex<HRInfo>( 'hrinfo' )
        .select( 'corpid' ).where( { uuid: request.user.uuid } )
      const info = await query
        .then( ( result ) => {
          return result
        } )
        .catch( ( reason ) => {
          server.log.error( reason )
          return []
        } )
      if ( info.length && info[ 0 ].corpid === request.body.corpid ) {
        const query = server.knex<JobInfo>( 'jobinfo' )
          .delete().where( { no: request.body.no } )
        const result = await query
          .then( () => {
            return true
          } )
          .catch( ( reason ) => {
            server.log.error( reason )
            return false
          } )
        reply.send( { result: result } )
      } else {
        reply.send( { result: false } )
      }
    }
  )

  server.post(
    "/image-upload",
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              result: { type: "string" }
            },
            required: [ "result" ],
            additionalProperties: false
          } as const satisfies JSONSchema
        }
      },
      preValidation: async ( request, reply ) => {
        const result = await server.authJWT( request )
        if ( !result ) {
          reply.send( { result: "" } )
        }
      }
    },
    async ( request, reply ) => {
      const file = await request.file()
      if ( file ) {
        const fileName = random( { length: 10 } )
        const result = await server.saveFile( file, fileName )
        if ( result ) {
          reply.send( { result: fileName } )
        } else {
          reply.send( { result: "" } )
        }
      } else {
        reply.send( { result: "" } )
      }
    }
  )

  server.patch(
    "/avatar-reset",
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            fileName: { type: "string" }
          },
          required: [ "fileName" ],
          additionalProperties: false
        } as const satisfies JSONSchema,
        response: {
          200: {
            type: 'object',
            properties: {
              result: { type: "string" }
            },
            required: [ "result" ],
            additionalProperties: false
          } as const satisfies JSONSchema
        }
      },
      preValidation: async ( request, reply ) => {
        const result = await server.authJWT( request )
        if ( !result ) {
          reply.send( { result: "" } )
        }
      }
    },
    async ( request, reply ) => {
      const file = await request.file()
      if ( file ) {
        const fileName = random( { length: 10 } )
        const result = await server.saveFile( file, fileName )
        if ( result ) {
          let query
          if ( request.user.hr ) {
            query = server.knex<HRInfo>( 'hrinfo' ).update( { avatar: fileName } )
          } else {
            query = server.knex<UserInfo>( 'userinfo' ).update( { avatar: fileName } )
          }
          query = query.where( { uuid: request.user.uuid } )
          const result = await query
            .then( () => {
              return true
            } )
            .catch( ( reason ) => {
              server.log.error( reason )
              return false
            } )
          if ( result ) {
            await server.deleteFile( "image", request.query.fileName )
            reply.send( { result: fileName } )
          } else {
            reply.send( { result: "" } )
          }
        } else {
          reply.send( { result: "" } )
        }
      } else {
        reply.send( { result: "" } )
      }
    }
  )

  server.post(
    "/cv-upload",
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              result: { type: "boolean" },
              cv: { type: "string" }
            },
            required: [ "result" ],
            additionalProperties: false
          } as const satisfies JSONSchema
        }
      },
      preValidation: async ( request, reply ) => {
        const result = await server.authJWT( request )
        if ( !result ) {
          reply.send( { result: result } )
        }
      }
    },
    async ( request, reply ) => {
      const file = await request.file()
      if ( file ) {
        const fileName = random( { length: 10 } )
        const result = await server.saveFile( file, fileName )
        if ( result ) {
          const query1 = server.knex<UserInfo>( 'userinfo' )
            .select( 'cv' ).where( { uuid: request.user.uuid } )
          const info = await query1
            .then( ( result ) => {
              return result
            } )
            .catch( ( reason ) => {
              server.log.error( reason )
              return []
            } )
          if ( info[ 0 ].cv ) {
            await server.deleteFile( "PDF", info[ 0 ].cv + ".pdf" )
          }
          const query2 = server.knex<UserInfo>( 'userinfo' )
            .update( { cv: fileName } ).where( { uuid: request.user.uuid } )
          const result = await query2
            .then( () => {
              return true
            } )
            .catch( ( reason ) => {
              server.log.error( reason )
              return false
            } )
          reply.send( { result: result, cv: fileName } )
        } else {
          reply.send( { result: false } )
        }
      } else {
        reply.send( { result: false } )
      }
    }
  )

  server.get(
    "/cv-deliver",
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            no: {
              type: "string",
              pattern: "^\\d+$"
            }
          },
          required: [ "no" ],
          additionalProperties: false
        } as const satisfies JSONSchema,
        response: {
          200: {
            type: 'object',
            properties: {
              result: { type: "boolean" }
            },
            required: [ "result" ],
            additionalProperties: false
          } as const satisfies JSONSchema
        }
      },
      preValidation: async ( request, reply ) => {
        const result = await server.authJWT( request )
        if ( !result ) {
          reply.send( { result: result } )
        }
      }
    },
    async ( request, reply ) => {
      const userQuery = server.knex<UserInfo>( 'userinfo' )
        .select( 'cv' ).where( { uuid: request.user.uuid } )
      const userInfo = await userQuery
        .then( ( result ) => {
          return result
        } )
        .catch( ( reason ) => {
          server.log.error( reason )
          return []
        } )
      if ( userInfo[ 0 ].cv ) {
        const jobQuery = server.knex<JobInfo>( 'jobinfo' )
          .select( 'no' ).where( { no: parseInt( request.query.no ) } ).whereRaw( "? = ANY (cvlist)", [ userInfo[ 0 ].cv ] )
        const jobInfo = await jobQuery
          .then( ( result ) => {
            return result
          } )
          .catch( ( reason ) => {
            server.log.error( reason )
            return []
          } )
        if ( !jobInfo.length ) {
          const jobQuery = server.knex<JobInfo>( 'jobinfo' )
            .update( "cvlist", server.knex.raw( "array_append(cvlist, ?)", userInfo[ 0 ].cv ) )
            .where( { no: parseInt( request.query.no ) } )
          const result = await jobQuery
            .then( () => true )
            .catch( ( reason ) => {
              server.log.error( reason )
              return false
            } )
          reply.send( { result: result } )
        } else {
          reply.send( { result: false } )
        }
      }
    }
  )

  server.get(
    "/cv-receive",
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            no: {
              type: "string",
              pattern: "^\\d+$"
            }
          },
          required: [ "no" ],
          additionalProperties: false
        } as const satisfies JSONSchema,
        response: {
          200: {
            type: 'object',
            properties: {
              result: {
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
            required: [ "result" ],
            additionalProperties: false
          } as const satisfies JSONSchema,
        }
      },
      preValidation: async ( request, reply ) => {
        const result = await server.authJWT( request )
        if ( !result ) {
          reply.send( { result: [] } )
        }
      }
    },
    async ( request, reply ) => {
      const user = request.user
      const hrQuery = server.knex<HRInfo>( 'hrinfo' )
        .select( 'corpid' ).where( { uuid: user.uuid } )
      const hrInfo = await hrQuery
        .then( ( result ) => {
          return result
        } )
        .catch( ( reason ) => {
          server.log.error( reason )
          return []
        } )
      if ( hrInfo.length ) {
        const jobQuery = server.knex<JobInfo>( 'jobinfo' )
          .select( [ "corpid", "cvlist" ] ).where( { no: parseInt( request.query.no ) } )
        const jobInfo = await jobQuery
          .then( ( result ) => {
            return result
          } )
          .catch( ( reason ) => {
            server.log.error( reason )
            return []
          } )
        if ( hrInfo[ 0 ].corpid === jobInfo[ 0 ].corpid ) {
          const userQuery = server.knex<UserInfo>( 'userinfo' )
            .select( [ "name", "cv" ] ).whereRaw( "cv = any(?)", [ jobInfo[ 0 ].cvlist ] )
          const userInfo = await userQuery
            .then( ( result ) => {
              return result
            } )
            .catch( ( reason ) => {
              server.log.error( reason )
              return []
            } )
          reply.send( { result: userInfo } )
        } else {
          reply.send( { result: [] } )
        }
      } else {
        reply.send( { result: [] } )
      }
    },
  )

  server.post(
    "/cv-remove/:state",
    {
      schema: {
        params: {
          type: 'object',
          properties: {
            state: { enum: [ "welcome", "refuse" ] }
          },
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
              pattern: datetimePattern
            },
            location: { type: "string" }
          },
          required: [ "cv", "no", "corpname" ],
          additionalProperties: false
        } as const satisfies JSONSchema,
        response: {
          200: {
            type: 'object',
            properties: {
              result: { type: "boolean" }
            },
            required: [ "result" ],
            additionalProperties: false
          } as const satisfies JSONSchema
        }
      },
      preValidation: async ( request, reply ) => {
        const result = await server.authJWT( request )
        if ( !result ) {
          reply.send( { result: result } )
        }
      }
    },
    async ( request, reply ) => {
      if ( request.user.hr ) {
        let result = false
        const userQuery = server.knex<UserInfo>( 'userinfo' )
          .select( [ "name", "uuid" ] ).where( { cv: request.body.cv } )
        const userInfo = await userQuery
          .then( ( result ) => {
            return result
          } )
          .catch( ( reason ) => {
            server.log.error( reason )
            return []
          } )
        const jobQuery = server.knex<JobInfo>( 'jobinfo' )
          .select( [ "corpid", "position" ] ).where( { no: request.body.no } )
        const jobInfo = await jobQuery
          .then( ( result ) => {
            return result
          } )
          .catch( ( reason ) => {
            server.log.error( reason )
            return []
          } )
        if ( userInfo.length && jobInfo.length ) {
          const source = Object.create( null )
          source.uuid = userInfo[ 0 ].uuid
          if (
            request.params.state === "welcome" &&
            request.body.datetime &&
            request.body.location
          ) {
            const datetime = request.body.datetime.split( "-" )
            datetime[ 0 ] += "年"
            datetime[ 1 ] += "月"
            datetime[ 2 ] += "日"
            const time = datetime.join( "" )
            const info = `
              尊敬的${ userInfo[ 0 ].name }先生, 很高兴的通知您, 您申请的${ request.body.corpname }公司的${ jobInfo[ 0 ].position }职位已通过简历筛选, 现邀请您参加面试.
              请您于${ time }携带简历到${ request.body.location }参加面试.
              `
            source.info = info
            const query = server.knex<InfoBox>( 'infobox' )
              .insert( source )
            result = await query
              .then( () => {
                return true
              } )
              .catch( ( reason ) => {
                server.log.error( reason )
                return false
              } )
          } else if ( request.params.state === "refuse" ) {
            const info = `
              尊敬的${ userInfo[ 0 ].name }先生, 很抱歉的通知您, 您申请的${ request.body.corpname }公司的${ jobInfo[ 0 ].position }职位未通过简历筛选, 请选择其他合适的职位.
              `
            source.info = info
            const query = server.knex<InfoBox>( 'infobox' )
              .insert( source )
            result = await query
              .then( () => {
                return true
              } )
              .catch( ( reason ) => {
                server.log.error( reason )
                return false
              } )
          }
        }
        if ( result ) {
          const query = server.knex<JobInfo>( 'jobinfo' )
            .update( "cvlist", server.knex.raw( "array_remove(cvlist, ?)", request.body.cv ) )
            .where( { no: request.body.no } )
          result = await query
            .then( () => true )
            .catch( ( reason ) => {
              server.log.error( reason )
              return false
            } )
        }
        reply.send( { result: result } )
      } else {
        reply.send( { result: false } )
      }
    }
  )

  server.get(
    "/infobox",
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            offset: {
              type: "string",
              pattern: "^\\d+$"
            }
          },
          required: [ "offset" ],
          additionalProperties: false
        } as const satisfies JSONSchema,
        response: {
          200: {
            type: 'object',
            properties: {
              result: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    info: { type: "string" },
                    read: { type: "boolean" },
                    time: { type: "string" },
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
            required: [ "result" ],
            additionalProperties: false
          } as const satisfies JSONSchema
        }
      },
      preValidation: async ( request, reply ) => {
        const result = await server.authJWT( request )
        if ( !result ) {
          reply.send( { result: [] } )
        }
      }
    },
    async ( request, reply ) => {
      const offset = request.query.offset
      const query = server.knex<InfoBox>( 'infobox' )
        .select( [ 'info', 'read', 'time', 'no' ] ).where( { uuid: request.user.uuid } )
        .orderBy( 'no', 'desc' ).limit( 2 ).offset( parseInt( offset ) )
      let infoList = await query
        .then( ( result ) => {
          return result
        } )
        .catch( ( reason ) => {
          server.log.error( reason )
          return []
        } )
      infoList = infoList.map( ( value ) => {
        value.time = value.time.toLocaleString()
        return value
      } )
      reply.send( {
        result: infoList
      } )
    }
  )

  server.get(
    "/infobox/:action",
    {
      schema: {
        params: {
          type: 'object',
          properties: {
            action: { enum: [ "read", "remove" ] }
          },
          required: [ "action" ],
          additionalProperties: false
        } as const satisfies JSONSchema,
        querystring: {
          type: 'object',
          properties: {
            no: {
              type: "string",
              pattern: "^\\d+$"
            }
          },
          required: [ "no" ],
          additionalProperties: false
        } as const satisfies JSONSchema,
        response: {
          200: {
            type: 'object',
            properties: {
              result: { type: "boolean" }
            },
            required: [ "result" ],
            additionalProperties: false
          } as const satisfies JSONSchema
        }
      },
      preValidation: async ( request, reply ) => {
        const result = await server.authJWT( request )
        if ( !result ) {
          reply.send( { result: result } )
        }
      }
    },
    async ( request, reply ) => {
      if ( !request.user.hr ) {
        const options = Object.create( null )
        options.uuid = request.user.uuid
        options.no = parseInt( request.query.no )
        let result = false
        if ( request.params.action === "read" ) {
          const query = server.knex<InfoBox>( 'infobox' )
            .update( { read: true } ).where( options )
          result = await query
            .then( () => {
              return true
            } )
            .catch( ( reason ) => {
              server.log.error( reason )
              return false
            } )
        }
        if ( request.params.action === "remove" ) {
          const query = server.knex<InfoBox>( 'infobox' )
            .delete().where( options )
          result = await query
            .then( () => {
              return true
            } )
            .catch( ( reason ) => {
              server.log.error( reason )
              return false
            } )
        }
        reply.send( { result: result } )
      } else {
        reply.send( { result: false } )
      }
    }
  )
} )

export default restPlugin
