import type { FastifyPluginCallback } from 'fastify'
import fp from 'fastify-plugin'
import type { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts'
import type { JSONSchema } from 'json-schema-to-ts'
import random from 'crypto-random-string'
import { eq, and, arrayContains, inArray, sql } from 'drizzle-orm'
import { userInfo, hrInfo, jobInfo, infoBox } from '../../lib/schema.ts'
const datetimePattern = String.raw`^\d{4}-\d{2}-\d{2}-\d{2}:\d{2}$`
const cv: FastifyPluginCallback = fp(
  ( f, _, done ) =>
  {
    const server = f.withTypeProvider<JsonSchemaToTsProvider>()
    server.post(
      '/cv',
      {
        schema: {
          response: {
            200: {
              type: 'object',
              properties: { result: { type: 'string' } },
              required: [ 'result' ],
              additionalProperties: false,
            } as const satisfies JSONSchema,
          },
        },
      },
      async ( request, reply ) =>
      {
        const file = await request.file()
        if ( file )
        {
          const info = await server.drizzle.query.userInfo
            .findFirst( {
              columns: { cv: true },
              where: eq( userInfo.uuid, request.user.uuid ),
            } )
            .catch( error => server.log.error( error ) )
          if ( info )
          {
            const fileName = random( { length: 10 } )
            let result = await server.saveFile( file, fileName )
              .catch( error => server.log.error( error ) )
            if ( result )
            {
              result = await server.drizzle.update( userInfo )
                .set( { cv: fileName } )
                .where( eq( userInfo.uuid, request.user.uuid ) )
                .then( () => true )
                .catch( error => server.log.error( error ) )
              await ( result
                ? server.deleteFile( 'pdf', info.cv )
                : server.deleteFile( 'pdf', fileName ) )
            }
            reply.send( { result: result ? fileName : '' } )
          }
          else
            reply.code( 401 ).send()
        }
        else
          reply.code( 400 ).send()
      },
    )
    server.get(
      '/cv-deliver',
      {
        schema: {
          querystring: {
            type: 'object',
            properties: { no: { type: 'number' } },
            required: [ 'no' ],
            additionalProperties: false,
          } as const satisfies JSONSchema,
          response: {
            200: {
              type: 'object',
              properties: { result: { type: 'boolean' } },
              required: [ 'result' ],
              additionalProperties: false,
            } as const satisfies JSONSchema,
          },
        },
      },
      async ( request, reply ) =>
      {
        const user_info = await server.drizzle.query.userInfo
          .findFirst( {
            columns: { cv: true },
            where: eq( userInfo.uuid, request.user.uuid ),
          } )
          .catch( error => server.log.error( error ) )
        if ( user_info )
        {
          const job_info = await server.drizzle.query.jobInfo
            .findFirst( {
              columns: { cvList: true },
              where: and(
                eq( jobInfo.no, request.query.no ),
                arrayContains( jobInfo.cvList, [ user_info.cv ] ),
              ),
            } )
            .catch( error => server.log.error( error ) )
          if ( job_info )
            reply.code( 400 ).send()
          else
          {
            const result = await server.drizzle.update( jobInfo )
              .set( { cvList: sql`array_append( jobinfo.cvlist, ${ user_info.cv } )` } )
              .where( eq( jobInfo.no, request.query.no ) )
              .then( () => true )
              .catch( error => server.log.error( error ) )
            reply.send( { result: !!result } )
          }
        }
        else
          reply.code( 401 ).send()
      },
    )
    server.get(
      '/cv-receive',
      {
        schema: {
          querystring: {
            type: 'object',
            properties: { no: { type: 'number' } },
            required: [ 'no' ],
            additionalProperties: false,
          } as const satisfies JSONSchema,
          response: {
            200: {
              type: 'object',
              properties: {
                list: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      cv: { type: 'string' },
                    },
                    required: [ 'name', 'cv' ],
                    additionalProperties: false,
                  },
                },
              },
              required: [ 'list' ],
              additionalProperties: false,
            } as const satisfies JSONSchema,
          },
        },
      },
      async ( request, reply ) =>
      {
        const hr_info = await server.drizzle.query.hrInfo
          .findFirst( {
            columns: { corpId: true },
            where: eq( hrInfo.uuid, request.user.uuid ),
          } )
          .catch( error => server.log.error( error ) )
        if ( hr_info )
        {
          const job_info = await server.drizzle.query.jobInfo
            .findFirst( {
              columns: { corpId: true, cvList: true },
              where: eq( jobInfo.no, request.query.no ),
            } )
            .catch( error => server.log.error( error ) )
          if ( hr_info.corpId === job_info?.corpId )
          {
            if ( Array.isArray( job_info.cvList ) && job_info.cvList.length > 0 )
            {
              const userList = await server.drizzle.query.userInfo
                .findMany( {
                  columns: { name: true, cv: true },
                  where: inArray( userInfo.cv, job_info.cvList ),
                } )
                .catch( error => server.log.error( error ) )
              reply.send( { list: userList ?? [] } )
            }
            else
              reply.send( { list: [] } )
          }
          else
            reply.code( 401 ).send()
        }
        else
          reply.code( 401 ).send()
      },
    )
    server.post(
      '/cv-remove/:state',
      {
        schema: {
          params: {
            type: 'object',
            properties: { state: { enum: [ 'welcome', 'refuse' ] } },
            required: [ 'state' ],
            additionalProperties: false,
          } as const satisfies JSONSchema,
          body: {
            type: 'object',
            properties: {
              cv: { type: 'string' },
              no: {
                type: 'number',
                minimum: 1,
              },
              corpName: { type: 'string' },
              datetime: {
                type: 'string',
                pattern: datetimePattern,
              },
              location: { type: 'string' },
            },
            required: [ 'cv', 'no', 'corpName' ],
            additionalProperties: false,
          } as const satisfies JSONSchema,
          response: {
            200: {
              type: 'object',
              properties: { result: { type: 'boolean' } },
              required: [ 'result' ],
              additionalProperties: false,
            } as const satisfies JSONSchema,
          },
        },
      },
      async ( request, reply ) =>
      {
        const hr_info = await server.drizzle.query.hrInfo
          .findFirst( {
            columns: { corpId: true },
            where: eq( hrInfo.uuid, request.user.uuid ),
          } )
          .catch( error => server.log.error( error ) )
        if ( hr_info )
        {
          const user_info = await server.drizzle.query.userInfo
            .findFirst( {
              columns: { name: true, uuid: true },
              where: eq( userInfo.cv, request.body.cv ),
            } )
            .catch( error => server.log.error( error ) )
          const job_info = await server.drizzle.query.jobInfo
            .findFirst( {
              columns: { corpId: true, position: true },
              where: eq( jobInfo.no, request.body.no ),
            } )
            .catch( error => server.log.error( error ) )
          if ( user_info && job_info && hr_info.corpId === job_info.corpId )
          {
            let info = ''
            switch ( request.params.state )
            {
              case 'welcome': {
                if ( request.body.datetime && request.body.location )
                {
                  const datetime = request.body.datetime.split( '-' )
                  datetime[ 0 ] += '年'
                  datetime[ 1 ] += '月'
                  datetime[ 2 ] += '日'
                  const time = datetime.join( '' )
                  info = `
                  尊敬的${ user_info.name }先生, 很高兴的通知您:
                  您申请的${ request.body.corpName }公司的${ job_info.position }职位已通过简历筛选, 现邀请您参加面试.
                  请您于${ time }携带简历到${ request.body.location }参加面试.
                `
                }
                break
              }
              case 'refuse': {
                info = `
                尊敬的${ user_info.name }先生, 很抱歉的通知您:
                您申请的${ request.body.corpName }公司的${ job_info.position }职位未通过简历筛选, 请选择其他合适的职位.
              `
                break
              }
            }
            if ( info )
            {
              const result = await Promise.all( [
                server.drizzle.insert( infoBox )
                  .values( { uuid: user_info.uuid, info: info } ),
                server.drizzle.update( jobInfo )
                  .set( { cvList: sql`array_remove( jobinfo.cvlist, ${ request.body.cv } )` } )
                  .where( eq( jobInfo.no, request.body.no ) ),
              ] )
                .then(
                  () =>
                  {
                    server.postgres.notify(
                      'infobox',
                      user_info.uuid,
                    )
                    return true
                  }
                )
                .catch( error => server.log.error( error ) )
              reply.send( { result: !!result } )
            }
            else
              reply.code( 400 ).send()
          }
          else
            reply.code( 401 ).send()
        }
        else
          reply.code( 401 ).send()
      },
    )
    done()
  }
)
export default cv
